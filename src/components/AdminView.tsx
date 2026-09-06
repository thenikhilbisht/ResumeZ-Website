import { useAuth } from '../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';
import { 
  Shield, 
  Users, 
  FileText, 
  Sparkles, 
  Coins, 
  Plus, 
  Minus, 
  RefreshCw, 
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Copy,
  AlertCircle,
  CreditCard,
  Settings
} from 'lucide-react';
import { UserProfile, AdminAnalytics, PaymentRequest, PaymentConfig } from '../types';

interface AdminViewProps {
  currentUser: UserProfile | null;
  onRefreshUserData: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onRefreshUserData }) => {
  const { session } = useAuth();

  const [stats, setStats] = useState<AdminAnalytics | null>(null);
  const [userList, setUserList] = useState<any[]>([]);
  const [, setSettings] = useState<Record<string, any>>({});
  const [paymentList, setPaymentList] = useState<PaymentRequest[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [isVerifyingPaymentId, setIsVerifyingPaymentId] = useState<string | null>(null);
  const [selectedPaymentForReject, setSelectedPaymentForReject] = useState<PaymentRequest | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid or unverified transaction UTR reference');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Config editor state
  const [editUpiId, setEditUpiId] = useState<string>('');
  const [editMerchantName, setEditMerchantName] = useState<string>('');
  const [editAccountName, setEditAccountName] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configSavedMsg, setConfigSavedMsg] = useState<string | null>(null);

  const [, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credit adjustment modal state
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Manual Admin Refill');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustSuccess, setAdjustSuccess] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [statsRes, usersRes, settingsRes, paymentsRes, configRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/stats'), { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(getApiUrl('/api/admin/users'), { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(getApiUrl('/api/admin/settings'), { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(getApiUrl('/api/admin/payments'), { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
        fetch(getApiUrl('/api/admin/payment-config'), { headers: { 'Authorization': `Bearer ${session?.access_token}` } }),
      ]);

      if (!statsRes.ok || !usersRes.ok) {
        throw new Error('Access denied or failed to load administrative telemetry.');
      }

      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const settingsData = await settingsRes.json();
      const paymentsData = await paymentsRes.json();
      const configData = await configRes.json();

      setStats(statsData);
      setUserList(usersData.users || []);
      setSettings(settingsData.settings || {});
      setPaymentList(paymentsData.payments || []);
      if (configData.config) {
        setPaymentConfig(configData.config);
        setEditUpiId(configData.config.upi_id || '');
        setEditMerchantName(configData.config.merchant_name || '');
        setEditAccountName(configData.config.account_name || '');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error fetching admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchAdminData();
    }
  }, [currentUser]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="rounded-3xl border border-[#A94D4D]/40 bg-[#A94D4D]/15 p-8 text-center text-[#F5F1E8]">
        <Shield className="mx-auto h-12 w-12 text-[#A94D4D]" />
        <h2 className="mt-4 text-lg font-bold text-[#F5F1E8]">
          Admin Access Required
        </h2>
        <p className="mt-1 text-xs text-[#AAA6B7] max-w-md mx-auto">
          You are currently signed in as a standard candidate. Use the top navigation role switcher to toggle to Admin mode to inspect backend governance.
        </p>
      </div>
    );
  }

  const handleVerifyPayment = async (payment: PaymentRequest) => {
    setIsVerifyingPaymentId(payment.id);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(getApiUrl('/api/admin/verify-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          payment_id: payment.id,
          action: 'verify',
          notes: `Verified against Bank UPI UTR ${payment.utr_number}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify payment');

      setActionSuccessMsg(
        `Payment approved! Activated ${payment.plan_name} for ${payment.user_name} (+${payment.monthly_credits} credits added).`
      );
      await fetchAdminData();
      onRefreshUserData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsVerifyingPaymentId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPaymentForReject) return;
    setIsVerifyingPaymentId(selectedPaymentForReject.id);
    try {
      const res = await fetch(getApiUrl('/api/admin/verify-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          payment_id: selectedPaymentForReject.id,
          action: 'reject',
          rejection_reason: rejectReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject payment');

      setActionSuccessMsg(`Payment for ${selectedPaymentForReject.utr_number} marked as rejected.`);
      setSelectedPaymentForReject(null);
      await fetchAdminData();
      onRefreshUserData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsVerifyingPaymentId(null);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSavedMsg(null);
    try {
      const res = await fetch(getApiUrl('/api/admin/payment-config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          upi_id: editUpiId.trim(),
          merchant_name: editMerchantName.trim(),
          account_name: editAccountName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save config');

      setConfigSavedMsg('Payment configuration updated successfully.');
      setPaymentConfig(data.config);
      setTimeout(() => setConfigSavedMsg(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUserForAdjustment) return;

    setIsAdjusting(true);
    try {
      const res = await fetch(getApiUrl('/api/admin/adjust-credits'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          user_id: selectedUserForAdjustment.id,
          amount: adjustAmount,
          reason: adjustReason,
        }),
      });

      if (!res.ok) throw new Error('Failed to adjust credits');

      setAdjustSuccess(true);
      setTimeout(() => {
        setAdjustSuccess(false);
        setSelectedUserForAdjustment(null);
        fetchAdminData();
        onRefreshUserData();
      }, 1200);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  const pendingPaymentsCount = paymentList.filter((p) => p.status === 'pending').length;
  const filteredPayments =
    paymentFilter === 'all'
      ? paymentList
      : paymentList.filter((p) => p.status === paymentFilter);

  return (
    <div className="space-y-8 pb-16 text-[#F5F1E8]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C6A75E]/15 border border-[#C6A75E]/30 text-[#C6A75E]">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F5F1E8]">
              Admin Governance & Telemetry Control Center
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#AAA6B7]">
            Verify UPI subscription payments, audit credit balance sheets, and configure payment gateways.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-1.5 rounded-xl btn-secondary-luxury px-3.5 py-1.5 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Data
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="rounded-xl border border-[#4F9D69]/40 bg-[#4F9D69]/15 p-4 text-xs text-[#F5F1E8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#4F9D69]" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-[11px] font-bold text-[#4F9D69] hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-[#A94D4D]/40 bg-[#A94D4D]/15 p-4 text-xs text-[#F5F1E8]">
          {errorMessage}
        </div>
      )}

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#AAA6B7]">Total Registered Users</span>
              <Users className="h-4 w-4 text-[#C6A75E]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[#F5F1E8]">
              {stats.total_users}
            </p>
            <span className="text-[10px] text-[#4F9D69] font-semibold">Candidate accounts</span>
          </div>

          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#AAA6B7]">Pending Subscriptions</span>
              <Clock className="h-4 w-4 text-[#E1C77A]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[#E1C77A]">
              {pendingPaymentsCount}
            </p>
            <span className="text-[10px] text-[#AAA6B7]">Awaiting UTR verification</span>
          </div>

          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#AAA6B7]">AI Analyses Executed</span>
              <Sparkles className="h-4 w-4 text-[#E1C77A]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[#F5F1E8]">
              {stats.total_analyses}
            </p>
            <span className="text-[10px] text-[#E1C77A] font-semibold">ATS, GitHub & LeetCode</span>
          </div>

          <div className="rounded-2xl border border-[#292344] bg-[#151329] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#AAA6B7]">Credits Deducted</span>
              <Coins className="h-4 w-4 text-[#C49A4A]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[#F5F1E8]">
              {stats.total_credits_consumed}
            </p>
            <span className="text-[10px] text-[#C49A4A] font-semibold">Atomic RPC protected</span>
          </div>
        </div>
      )}

      {/* ---------------- Subscription & Payment Verification Section ---------------- */}
      <div className="rounded-3xl border border-[#C6A75E]/30 bg-[#151329] p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C6A75E]/20 border border-[#C6A75E]/40 text-[#E1C77A]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F5F1E8]">
                  Subscription Payment Verifications
                </h3>
                {pendingPaymentsCount > 0 && (
                  <span className="rounded-full bg-[#C6A75E] px-2 py-0.5 text-[10px] font-black text-[#080711] animate-pulse">
                    {pendingPaymentsCount} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-[#AAA6B7]">
                Approve or reject candidate UPI payment submissions. Plan activates and credits are added only after verification.
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-[#0E0C1B] border border-[#292344] p-1 text-xs">
            {(['all', 'pending', 'verified', 'rejected'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPaymentFilter(filter)}
                className={`rounded-lg px-2.5 py-1 font-semibold capitalize transition cursor-pointer ${
                  paymentFilter === filter
                    ? 'bg-[#C6A75E] text-[#080711]'
                    : 'text-[#AAA6B7] hover:text-[#F5F1E8]'
                }`}
              >
                {filter} {filter === 'pending' && pendingPaymentsCount > 0 ? `(${pendingPaymentsCount})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="overflow-x-auto">
          {filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#706C7C]">
              No {paymentFilter !== 'all' ? paymentFilter : ''} payment submissions recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#292344] text-[#706C7C]">
                  <th className="pb-3 font-semibold">Candidate</th>
                  <th className="pb-3 font-semibold">Plan & Amount</th>
                  <th className="pb-3 font-semibold">Monthly Credits</th>
                  <th className="pb-3 font-semibold">UTR Reference</th>
                  <th className="pb-3 font-semibold">Submitted At</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292344]">
                {filteredPayments.map((p) => {
                  const isProcessing = isVerifyingPaymentId === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-[#1B1833]/60 transition">
                      <td className="py-3">
                        <div className="font-bold text-[#F5F1E8]">{p.user_name}</div>
                        <div className="text-[11px] text-[#706C7C]">{p.user_email}</div>
                        {p.payer_phone && (
                          <div className="text-[10px] text-[#AAA6B7]">📞 {p.payer_phone}</div>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="font-semibold text-[#F5F1E8]">{p.plan_name}</div>
                        <div className="font-bold text-[#E1C77A]">₹{p.amount_inr}</div>
                      </td>
                      <td className="py-3 font-bold text-[#4F9D69]">
                        +{p.monthly_credits} Credits
                      </td>
                      <td className="py-3 font-mono font-bold text-[#F5F1E8]">
                        <span className="rounded bg-[#0E0C1B] border border-[#292344] px-2 py-1 text-[11px]">
                          {p.utr_number}
                        </span>
                        {p.payer_upi_id && (
                          <div className="text-[10px] text-[#706C7C] mt-1 font-sans">
                            UPI: {p.payer_upi_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-[#AAA6B7] text-[11px]">
                        {new Date(p.submitted_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            p.status === 'verified'
                              ? 'bg-[#4F9D69]/20 text-[#4F9D69] border border-[#4F9D69]/40'
                              : p.status === 'rejected'
                              ? 'bg-[#A94D4D]/20 text-[#A94D4D] border border-[#A94D4D]/40'
                              : 'bg-[#C6A75E]/20 text-[#E1C77A] border border-[#C6A75E]/40'
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleVerifyPayment(p)}
                              disabled={isProcessing}
                              className="rounded-lg btn-gold-primary px-3 py-1 text-xs font-bold shadow transition cursor-pointer flex items-center gap-1"
                              title="Verify UTR, activate plan and grant credits"
                            >
                              <Check className="h-3.5 w-3.5 text-[#080711]" />
                              <span className="text-[#080711]">
                                {isProcessing ? 'Verifying...' : 'Approve & Activate'}
                              </span>
                            </button>
                            <button
                              onClick={() => setSelectedPaymentForReject(p)}
                              disabled={isProcessing}
                              className="rounded-lg border border-[#A94D4D]/50 bg-[#A94D4D]/15 px-2.5 py-1 text-xs font-semibold text-[#A94D4D] hover:bg-[#A94D4D]/25 transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#706C7C]">
                            {p.status === 'verified' ? (
                              <span className="text-[#4F9D69]">Activated & Refilled</span>
                            ) : (
                              <span className="text-[#A94D4D]">Rejected</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ---------------- UPI & Payment Configuration Sub-Panel ---------------- */}
      <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#292344] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6366A8]/20 border border-[#6366A8]/40 text-[#6366A8]">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5F1E8]">
                ResumeZ UPI Payment Gateway Configuration
              </h3>
              <p className="text-xs text-[#AAA6B7]">
                Managed server-side to prevent hardcoding sensitive payment details in client bundles.
              </p>
            </div>
          </div>
        </div>

        {configSavedMsg && (
          <div className="p-3 rounded-xl bg-[#4F9D69]/20 border border-[#4F9D69]/40 text-xs text-[#4F9D69]">
            {configSavedMsg}
          </div>
        )}

        <form onSubmit={handleSavePaymentConfig} className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-[#AAA6B7]">Merchant UPI ID</label>
            <input
              type="text"
              required
              value={editUpiId}
              onChange={(e) => setEditUpiId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs font-mono font-bold text-[#E1C77A] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#AAA6B7]">Merchant Name (UPI Title)</label>
            <input
              type="text"
              required
              value={editMerchantName}
              onChange={(e) => setEditMerchantName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#AAA6B7]">Account / Beneficiary Name</label>
            <input
              type="text"
              required
              value={editAccountName}
              onChange={(e) => setEditAccountName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="rounded-xl btn-secondary-luxury px-4 py-2 text-xs font-bold transition cursor-pointer"
            >
              {isSavingConfig ? 'Saving Settings...' : 'Save Payment Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* User Management & Balance Adjustment Table */}
      <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#292344] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#F5F1E8]">
              Candidate Accounts & Credit Ledger
            </h3>
            <p className="text-xs text-[#AAA6B7]">
              Audit balance sheets and perform manual credit adjustments for user support.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#292344] text-[#706C7C]">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Role & Plan</th>
                <th className="pb-3 font-semibold">Credits Left</th>
                <th className="pb-3 font-semibold">Lifetime Used</th>
                <th className="pb-3 font-semibold">Resumes</th>
                <th className="pb-3 font-semibold">Analyses</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#292344]">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-[#1B1833]/60 transition">
                  <td className="py-3">
                    <div className="font-bold text-[#F5F1E8]">{u.full_name}</div>
                    <div className="text-[11px] text-[#706C7C]">{u.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        u.role === 'admin' ? 'bg-[#312E63] text-[#E1C77A] border border-[#6366A8]/40' : 'bg-[#0E0C1B] text-[#AAA6B7] border border-[#292344]'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-[#AAA6B7]">
                        {u.plan_name || 'Free Tier'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 font-bold text-[#E1C77A]">
                    {u.credits_remaining}
                  </td>
                  <td className="py-3 text-[#AAA6B7]">{u.lifetime_credits_used}</td>
                  <td className="py-3 text-[#AAA6B7]">{u.resumes_count}</td>
                  <td className="py-3 text-[#AAA6B7]">{u.analyses_count}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => setSelectedUserForAdjustment(u)}
                      className="rounded-lg btn-secondary-luxury px-2.5 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Adjust Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedPaymentForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080711]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-2xl text-[#F5F1E8]">
            <h3 className="text-base font-bold text-[#F5F1E8]">
              Reject Payment Submission
            </h3>
            <p className="text-xs text-[#AAA6B7] mt-1">
              UTR: <strong className="font-mono text-[#E1C77A]">{selectedPaymentForReject.utr_number}</strong> for {selectedPaymentForReject.user_name}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#AAA6B7]">
                  Reason for Rejection (Displayed to candidate)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedPaymentForReject(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#AAA6B7] hover:bg-[#1B1833] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectPayment}
                  disabled={isVerifyingPaymentId !== null}
                  className="rounded-xl bg-[#A94D4D] px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#A94D4D]/80 transition cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {selectedUserForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080711]/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-2xl text-[#F5F1E8]">
            <h3 className="text-base font-bold text-[#F5F1E8]">
              Adjust Credits for {selectedUserForAdjustment.full_name}
            </h3>
            <p className="text-xs text-[#AAA6B7] mt-1">
              Current balance: <span className="font-bold text-[#E1C77A]">{selectedUserForAdjustment.credits_remaining}</span> credits
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#AAA6B7]">
                  Credit Change (e.g. +10 or -5)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    onClick={() => setAdjustAmount((prev) => prev - 5)}
                    className="rounded-lg border border-[#292344] p-2 text-[#AAA6B7] hover:bg-[#1B1833] cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-center text-sm font-bold text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                  />
                  <button
                    onClick={() => setAdjustAmount((prev) => prev + 5)}
                    className="rounded-lg border border-[#292344] p-2 text-[#AAA6B7] hover:bg-[#1B1833] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#AAA6B7]">
                  Audit Reason (Saved to ledger)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs font-medium text-[#F5F1E8] focus:border-[#C6A75E] focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedUserForAdjustment(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#AAA6B7] hover:bg-[#1B1833] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustCredits}
                  disabled={isAdjusting}
                  className="flex items-center gap-1.5 rounded-xl btn-gold-primary px-5 py-2 text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {adjustSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-[#080711]" />
                      <span className="text-[#080711]">Updated!</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-3.5 w-3.5 text-[#080711]" />
                      <span className="text-[#080711]">Apply Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

