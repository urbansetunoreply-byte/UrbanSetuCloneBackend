import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaTools, FaEnvelope, FaCheckCircle, FaTruckMoving, FaHome, FaSignInAlt, FaSignOutAlt, FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import ChecklistModal from '../components/rental/ChecklistModal';
import AdminServicesSkeleton from '../components/skeletons/AdminServicesSkeleton';
import { getCoinValue, COIN_CONFIG } from '../utils/coinUtils';

import { usePageTitle } from '../hooks/usePageTitle';
export default function AdminServices() {
  // Set page title
  usePageTitle("Service Management - Admin Panel");

  const { currentUser } = useSelector((state) => state.user);
  const [items, setItems] = useState([]);
  const [serviceFilters, setServiceFilters] = useState({ q: '', status: 'all' });
  const [movers, setMovers] = useState([]);
  const [moversFilters, setMoversFilters] = useState({ q: '', status: 'all' });
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingMovers, setLoadingMovers] = useState(true);
  const [loadingChecklists, setLoadingChecklists] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  // Move-In/Move-Out Checklists
  const [checklists, setChecklists] = useState([]);
  const [checklistFilters, setChecklistFilters] = useState({ q: '', type: 'all', status: 'all' });
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [checklistType, setChecklistType] = useState('move_in');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchServiceRequests = async () => {
    if (!currentUser) return;
    setLoadingServices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/requests/services`, { credentials: 'include' });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (_) { }
    setLoadingServices(false);
  };
  const fetchMoverRequests = async () => {
    if (!currentUser) return;
    setLoadingMovers(true);
    try {
      const mres = await fetch(`${API_BASE_URL}/api/requests/movers`, { credentials: 'include' });
      const mdata = await mres.json();
      setMovers(Array.isArray(mdata) ? mdata : []);
    } catch (_) { }
    setLoadingMovers(false);
  };

  const fetchChecklists = async () => {
    if (!currentUser) return;
    setLoadingChecklists(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rental/checklist/all`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setChecklists(data.checklists || []);
      }
    } catch (error) {
      toast.error('Failed to fetch checklists');
      console.error(error);
    }
    setLoadingChecklists(false);
  };

  useEffect(() => {
    const init = async () => {
      if (currentUser?._id) {
        await Promise.all([
          fetchServiceRequests(),
          fetchMoverRequests(),
          fetchChecklists()
        ]);
        setInitialLoading(false);
      } else {
        setInitialLoading(false);
      }
    };
    init();
  }, [currentUser?._id]);

  const filtered = useMemo(() => {
    return items.filter(n => {
      const matchQ = serviceFilters.q.trim() ? (
        (n.requesterName || '').toLowerCase().includes(serviceFilters.q.toLowerCase()) ||
        (n.requesterEmail || '').toLowerCase().includes(serviceFilters.q.toLowerCase()) ||
        (Array.isArray(n.services) ? n.services.join(', ') : '').toLowerCase().includes(serviceFilters.q.toLowerCase())
      ) : true;
      const matchStatus = serviceFilters.status === 'all' ? true : n.status === serviceFilters.status;
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
    } catch (_) { }
  };

  if (initialLoading) {
    return <AdminServicesSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FaTools className="text-purple-700" /> Service Requests</h1>
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
          <p className="text-xl font-bold text-red-600">{items.filter(i => !i.isRead).length}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Read</p>
          <p className="text-xl font-bold text-green-600">{items.filter(i => i.isRead).length}</p>
        </div>
        <div className="bg-white rounded shadow p-3 text-center">
          <p className="text-xs text-gray-500">Today</p>
          <p className="text-xl font-bold">{items.filter(i => new Date(i.createdAt).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input className="border rounded p-2 text-sm" placeholder="Search" value={serviceFilters.q} onChange={e => setServiceFilters(f => ({ ...f, q: e.target.value }))} />
        <select className="border rounded p-2 text-sm" value={serviceFilters.status} onChange={e => setServiceFilters(f => ({ ...f, status: e.target.value }))}>
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="px-3 py-2 bg-gray-100 rounded text-sm" onClick={() => setServiceFilters({ q: '', status: 'all' })}>Clear</button>
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
                      {n.coinsToRedeem > 0 && (
                        <div className="text-xs font-bold text-amber-600 flex items-center flex-wrap gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <FaCheckCircle className="text-amber-500" /> {n.coinsToRedeem} Coins
                          </div>
                          <span>(₹{getCoinValue(n.coinsToRedeem, 'INR').toFixed(0)} | ${getCoinValue(n.coinsToRedeem, 'USD').toFixed(2)} OFF)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {email && (
                          <a href={`mailto:${email}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs inline-flex items-center gap-1"><FaEnvelope /> Email</a>
                        )}
                        <select value={n.status} onChange={async (e) => { const newStatus = e.target.value; try { setItems(prev => prev.map(it => it._id === n._id ? { ...it, status: newStatus } : it)); await fetch(`${API_BASE_URL}/api/requests/services/${n._id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); } catch (_) { setItems(prev => prev.map(it => it._id === n._id ? { ...it, status: n.status } : it)); } }} className="text-xs border rounded px-2 py-1">
                          {['pending', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={async () => { if (!confirm('Delete this service request?')) return; try { const r = await fetch(`${API_BASE_URL}/api/requests/services/${n._id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { setItems(prev => prev.filter(x => x._id !== n._id)); } } catch (_) { } }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><FaTruckMoving className="text-blue-600" /> Movers Requests</h2>
          <button onClick={fetchMoverRequests} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          <input className="border rounded p-2 text-sm" placeholder="Search" value={moversFilters.q} onChange={e => setMoversFilters(f => ({ ...f, q: e.target.value }))} />
          <select className="border rounded p-2 text-sm" value={moversFilters.status} onChange={e => setMoversFilters(f => ({ ...f, status: e.target.value }))}>
            {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="px-3 py-2 bg-gray-100 rounded text-sm" onClick={() => setMoversFilters({ q: '', status: 'all' })}>Clear</button>
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
                {movers.filter(n => {
                  const matchQ = moversFilters.q.trim() ? (
                    (n.requesterName || '').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.requesterEmail || '').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.fromAddress || '').toLowerCase().includes(moversFilters.q.toLowerCase()) ||
                    (n.toAddress || '').toLowerCase().includes(moversFilters.q.toLowerCase())
                  ) : true;
                  const matchStatus = moversFilters.status === 'all' ? true : n.status === moversFilters.status;
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
                      {n.coinsToRedeem > 0 && (
                        <div className="text-xs font-bold text-amber-600 flex items-center flex-wrap gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <FaCheckCircle className="text-amber-500" /> {n.coinsToRedeem} Coins
                          </div>
                          <span>(₹{getCoinValue(n.coinsToRedeem, 'INR').toFixed(0)} | ${getCoinValue(n.coinsToRedeem, 'USD').toFixed(2)} OFF)</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {n.requesterEmail && (
                          <a href={`mailto:${n.requesterEmail}`} className="px-2 py-1 rounded bg-blue-600 text-white text-xs inline-flex items-center gap-1"><FaEnvelope /> Email</a>
                        )}
                        <select value={n.status} onChange={async (e) => { const newStatus = e.target.value; try { setMovers(prev => prev.map(it => it._id === n._id ? { ...it, status: newStatus } : it)); await fetch(`${API_BASE_URL}/api/requests/movers/${n._id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); } catch (_) { setMovers(prev => prev.map(it => it._id === n._id ? { ...it, status: n.status } : it)); } }} className="text-xs border rounded px-2 py-1">
                          {['pending', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={async () => { if (!confirm('Delete this movers request?')) return; try { const r = await fetch(`${API_BASE_URL}/api/requests/movers/${n._id}`, { method: 'DELETE', credentials: 'include' }); if (r.ok) { setMovers(prev => prev.filter(x => x._id !== n._id)); } } catch (_) { } }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Move-In/Move-Out Checklists Section */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaHome className="text-green-600" /> Move-In/Move-Out Checklists
          </h2>
          <button onClick={fetchChecklists} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Refresh</button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Manage and view all Move-In/Move-Out checklists for rental contracts. View, edit, and delete checklists.
        </p>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
          <input
            className="border rounded p-2 text-sm"
            placeholder="Search by property, tenant, landlord, contract ID"
            value={checklistFilters.q}
            onChange={(e) => setChecklistFilters(f => ({ ...f, q: e.target.value }))}
          />
          <select
            className="border rounded p-2 text-sm"
            value={checklistFilters.type}
            onChange={(e) => setChecklistFilters(f => ({ ...f, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="move_in">Move-In</option>
            <option value="move_out">Move-Out</option>
          </select>
          <select
            className="border rounded p-2 text-sm"
            value={checklistFilters.status}
            onChange={(e) => setChecklistFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="all">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
          </select>
          <button
            className="px-3 py-2 bg-gray-100 rounded text-sm"
            onClick={() => setChecklistFilters({ q: '', type: 'all', status: 'all' })}
          >
            Clear
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded shadow p-3 text-center">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{checklists.length}</p>
          </div>
          <div className="bg-white rounded shadow p-3 text-center">
            <p className="text-xs text-gray-500">Move-In</p>
            <p className="text-xl font-bold text-blue-600">{checklists.filter(c => c.type === 'move_in').length}</p>
          </div>
          <div className="bg-white rounded shadow p-3 text-center">
            <p className="text-xs text-gray-500">Move-Out</p>
            <p className="text-xl font-bold text-orange-600">{checklists.filter(c => c.type === 'move_out').length}</p>
          </div>
          <div className="bg-white rounded shadow p-3 text-center">
            <p className="text-xs text-gray-500">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{checklists.filter(c => c.status === 'pending_approval').length}</p>
          </div>
        </div>

        {loadingChecklists ? (
          <div className="text-gray-600">Loading checklists...</div>
        ) : checklists.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <FaHome className="mx-auto text-4xl text-gray-400 mb-2" />
            <p className="text-gray-600">No checklists found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-auto">
            <table className="min-w-[1000px] w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Checklist ID</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Property</th>
                  <th className="text-left px-4 py-3">Tenant</th>
                  <th className="text-left px-4 py-3">Landlord</th>
                  <th className="text-left px-4 py-3">Contract ID</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {checklists
                  .filter(checklist => {
                    const matchQ = checklistFilters.q.trim()
                      ? (
                        (checklist.listingId?.name || '').toLowerCase().includes(checklistFilters.q.toLowerCase()) ||
                        (checklist.tenantId?.username || '').toLowerCase().includes(checklistFilters.q.toLowerCase()) ||
                        (checklist.landlordId?.username || '').toLowerCase().includes(checklistFilters.q.toLowerCase()) ||
                        (checklist.contractId?.contractId || '').toLowerCase().includes(checklistFilters.q.toLowerCase()) ||
                        (checklist.checklistId || '').toLowerCase().includes(checklistFilters.q.toLowerCase())
                      )
                      : true;
                    const matchType = checklistFilters.type === 'all'
                      ? true
                      : checklist.type === checklistFilters.type;
                    const matchStatus = checklistFilters.status === 'all'
                      ? true
                      : checklist.status === checklistFilters.status;
                    return matchQ && matchType && matchStatus;
                  })
                  .map(checklist => (
                    <tr key={checklist._id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{checklist.checklistId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${checklist.type === 'move_in'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                          }`}>
                          {checklist.type === 'move_in' ? <FaSignInAlt /> : <FaSignOutAlt />}
                          {checklist.type === 'move_in' ? 'Move-In' : 'Move-Out'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{checklist.listingId?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{checklist.listingId?.address || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{checklist.tenantId?.username || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{checklist.tenantId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{checklist.landlordId?.username || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{checklist.landlordId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">{checklist.contractId?.contractId || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${checklist.status === 'approved' || checklist.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : checklist.status === 'pending_approval'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}>
                          {checklist.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(checklist.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedChecklist(checklist);
                              setChecklistType(checklist.type);
                              setShowChecklistModal(true);
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"
                            title="View/Edit Checklist"
                          >
                            <FaEye /> View
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Are you sure you want to delete this ${checklist.type === 'move_in' ? 'move-in' : 'move-out'} checklist?`)) return;
                              try {
                                const res = await fetch(`${API_BASE_URL}/api/rental/checklist/${checklist._id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  toast.success('Checklist deleted successfully');
                                  fetchChecklists();
                                } else {
                                  toast.error(data.message || 'Failed to delete checklist');
                                }
                              } catch (error) {
                                toast.error('Failed to delete checklist');
                                console.error(error);
                              }
                            }}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 flex items-center gap-1"
                            title="Delete Checklist"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Checklist Modal */}
      {showChecklistModal && selectedChecklist && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full relative">
              <ChecklistModal
                contract={{
                  _id: selectedChecklist.contractId?._id || selectedChecklist.contractId,
                  contractId: selectedChecklist.contractId?.contractId,
                  listingId: selectedChecklist.listingId,
                  tenantId: selectedChecklist.tenantId,
                  landlordId: selectedChecklist.landlordId,
                  lockedRentAmount: selectedChecklist.contractId?.lockedRentAmount
                }}
                checklist={selectedChecklist}
                checklistType={checklistType}
                onClose={() => {
                  setShowChecklistModal(false);
                  setSelectedChecklist(null);
                }}
                onUpdate={() => {
                  fetchChecklists();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

