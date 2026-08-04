const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedSelect = document.getElementById('speedSelect');

// --- CARREGAMENTO DE ASSETS (BOLA AMARELA E GOLEIRO) ---
const images = {
  ball: new Image(),
  keeper: new Image()
};

// Bola de Futebol Amarela (Alto Contraste)
images.ball.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23ffea00" stroke="%23000" stroke-width="5"/><polygon points="50,20 65,32 59,50 41,50 35,32" fill="%23000"/><polygon points="50,80 35,68 41,50 59,50 65,68" fill="%23000"/><polygon points="20,50 32,35 50,41 50,59 32,65" fill="%23000"/><polygon points="80,50 68,35 50,41 50,59 68,65" fill="%23000"/></svg>';

// Goleiro Ilustrado
images.keeper.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 160"><rect x="30" y="50" width="40" height="60" rx="10" fill="%23d500f9"/><circle cx="50" cy="30" r="20" fill="%23ffcc80"/><rect x="25" y="110" width="20" height="45" fill="%23212121"/><rect x="55" y="110" width="20" height="45" fill="%23212121"/><rect x="10" y="55" width="20" height="15" rx="5" fill="%2300e676"/><rect x="70" y="55" width="20" height="15" rx="5" fill="%2300e676"/></svg>';

// --- SISTEMA DE ÁUDIO SINTETIZADO E VOZ ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playKickSound() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function shoutGoal() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Goooooool!");
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    utterance.pitch = 1.3;
    window.speechSynthesis.speak(utterance);
  }
}

function playGoalSound() {
  initAudio();
  shoutGoal();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2500, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);

  [261.63, 329.63, 392.00, 523.25].forEach((freq, index) => {
    const chordOsc = audioCtx.createOscillator();
    const chordGain = audioCtx.createGain();
    chordOsc.type = 'triangle';
    chordOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + 0.1);
    chordGain.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
    chordGain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.2);
    chordGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
    chordOsc.connect(chordGain);
    chordGain.connect(audioCtx.destination);
    chordOsc.start(audioCtx.currentTime + 0.1 + (index * 0.05));
    chordOsc.stop(audioCtx.currentTime + 1.2);
  });
}

function playSaveSound() {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// --- ESTADO DO JOGO ---
let speed = parseFloat(speedSelect.value);
let angle = -Math.PI; 
let direction = 1; 
let isShot = false;
let shotResult = "";
let score = 0;

let ballX = 400;
let ballY = 400;
let ballScale = 1.0; 
let keeperX = 360; 
let keeperTargetX = 360; 

speedSelect.addEventListener('change', (e) => {
  speed = parseFloat(e.target.value);
});

function update() {
  if (!isShot) {
    angle += speed * direction;
    if (angle >= 0) direction = -1;
    if (angle <= -Math.PI) direction = 1;
    keeperX += (360 - keeperX) * 0.1;
    ballScale = 1.0;
  } else {
    if (ballY > 160) {
      ballY -= 10;
      ballScale = Math.max(0.5, ballScale - 0.02);
    }
    if (Math.abs(keeperX - keeperTargetX) > 2) {
      keeperX += (keeperTargetX - keeperX) * 0.15;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Gramado
  let fieldGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  fieldGradient.addColorStop(0, '#1b5e20');
  fieldGradient.addColorStop(1, '#388e3c');
  ctx.fillStyle = fieldGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < canvas.height; i += 40) {
    if ((i / 40) % 2 === 0) ctx.fillRect(0, i, canvas.width, 20);
  }

  // 2. Trave de Gol Com Espessura Aumentada (Mais Visível)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 24; // Sombra mais grossa
  ctx.strokeRect(148, 82, 504, 200);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 18; // Trave reforçada para alta visibilidade
  ctx.strokeRect(150, 80, 500, 200);

  // Rede
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  for (let x = 150; x <= 650; x += 15) {
    ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, 280); ctx.stroke();
  }
  for (let y = 80; y <= 280; y += 15) {
    ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(650, y); ctx.stroke();
  }

  // 3. Goleiro
  ctx.drawImage(images.keeper, keeperX, 160, 80, 120);

  // 4. Velocímetro
  const cx = 400, cy = 440, radius = 75;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, -Math.PI, 0);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fill();

  drawArc(cx, cy, radius, -Math.PI, -Math.PI * 0.65, '#00e676'); 
  drawArc(cx, cy, radius, -Math.PI * 0.65, -Math.PI * 0.35, '#ff1744'); 
  drawArc(cx, cy, radius, -Math.PI * 0.35, 0, '#00e676'); 

  // Seta Laranja de Alto Contraste
  if (!isShot) {
    ctx.shadowColor = '#ff6d00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
    ctx.lineWidth = 8; // Seta mais espessa
    ctx.strokeStyle = '#ff6d00'; // Laranja Vibrante
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 5. Bola Amarela
  const ballRadius = 22 * ballScale;
  
  ctx.beginPath();
  ctx.ellipse(ballX, ballY + ballRadius - 2, ballRadius, ballRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();

  ctx.drawImage(images.ball, ballX - ballRadius, ballY - ballRadius, ballRadius * 2, ballRadius * 2);

  // 6. Placar e Interface
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(20, 20, 160, 45);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 160, 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`PONTOS: ${score}`, 35, 50);

  if (isShot) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = shotResult.includes("GOL") ? '#00e676' : '#ff1744';
    ctx.fillText(shotResult, 160, 50);
  } else {
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("CLIQUE ou Pressione ESPAÇO para Chutar", 230, 485);
  }
}

function drawArc(cx, cy, r, start, end, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.lineWidth = 14;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleAction() {
  if (isShot) {
    isShot = false;
    ballX = 400;
    ballY = 400;
    keeperX = 360;
    return;
  }

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  isShot = true;
  playKickSound();

  const normalized = (angle + Math.PI) / Math.PI; 
  const targetX = 150 + (normalized * 500);
  ballX = targetX;

  const randomSide = Math.random() < 0.6 
    ? (targetX < 400 ? 180 : 540) 
    : (targetX < 400 ? 540 : 180);

  if (targetX >= 340 && targetX <= 460) {
    keeperTargetX = 360;
  } else {
    keeperTargetX = randomSide;
  }

  setTimeout(() => {
    const saved = Math.abs(keeperTargetX - (targetX - 40)) < 60 || (targetX >= 340 && targetX <= 460);

    if (saved) {
      playSaveSound();
      shotResult = "DEFENDEU O GOLEIRO! (Clique para tentar de novo)";
    } else {
      score += 10;
      playGoalSound();
      shotResult = "GOOOOOOL!! (Clique para jogar de novo)";
    }
  }, 250); 
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') handleAction();
});

canvas.addEventListener('pointerdown', handleAction);

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();