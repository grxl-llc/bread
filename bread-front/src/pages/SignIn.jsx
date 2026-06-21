import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import BreadLogo from '@/components/branding/BreadLogo';

// This page is shown AFTER Base44 authenticates the user.
// It handles post-auth logic: new users go to onboarding, existing users go home.
export default function SignIn() {
  const [mode, setMode] = useState('choose'); // 'choose' | 'loading' | 'terms'
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          // User is already authenticated — route them appropriately
          await routeAuthenticatedUser(user);
        }
      } catch {
        // Not authenticated yet — show the choose screen
      }
    };
    checkCurrentUser();
  }, []);

  const routeAuthenticatedUser = async (user) => {
    try {
      const existing = await base44.entities.User.filter({ email: user.email });
      if (existing.length === 0) {
        // New user — need to agree to terms before continuing
        setPendingUser(user);
        setMode('terms');
      } else {
        // Existing user — go home
        navigate('/');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setMode('choose');
    }
  };

  const handleLoginClick = (isSignUp) => {
    // Use Base44's built-in auth — it handles email/password, OAuth, etc.
    base44.auth.redirectToLogin('/');
  };

  const handleCompleteSignUp = async () => {
    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions to continue.');
      return;
    }

    setMode('loading');
    setError('');

    try {
      await base44.auth.updateMe({ signup_onboarding_complete: false });
      navigate('/post-signup-onboarding');
    } catch (err) {
      setError('Failed to create account. Please try again.');
      setMode('terms');
    }
  };

  // Terms agreement screen (shown after auth for new users)
  if (mode === 'terms') {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <BreadLogo size="2xl" />
          </div>
          <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5">
            <h1 className="text-2xl font-bold text-[#F5F5F0] mb-2 text-center">
              Almost there!
            </h1>
            <p className="text-[#C4C4BA] text-center mb-6">
              Please agree to our terms to finish creating your account.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6 flex items-start gap-3 bg-[#15233A] rounded-xl p-4">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#FF6B35]"
              />
              <label htmlFor="terms" className="text-[#C4C4BA] text-sm leading-relaxed">
                I agree to the{' '}
                <a
                  href="/TermsOfService"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF6B35] hover:underline"
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="/PrivacyPolicy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF6B35] hover:underline"
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              onClick={handleCompleteSignUp}
              disabled={!agreedToTerms}
              className="w-full bg-[#FF6B35] hover:bg-[#FF8555] disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Create My Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading screen
  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-[#FF6B35]/20 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
        <p className="text-[#C4C4BA]">Setting up your account...</p>
      </div>
    );
  }

  // Default: choose sign in or sign up
  return (
    <div className="min-h-screen bg-[#15233A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BreadLogo size="2xl" />
        </div>

        <div className="bg-[#1A2744] rounded-2xl p-8 border border-white/5">
          <h1 className="text-2xl font-bold text-[#F5F5F0] mb-2 text-center">
            Welcome to Bread
          </h1>
          <p className="text-[#C4C4BA] text-center mb-8">
            Cook smarter, spend less
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={() => handleLoginClick(true)}
            className="w-full bg-[#FF6B35] hover:bg-[#FF8555] text-white font-semibold py-3 rounded-xl transition-colors mb-3"
          >
            Create Account
          </button>

          <button
            onClick={() => handleLoginClick(false)}
            className="w-full bg-transparent border border-white/20 hover:border-white/40 text-[#F5F5F0] font-semibold py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>

          <p className="text-[#C4C4BA]/60 text-xs text-center mt-6">
            By creating an account you agree to our{' '}
            <a href="/TermsOfService" className="text-[#FF6B35] hover:underline">Terms</a>
            {' '}and{' '}
            <a href="/PrivacyPolicy" className="text-[#FF6B35] hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}