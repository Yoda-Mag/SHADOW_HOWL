// src/pages/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            
            // Redirect based on role
            if (res.data.user.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/feed');
            }
        } catch (err) {
            alert("Login Failed: Check credentials");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
                <div className="flex justify-center mb-6 text-blue-500">
                    <FontAwesomeIcon icon={faBolt} size="3x" />
                </div>
                <h2 className="text-3xl font-bold text-center mb-2">SHADOW HOWL</h2>
                <p className="text-zinc-500 text-center mb-8 uppercase tracking-widest text-xs">AI Signal Platform</p>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg focus:outline-none focus:border-blue-500"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition-all">
                        LOGIN TO SYSTEM
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;