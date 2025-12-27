import React, { useMemo } from 'react';
import './Dashboard.css';

// Dashboard component showing CRM statistics
export default function Dashboard({ leads, onNavigate }) {
  const stats = useMemo(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // New leads this week
    const newLeadsThisWeek = leads.filter(l => 
      l.addedAt >= oneWeekAgo && l.status === 'NEW'
    ).length;
    
    // Active clients (Interested or in progress)
    const activeClients = leads.filter(l => 
      ['INTERESTED', 'CALLED', 'CALLBACK'].includes(l.status)
    ).length;
    
    // Closed deals
    const closedDeals = leads.filter(l => l.status === 'CLOSED').length;
    
    // Follow-ups due (leads with followUpDate in the past or today)
    const followUpsDue = leads.filter(l => {
      if (!l.followUpDate) return false;
      return new Date(l.followUpDate).getTime() <= now;
    }).length;
    
    // Leads by status
    const byStatus = leads.reduce((acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1;
      return acc;
    }, {});
    
    // Leads by assigned user
    const byAssignee = leads.reduce((acc, l) => {
      const assignee = l.assignedTo || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {});
    
    // Recent activity (leads updated in last 24 hours)
    const recentActivity = leads.filter(l => 
      l.lastUpdated >= oneDayAgo
    ).length;
    
    // Subscribed clients (with Stripe subscription)
    const subscribedClients = leads.filter(l => 
      l.stripeSubscriptionStatus === 'active'
    ).length;
    
    // Revenue stats
    const totalRevenue = leads.reduce((sum, l) => sum + (l.totalPaid || 0), 0);
    const monthlyRecurring = leads.reduce((sum, l) => {
      if (l.stripeSubscriptionStatus === 'active' && l.monthlyRate) {
        return sum + l.monthlyRate;
      }
      return sum;
    }, 0);
    
    // Hot leads (high rating, no website)
    const hotLeads = leads.filter(l => 
      l.status !== 'CLOSED' && 
      l.status !== 'REJECTED' && 
      !l.website && 
      (l.rating >= 4 || l.userRatingsTotal >= 50)
    ).length;
    
    return {
      newLeadsThisWeek,
      activeClients,
      closedDeals,
      followUpsDue,
      byStatus,
      byAssignee,
      recentActivity,
      subscribedClients,
      totalRevenue,
      monthlyRecurring,
      hotLeads,
      totalLeads: leads.length,
    };
  }, [leads]);

  const upcomingFollowUps = useMemo(() => {
    const now = Date.now();
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
    
    return leads
      .filter(l => l.followUpDate && new Date(l.followUpDate).getTime() <= threeDaysFromNow)
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .slice(0, 5);
  }, [leads]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
      .slice(0, 5);
  }, [leads]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Dashboard</h2>
        <p className="dashboard-subtitle">Overview of your sales pipeline</p>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.newLeadsThisWeek}</span>
            <span className="stat-label">New This Week</span>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.hotLeads}</span>
            <span className="stat-label">Hot Leads</span>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <span className="stat-value">{stats.followUpsDue}</span>
            <span className="stat-label">Follow-ups Due</span>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeClients}</span>
            <span className="stat-label">Active Clients</span>
          </div>
        </div>
        
        <div className="stat-card purple">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <span className="stat-value">{stats.closedDeals}</span>
            <span className="stat-label">Closed Deals</span>
          </div>
        </div>
        
        <div className="stat-card teal">
          <div className="stat-icon">💳</div>
          <div className="stat-content">
            <span className="stat-value">{stats.subscribedClients}</span>
            <span className="stat-label">Subscribed</span>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="revenue-section">
        <div className="revenue-card">
          <h3>💰 Revenue</h3>
          <div className="revenue-stats">
            <div className="revenue-item">
              <span className="revenue-label">Total Earned</span>
              <span className="revenue-value">${stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">Monthly Recurring</span>
              <span className="revenue-value mrr">${stats.monthlyRecurring.toLocaleString()}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-columns">
        {/* Upcoming Follow-ups */}
        <div className="dashboard-section">
          <h3>⏰ Upcoming Follow-ups</h3>
          {upcomingFollowUps.length > 0 ? (
            <ul className="follow-up-list">
              {upcomingFollowUps.map(lead => (
                <li key={lead.id} className="follow-up-item" onClick={() => onNavigate(lead)}>
                  <div className="follow-up-info">
                    <span className="follow-up-name">{lead.name}</span>
                    <span className="follow-up-date">
                      {new Date(lead.followUpDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`follow-up-status status-${lead.status.toLowerCase()}`}>
                    {lead.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No follow-ups scheduled</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="dashboard-section">
          <h3>🕐 Recent Activity</h3>
          {recentLeads.length > 0 ? (
            <ul className="recent-list">
              {recentLeads.map(lead => (
                <li key={lead.id} className="recent-item" onClick={() => onNavigate(lead)}>
                  <div className="recent-info">
                    <span className="recent-name">{lead.name}</span>
                    <span className="recent-time">
                      {formatTimeAgo(lead.lastUpdated)}
                    </span>
                  </div>
                  <span className={`recent-status status-${lead.status.toLowerCase()}`}>
                    {lead.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-message">No recent activity</p>
          )}
        </div>
      </div>

      {/* Pipeline by Status */}
      <div className="dashboard-section full-width">
        <h3>📈 Pipeline Overview</h3>
        <div className="pipeline-bars">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="pipeline-bar-container">
              <div className="pipeline-bar-label">
                <span>{status}</span>
                <span>{count}</span>
              </div>
              <div className="pipeline-bar-track">
                <div 
                  className={`pipeline-bar-fill status-${status.toLowerCase()}`}
                  style={{ width: `${(count / stats.totalLeads) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Performance */}
      <div className="dashboard-section full-width">
        <h3>👥 Team Workload</h3>
        <div className="team-grid">
          {Object.entries(stats.byAssignee).map(([name, count]) => (
            <div key={name} className="team-card">
              <div className="team-avatar">{name[0]}</div>
              <div className="team-info">
                <span className="team-name">{name}</span>
                <span className="team-count">{count} leads</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
