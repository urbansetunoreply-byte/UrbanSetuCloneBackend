import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaTruckMoving, FaEnvelope, FaCheckCircle, FaFilter } from 'react-icons/fa';

export default function AdminMovers() {
  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${currentUser._id}`, { credentials: 'include' });
      const data = await res.json();
      const movers = Array.isArray(data) ? data.filter(n => (n.title || '').toLowerCase().includes('packers & movers request')) : [];
      setItems(movers);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [currentUser?._id]);

  const filtered = useMemo(() => showUnreadOnly ? items.filter(i => !i.isRead) : items, [items, showUnreadOnly]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser._id })
      });
      setItems(prev => prev.map(i => i._id === id ? { ...i, isRead: true, readAt: new Date().toISOString() } : i));
    } catch (_) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FaTruckMoving className="text-blue-600"/> Movers Requests</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><FaFilter/><input type="checkbox" checked={showUnreadOnly} onChange={e=>setShowUnreadOnly(e.target.checked)} /> Unread only</label>
          <button onClick={fetchNotifications} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-600">No movers requests found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-auto">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Requester</th>
                <th className="text-left px-4 py-3">Details</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => {
                const lines = (n.message || '').split('\n');
                const requesterLine = lines.find(l => l.toLowerCase().startsWith('requester:')) || '';
                const emailMatch = requesterLine.match(/\(([^)]+)\)/);
                const email = emailMatch ? emailMatch[1] : '';
                return (
                  <tr key={n._id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{requesterLine.replace('Requester:','').trim()}</td>
                    <td className="px-4 py-3">
                      <pre className="text-xs whitespace-pre-wrap text-gray-700">{n.message}</pre>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {email && (
                          <a href={`mailto:${email}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs inline-flex items-center gap-1"><FaEnvelope/> Email</a>
                        )}
                        {!n.isRead && (
                          <button onClick={()=>markAsRead(n._id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs inline-flex items-center gap-1"><FaCheckCircle/> Mark read</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

