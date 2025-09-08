import React, { useState } from 'react';
import { FaTruckMoving, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

export default function PackersMovers() {
  const { currentUser } = useSelector((state) => state.user);
  const [form, setForm] = useState({ from: '', to: '', date: '', size: '1BHK', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.date) {
      toast.error('Please fill From, To and Date');
      return;
    }
    setSubmitting(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const title = 'Packers & Movers Request';
      const requester = currentUser ? `${currentUser.username} (${currentUser.email})` : 'Unknown user';
      const lines = [
        `Requester: ${requester}`,
        `From: ${form.from}`,
        `To: ${form.to}`,
        `Date: ${form.date}`,
        `Size: ${form.size}`,
        form.notes ? `Notes: ${form.notes}` : null,
      ].filter(Boolean);
      const message = lines.join('\n');
      const res = await fetch(`${API_BASE_URL}/api/notifications/notify-admins`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
      if (res.ok) {
        toast.success('Request submitted. Admin will contact you.');
        // Store copy for user history
        if (currentUser) {
          await fetch(`${API_BASE_URL}/api/notifications/create`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id, type: 'user_request', title, message })
          });
          fetchMyRequests();
        }
      } else {
        toast.error('Failed to submit request');
      }
      setForm({ from: '', to: '', date: '', size: '1BHK', notes: '' });
    } catch (e) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const fetchMyRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${currentUser._id}`, { credentials: 'include' });
      const data = await res.json();
      const mine = Array.isArray(data) ? data.filter(n => (n.title || '').toLowerCase().includes('packers & movers request')) : [];
      setMyRequests(mine);
    } catch (_) {}
  };

  useEffect(() => { fetchMyRequests(); }, [currentUser?._id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaTruckMoving className="text-blue-600"/> Packers & Movers</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-5 space-y-4">
        <div>
          <label className="text-sm text-gray-600">From Address</label>
          <input className="w-full border rounded p-2" value={form.from} onChange={e=>setForm(f=>({...f, from:e.target.value}))} placeholder="Pickup address"/>
        </div>
        <div>
          <label className="text-sm text-gray-600">To Address</label>
          <input className="w-full border rounded p-2" value={form.to} onChange={e=>setForm(f=>({...f, to:e.target.value}))} placeholder="Drop address"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Move Date</label>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-500"/>
              <input type="date" className="w-full border rounded p-2" value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Home Size</label>
            <select className="w-full border rounded p-2" value={form.size} onChange={e=>setForm(f=>({...f, size:e.target.value}))}>
              {['1RK','1BHK','2BHK','3BHK','Villa','Office'].map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-600">Notes</label>
          <textarea className="w-full border rounded p-2" rows={3} value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} placeholder="Additional details"/>
        </div>
        <button disabled={submitting} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded hover:from-blue-700 hover:to-purple-700 disabled:opacity-50">{submitting ? 'Submitting...' : 'Request Quote'}</button>
      </form>
      <div className="mt-6 text-sm text-gray-600 flex items-center gap-2"><FaMapMarkerAlt/> Service available in major cities.</div>
      {currentUser && (
        <div className="mt-8 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">My Movers Requests</h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-600">No requests yet.</p>
          ) : (
            <ul className="divide-y">
              {myRequests.map(req => (
                <li key={req._id} className="py-2">
                  <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()}</div>
                  <pre className="text-sm whitespace-pre-wrap text-gray-800">{req.message}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

