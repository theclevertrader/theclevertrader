"use client";

import React, { useState } from "react";
import { SubscriptionTier, BillingCycle, SAAS_PLANS, upgradeSubscription } from "@/lib/saas/subscription";
import { 
  X, CheckCircle2, CreditCard, Coins, ShieldCheck, 
  Copy, Check, Sparkles, ArrowRight, Lock 
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  onClose: () => void;
  onSuccess: (licenseKey: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  tier,
  billingCycle,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"STRIPE_CARD" | "CRYPTO_USDT">("STRIPE_CARD");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");
  const [cardHolder, setCardHolder] = useState("Shaheen Trader");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const plan = SAAS_PLANS[tier];
  const amount = billingCycle === "ANNUAL" ? plan.annualTotal : plan.priceMonthly;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment authorization
    setTimeout(() => {
      const updated = upgradeSubscription(tier, billingCycle, paymentMethod);
      setGeneratedKey(updated.licenseKey);
      setIsProcessing(false);
      setIsSuccess(true);
      onSuccess(updated.licenseKey);
    }, 1800);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-mono animate-backdrop-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-[#090f1a] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-cyan-400">Institutional Checkout</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                256-BIT ENCRYPTED
              </span>
            </div>
            <h3 className="text-lg font-black text-white uppercase mt-0.5">
              Subscribe to {plan.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuccess ? (
          <form onSubmit={handlePay} className="space-y-4 pt-4">
            
            {/* Order Summary Box */}
            <div className="bg-black/50 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">{plan.name} ({billingCycle})</div>
                <div className="text-[11px] text-slate-400">Instant MetaTrader 5 License Provisioning</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-400 font-mono">${amount}.00 USD</div>
                <div className="text-[10px] text-slate-400">{billingCycle === "ANNUAL" ? "Per year" : "Billed monthly"}</div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("STRIPE_CARD")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === "STRIPE_CARD"
                    ? "bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-sm"
                    : "bg-surface/50 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit / Debit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CRYPTO_USDT")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  paymentMethod === "CRYPTO_USDT"
                    ? "bg-amber-500/15 border-amber-400 text-amber-300 shadow-sm"
                    : "bg-surface/50 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Crypto (USDT / Pay)</span>
              </button>
            </div>

            {/* Stripe Card Fields */}
            {paymentMethod === "STRIPE_CARD" ? (
              <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value)}
                    className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white pl-9 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expiry</label>
                    <input
                      type="text"
                      required
                      value={cardExp}
                      onChange={e => setCardExp(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">CVC / CVV</label>
                    <input
                      type="password"
                      required
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value)}
                      className="w-full bg-black/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-amber-950/20 p-4 rounded-xl border border-amber-500/30 text-center">
                <div className="text-xs font-bold text-amber-300 uppercase">USDT (TRC20 / BEP20) Payment</div>
                <div className="p-3 bg-black/80 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                  TQq98kLsm942XvQ1N8z5WpR7Jm42K8900
                </div>
                <p className="text-[10px] text-slate-400">
                  Scan QR code in Binance / TrustWallet or send <strong>${amount} USDT</strong> to the institutional treasury address above. Auto-verified in seconds.
                </p>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Authorizing Institutional Gateway...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authorize & Pay ${amount}.00 USD</span>
                </>
              )}
            </button>

            <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cancel anytime • 14-day money back guarantee • Prop-firm friendly</span>
            </div>

          </form>
        ) : (
          <div className="pt-6 pb-2 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white uppercase">
                Payment Confirmed!
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Aapka <strong>{plan.name}</strong> subscription active ho chuka hai!
              </p>
            </div>

            {/* License Box */}
            <div className="bg-black/80 border border-cyan-500/40 rounded-xl p-4 text-left space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Aapki MetaTrader 5 Autonomous License Key:
              </div>
              <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                <span className="font-mono text-sm font-bold text-cyan-300 tracking-wider">
                  {generatedKey}
                </span>
                <button
                  onClick={copyKey}
                  className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold flex items-center gap-1"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Is key ko MT5 EA ke inputs me paste karein ya Billing portal se directly activate karein.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs uppercase hover:bg-cyan-400 transition-colors"
            >
              Start Autonomous Trading Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
