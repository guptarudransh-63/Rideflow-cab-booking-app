import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Wallet, DollarSign, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

export const EarningsCard = () => {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const res = await api.getDriverEarnings();
        if (res.success) {
          setEarnings(res);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse text-center text-xs text-slate-400">
        Loading earnings data...
      </div>
    );
  }

  const summary = earnings?.summary || {
    todayEarnings: 0,
    netEarnings: 0,
    grossFares: 0,
    platformCommission: 0,
    totalTrips: 0,
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6 w-full flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Driver Earnings</h3>
          <p className="text-xs text-slate-500">Authoritative automated fare accounting</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
          <Wallet className="w-5 h-5" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
            Today's Net Payout
          </p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">
            ${summary.todayEarnings.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Available for instant transfer</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
            Total Completed Trips
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{summary.totalTrips}</p>
          <p className="text-[10px] text-slate-500 mt-1">100% verified rides</p>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Gross Passenger Fares</span>
          <span className="font-semibold text-slate-900">${summary.grossFares.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Platform Service Fee (20%)</span>
          <span className="font-semibold text-rose-600">-${summary.platformCommission.toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-900">
          <span>Total Net Driver Payout</span>
          <span className="text-emerald-600">${summary.netEarnings.toFixed(2)}</span>
        </div>
      </div>

      {/* Recent Trips Table */}
      {earnings?.recentTrips && earnings.recentTrips.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Completed Trips
          </label>
          <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
            {earnings.recentTrips.map((trip) => (
              <div key={trip._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{trip.destination?.address || 'Trip'}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(trip.completedAt || trip.createdAt).toLocaleDateString()} • {trip.route?.distanceKm} km
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    +${(trip.finalFare?.driverNet || 0).toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium">Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
