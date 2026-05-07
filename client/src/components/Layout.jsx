import { useState, createContext, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import {
  MessageSquare, LogOut, Menu, X, Moon, Sun,
  ShieldAlert, AlertTriangle, CheckSquare, DollarSign,
  Calendar, BookOpen, CheckCircle,
} from 'lucide-react';

export const ThemeContext = createContext({ dark: false });
export const useTheme = () => useContext(ThemeContext);

export const useDarkMode = () => {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);
  const toggle = () =>
    setDark(prev => {
      const next = !prev;
      try { localStorage.setItem('darkMode', String(next)); } catch {}
      return next;
    });
  return [dark, toggle];
};

const Sidebar = ({ dark, toggleDark }) => {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebarCollapsed') === 'true'; } catch { return false; }
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [overdueCnt,    setOverdueCnt]    = useState(0);
  const [pendingRevCnt, setPendingRevCnt] = useState(0);

  useEffect(() => {
    if (!user) return;
    api.get('/stats/progress').then(r => {
      setOverdueCnt(r.data.overdue || 0);
    }).catch(() => {});
    if (user.role === 'admin' || user.role === 'parent') {
      api.get('/submissions').then(r => {
        const subs = Array.isArray(r.data) ? r.data : [];
        setPendingRevCnt(subs.filter(s => s.status === 'pending_review').length);
      }).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => { await logout(); navigate('/login'); };
  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('sidebarCollapsed', String(next)); } catch {}
  };

  const isActive = (to) =>
    location.pathname === to || location.pathname.startsWith(to + '/');

  const roleLabel = { admin: 'Admin', parent: 'Parent', student: 'Student' };
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const NAV_LINKS = [
    { to: '/dashboard',  icon: CheckSquare,   label: 'Dashboard',  badge: overdueCnt > 0 ? overdueCnt : 0 },
    { to: '/week',       icon: Calendar,      label: 'All Tasks',  badge: 0 },
    { to: '/completed',  icon: CheckCircle,   label: 'Completed',  badge: 0 },
    { to: '/analytics',  icon: DollarSign,    label: 'Analytics',  badge: 0 },
    { to: '/notes',      icon: MessageSquare, label: 'Notes',      badge: pendingRevCnt > 0 && (user?.role === 'admin' || user?.role === 'parent') ? pendingRevCnt : 0 },
    { to: '/trackers',   icon: BookOpen,      label: 'Trackers',   badge: 0 },
  ];

  return (
    <aside className={[
      'sidebar h-screen flex flex-col relative z-20',
      collapsed ? 'sidebar--collapsed' : 'sidebar--expanded',
    ].join(' ')}>

      {/* Brand */}
      <div className="sidebar__brand">
        {!collapsed && (
          <div className="sidebar__wordmark">
            <span className="sidebar__prose-label">TRACKER</span>
          </div>
        )}
        <button onClick={handleToggle} className="sidebar__toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <Menu size={14} /> : <X size={14} />}
        </button>
      </div>

      {/* User info strip */}
      {!collapsed && user && (
        <div style={{
          padding: '0.5rem 0.875rem 0.6rem',
          borderBottom: '1px solid var(--color-divider)',
          marginBottom: '0.25rem',
        }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
            {firstName}
          </div>
          <div style={{
            display: 'inline-block', marginTop: '0.2rem',
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            background: user.role === 'admin'
              ? 'var(--color-error-highlight)'
              : user.role === 'parent'
                ? 'var(--color-gold-highlight)'
                : 'var(--color-surface-offset)',
            color: user.role === 'admin'
              ? 'var(--color-error)'
              : user.role === 'parent'
                ? 'var(--color-gold)'
                : 'var(--color-text-muted)',
            padding: '0.1rem 0.45rem',
          }}>
            {roleLabel[user.role] || user.role}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar__nav" style={{ flex: 1 }} aria-label="Main navigation">
        {NAV_LINKS.map(({ to, icon: Icon, label, badge }) => (
          <Link
            key={to}
            to={to}
            className={['sidebar__link', isActive(to) ? 'sidebar__link--active' : ''].join(' ')}
            title={collapsed ? label : undefined}
            style={{ position: 'relative' }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <Icon size={14} className="sidebar__link-icon" />
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -6,
                  fontSize: '0.5rem', fontWeight: 800,
                  background: 'var(--color-error)', color: '#fff',
                  borderRadius: 99, minWidth: 12, height: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 0.2rem', lineHeight: 1,
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            {!collapsed && <span className="sidebar__link-label">{label}</span>}
            {!collapsed && badge > 0 && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '0.55rem', fontWeight: 800,
                background: 'var(--color-error)', color: '#fff',
                borderRadius: 99, minWidth: 16, height: 16,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 0.3rem',
              }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        {(user?.role === 'admin' || user?.role === 'parent') && (
          <Link
            to="/admin"
            className={['sidebar__link', location.pathname.startsWith('/admin') ? 'sidebar__link--active' : ''].join(' ')}
            title={collapsed ? 'Admin' : undefined}
            style={{ marginTop: 'auto', borderTop: '1px solid var(--color-divider)' }}
          >
            <ShieldAlert size={14} className="sidebar__link-icon" />
            {!collapsed && <span className="sidebar__link-label">Admin</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <button onClick={toggleDark} className="sidebar__util-btn"
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark
            ? <Sun  size={14} className="flex-shrink-0" />
            : <Moon size={14} className="flex-shrink-0" />}
          {!collapsed && <span>{dark ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <button onClick={handleLogout} className="sidebar__util-btn sidebar__util-btn--danger" title="Sign out">
          <LogOut size={14} className="flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
};

const DisabledWall = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', padding: '2rem',
      textAlign: 'center', background: 'var(--color-bg)', color: 'var(--color-text)',
    }}>
      <AlertTriangle size={40} style={{ color: 'var(--color-error)', marginBottom: '1.25rem' }} />
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '0.75rem' }}>
        Account Disabled
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', maxWidth: '38ch', lineHeight: 1.7, marginBottom: '1.75rem' }}>
        Your account has been disabled. Contact Arpit for access.
      </p>
      <button onClick={handleLogout} className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
};

const Layout = ({ children, noPadding = false }) => {
  const [dark, toggleDark] = useDarkMode();
  const { user } = useAuth();

  if (user && user.disabled && user.role !== 'admin') {
    return (
      <ThemeContext.Provider value={{ dark }}>
        <DisabledWall />
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ dark }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar dark={dark} toggleDark={toggleDark} />
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            paddingTop:    noPadding ? 0 : '1%',
            paddingBottom: 0,
            paddingInline: noPadding ? 0 : '3%',
          }}
        >
          {children}
        </main>
      </div>
    </ThemeContext.Provider>
  );
};

export default Layout;
