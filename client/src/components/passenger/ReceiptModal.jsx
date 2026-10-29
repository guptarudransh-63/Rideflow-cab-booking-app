import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { CheckCircle2, CreditCard, ShieldCheck, Download, Star, X } from 'lucide-react';

export const ReceiptModal = ({ ride, onClose, onRatingPrompt }) => {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(ride?.paymentStatus === 'paid');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const fare = ride?.finalFare || ride?.fareEstimate || {};
  const isPaid = paid || ride?.paymentStatus === 'paid';

  useEffect(() => {
    if (ride?.paymentStatus === 'paid') {
      setPaid(true);
    }
  }, [ride?.paymentStatus]);

  const handlePayNow = async () => {
    try {
      setPaying(true);
      setError('');
      const idempotencyKey = `PAY_${ride._id}_${Date.now()}`;

      const res = await api.processPayment({
        rideId: ride._id,
        paymentMethod: 'demo_card',
        idempotencyKey,
      });

      if (res.success) {
        setPaid(true);
        setReceipt(res.payment);
        if (ride) {
          ride.paymentStatus = 'paid';
          ride.payment = res.payment._id;
        }
      }
    } catch (err) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center pt-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Trip Receipt</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            RideFlow • {new Date(ride.completedAt || ride.createdAt).toLocaleDateString()}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* Itemized Fare Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Base Fare</span>
            <span className="font-semibold text-slate-900">${(fare.base ?? 3.5).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Distance ({ride?.route?.distanceKm || 0} km)</span>
            <span className="font-semibold text-slate-900">${(fare.distance ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Time ({ride?.route?.durationMin || 0} mins)</span>
            <span className="font-semibold text-slate-900">${(fare.duration ?? 0).toFixed(2)}</span>
          </div>
          {fare.cancellationFee > 0 && (
            <div className="flex items-center justify-between text-rose-600 font-semibold">
              <span>Cancellation Fee</span>
              <span>${fare.cancellationFee.toFixed(2)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-extrabold text-slate-900">
            <span>Total Paid</span>
            <span>${(fare.total ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Status & Details */}
        <div className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-slate-900">RideFlow Demo Card •••• 4242</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {receipt?.receiptNumber || `RF-RCP-${ride._id.slice(-6)}`}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isPaid ? 'PAID' : 'PENDING'}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {!isPaid ? (
            <button
              onClick={handlePayNow}
              disabled={paying}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {paying ? 'Processing Payment...' : `Pay $${fare.total.toFixed(2)} (Instant Demo)`}
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onRatingPrompt) onRatingPrompt();
              }}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-md flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Rate Your Driver</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-100 transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
