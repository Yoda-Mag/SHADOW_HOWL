import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';

const VerifyOTP = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, username, password } = location.state || {};

    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Redirect if no registration data
    if (!email || !username || !password) {
        navigate('/register');
        return null;
    }

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        if (!otp || otp.length !== 6) {
            setMessage('Please enter a valid 6-digit OTP');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {

            await axios.post('/api/auth/verify-otp', {
                email,
                otp,
                username,
                password
            });

            setMessage('Email verified! Redirecting to login...');
            setIsError(false);

            setTimeout(() => {
                navigate('/login', { state: { email } });
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Verification failed');
            setIsError(true);
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setIsLoading(true);
            await axios.post('/api/auth/resend-otp', { email });
            setMessage('OTP resent to your email');
            setIsError(false);
            setResendTimer(60);

            const interval = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to resend OTP');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <CheckCircle className="h-16 w-16 text-blue-500" />
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 text-white">Verify Email</h2>
                <p className="text-zinc-500 text-center mb-6 text-sm">
                    {/* FIX: Wrapped text in {} to escape apostrophe (Error 1) */}
                    {"We've sent a 6-digit OTP to"}<br />
                    <span className="text-blue-400 font-semibold">{email}</span>
                </p>

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-sm mb-2">Enter OTP</label>
                        <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full bg-zinc-800 border border-zinc-700 p-4 rounded-lg focus:outline-none focus:border-blue-500 text-white text-center text-2xl tracking-widest"
                            disabled={isLoading}
                        />
                    </div>

                    {message && (
                        <div
                            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                                isError
                                    ? 'bg-red-900/30 text-red-400 border border-red-800'
                                    : 'bg-green-900/30 text-green-400 border border-green-800'
                            }`}
                        >
                            <AlertCircle className="h-4 w-4" />
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500">
                    {/* FIX: Wrapped text in {} to escape apostrophe (Error 2) */}
                    {"Didn't receive OTP? "}{' '}
                    <button
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || isLoading}
                        className="text-blue-500 hover:underline disabled:text-zinc-600 disabled:cursor-not-allowed"
                    >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                </div>

                <div className="mt-4 text-center text-zinc-600 text-xs">
                    <p>OTP expires in 10 minutes</p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;