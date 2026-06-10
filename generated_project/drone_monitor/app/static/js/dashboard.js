// Dashboard logic: WebSocket, drone cards, charts
const socket = io();
let batChart, altChart;
const chartHistory = {};
const MAX_CHART_POINTS = 30;

function initCharts() {
  const chartOpts = (label, color) => ({
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { labels: { color: '#8b949e', font: { size: 10 } } } },
      scales: {
        x: { ticks: { color: '#6e7681', font: { size: 9 } }, grid: { color: '#21262d' } },
        y: { ticks: { color: '#6e7681', font: { size: 9 } }, grid: { color: '#21262d' } }
      }
    }
  });
  batChart = new Chart(document.getElementById('bat-chart'), chartOpts('battery'));
  altChart = new Chart(document.getElementById('alt-chart'), chartOpts('altitude'));
}

const DRONE_COLORS_CSS = ['#00d4ff', '#ff6b35', '#39ff14', '#ff3cac'];

function updateCharts(drones) {
  const label = new Date().toLocaleTimeString();

  drones.forEach((d, idx) => {
    if (!chartHistory[d.id]) chartHistory[d.id] = { bat: [], alt: [], labels: [] };
    const h = chartHistory[d.id];
    h.bat.push(d.battery);
    h.alt.push(d.altitude);
    h.labels.push(label);
    if (h.bat.length > MAX_CHART_POINTS) { h.bat.shift(); h.alt.shift(); h.labels.shift(); }
  });

  function syncDataset(chart, key) {
    chart.data.labels = Object.values(chartHistory)[0]?.labels || [];
    chart.data.datasets = drones.map((d, idx) => ({
      label: d.id,
      data: chartHistory[d.id]?.[key] || [],
      borderColor: DRONE_COLORS_CSS[idx % DRONE_COLORS_CSS.length],
      backgroundColor: 'transparent',
      borderWidth: 1.5, pointRadius: 1, tension: 0.3
    }));
    chart.update('none');
  }
  if (batChart) syncDataset(batChart, 'bat');
  if (altChart) syncDataset(altChart, 'alt');
}

function statusClass(s) {
  const map = { flying:'flying', warning:'warning', critical:'critical',
                landing:'landing', returning:'returning' };
  return 'status-' + (map[s] || 'flying');
}
function statusLabel(s) {
  const map = { flying:'飛行中', warning:'警告', critical:'緊急',
                landing:'着陸中', returning:'帰還中' };
  return map[s] || s;
}

function renderDroneList(drones) {
  const list = document.getElementById('drone-list');
  const sel = document.getElementById('cmd-drone');
  const prevSel = sel.value;

  list.innerHTML = drones.map((d, idx) => {
    const batColor = d.battery > 50 ? '#3fb950' : d.battery > 20 ? '#e3b341' : '#f85149';
    return `<div class="drone-card" onclick="selectDrone('${d.id}')">
      <div class="drone-header">
        <span class="drone-id" style="color:${DRONE_COLORS_CSS[idx%DRONE_COLORS_CSS.length]}">${d.id}</span>
        <span class="drone-status ${statusClass(d.status)}">${statusLabel(d.status)}</span>
      </div>
      <div class="drone-metrics">
        <div class="metric"><div class="metric-label">バッテリー</div>
          <div class="metric-value" style="color:${batColor}">${d.battery}%</div></div>
        <div class="metric"><div class="metric-label">速度</div>
          <div class="metric-value">${d.speed} m/s</div></div>
        <div class="metric"><div class="metric-label">高度</div>
          <div class="metric-value">${d.altitude} m</div></div>
        <div class="metric"><div class="metric-label">方位</div>
          <div class="metric-value">${d.heading}°</div></div>
      </div>
      <div class="bat-bar-wrap">
        <div class="bat-bar" style="width:${d.battery}%;background:${batColor}"></div>
      </div>
    </div>`;
  }).join('');

  sel.innerHTML = drones.map(d => `<option value="${d.id}">${d.id}</option>`).join('');
  if (prevSel) sel.value = prevSel;
}

function selectDrone(id) {}

function sendCommand() {
  const drone_id = document.getElementById('cmd-drone').value;
  const command = document.getElementById('cmd-type').value;
  fetch('/api/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drone_id, command, params: {} })
  });
}

socket.on('connect', () => {
  document.getElementById('conn-status').textContent = '接続中';
  document.getElementById('conn-status').className = 'status-badge connected';
});
socket.on('disconnect', () => {
  document.getElementById('conn-status').textContent = '切断';
  document.getElementById('conn-status').className = 'status-badge disconnected';
});
socket.on('drone_update', (drones) => {
  renderDroneList(drones);
  updateCharts(drones);
  if (typeof updateDroneObjects === 'function') updateDroneObjects(drones);
});

window.addEventListener('load', () => { initCharts(); });
