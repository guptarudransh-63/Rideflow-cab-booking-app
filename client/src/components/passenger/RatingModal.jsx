import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { Star, CheckCircle, X } from 'lucide-react';

export const RatingModal = ({ ride, onClose, onSuccess }) => {
  const [score, setScore] = useState(5);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const compliments = ['Great Conversation', 'Clean Car', 'Safe Driver', 'Smooth Route', 'Fast Pickup'];
  const [selectedCompliments, setSelectedCompliments] = useState([]);

  const toggleCompliment = (c) => {
    if (selectedCompliments.includes(c)) {
      setSelectedCompliments(selectedCompliments.filter((item) => item !== c));
    } else {
      setSelectedCompliments([...selectedCompliments, c]);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      const fullComment = selectedCompliments.length > 0
        ? `${selectedCompliments.join(', ')}. ${comment}`.trim()
        : comment;

      const res = await api.submitRating(ride._id, {
        score,
        comment: fullComment,
      });

      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Rating Submitted!</h3>
            <p className="text-xs text-slate-500">Thank you for helping keep RideFlow safe and reliable.</p>
          </div>
        ) : (
          <>
            <div>
              <img
                src={ride.driver?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                alt={ride.driver?.name}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-100 shadow-sm mb-2"
              />
              <h3 className="text-lg font-extrabold text-slate-900">Rate {ride.driver?.name || 'Driver'}</h3>
              <p className="text-xs text-slate-500">How was your trip with {ride.driver?.name}?</p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                {error}
              </div>
            )}

            {/* Interactive 5-Star Selection */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverScore(s)}
                  onMouseLeave={() => setHoverScore(0)}
                  onClick={() => setScore(s)}
                  className="p-1 transition transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverScore || score) >= s
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200 fill-transparent'
                    } transition`}
                  />
                </button>
              ))}
            </div>

            {/* Compliment Chips */}
            <div className="flex flex-wrap gap-1.5 justify-center py-1">
              {compliments.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCompliment(c)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${
                    selectedCompliments.includes(c)
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave an optional comment or note of appreciation..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-slate-900 resize-none h-20 placeholder:text-slate-400"
            />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 transition shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
