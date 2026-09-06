import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  CreditCard, 
  QrCode, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Zap,
  Lock,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import QRCode from 'qrcode';
import { UserProfile, UsageBalance, Plan, PaymentConfig, PaymentRequest } from '../types';
import { getAuthHeaders, getApiUrl } from '../lib/api';
import { DEFAULT_PLANS } from '../data/sampleData';
import { useAuth } from '../contexts/AuthContext';

interface CheckoutPaymentViewProps {
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  user: UserProfile | null;
  balance: UsageBalance | null;
  onBack: () => void;
  onPaymentSubmitted?: () => void;
}

export const CheckoutPaymentView: React.FC<CheckoutPaymentViewProps> = ({
  selectedPlanId,
  onSelectPlan,
  user,
  balance,
  onBack,
  onPaymentSubmitted,
}) => {
  const { session, refreshProfile } = useAuth();

  // Find plan details (default to Pro if not found or free)
  const availablePaidPlans = DEFAULT_PLANS.filter((p) => p.price_inr > 0);
  const currentPlan = availablePaidPlans.find((p) => p.id === selectedPlanId) || availablePaidPlans[0];

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    upi_id: 'resumez@icici',
    merchant_name: 'ResumeZ AI Technologies',
    account_name: 'ResumeZ Careers Ltd',
    qr_instruction: 'Scan using Google Pay, PhonePe, Paytm, BHIM, or any UPI app.',
    support_email: 'billing@resumez.ai',
    support_phone: '+91 98765 43210',
    is_active: true,
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [payerUpiId, setPayerUpiId] = useState<string>('');
  const [payerPhone, setPayerPhone] = useState<string>(user?.phone || '');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedPayment, setSubmittedPayment] = useState<PaymentRequest | null>(null);
  const [myPastPayments, setMyPastPayments] = useState<PaymentRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Fetch backend payment config
  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/api/payment/config'));
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.config) {
            setPaymentConfig(data.config);
          }
        } catch {
          // ignore parsing error if response is not json
        }
      }
    } catch (err) {
      console.warn('Could not fetch payment config:', err);
    }
  };

  // Fetch user's existing payment requests
  const fetchMyPayments = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(getApiUrl('/api/payment/my-requests'), {
        headers: getAuthHeaders(session?.access_token),
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.requests) {
            setMyPastPayments(data.requests || []);
            
            // Check if there is an active pending request for current plan
            const pendingForThis = (data.requests || []).find(
              (p: PaymentRequest) => p.plan_id === currentPlan.id && p.status === 'pending'
            );
            if (pendingForThis) {
              setSubmittedPayment(pendingForThis);
            }
          }
        } catch {
          // ignore non-json response
        }
      }
    } catch (err) {
      console.warn('Could not load payments history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPaymentConfig();
    fetchMyPayments();
  }, [session]);

  // Generate UPI QR Code
  useEffect(() => {
    if (!paymentConfig?.upi_id || !currentPlan) return;

    // Standard NPCI UPI URI string
    const upiUri = `upi://pay?pa=${encodeURIComponent(paymentConfig.upi_id)}&pn=${encodeURIComponent(
      paymentConfig.merchant_name
    )}&am=${encodeURIComponent(currentPlan.price_inr.toFixed(2))}&cu=INR&tn=${encodeURIComponent(
      `ResumeZ ${currentPlan.name} Subscription`
    )}`;

    QRCode.toDataURL(upiUri, {
      width: 280,
      margin: 2,
      color: {
        dark: '#080711',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [paymentConfig, currentPlan]);

  const handleCopy = (text: string, type: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setSubmitError('Please enter a valid Transaction ID / UTR number (at least 6 alphanumeric characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(getApiUrl('/api/payment/submit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(session?.access_token),
        },
        body: JSON.stringify({
          plan_id: currentPlan.id,
          plan_name: currentPlan.name,
          amount_inr: currentPlan.price_inr,
          monthly_credits: currentPlan.monthly_credits,
          utr_number: cleanUtr,
          payer_upi_id: payerUpiId.trim(),
          payer_phone: payerPhone.trim() || user?.phone,
          payment_method: 'upi_qr',
        }),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned an unexpected response. Please try again.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit payment request');
      }

      setSubmittedPayment(data.payment);
      setUtrNumber('');
      setPayerUpiId('');
      await refreshProfile();
      fetchMyPayments();
      if (onPaymentSubmitted) {
        onPaymentSubmitted();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error communicating with server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if current user has an existing pending verification for this plan
  const activePendingRequest = myPastPayments.find(
    (p) => p.plan_id === currentPlan.id && p.status === 'pending'
  );

  return (
    <div className="space-y-8 pb-16 text-[#F5F1E8]">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292344] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#292344] bg-[#151329] text-[#AAA6B7] hover:border-[#C6A75E]/50 hover:text-[#F5F1E8] transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#C6A75E]/20 border border-[#C6A75E]/40 px-2 py-0.5 text-[10px] font-bold text-[#E1C77A] uppercase tracking-wider">
                Dedicated Checkout
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F1E8]">
                Upgrade to {currentPlan.name}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-[#AAA6B7]">
              Secure UPI payment with automatic verification and instant monthly AI credit allocation.
            </p>
          </div>
        </div>

        {/* Plan Switcher Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-[#292344] bg-[#0E0C1B] p-1">
          {availablePaidPlans.map((p) => {
            const isSelected = p.id === currentPlan.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPlan(p.id);
                  setSubmitError(null);
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#C6A75E] text-[#080711] shadow-sm font-bold'
                    : 'text-[#AAA6B7] hover:text-[#F5F1E8] hover:bg-[#151329]'
                }`}
              >
                <span>{p.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80">₹{p.price_inr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Order Summary & User Info, Right Payment QR & UTR form */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Plan Details & User Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Plan Highlight Card */}
          <div className="rounded-3xl border border-[#C6A75E]/40 bg-[#151329] p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-32 w-32 bg-[#C6A75E]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E1C77A]">
                  Selected Plan
                </span>
                <h2 className="text-xl font-extrabold text-[#F5F1E8] mt-0.5">
                  {currentPlan.name}
                </h2>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C6A75E]/20 border border-[#C6A75E]/40 text-[#E1C77A]">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            {/* Price Metric */}
            <div className="mt-5 rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-[#AAA6B7]">Subscription Price</span>
                <div className="mt-0.5 text-3xl font-black text-[#F5F1E8]">
                  ₹{currentPlan.price_inr}
                  <span className="text-xs font-normal text-[#706C7C]"> / month</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#706C7C]">Monthly AI Quota</span>
                <div className="mt-0.5 text-xl font-bold text-[#E1C77A]">
                  {currentPlan.monthly_credits} Credits
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="mt-5 space-y-2">
              <span className="text-[11px] font-semibold text-[#AAA6B7] uppercase tracking-wider">
                Plan Inclusions
              </span>
              <ul className="space-y-2 text-xs text-[#AAA6B7]">
                {currentPlan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4F9D69] mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Security Guarantee Pill */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#0E0C1B] border border-[#292344] p-3 text-[11px] text-[#AAA6B7]">
              <Lock className="h-4 w-4 text-[#C6A75E] shrink-0" />
              <span>
                Atomic credit settlement. Credits are automatically allocated to your balance upon verification.
              </span>
            </div>
          </div>

          {/* User Account Details */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C6A75E]" />
              Candidate Account Details
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-[#292344] pb-2">
                <span className="text-[#AAA6B7]">Full Name:</span>
                <span className="font-semibold text-[#F5F1E8]">{user?.full_name || 'Candidate User'}</span>
              </div>
              <div className="flex justify-between border-b border-[#292344] pb-2">
                <span className="text-[#AAA6B7]">Email (Read-only):</span>
                <span className="font-semibold text-[#F5F1E8]">{user?.email || session?.user?.email}</span>
              </div>
              <div className="flex justify-between border-b border-[#292344] pb-2">
                <span className="text-[#AAA6B7]">Phone:</span>
                <span className="font-semibold text-[#F5F1E8]">
                  {user?.phone || 'Not provided in profile'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#292344] pb-2">
                <span className="text-[#AAA6B7]">Current Active Balance:</span>
                <span className="font-bold text-[#E1C77A]">
                  {balance?.credits_remaining ?? 0} Credits
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#AAA6B7]">Current Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  user?.subscription_status === 'active' 
                    ? 'bg-[#4F9D69]/20 text-[#4F9D69] border border-[#4F9D69]/30' 
                    : user?.subscription_status === 'pending'
                    ? 'bg-[#C6A75E]/20 text-[#E1C77A] border border-[#C6A75E]/30'
                    : 'bg-[#0E0C1B] text-[#AAA6B7] border border-[#292344]'
                }`}>
                  {user?.subscription_status === 'active' 
                    ? `Active (${user.plan_name || 'Pro'})` 
                    : user?.subscription_status === 'pending'
                    ? `Pending Approval (${user.pending_plan_name || 'Subscription'})`
                    : 'Free Starter Tier'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: UPI QR Code, Instructions & UTR Submission (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Payment Status Notification (if pending or just submitted) */}
          {(submittedPayment || activePendingRequest) && (
            <div className="rounded-3xl border border-[#C6A75E] bg-[#1D1938] p-6 shadow-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#C6A75E] text-[#080711]">
                  <Clock className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F1E8]">
                    Payment submitted successfully.
                  </h3>
                  <p className="text-xs text-[#E1C77A]">
                    Your subscription will be activated after payment verification.
                  </p>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-[#0E0C1B] border border-[#292344] p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#AAA6B7]">Transaction UTR:</span>
                  <span className="font-mono font-bold text-[#F5F1E8]">
                    {(submittedPayment || activePendingRequest)?.utr_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B7]">Plan Requested:</span>
                  <span className="font-semibold text-[#F5F1E8]">
                    {(submittedPayment || activePendingRequest)?.plan_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B7]">Amount Paid:</span>
                  <span className="font-bold text-[#E1C77A]">
                    ₹{(submittedPayment || activePendingRequest)?.amount_inr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B7]">Status:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C6A75E]/20 text-[#E1C77A] border border-[#C6A75E]/30 uppercase">
                    Pending Admin Verification
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#AAA6B7]">Submitted At:</span>
                  <span className="text-[#706C7C]">
                    {new Date((submittedPayment || activePendingRequest)?.submitted_at || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#AAA6B7] leading-relaxed">
                Note: In accordance with security protocols, the plan is <strong>not shown as active</strong> until your UTR is verified by an administrator. Upon verification, your plan activates automatically and +{currentPlan.monthly_credits} monthly credits will be added to your balance.
              </p>
            </div>
          )}

          {/* Dedicated UPI / QR Section */}
          <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#292344] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C6A75E]/20 border border-[#C6A75E]/40 text-[#E1C77A]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F5F1E8]">
                    UPI & QR Payment Gateway
                  </h3>
                  <p className="text-xs text-[#AAA6B7]">
                    Zero gateway convenience fee. Instant direct settlement via UPI.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[#4F9D69]/20 border border-[#4F9D69]/30 px-2.5 py-1 text-[10px] font-bold text-[#4F9D69]">
                Live UPI Network
              </span>
            </div>

            {/* QR Code and Quick Details Box */}
            <div className="grid gap-6 sm:grid-cols-2 items-center bg-[#0E0C1B] rounded-2xl border border-[#292344] p-5">
              {/* QR Canvas / Image */}
              <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-[#C6A75E]/30 shadow-inner w-full max-w-[240px] min-h-[268px] mx-auto">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="ResumeZ UPI QR Code"
                    width={208}
                    height={208}
                    className="h-52 w-52 object-contain rounded-lg aspect-square"
                  />
                ) : (
                  <div className="h-52 w-52 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#C6A75E]" />
                    <span>Generating UPI QR...</span>
                  </div>
                )}
                <div className="mt-2 text-center h-4 flex items-center justify-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#080711]">
                    Scan to Pay with Any UPI App
                  </span>
                </div>
              </div>

              {/* Copyable Details */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#AAA6B7] uppercase tracking-wider">
                    Official Merchant UPI ID
                  </label>
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-[#292344] bg-[#151329] px-3 py-2 text-xs font-mono text-[#F5F1E8]">
                    <span className="font-bold text-[#E1C77A] truncate">
                      {paymentConfig.upi_id}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentConfig.upi_id, 'upi')}
                      className="ml-2 flex items-center gap-1 rounded-lg bg-[#0E0C1B] border border-[#292344] px-2 py-1 text-[10px] font-semibold text-[#AAA6B7] hover:text-[#F5F1E8] transition cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="h-3 w-3 text-[#4F9D69]" />
                          <span className="text-[#4F9D69]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#AAA6B7] uppercase tracking-wider">
                    Payable Amount
                  </label>
                  <div className="mt-1 flex items-center justify-between rounded-xl border border-[#292344] bg-[#151329] px-3 py-2 text-xs font-mono text-[#F5F1E8]">
                    <span className="text-base font-extrabold text-[#F5F1E8]">
                      ₹{currentPlan.price_inr}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentPlan.price_inr.toString(), 'amount')}
                      className="ml-2 flex items-center gap-1 rounded-lg bg-[#0E0C1B] border border-[#292344] px-2 py-1 text-[10px] font-semibold text-[#AAA6B7] hover:text-[#F5F1E8] transition cursor-pointer"
                    >
                      {copiedAmount ? (
                        <>
                          <Check className="h-3 w-3 text-[#4F9D69]" />
                          <span className="text-[#4F9D69]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#706C7C] space-y-1">
                  <div>Beneficiary: <strong className="text-[#AAA6B7]">{paymentConfig.account_name}</strong></div>
                  <div>Support Contact: <strong className="text-[#AAA6B7]">{paymentConfig.support_email}</strong></div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="rounded-2xl border border-[#292344] bg-[#0E0C1B] p-4 text-xs space-y-2">
              <span className="font-bold text-[#E1C77A] flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" />
                Step-by-Step Payment Instructions
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-[#AAA6B7] text-[11px] leading-relaxed">
                <li>
                  Open any UPI application on your smartphone (<strong className="text-[#F5F1E8]">Google Pay, PhonePe, Paytm, BHIM, CRED</strong>).
                </li>
                <li>
                  Scan the QR code displayed above or transfer ₹{currentPlan.price_inr} to the UPI ID <code className="text-[#E1C77A] font-mono">{paymentConfig.upi_id}</code>.
                </li>
                <li>
                  Confirm the payment recipient is <strong>{paymentConfig.account_name}</strong> and complete the transaction.
                </li>
                <li>
                  Once payment is successful, locate the <strong className="text-[#F5F1E8]">12-digit UPI Reference / UTR Number</strong> in your transaction receipt.
                </li>
                <li>
                  Enter your 12-digit UTR in the field below and click <strong>"Submit Payment"</strong>.
                </li>
              </ol>
            </div>

            {/* UTR Submission Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2 border-t border-[#292344]">
              <div>
                <label className="block text-xs font-bold text-[#F5F1E8]">
                  Transaction ID / UTR Number <span className="text-[#E1C77A]">*</span>
                </label>
                <p className="text-[11px] text-[#AAA6B7] mt-0.5">
                  12-digit numeric reference generated by your bank (e.g., 424212345678).
                </p>
                <input
                  type="text"
                  required
                  placeholder="Enter 12-digit UTR number"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                  maxLength={30}
                  className="mt-1.5 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-4 py-2.5 text-sm font-mono font-bold text-[#F5F1E8] placeholder-[#706C7C] focus:border-[#C6A75E] focus:outline-none tracking-wider"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B7]">
                    Your UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@okhdfcbank"
                    value={payerUpiId}
                    onChange={(e) => setPayerUpiId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs text-[#F5F1E8] placeholder-[#706C7C] focus:border-[#C6A75E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#AAA6B7]">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#292344] bg-[#0E0C1B] px-3 py-2 text-xs text-[#F5F1E8] placeholder-[#706C7C] focus:border-[#C6A75E] focus:outline-none"
                  />
                </div>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-xl bg-[#A94D4D]/20 border border-[#A94D4D]/40 p-3 text-xs text-[#F5F1E8]">
                  <AlertCircle className="h-4 w-4 text-[#A94D4D] shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Payment Button */}
              <button
                type="submit"
                disabled={isSubmitting || !!activePendingRequest}
                className={`w-full rounded-xl py-3 text-xs font-bold transition active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  activePendingRequest
                    ? 'bg-[#1D1938] text-[#AAA6B7] border border-[#292344] cursor-not-allowed'
                    : 'btn-gold-primary'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-[#080711]" />
                    <span className="text-[#080711]">Securing & Recording Payment...</span>
                  </>
                ) : activePendingRequest ? (
                  <>
                    <Clock className="h-4 w-4 text-[#E1C77A]" />
                    <span>Verification In Progress for {currentPlan.name}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-[#080711]" />
                    <span className="text-[#080711]">Submit Payment for Verification</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#706C7C]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C6A75E]" />
                <span>Protected against duplicate submissions. Real-time audit logged.</span>
              </div>
            </form>
          </div>

          {/* Past Submissions History Table */}
          {myPastPayments.length > 0 && (
            <div className="rounded-3xl border border-[#292344] bg-[#151329] p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-[#292344] pb-3">
                <h4 className="text-xs font-bold text-[#F5F1E8] flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#C6A75E]" />
                  Your Subscription & Payment Requests History ({myPastPayments.length})
                </h4>
                <button
                  type="button"
                  onClick={fetchMyPayments}
                  className="text-[11px] text-[#AAA6B7] hover:text-[#F5F1E8] flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {myPastPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-[#292344] bg-[#0E0C1B] p-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F5F1E8]">{p.plan_name}</span>
                        <span className="text-[11px] text-[#E1C77A] font-semibold">₹{p.amount_inr}</span>
                      </div>
                      <div className="text-[10px] font-mono text-[#AAA6B7] mt-0.5">
                        UTR: {p.utr_number} • {new Date(p.submitted_at).toLocaleDateString()}
                      </div>
                      {p.rejection_reason && (
                        <div className="text-[10px] text-[#A94D4D] mt-0.5">
                          Reason: {p.rejection_reason}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'verified'
                            ? 'bg-[#4F9D69]/20 text-[#4F9D69] border border-[#4F9D69]/40'
                            : p.status === 'rejected'
                            ? 'bg-[#A94D4D]/20 text-[#A94D4D] border border-[#A94D4D]/40'
                            : 'bg-[#C6A75E]/20 text-[#E1C77A] border border-[#C6A75E]/40'
                        }`}
                      >
                        {p.status === 'verified'
                          ? 'VERIFIED & ACTIVE'
                          : p.status === 'rejected'
                          ? 'REJECTED'
                          : 'PENDING VERIFICATION'}
                      </span>
                      {p.status === 'verified' && (
                        <div className="text-[10px] text-[#4F9D69] mt-0.5">
                          +{p.monthly_credits} Credits Added
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
