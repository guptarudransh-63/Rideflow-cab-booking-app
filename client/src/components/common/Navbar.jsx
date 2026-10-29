import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Navigation, Car, Shield, Star, LogOut, History, Wallet, CheckCircle } from 'lucide-react';

export const Navbar = ({ currentTab, onSelectTab }) => {
  const { user, driverProfile, activeRide, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white shadow-md">
              <Car className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-950">RideFlow</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Urban Mobility Platform</p>
            </div>
          </div>

          {/* Navigation Links based on role */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {user.role === 'passenger' && (
                <>
                  <button
                    onClick={() => onSelectTab('book')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      currentTab === 'book' || currentTab === 'home'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Book a Ride
                  </button>
                  <button
                    onClick={() => onSelectTab('rides')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      currentTab === 'rides'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <History className="w-4 h-4 text-slate-400" />
                    Trip History
                  </button>
                </>
              )}

              {user.role === 'driver' && (
                <>
                  <button
                    onClick={() => onSelectTab('driver-console')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      currentTab === 'driver-console' || currentTab === 'home'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Car className="w-4 h-4 text-slate-400" />
                    Driver Console
                  </button>
                  <button
                    onClick={() => onSelectTab('driver-earnings')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      currentTab === 'driver-earnings'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-slate-400" />
                    Earnings
                  </button>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => onSelectTab('admin-dashboard')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      currentTab === 'admin-dashboard' || currentTab === 'home'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-slate-400" />
                    Operations Hub
                  </button>
                  <button
                    onClick={() => onSelectTab('admin-drivers')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      currentTab === 'admin-drivers'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Driver Approvals
                  </button>
                  <button
                    onClick={() => onSelectTab('admin-fares')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition ${
                      currentTab === 'admin-fares'
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Pricing Rules
                  </button>
                </>
              )}
            </div>
          )}

          {/* User Profile / Status */}
          {user ? (
            <div className="flex items-center gap-3">
              {activeRide && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Trip: {activeRide.status.replace('_', ' ').toUpperCase()}
                </div>
              )}

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <img
                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0f172a&color=fff`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span className="capitalize">{user.role}</span>
                    <span>•</span>
                    <span className="flex items-center text-amber-500 font-medium">
                      <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                      {user.ratingAvg || '5.0'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('login')}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
              >
                Log In
              </button>
              <button
                onClick={() => onSelectTab('register')}
                className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition shadow-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
