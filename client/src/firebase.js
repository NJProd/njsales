import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, push, remove, update } from 'firebase/database';

// Firebase configuration - YOU NEED TO REPLACE THIS with your own config
// Get it from: https://console.firebase.google.com/ → Your Project → Project Settings → Your apps → Config
const firebaseConfig = {
  apiKey: localStorage.getItem('firebaseApiKey') || "",
  authDomain: localStorage.getItem('firebaseAuthDomain') || "",
  databaseURL: localStorage.getItem('firebaseDatabaseURL') || "",
  projectId: localStorage.getItem('firebaseProjectId') || "",
  storageBucket: localStorage.getItem('firebaseStorageBucket') || "",
  messagingSenderId: localStorage.getItem('firebaseMessagingSenderId') || "",
  appId: localStorage.getItem('firebaseAppId') || ""
};

let app = null;
let database = null;

export function initFirebase(config) {
  if (config) {
    // Save config to localStorage
    Object.keys(config).forEach(key => {
      localStorage.setItem(`firebase${key.charAt(0).toUpperCase() + key.slice(1)}`, config[key]);
    });
  }
  
  const savedConfig = {
    apiKey: localStorage.getItem('firebaseApiKey') || "",
    authDomain: localStorage.getItem('firebaseAuthDomain') || "",
    databaseURL: localStorage.getItem('firebaseDatabaseURL') || "",
    projectId: localStorage.getItem('firebaseProjectId') || "",
    storageBucket: localStorage.getItem('firebaseStorageBucket') || "",
    messagingSenderId: localStorage.getItem('firebaseMessagingSenderId') || "",
    appId: localStorage.getItem('firebaseAppId') || ""
  };
  
  if (!savedConfig.apiKey || !savedConfig.databaseURL) {
    return null;
  }
  
  try {
    app = initializeApp(savedConfig);
    database = getDatabase(app);
    return database;
  } catch (err) {
    console.error('Firebase init error:', err);
    return null;
  }
}

export function isFirebaseConfigured() {
  return !!(localStorage.getItem('firebaseApiKey') && localStorage.getItem('firebaseDatabaseURL'));
}

// Save a lead to Firebase
export function saveLead(lead) {
  if (!database) return;
  const leadRef = ref(database, `leads/${lead.id}`);
  return set(leadRef, {
    ...lead,
    lastUpdated: Date.now()
  });
}

// Update a lead in Firebase
export function updateFirebaseLead(leadId, updates) {
  if (!database) return;
  const leadRef = ref(database, `leads/${leadId}`);
  return update(leadRef, {
    ...updates,
    lastUpdated: Date.now()
  });
}

// Delete a lead from Firebase
export function deleteLead(leadId) {
  if (!database) return;
  const leadRef = ref(database, `leads/${leadId}`);
  return remove(leadRef);
}

// Listen to all leads in real-time
export function subscribeToLeads(callback) {
  if (!database) return () => {};
  const leadsRef = ref(database, 'leads');
  return onValue(leadsRef, (snapshot) => {
    const data = snapshot.val();
    const leads = data ? Object.values(data) : [];
    callback(leads);
  });
}

export { database };
