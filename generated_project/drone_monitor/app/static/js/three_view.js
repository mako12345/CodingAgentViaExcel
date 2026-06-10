// Three.js 3D Drone Viewer
let scene, camera, renderer, controls;
let droneObjects = {};
let gridHelper, axesHelper;

const DRONE_COLORS = [0x00d4ff, 0xff6b35, 0x39ff14, 0xff3cac];
const COLOR_MAP = {};

function initThree() {
  const canvas = document.getElementById('three-canvas');
  const container = canvas.parentElement;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);
  scene.fog = new THREE.FogExp2(0x0d1117, 0.015);

  const w = container.clientWidth, h = container.clientHeight - 36;
  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
  camera.position.set(30, 25, 30);
  camera.lookAt(0, 10, 0);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;

  // Grid
  gridHelper = new THREE.GridHelper(40, 20, 0x1a3a5c, 0x1a3a5c);
  scene.add(gridHelper);

  // Axes
  axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // Ambient light
  scene.add(new THREE.AmbientLight(0x404060, 2));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // Orbit controls (manual)
  controls = { isDragging: false, prevX: 0, prevY: 0, theta: 0.8, phi: 0.5, radius: 55 };

  canvas.addEventListener('mousedown', e => {
    controls.isDragging = true;
    controls.prevX = e.clientX;
    controls.prevY = e.clientY;
  });
  canvas.addEventListener('mouseup', () => { controls.isDragging = false; });
  canvas.addEventListener('mousemove', e => {
    if (!controls.isDragging) return;
    const dx = e.clientX - controls.prevX;
    const dy = e.clientY - controls.prevY;
    controls.theta -= dx * 0.005;
    controls.phi = Math.max(0.1, Math.min(Math.PI / 2, controls.phi - dy * 0.005));
    controls.prevX = e.clientX;
    controls.prevY = e.clientY;
    updateCamera();
  });
  canvas.addEventListener('wheel', e => {
    controls.radius = Math.max(10, Math.min(100, controls.radius + e.deltaY * 0.05));
    updateCamera();
  });

  // Touch support
  let lastTouch = null;
  canvas.addEventListener('touchstart', e => {
    lastTouch = e.touches[0];
  });
  canvas.addEventListener('touchmove', e => {
    if (!lastTouch) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.clientX;
    const dy = t.clientY - lastTouch.clientY;
    controls.theta -= dx * 0.005;
    controls.phi = Math.max(0.1, Math.min(Math.PI / 2, controls.phi - dy * 0.005));
    lastTouch = t;
    updateCamera();
    e.preventDefault();
  }, { passive: false });

  updateCamera();
  animate();

  window.addEventListener('resize', onResize);
}


function updateCamera() {
  const { theta, phi, radius } = controls;
  camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
  camera.position.y = radius * Math.cos(phi);
  camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
  camera.lookAt(0, 8, 0);
}

function resetCamera() {
  controls.theta = 0.8; controls.phi = 0.5; controls.radius = 55;
  updateCamera();
}

function getOrCreateDrone(id, idx) {
  if (droneObjects[id]) return droneObjects[id];
  const color = DRONE_COLORS[idx % DRONE_COLORS.length];
  COLOR_MAP[id] = color;

  const group = new THREE.Group();

  // Body sphere
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 8),
    new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
  );
  group.add(body);

  // Arms (4 directions)
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6),
      new THREE.MeshPhongMaterial({ color: 0x888888 })
    );
    const angle = (i / 4) * Math.PI * 2;
    arm.rotation.z = Math.PI / 2;
    arm.position.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
    arm.rotation.y = angle;
    group.add(arm);
  }

  // Propeller disks
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const prop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8),
      new THREE.MeshPhongMaterial({ color, transparent: true, opacity: 0.5 })
    );
    prop.position.set(Math.cos(angle) * 1.1, 0.1, Math.sin(angle) * 1.1);
    group.add(prop);
  }

  // Point light
  const plight = new THREE.PointLight(color, 1.5, 8);
  group.add(plight);

  // Trail line
  const trailGeo = new THREE.BufferGeometry();
  const trailMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.4 });
  const trail = new THREE.Line(trailGeo, trailMat);
  scene.add(trail);

  // Label (sprite)
  const canvas2 = document.createElement('canvas');
  canvas2.width = 128; canvas2.height = 32;
  const ctx = canvas2.getContext('2d');
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = 'bold 20px Arial';
  ctx.fillText(id, 4, 24);
  const tex = new THREE.CanvasTexture(canvas2);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }));
  sprite.scale.set(3, 0.75, 1);
  sprite.position.set(0, 1.5, 0);
  group.add(sprite);

  scene.add(group);
  droneObjects[id] = { group, trail, trailPositions: [] };
  return droneObjects[id];
}

function updateDroneObjects(drones) {
  drones.forEach((d, idx) => {
    const obj = getOrCreateDrone(d.id, idx);
    obj.group.position.set(d.x, d.y, d.z);

    // Trail
    obj.trailPositions.push(new THREE.Vector3(d.x, d.y, d.z));
    if (obj.trailPositions.length > 40) obj.trailPositions.shift();
    const pts = obj.trailPositions;
    obj.trail.geometry.setFromPoints(pts);
    obj.trail.geometry.needsUpdate = true;
  });
}

function animate() {
  requestAnimationFrame(animate);
  // Rotate propellers
  Object.values(droneObjects).forEach(obj => {
    obj.group.children.forEach(c => {
      if (c.geometry && c.geometry.type === 'CylinderGeometry') {
        c.rotation.y += 0.2;
      }
    });
  });
  renderer.render(scene, camera);
}

function onResize() {
  const container = document.getElementById('three-canvas').parentElement;
  const w = container.clientWidth, h = container.clientHeight - 36;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

window.addEventListener('load', initThree);
