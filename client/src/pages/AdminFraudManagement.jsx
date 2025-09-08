import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminFraudManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ suspiciousListings: 0, suspectedFakeReviews: 0, lastScan: null });
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [fraudRes, allListingsRes, allReviewsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/ai/fraud/stats`),
          fetch(`${API_BASE_URL}/api/listing/get?limit=10000`),
          fetch(`${API_BASE_URL}/api/review/admin/all?status=approved&limit=1000&sort=date&order=desc`, { credentials: 'include' })
        ]);
        const fraud = await fraudRes.json();
        const allListings = await allListingsRes.json();
        const allReviews = await allReviewsRes.json();
        setStats(fraud);
        // Heuristic flags in UI
        const prices = allListings.map(l => (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice).filter(Boolean);
        const mean = prices.length ? prices.reduce((a,b)=>a+b,0)/prices.length : 0;
        const variance = prices.length ? prices.reduce((a,b)=>a+Math.pow(b-mean,2),0)/prices.length : 0;
        const std = Math.sqrt(variance) || 1;
        const upper = mean + 3*std; const lower = Math.max(0, mean - 3*std);

        const flaggedListings = allListings.map(l => {
          const price = (l.offer && l.discountPrice) ? l.discountPrice : l.regularPrice;
          const reasons = [];
          if (!l.imageUrls || l.imageUrls.length === 0) reasons.push('No images');
          if (price && (price > upper || price < lower)) reasons.push('Price outlier');
          return { ...l, _fraudReasons: reasons };
        }).filter(l => l._fraudReasons.length > 0);

        const reviewMap = new Map();
        (allReviews.reviews || allReviews || []).forEach(r => {
          const t = (r.comment||'').trim().toLowerCase();
          if (!t) return; reviewMap.set(t, (reviewMap.get(t)||0)+1);
        });
        const repetitiveTexts = new Set(Array.from(reviewMap.entries()).filter(([,c])=>c>=3).map(([t])=>t));
        const flaggedReviews = (allReviews.reviews || allReviews || []).filter(r => repetitiveTexts.has((r.comment||'').trim().toLowerCase()));

        setListings(flaggedListings);
        setReviews(flaggedReviews);
      } catch (e) {
        setError('Failed to load fraud data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen py-10 px-2 md:px-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-extrabold text-blue-700 drop-shadow">Fraud Management</h3>
          <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={() => navigate('/admin')}>Back to Dashboard</button>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">Suspicious Listings</div>
                <div className="text-2xl font-bold text-blue-700">{stats.suspiciousListings}</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-600">Suspected Fake Reviews</div>
                <div className="text-2xl font-bold text-red-700">{stats.suspectedFakeReviews}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Last Scan</div>
                <div className="text-sm font-semibold text-gray-800">{stats.lastScan ? new Date(stats.lastScan).toLocaleString() : 'N/A'}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border rounded p-2">
                <option value="all">All</option>
                <option value="listings">Suspicious Listings</option>
                <option value="reviews">Suspected Fake Reviews</option>
              </select>
            </div>

            {(filter==='all' || filter==='listings') && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-800 mb-3">Suspicious Listings</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left text-sm">Name</th>
                        <th className="p-2 text-left text-sm">City</th>
                        <th className="p-2 text-left text-sm">Reasons</th>
                        <th className="p-2 text-left text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map(l => (
                        <tr key={l._id} className="border-t">
                          <td className="p-2 text-sm">{l.name}</td>
                          <td className="p-2 text-sm">{l.city}, {l.state}</td>
                          <td className="p-2 text-sm">{(l._fraudReasons||[]).join(', ')}</td>
                          <td className="p-2 text-sm flex gap-2">
                            <Link to={`/admin/listing/${l._id}`} className="px-2 py-1 bg-blue-600 text-white rounded">Open</Link>
                            <button className="px-2 py-1 bg-gray-200 rounded" onClick={() => window.open(`/admin/listing/${l._id}`, '_blank')}>New Tab</button>
                          </td>
                        </tr>
                      ))}
                      {listings.length === 0 && (
                        <tr><td className="p-3 text-sm text-gray-500" colSpan={4}>No suspicious listings</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(filter==='all' || filter==='reviews') && (
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">Suspected Fake Reviews</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left text-sm">Listing</th>
                        <th className="p-2 text-left text-sm">User</th>
                        <th className="p-2 text-left text-sm">Comment</th>
                        <th className="p-2 text-left text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(r => (
                        <tr key={r._id} className="border-t">
                          <td className="p-2 text-sm">{r.listingId?.name || r.listingId}</td>
                          <td className="p-2 text-sm">{r.userId?.email || r.userId}</td>
                          <td className="p-2 text-sm max-w-md truncate" title={r.comment}>{r.comment}</td>
                          <td className="p-2 text-sm flex gap-2">
                            <a href={`/admin/listing/${r.listingId?._id || r.listingId}`} className="px-2 py-1 bg-blue-600 text-white rounded">Open Listing</a>
                          </td>
                        </tr>
                      ))}
                      {reviews.length === 0 && (
                        <tr><td className="p-3 text-sm text-gray-500" colSpan={4}>No suspected fake reviews</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

