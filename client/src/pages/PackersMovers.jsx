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
      const res = await fetch(`${API_BASE_URL}/api/requests/movers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress: form.from, toAddress: form.to, moveDate: form.date, size: form.size, notes: form.notes })
      });
      if (res.ok) {
        toast.success('Request submitted. Admin will contact you.');
        fetchMyRequests();
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
      const res = await fetch(`${API_BASE_URL}/api/requests/movers`, { credentials: 'include' });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  useEffect(() => { fetchMyRequests(); }, [currentUser?._id]);

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FaTruckMoving className="text-blue-600"/> Packers & Movers</h1>
        <button onClick={fetchMyRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-4">
        <div>
          <label className="text-sm text-gray-600">From Address</label>
          <input className="w-full border rounded p-2" value={form.from} onChange={e=>setForm(f=>({...f, from:e.target.value}))} placeholder="Pickup address"/>
        </div>
        <div>
          <label className="text-sm text-gray-600">To Address</label>
          <input className="w-full border rounded p-2" value={form.to} onChange={e=>setForm(f=>({...f, to:e.target.value}))} placeholder="Drop address"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div className="mt-2"><button onClick={fetchMyRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button></div>
      {currentUser && (
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">My Movers Requests</h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-600">No requests yet.</p>
          ) : (
            <ul className="divide-y">
              {myRequests.map(req => (
                <li key={req._id} className="py-2">
                  <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()} — <span className={`px-2 py-0.5 rounded text-white text-[10px] ${req.status==='completed'?'bg-green-600':req.status==='in_progress'?'bg-blue-600':req.status==='cancelled'?'bg-gray-500':'bg-orange-500'}`}>{req.status}</span></div>
                  <div className="text-sm text-gray-800">From: {req.fromAddress}</div>
                  <div className="text-sm text-gray-800">To: {req.toAddress}</div>
                  <div className="text-sm text-gray-800">Date: {req.moveDate}</div>
                  <div className="text-sm text-gray-800">Size: {req.size}</div>
                  {req.notes && (<div className="text-sm text-gray-700">Notes: {req.notes}</div>)}
                  {req.status==='pending' && (
                    <button onClick={async()=>{try{await fetch(`${API_BASE_URL}/api/requests/movers/${req._id}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled'})});fetchMyRequests();}catch(_){}}} className="mt-2 text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

