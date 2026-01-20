import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import './assets/styles/index.css';
// We will build these next:
// import Feed from './pages/Feed'; 
// import AdminDashboard from './pages/AdminDashboard';

// Helper to check if user is authenticated
const ProtectedRoute = ({ children, roleRequired }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    
    if (roleRequired && userRole !== roleRequired) {
        return <Navigate to="/feed" />; // Redirect users away from Admin pages
    }

    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Subscriber Routes */}
                <Route path="/feed" element={
                    <ProtectedRoute>
                        <div className="p-10 text-white">Signal Feed Coming Soon...</div>
                    </ProtectedRoute>
                } />

                {/* Admin Only Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute roleRequired="admin">
                        <div className="p-10 text-white">Admin Dashboard Coming Soon...</div>
                    </ProtectedRoute>
                } />

                {/* Default Route */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;