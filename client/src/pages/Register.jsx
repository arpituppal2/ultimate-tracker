import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();
  const { register }          = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName:  formData.lastName.trim(),
        email:     formData.email.trim(),
        password:  formData.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const field = (label, name, type = 'text', extra = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <label className="section-label">{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className="input-base"
        {...extra}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: 'var(--space-4)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ marginBottom: 'var(--space-8)' }}>
          <span className="gold-rule" style={{ marginBottom: 'var(--space-3)' }} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            Ultimate Tracker
          </h1>
          <p style={{
            marginTop: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-faint)',
          }}>
            Create account
          </p>
        </div>

        <div className="surface-card" style={{ overflow: 'hidden' }}>
          <form
            onSubmit={handleSubmit}
            style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          >
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-error-highlight)',
                border: '1px solid var(--color-error)',
                color: 'var(--color-error)',
                fontSize: 'var(--text-sm)',
                borderRadius: 'var(--radius-md)',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {field('First name', 'firstName', 'text', { autoFocus: true, required: true })}
              {field('Last name',  'lastName',  'text', { required: true })}
            </div>

            {field('Email', 'email', 'email', { placeholder: 'your@email.com', required: true })}

            <div style={{ borderTop: '1px solid var(--color-border)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              {field('Password',         'password',        'password', { placeholder: 'Min. 6 characters', required: true })}
              {field('Confirm password', 'confirmPassword', 'password', { placeholder: 'Re-enter',          required: true })}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: 'var(--space-1)', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating account…</> : 'Create account'}
            </button>
          </form>

          <div style={{
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="link-accent">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
