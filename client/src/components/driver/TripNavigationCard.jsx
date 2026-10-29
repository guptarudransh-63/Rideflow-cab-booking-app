import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { Navigation, MapPin, KeyRound, CheckCircle2, AlertCircle, Phone, ArrowRight } from 'lucide-react';

export const TripNavigationCard = ({ ride, onTripUpdated }) => {
  const [pinInput, setPinInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  if (!ride) return null;

  const isAssigned = ride.status === 'driver_assigned';
  const isArrived = ride.status === 'arrived';
  const isInProgress = ride.status === 'in_progress';
  const isCompleted = ride.status === 'completed';

  const passenger = ride.passenger;

  // 1. Mark Arrived
  const handleMarkArrived = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.markArrived(ride._id);
      if (res.success && onTripUpdated) {
        onTripUpdated(res.ride);
      }
    } catch (err) {
      setError(err.message || 'Failed to update arrival status');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Start Trip with PIN
  const handleStartTrip = async (e) => {
    e.preventDefault();
    if (!pinInput || pinInput.length !== 4) {
      setError('Please enter the 4-digit PIN provided by passenger');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      const res = await api.startRide(ride._id, pinInput);
      if (res.success && onTripUpdated) {
        onTripUpdated(res.ride);
        setPinInput('');
      }
    } catch (err) {
      setError(err.message || 'Invalid PIN code');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Complete Trip
  const handleCompleteTrip = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await api.completeRide(ride._id);
      if (res.success && onTripUpdated) {
        onTripUpdated(res.ride);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete trip');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 p-5 md:p-6 w-full max-w-md flex flex-col gap-5">
      {/* Step Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            {isAssigned && 'Navigating to Pickup'}
            {isArrived && 'Arrived at Pickup'}
            {isInProgress && 'Driving to Destination'}
            {isCompleted && 'Trip Completed'}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">#{ride._id.slice(-6)}</span>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-900/60 border border-red-700 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Passenger Info */}
      {passenger && (
        <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80">
          <div className="flex items-center gap-3">
            <img
              src={passenger.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
              alt={passenger.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-600"
            />
            <div>
              <p className="text-xs font-bold text-white">{passenger.name}</p>
              <p className="text-[11px] text-slate-400">{passenger.phone || '+1 (555) 012-3456'}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-700 text-slate-200">
            {ride.category.toUpperCase()}
          </span>
        </div>
      )}

      {/* Target Address Display */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-xs flex flex-col gap-2">
        <p className="text-[10px] uppercase font-bold text-slate-400">
          {isInProgress ? 'Dropping Off At' : 'Picking Up At'}
        </p>
        <p className="text-sm font-semibold text-white">
          {isInProgress ? ride.destination.address : ride.pickup.address}
        </p>
        <p className="text-[11px] text-emerald-400">
          Route: {ride.route.distanceKm} km • Approx {ride.route.durationMin} mins
        </p>
      </div>

      {/* Interactive Action according to state */}
      <div className="pt-2">
        {/* State 1: En Route to Pickup */}
        {isAssigned && (
          <button
            onClick={handleMarkArrived}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{actionLoading ? 'Updating...' : 'I Have Arrived at Pickup'}</span>
          </button>
        )}

        {/* State 2: Arrived outside -> Enter PIN */}
        {isArrived && (
          <form onSubmit={handleStartTrip} className="flex flex-col gap-3">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-1.5 text-center">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Ask passenger for 4-Digit Pickup PIN
              </label>
              <input
                type="text"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • •"
                className="w-40 mx-auto text-center font-mono text-2xl font-extrabold tracking-widest p-2 bg-slate-900 border border-slate-600 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || pinInput.length !== 4}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{actionLoading ? 'Verifying PIN...' : 'Verify PIN & Start Trip'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* State 3: Trip In Progress -> Complete Trip */}
        {isInProgress && (
          <button
            onClick={handleCompleteTrip}
            disabled={actionLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{actionLoading ? 'Completing Trip...' : 'Complete Trip & Collect Fare'}</span>
          </button>
        )}

        {/* State 4: Completed */}
        {isCompleted && (
          <div className="flex flex-col gap-3">
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center flex flex-col gap-1">
              <p className="text-xs font-bold text-emerald-300">Trip Completed Successfully!</p>
              <p className="text-xl font-extrabold text-white">
                Net Earned: ${(ride.finalFare?.driverNet || 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => onTripUpdated && onTripUpdated(null)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Done • Ready for Next Ride</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
