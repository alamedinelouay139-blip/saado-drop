import React, { useState } from 'react';
import { X, Lock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AdminLoginModal.css';

export const AdminLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay animate-fade-in">
      <div className="admin-modal-backdrop" onClick={onClose}></div>

      <div className="admin-modal-card surface-card">
        <div className="admin-modal-header">
          <div className="modal-icon-badge">
            <Lock size={20} className="text-gold" />
          </div>
          <h3>ATELIER ADMIN PORTAL</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-error-banner">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Admin Username</label>
            <input
              type="text"
              required
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-gold login-submit-btn" disabled={loading}>
            {loading ? 'AUTHENTICATING...' : 'ENTER DASHBOARD'}
          </button>
        </form>
      </div>
    </div>
  );
};
