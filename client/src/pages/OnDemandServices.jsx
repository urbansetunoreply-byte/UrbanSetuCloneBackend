import React, { useState } from 'react';
import { FaBroom, FaBolt, FaWrench, FaBug, FaTools } from 'react-icons/fa';
import { toast } from 'react-toastify';

const services = [
  { key: 'cleaning', name: 'Cleaning', icon: <FaBroom className="text-blue-600"/> },
  { key: 'electrician', name: 'Electrician', icon: <FaBolt className="text-yellow-600"/> },
  { key: 'plumber', name: 'Plumber', icon: <FaWrench className="text-indigo-600"/> },
  { key: 'pest', name: 'Pest Control', icon: <FaBug className="text-green-700"/> },
  { key: 'handyman', name: 'Handyman', icon: <FaTools className="text-purple-700"/> },
];

export default function OnDemandServices() {
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState({ date: '', address: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!selected || !details.date || !details.address) {
      toast.error('Select a service and fill required fields');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      toast.success('Service request submitted');
      setSelected(null);
      setDetails({ date: '', address: '', notes: '' });
    } catch (e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">On-Demand Services</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {services.map(s => (
          <button key={s.key} onClick={()=>setSelected(s.key)} className={`bg-white rounded-xl shadow p-4 flex flex-col items-center gap-2 hover:shadow-lg ${selected===s.key?'ring-2 ring-blue-500':''}`}>
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
            <input type="date" className="w-full border rounded p-2" value={details.date} onChange={e=>setDetails(d=>({...d,date:e.target.value}))}/>
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

