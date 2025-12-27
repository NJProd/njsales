import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToLeads, updateFirebaseLead, deleteLead } from './firebase';
import './SpreadsheetPage.css';

// Lead status options
const LEAD_STATUSES = ['NEW', 'CALLED', 'CALLBACK', 'INTERESTED', 'REJECTED', 'CLOSED'];

const SpreadsheetPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editValue, setEditValue] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'lastUpdated', direction: 'desc' });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    addedBy: 'all',
    date: 'all'
  });
  const [currentUser, setCurrentUser] = useState(null);
  const inputRef = useRef(null);

  // Load current user
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Subscribe to Firebase leads
  useEffect(() => {
    const unsubscribe = subscribeToLeads((firebaseLeads) => {
      setLeads(firebaseLeads);
    });
    return unsubscribe;
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Get date threshold
  const getDateThreshold = (period) => {
    const now = new Date();
    switch (period) {
      case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      case 'week': return now.getTime() - 7 * 24 * 60 * 60 * 1000;
      case 'month': return now.getTime() - 30 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  };

  // Get unique team members
  const teamMembers = [...new Set(leads.map(l => l.addedBy).filter(Boolean))];

  // Filter and sort leads
  const filteredLeads = React.useMemo(() => {
    let result = [...leads];

    // Search
    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(lead =>
        lead.name?.toLowerCase().includes(query) ||
        lead.address?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(lead => lead.status === filters.status);
    }

    // Added by filter
    if (filters.addedBy !== 'all') {
      result = result.filter(lead => lead.addedBy === filters.addedBy);
    }

    // Date filter
    if (filters.date !== 'all') {
      const threshold = getDateThreshold(filters.date);
      result = result.filter(lead => (lead.lastUpdated || lead.addedAt) >= threshold);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'calls') {
        valA = a.callHistory?.length || 0;
        valB = b.callHistory?.length || 0;
      }

      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' 
          ? (valA || '').localeCompare(valB || '')
          : (valB || '').localeCompare(valA || '');
      }
      
      return sortConfig.direction === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    return result;
  }, [leads, filters, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Start editing a cell
  const startEdit = (lead, field) => {
    setEditingCell({ id: lead.id, field });
    setEditValue(lead[field] || '');
  };

  // Save cell edit
  const saveEdit = useCallback(() => {
    if (!editingCell) return;
    
    const lead = leads.find(l => l.id === editingCell.id);
    if (lead && lead[editingCell.field] !== editValue) {
      updateFirebaseLead(editingCell.id, {
        [editingCell.field]: editValue,
        lastUpdated: Date.now()
      });
    }
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, leads]);

  // Handle keyboard in edit mode
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
      // Move to next cell logic could be added here
    }
  };

  // Update status
  const updateStatus = (leadId, newStatus) => {
    updateFirebaseLead(leadId, {
      status: newStatus,
      lastUpdated: Date.now()
    });
  };

  // Toggle row selection
  const toggleRowSelection = (id) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all
  const selectAll = () => {
    if (selectedRows.size === filteredLeads.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredLeads.map(l => l.id)));
    }
  };

  // Bulk delete
  const bulkDelete = () => {
    if (selectedRows.size === 0) return;
    if (!window.confirm(`Delete ${selectedRows.size} leads?`)) return;
    
    selectedRows.forEach(id => deleteLead(id));
    setSelectedRows(new Set());
  };

  // Bulk status change
  const bulkStatusChange = (status) => {
    selectedRows.forEach(id => {
      updateFirebaseLead(id, { status, lastUpdated: Date.now() });
    });
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Column definitions
  const columns = [
    { key: 'select', label: '', width: 40 },
    { key: 'name', label: 'Business Name', width: 200, editable: true, sortable: true },
    { key: 'phone', label: 'Phone', width: 130, editable: true, sortable: true },
    { key: 'address', label: 'Address', width: 250, editable: true, sortable: true },
    { key: 'status', label: 'Status', width: 120, sortable: true },
    { key: 'notes', label: 'Notes', width: 200, editable: true },
    { key: 'addedBy', label: 'Added By', width: 100, sortable: true },
    { key: 'calls', label: 'Calls', width: 60, sortable: true },
    { key: 'lastUpdated', label: 'Last Updated', width: 140, sortable: true },
    { key: 'actions', label: '', width: 80 }
  ];

  return (
    <div className="spreadsheet-page">
      {/* Header */}
      <header className="spreadsheet-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/crm')}>← Back to CRM</button>
          <h1>📑 Team Sheet</h1>
          <span className="row-count">{filteredLeads.length} leads</span>
        </div>
        <div className="header-right">
          {currentUser && (
            <span className="current-user">👤 {currentUser.name}</span>
          )}
        </div>
      </header>

      {/* Toolbar */}
      <div className="spreadsheet-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            placeholder="🔍 Search..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All Statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={filters.addedBy} 
            onChange={(e) => setFilters(prev => ({ ...prev, addedBy: e.target.value }))}
          >
            <option value="all">All Members</option>
            {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select 
            value={filters.date} 
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div className="toolbar-right">
          {selectedRows.size > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">{selectedRows.size} selected</span>
              <select onChange={(e) => { if (e.target.value) { bulkStatusChange(e.target.value); e.target.value = ''; }}}>
                <option value="">Change Status...</option>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button className="delete-btn" onClick={bulkDelete}>🗑️ Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Spreadsheet */}
      <div className="spreadsheet-container">
        <table className="spreadsheet">
          <thead>
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key} 
                  style={{ width: col.width, minWidth: col.width }}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.key === 'select' ? (
                    <input 
                      type="checkbox" 
                      checked={selectedRows.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={selectAll}
                    />
                  ) : (
                    <>
                      {col.label}
                      {sortConfig.key === col.key && (
                        <span className="sort-indicator">{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map((lead, rowIndex) => (
              <tr key={lead.id} className={selectedRows.has(lead.id) ? 'selected' : ''}>
                {/* Checkbox */}
                <td className="cell cell-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.has(lead.id)}
                    onChange={() => toggleRowSelection(lead.id)}
                  />
                </td>

                {/* Name */}
                <td 
                  className="cell cell-editable"
                  onDoubleClick={() => startEdit(lead, 'name')}
                >
                  {editingCell?.id === lead.id && editingCell?.field === 'name' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="cell-input"
                    />
                  ) : (
                    <span className="cell-value">{lead.name}</span>
                  )}
                </td>

                {/* Phone */}
                <td 
                  className="cell cell-editable cell-phone"
                  onDoubleClick={() => startEdit(lead, 'phone')}
                >
                  {editingCell?.id === lead.id && editingCell?.field === 'phone' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="cell-input"
                    />
                  ) : lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="phone-link" onClick={(e) => e.stopPropagation()}>
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="cell-empty">-</span>
                  )}
                </td>

                {/* Address */}
                <td 
                  className="cell cell-editable"
                  onDoubleClick={() => startEdit(lead, 'address')}
                >
                  {editingCell?.id === lead.id && editingCell?.field === 'address' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="cell-input"
                    />
                  ) : (
                    <span className="cell-value cell-address">{lead.address}</span>
                  )}
                </td>

                {/* Status */}
                <td className="cell cell-status">
                  <select 
                    value={lead.status || 'NEW'} 
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className={`status-select status-${(lead.status || 'NEW').toLowerCase()}`}
                  >
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                {/* Notes */}
                <td 
                  className="cell cell-editable cell-notes"
                  onDoubleClick={() => startEdit(lead, 'notes')}
                >
                  {editingCell?.id === lead.id && editingCell?.field === 'notes' ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="cell-input"
                    />
                  ) : (
                    <span className="cell-value">{lead.notes || '-'}</span>
                  )}
                </td>

                {/* Added By */}
                <td className="cell cell-member">
                  {lead.addedBy || '-'}
                </td>

                {/* Calls */}
                <td className="cell cell-calls">
                  <span className="call-badge">{lead.callHistory?.length || 0}</span>
                </td>

                {/* Last Updated */}
                <td className="cell cell-date">
                  {formatDate(lead.lastUpdated || lead.addedAt)}
                </td>

                {/* Actions */}
                <td className="cell cell-actions">
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="action-btn call-action" title="Call">📞</a>
                  )}
                  <button 
                    className="action-btn delete-action" 
                    onClick={() => { if (window.confirm('Delete this lead?')) deleteLead(lead.id); }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="empty-state">
            No leads found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="spreadsheet-footer">
        <div className="footer-left">
          <span>Total: {leads.length} leads</span>
          <span>•</span>
          <span>Showing: {filteredLeads.length}</span>
        </div>
        <div className="footer-right">
          <span className="tip">💡 Double-click a cell to edit</span>
        </div>
      </footer>
    </div>
  );
};

export default SpreadsheetPage;
