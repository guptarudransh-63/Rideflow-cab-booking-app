import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, Car, Shield, Clock, CheckCircle2 } from 'lucide-react';

export const DemoSwitcher = () => {
  const { user, quickLogin, logout } = useAuth();

  return (
    <aside aria-label="Demo environment switcher" className="bg-slate-900 text-slate-300 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-inner z-50">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-white tracking-wide uppercase text-[10px]">
          Demo Quick Switcher:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => quickLogin('passenger')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
              user?.email === 'passenger@rideflow.com'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <User className="w-3 h-3" />
            <span>Alice (Passenger)</span>
          </button>

          <button
            onClick={() => quickLogin('driver')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
              user?.email === 'driver@rideflow.com'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Carlos (Approved Driver)</span>
          </button>

          <button
            onClick={() => quickLogin('driver_pending')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
              user?.email === 'driver_pending@rideflow.com'
                ? 'bg-amber-600 text-white font-medium shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>David (Pending Driver)</span>
          </button>

          <button
            onClick={() => quickLogin('admin')}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
              user?.role === 'admin'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin Ops</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Maps: Simulation Ready
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Payment: Demo Mode
        </span>
        {user && (
          <button
            onClick={logout}
            className="text-slate-400 hover:text-white underline transition"
          >
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
};
