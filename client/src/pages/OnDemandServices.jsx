import React, { useState } from 'react';
import { FaBroom, FaBolt, FaWrench, FaBug, FaTools } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

const services = [
  { key: 'cleaning', name: 'Cleaning', icon: <FaBroom className="text-blue-600"/> },
  { key: 'electrician', name: 'Electrician', icon: <FaBolt className="text-yellow-600"/> },
  { key: 'plumber', name: 'Plumber', icon: <FaWrench className="text-indigo-600"/> },
  { key: 'pest', name: 'Pest Control', icon: <FaBug className="text-green-700"/> },
  { key: 'handyman', name: 'Handyman', icon: <FaTools className="text-purple-700"/> },
];

export default function OnDemandServices() {
  const { currentUser } = useSelector((state) => state.user);
  const [selected, setSelected] = useState([]);
  const [details, setDetails] = useState({ date: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchMyRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/services`, { credentials: 'include' });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  useEffect(() => { fetchMyRequests(); }, [currentUser?._id]);

  const toggleService = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const submit = async () => {
    if (selected.length === 0 || !details.date || !details.address) {
      toast.error('Select at least one service and fill required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/services`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: selected, preferredDate: details.date, address: details.address, notes: details.notes })
      });
      if (res.ok) {
        toast.success('Service request submitted');
        fetchMyRequests();
      } else {
        toast.error('Failed to submit request');
      }
      setSelected([]);
      setDetails({ date: '', address: '', notes: '' });
    } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">On-Demand Services</h1>
        <button onClick={fetchMyRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {services.map(s => (
          <button key={s.key} onClick={()=>toggleService(s.key)} className={`bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:shadow-lg ${selected.includes(s.key)?'ring-2 ring-blue-500':''}`}>
            {s.icon}
            <span className="text-sm font-semibold">{s.name}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">Request Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Preferred Date</label>
            <input type="date" className="w-full border rounded p-2" value={details.date} onChange={e=>setDetails(d=>({...d,date:e.target.value}))} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="text-sm text-gray-600">Service Address</label>
            <input className="w-full border rounded p-2" value={details.address} onChange={e=>setDetails(d=>({...d,address:e.target.value}))} placeholder="Address"/>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Notes</label>
            <textarea className="w-full border rounded p-2" rows={3} value={details.notes} onChange={e=>setDetails(d=>({...d,notes:e.target.value}))} placeholder="Describe the issue"/>
          </div>
        </div>
        <button onClick={submit} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded">{loading?'Submitting...':'Submit Request'}</button>
      </div>
      {/* My Requests */}
      {currentUser && (
        <div className="mt-8 bg-white rounded-xl shadow p-4">
          <h3 className="text-lg font-semibold mb-2">My Service Requests</h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-600">No requests yet.</p>
          ) : (
            <ul className="divide-y">
              {myRequests.map(req => (
                <li key={req._id} className="py-2">
                  <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()} — <span className={`px-2 py-0.5 rounded text-white text-[10px] ${req.status==='completed'?'bg-green-600':req.status==='in_progress'?'bg-blue-600':req.status==='cancelled'?'bg-gray-500':'bg-orange-500'}`}>{req.status}</span></div>
                  <div className="text-sm text-gray-800">Services: {req.services?.join(', ')}</div>
                  <div className="text-sm text-gray-800">Date: {req.preferredDate}</div>
                  <div className="text-sm text-gray-800">Address: {req.address}</div>
                  {req.notes && (<div className="text-sm text-gray-700">Notes: {req.notes}</div>)}
                  {req.status==='pending' && (
                    <button onClick={async()=>{try{await fetch(`${API_BASE_URL}/api/requests/services/${req._id}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'cancelled'})});fetchMyRequests();}catch(_){}}} className="mt-2 text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
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

