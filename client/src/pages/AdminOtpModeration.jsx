import React, { useEffect, useState } from "react";
import { FaShieldAlt, FaSync, FaUnlockAlt, FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminOtpModeration() {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ recent: [], activeLockouts: 0 });
  const [emailToUnlock, setEmailToUnlock] = useState("");
  const [ipToUnlock, setIpToUnlock] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/stats`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Failed to fetch');
      setStats({ recent: data.recent || [], activeLockouts: data.activeLockouts || 0 });
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const unlockByEmail = async () => {
    setError(""); setSuccess("");
    if (!emailToUnlock.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailToUnlock.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Unlock failed');
      setSuccess('Unlocked successfully');
      setEmailToUnlock("");
      fetchStats();
    } catch (e) { setError(e.message || 'Unlock failed'); }
  };

  const unlockByIp = async () => {
    setError(""); setSuccess("");
    if (!ipToUnlock.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/otp/unlock-ip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ip: ipToUnlock.trim() })
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || 'Unlock failed');
      setSuccess('Unlocked successfully');
      setIpToUnlock("");
      fetchStats();
    } catch (e) { setError(e.message || 'Unlock failed'); }
  };

  const filtered = stats.recent.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.email || '').toLowerCase().includes(q) ||
      (r.ipAddress || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow">
              <FaShieldAlt className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-700 to-blue-700 bg-clip-text text-transparent">OTP Moderation</h1>
              <p className="text-gray-600">Lockouts, requests and admin unlocks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchStats} className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 text-gray-800 flex items-center gap-2"><FaSync /> Refresh</button>
            <div className="ml-auto flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <FaSearch className="text-gray-500" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search email or IP" className="bg-transparent outline-none text-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Recent OTP Activity</h2>
              <span className="text-sm text-gray-600">Active lockouts: <span className="font-semibold text-red-600">{stats.activeLockouts}</span></span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">IP</th>
                      <th className="py-2 pr-4">Req</th>
                      <th className="py-2 pr-4">Fails</th>
                      <th className="py-2 pr-4">Captcha</th>
                      <th className="py-2 pr-4">Lockout</th>
                      <th className="py-2 pr-4">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r._id} className="border-t">
                        <td className="py-2 pr-4">{r.email}</td>
                        <td className="py-2 pr-4">{r.ipAddress}</td>
                        <td className="py-2 pr-4">{r.otpRequestCount}</td>
                        <td className="py-2 pr-4">{r.failedOtpAttempts}</td>
                        <td className="py-2 pr-4">{r.requiresCaptcha ? 'Yes' : 'No'}</td>
                        <td className="py-2 pr-4">{r.lockoutUntil && new Date(r.lockoutUntil) > new Date() ? new Date(r.lockoutUntil).toLocaleString() : '-'}</td>
                        <td className="py-2 pr-4">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan="7" className="py-4 text-center text-gray-500">No records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Unlock</h3>
            {error && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
            {success && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{success}</div>}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700">Email</label>
                <div className="flex gap-2 mt-1">
                  <input value={emailToUnlock} onChange={e=>setEmailToUnlock(e.target.value)} placeholder="user@example.com" className="flex-1 border rounded-lg px-3 py-2" />
                  <button onClick={unlockByEmail} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><FaUnlockAlt /> Unlock</button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700">IP Address</label>
                <div className="flex gap-2 mt-1">
                  <input value={ipToUnlock} onChange={e=>setIpToUnlock(e.target.value)} placeholder="192.168.0.1" className="flex-1 border rounded-lg px-3 py-2" />
                  <button onClick={unlockByIp} className="px-3 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2"><FaUnlockAlt /> Unlock</button>
                </div>
              </div>
              <p className="text-xs text-gray-500">Manual unlock clears request/failure counters, captcha flag, and lockout.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

