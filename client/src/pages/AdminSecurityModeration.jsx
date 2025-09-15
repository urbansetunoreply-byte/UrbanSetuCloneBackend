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
      setStats({ recent: data.recent || [], activeLockouts: data.activeLockouts || 0, passwordLockouts: data.passwordLockouts || 0 });
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

            <div className="pt-3 border-t">
              <h3 className="font-semibold text-gray-800 mb-2">Admin Unlock (Password)</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={passwordEmailToUnlock} onChange={e=>setPasswordEmailToUnlock(e.target.value)} placeholder="User email" className="border rounded px-3 py-2 w-full" />
                <button onClick={handleUnlockPasswordEmail} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock by Email</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input value={passwordUserIdToUnlock} onChange={e=>setPasswordUserIdToUnlock(e.target.value)} placeholder="User ID" className="border rounded px-3 py-2 w-full" />
                <button onClick={handleUnlockPasswordUserId} className="px-3 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock by User</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input value={passwordIpToUnlock} onChange={e=>setPasswordIpToUnlock(e.target.value)} placeholder="IP address" className="border rounded px-3 py-2 w-full" />
                <button onClick={handleUnlockPasswordIp} className="px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock by IP</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input value={passwordIdentifierToUnlock} onChange={e=>setPasswordIdentifierToUnlock(e.target.value)} placeholder="Identifier (fallback)" className="border rounded px-3 py-2 w-full" />
                <button onClick={handleUnlockPasswordIdentifier} className="px-3 py-2 bg-gray-700 text-white rounded-lg flex items-center gap-2 self-end sm:self-auto"><FaUnlockAlt /> Unlock by Identifier</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Clears stored password lockout rows for matching key(s) and unlocks user if found.</p>
            </div>
          </div>
        </div>

        {/* Password Lockouts Section */}
        <div className="mt-6 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Active Password Lockouts</h2>
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
                      <td className="py-2 pr-4 space-x-2">
                        {r.email && <button onClick={() => unlockPasswordByEmailOrUser({ email: r.email })} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Unlock by Email</button>}
                        {r.userId && <button onClick={() => unlockPasswordByEmailOrUser({ userId: r.userId })} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Unlock by User</button>}
                        {r.ipAddress && <button onClick={() => unlockPasswordByIp(r.ipAddress)} className="px-2 py-1 text-xs bg-purple-600 text-white rounded">Unlock by IP</button>}
                        {r.identifier && <button onClick={() => unlockPasswordByIdentifier(r.identifier)} className="px-2 py-1 text-xs bg-gray-700 text-white rounded">Unlock by Identifier</button>}
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
  );
}

