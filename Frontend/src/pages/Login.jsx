import { useState } from 'react';
import AuthLayout from '../layout/authLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // This catches errors sent by your backend (e.g., 401 Unauthorized)
        throw new Error(data.message || 'Invalid credentials');
      }

      // 1. Save the Token and Role to localStorage
      const userRole = data.role || (data.user && data.user.role);
      const subscriptionStatus = data.user?.subscription_status;
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('subscription_status', subscriptionStatus);

      // 2. Redirect the user (You'll need useNavigate from react-router-dom)
      if (userRole === 'admin') {
        window.location.href = '/admin';
      } else if (subscriptionStatus === 'active') {
        window.location.href = '/feed';
      } else {
        // Non-subscriber, show restricted access page
        window.location.href = '/restricted';
      }

    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="ShadowHowl Access">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-white text-sm font-medium mb-2">User ID</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-white/10 p-4 rounded-xl text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

      <div>
        <label className="block text-white text-sm font-medium mb-2">Access Key</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-white placeholder-white/50 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
        />
      </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
        >
          {loading ? 'Executing...' : 'Login'}
        </button>

        <div className="text-center text-white/60 text-sm">
          <p>Don&apos;t have access? <a href="/register" className="text-blue-400 hover:text-blue-300">Sign up</a></p>
        </div>
      </form>
    </AuthLayout>
  );
}