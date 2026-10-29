import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { ReceiptModal } from '../../components/passenger/ReceiptModal.jsx';
import { RatingModal } from '../../components/passenger/RatingModal.jsx';
import { SupportModal } from '../../components/passenger/SupportModal.jsx';
import { History, Star, ShieldAlert, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export const PassengerRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState(null);
  const [selectedRideForRating, setSelectedRideForRating] = useState(null);
  const [selectedRideForSupport, setSelectedRideForSupport] = useState(null);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const res = await api.getPassengerRides();
      if (res.success) {
        setRides(res.rides || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          <span>Your Trip History</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review past receipts, driver ratings, and support disputes</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading trips...</div>
      ) : rides.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 flex flex-col items-center gap-3">
          <History className="w-10 h-10 text-slate-300" />
          <p className="text-sm font-semibold">No rides yet</p>
          <p className="text-xs text-slate-400">Book your first ride using the map above!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rides.map((ride) => {
            const isCompleted = ride.status === 'completed';
            const fare = ride.finalFare?.total || ride.fareEstimate?.total || 0;

            return (
              <div
                key={ride._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {ride.category?.slice(0, 3) || 'ECO'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {new Date(ride.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ride.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-1">
                      {ride.pickup.address} → {ride.destination.address}
                    </p>

                    {ride.driver && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Driver: <strong className="text-slate-700">{ride.driver.name}</strong> •{' '}
                        {ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : 'Standard Vehicle'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-base font-extrabold text-slate-900">${fare.toFixed(2)}</p>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ride.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ride.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedRideForReceipt(ride)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                      title="View Receipt"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Receipt</span>
                    </button>

                    {isCompleted && (
                      <button
                        onClick={() => setSelectedRideForRating(ride)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
                        title="Rate Driver"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="hidden sm:inline">Rate</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedRideForSupport(ride)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition"
                      title="Report Trip Issue"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRideForReceipt && (
        <ReceiptModal
          ride={selectedRideForReceipt}
          onClose={() => setSelectedRideForReceipt(null)}
          onRatingPrompt={() => {
            setSelectedRideForRating(selectedRideForReceipt);
            setSelectedRideForReceipt(null);
          }}
        />
      )}

      {selectedRideForRating && (
        <RatingModal
          ride={selectedRideForRating}
          onClose={() => setSelectedRideForRating(null)}
          onSuccess={fetchRides}
        />
      )}

      {selectedRideForSupport && (
        <SupportModal
          ride={selectedRideForSupport}
          onClose={() => setSelectedRideForSupport(null)}
        />
      )}
    </div>
  );
};
