import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaTools, FaEnvelope, FaCheckCircle, FaTruckMoving } from 'react-icons/fa';

export default function AdminServices() {
  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [serviceFilters, setServiceFilters] = useState({ q: '', status: 'all' });
  const [movers, setMovers] = useState([]);
  const [moversFilters, setMoversFilters] = useState({ q: '', status: 'all' });
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchServiceRequests = async () => {
    if (!currentUser) return;
    setLoadingServices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/services`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (_) {}
    setLoadingServices(false);
  };
  const fetchMoverRequests = async () => {
    if (!currentUser) return;
    setLoadingMovers(true);
    try {
      const mres = await fetch(`${API_BASE_URL}/api/requests/movers`, { credentials: 'include' });
      const mdata = await mres.json();
      setMovers(Array.isArray(mdata) ? mdata : []);
    } catch (_) {}
    setLoadingMovers(false);
  };

  useEffect(() => { fetchServiceRequests(); fetchMoverRequests(); }, [currentUser?._id]);

  const filtered = useMemo(() => {
    return items.filter(n => {
      const matchQ = serviceFilters.q.trim() ? (
        (n.requesterName||'').toLowerCase().includes(serviceFilters.q.toLowerCase()) ||
        (n.requesterEmail||'').toLowerCase().includes(serviceFilters.q.toLowerCase()) ||
        (Array.isArray(n.services)? n.services.join(', '):'').toLowerCase().includes(serviceFilters.q.toLowerCase())
      ) : true;
      const matchStatus = serviceFilters.status==='all' ? true : n.status===serviceFilters.status;
      return matchQ && matchStatus;
    });
  }, [items, serviceFilters]);

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
        <h1 className="text-2xl font-bold flex items-center gap-2"><FaTools className="text-purple-700"/> Service Requests</h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchServiceRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-xl font-bold">{items.length}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Unread</p>
          <p className="text-xl font-bold text-red-600">{items.filter(i=>!i.isRead).length}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Read</p>
          <p className="text-xl font-bold text-green-600">{items.filter(i=>i.isRead).length}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Today</p>
          <p className="text-xl font-bold">{items.filter(i=>new Date(i.createdAt).toDateString()===new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input className="border rounded p-2 text-sm" placeholder="Search" value={serviceFilters.q} onChange={e=>setServiceFilters(f=>({...f,q:e.target.value}))} />
        <select className="border rounded p-2 text-sm" value={serviceFilters.status} onChange={e=>setServiceFilters(f=>({...f,status:e.target.value}))}>
          {['all','pending','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="px-3 py-2 bg-gray-100 rounded text-sm" onClick={()=>setServiceFilters({ q:'', status:'all' })}>Clear</button>
      </div>
      {loadingServices ? (
        <div className="text-gray-600">Loading...</div>
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
                const email = n.requesterEmail;
                return (
                  <tr key={n._id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{n.requesterName} ({n.requesterEmail})</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700">Services: {n.services?.join(', ')}</div>
                      <div className="text-xs text-gray-700">Preferred Date: {n.preferredDate}</div>
                      <div className="text-xs text-gray-700">Address: {n.address}</div>
                      {n.notes && (<div className="text-xs text-gray-700">Notes: {n.notes}</div>)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {email && (
                          <a href={`mailto:${email}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs inline-flex items-center gap-1"><FaEnvelope/> Email</a>
                        )}
                        <select value={n.status} onChange={async(e)=>{const newStatus=e.target.value; try{setItems(prev=>prev.map(it=>it._id===n._id?{...it,status:newStatus}:it)); await fetch(`${API_BASE_URL}/api/requests/services/${n._id}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});}catch(_){ setItems(prev=>prev.map(it=>it._id===n._id?{...it,status:n.status}:it)); }} } className="text-xs border rounded px-2 py-1">
                          {['pending','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={async()=>{ if(!confirm('Delete this service request?')) return; try{ const r= await fetch(`${API_BASE_URL}/api/requests/services/${n._id}`, { method:'DELETE', credentials:'include' }); if(r.ok){ setItems(prev=>prev.filter(x=>x._id!==n._id)); } } catch(_){} }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Movers Requests Section */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaTruckMoving className="text-blue-600"/> Movers Requests</h2>
          <button onClick={fetchMoverRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <input className="border rounded p-2 text-sm" placeholder="Search" value={moversFilters.q} onChange={e=>setMoversFilters(f=>({...f,q:e.target.value}))} />
          <select className="border rounded p-2 text-sm" value={moversFilters.status} onChange={e=>setMoversFilters(f=>({...f,status:e.target.value}))}>
            {['all','pending','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="px-3 py-2 bg-gray-100 rounded text-sm" onClick={()=>setMoversFilters({ q:'', status:'all' })}>Clear</button>
        </div>
        {loadingMovers ? (
          <div className="text-gray-600">Loading...</div>
        ) : movers.length === 0 ? (
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
                {movers.filter(n=>{
                  const matchQ = moversFilters.q.trim() ? (
                    (n.requesterName||'').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.requesterEmail||'').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.fromAddress||'').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.toAddress||'').toLowerCase().includes(moversFilters.q.toLowerCase())
                  ) : true;
                  const matchStatus = moversFilters.status==='all' ? true : n.status===moversFilters.status;
                  return matchQ && matchStatus;
                }).map(n => (
                  <tr key={n._id} className="border-t">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(n.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">{n.requesterName} ({n.requesterEmail})</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700">From: {n.fromAddress}</div>
                      <div className="text-xs text-gray-700">To: {n.toAddress}</div>
                      <div className="text-xs text-gray-700">Date: {n.moveDate}</div>
                      <div className="text-xs text-gray-700">Size: {n.size}</div>
                      {n.notes && (<div className="text-xs text-gray-700">Notes: {n.notes}</div>)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.requesterEmail && (
                          <a href={`mailto:${n.requesterEmail}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs inline-flex items-center gap-1"><FaEnvelope/> Email</a>
                        )}
                        <select value={n.status} onChange={async(e)=>{const newStatus=e.target.value; try{setMovers(prev=>prev.map(it=>it._id===n._id?{...it,status:newStatus}:it)); await fetch(`${API_BASE_URL}/api/requests/movers/${n._id}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:newStatus})});}catch(_){ setMovers(prev=>prev.map(it=>it._id===n._id?{...it,status:n.status}:it)); }} } className="text-xs border rounded px-2 py-1">
                          {['pending','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={async()=>{ if(!confirm('Delete this movers request?')) return; try{ const r= await fetch(`${API_BASE_URL}/api/requests/movers/${n._id}`, { method:'DELETE', credentials:'include' }); if(r.ok){ setMovers(prev=>prev.filter(x=>x._id!==n._id)); } } catch(_){} }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

