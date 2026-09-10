const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const ui = {
  distance: document.getElementById('distanceValue'),
  best: document.getElementById('bestValue'),
  coins: document.getElementById('coinValue'),
  fuel: document.getElementById('fuelFill'),
  mission: document.getElementById('missionProgress'),
  stage: document.getElementById('stageValue'),
  start: document.getElementById('startOverlay'),
  pause: document.getElementById('pauseOverlay'),
  finish: document.getElementById('finishOverlay'),
  final: document.getElementById('finalDistance'),
  upgradeCost: document.getElementById('upgradeCost')
};

const keys = { gas: false, brake: false };
let state = 'ready';
let distance = 0;
let best = Number(localStorage.getItem('summit-best') || 0);
let coins = Number(localStorage.getItem('summit-coins') || 0);
let fuel = 100;
let engineLevel = Number(localStorage.getItem('summit-engine') || 0);
let cameraX = 0;
let lastTime = 0;
let particles = [];
let pickups = [];
let fuelPickups = [];
let hills = [];
let vehicleType = 'car';

const car = {
  x: 240,
  y: 0,
  vx: 0,
  vy: 0,
  angle: 0,
  angular: 0,
  wheelSpin: 0,
  grounded: false
};

function stageNameFor(distanceValue) {
  if (distanceValue < 300) return 'ALPINE PASS';
  if (distanceValue < 700) return 'GLACIER RUN';
  if (distanceValue < 1100) return 'RIDGE RAMP';
  if (distanceValue < 1500) return 'SUMMIT TRAIL';
  return 'PEAK ATTACK';
}

function baseTerrainY(x) {
  return 500
    - Math.sin(x * 0.0041) * 56
    - Math.sin(x * 0.0097 + 1.7) * 24
    - Math.sin(x * 0.017 + 0.4) * 12
    + Math.sin(x * 0.0022) * 28;
}

function bridgeAt(x) {
  const start = 1300 + Math.floor((x - 1300) / 2600) * 2600;
  const local = x - start;
  return local >= 0 && local <= 360 ? { start, end: start + 360, y: baseTerrainY(start + 180) - 16 } : null;
}

function terrainY(x) {
  return bridgeAt(x) ? H + 220 : baseTerrainY(x);
}

function terrainSlope(x) {
  if (bridgeAt(x) || bridgeAt(x - 4) || bridgeAt(x + 4)) return 0;
  return (terrainY(x + 4) - terrainY(x - 4)) / 8;
}

function seedWorld() {
  hills = [];
  pickups = [];
  fuelPickups = [];

  for (let x = 0; x < 7000; x += 120) {
    hills.push({ x, y: terrainY(x), size: 48 + ((x / 120) % 3) * 18 });
  }

  for (let x = 500; x < 7000; x += 470) {
    pickups.push({ x, y: baseTerrainY(x) - 52, taken: false, spin: Math.random() * 6 });
  }

  for (let x = 820; x < 7000; x += 1020) {
    fuelPickups.push({ x, y: baseTerrainY(x) - 54, taken: false, spin: Math.random() * 6 });
  }
}

function reset() {
  distance = 0;
  fuel = 100;
  cameraX = 0;
  particles = [];
  pickups.forEach(item => { item.taken = false; });
  fuelPickups.forEach(item => { item.taken = false; });

  car.x = 240;
  car.y = terrainY(car.x) - (vehicleType === 'bike' ? 42 : 58);
  car.vx = 0;
  car.vy = 0;
  car.angle = 0;
  car.angular = 0;
  car.grounded = false;

  ui.distance.textContent = 0;
  ui.best.textContent = best;
  ui.coins.textContent = coins;
  ui.fuel.style.width = '100%';
  ui.stage.textContent = stageNameFor(0);
  ui.mission.style.width = '0%';

  state = 'playing';
  ui.start.classList.add('hidden');
  ui.pause.classList.add('hidden');
  ui.finish.classList.add('hidden');
}

function setButton(id, prop) {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', e => {
    e.preventDefault();
    keys[prop] = true;
  });

  ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => {
    button.addEventListener(type, () => { keys[prop] = false; });
  });
}

function spawnDust(x, y, count = 2) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: -Math.random() * 1.8 - 0.6,
      vy: -Math.random() * 1.4,
      life: 1,
      size: 2 + Math.random() * 4
    });
  }
}

function update(dt) {
  if (state !== 'playing') return;

  const gas = keys.gas ? 1 : 0;
  const brake = keys.brake ? 1 : 0;
  const slope = terrainSlope(car.x);
  const traction = (vehicleType === 'bike' ? 0.32 : 0.24) + engineLevel * 0.04;

  car.vx += (gas * traction - brake * 0.18) * dt * 60;
  car.vx += Math.sin(car.angle) * 0.18 * dt * 60;
  car.vx *= Math.pow(0.985, dt * 60);

  const maxSpeed = vehicleType === 'bike' ? 19 + engineLevel * 1.45 : 15 + engineLevel * 1.15;
  car.vx = Math.max(-3.8, Math.min(maxSpeed, car.vx));

  car.vy += 16 * dt;
  car.x += car.vx * dt * 60;
  car.y += car.vy * dt * 60;

  const bridge = bridgeAt(car.x);
  const groundY = bridge ? bridge.y - (vehicleType === 'bike' ? 38 : 56) : terrainY(car.x) - (vehicleType === 'bike' ? 38 : 56);

  if (car.y >= groundY) {
    car.y = groundY;
    car.vy = -car.vy * 0.12;
    car.grounded = true;

    const targetAngle = Math.max(-1.4, Math.min(1.4, slope * 2.6));
    car.angle += (targetAngle - car.angle) * 0.12;
    car.angular += (targetAngle - car.angle) * 0.08;

    if (Math.abs(car.vx) > 1 && gas) {
      spawnDust(car.x - 44, groundY + 18, 1);
    }
  } else {
    car.grounded = false;
    car.angular += (car.vx * 0.0045) * dt * 60;
    car.angle += car.angular * dt * 60;
  }

  car.angle += car.angular * dt * 60;
  car.angular *= 0.92;
  car.wheelSpin += car.vx * dt * 1.25;

  cameraX += (car.x - cameraX - 340) * Math.min(1, dt * 3.2);
  cameraX = Math.max(0, cameraX);

  distance = Math.max(distance, Math.floor((car.x - 240) / 8));
  fuel -= (gas ? 1.9 : 0.18) * dt * 60;

  pickups.forEach(item => {
    if (!item.taken && Math.abs(item.x - car.x) < 52 && Math.abs(item.y - car.y) < 58) {
      item.taken = true;
      coins += 10;
      spawnDust(item.x, item.y, 10);
    }
  });

  fuelPickups.forEach(item => {
    if (!item.taken && Math.abs(item.x - car.x) < 52 && Math.abs(item.y - car.y) < 64) {
      item.taken = true;
      fuel = Math.min(100, fuel + 38);
      spawnDust(item.x, item.y, 14);
    }
  });

  particles.forEach(p => {
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += 0.05 * dt * 60;
    p.life -= dt * 1.65;
  });
  particles = particles.filter(p => p.life > 0);

  if (fuel <= 0 || Math.abs(car.angle) > 1.8 || car.y > H + 180) {
    endRun();
    return;
  }

  ui.distance.textContent = distance;
  ui.best.textContent = Math.max(best, distance);
  ui.coins.textContent = coins;
  ui.fuel.style.width = `${Math.max(0, fuel)}%`;
  ui.mission.style.width = `${Math.min(100, (distance / 1500) * 100)}%`;
  ui.stage.textContent = stageNameFor(distance);
}

function endRun() {
  if (state !== 'playing') return;

  state = 'finished';
  best = Math.max(best, distance);
  localStorage.setItem('summit-best', best);
  localStorage.setItem('summit-coins', coins);

  ui.final.textContent = distance;
  ui.finish.classList.remove('hidden');
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#78a8b3');
  sky.addColorStop(0.54, '#c5dcd0');
  sky.addColorStop(1, '#d9d2a1');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255,249,232,0.72)';
  ctx.beginPath();
  ctx.arc(1010, 110, 58, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 7; i++) {
    const x = (i * 240 - cameraX * 0.12) % 1500;
    ctx.beginPath();
    ctx.ellipse(x, 140 + (i % 2) * 50, 100, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMountainLayer('#718fa0', 0.12, 410, 110);
  drawMountainLayer('#557f74', 0.18, 460, 86);
}

function drawMountainLayer(color, factor, base, amp) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W + 100; x += 70) {
    const wx = x + cameraX * factor;
    const y = base - Math.sin(wx * 0.004) * amp - Math.sin(wx * 0.011 + 2) * amp * 0.3;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawTerrain() {
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = -20; x <= W + 20; x += 5) {
    ctx.lineTo(x, terrainY(x + cameraX));
  }
  ctx.lineTo(W, H);
  ctx.closePath();

  const ground = ctx.createLinearGradient(0, 390, 0, H);
  ground.addColorStop(0, '#4f7c5b');
  ground.addColorStop(1, '#1e4d3d');
  ctx.fillStyle = ground;
  ctx.fill();

  ctx.beginPath();
  for (let x = -20; x <= W + 20; x += 5) {
    const y = terrainY(x + cameraX);
    if (x === -20) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#d5c27c';
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#6d8d65';
  ctx.stroke();
}

function drawTrees() {
  hills.forEach(hill => {
    const x = hill.x - cameraX * 0.88;
    if (x < -60 || x > W + 60) return;

    const y = terrainY(hill.x);
    ctx.fillStyle = '#214c43';
    ctx.beginPath();
    ctx.moveTo(x, y - hill.size * 1.7);
    ctx.lineTo(x - hill.size * 0.7, y - 6);
    ctx.lineTo(x + hill.size * 0.7, y - 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2f6559';
    ctx.beginPath();
    ctx.moveTo(x, y - hill.size * 1.2);
    ctx.lineTo(x - hill.size * 0.9, y + 12);
    ctx.lineTo(x + hill.size * 0.9, y + 12);
    ctx.closePath();
    ctx.fill();
  });
}

function drawBridges() {
  const first = 1300 + Math.floor((cameraX - 1300) / 2600) * 2600;

  for (let start = first; start < cameraX + W + 2600; start += 2600) {
    const bridge = bridgeAt(start + 10);
    if (!bridge) continue;

    const x = bridge.start - cameraX;
    if (x > W + 40 || x + 360 < -40) continue;

    ctx.fillStyle = '#5f3f2d';
    ctx.fillRect(x, bridge.y + 10, 360, 12);
    ctx.fillStyle = '#b57a43';
    ctx.fillRect(x, bridge.y, 360, 12);

    ctx.strokeStyle = '#f0d48d';
    ctx.lineWidth = 3;
    for (let plank = 0; plank < 360; plank += 32) {
      ctx.strokeRect(x + plank, bridge.y - 1, 26, 14);
    }

    ctx.strokeStyle = '#4d382a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 10, bridge.y - 3);
    ctx.lineTo(x + 10, bridge.y + 74);
    ctx.moveTo(x + 350, bridge.y - 3);
    ctx.lineTo(x + 350, bridge.y + 74);
    ctx.stroke();
  }
}

function drawPickups() {
  pickups.forEach(item => {
    const x = item.x - cameraX;
    if (item.taken || x < -30 || x > W + 30) return;

    item.spin += 0.04;
    ctx.save();
    ctx.translate(x, item.y);
    ctx.rotate(Math.sin(item.spin) * 0.18);
    ctx.fillStyle = '#f4c84f';
    ctx.strokeStyle = '#fff0ad';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#9d6119';
    ctx.font = 'bold 15px Space Grotesk';
    ctx.textAlign = 'center';
    ctx.fillText('$', 0, 5);
    ctx.restore();
  });
}

function drawFuelPickups() {
  fuelPickups.forEach(item => {
    const x = item.x - cameraX;
    if (item.taken || x < -30 || x > W + 30) return;

    item.spin += 0.035;
    ctx.save();
    ctx.translate(x, item.y + Math.sin(item.spin) * 3);
    ctx.fillStyle = '#df6547';
    ctx.strokeStyle = '#ffe8aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-11, -15, 22, 31, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff4cd';
    ctx.fillRect(-5, -8, 10, 7);
    ctx.fillStyle = '#f9d45a';
    ctx.fillRect(7, -10, 6, 5);
    ctx.restore();
  });
}

function drawWheel(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(car.wheelSpin);
  ctx.fillStyle = '#1a3635';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#8e9a89';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.strokeStyle = '#f4cc6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r + 4, 0);
  ctx.lineTo(r - 4, 0);
  ctx.moveTo(0, -r + 4);
  ctx.lineTo(0, r - 4);
  ctx.stroke();
  ctx.restore();
}

function drawCar() {
  const x = car.x - cameraX;
  const y = car.y;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(car.angle);

  ctx.fillStyle = 'rgba(17,40,35,0.24)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 88, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  drawWheel(-47, 24, 18);
  drawWheel(48, 24, 18);

  ctx.fillStyle = '#f16d3c';
  ctx.beginPath();
  ctx.roundRect(-68, -29, 136, 51, 13);
  ctx.fill();

  ctx.fillStyle = '#f7bf48';
  ctx.beginPath();
  ctx.moveTo(-33, -29);
  ctx.lineTo(-6, -58);
  ctx.lineTo(30, -58);
  ctx.lineTo(49, -29);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#234c41';
  ctx.beginPath();
  ctx.moveTo(-4, -51);
  ctx.lineTo(7, -51);
  ctx.lineTo(19, -31);
  ctx.lineTo(-15, -31);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#f8d370';
  ctx.fillRect(-60, -10, 14, 9);
  ctx.fillRect(48, -8, 10, 8);

  ctx.fillStyle = '#1a473d';
  ctx.fillRect(-22, 6, 35, 8);
  ctx.restore();
}

function drawBike() {
  const x = car.x - cameraX;
  const y = car.y;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(car.angle);

  ctx.fillStyle = 'rgba(17,40,35,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 24, 72, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawWheel(-39, 24, 15);
  drawWheel(39, 24, 15);

  ctx.strokeStyle = '#f7c64a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-39, 25);
  ctx.lineTo(-7, -7);
  ctx.lineTo(39, 25);
  ctx.lineTo(12, 1);
  ctx.lineTo(-7, -7);
  ctx.stroke();

  ctx.fillStyle = '#eb5d3b';
  ctx.beginPath();
  ctx.roundRect(-21, -28, 42, 16, 8);
  ctx.fill();

  ctx.fillStyle = '#254e42';
  ctx.beginPath();
  ctx.arc(4, -46, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#254e42';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(4, -34);
  ctx.lineTo(-5, -8);
  ctx.lineTo(18, 2);
  ctx.moveTo(-5, -8);
  ctx.lineTo(-21, 5);
  ctx.stroke();

  ctx.strokeStyle = '#f7c64a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(37, 24);
  ctx.lineTo(49, -1);
  ctx.lineTo(33, -8);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = '#d8c892';
    ctx.beginPath();
    ctx.arc(p.x - cameraX, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawTrees();
  drawTerrain();
  drawBridges();
  drawPickups();
  drawFuelPickups();
  drawParticles();
  if (vehicleType === 'bike') drawBike(); else drawCar();
}

function loop(time) {
  const dt = Math.min(0.035, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function start() {
  reset();
}

document.getElementById('startButton').onclick = start;
document.getElementById('restartButton').onclick = start;
document.getElementById('resumeButton').onclick = () => {
  state = 'playing';
  ui.pause.classList.add('hidden');
};

document.getElementById('bikeButton').onclick = () => {
  vehicleType = vehicleType === 'car' ? 'bike' : 'car';
  document.getElementById('bikeButton').textContent = vehicleType === 'bike' ? 'CAR' : 'BIKE';
  if (state !== 'playing') {
    car.y = terrainY(car.x) - (vehicleType === 'bike' ? 42 : 58);
  }
};

document.getElementById('pauseButton').onclick = () => {
  if (state === 'playing') {
    state = 'paused';
    ui.pause.classList.remove('hidden');
  } else if (state === 'paused') {
    state = 'playing';
    ui.pause.classList.add('hidden');
  }
};

document.getElementById('upgradeButton').onclick = () => {
  const cost = 120 + engineLevel * 80;
  if (coins >= cost) {
    coins -= cost;
    engineLevel++;
    ui.upgradeCost.textContent = 120 + engineLevel * 80;
    localStorage.setItem('summit-engine', engineLevel);
    localStorage.setItem('summit-coins', coins);
    ui.coins.textContent = coins;
  }
};

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key === 'd' || key === 'arrowright') keys.gas = true;
  if (key === 'a' || key === 'arrowleft') keys.brake = true;
  if (key === 'escape') document.getElementById('pauseButton').click();
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (key === 'd' || key === 'arrowright') keys.gas = false;
  if (key === 'a' || key === 'arrowleft') keys.brake = false;
});

setButton('gasButton', 'gas');
setButton('brakeButton', 'brake');

best = Math.max(0, best);
ui.best.textContent = best;
ui.coins.textContent = coins;
ui.upgradeCost.textContent = 120 + engineLevel * 80;
ui.stage.textContent = stageNameFor(0);

seedWorld();
reset();
state = 'ready';
ui.start.classList.remove('hidden');
requestAnimationFrame(loop);
