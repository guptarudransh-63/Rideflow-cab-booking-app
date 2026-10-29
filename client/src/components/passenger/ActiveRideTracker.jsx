import React, { useState } from 'react';
import { Star, Shield, Phone, AlertTriangle, KeyRound, CheckCircle2, Navigation, Clock } from 'lucide-react';

export const ActiveRideTracker = ({
  ride,
  onCancelRide,
  onViewReceipt,
  isCancelling = false,
}) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  if (!ride) return null;

  const isMatching = ride.status === 'requested' || ride.status === 'offered';
  const isAssigned = ride.status === 'driver_assigned';
  const isArrived = ride.status === 'arrived';
  const isInProgress = ride.status === 'in_progress';
  const isCompleted = ride.status === 'completed';

  const driver = ride.driver;
  const vehicle = ride.vehicle;

  const handleConfirmCancel = () => {
    onCancelRide(cancelReason);
    setCancelModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6 w-full max-w-md flex flex-col gap-5">
      {/* Dynamic Status Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            {ride.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className="text-xs text-slate-400 font-mono">#{ride._id.slice(-6)}</span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mt-2">
          {ride.noDriversAvailable && 'No nearby drivers found'}
          {!ride.noDriversAvailable && isMatching && 'Searching for nearby drivers...'}
          {isAssigned && 'Driver is en route to pickup'}
          {isArrived && 'Driver has arrived outside!'}
          {isInProgress && 'Trip in progress'}
          {isCompleted && 'Trip Completed!'}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {ride.noDriversAvailable && 'All drivers are currently busy or offline. Retrying search...'}
          {!ride.noDriversAvailable && isMatching && 'Dispatched to high-rated drivers nearby'}
          {isAssigned && 'Please be ready at your pickup location'}
          {isArrived && 'Meet your driver and verify vehicle plate'}
          {isInProgress && 'Heading towards destination'}
          {isCompleted && 'Thank you for riding with RideFlow'}
        </p>
      </div>

      {/* 4-Digit Pickup PIN Card (Crucial for passenger security) */}
      {!isCompleted && ride.pin && (
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Pickup Verification PIN
              </p>
              <p className="text-xs text-slate-300">Share this code with your driver</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg font-mono text-xl font-extrabold tracking-widest text-emerald-400">
            {ride.pin}
          </div>
        </div>
      )}

      {/* Assigned Driver & Vehicle Details Card */}
      {driver && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={driver.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                alt={driver.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{driver.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="flex items-center text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                    {driver.ratingAvg || '4.9'}
                  </span>
                  <span>•</span>
                  <span>{ride.category.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs tracking-wider text-slate-900 shadow-xs">
                {vehicle?.licensePlate || 'RF-8821'}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {vehicle?.make || 'Toyota'} {vehicle?.model || 'Camry'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-slate-700">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Verified Background Checked
            </span>
            <span className="text-[11px] text-slate-500">{vehicle?.color || 'Silver'}</span>
          </div>
        </div>
      )}

      {/* Route Addresses */}
      <div className="flex flex-col gap-2 text-xs">
        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Pickup</p>
            <p className="font-medium text-slate-800">{ride.pickup.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 shrink-0 mt-1"></span>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Destination</p>
            <p className="font-medium text-slate-800">{ride.destination.address}</p>
          </div>
        </div>
      </div>

      {/* Fare Estimate / Final Fare */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-400">
            {isCompleted ? 'Final Fare' : 'Estimated Fare'}
          </p>
          <p className="text-base font-extrabold text-slate-900">
            ${(ride.finalFare?.total || ride.fareEstimate?.total || 0).toFixed(2)}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
          {ride.paymentStatus === 'paid' ? 'Paid' : 'Pay at Destination'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        {isCompleted ? (
          <>
            <button
              onClick={onViewReceipt}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>View Receipt & Rate Driver</span>
            </button>
            <button
              onClick={() => onCancelRide && onCancelRide('dismiss')}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Book Another Ride
            </button>
          </>
        ) : (
          <button
            onClick={() => setCancelModalOpen(true)}
            disabled={isCancelling}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
          >
            Cancel Ride
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Cancel Ride?</h3>
            </div>
            <p className="text-xs text-slate-600">
              {isArrived
                ? 'Your driver has already arrived. A $5.00 cancellation fee will apply.'
                : 'Are you sure you want to cancel this ride request?'}
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Driver took too long">Driver took too long</option>
                <option value="Incorrect pickup location">Incorrect pickup location</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Keep Ride
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
