import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            return alert("Passwords do not match!");
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // If OTP verification is required, redirect to verification page
            if (response.data.requiresOTPVerification) {
                navigate('/verify-otp', {
                    state: {
                        email: formData.email,
                        username: formData.username,
                        password: formData.password
                    }
                });
            } else {
                alert("Registration successful! Please login.");
                navigate('/login');
            }
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    // Fallback SVG for onError
    const fallbackSVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
        <svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'>
          <rect width='100%' height='100%' fill='#000' rx='12' />
          <text x='50%' y='52%' fill='#fff' font-family='Verdana, Arial, sans-serif' font-size='54' font-weight='700' text-anchor='middle' alignment-baseline='middle'>SH</text>
        </svg>
    `)}`;

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6">
                    <img
                        src="Public/ShadowHowlLogo2.jpeg"
                        //alt="Shadow Howl Logo"
                        className="h-20 w-20 object-contain rounded-lg"
                        onError={(e) => { 
                            e.currentTarget.onerror = null; // Prevent infinite loop
                            e.currentTarget.src = fallbackSVG; 
                        }}
                    />
                </div>
                <h2 className="text-3xl font-bold text-center mb-2 text-white">JOIN THE PACK</h2>
                <p className="text-zinc-500 text-center mb-8 uppercase tracking-widest text-xs">Create your Shadow Howl account</p>
                
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Username Field */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                            <FontAwesomeIcon icon={faUser} />
                        </span>
                        <input 
                            name="username"
                            type="text" 
                            required
                            placeholder="Username" 
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Email Field */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                            <FontAwesomeIcon icon={faEnvelope} />
                        </span>
                        <input 
                            name="email"
                            type="email" 
                            required
                            placeholder="Email Address" 
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                            <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input 
                            name="password"
                            type="password" 
                            required
                            placeholder="Password" 
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            onChange={handleChange}
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                            <FontAwesomeIcon icon={faLock} />
                        </span>
                        <input 
                            name="confirmPassword"
                            type="password" 
                            required
                            placeholder="Confirm Password" 
                            className="w-full bg-zinc-800 border border-zinc-700 p-3 pl-10 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all mt-4">
                        CREATE ACCOUNT
                    </button>
                </form>

                <div className="mt-6 text-center text-zinc-500 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Login here</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;