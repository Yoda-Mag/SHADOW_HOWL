import { Lock, Phone } from 'lucide-react';

export default function Restricted() {
  const contactNumber = "+1 (555) 123-4567"; // Update with admin phone number

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-4">
            <Lock size={48} className="text-red-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Access Restricted</h1>
          <p className="text-slate-400 text-sm">Your subscription is not active</p>
        </div>

        {/* Content */}
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl backdrop-blur-md space-y-6 mb-6">
          <div className="text-center space-y-3">
            <p className="text-white font-semibold">To access ShadowHowl Trading Signals,</p>
            <p className="text-slate-300">you need an active subscription.</p>
          </div>

          {/* Contact Info Card */}
          <div className="bg-slate-800/60 border border-blue-500/20 p-6 rounded-xl space-y-3">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Phone size={20} className="text-blue-400" />
              <span className="text-sm text-slate-400">Contact for access:</span>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400 font-mono">{contactNumber}</p>
            </div>
          </div>

          {/* Features locked message */}
          <div className="text-xs text-slate-400 space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-red-400 mt-1">×</span>
              <span>Live trading signals</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-400 mt-1">×</span>
              <span>Real-time market analysis</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-red-400 mt-1">×</span>
              <span>AI trading coach</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
