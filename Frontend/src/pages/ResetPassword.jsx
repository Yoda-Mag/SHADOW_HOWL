import { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Lock } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Redirect if no email
    if (!email) {
        navigate('/forgot-password');
        return null;
    }

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        if (!otp || otp.length !== 6) {
            setMessage('Please enter a valid 6-digit OTP');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage('Passwords do not match');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharRegex.test(newPassword)) {
            setMessage('Password must contain at least one special character');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email,
                otp,
                newPassword
            });

            setMessage('Password reset successfully! Redirecting to login...');
            setIsError(false);

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Password reset failed');
            setIsError(true);
            setOtp('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            setIsLoading(true);
            await axios.post('http://localhost:5000/api/auth/resend-otp', { email });
            setMessage('Reset code resent to your email');
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
            setMessage(err.response?.data?.message || 'Failed to resend code');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <Lock className="h-16 w-16 text-blue-500" />
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 text-white">Reset Password</h2>
                <p className="text-zinc-500 text-center mb-6 text-sm">
                    Enter the code sent to<br />
                    <span className="text-blue-400 font-semibold">{email}</span>
                </p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* OTP Input */}
                    <div>
                        <label className="block text-zinc-400 text-sm mb-2">Reset Code</label>
                        <input
                            type="text"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 text-white text-center text-2xl tracking-widest"
                            disabled={isLoading}
                        />
                    </div>

                    {/* New Password Input */}
                    <div>
                        <label className="block text-zinc-400 text-sm mb-2">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="block text-zinc-400 text-sm mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••"
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    {/* Message */}
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

                    {/* Reset Button */}
                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6 || !newPassword || !confirmPassword}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                {/* Resend OTP */}
                <div className="mt-6 text-center text-sm text-zinc-500">
                    Didn't receive code?{' '}
                    <button
                        onClick={handleResendOTP}
                        disabled={resendTimer > 0 || isLoading}
                        className="text-blue-500 hover:underline disabled:text-zinc-600 disabled:cursor-not-allowed"
                    >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                    </button>
                </div>

                <div className="mt-4 text-center text-zinc-600 text-xs">
                    <p>Code expires in 10 minutes</p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
