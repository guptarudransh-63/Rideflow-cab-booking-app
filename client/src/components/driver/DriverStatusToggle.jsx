import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { Power, Car, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const DriverStatusToggle = ({ profile, onStatusChanged }) => {
  const [isOnline, setIsOnline] = useState(Boolean(profile?.isOnline));
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  const isApproved = profile?.verificationStatus === 'approved';

  useEffect(() => {
    if (profile) {
      setIsOnline(Boolean(profile.isOnline));
    }
  }, [profile?.isOnline]);

  const handleToggle = async () => {
    if (!isApproved) {
      setError(`Cannot go online. Account verification status is '${profile?.verificationStatus}'.`);
      return;
    }

    try {
      setToggling(true);
      setError('');
      const targetState = !isOnline;
      const res = await api.updateAvailability(targetState);
      if (res.success) {
        setIsOnline(targetState);
        if (onStatusChanged) onStatusChanged(targetState);
      }
    } catch (err) {
      setError(err.message || 'Failed to update availability status');
    } finally {
      setToggling(false);
    }
  };

  // When online, simulate periodic driver GPS movement
  useEffect(() => {
    if (!isOnline) return;

    // Send initial location
    let currentCoords = [-122.404, 37.789];
    let heading = 45;

    const interval = setInterval(() => {
      // Small simulated movement
      currentCoords = [
        currentCoords[0] + (Math.random() - 0.5) * 0.001,
        currentCoords[1] + (Math.random() - 0.5) * 0.001,
      ];
      heading = (heading + 10) % 360;

      // Update via Socket or API
      try {
        const socket = getSocket();
        socket.emit('driver:update_location', {
          coordinates: currentCoords,
          heading,
          speed: 35,
          rideId: profile?.currentRide?._id || profile?.currentRide,
        });
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [isOnline, profile?.currentRide]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 w-full flex flex-col gap-4">
      {/* Verification Warning if not approved */}
      {!isApproved && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Driver Account Verification: {profile?.verificationStatus?.toUpperCase()}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Only verified drivers can go online. Contact platform admin or switch to Admin Ops to approve this profile.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-md ${
              isOnline
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}
          >
            <Power className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {isOnline ? 'You are Online' : 'You are Offline'}
              </h3>
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                }`}
              ></span>
            </div>
            <p className="text-xs text-slate-500">
              {isOnline
                ? 'Ready to receive nearby ride requests'
                : 'Go online to start earning with RideFlow'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling || !isApproved}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 ${
            isOnline
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-slate-950 text-white hover:bg-slate-800'
          }`}
        >
          {toggling ? 'Updating...' : isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Vehicle Summary */}
      {profile?.vehicle && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-800">
              {profile.vehicle.make} {profile.vehicle.model}
            </span>
            <span className="text-slate-400">•</span>
            <span className="uppercase text-[11px] font-bold text-slate-500">{profile.vehicle.category}</span>
          </div>
          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
            {profile.vehicle.licensePlate}
          </span>
        </div>
      )}
    </div>
  );
};
