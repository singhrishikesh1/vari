let map = null;
let markersGroup = null;

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadStats();
  loadAlerts();
  loadCamps();
  loadVolunteers();
  loadIvrLogs();
  initMap();
});

// Tab Navigation Logic
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(target).classList.add('active');

      if (target === 'tab-dashboard' && map) {
        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    });
  });
}

// Fetch & Update Stats Overview
async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const stats = await res.json();
    document.getElementById('statDevotees').innerText = stats.devoteesMonitored.toLocaleString() + '+';
    document.getElementById('statActiveBands').innerText = stats.activeBands.toLocaleString();
    document.getElementById('statActiveCamps').innerText = stats.activeCamps;
    document.getElementById('statSosAlerts').innerText = stats.sosAlertsToday;
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// Load & Render Live SOS Alerts
async function loadAlerts() {
  try {
    const res = await fetch('/api/alerts');
    const alerts = await res.json();

    const tbody = document.getElementById('alertsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    alerts.forEach(alert => {
      const tr = document.createElement('tr');
      const priorityClass = alert.priority === 'CRITICAL' ? 'badge-critical' : alert.priority === 'HIGH' ? 'badge-high' : 'badge-moderate';
      
      tr.innerHTML = `
        <td><strong>${alert.id}</strong><br><small style="color: #64748b;">${alert.bandId}</small></td>
        <td>${alert.pilgrimName} (${alert.age} yrs)</td>
        <td>${alert.location}</td>
        <td><span class="badge ${priorityClass}">${alert.priority}</span></td>
        <td>${alert.issue}</td>
        <td><span class="badge badge-resolved">${alert.status}</span></td>
        <td><small>${alert.timestamp}</small></td>
      `;
      tbody.appendChild(tr);
    });

    updateMapMarkers(alerts);
  } catch (err) {
    console.error('Error loading alerts:', err);
  }
}

// Trigger Live SOS Button Simulation
async function triggerSosAlert() {
  const bandIdInput = document.getElementById('simBandId').value;
  const pilgrimNameInput = document.getElementById('simPilgrimName').value;
  const issueSelect = document.getElementById('simIssueSelect').value;

  const payload = {
    bandId: bandIdInput || 'BAND-882',
    pilgrimName: pilgrimNameInput || 'Arya mishra',
    age: 62,
    issue: issueSelect,
    priority: 'HIGH',
    location: 'Saswad Camp 2'
  };

  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      alert(`🚨 SOS ALERT SENT!\nAlert ID: ${result.alert.id}\nPilgrim: ${result.alert.pilgrimName}\nLocation: ${result.alert.location}\nIssue: ${result.alert.issue}`);
      loadStats();
      loadAlerts();
    }
  } catch (err) {
    console.error('Error triggering SOS alert:', err);
  }
}

// Load Medical Camps Data
async function loadCamps() {
  try {
    const res = await fetch('/api/camps');
    const camps = await res.json();
    const container = document.getElementById('campsListContainer');
    if (!container) return;

    container.innerHTML = '';
    camps.forEach(camp => {
      const card = document.createElement('div');
      card.className = 'tech-card';
      card.innerHTML = `
        <h4>🏥 ${camp.name}</h4>
        <p style="font-size: 0.85rem; color: #64748b;">Status: <strong style="color: #16a34a;">${camp.status}</strong></p>
        <ul style="margin-top: 0.5rem;">
          <li>Doctors Available: ${camp.doctorsOnDuty}</li>
          <li>Beds Available: ${camp.bedsAvailable}</li>
          <li>ORS Packets: ${camp.orsStock}</li>
          <li>Paracetamol Stock: ${camp.paracetamolStock}</li>
        </ul>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading camps:', err);
  }
}

// Load & Submit Volunteer Symptoms
async function loadVolunteers() {
  try {
    const res = await fetch('/api/volunteers');
    const logs = await res.json();
    const list = document.getElementById('volunteerLogsList');
    if (!list) return;

    list.innerHTML = '';
    logs.forEach(log => {
      const li = document.createElement('div');
      li.className = 'tech-card';
      li.style.marginBottom = '0.75rem';
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>👤 ${log.volunteerName} (${log.dindiNumber})</strong>
          <small style="color: #94a3b8;">${log.timestamp}</small>
        </div>
        <p style="font-size: 0.88rem; color: #d97706; margin-top: 0.25rem;">Log: ${log.symptom} (${log.pilgrimsTreated} pilgrims assisted)</p>
        <p style="font-size: 0.8rem; color: #64748b;">Status: ${log.washIssue}</p>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading volunteer logs:', err);
  }
}

async function submitVolunteerLog(e) {
  e.preventDefault();
  const vName = document.getElementById('vName').value;
  const dindiNum = document.getElementById('dindiNum').value;
  const symptomText = document.getElementById('symptomText').value;
  const treatedCount = document.getElementById('treatedCount').value;

  try {
    const res = await fetch('/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        volunteerName: vName,
        dindiNumber: dindiNum,
        symptom: symptomText,
        pilgrimsTreated: treatedCount
      })
    });
    const result = await res.json();
    if (result.success) {
      alert('✅ Volunteer Log entry saved successfully!');
      loadVolunteers();
    }
  } catch (err) {
    console.error('Error submitting volunteer log:', err);
  }
}

// Load & Simulate IVR Helpline
async function loadIvrLogs() {
  try {
    const res = await fetch('/api/ivr');
    const logs = await res.json();
    const tbody = document.getElementById('ivrTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${log.callId}</strong></td>
        <td>${log.callerType}</td>
        <td>${log.language}</td>
        <td><strong style="color: #d97706;">${log.optionSelected}</strong></td>
        <td>${log.assignedCamp}</td>
        <td><small>${log.timestamp}</small></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading IVR logs:', err);
  }
}

async function pressIvrKey(key) {
  const display = document.getElementById('ivrScreenDisplay');
  const optionNames = {
    '1': 'मराठी IVR: 🚨 वैद्यकीय मदत (Emergency Aid)',
    '2': 'मराठी IVR: 🧼 स्वच्छता / तक्रार (Sanitation)',
    '3': 'मराठी IVR: 🏥 जवळचे वैद्यकीय केंद्र (Medical Post Location)',
    '4': 'मराठी IVR: 🚰 पिण्याचे पाणी (Drinking Water Info)'
  };
  display.innerText = optionNames[key] || `Key ${key} pressed`;

  try {
    const res = await fetch('/api/ivr/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ option: key })
    });
    const result = await res.json();
    if (result.success) {
      loadIvrLogs();
    }
  } catch (err) {
    console.error('Error simulating IVR:', err);
  }
}

// Initialize Leaflet Map for Wari Route using Google Maps Tiles
function initMap() {
  const mapElement = document.getElementById('wariMap');
  if (!mapElement || typeof L === 'undefined') return;

  // Center around Pune - Saswad - Pandharpur Wari Route
  map = L.map('wariMap').setView([18.1500, 74.5000], 9);

  // Use Google Maps Tile Layer
  L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    attribution: '&copy; Google Maps | Pandharpur Wari Palkhi Route'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  // Actual Wari Route Points following actual highways (MH SH 114 / NH 965 Palkhi Marg)
  const wariRouteCoordinates = [
    [18.6771, 73.8967], // Alandi
    [18.5204, 73.8567], // Pune City (Sangamwadi)
    [18.4500, 73.9300], // Hadapsar
    [18.3986, 73.9975], // Dive Ghat (Famous Scenic Wari Pass)
    [18.3438, 74.0305], // Saswad
    [18.2778, 74.1593], // Jejuri (Lord Khandoba Temple)
    [18.0375, 74.1842], // Lonand
    [17.9886, 74.4328], // Phaltan
    [17.9042, 74.7208], // Natepute
    [17.8427, 74.8872], // Malshiras
    [17.7289, 75.2789], // Wakhari (Palkhi Meet Point)
    [17.6775, 75.3283]  // Pandharpur Vitthal Temple
  ];

  // Draw smooth polyline for actual Wari route
  const polyline = L.polyline(wariRouteCoordinates, {
    color: '#d97706',
    weight: 5,
    opacity: 0.85
  }).addTo(map);

  map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
}

function updateMapMarkers(alerts) {
  if (!map || !markersGroup) return;
  markersGroup.clearLayers();

  alerts.forEach(alert => {
    if (alert.lat && alert.lng) {
      const marker = L.marker([alert.lat, alert.lng]).addTo(markersGroup);
      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a;">
          <h4 style="color: #d97706; margin-bottom: 4px;">🚨 ${alert.id}</h4>
          <p style="margin:2px 0;"><strong>Pilgrim:</strong> ${alert.pilgrimName} (${alert.age} yrs)</p>
          <p style="margin:2px 0;"><strong>Issue:</strong> ${alert.issue}</p>
          <p style="margin:2px 0;"><strong>Location:</strong> ${alert.location}</p>
          <p style="margin:2px 0;"><strong>Band ID:</strong> ${alert.bandId}</p>
        </div>
      `);
    }
  });
}
