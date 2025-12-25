# SalesCRM - Project Plan & Documentation

## 🎯 What Is This?

A **collaborative sales lead tracker** built for you and your friend to:
- Search for businesses on Google Maps
- Track which leads you've called
- Share data in real-time so you both see the same leads
- Never call the same business twice
- Keep notes and track the outcome of each call

---

## 👥 Team Use Case

| Feature | Description |
|---------|-------------|
| **Shared Lead Pool** | Both users see the same leads in real-time |
| **Claimed Leads** | Mark a lead as "yours" so teammate knows you're handling it |
| **Call Status Sync** | When one person calls, it updates for everyone |
| **Notes Visible** | Both can read/add notes to any lead |

---

## 📊 Lead Data Structure

Each lead will store:

```
Lead {
  id: string
  name: string              // Business name
  address: string           // Full address
  phone: string             // Phone number
  website: string           // Website URL (if any)
  
  // Status Tracking
  status: enum              // NEW | CALLED | CALLBACK | REJECTED | INTERESTED | CLOSED
  assignedTo: string        // Who's handling this lead
  
  // Notes & History
  notes: string             // Free-form notes
  callHistory: [            // Log of all calls
    { date, user, outcome, notes }
  ]
  
  // Metadata
  addedBy: string           // Who added the lead
  addedAt: timestamp        // When it was added
  lastUpdated: timestamp    // Last modification
  
  // Location (for map display)
  lat: number
  lng: number
}
```

---

## 🚦 Lead Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| 🆕 **NEW** | Blue | Just added, not contacted yet |
| 📞 **CALLED** | Yellow | Called, waiting for response |
| 🔄 **CALLBACK** | Orange | They want us to call back |
| ❌ **REJECTED** | Red | Not interested |
| ✅ **INTERESTED** | Green | Interested, in progress |
| 🏆 **CLOSED** | Purple | Deal done! |

---

## 🗄️ Data Storage Options

### Option 1: Google Sheets (RECOMMENDED for your use case)
**Pros:**
- ✅ Already set up in this project
- ✅ Both of you can view the raw data anytime
- ✅ Easy to export/backup
- ✅ Free
- ✅ Can edit directly in Sheets if needed

**Structure:**
```
Sheet: "Leads"
Columns: ID | Name | Address | Phone | Website | Status | AssignedTo | Notes | AddedBy | AddedAt | LastUpdated | Lat | Lng

Sheet: "CallHistory" 
Columns: LeadID | Date | User | Outcome | Notes

Sheet: "TeamActivity"
Columns: Timestamp | User | Action | LeadID | Details
```

### Option 2: Firebase Realtime Database
**Pros:**
- Real-time sync (instant updates)
- Better for scaling

**Cons:**
- More complex setup
- Less visibility into raw data

### Option 3: Supabase (PostgreSQL)
**Pros:**
- SQL database with real-time
- Free tier available

---

## 🎨 UI Features to Build

### Current (Working)
- [x] Google Maps integration
- [x] Business search via Places API
- [x] Add leads to list
- [x] Mark as called (checkbox)
- [x] Filter by no website/no phone/not called
- [x] Dark theme

### Phase 1: Enhanced Lead Management
- [ ] **Lead Detail Modal** - Click a lead to see full details
- [ ] **Notes Field** - Add/edit notes for each lead
- [ ] **Status Dropdown** - Change status (New → Callback → Closed)
- [ ] **Call History** - Log each call with date and outcome
- [ ] **Quick Actions** - Call button, copy number, open website

### Phase 2: Team Features
- [ ] **User Identification** - Simple name entry on first use
- [ ] **Assigned To** - Claim a lead as yours
- [ ] **Activity Feed** - See what teammate is doing
- [ ] **Color Coding** - Your leads vs teammate's leads

### Phase 3: Google Sheets Sync
- [ ] **Auto-sync to Sheets** - All changes saved automatically
- [ ] **Load from Sheets** - On app start, pull latest data
- [ ] **Conflict Resolution** - Handle if both edit same lead

### Phase 4: Polish
- [ ] **Search/Filter Leads** - Find leads by name, status, etc.
- [ ] **Stats Dashboard** - Calls made, conversion rate, etc.
- [ ] **Export Options** - Download as CSV
- [ ] **Mobile Responsive** - Works on phone

---

## 🔧 Technical Implementation Plan

### Backend (server.js)
```
Endpoints to add:
POST   /api/leads          - Add new lead (with full data)
GET    /api/leads          - Get all leads from Sheet
PUT    /api/leads/:id      - Update lead (status, notes, etc.)
DELETE /api/leads/:id      - Remove a lead

POST   /api/leads/:id/call - Log a call for a lead
GET    /api/activity       - Get team activity feed
POST   /api/activity       - Log an activity
```

### Frontend (App.js)
```
Components to add:
- LeadDetailModal      - Full lead view with edit
- NotesEditor          - Add/edit notes
- StatusSelector       - Dropdown for status
- CallLogger           - Log a call outcome
- ActivityFeed         - Show team actions
- UserBadge            - Show who added/owns lead
```

---

## 📋 Immediate Next Steps

1. **Set up Google Sheets structure**
   - Create the Leads sheet with all columns
   - Create CallHistory sheet
   - Create TeamActivity sheet
   - Share with both team members

2. **Add user identification**
   - Prompt for name on first use
   - Store in localStorage
   - Include in all API calls

3. **Build Lead Detail Modal**
   - Click a lead to expand
   - Show all info
   - Edit notes
   - Change status
   - Log calls

4. **Wire up Google Sheets sync**
   - Save changes to Sheets
   - Load data on app start
   - Show sync status

---

## 🎯 End Goal

A seamless overlay tool where you and your friend can:

1. **Search** → Find businesses on the map
2. **Add** → One-click add to shared lead pool
3. **Claim** → "I'll handle this one"
4. **Call** → Click to call, log the outcome
5. **Track** → See all call history and notes
6. **Sync** → Everything in Google Sheets for backup/reporting

All in a clean, dark-themed UI that feels professional.

---

## 📞 Quick Reference: Google Sheets Setup

Your Sheet ID: (add after creating)
Sheet URL: (add link here)

Columns for "Leads" sheet:
```
A: ID
B: Name
C: Address  
D: Phone
E: Website
F: Status (NEW/CALLED/CALLBACK/REJECTED/INTERESTED/CLOSED)
G: AssignedTo
H: Notes
I: AddedBy
J: AddedAt
K: LastUpdated
L: Lat
M: Lng
```

---

*Last Updated: December 25, 2025*
