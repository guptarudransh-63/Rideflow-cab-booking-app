import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { MapPin, Navigation, Star, Clock, Check, X, DollarSign } from 'lucide-react';

export const IncomingOfferModal = ({ offer, onAccepted, onRejected }) => {
  const [timeLeft, setTimeLeft] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const offerId = offer?.offerId || offer?._id;

  useEffect(() => {
    if (!offer) return;

    setTimeLeft(25);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          api.rejectOffer(offerId).catch(() => {});
          if (onRejected) onRejected(offerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [offer, offerId, onRejected]);

  if (!offer) return null;

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.acceptOffer(offerId);
      if (res.success) {
        if (onAccepted) onAccepted(res.ride);
      }
    } catch (err) {
      setError(err.message || 'Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await api.rejectOffer(offerId);
      if (onRejected) onRejected(offerId);
    } catch (err) {
      if (onRejected) onRejected(offerId);
    }
  };

  const fareEstimate = offer.estimatedFare || 14.5;
  // Driver net is approx 80%
  const expectedEarnings = Math.round(fareEstimate * 0.8 * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 flex flex-col gap-5 relative">
        {/* Countdown Ring Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              New Ride Request
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full font-mono font-extrabold text-xs text-amber-400 border border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-900/60 border border-red-700 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Big Payout Preview */}
        <div className="text-center py-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Expected Net Earnings
          </p>
          <div className="text-4xl font-extrabold tracking-tight text-white mt-1">
            ${expectedEarnings.toFixed(2)}
          </div>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-400">
            <span>{offer.distanceKm || '3.5'} km trip</span>
            <span>•</span>
            <span>{offer.durationMin || '10'} mins</span>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 mt-1"></span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Pickup ({offer.pickupDistanceKm ? `${offer.pickupDistanceKm.toFixed(1)} km away` : 'Nearby'})
              </p>
              <p className="font-semibold text-slate-100">{offer.pickup?.address || 'Pickup Location'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-2 border-t border-slate-700/60">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 shrink-0 mt-1"></span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Destination</p>
              <p className="font-semibold text-slate-100">{offer.destination?.address || 'Destination'}</p>
            </div>
          </div>
        </div>

        {/* Passenger Mini Card */}
        {offer.passenger && (
          <div className="flex items-center justify-between text-xs px-2 text-slate-400">
            <span>Passenger: <strong className="text-white">{offer.passenger.name}</strong></span>
            <span className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-current mr-1" />
              {offer.passenger.rating || '5.0'}
            </span>
          </div>
        )}

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>

          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-2 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{loading ? 'Accepting...' : 'Accept Ride'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
