import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const ICONS = {
  'Dashboard':      '◈',
  'My Batches':     '⊞',
  'Announcements':  '◎',
  'Fees Management':'◉',
  'Attendance':     '◑',
  'Promote Student':'▲',
  'Profile':        '◐',
  'Enroll in Batch':'⊞',
  'Notices':        '◎',
  'Org Dashboard':  '◈',
  'Assigned Batches':'⊞',
  'Add Teachers':   '⊕',
  'Organization':   '◎',
};

const SECTION_MAP = {
  'Dashboard':       'overview',
  'My Batches':      'batches',
  'Announcements':   'communication',
  'Fees Management': 'finance',
  'Attendance':      'reports',
  'Promote Student': 'management',
  'Profile':         'account',
  'Enroll in Batch': 'batches',
  'Notices':         'communication',
  'Org Dashboard':   'overview',
  'Assigned Batches':'batches',
  'Add Teachers':    'management',
  'Organization':    'account',
};

const SECTION_LABELS = {
  overview:      'Overview',
  batches:       'Batches',
  communication: 'Communication',
  finance:       'Finance',
  reports:       'Reports',
  management:    'Management',
  account:       'Account',
};

const SECTION_ORDER = ['overview', 'batches', 'communication', 'finance', 'reports', 'management', 'account'];

function groupItems(items) {
  const groups = {};
  for (const item of items) {
    const section = SECTION_MAP[item.label] || 'overview';
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }
  return SECTION_ORDER.filter(k => groups[k]).map(k => ({
    key: k,
    label: SECTION_LABELS[k],
    items: groups[k],
  }));
}

function pickBottomNavItems(items) {
  const safe = Array.isArray(items) ? items : [];
  const byLabel = new Map(safe.map(i => [i.label, i]));

  // Mobile bottom nav: Dashboard + key actions requested.
  const preferred = [
    byLabel.get('Dashboard'),
    byLabel.get('Org Dashboard'),
    byLabel.get('My Batches'),
    byLabel.get('Assigned Batches'),
    byLabel.get('Enroll in Batch'),
    byLabel.get('Attendance'),
    byLabel.get('Promote Student'),
    byLabel.get('Fees Management'),
    byLabel.get('Announcements'),
    byLabel.get('Notices'),
  ].filter(Boolean);

  const unique = [];
  const seen = new Set();

  for (const it of preferred) {
    if (seen.has(it.path)) continue;
    seen.add(it.path);
    unique.push(it);
  }

  // Keep it clean on mobile.
  // 6 items fits on small screens (labels will truncate + tooltip on hover).
  return unique.slice(0, 6);
}

const Sidebar = ({ items }) => {
  const location = useLocation();
  const { logout, profile, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Keep layout stable by matching content offset to actual sidebar width.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--sidebar-width', collapsed ? '64px' : '228px');
    return () => {
      root.style.setProperty('--sidebar-width', '228px');
    };
  }, [collapsed]);

  const activeSection = items.find(i => i.path === location.pathname);
  const activeSectionKey = activeSection ? (SECTION_MAP[activeSection.label] || 'overview') : 'overview';

  const [openSections, setOpenSections] = useState(() => {
    const initial = new Set(['overview', activeSectionKey]);
    return initial;
  });

  const toggleSection = (key) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const displayName = profile?.firstName || profile?.name || user?.email?.split('@')[0] || 'User';
  const roleLabel =
    user?.role === 'teacher' ? 'Teacher'
      : user?.role === 'student' ? 'Student'
        : user?.role === 'org_admin' ? 'Org Admin'
          : user?.role === 'org_teacher' ? 'Org Teacher'
            : 'User';

  const sections = groupItems(items);
  const bottomItems = pickBottomNavItems(items);
  const bottomNavCount = bottomItems.length;

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">Vidya</span>
          <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{displayName[0]?.toUpperCase()}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {sections.map(section => {
            const isOpen = openSections.has(section.key);
            const hasSingleItem = section.items.length === 1;

            if (collapsed) {
              return section.items.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.path}
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                  title={item.label}
                >
                  <span className="sidebar-item-icon">{ICONS[item.label] || '·'}</span>
                </Link>
              ));
            }

            if (hasSingleItem) {
              const item = section.items[0];
              return (
                <Link
                  key={section.key}
                  to={item.path}
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="sidebar-item-icon">{ICONS[item.label] || '·'}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                </Link>
              );
            }

            return (
              <div key={section.key} className="sidebar-section">
                <button
                  type="button"
                  className={`sidebar-section-toggle ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleSection(section.key)}
                >
                  <span className="sidebar-section-label">{section.label}</span>
                  <span className="sidebar-section-chevron">{isOpen ? '▾' : '▸'}</span>
                </button>
                <div className={`sidebar-section-items ${isOpen ? 'expanded' : ''}`}>
                  <div className="sidebar-section-inner">
                    {section.items.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                      >
                        <span className="sidebar-item-icon">{ICONS[item.label] || '·'}</span>
                        <span className="sidebar-item-label">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <button className="logout-btn" onClick={logout} title="Logout">
          <span className="sidebar-item-icon">⊗</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      <nav
        className="bottom-nav"
        aria-label="Bottom navigation"
        style={{ gridTemplateColumns: `repeat(${bottomNavCount}, 1fr)` }}
      >
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            data-label={item.label}
            title={item.label}
            aria-label={item.label}
          >
            <span className="bottom-nav-icon">{ICONS[item.label] || '·'}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
