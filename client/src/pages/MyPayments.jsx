import React, { useEffect, useState } from 'react';
import { FaDollarSign, FaCreditCard, FaDownload, FaClock, FaCheckCircle, FaTimes, FaExclamationTriangle, FaSpinner, FaMoneyBill } from 'react-icons/fa';

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', gateway: '', currency: '', q: '', fromDate: '', toDate: '' });

  useEffect(() => { fetchPayments(); }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.gateway) params.set('gateway', filters.gateway);
      if (filters.currency) params.set('currency', filters.currency);
      if (filters.q) params.set('q', filters.q);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/history?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPayments(data.payments || []);
    } catch {}
    finally { setLoading(false); }
  };

  const payNow = (payment) => {
    if (!payment || payment.status === 'completed') return;
    window.location.href = '/user/my-appointments';
  };

  const downloadReceipt = (url) => { if (url) window.open(url, '_blank'); };

  const statusBadge = (status) => {
    const cls = status === 'completed' ? 'bg-green-100 text-green-700' : status === 'failed' ? 'bg-red-100 text-red-700' : status === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700';
    return <span className={`px-2 py-1 text-[10px] rounded-full font-semibold ${cls}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-6 sm:py-10 px-2 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <FaMoneyBill className="text-green-600" />
                My Payments
              </h1>
              <p className="text-gray-600 mt-2">View and manage your payments and receipts</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input value={filters.q} onChange={(e)=>setFilters(prev=>({...prev,q:e.target.value}))} placeholder="Search payment ID or receipt" className="px-3 py-2 border rounded-lg text-sm" />
            <label className="text-sm text-gray-600">From:</label>
            <input type="date" value={filters.fromDate} onChange={(e)=>setFilters(prev=>({...prev,fromDate:e.target.value}))} className="px-3 py-2 border rounded-lg text-sm" />
            <label className="text-sm text-gray-600">To:</label>
            <input type="date" value={filters.toDate} onChange={(e)=>setFilters(prev=>({...prev,toDate:e.target.value}))} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={filters.status} onChange={(e)=>setFilters(prev=>({...prev,status:e.target.value}))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select value={filters.gateway} onChange={(e)=>setFilters(prev=>({...prev,gateway:e.target.value}))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Gateways</option>
              <option value="paypal">PayPal</option>
              <option value="razorpay">Razorpay</option>
            </select>
            <select value={filters.currency} onChange={(e)=>setFilters(prev=>({...prev,currency:e.target.value}))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">All Currencies</option>
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
            <button
              onClick={async ()=>{
                try {
                  const params = new URLSearchParams();
                  if (filters.status) params.set('status', filters.status);
                  if (filters.gateway) params.set('gateway', filters.gateway);
                  if (filters.q) params.set('q', filters.q);
                  if (filters.fromDate) params.set('fromDate', filters.fromDate);
                  if (filters.toDate) params.set('toDate', filters.toDate);
                const qs = params.toString();
                const url = `${import.meta.env.VITE_API_BASE_URL}/api/payments/export-csv${qs ? `?${qs}` : ''}`;
                  const res = await fetch(url, { credentials: 'include' });
                  if (!res.ok) {
                    console.error('Export failed', await res.text());
                    return;
                  }
                  const blob = await res.blob();
                  const objUrl = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = objUrl;
                  a.download = 'my_payments.csv';
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(objUrl);
                } catch (e) {
                  console.error('Export error', e);
                }
              }}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2"
            >
              <FaDownload /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="animate-spin text-2xl text-blue-600" />
              <span className="ml-2 text-gray-600">Loading payments...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <FaDollarSign className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Payments Found</h3>
              <p className="text-gray-500">You don't have any payments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p._id} className={`border rounded-lg p-4 ${p.status === 'completed' ? 'border-green-200 bg-green-50' : p.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{p.appointmentId?.propertyName || 'Property Payment'}</div>
                      <div className="text-xs text-gray-500">Gateway: {p.gateway?.toUpperCase()} • {p.currency === 'INR' ? '₹' : '$'}{Number(p.amount).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                      <div className="mt-1">{statusBadge(p.status)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">Payment ID: <span className="font-mono">{p.paymentId}</span></div>
                  <div className="mt-2 flex items-center gap-2">
                    {p.receiptUrl && (
                      <button onClick={()=>downloadReceipt(p.receiptUrl)} className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-xs flex items-center gap-1">
                        <FaDownload className="text-xs" /> Receipt
                      </button>
                    )}
                    {p.status !== 'completed' && (
                      <button onClick={()=>payNow(p)} className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs flex items-center gap-1">
                        <FaCreditCard className="text-xs" /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPayments;

