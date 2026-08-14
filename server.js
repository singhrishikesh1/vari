const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to static data
const dataPath = path.join(__dirname, 'data', 'sahyatri_data.json');

// Helper to read data
function getSahyatriData() {
  try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error('Error reading data file:', err);
    return {};
  }
}

// Helper to save data
function saveSahyatriData(data) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

// API Routes
app.get('/api/info', (req, res) => {
  const data = getSahyatriData();
  res.json(data.projectInfo || {});
});

app.get('/api/stats', (req, res) => {
  const data = getSahyatriData();
  res.json(data.stats || {});
});

app.get('/api/alerts', (req, res) => {
  const data = getSahyatriData();
  res.json(data.sosAlerts || []);
});

app.post('/api/alerts', (req, res) => {
  const data = getSahyatriData();
  const newAlert = {
    id: 'SOS-' + Math.floor(1000 + Math.random() * 9000),
    bandId: req.body.bandId || 'BAND-ESP-' + Math.floor(100 + Math.random() * 900),
    pilgrimName: req.body.pilgrimName || 'Simulated Pilgrim (SOS Band)',
    age: req.body.age || 65,
    location: req.body.location || 'Active Wari Route Sector',
    lat: req.body.lat || 18.3438 + (Math.random() - 0.5) * 0.05,
    lng: req.body.lng || 74.0305 + (Math.random() - 0.5) * 0.05,
    issue: req.body.issue || 'Emergency Button Pressed (Dehydration/Distress)',
    priority: req.body.priority || 'CRITICAL',
    status: 'ACTIVE - Dispatched',
    assignedVolunteer: 'Nearest Dindi Volunteer',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (Live)'
  };
  
  data.sosAlerts.unshift(newAlert);
  if (data.stats) {
    data.stats.sosAlertsToday += 1;
  }
  saveSahyatriData(data);
  res.status(201).json({ success: true, alert: newAlert });
});

app.get('/api/camps', (req, res) => {
  const data = getSahyatriData();
  res.json(data.medicalCamps || []);
});

app.get('/api/volunteers', (req, res) => {
  const data = getSahyatriData();
  res.json(data.volunteerLogs || []);
});

app.post('/api/symptoms', (req, res) => {
  const data = getSahyatriData();
  const newLog = {
    id: 'VLOG-' + Math.floor(100 + Math.random() * 900),
    volunteerName: req.body.volunteerName || 'Field Volunteer',
    dindiNumber: req.body.dindiNumber || 'Dindi #42',
    symptom: req.body.symptom || 'General Fatigue & Dehydration',
    pilgrimsTreated: parseInt(req.body.pilgrimsTreated) || 1,
    washIssue: req.body.washIssue || 'Clean water available',
    timestamp: 'Just now'
  };
  
  data.volunteerLogs.unshift(newLog);
  saveSahyatriData(data);
  res.status(201).json({ success: true, log: newLog });
});

app.get('/api/ivr', (req, res) => {
  const data = getSahyatriData();
  res.json(data.ivrLogs || []);
});

app.post('/api/ivr/simulate', (req, res) => {
  const data = getSahyatriData();
  const optionsMap = {
    '1': 'Press 1 - Emergency Medical Reporting',
    '2': 'Press 2 - Sanitation & WASH Issue Reporting',
    '3': 'Press 3 - Nearest Medical Camp Location',
    '4': 'Press 4 - Drinking Water Supply Point'
  };
  const option = req.body.option || '1';
  
  const newIvrLog = {
    callId: 'IVR-' + Math.floor(7000 + Math.random() * 9000),
    callerType: req.body.callerType || 'Feature Phone User (Pilgrim)',
    language: 'Marathi (मराठी)',
    optionSelected: optionsMap[option] || 'Press 1 - Emergency Reporting',
    assignedCamp: 'Assigned to Sector Volunteer Network',
    status: 'Call Processed via IVR Gateway',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  data.ivrLogs.unshift(newIvrLog);
  saveSahyatriData(data);
  res.status(201).json({ success: true, ivr: newIvrLog });
});

// Fallback index
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` SAHYATRI Web Application & Dashboard Server`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
