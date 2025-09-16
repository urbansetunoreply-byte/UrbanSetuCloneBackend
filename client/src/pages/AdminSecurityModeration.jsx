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
  const [passwordLockouts, setPasswordLockouts] = useState([]);
  const [loadingPasswords, setLoadingPasswords] = useState(false);
  const [passwordEmailToUnlock, setPasswordEmailToUnlock] = useState("");
  const [passwordUserIdToUnlock, setPasswordUserIdToUnlock] = useState("");
  const [passwordIpToUnlock, setPasswordIpToUnlock] = useState("");
  const [passwordIdentifierToUnlock, setPasswordIdentifierToUnlock] = useState("");

  const [filters, setFilters] = useState({ email: '', ip: '', lockedOnly: false, captchaOnly: false });
  const [pwdFilters, setPwdFilters] = useState({ email: '', ip: '', identifier: '', userId: '' });

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/stats`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to fetch');
      const recent = data.recent || [];
      // Use server-provided activeLockouts count directly, with computed fallback only if server returns 0
      const computedActive = recent.filter(r => r.lockoutUntil && new Date(r.lockoutUntil) > new Date()).length;
      const activeLockouts = (data.activeLockouts || 0) === 0 && computedActive > 0 ? computedActive : (data.activeLockouts || 0);
      setStats({ recent, activeLockouts, passwordLockouts: data.passwordLockouts || 0 });
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchPasswordLockouts = async () => {
    setLoadingPasswords(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password-lockouts`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to fetch password lockouts');
      setPasswordLockouts(data.items || []);
    } catch (e) {
      // show inline error but don't overwrite main error
      console.error(e);
    } finally {
      setLoadingPasswords(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPasswordLockouts();
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
      fetchPasswordLockouts();
    } catch (_) {}
  };

  const unlockPasswordByEmailOrUser = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password-lockouts/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      await res.json();
      fetchStats();
      fetchPasswordLockouts();
    } catch (e) {}
  };

  const unlockPasswordByIp = async (ip) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password-lockouts/unlock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip })
      });
      await res.json();
      fetchStats();
      fetchPasswordLockouts();
    } catch (e) {}
  };

  const unlockPasswordByIdentifier = async (identifier) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/password-lockouts/unlock-identifier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier })
      });
      await res.json();
      fetchStats();
      fetchPasswordLockouts();
    } catch (e) {}
  };

  const handleUnlockPasswordEmail = async () => {
    if (!passwordEmailToUnlock) return;
    await unlockPasswordByEmailOrUser({ email: passwordEmailToUnlock.trim() });
    setPasswordEmailToUnlock('');
  };

  const handleUnlockPasswordUserId = async () => {
    if (!passwordUserIdToUnlock) return;
    await unlockPasswordByEmailOrUser({ userId: passwordUserIdToUnlock.trim() });
    setPasswordUserIdToUnlock('');
  };

  const handleUnlockPasswordIp = async () => {
    if (!passwordIpToUnlock) return;
    await unlockPasswordByIp(passwordIpToUnlock.trim());
    setPasswordIpToUnlock('');
  };

  const handleUnlockPasswordIdentifier = async () => {
    if (!passwordIdentifierToUnlock) return;
    await unlockPasswordByIdentifier(passwordIdentifierToUnlock.trim());
    setPasswordIdentifierToUnlock('');
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

  const filteredPasswordLockouts = useMemo(() => {
    return (passwordLockouts || []).filter((r) => {
      let ok = true;
      if (ok && pwdFilters.email) ok = (r.email || '').toLowerCase().includes(pwdFilters.email.toLowerCase());
      if (ok && pwdFilters.ip) ok = (r.ipAddress || '').toLowerCase().includes(pwdFilters.ip.toLowerCase());
      if (ok && pwdFilters.identifier) ok = (r.identifier || '').toLowerCase().includes(pwdFilters.identifier.toLowerCase());
      if (ok && pwdFilters.userId) ok = String(r.userId || '').toLowerCase().includes(pwdFilters.userId.toLowerCase());
      return ok;
    });
  }, [passwordLockouts, pwdFilters]);

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'rootadmin')) {
    return <div className="p-6">Unauthorized</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Security Moderation</h1>
              <p className="text-gray-600 mt-1">Monitor and manage OTP and password lockouts, requests and admin unlocks</p>
            </div>
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 shadow-sm">{error}</div>}

        {/* Two equal columns: Left = OTP Activity, Right = Password Lockouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OTP Activity Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800">Recent OTP Activity</h2>
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden sm:block text-right text-sm text-gray-600">
                  <span className="mr-3">Active OTP lockouts: <span className="font-semibold text-red-600">{stats.activeLockouts}</span></span>
                </div>
                <button onClick={fetchStats} className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              <div className="sm:hidden w-full text-sm text-gray-600">
                <span className="mr-3">Active OTP lockouts: <span className="font-semibold text-red-600">{stats.activeLockouts}</span></span>
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
                    <th className="py-2 pr-4">Actions</th>
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
                      <td className="py-2 pr-4">
                        <button
                          onClick={async () => {
                            try {
                              if (r.email) {
                                const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-email`, {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email: r.email })
                                });
                                await res.json();
                              } else if (r.ipAddress) {
                                const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-ip`, {
                                  method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ip: r.ipAddress })
                                });
                                await res.json();
                              }
                            } catch (_) {}
                            fetchStats();
                          }}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Unlock restriction"
                        >Unlock</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Password Lockouts Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="text-lg font-semibold text-gray-800">Active Password Lockouts</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Password lockouts: <span className="font-semibold text-red-600">{stats.passwordLockouts || 0}</span></span>
              <button onClick={fetchPasswordLockouts} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input value={pwdFilters.email} onChange={e=>setPwdFilters(f=>({...f,email:e.target.value}))} placeholder="Filter by email" className="border rounded px-3 py-2 w-full" />
            <input value={pwdFilters.userId} onChange={e=>setPwdFilters(f=>({...f,userId:e.target.value}))} placeholder="Filter by User ID" className="border rounded px-3 py-2 w-full" />
            <input value={pwdFilters.ip} onChange={e=>setPwdFilters(f=>({...f,ip:e.target.value}))} placeholder="Filter by IP" className="border rounded px-3 py-2 w-full" />
            <input value={pwdFilters.identifier} onChange={e=>setPwdFilters(f=>({...f,identifier:e.target.value}))} placeholder="Filter by Identifier" className="border rounded px-3 py-2 w-full" />
          </div>
          {loadingPasswords ? (
            <div className="p-4 text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">UserId</th>
                    <th className="py-2 pr-4">IP</th>
                    <th className="py-2 pr-4">Identifier</th>
                    <th className="py-2 pr-4">Attempts</th>
                    <th className="py-2 pr-4">Locked</th>
                    <th className="py-2 pr-4">Unlock At</th>
                    <th className="py-2 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPasswordLockouts.map((r) => (
                    <tr key={r._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4">{r.email || '-'}</td>
                      <td className="py-2 pr-4">{r.userId || '-'}</td>
                      <td className="py-2 pr-4">{r.ipAddress || '-'}</td>
                      <td className="py-2 pr-4">{r.identifier || '-'}</td>
                      <td className="py-2 pr-4">{r.attempts || 0}</td>
                      <td className="py-2 pr-4">{r.lockedAt ? new Date(r.lockedAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4">{r.unlockAt ? new Date(r.unlockAt).toLocaleString() : '-'}</td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={async () => {
                            try {
                              if (r.email) {
                                await unlockPasswordByEmailOrUser({ email: r.email });
                              } else if (r.userId) {
                                await unlockPasswordByEmailOrUser({ userId: r.userId });
                              } else if (r.ipAddress) {
                                await unlockPasswordByIp(r.ipAddress);
                              } else if (r.identifier) {
                                await unlockPasswordByIdentifier(r.identifier);
                              }
                            } catch (_) {}
                          }}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          title="Unlock"
                        >Unlock</button>
                      </td>
                    </tr>
                  ))}
                  {passwordLockouts.length === 0 && (
                    <tr>
                      <td className="py-4 text-center text-gray-500" colSpan="8">No active password lockouts</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

