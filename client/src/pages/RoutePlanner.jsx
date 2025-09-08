import React, { useState } from 'react';
import { FaRoute, FaPlus, FaTrash, FaClock } from 'react-icons/fa';

export default function RoutePlanner() {
  const [stops, setStops] = useState([{ address: '' }]);
  const [optimizing, setOptimizing] = useState(false);
  const [plan, setPlan] = useState([]);

  const addStop = () => setStops(s => [...s, { address: '' }]);
  const removeStop = (i) => setStops(s => s.filter((_, idx) => idx !== i));
  const updateStop = (i, value) => setStops(s => s.map((st, idx) => idx===i ? { address: value } : st));

  // Simple heuristic: keep order, compute fake ETA 20 mins apart
  const optimize = async () => {
    const valid = stops.map(s => s.address.trim()).filter(Boolean);
    if (valid.length < 2) { alert('Add at least 2 addresses'); return; }
    setOptimizing(true);
    await new Promise(r => setTimeout(r, 500));
    const now = new Date();
    const planOut = valid.map((addr, idx) => ({ addr, eta: new Date(now.getTime() + idx * 20 * 60000) }));
    setPlan(planOut);
    setOptimizing(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FaRoute className="text-green-600"/> Property Visit Route Planner</h1>
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        {stops.map((s, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 border rounded p-2" value={s.address} onChange={e=>updateStop(i, e.target.value)} placeholder={`Stop ${i+1} address`}/>
            {stops.length > 1 && (
              <button onClick={()=>removeStop(i)} className="px-3 rounded bg-red-100 text-red-600"><FaTrash/></button>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={addStop} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><FaPlus/> Add Stop</button>
          <button onClick={optimize} disabled={optimizing} className="px-4 py-2 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white">{optimizing?'Planning...':'Plan Route'}</button>
        </div>
      </div>
      {plan.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-3">Visit Itinerary</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {plan.map((p, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <FaClock className="text-gray-500"/> <span className="font-medium">{p.addr}</span> — ETA {p.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-500 mt-3">Note: Demo itinerary. Integrate with Google Maps Directions API for real routing.</p>
        </div>
      )}
    </div>
  );
}

