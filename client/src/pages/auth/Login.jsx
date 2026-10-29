import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Car, User, Shield, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = ({ onSwitchToRegister }) => {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('passenger@rideflow.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4">
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl flex flex-col gap-6">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center mb-4 shadow-md">
            <Car className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome to RideFlow</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to book rides or hit the road as a driver</p>
        </div>

        {/* 1-Click Demo Accounts Selector */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Instant 1-Click Demo Logins:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('passenger')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-slate-900 flex items-center gap-2 transition text-left"
            >
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="leading-tight">Alice</p>
                <p className="text-[10px] text-slate-400 font-normal">Passenger</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('driver')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-slate-900 flex items-center gap-2 transition text-left"
            >
              <Car className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="leading-tight">Carlos</p>
                <p className="text-[10px] text-slate-400 font-normal">Online Driver</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('driver_pending')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-slate-900 flex items-center gap-2 transition text-left"
            >
              <Car className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="leading-tight">David</p>
                <p className="text-[10px] text-slate-400 font-normal">Pending Driver</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('admin')}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:border-slate-900 flex items-center gap-2 transition text-left"
            >
              <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="leading-tight">Platform Ops</p>
                <p className="text-[10px] text-slate-400 font-normal">Admin</p>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@rideflow.com"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold text-slate-900 hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};
