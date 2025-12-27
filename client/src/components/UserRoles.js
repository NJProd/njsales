import React, { useState, useEffect } from 'react';
import './UserRoles.css';

// User roles with their permissions
const ROLES = {
  admin: {
    label: '👑 Admin',
    color: '#a855f7',
    permissions: [
      'view_all_leads',
      'edit_all_leads',
      'delete_leads',
      'assign_leads',
      'view_dashboard',
      'manage_team',
      'export_data',
      'access_settings',
      'view_billing',
      'manage_subscriptions'
    ]
  },
  sales_rep: {
    label: '💼 Sales Rep',
    color: '#2a9d8f',
    permissions: [
      'view_assigned_leads',
      'view_unassigned_leads',
      'edit_assigned_leads',
      'log_activities',
      'view_dashboard',
      'export_own_data'
    ]
  }
};

// Default team configuration
const DEFAULT_TEAM = [
  { id: 'javi', name: 'Javi', role: 'admin', email: '', avatar: '👨‍💼' },
  { id: 'iamiah', name: 'Iamiah', role: 'admin', email: '', avatar: '👨‍💻' },
];

export function useUserRole() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('crmUser');
    return stored ? JSON.parse(stored) : null;
  });

  const [team, setTeam] = useState(() => {
    const stored = localStorage.getItem('crmTeam');
    return stored ? JSON.parse(stored) : DEFAULT_TEAM;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('crmUser', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('crmTeam', JSON.stringify(team));
  }, [team]);

  const login = (userId) => {
    const user = team.find(m => m.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('userName', user.name);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crmUser');
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = ROLES[currentUser.role];
    return role?.permissions.includes(permission) || false;
  };

  const isAdmin = () => currentUser?.role === 'admin';

  const canViewLead = (lead) => {
    if (!currentUser) return false;
    if (hasPermission('view_all_leads')) return true;
    if (hasPermission('view_assigned_leads') && lead.assignedTo === currentUser.name) return true;
    if (hasPermission('view_unassigned_leads') && !lead.assignedTo) return true;
    return false;
  };

  const canEditLead = (lead) => {
    if (!currentUser) return false;
    if (hasPermission('edit_all_leads')) return true;
    if (hasPermission('edit_assigned_leads') && lead.assignedTo === currentUser.name) return true;
    return false;
  };

  const canDeleteLead = () => hasPermission('delete_leads');

  const addTeamMember = (member) => {
    const newMember = {
      id: member.name.toLowerCase().replace(/\s+/g, '_'),
      name: member.name,
      role: member.role || 'sales_rep',
      email: member.email || '',
      avatar: member.avatar || '👤',
      addedAt: Date.now()
    };
    setTeam(prev => [...prev, newMember]);
    return newMember;
  };

  const updateTeamMember = (id, updates) => {
    setTeam(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeTeamMember = (id) => {
    if (id === currentUser?.id) return false; // Can't remove yourself
    setTeam(prev => prev.filter(m => m.id !== id));
    return true;
  };

  return {
    currentUser,
    team,
    login,
    logout,
    hasPermission,
    isAdmin,
    canViewLead,
    canEditLead,
    canDeleteLead,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    ROLES
  };
}

// User Login Selector Component
export function UserLoginSelector({ team, onLogin }) {
  return (
    <div className="user-login-selector">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="NJ Developments" className="login-logo" />
          <h2>NJ Developments CRM</h2>
          <p>Select your profile to continue</p>
        </div>
        <div className="team-grid">
          {team.map(member => (
            <button
              key={member.id}
              className="team-member-btn"
              onClick={() => onLogin(member.id)}
            >
              <span className="member-avatar">{member.avatar}</span>
              <span className="member-name">{member.name}</span>
              <span className="member-role" style={{ color: ROLES[member.role]?.color }}>
                {ROLES[member.role]?.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Team Management Panel Component (Admin only)
export function TeamManagementPanel({ team, currentUser, onAddMember, onUpdateMember, onRemoveMember }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('sales_rep');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    
    onAddMember({
      name: newMemberName.trim(),
      role: newMemberRole,
      email: newMemberEmail.trim()
    });
    
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('sales_rep');
    setShowAddForm(false);
  };

  return (
    <div className="team-management-panel">
      <div className="panel-header">
        <h3>👥 Team Management</h3>
        <button 
          className="add-member-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAddForm && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
          </div>
          <div className="form-row">
            <select
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
            >
              {Object.entries(ROLES).map(([key, role]) => (
                <option key={key} value={key}>{role.label}</option>
              ))}
            </select>
            <button type="submit" className="submit-btn">Add Team Member</button>
          </div>
        </form>
      )}

      <div className="team-list">
        {team.map(member => (
          <div key={member.id} className="team-member-row">
            <div className="member-info">
              <span className="member-avatar">{member.avatar}</span>
              <div className="member-details">
                <span className="member-name">
                  {member.name}
                  {member.id === currentUser?.id && <span className="you-badge">(You)</span>}
                </span>
                <span className="member-email">{member.email || 'No email'}</span>
              </div>
            </div>
            <div className="member-actions">
              <select
                value={member.role}
                onChange={(e) => onUpdateMember(member.id, { role: e.target.value })}
                disabled={member.id === currentUser?.id}
                style={{ color: ROLES[member.role]?.color }}
              >
                {Object.entries(ROLES).map(([key, role]) => (
                  <option key={key} value={key}>{role.label}</option>
                ))}
              </select>
              {member.id !== currentUser?.id && (
                <button
                  className="remove-btn"
                  onClick={() => {
                    if (window.confirm(`Remove ${member.name} from the team?`)) {
                      onRemoveMember(member.id);
                    }
                  }}
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="permissions-info">
        <h4>📋 Role Permissions</h4>
        <div className="roles-grid">
          {Object.entries(ROLES).map(([key, role]) => (
            <div key={key} className="role-card" style={{ '--role-color': role.color }}>
              <h5>{role.label}</h5>
              <ul>
                {role.permissions.map(perm => (
                  <li key={perm}>{perm.replace(/_/g, ' ')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Current User Badge Component
export function UserBadge({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const role = ROLES[user.role];

  return (
    <div className="user-badge">
      <button className="user-badge-btn" onClick={() => setShowMenu(!showMenu)}>
        <span className="badge-avatar">{user.avatar}</span>
        <span className="badge-name">{user.name}</span>
        <span className="badge-role" style={{ background: role?.color }}>{role?.label}</span>
      </button>
      
      {showMenu && (
        <div className="user-menu">
          <div className="menu-header">
            <span className="menu-avatar">{user.avatar}</span>
            <div>
              <span className="menu-name">{user.name}</span>
              <span className="menu-role" style={{ color: role?.color }}>{role?.label}</span>
            </div>
          </div>
          <div className="menu-divider" />
          <button className="menu-item" onClick={onLogout}>
            🚪 Switch User
          </button>
        </div>
      )}
    </div>
  );
}
