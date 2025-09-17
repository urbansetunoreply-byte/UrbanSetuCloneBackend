import React, { useEffect, useState } from 'react';
import { FaBroom, FaBolt, FaWrench, FaBug, FaTools, FaTruckMoving, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

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
  // Movers merge
  const [moversForm, setMoversForm] = useState({ from: '', to: '', date: '', size: '1BHK', notes: '' });
  const [moversSubmitting, setMoversSubmitting] = useState(false);
  const [myMoverRequests, setMyMoverRequests] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchMyRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/services`, { credentials: 'include' });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  const fetchMyMoverRequests = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/movers`, { credentials: 'include' });
      const data = await res.json();
      setMyMoverRequests(Array.isArray(data) ? data : []);
    } catch (_) {}
  };

  useEffect(() => { fetchMyRequests(); fetchMyMoverRequests(); }, [currentUser?._id]);

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

  const submitMovers = async (e) => {
    e.preventDefault();
    if (!moversForm.from || !moversForm.to || !moversForm.date) {
      toast.error('Please fill From, To and Date');
      return;
    }
    setMoversSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/movers`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress: moversForm.from, toAddress: moversForm.to, moveDate: moversForm.date, size: moversForm.size, notes: moversForm.notes })
      });
      if (res.ok) {
        toast.success('Movers request submitted');
        fetchMyMoverRequests();
      } else {
        toast.error('Failed to submit movers request');
      }
      setMoversForm({ from: '', to: '', date: '', size: '1BHK', notes: '' });
    } catch (e) {
      toast.error('Failed to submit movers request');
    } finally {
      setMoversSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold">On-Demand Services</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { fetchMyRequests(); fetchMyMoverRequests(); }} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {services.map(s => (
          <button key={s.key} onClick={()=>toggleService(s.key)} className={`bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:shadow-lg ${selected.includes(s.key)?'ring-2 ring-blue-500':''}`}>
            {s.icon}
            <span className="text-sm font-semibold">{s.name}</span>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow p-4 sm:p-5">
        <h2 className="text-lg font-semibold mb-4">Request Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
        <button onClick={submit} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded disabled:opacity-60">{loading?'Submitting...':'Submit Request'}</button>
      </div>

      {/* Movers section merged below with clear separation */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaTruckMoving className="text-blue-600"/> Packers & Movers</h2>
          <button onClick={fetchMyMoverRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
        <form onSubmit={submitMovers} className="bg-white rounded-xl shadow p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">From Address</label>
              <input className="w-full border rounded p-2" value={moversForm.from} onChange={e=>setMoversForm(f=>({...f, from:e.target.value}))} placeholder="Pickup address"/>
            </div>
            <div>
              <label className="text-sm text-gray-600">To Address</label>
              <input className="w-full border rounded p-2" value={moversForm.to} onChange={e=>setMoversForm(f=>({...f, to:e.target.value}))} placeholder="Drop address"/>
            </div>
            <div>
              <label className="text-sm text-gray-600">Move Date</label>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500"/>
                <input type="date" className="w-full border rounded p-2" value={moversForm.date} onChange={e=>setMoversForm(f=>({...f, date:e.target.value}))} min={new Date().toISOString().split('T')[0]} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Home Size</label>
              <select className="w-full border rounded p-2" value={moversForm.size} onChange={e=>setMoversForm(f=>({...f, size:e.target.value}))}>
                {['1RK','1BHK','2BHK','3BHK','Villa','Office'].map(s=> <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600">Notes</label>
            <textarea className="w-full border rounded p-2" rows={3} value={moversForm.notes} onChange={e=>setMoversForm(f=>({...f, notes:e.target.value}))} placeholder="Additional details"/>
          </div>
          <button disabled={moversSubmitting} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded hover:from-blue-700 hover:to-purple-700 disabled:opacity-50">{moversSubmitting ? 'Submitting...' : 'Request Quote'}</button>
        </form>
        <div className="mt-6 text-sm text-gray-600 flex items-center gap-2"><FaMapMarkerAlt/> Service available in major cities.</div>
        {currentUser && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2">My Movers Requests</h3>
            {myMoverRequests.length === 0 ? (
              <p className="text-sm text-gray-600">No requests yet.</p>
            ) : (
              <ul className="divide-y">
                {myMoverRequests.map(req => (
                  <li key={req._id} className="py-2">
                    <div className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleString()} — <span className={`px-2 py-0.5 rounded text-white text-[10px] ${req.status==='completed'?'bg-green-600':req.status==='in_progress'?'bg-blue-600':req.status==='cancelled'?'bg-gray-500':'bg-orange-500'}`}>{req.status}</span></div>
                    <div className="text-sm text-gray-800">From: {req.fromAddress}</div>
                    <div className="text-sm text-gray-800">To: {req.toAddress}</div>
                    <div className="text-sm text-gray-800">Date: {req.moveDate}</div>
                    <div className="text-sm text-gray-800">Size: {req.size}</div>
                    {req.notes && (<div className="text-sm text-gray-700">Notes: {req.notes}</div>)}
                    {req.status==='pending' && (
                      <button onClick={async()=>{ try{ await fetch(`${API_BASE_URL}/api/requests/movers/${req._id}`, { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status: 'cancelled' }) }); toast.success('Movers request cancelled'); fetchMyMoverRequests(); } catch(_){ toast.error('Failed to cancel'); } }} className="mt-2 text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {/* My Requests */}
      {currentUser && (
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow p-4">
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

