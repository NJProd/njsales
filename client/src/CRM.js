import React, { useState, useEffect, useRef } from 'react';
import './CRM.css';
import { initFirebase, isFirebaseConfigured, saveLead, updateFirebaseLead, subscribeToLeads, deleteLead } from './firebase';
import Dashboard from './components/Dashboard';
import LeadDetailModal from './components/LeadDetailModal';
import { useUserRole, UserLoginSelector, TeamManagementPanel, UserBadge } from './components/UserRoles';

// Lead status options
const LEAD_STATUSES = [
  { value: 'NEW', label: '🆕 New', color: '#3b82f6' },
  { value: 'CALLED', label: '📞 Called', color: '#eab308' },
  { value: 'CALLBACK', label: '🔄 Callback', color: '#f97316' },
  { value: 'REJECTED', label: '❌ Rejected', color: '#ef4444' },
  { value: 'INTERESTED', label: '✅ Interested', color: '#22c55e' },
  { value: 'CLOSED', label: '🏆 Closed', color: '#a855f7' },
];

// Team members
const TEAM_MEMBERS = ['Javi', 'Iamiah'];

// Google Sheets Web App URL (set this after deploying the Apps Script)
const SHEETS_URL = localStorage.getItem('sheetsUrl') || '';

const RADIUS_OPTIONS = [
  { label: '0.5 mi', value: 805 },
  { label: '1 mi', value: 1609 },
  { label: '2 mi', value: 3219 },
  { label: '5 mi', value: 8047 },
  { label: '10 mi', value: 16093 },
  { label: '15 mi', value: 24140 },
  { label: '25 mi', value: 40234 },
  { label: '50 mi', value: 50000 },
];

const BUSINESS_TYPES = [
  { label: '-- Select Industry --', value: '' },
  // Home Services
  { label: '🔧 Plumbers', value: 'plumber' },
  { label: '⚡ Electricians', value: 'electrician' },
  { label: '🏠 Roofers', value: 'roofing_contractor' },
  { label: '❄️ HVAC', value: 'hvac_contractor' },
  { label: '🔨 General Contractors', value: 'general_contractor' },
  { label: '🪟 Painters', value: 'painter' },
  { label: '🌳 Landscapers', value: 'landscaper' },
  { label: '🧹 Cleaning Services', value: 'house_cleaning_service' },
  { label: '🚿 Carpet Cleaners', value: 'carpet_cleaning_service' },
  { label: '🔐 Locksmiths', value: 'locksmith' },
  { label: '🚚 Moving Companies', value: 'moving_company' },
  { label: '🐜 Pest Control', value: 'pest_control_service' },
  // Auto
  { label: '🚗 Auto Repair', value: 'car_repair' },
  { label: '🚙 Auto Dealers', value: 'car_dealer' },
  { label: '🚘 Auto Body Shops', value: 'auto_body_shop' },
  { label: '🛞 Tire Shops', value: 'tire_shop' },
  { label: '🚐 Towing Services', value: 'towing_service' },
  // Health & Wellness
  { label: '🦷 Dentists', value: 'dentist' },
  { label: '👨‍⚕️ Doctors', value: 'doctor' },
  { label: '💆 Chiropractors', value: 'chiropractor' },
  { label: '🏥 Physical Therapy', value: 'physical_therapist' },
  { label: '👁️ Optometrists', value: 'optometrist' },
  { label: '🐕 Veterinarians', value: 'veterinary_care' },
  { label: '💪 Gyms/Fitness', value: 'gym' },
  { label: '💅 Spas', value: 'spa' },
  // Professional Services
  { label: '⚖️ Lawyers', value: 'lawyer' },
  { label: '📊 Accountants', value: 'accountant' },
  { label: '🏡 Real Estate', value: 'real_estate_agency' },
  { label: '🛡️ Insurance', value: 'insurance_agency' },
  { label: '💰 Financial Advisors', value: 'financial_planner' },
  { label: '📸 Photographers', value: 'photographer' },
  // Food & Hospitality
  { label: '🍽️ Restaurants', value: 'restaurant' },
  { label: '☕ Cafes', value: 'cafe' },
  { label: '🍕 Bakeries', value: 'bakery' },
  { label: '🍸 Bars', value: 'bar' },
  { label: '🏨 Hotels', value: 'hotel' },
  // Retail & Personal
  { label: '🛍️ Retail Stores', value: 'store' },
  { label: '💇 Hair Salons', value: 'hair_care' },
  { label: '💄 Beauty Salons', value: 'beauty_salon' },
  { label: '🌸 Florists', value: 'florist' },
  { label: '💎 Jewelry Stores', value: 'jewelry_store' },
  { label: '🧺 Laundromats', value: 'laundry' },
  { label: '🩺 Pharmacies', value: 'pharmacy' },
  // Education & Care
  { label: '📚 Schools', value: 'school' },
  { label: '👶 Daycares', value: 'child_care_agency' },
  { label: '🎓 Tutoring', value: 'tutor' },
];

export default function CRM() {
  // User roles hook
  const {
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
    removeTeamMember
  } = useUserRole();

  // Get userName from currentUser for backward compatibility
  const userName = currentUser?.name || '';

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [leads, setLeads] = useState(() => JSON.parse(localStorage.getItem('leads') || '[]'));
  const leadsRef = useRef(leads); // Ref for current leads (for marker click handlers)
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [tab, setTab] = useState('leads');
  const [filters, setFilters] = useState({ noWeb: false, noPhone: false, notCalled: false, status: '', maxReviews: '', sortBy: 'newest' });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('mapsApiKey') || '');
  const [keyInput, setKeyInput] = useState('');
  const markers = useRef([]);
  const searchCircle = useRef(null);
  const placesServiceDiv = useRef(null);
  
  // Lead detail modal
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Lead search filter
  const [leadSearch, setLeadSearch] = useState('');
  
  // Bulk selection
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  
  // Quick action menu
  const [openMenuId, setOpenMenuId] = useState(null);
  const [quickNote, setQuickNote] = useState('');
  
  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState(() => localStorage.getItem('sheetsUrl') || '');
  
  // Firebase is hardcoded and always connected
  const firebaseConnected = true;
  
  // Search controls
  const [radius, setRadius] = useState(8047); // 5 miles default
  const [customRadius, setCustomRadius] = useState(''); // Custom radius input
  const [businessType, setBusinessType] = useState('');
  const [searchCenter, setSearchCenter] = useState(null);
  const [droppedPin, setDroppedPin] = useState(null); // User-placed pin location
  const [pinDropMode, setPinDropMode] = useState(false); // Whether pin drop mode is active
  const pinDropModeRef = useRef(false); // Ref for pin drop mode (for map click handler)
  const radiusRef = useRef(8047); // Ref for radius (for map click handler)
  const droppedPinMarker = useRef(null); // Marker for dropped pin
  const [pagination, setPagination] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { pinDropModeRef.current = pinDropMode; }, [pinDropMode]);
  useEffect(() => { radiusRef.current = radius; }, [radius]);

  // Keep leadsRef in sync with leads state
  useEffect(() => { 
    leadsRef.current = leads;
    localStorage.setItem('leads', JSON.stringify(leads)); 
    updateMarkers(); 
  }, [leads]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Esc to close modals
      if (e.key === 'Escape') {
        if (selectedLead) setSelectedLead(null);
        else if (showSettings) setShowSettings(false);
        else if (bulkMode) {
          setBulkMode(false);
          setSelectedLeadIds(new Set());
        }
      }
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && tab === 'leads') {
        e.preventDefault();
        document.getElementById('lead-search-input')?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLead, showSettings, bulkMode, tab]);

  // Firebase real-time sync
  useEffect(() => {
    if (!firebaseConnected) return;
    const unsubscribe = subscribeToLeads((firebaseLeads) => {
      // Merge Firebase leads with local leads
      const mergedLeads = [...leads];
      firebaseLeads.forEach(fbLead => {
        const idx = mergedLeads.findIndex(l => l.id === fbLead.id);
        if (idx >= 0) {
          // Update existing lead if Firebase version is newer
          if (fbLead.lastUpdated > (mergedLeads[idx].lastUpdated || 0)) {
            mergedLeads[idx] = fbLead;
          }
        } else {
          // Add new lead from Firebase
          mergedLeads.push(fbLead);
        }
      });
      setLeads(mergedLeads);
    });
    return unsubscribe;
  }, [firebaseConnected]);

  useEffect(() => {
    if (!apiKey) return;
    
    // Check if Google Maps is already loaded
    if (window.google?.maps) { 
      initMap(); 
      return; 
    }
    
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initMap);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Small delay to ensure Google Maps is fully initialized
      setTimeout(initMap, 100);
    };
    script.onerror = () => alert('Failed to load Google Maps. Check your API key.');
    document.head.appendChild(script);
  }, [apiKey]);

  function initMap() {
    if (!mapRef.current || mapInstance.current) return;
    if (!window.google?.maps) return;
    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 39.8283, lng: -98.5795 }, zoom: 4,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1d1d1d' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c2c' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0e0e' }] },
      ],
      disableDefaultUI: true, zoomControl: true,
    });
    // Update search center when map is moved
    mapInstance.current.addListener('idle', () => {
      const center = mapInstance.current.getCenter();
      setSearchCenter({ lat: center.lat(), lng: center.lng() });
    });
    // Click to drop pin when in pin drop mode
    mapInstance.current.addListener('click', (e) => {
      if (pinDropModeRef.current) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setDroppedPin({ lat, lng });
        setPinDropMode(false);
        // Update dropped pin marker
        if (droppedPinMarker.current) {
          droppedPinMarker.current.setPosition({ lat, lng });
        } else {
          droppedPinMarker.current = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstance.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#a855f7',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 3,
            },
            title: 'Search Center',
            zIndex: 9999,
          });
        }
        // Update search circle to show from dropped pin
        updateSearchCircle({ lat, lng }, radiusRef.current);
      }
    });
    updateMarkers();
  }

  function updateSearchCircle(center, radiusVal) {
    if (searchCircle.current) {
      searchCircle.current.setMap(null);
    }
    if (!mapInstance.current || !window.google || !center) return;
    searchCircle.current = new window.google.maps.Circle({
      map: mapInstance.current,
      center: center,
      radius: radiusVal,
      fillColor: '#a855f7',
      fillOpacity: 0.1,
      strokeColor: '#a855f7',
      strokeOpacity: 0.4,
      strokeWeight: 2,
    });
  }

  // Get color for lead status
  function getStatusColor(status) {
    const statusObj = LEAD_STATUSES.find(s => s.value === status);
    return statusObj ? statusObj.color : '#3b82f6'; // Default to NEW (blue)
  }

  function updateMarkers() {
    // Clear existing markers
    markers.current.forEach(m => m.setMap(null));
    markers.current = [];
    if (!mapInstance.current || !window.google) return;
    
    leads.forEach(lead => {
      if (!lead.lat || !lead.lng) return;
      
      const marker = new window.google.maps.Marker({
        position: { lat: lead.lat, lng: lead.lng },
        map: mapInstance.current,
        icon: { 
          path: window.google.maps.SymbolPath.CIRCLE, 
          scale: 8, 
          fillColor: getStatusColor(lead.status), 
          fillOpacity: 1, 
          strokeColor: '#fff', 
          strokeWeight: 2 
        },
        animation: window.google.maps.Animation.DROP, // Add drop animation
        title: lead.name, // Show name on hover
      });
      
      // Store lead ID on marker for click handling
      marker.leadId = lead.id;
      
      // Click marker to open lead detail - use leadsRef for fresh data
      marker.addListener('click', () => {
        const currentLead = leadsRef.current.find(l => l.id === marker.leadId);
        if (currentLead) setSelectedLead(currentLead);
      });
      
      markers.current.push(marker);
    });
  }

  function search(loadMore = false) {
    if (!mapInstance.current) return;
    
    // If loading more, use the pagination object
    if (loadMore && pagination) {
      setSearching(true);
      pagination.nextPage();
      return;
    }
    
    if (!businessType) {
      alert('Please select a business type/industry');
      return;
    }
    
    setSearching(true);
    
    // Use dropped pin location if set, otherwise use map center
    let centerLat, centerLng;
    if (droppedPin) {
      centerLat = droppedPin.lat;
      centerLng = droppedPin.lng;
    } else {
      const center = mapInstance.current.getCenter();
      centerLat = center.lat();
      centerLng = center.lng();
    }
    
    // Show search radius circle
    updateSearchCircle({ lat: centerLat, lng: centerLng }, radius);
    
    // Build search query
    let searchQuery = query.trim();
    const selectedType = BUSINESS_TYPES.find(t => t.value === businessType);
    if (businessType && selectedType) {
      searchQuery = searchQuery ? `${selectedType.label} ${searchQuery}` : selectedType.label;
    }
    
    // Use textSearch with location bias
    const service = new window.google.maps.places.PlacesService(mapInstance.current);
    
    service.textSearch({
      query: searchQuery,
      location: { lat: centerLat, lng: centerLng },
      radius: radius,
    }, (results, status) => {
      setSearching(false);
      if (status !== 'OK' || !results) {
        if (status === 'ZERO_RESULTS') {
          alert('No results found in this area. Try expanding your radius or moving the map.');
        } else {
          alert('Search failed: ' + status);
        }
        return;
      }
      
      // Filter results by distance from center
      const filteredResults = results.filter(p => {
        const lat = p.geometry.location.lat();
        const lng = p.geometry.location.lng();
        const distance = getDistanceMeters(centerLat, centerLng, lat, lng);
        return distance <= radius;
      });
      
      if (filteredResults.length === 0) {
        alert('No results found within your selected radius. Try expanding it.');
        return;
      }
      
      const newLeads = filteredResults.map(p => ({
        id: p.place_id, name: p.name, address: p.formatted_address,
        lat: p.geometry.location.lat(), lng: p.geometry.location.lng(),
        phone: null, website: null, 
        status: 'NEW',           // Lead status
        notes: '',               // User notes
        addedBy: currentUser?.name || 'Unknown',       // Who added this lead
        assignedTo: '',          // Who's handling it
        callHistory: [],         // Array of call logs
        addedAt: Date.now(),
        lastUpdated: Date.now(),
        rating: p.rating || null, userRatingsTotal: p.user_ratings_total || 0,
        businessType: businessType, // Store the searched business type
      }));
      
      // Fetch details for each lead (phone/website)
      newLeads.forEach(lead => {
        service.getDetails({ placeId: lead.id, fields: ['formatted_phone_number', 'website'] }, (place) => {
          if (place) setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, phone: place.formatted_phone_number || null, website: place.website || null } : l));
        });
      });
      
      setLeads(prev => { const ids = new Set(prev.map(l => l.id)); return [...prev, ...newLeads.filter(l => !ids.has(l.id))]; });
      setTab('leads');
    });
  }
  
  // Calculate distance between two points in meters
  function getDistanceMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Handle pagination results
  useEffect(() => {
    if (!pagination) return;
    
    const handlePagination = (results, status, paginationObj) => {
      setSearching(false);
      if (status !== 'OK' || !results) return;
      
      if (paginationObj && paginationObj.hasNextPage) {
        setPagination(paginationObj);
        setHasMore(true);
      } else {
        setPagination(null);
        setHasMore(false);
      }
      
      const newLeads = results.map(p => ({
        id: p.place_id, name: p.name, address: p.vicinity || p.formatted_address,
        lat: p.geometry.location.lat(), lng: p.geometry.location.lng(),
        phone: null, website: null, 
        status: 'NEW',
        notes: '',
        addedBy: currentUser?.name || 'Unknown',
        assignedTo: '',
        callHistory: [],
        addedAt: Date.now(),
        lastUpdated: Date.now(),
        rating: p.rating || null, userRatingsTotal: p.user_ratings_total || 0,
        businessType: businessType,
      }));
      
      const service = new window.google.maps.places.PlacesService(mapInstance.current);
      newLeads.forEach(lead => {
        service.getDetails({ placeId: lead.id, fields: ['formatted_phone_number', 'website'] }, (place) => {
          if (place) setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, phone: place.formatted_phone_number || null, website: place.website || null } : l));
        });
      });
      
      setLeads(prev => { const ids = new Set(prev.map(l => l.id)); return [...prev, ...newLeads.filter(l => !ids.has(l.id))]; });
    };
    
    // This effect runs when pagination changes, but the actual callback happens in loadMore
  }, [pagination, userName]);

  // Sync lead to Google Sheets
  async function syncToSheet(lead, action = 'update') {
    const sheetsUrl = localStorage.getItem('sheetsUrl');
    if (!sheetsUrl) return; // No sheets URL configured
    
    try {
      // Find the business type label
      const businessTypeLabel = BUSINESS_TYPES.find(b => b.value === lead.businessType)?.label || lead.businessType || 'Unknown';
      
      await fetch(sheetsUrl, {
        method: 'POST',
        mode: 'no-cors', // Required for Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          placeId: lead.id,
          name: lead.name,
          phone: lead.phone || 'N/A',
          address: lead.address,
          status: lead.status,
          businessType: businessTypeLabel,
          notes: lead.notes || '',
          markedBy: userName,
          date: new Date().toISOString(),
          reviews: lead.userRatingsTotal || 0,
        })
      });
    } catch (err) {
      console.log('Sheet sync error (may still work):', err);
    }
  }

  // Update a lead's properties
  function updateLead(id, updates) {
    setLeads(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, ...updates, lastUpdated: Date.now() } : l);
      // Sync to sheet if status changed to non-NEW
      const lead = updated.find(l => l.id === id);
      if (lead && lead.status !== 'NEW') {
        syncToSheet(lead);
      }
      return updated;
    });
  }

  // Update lead status
  function updateLeadStatus(id, newStatus) {
    setLeads(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, status: newStatus, lastUpdated: Date.now() } : l);
      const lead = updated.find(l => l.id === id);
      if (lead && newStatus !== 'NEW') {
        syncToSheet(lead);
      }
      // Sync to Firebase
      if (lead && firebaseConnected) {
        updateFirebaseLead(lead.id, lead);
      }
      return updated;
    });
  }

  // Add a call log to a lead
  function logCall(id, outcome, notes) {
    setLeads(prev => {
      const updated = prev.map(l => {
        if (l.id !== id) return l;
        const callLog = {
          date: Date.now(),
          user: userName,
          outcome,
          notes
        };
        return { 
          ...l, 
          callHistory: [...(l.callHistory || []), callLog],
          lastUpdated: Date.now()
        };
      });
      // Sync to Firebase
      const lead = updated.find(l => l.id === id);
      if (lead && firebaseConnected) {
        updateFirebaseLead(lead.id, lead);
      }
      return updated;
    });
  }

  function removeLead(id) { 
    setLeads(prev => prev.filter(l => l.id !== id)); 
    if (selectedLead?.id === id) setSelectedLead(null);
    // Sync delete to Firebase
    if (firebaseConnected) {
      deleteLead(id).catch(err => console.error('Firebase delete error:', err));
    }
  }

  function clearAllLeads() {
    if (window.confirm('Are you sure you want to delete ALL leads? This cannot be undone.')) {
      setLeads([]);
      setSelectedLead(null);
    }
  }

  function zoomToLead(lead) {
    if (mapInstance.current && lead.lat && lead.lng) {
      mapInstance.current.panTo({ lat: lead.lat, lng: lead.lng });
      mapInstance.current.setZoom(15);
    }
  }

  // Calculate lead score (0-100)
  function getLeadScore(lead) {
    let score = 50; // Base score
    
    // No website = hot lead (+20)
    if (!lead.website) score += 20;
    
    // Has phone = can contact (+10)
    if (lead.phone) score += 10;
    
    // Good ratings boost
    if (lead.rating >= 4.5) score += 10;
    else if (lead.rating >= 4) score += 5;
    else if (lead.rating < 3 && lead.rating > 0) score -= 10;
    
    // Review count (established business)
    if (lead.userRatingsTotal >= 100) score += 10;
    else if (lead.userRatingsTotal >= 50) score += 5;
    else if (lead.userRatingsTotal < 10) score -= 5;
    
    // Status adjustments
    if (lead.status === 'INTERESTED') score += 15;
    if (lead.status === 'CALLBACK') score += 10;
    if (lead.status === 'REJECTED') score -= 30;
    
    return Math.max(0, Math.min(100, score));
  }

  // Bulk actions
  function toggleLeadSelection(id) {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedLeadIds(new Set(filtered.map(l => l.id)));
  }

  function clearSelection() {
    setSelectedLeadIds(new Set());
  }

  function bulkUpdateStatus(newStatus) {
    selectedLeadIds.forEach(id => {
      updateLeadStatus(id, newStatus);
    });
    setSelectedLeadIds(new Set());
    setBulkMode(false);
  }

  function bulkDelete() {
    if (window.confirm(`Delete ${selectedLeadIds.size} leads? This cannot be undone.`)) {
      selectedLeadIds.forEach(id => {
        removeLead(id);
      });
      setSelectedLeadIds(new Set());
      setBulkMode(false);
    }
  }

  // Copy to clipboard helper
  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      // Brief visual feedback could be added here
    }).catch(err => console.error('Copy failed:', err));
  }

  // Filter leads based on user permissions
  const visibleLeads = leads.filter(lead => canViewLead(lead));

  // Filter leads based on current filters, search, AND user permissions
  const filtered = visibleLeads.filter(l => {
    // Text search filter
    if (leadSearch) {
      const searchLower = leadSearch.toLowerCase();
      const matchesName = l.name?.toLowerCase().includes(searchLower);
      const matchesAddress = l.address?.toLowerCase().includes(searchLower);
      const matchesPhone = l.phone?.includes(leadSearch);
      if (!matchesName && !matchesAddress && !matchesPhone) return false;
    }
    if (filters.noWeb && l.website) return false;
    if (filters.noPhone && l.phone) return false;
    if (filters.notCalled && l.status !== 'NEW') return false; // Show only NEW leads
    if (filters.status && l.status !== filters.status) return false;
    if (filters.maxReviews && l.userRatingsTotal > parseInt(filters.maxReviews)) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'reviews-low': return (a.userRatingsTotal || 0) - (b.userRatingsTotal || 0);
      case 'reviews-high': return (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0);
      case 'rating-low': return (a.rating || 0) - (b.rating || 0);
      case 'rating-high': return (b.rating || 0) - (a.rating || 0);
      case 'name': return (a.name || '').localeCompare(b.name || '');
      case 'oldest': return (a.addedAt || 0) - (b.addedAt || 0);
      case 'score': return getLeadScore(b) - getLeadScore(a); // Highest score first
      case 'newest':
      default: return (b.addedAt || 0) - (a.addedAt || 0);
    }
  });

  // Get only marked leads (not NEW)
  const markedLeads = visibleLeads.filter(l => l.status !== 'NEW');

  // Export marked leads to downloadable file
  function exportLeads() {
    const data = markedLeads.map(l => ({
      name: l.name,
      phone: l.phone || 'N/A',
      address: l.address,
      status: LEAD_STATUSES.find(s => s.value === l.status)?.label || l.status,
      businessType: BUSINESS_TYPES.find(b => b.value === l.businessType)?.label || l.businessType || 'Unknown',
      notes: l.notes || '',
      markedBy: l.addedBy,
      date: new Date(l.lastUpdated).toLocaleString(),
      reviews: l.userRatingsTotal || 0,
      rating: l.rating || 'N/A'
    }));
    
    // Create CSV
    const headers = ['Business Name', 'Phone', 'Address', 'Status', 'Business Type', 'Notes', 'Marked By', 'Date', 'Reviews', 'Rating'];
    const csv = [headers.join(','), ...data.map(row => 
      [row.name, row.phone, `"${row.address}"`, row.status, row.businessType, `"${row.notes}"`, row.markedBy, row.date, row.reviews, row.rating].join(',')
    )].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function saveKey() { if (keyInput.trim()) { localStorage.setItem('mapsApiKey', keyInput.trim()); setApiKey(keyInput.trim()); } }

  // Show API key setup first
  if (!apiKey) {
    return (
      <div className="setup">
        <div className="setup-box">
          <h1>🗺️ Sales Tracker</h1>
          <p>Enter your Google Maps API key to get started</p>
          <input placeholder="AIzaSy..." value={keyInput} onChange={e => setKeyInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveKey()} />
          <button onClick={saveKey} disabled={!keyInput.trim()}>Start</button>
          <div className="help">
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">Get API Key</a>
            <span> • Enable Maps JavaScript API + Places API</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login selector if no user logged in
  if (!currentUser) {
    return <UserLoginSelector team={team} onLogin={login} />;
  }

  return (
    <div className="app">
      <div className="map" ref={mapRef} />
      
      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead}
          statuses={LEAD_STATUSES}
          teamMembers={team.map(t => t.name)}
          currentUser={currentUser}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updates) => {
            if (canEditLead(selectedLead)) {
              updateLead(selectedLead.id, updates);
              setSelectedLead(prev => ({ ...prev, ...updates }));
            }
          }}
          onStatusChange={(status) => {
            if (canEditLead(selectedLead)) {
              updateLeadStatus(selectedLead.id, status);
              setSelectedLead(prev => ({ ...prev, status }));
            }
          }}
          onLogCall={(outcome, notes) => {
            logCall(selectedLead.id, outcome, notes);
          }}
          onDelete={() => {
            if (canDeleteLead()) {
              removeLead(selectedLead.id);
            }
          }}
          onZoom={() => { zoomToLead(selectedLead); setSelectedLead(null); }}
          canEdit={canEditLead(selectedLead)}
          canDelete={canDeleteLead()}
        />
      )}
      
      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚙️ Settings</h2>
              <button onClick={() => setShowSettings(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-section">
                <label>🔥 Firebase Sync <span style={{color: '#22c55e'}}>● Connected</span></label>
                <p className="help-text">Real-time team sync is active. All leads sync automatically between team members.</p>
                <div className="firebase-status-box">
                  <span className="status-indicator-dot connected"></span>
                  <span>njdevelopmentsales</span>
                </div>
              </div>
              <div className="modal-section">
                <label>Google Sheets Web App URL</label>
                <p className="help-text">Paste your Apps Script deployment URL to sync leads</p>
                <input 
                  type="text"
                  placeholder="https://script.google.com/macros/s/..."
                  value={sheetsUrlInput}
                  onChange={e => setSheetsUrlInput(e.target.value)}
                  className="settings-input"
                />
                <button 
                  className="save-settings-btn"
                  onClick={() => {
                    localStorage.setItem('sheetsUrl', sheetsUrlInput);
                    setShowSettings(false);
                    alert('Sheets URL saved! Leads will now sync automatically.');
                  }}
                >
                  💾 Save Settings
                </button>
              </div>
              <div className="modal-section">
                <label>Current Profile</label>
                <p className="help-text">Switch between team members</p>
                <div className="profile-switch">
                  {team.map(member => (
                    <button 
                      key={member.id}
                      className={`profile-option ${currentUser?.id === member.id ? 'active' : ''}`}
                      onClick={() => login(member.id)}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-section">
                <label>Danger Zone</label>
                <button className="danger-btn" onClick={() => {
                  if (window.confirm('Reset everything? This clears all local data.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}>
                  🗑️ Reset All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`panel ${panelOpen ? '' : 'closed'}`}>
        <div className="panel-header">
          <button className="toggle-btn" onClick={() => setPanelOpen(!panelOpen)}>{panelOpen ? '◀' : '▶'}</button>
          {panelOpen && (
            <div className="tabs">
              <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>📊 Home</button>
              <button className={tab === 'leads' ? 'active' : ''} onClick={() => setTab('leads')}>📋 Leads <span className="count">{filtered.length}</span></button>
              <button className={tab === 'search' ? 'active' : ''} onClick={() => setTab('search')}>🔍 Search</button>
            </div>
          )}
        </div>
        {panelOpen && (
          <div className="panel-body">
            {tab === 'dashboard' && (
              <Dashboard 
                leads={visibleLeads} 
                currentUser={currentUser}
                team={team}
                onLogout={logout}
                onShowSettings={() => setShowSettings(true)}
                onShowTeam={() => setTab('team')}
                isAdmin={isAdmin()}
                onNavigate={(lead) => {
                  setSelectedLead(lead);
                  setTab('leads');
                }}
              />
            )}
            {tab === 'team' && (
              <TeamManagementPanel
                team={team}
                currentUser={currentUser}
                onAddMember={addTeamMember}
                onUpdateMember={updateTeamMember}
                onRemoveMember={removeTeamMember}
              />
            )}
            {tab === 'search' && (
              <div className="search-section">
                <div className="search-controls">
                  <div className="control-group">
                    <label>Industry / Business Type</label>
                    <select value={businessType} onChange={e => setBusinessType(e.target.value)}>
                      {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Search Radius</label>
                    <div className="radius-buttons">
                      {RADIUS_OPTIONS.map(r => (
                        <button key={r.value} className={radius === r.value && !customRadius ? 'active' : ''} onClick={() => { setRadius(r.value); setCustomRadius(''); }}>{r.label}</button>
                      ))}
                    </div>
                    <div className="custom-radius-row">
                      <input 
                        type="number" 
                        placeholder="Custom miles..." 
                        value={customRadius}
                        onChange={e => {
                          setCustomRadius(e.target.value);
                          if (e.target.value) {
                            setRadius(Math.round(parseFloat(e.target.value) * 1609.34)); // Convert miles to meters
                          }
                        }}
                        className="custom-radius-input"
                      />
                      <span className="custom-radius-label">mi</span>
                    </div>
                  </div>
                  <div className="control-group">
                    <label>Search Center</label>
                    <div className="pin-drop-controls">
                      <button 
                        className={`pin-drop-btn ${pinDropMode ? 'active' : ''}`}
                        onClick={() => setPinDropMode(!pinDropMode)}
                      >
                        📍 {pinDropMode ? 'Click Map to Drop Pin' : 'Drop Pin on Map'}
                      </button>
                      {droppedPin && (
                        <button 
                          className="clear-pin-btn"
                          onClick={() => {
                            setDroppedPin(null);
                            if (droppedPinMarker.current) {
                              droppedPinMarker.current.setMap(null);
                              droppedPinMarker.current = null;
                            }
                            if (searchCircle.current) {
                              searchCircle.current.setMap(null);
                            }
                          }}
                        >
                          ✕ Clear Pin
                        </button>
                      )}
                    </div>
                    {droppedPin && (
                      <div className="pin-location-info">
                        ✓ Pin placed at {droppedPin.lat.toFixed(4)}, {droppedPin.lng.toFixed(4)}
                      </div>
                    )}
                    {pinDropMode && (
                      <div className="pin-drop-hint">
                        👆 Click anywhere on the map to set search center
                      </div>
                    )}
                  </div>
                </div>
                <button className="search-btn" onClick={() => search()} disabled={searching || !businessType}>
                  {searching ? '🔄 Searching...' : `🔍 Search ${droppedPin ? 'From Pin' : 'This Area'}`}
                </button>
                <div className="search-hint">
                  <span>{droppedPin ? '📍 Searching from dropped pin location' : '📍 Pan the map or drop a pin to search different areas'}</span>
                </div>
              </div>
            )}
            {tab === 'leads' && (
              <>
                {/* Search Input */}
                <div className="lead-search-container">
                  <input
                    id="lead-search-input"
                    type="text"
                    placeholder="🔍 Search leads by name, address, or phone..."
                    value={leadSearch}
                    onChange={e => setLeadSearch(e.target.value)}
                    className="lead-search-input"
                  />
                  {leadSearch && (
                    <button className="clear-search-btn" onClick={() => setLeadSearch('')}>×</button>
                  )}
                </div>
                
                <div className="filters">
                  <label><input type="checkbox" checked={filters.noWeb} onChange={() => setFilters(f => ({ ...f, noWeb: !f.noWeb }))} /> No Website</label>
                  <label><input type="checkbox" checked={filters.noPhone} onChange={() => setFilters(f => ({ ...f, noPhone: !f.noPhone }))} /> No Phone</label>
                  <label><input type="checkbox" checked={filters.notCalled} onChange={() => setFilters(f => ({ ...f, notCalled: !f.notCalled }))} /> New Only</label>
                </div>
                <div className="filters">
                  <select 
                    className="status-filter"
                    value={filters.status} 
                    onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="">All Statuses</option>
                    {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select 
                    className="status-filter"
                    value={filters.sortBy} 
                    onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="reviews-low">Reviews: Low→High</option>
                    <option value="reviews-high">Reviews: High→Low</option>
                    <option value="rating-low">Rating: Low→High</option>
                    <option value="rating-high">Rating: High→Low</option>
                    <option value="name">Name A-Z</option>
                    <option value="score">Lead Score</option>
                  </select>
                </div>
                
                {/* Bulk Actions Bar */}
                <div className="bulk-actions-bar">
                  <div className="bulk-left">
                    <button 
                      className={`bulk-toggle-btn ${bulkMode ? 'active' : ''}`}
                      onClick={() => {
                        setBulkMode(!bulkMode);
                        if (bulkMode) setSelectedLeadIds(new Set());
                      }}
                    >
                      {bulkMode ? '✕ Cancel' : '☑️ Select'}
                    </button>
                    {bulkMode && (
                      <>
                        <button className="bulk-select-all" onClick={selectAllFiltered}>
                          Select All ({filtered.length})
                        </button>
                        <span className="bulk-count">{selectedLeadIds.size} selected</span>
                      </>
                    )}
                  </div>
                  {bulkMode && selectedLeadIds.size > 0 && (
                    <div className="bulk-right">
                      <select 
                        className="bulk-status-select"
                        onChange={e => { if (e.target.value) bulkUpdateStatus(e.target.value); }}
                        defaultValue=""
                      >
                        <option value="">Set Status...</option>
                        {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <button className="bulk-delete-btn" onClick={bulkDelete}>🗑️ Delete</button>
                    </div>
                  )}
                </div>
                
                <div className="list-header">
                  <span className="lead-count">{filtered.length} of {leads.length} leads {markedLeads.length > 0 && `(${markedLeads.length} marked)`}</span>
                  <div className="list-actions">
                    {markedLeads.length > 0 && <button className="export-btn" onClick={exportLeads}>📥 Export</button>}
                    {leads.length > 0 && <button className="clear-all-btn" onClick={clearAllLeads}>Clear All</button>}
                  </div>
                </div>
                <div className="list">
                  {filtered.length === 0 && <div className="empty">{leadSearch ? 'No leads match your search' : 'No leads yet. Search to add some!'}</div>}
                  {filtered.map(lead => {
                    const statusObj = LEAD_STATUSES.find(s => s.value === lead.status) || LEAD_STATUSES[0];
                    const isMenuOpen = openMenuId === lead.id;
                    const score = getLeadScore(lead);
                    const isSelected = selectedLeadIds.has(lead.id);
                    return (
                      <div 
                        key={lead.id} 
                        className={`item ${lead.status === 'INTERESTED' || lead.status === 'CLOSED' ? 'done' : ''} ${isSelected ? 'selected' : ''}`}
                      >
                        {bulkMode && (
                          <div className="bulk-checkbox" onClick={() => toggleLeadSelection(lead.id)}>
                            <input type="checkbox" checked={isSelected} readOnly />
                          </div>
                        )}
                        <div className="status-indicator" style={{ background: statusObj.color }} title={statusObj.label}></div>
                        <div className="item-info" onClick={() => !bulkMode && setSelectedLead(lead)} style={{ cursor: bulkMode ? 'default' : 'pointer' }}>
                          <div className="item-name-row">
                            <span className="item-name">{lead.name}</span>
                            <span className={`lead-score score-${score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold'}`} title="Lead Score">
                              {score}
                            </span>
                          </div>
                          <div className="item-addr">{lead.address}</div>
                          
                          {/* Quick Contact Row */}
                          <div className="quick-contact-row">
                            {lead.phone && (
                              <>
                                <a href={`tel:${lead.phone}`} className="quick-call-btn" onClick={e => e.stopPropagation()} title="Call">
                                  📞 {lead.phone}
                                </a>
                                <button 
                                  className="copy-btn" 
                                  onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.phone, 'Phone'); }}
                                  title="Copy phone"
                                >
                                  📋
                                </button>
                              </>
                            )}
                            <button 
                              className="copy-btn" 
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(lead.address, 'Address'); }}
                              title="Copy address"
                            >
                              📍
                            </button>
                          </div>
                          
                          <div className="item-tags">
                            {lead.status !== 'NEW' && <span className="tag status-tag" style={{ background: statusObj.color + '33', color: statusObj.color }}>{statusObj.label}</span>}
                            {lead.userRatingsTotal > 0 && <span className="tag ok">⭐ {lead.userRatingsTotal}</span>}
                            {!lead.phone && <span className="tag bad">No 📞</span>}
                            {!lead.website && <span className="tag hot">No 🌐</span>}
                            {lead.status === 'NEW' && <span className="tag new-tag">N</span>}
                            {lead.notes && <span className="tag ok">📝</span>}
                          </div>
                        </div>
                        <div className="action-menu-container">
                          <button 
                            className="menu-trigger" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setOpenMenuId(isMenuOpen ? null : lead.id);
                              setQuickNote(lead.notes || '');
                            }}
                          >
                            ⋮
                          </button>
                          {isMenuOpen && (
                            <div className="action-dropdown" onClick={e => e.stopPropagation()}>
                              <div className="dropdown-header">Mark as:</div>
                              <div className="dropdown-statuses">
                                {LEAD_STATUSES.filter(s => s.value !== 'NEW').map(s => (
                                  <button 
                                    key={s.value}
                                    className={`dropdown-status-btn ${lead.status === s.value ? 'active' : ''}`}
                                    style={{ '--status-color': s.color }}
                                    onClick={() => {
                                      updateLeadStatus(lead.id, s.value);
                                    }}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                              <div className="dropdown-notes">
                                <textarea 
                                  placeholder="Add notes..."
                                  value={quickNote}
                                  onChange={e => setQuickNote(e.target.value)}
                                  rows={2}
                                />
                                <button 
                                  className="save-note-btn"
                                  onClick={() => {
                                    updateLead(lead.id, { notes: quickNote });
                                    setOpenMenuId(null);
                                  }}
                                >
                                  💾 Save
                                </button>
                              </div>
                              <button 
                                className="dropdown-delete"
                                onClick={() => { removeLead(lead.id); setOpenMenuId(null); }}
                              >
                                🗑️ Delete Lead
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div className="legend">
        {LEAD_STATUSES.map(s => (
          <span key={s.value}><i style={{ background: s.color }}></i> {s.label.split(' ')[1]}</span>
        ))}
      </div>
    </div>
  );
}
