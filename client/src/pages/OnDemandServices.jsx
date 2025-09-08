import React, { useState } from 'react';
import { FaBroom, FaBolt, FaWrench, FaBug, FaTools } from 'react-icons/fa';
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
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const title = `On-Demand Services Request`;
      const requester = currentUser ? `${currentUser.username} (${currentUser.email})` : 'Unknown user';
      const bodyLines = [
        `Requester: ${requester}`,
        `Services: ${selected.join(', ')}`,
        `Preferred Date: ${details.date}`,
        `Address: ${details.address}`,
        details.notes ? `Notes: ${details.notes}` : null,
      ].filter(Boolean);
      const message = bodyLines.join('\n');
      const res = await fetch(`${API_BASE_URL}/api/notifications/notify-admins`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message })
      });
      if (res.ok) {
        toast.success('Service request submitted');
      } else {
        toast.error('Failed to submit request');
      }
      setSelected([]);
      setDetails({ date: '', address: '', notes: '' });
    } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">On-Demand Services</h1>
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
    </div>
  );
}

