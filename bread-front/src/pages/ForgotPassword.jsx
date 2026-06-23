import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BreadLogo from '@/components/branding/BreadLogo';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // dev_token is returned by the backend in non-production mode for easy testing
  const [devResetLink, setDevResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await base44.auth.forgotPassword(email);
      setSubmitted(true);
      // Backend returns dev_token when email service isn't configured yet
      if (res?.dev_token) {
        setDevResetLink(`/reset-password?token=${res.dev_token}`);
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BreadLogo size="2xl" />
          </div>

          <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF6B35]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F5F5F0] mb-2">Check your email</h1>
            <p className="text-[#C4C4BA] text-sm mb-6">
              If <span className="text-[#F5F5F0] font-medium">{email}</span> is registered,
              we've sent a reset link. It expires in 1 hour.
            </p>

            {/* Dev helper — visible until email service is wired up */}
            {devResetLink && (
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-xl p-4 mb-6 text-left">
                <p className="text-[#FF6B35] text-xs font-semibold mb-2 uppercase tracking-wide">
                  Dev mode — reset link
                </p>
                <p className="text-[#C4C4BA] text-xs mb-3">
                  Email isn't configured yet. Use this link to test the reset flow:
                </p>
                <Link
                  to={devResetLink}
                  className="block w-full text-center bg-[#FF6B35] hover:bg-[#FF8555] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Continue to Reset Password →
                </Link>
              </div>
            )}

            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-[#C4C4BA] hover:text-[#F5F5F0] text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BreadLogo size="2xl" />
        </div>

        <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/15 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F5F5F0]">Forgot password?</h1>
              <p className="text-[#C4C4BA] text-xs">We'll send you a reset link</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#C4C4BA] text-xs font-medium mb-1.5 ml-0.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#15233A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F5F0] placeholder-[#C4C4BA]/40 focus:outline-none focus:border-[#FF6B35]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-[#C4C4BA] hover:text-[#F5F5F0] text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
