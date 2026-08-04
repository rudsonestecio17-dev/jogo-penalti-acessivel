const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedSelect = document.getElementById('speedSelect');

// --- ASSETS E PERSONAGENS DETALHADOS (VETORIAIS) ---
const images = {
  ball: new Image(),
  keeper: new Image(),
  player: new Image()
};

// Bola Amarela de Alto Contraste
images.ball.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23ffea00" stroke="%23000" stroke-width="5"/><polygon points="50,20 65,32 59,50 41,50 35,32" fill="%23000"/><polygon points="50,80 35,68 41,50 59,50 65,68" fill="%23000"/><polygon points="20,50 32,35 50,41 50,59 32,65" fill="%23000"/><polygon points="80,50 68,35 50,41 50,59 68,65" fill="%23000"/></svg>';

// Goleiro Realista/Detalhado com Uniforme de Destaque
images.keeper.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><path d="M40 50 Q60 20 80 50 L90 110 L30 110 Z" fill="%2300bcd4"/><circle cx="60" cy="30" r="18" fill="%23ffcc80"/><rect x="42" y="48" width="36" height="65" rx="8" fill="%2300838f"/><rect x="35" y="113" width="22" height="60" rx="6" fill="%23212121"/><rect x="63" y="113" width="22" height="60" rx="6" fill="%23212121"/><rect x="15" y="60" width="25" height="15" rx="7" fill="%23ffeb3b"/><rect x="80" y="60" width="25" height="15" rx="7" fill="%23ffeb3b"/></svg>';

// Jogador Batedor Detalhado (Estilo Camisa Listrada)
images.player.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><path d="M40 45 Q60 15 80 45 L85 105 L35 105 Z" fill="%23b71c1c"/><path d="M52 45 L52 105 L68 105 L68 45 Z" fill="%230d47a1"/><circle cx="60" cy="25" r="17" fill="%23ffcc80"/><rect x="40" y="105" width="18" height="65" rx="6" fill="%23ffffff"/><rect x="62" y="105" width="18" height="65" rx="6" fill="%23ffffff"/><rect x="18" y="55" width="22" height="45" rx="8" fill="%23b71c1c"/><rect x="80" y="55" width="22" height="45" rx="8" fill="%230d47a1"/></svg>';

// --- SISTEMA DE ÁUDIO E VOZ ---
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

// --- VARIÁVEIS DE ESTADO E TORCIDA ---
let speed = parseFloat(speedSelect.value);
let angle = -Math.PI; 
let direction = 1; 
let isShot = false;
let isRunning = false;
let shotResult = "";
let score = 0;
let crowdFrame = 0; // Usado para animar a torcida

let ballX = 400;
let ballY = 400;
let ballScale = 1.0; 

let playerX = 320;
let playerY = 405;

let keeperX = 350; 
let keeperTargetX = 350; 

speedSelect.addEventListener('change', (e) => {
  speed = parseFloat(e.target.value);
});

function update() {
  crowdFrame += 0.1; // Incrementa a animação da torcida

  if (!isShot && !isRunning) {
    angle += speed * direction;
    if (angle >= 0) direction = -1;
    if (angle <= -Math.PI) direction = 1;
    
    keeperX += (350 - keeperX) * 0.1;
    playerX = 320;
    playerY = 405;
    ballScale = 1.0;
  } else if (isRunning) {
    playerX += 3;
    playerY -= 1;
    if (playerX >= 370) {
      isRunning = false;
      isShot = true;
      playKickSound();
    }
  } else if (isShot) {
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

  // 1. TORCIDA ANIMADA AO FUNDO (Arquibancada detalhada)
  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, canvas.width, 105);

  // Desenha centenas de espectadores em blocos coloridos que se movimentam levemente
  const colors = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#fdd835', '#ffffff'];
  let personIndex = 0;
  for (let y = 15; y < 85; y += 22) {
    for (let x = 10; x < canvas.width; x += 18) {
      ctx.fillStyle = colors[(Math.floor(personIndex + crowdFrame)) % colors.length];
      // Cabeças da torcida (com leve salto se for gol ou vibração constante)
      let bounce = shotResult.includes("GOL") ? Math.sin(crowdFrame * 3 + x) * 4 : Math.sin(crowdFrame + x) * 1.5;
      ctx.beginPath();
      ctx.arc(x, y + bounce, 6, 0, Math.PI * 2);
      ctx.fill();
      personIndex++;
    }
  }

  // Placa de Publicidade do Estádio
  ctx.fillStyle = '#ff6f00';
  ctx.fillRect(0, 88, canvas.width, 22);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('⚽ FLASH FOOTY ACESSÍVEL - TORCIDA UNIDA ⚽', 230, 104);

  // 2. Gramado Realista com Degradê
  let fieldGradient = ctx.createLinearGradient(0, 110, 0, canvas.height);
  fieldGradient.addColorStop(0, '#1b5e20');
  fieldGradient.addColorStop(1, '#2e7d32');
  ctx.fillStyle = fieldGradient;
  ctx.fillRect(0, 110, canvas.width, canvas.height - 110);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 110; i < canvas.height; i += 45) {
    if ((i / 45) % 2 === 0) ctx.fillRect(0, i, canvas.width, 22);
  }

  // Linhas da Grande Área
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 4;
  ctx.strokeRect(100, 110, 600, 180);

  // 3. Trave Robusta e Visível
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 24;
  ctx.strokeRect(148, 88, 504, 195);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 18;
  ctx.strokeRect(150, 86, 500, 195);

  // Rede em Xadrez Detalhada
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  for (let x = 150; x <= 650; x += 16) {
    ctx.beginPath(); ctx.moveTo(x, 86); ctx.lineTo(x, 281); ctx.stroke();
  }
  for (let y = 86; y <= 281; y += 16) {
    ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(650, y); ctx.stroke();
  }

  // 4. Goleiro Detalhado
  ctx.drawImage(images.keeper, keeperX, 160, 90, 125);

  // 5. Jogador Batedor Detalhado
  if (!isShot) {
    ctx.drawImage(images.player, playerX, playerY, 70, 105);
  }

  // 6. Velocímetro / HUD (Seta Laranja)
  const cx = 400, cy = 440, radius = 75;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, -Math.PI, 0);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fill();

  drawArc(cx, cy, radius, -Math.PI, -Math.PI * 0.65, '#00e676'); 
  drawArc(cx, cy, radius, -Math.PI * 0.65, -Math.PI * 0.35, '#ff1744'); 
  drawArc(cx, cy, radius, -Math.PI * 0.35, 0, '#00e676'); 

  if (!isShot && !isRunning) {
    ctx.shadowColor = '#ff6d00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (radius - 5), cy + Math.sin(angle) * (radius - 5));
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ff6d00';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 7. Bola Amarela com Sombra
  const ballRadius = 22 * ballScale;
  ctx.beginPath();
  ctx.ellipse(ballX, ballY + ballRadius - 2, ballRadius, ballRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  ctx.drawImage(images.ball, ballX - ballRadius, ballY - ballRadius, ballRadius * 2, ballRadius * 2);

  // 8. Placar Estilizado
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(20, 20, 180, 48);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, 180, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`PONTOS: ${score}`, 35, 52);

  if (isShot) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = shotResult.includes("GOL") ? '#00e676' : '#ff1744';
    ctx.fillText(shotResult, 160, 50);
  } else if (!isRunning) {
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
    isRunning = false;
    ballX = 400;
    ballY = 400;
    keeperX = 350;
    return;
  }

  if (isRunning) return;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  isRunning = true;

  const normalized = (angle + Math.PI) / Math.PI; 
  const targetX = 150 + (normalized * 500);
  ballX = targetX;

  const randomSide = Math.random() < 0.6 
    ? (targetX < 400 ? 180 : 540) 
    : (targetX < 400 ? 540 : 180);

  if (targetX >= 340 && targetX <= 460) {
    keeperTargetX = 350;
  } else {
    keeperTargetX = randomSide;
  }

  setTimeout(() => {
    const saved = Math.abs(keeperTargetX - (targetX - 45)) < 60 || (targetX >= 340 && targetX <= 460);

    if (saved) {
      playSaveSound();
      shotResult = "DEFENDEU O GOLEIRO! (Clique para tentar de novo)";
    } else {
      score += 10;
      playGoalSound();
      shotResult = "GOOOOOOL!! (Clique para jogar de novo)";
    }
  }, 600); 
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
