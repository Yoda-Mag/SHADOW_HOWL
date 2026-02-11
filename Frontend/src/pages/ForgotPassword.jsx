import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
        
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            
            setMessage('Reset OTP sent to your email');
            setIsError(false);

            // Redirect to reset password page after 2 seconds
            setTimeout(() => {
                navigate('/reset-password', { state: { email } });
            }, 2000);
        } catch (err) {
            setMessage(err.response?.data?.message || 'Failed to send reset email');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <Mail className="h-16 w-16 text-blue-500" />
                </div>

                <h2 className="text-3xl font-bold text-center mb-2 text-white">Forgot Password?</h2>
                <p className="text-zinc-500 text-center mb-6 text-sm">
                    {/* FIX: Wrapped text in {} to handle the apostrophe in "we'll" */}
                    {"Enter your email address and we'll send you a code to reset your password"}
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-sm mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            disabled={isLoading}
                            required
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
                        disabled={isLoading || !email}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-zinc-500 space-y-2">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login" className="text-blue-500 hover:underline">
                            Login here
                        </Link>
                    </p>
                    <p>
                        {/* FIX: Wrapped text in {} to handle the apostrophe in "Don't" */}
                        {"Don't have an account? "}{' '}
                        <Link to="/register" className="text-blue-500 hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;