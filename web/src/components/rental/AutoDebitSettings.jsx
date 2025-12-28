import React, { useState } from "react";
import { FaCog, FaToggleOn, FaToggleOff, FaCreditCard, FaCalendarAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AutoDebitSettings({ wallet, contract, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    enabled: wallet?.autoDebitEnabled || false,
    method: wallet?.autoDebitMethod || 'razorpay',
    day: wallet?.autoDebitDay || contract?.dueDate || 1,
    paymentMethodToken: wallet?.paymentMethodToken || ''
  });

  const handleToggle = async () => {
    if (!settings.enabled && !settings.paymentMethodToken) {
      toast.warning("Please add a payment method first before enabling auto-debit.");
      return;
    }

    try {
      setLoading(true);
      const newEnabled = !settings.enabled;

      const res = await fetch(`${API_BASE_URL}/api/rental/wallet/${contract.contractId}/auto-debit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: newEnabled,
          method: settings.method,
          day: settings.day,
          paymentMethodToken: settings.paymentMethodToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update auto-debit settings");
      }

      setSettings(prev => ({ ...prev, enabled: newEnabled }));

      if (onUpdate && data.wallet) {
        onUpdate(data.wallet);
      }

      toast.success(`Auto-debit ${newEnabled ? 'enabled' : 'disabled'} successfully.`);
    } catch (error) {
      console.error("Error updating auto-debit:", error);
      toast.error(error.message || "Failed to update auto-debit settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (settings.enabled && !settings.paymentMethodToken) {
      toast.warning("Payment method is required when auto-debit is enabled.");
      return;
    }

    if (settings.day < 1 || settings.day > 31) {
      toast.error("Auto-debit day must be between 1 and 31.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/rental/wallet/${contract.contractId}/auto-debit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          enabled: settings.enabled,
          method: settings.method,
          day: settings.day,
          paymentMethodToken: settings.paymentMethodToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update auto-debit settings");
      }

      if (onUpdate && data.wallet) {
        onUpdate(data.wallet);
      }

      toast.success("Auto-debit settings updated successfully.");
    } catch (error) {
      console.error("Error updating auto-debit:", error);
      toast.error(error.message || "Failed to update auto-debit settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
        <FaCog className="inline mr-2" />
        Auto-Debit Settings
      </h2>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="text-blue-600 dark:text-blue-400 text-xl mt-1" />
          <div>
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">About Auto-Debit</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Enable auto-debit to automatically pay your rent on the specified day of each month.
              You will receive reminders 3 days and 1 day before the payment date.
              You can disable auto-debit at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Debit Toggle */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1">Enable Auto-Debit</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Automatically pay rent on the specified day of each month
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={loading}
            className="text-4xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {settings.enabled ? (
              <FaToggleOn className="text-green-600 dark:text-green-400" />
            ) : (
              <FaToggleOff className="text-gray-400 dark:text-gray-500" />
            )}
          </button>
        </div>

        {settings.enabled && (
          <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
            <div className="space-y-4">
              {/* Payment Method */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  <FaCreditCard className="inline mr-2" />
                  Payment Method
                </label>
                <select
                  value={settings.method}
                  onChange={(e) => setSettings(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="razorpay">Razorpay (India)</option>
                  <option value="paypal">PayPal (International)</option>
                  <option value="bank_account">Bank Account</option>
                  <option value="upi">UPI</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select your preferred payment method for auto-debit
                </p>
              </div>

              {/* Auto-Debit Day */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Auto-Debit Day (Day of Month)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.day}
                  onChange={(e) => setSettings(prev => ({ ...prev, day: parseInt(e.target.value) || 1 }))}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter the day of the month (1-31) when rent should be automatically debited.
                  Default is day {contract?.dueDate || 1} (same as contract due date).
                </p>
              </div>

              {/* Payment Method Token (for future use - stored securely) */}
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <FaExclamationTriangle className="inline mr-2" />
                  <strong>Note:</strong> Payment method tokenization and secure storage will be implemented
                  in the payment gateway integration. For now, auto-debit uses your default payment method.
                </p>
              </div>

              {/* Save Button */}
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Current Status */}
      <div className={`rounded-lg p-4 ${settings.enabled ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'}`}>
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <>
              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">Auto-Debit Active</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Rent will be automatically debited on day {settings.day} of each month via {settings.method}
                </p>
              </div>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="text-gray-400 dark:text-gray-500 text-xl" />
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">Auto-Debit Disabled</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You will need to manually pay rent each month
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

