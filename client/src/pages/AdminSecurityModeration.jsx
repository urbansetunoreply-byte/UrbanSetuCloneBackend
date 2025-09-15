import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaUnlockAlt } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminSecurityModeration() {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ recent: [], activeLockouts: 0, passwordLockouts: 0 });
  const [emailToUnlock, setEmailToUnlock] = useState("");
  const [ipToUnlock, setIpToUnlock] = useState("");

  const [filters, setFilters] = useState({ email: '', ip: '', lockedOnly: false, captchaOnly: false });

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/stats`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to fetch');
      setStats({ recent: data.recent || [], activeLockouts: data.activeLockouts || 0, passwordLockouts: data.passwordLockouts || 0 });
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const unlockByEmail = async () => {
    if (!emailToUnlock) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailToUnlock })
      });
      await res.json();
      setEmailToUnlock('');
      fetchStats();
    } catch (_) {}
  };

  const unlockByIp = async () => {
    if (!ipToUnlock) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip: ipToUnlock })
      });
      await res.json();
      setIpToUnlock('');
      fetchStats();
    } catch (_) {}
  };

  const filtered = useMemo(() => {
    return (stats.recent || []).filter(r => {
      let ok = true;
      if (ok && filters.email) ok = (r.email||'').toLowerCase().includes(filters.email.toLowerCase());
      if (ok && filters.ip) ok = (r.ipAddress||'').toLowerCase().includes(filters.ip.toLowerCase());
      if (ok && filters.captchaOnly) ok = !!r.requiresCaptcha;
      if (ok && filters.lockedOnly) ok = r.lockoutUntil && new Date(r.lockoutUntil) > new Date();
      return ok;
    });
  }, [stats, filters]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
    return <div className="p-6">Unauthorized</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Security Moderation</h1>
            <p className="text-gray-600">OTP and password lockouts, requests and admin unlocks</p>
          </div>
          <button onClick={fetchStats} className="px-3 py-2 bg-indigo-600 text-white rounded-lg">Refresh</button>
        </div>

        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Recent OTP Activity</h2>
              <div className="text-right text-sm text-gray-600">
                <span className="mr-3">Active OTP lockouts: <span className="font-semibold text-red-600">{stats.activeLockouts}</span></span>
                <span>Password lockouts: <span className="font-semibold text-red-600">{stats.passwordLockouts||0}</span></span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input value={filters.email} onChange={e=>setFilters(f=>({...f,email:e.target.value}))} placeholder="Filter by email" className="border rounded px-3 py-2 w-full" />
              <input value={filters.ip} onChange={e=>setFilters(f=>({...f,ip:e.target.value}))} placeholder="Filter by IP" className="border rounded px-3 py-2 w-full" />
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={filters.captchaOnly} onChange={e=>setFilters(f=>({...f,captchaOnly:e.target.checked}))} /> Captcha only</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={filters.lockedOnly} onChange={e=>setFilters(f=>({...f,lockedOnly:e.target.checked}))} /> Locked only</label>
            </div>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">IP</th>
                    <th className="py-2 pr-4">Requests</th>
                    <th className="py-2 pr-4">Fails</th>
                    <th className="py-2 pr-4">Captcha</th>
                    <th className="py-2 pr-4">Lockout</th>
                    <th className="py-2 pr-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4">{r.email}</td>
                      <td className="py-2 pr-4">{r.ipAddress}</td>
                      <td className="py-2 pr-4">{r.otpRequestCount}</td>
                      <td className="py-2 pr-4">{r.failedOtpAttempts}</td>
                      <td className="py-2 pr-4">{r.requiresCaptcha ? 'Yes' : 'No'}</td>
                      <td className="py-2 pr-4">{r.lockoutUntil && new Date(r.lockoutUntil) > new Date() ? new Date(r.lockoutUntil).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Admin Unlock</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={emailToUnlock} onChange={e=>setEmailToUnlock(e.target.value)} placeholder="User email" className="border rounded px-3 py-2 w-full" />
                <button onClick={unlockByEmail} className="px-3 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock OTP</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input value={ipToUnlock} onChange={e=>setIpToUnlock(e.target.value)} placeholder="IP address" className="border rounded px-3 py-2 w-full" />
                <button onClick={unlockByIp} className="px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock OTP IP</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Manual unlock clears OTP request/failure counters, captcha flag, and lockout.</p>
              <div className="mt-3 text-sm text-gray-700">Active password lockouts: <span className="font-semibold text-red-600">{stats.passwordLockouts||0}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

