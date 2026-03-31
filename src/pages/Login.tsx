import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { login } from '../api/endpoints/auth';
import { showSuccess, showError } from '../utils/alerts';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response && response.token) {
                Cookies.set('token', response.token, { expires: 7 }); // Store for 7 days
                showSuccess('Welcome back!');
                navigate('/');
            } else {
                throw new Error('Invalid response');
            }
        } catch (error: any) {
            showError(error.response?.data?.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <p className="cyber-navbar-kicker">Security Gateway</p>
                    <h1 className="cyber-standalone-title">Cleany Admin</h1>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="crud-field">
                        <span>Email Address</span>
                        <input 
                            type="email" 
                            name="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="admin@cleany.qa"
                        />
                    </div>
                    <div className="crud-field">
                        <span>Password</span>
                        <input 
                            type="password" 
                            name="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>© 2026 Cleany. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
