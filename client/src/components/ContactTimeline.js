import React, { useState } from 'react';
import './ContactTimeline.css';

// Contact action types
const ACTION_TYPES = [
  { value: 'CALL', label: '📞 Call', icon: '📞' },
  { value: 'EMAIL', label: '📧 Email', icon: '📧' },
  { value: 'SMS', label: '💬 SMS', icon: '💬' },
  { value: 'MEETING', label: '🤝 Meeting', icon: '🤝' },
  { value: 'PROPOSAL', label: '📄 Proposal Sent', icon: '📄' },
  { value: 'FORM', label: '📝 Form Submitted', icon: '📝' },
  { value: 'PAYMENT', label: '💳 Payment', icon: '💳' },
  { value: 'NOTE', label: '📌 Note', icon: '📌' },
];

// Call outcomes
const CALL_OUTCOMES = [
  { value: 'ANSWERED', label: 'Answered' },
  { value: 'VOICEMAIL', label: 'Voicemail' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'WRONG_NUMBER', label: 'Wrong Number' },
];

export default function ContactTimeline({ lead, onAddActivity, onSetFollowUp }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activityType, setActivityType] = useState('CALL');
  const [callOutcome, setCallOutcome] = useState('ANSWERED');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  const activities = lead.activities || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const activity = {
      id: `act_${Date.now()}`,
      type: activityType,
      outcome: activityType === 'CALL' ? callOutcome : null,
      notes: notes.trim(),
      timestamp: Date.now(),
      createdBy: localStorage.getItem('userName') || 'Unknown',
    };
    
    onAddActivity(activity);
    
    // Set follow-up if provided
    if (followUpDate) {
      const followUpDateTime = followUpTime 
        ? `${followUpDate}T${followUpTime}` 
        : `${followUpDate}T09:00`;
      onSetFollowUp(followUpDateTime);
    }
    
    // Reset form
    setNotes('');
    setFollowUpDate('');
    setFollowUpTime('');
    setShowAddForm(false);
  };

  return (
    <div className="contact-timeline">
      <div className="timeline-header">
        <h3>📋 Contact Timeline</h3>
        <button 
          className="add-activity-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '✕ Cancel' : '+ Log Activity'}
        </button>
      </div>

      {/* Follow-up Banner */}
      {lead.followUpDate && (
        <div className={`follow-up-banner ${new Date(lead.followUpDate) <= new Date() ? 'overdue' : ''}`}>
          <span className="follow-up-icon">⏰</span>
          <div className="follow-up-content">
            <span className="follow-up-label">Follow-up scheduled</span>
            <span className="follow-up-datetime">
              {new Date(lead.followUpDate).toLocaleString()}
            </span>
          </div>
          <button 
            className="follow-up-complete"
            onClick={() => onSetFollowUp(null)}
          >
            ✓ Complete
          </button>
        </div>
      )}

      {/* Add Activity Form */}
      {showAddForm && (
        <form className="activity-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Activity Type</label>
            <div className="activity-type-grid">
              {ACTION_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  className={`activity-type-btn ${activityType === type.value ? 'active' : ''}`}
                  onClick={() => setActivityType(type.value)}
                >
                  <span className="activity-type-icon">{type.icon}</span>
                  <span className="activity-type-label">{type.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {activityType === 'CALL' && (
            <div className="form-row">
              <label>Call Outcome</label>
              <div className="outcome-buttons">
                {CALL_OUTCOMES.map(outcome => (
                  <button
                    key={outcome.value}
                    type="button"
                    className={`outcome-btn ${callOutcome === outcome.value ? 'active' : ''}`}
                    onClick={() => setCallOutcome(outcome.value)}
                  >
                    {outcome.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-row">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened? Any important details..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <label>Schedule Follow-up (optional)</label>
            <div className="follow-up-inputs">
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
              <input
                type="time"
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="submit-activity-btn">
            Log Activity
          </button>
        </form>
      )}

      {/* Timeline */}
      <div className="timeline">
        {activities.length > 0 ? (
          activities
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(activity => (
              <div key={activity.id} className="timeline-item">
                <div className="timeline-icon">
                  {ACTION_TYPES.find(t => t.value === activity.type)?.icon || '📌'}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header-row">
                    <span className="timeline-type">
                      {ACTION_TYPES.find(t => t.value === activity.type)?.label || activity.type}
                    </span>
                    {activity.outcome && (
                      <span className={`timeline-outcome outcome-${activity.outcome.toLowerCase()}`}>
                        {CALL_OUTCOMES.find(o => o.value === activity.outcome)?.label || activity.outcome}
                      </span>
                    )}
                  </div>
                  {activity.notes && (
                    <p className="timeline-notes">{activity.notes}</p>
                  )}
                  <div className="timeline-meta">
                    <span className="timeline-time">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                    <span className="timeline-author">by {activity.createdBy}</span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="timeline-empty">
            <span className="empty-icon">📭</span>
            <p>No activity logged yet</p>
            <p className="empty-hint">Click "Log Activity" to record your first interaction</p>
          </div>
        )}

        {/* Lead Created Event */}
        {lead.addedAt && (
          <div className="timeline-item timeline-created">
            <div className="timeline-icon">🎯</div>
            <div className="timeline-content">
              <span className="timeline-type">Lead Created</span>
              <div className="timeline-meta">
                <span className="timeline-time">
                  {new Date(lead.addedAt).toLocaleString()}
                </span>
                <span className="timeline-author">by {lead.addedBy || 'System'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
