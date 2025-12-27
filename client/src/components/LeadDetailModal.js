import React, { useState } from 'react';
import ContactTimeline from './ContactTimeline';
import StripeBilling from './StripeBilling';
import './LeadDetailModal.css';

// Default Lead status options (used if not provided via props)
const DEFAULT_LEAD_STATUSES = [
  { value: 'NEW', label: '🆕 New', color: '#3b82f6' },
  { value: 'CALLED', label: '📞 Called', color: '#eab308' },
  { value: 'CALLBACK', label: '🔄 Callback', color: '#f97316' },
  { value: 'REJECTED', label: '❌ Rejected', color: '#ef4444' },
  { value: 'INTERESTED', label: '✅ Interested', color: '#22c55e' },
  { value: 'CLOSED', label: '🏆 Closed', color: '#a855f7' },
];

// Lead tags
const LEAD_TAGS = [
  { value: 'NO_WEBSITE', label: '🚫 No Website', color: '#f97316' },
  { value: 'NO_PHONE', label: '📵 No Phone', color: '#ef4444' },
  { value: 'HOT_LEAD', label: '🔥 Hot Lead', color: '#22c55e' },
  { value: 'LOW_REVIEWS', label: '⭐ Low Reviews', color: '#eab308' },
  { value: 'HIGH_POTENTIAL', label: '💎 High Potential', color: '#06b6d4' },
  { value: 'NEEDS_SEO', label: '🔍 Needs SEO', color: '#a855f7' },
  { value: 'LOCAL_BUSINESS', label: '📍 Local Business', color: '#2a9d8f' },
];

const DEFAULT_TEAM_MEMBERS = ['Javi', 'Iamiah'];

export default function LeadDetailModal({ 
  lead, 
  statuses = DEFAULT_LEAD_STATUSES,
  teamMembers = DEFAULT_TEAM_MEMBERS,
  currentUser,
  onClose, 
  onUpdate, 
  onStatusChange,
  onLogCall,
  onDelete,
  onZoom,
  canEdit = true,
  canDelete = true
}) {
  const [activeTab, setActiveTab] = useState('details');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [email, setEmail] = useState(lead.email || '');
  const [editingEmail, setEditingEmail] = useState(false);

  const handleStatusChange = (status) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      onUpdate({ status, lastUpdated: Date.now() });
    }
  };

  const handleTagToggle = (tagValue) => {
    const currentTags = lead.tags || [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter(t => t !== tagValue)
      : [...currentTags, tagValue];
    onUpdate({ tags: newTags, lastUpdated: Date.now() });
  };

  const handleAssign = (assignee) => {
    onUpdate({ assignedTo: assignee, lastUpdated: Date.now() });
  };

  const handleSaveNotes = () => {
    onUpdate({ notes, lastUpdated: Date.now() });
    setEditingNotes(false);
  };

  const handleSaveEmail = () => {
    onUpdate({ email, lastUpdated: Date.now() });
    setEditingEmail(false);
  };

  const handleAddActivity = (activity) => {
    const activities = lead.activities || [];
    onUpdate({ 
      activities: [...activities, activity],
      lastUpdated: Date.now() 
    });
  };

  const handleSetFollowUp = (followUpDate) => {
    onUpdate({ followUpDate, lastUpdated: Date.now() });
  };

  // Auto-detect tags based on lead data
  const autoTags = [];
  if (!lead.website) autoTags.push('NO_WEBSITE');
  if (!lead.phone) autoTags.push('NO_PHONE');
  if (lead.rating >= 4.5 && lead.userRatingsTotal >= 100) autoTags.push('HOT_LEAD');
  if (lead.userRatingsTotal < 20) autoTags.push('LOW_REVIEWS');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lead-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{lead.name}</h2>
            <p className="modal-address">{lead.address}</p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-buttons">
            {statuses.map(status => (
              <button
                key={status.value}
                className={`status-btn ${lead.status === status.value ? 'active' : ''}`}
                style={{ 
                  '--status-color': status.color,
                  backgroundColor: lead.status === status.value ? status.color : undefined
                }}
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Details
          </button>
          <button 
            className={`modal-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            📞 Timeline
            {(lead.activities?.length || 0) > 0 && (
              <span className="tab-badge">{lead.activities.length}</span>
            )}
          </button>
          <button 
            className={`modal-tab ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            💳 Billing
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-body">
          {activeTab === 'details' && (
            <div className="details-tab">
              {/* Contact Info */}
              <div className="detail-section">
                <h4>📞 Contact Information</h4>
                <div className="contact-grid">
                  <div className="contact-item">
                    <span className="contact-label">Phone</span>
                    {lead.phone ? (
                      <a href={`tel:${lead.phone}`} className="contact-value link">
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="contact-value empty">Not available</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Email</span>
                    {editingEmail ? (
                      <div className="inline-edit">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email..."
                        />
                        <button onClick={handleSaveEmail}>Save</button>
                      </div>
                    ) : (
                      <div className="editable-field" onClick={() => setEditingEmail(true)}>
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="contact-value link">
                            {lead.email}
                          </a>
                        ) : (
                          <span className="contact-value empty">Click to add</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Website</span>
                    {lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="contact-value link">
                        {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    ) : (
                      <span className="contact-value empty hot">No website! 🔥</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <span className="contact-label">Reviews</span>
                    <span className="contact-value">
                      {lead.rating ? `⭐ ${lead.rating}` : 'N/A'} ({lead.userRatingsTotal || 0} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              <div className="detail-section">
                <h4>👤 Assignment</h4>
                <div className="assignment-buttons">
                  {teamMembers.map(member => (
                    <button
                      key={member}
                      className={`assign-btn ${lead.assignedTo === member ? 'active' : ''}`}
                      onClick={() => handleAssign(member)}
                    >
                      {member}
                    </button>
                  ))}
                  {lead.assignedTo && (
                    <button
                      className="assign-btn unassign"
                      onClick={() => handleAssign('')}
                    >
                      Unassign
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="detail-section">
                <h4>🏷️ Tags</h4>
                <div className="tags-grid">
                  {LEAD_TAGS.map(tag => {
                    const isAuto = autoTags.includes(tag.value);
                    const isManual = (lead.tags || []).includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        className={`tag-btn ${isAuto || isManual ? 'active' : ''} ${isAuto ? 'auto' : ''}`}
                        style={{ '--tag-color': tag.color }}
                        onClick={() => handleTagToggle(tag.value)}
                      >
                        {tag.label}
                        {isAuto && <span className="auto-badge">auto</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="detail-section">
                <div className="section-header">
                  <h4>📝 Notes</h4>
                  {!editingNotes && (
                    <button className="edit-btn" onClick={() => setEditingNotes(true)}>
                      Edit
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="notes-editor">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this lead..."
                      rows={4}
                    />
                    <div className="notes-actions">
                      <button className="cancel-btn" onClick={() => {
                        setNotes(lead.notes || '');
                        setEditingNotes(false);
                      }}>Cancel</button>
                      <button className="save-btn" onClick={handleSaveNotes}>Save</button>
                    </div>
                  </div>
                ) : (
                  <p className="notes-display">
                    {lead.notes || 'No notes yet. Click Edit to add some.'}
                  </p>
                )}
              </div>

              {/* Meta Info */}
              <div className="meta-info">
                <span>Added by {lead.addedBy || 'Unknown'} on {new Date(lead.addedAt).toLocaleDateString()}</span>
                <span>Last updated {formatTimeAgo(lead.lastUpdated)}</span>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <ContactTimeline
              lead={lead}
              onAddActivity={handleAddActivity}
              onSetFollowUp={handleSetFollowUp}
            />
          )}

          {activeTab === 'billing' && (
            <StripeBilling 
              lead={lead}
              onUpdate={onUpdate}
            />
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {onZoom && (
            <button className="zoom-btn" onClick={onZoom}>
              📍 Zoom to Map
            </button>
          )}
          <button className="maps-btn" onClick={() => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`, '_blank');
          }}>
            🗺️ View on Maps
          </button>
          {canDelete && (
            <button className="delete-btn" onClick={() => {
              if (window.confirm('Delete this lead? This cannot be undone.')) {
                onDelete(lead.id);
                onClose();
              }
            }}>
              🗑️ Delete Lead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
