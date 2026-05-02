import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { colors, typography, spacing, shadow, touchTarget } from '../theme';

const navItems: Record<string, { icon: string; label: string; path: string }[]> = {
  commander: [
    { icon: '📊', label: 'Dashboard', path: '/commander' },
    { icon: '📋', label: 'Tasks', path: '/tasks' },
    { icon: '💬', label: 'Messages', path: '/messages' },
  ],
  helper: [
    { icon: '📋', label: 'My Tasks', path: '/helper' },
    { icon: '💬', label: 'Messages', path: '/messages' },
  ],
  observer: [
    { icon: '📍', label: 'Status', path: '/observer' },
    { icon: '📜', label: 'Feed', path: '/messages' },
  ],
};

export function NavBar() {
  const { currentUser } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const items = navItems[currentUser.role] || navItems.commander;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: touchTarget.min + 16,
      background: colors.card,
      borderTop: `1px solid ${colors.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      boxShadow: `0 -2px 8px ${colors.shadow}`,
      zIndex: 100,
    }}>
      {items.map(item => {
        const isActive = location.pathname === item.path ||
          (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard'));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: `${spacing.sm} ${spacing.md}`,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.6,
              minHeight: touchTarget.min,
            }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={{
              ...typography.small,
              color: isActive ? colors.primary : colors.textSecondary,
              fontWeight: isActive ? 600 : 400,
            }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
