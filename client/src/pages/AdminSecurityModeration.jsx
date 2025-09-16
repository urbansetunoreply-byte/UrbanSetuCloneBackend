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
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">Security Moderation</h1>
            <p className="text-gray-600">OTP and password lockouts, requests and admin unlocks</p>
          </div>
          {/* Removed global refresh to keep actions local to tables */}
        </div>

        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700">{error}</div>}

        {/* Two equal columns: Left = OTP Activity, Right = Password Lockouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OTP Activity Table */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800">Recent OTP Activity</h2>
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden sm:block text-right text-sm text-gray-600">
                  <span className="mr-3">Active OTP lockouts: <span className="font-semibold text-red-600">{stats.activeLockouts}</span></span>
                </div>
                <button onClick={fetchStats} className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 text-gray-800 text-sm">Refresh</button>
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
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                          title="Unlock restriction"
                        >Unlock restriction</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Password Lockouts Table */}
          <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-start justify-between mb-3 gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Active Password Lockouts</h2>
              <p className="text-sm text-gray-600 mt-1">Password lockouts: <span className="font-semibold text-red-600">{stats.passwordLockouts || 0}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchPasswordLockouts} className="px-3 py-2 bg-gray-100 border rounded-lg">Refresh</button>
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
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded"
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

