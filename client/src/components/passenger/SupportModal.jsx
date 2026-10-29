import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { ShieldAlert, CheckCircle, X, AlertCircle } from 'lucide-react';

export const SupportModal = ({ ride, onClose }) => {
  const [issueType, setIssueType] = useState('fare_dispute');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 5) {
      setError('Please provide a brief description of the issue');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.reportSupportIssue(ride._id, {
        issueType,
        description,
      });

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit support case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Support Ticket Created</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Our safety and dispute resolution team is reviewing your report. Case updates will appear in your receipts.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold">Report a Trip Issue</h3>
                <p className="text-xs text-slate-500">Ride #{ride._id.slice(-6)}</p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Issue Category</label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-900"
              >
                <option value="fare_dispute">Fare Dispute / Incorrect Price Charged</option>
                <option value="driver_conduct">Driver Behavior or Safety Concern</option>
                <option value="vehicle_condition">Vehicle Condition / Cleanliness</option>
                <option value="route_issue">Inefficient Route Taken</option>
                <option value="lost_item">Lost an Item in Vehicle</option>
                <option value="cancellation_fee_dispute">Dispute Cancellation Fee</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened so our platform support team can investigate..."
                rows={4}
                className="p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900 resize-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
