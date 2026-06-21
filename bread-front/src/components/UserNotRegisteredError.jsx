import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UserNotRegisteredError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#15233A] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🍞</span>
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F0] mb-3">Access Required</h1>
        <p className="text-sm text-[#C4C4BA]/60 mb-6">
          You need to be registered to access this app.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl h-12 px-6"
        >
          Refresh Page
        </Button>
      </div>
    </div>
  );
}