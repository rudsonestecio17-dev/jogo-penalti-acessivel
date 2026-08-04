const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedSelect = document.getElementById('speedSelect');

// --- CARREGAMENTO DE IMAGENS ---
const images = {
  stadium: new Image(),
  ball: new Image(),
  keeper: new Image(),
  player: new Image()
};

// Imagem do Cenário Realista (Certifique-se de salvar o arquivo stadium.jpg na mesma pasta)
images.stadium.src = 'stadium/stadium.jpg';

// Bola de Futebol Estilo Champions (Painéis Cinza/Branco)
images.ball.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23ffffff" stroke="%23333333" stroke-width="4"/><polygon points="50,22 64,32 59,48 41,48 36,32" fill="%2378909c"/><polygon points="50,78 36,68 41,52 59,52 64,68" fill="%2378909c"/><polygon points="22,50 32,36 48,41 48,59 32,64" fill="%2378909c"/><polygon points="78,50 68,36 52,41 52,59 68,64" fill="%2378909c"/></svg>';

// Goleiro Laranja (Idêntico ao da imagem de referência)
images.keeper.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180"><circle cx="60" cy="30" r="16" fill="%236d4c41"/><path d="M40 50 Q60 20 80 50 L90 110 L30 110 Z" fill="%23fb8c00"/><rect x="42" y="50" width="36" height="65" rx="8" fill="%23f57c00"/><rect x="35" y="115" width="22" height="58" rx="6" fill="%23e65100"/><rect x="63" y="115" width="22" height="58" rx="6" fill="%23e65100"/><rect x="15" y="60" width="25" height="15" rx="7" fill="%23ffffff"/><rect x="80" y="60" width="25" height="15" rx="7" fill="%23ffffff"/></svg>';

// Jogador Batedor (Camisa Listrada Azul e Branco, em perspectiva de costas)
images.player.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 220"><path d="M35 50 Q70 20 105 50 L115 130 L25 130 Z" fill="%231565c0"/><path d="M50 48 L50 130 L65 130 L65 48 Z" fill="%23ffffff"/><path d="M80 48 L80 130 L95 130 L95 48 Z" fill="%23ffffff"/><circle cx="70" cy="28" r="20" fill="%235d4037"/><rect x="35" y="130" width="30" height="70" rx="8" fill="%230d47a1"/><rect x="75" y="130" width="30" height="70" rx="8" fill="%230d47a1"/><rect x="35" y="200" width="30" height="18" fill="%23ffffff"/><rect x="75" y="200" width="30" height="18" fill="%23ffffff"/></svg>';

// --- ÁUDIO SINTETIZADO E VOZ ---
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
let isRunning = false;
let shotResult = "";
let score = 0;

// Ajuste das coordenadas para casar com a trave da foto de fundo
let ballX = 490;
let ballY = 430;
let ballScale = 1.0; 

let playerX = 330;
let playerY = 320;

let keeperX = 455; 
let keeperTargetX = 455; 

speedSelect.addEventListener('change', (e) => {
  speed = parseFloat(e.target.value);
});

function update() {
  if (!isShot && !isRunning) {
    angle += speed * direction;
    if (angle >= 0) direction = -1;
    if (angle <= -Math.PI) direction = 1;
    
    keeperX += (455 - keeperX) * 0.1;
    playerX = 330;
    playerY = 320;
    ballScale = 1.0;
  } else if (isRunning) {
    playerX += 3;
    playerY += 1;
    if (playerX >= 420) {
      isRunning = false;
      isShot = true;
      playKickSound();
    }
  } else if (isShot) {
    if (ballY > 210) {
      ballY -= 9;
      ballScale = Math.max(0.45, ballScale - 0.02);
    }
    if (Math.abs(keeperX - keeperTargetX) > 2) {
      keeperX += (keeperTargetX - keeperX) * 0.15;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Renderiza o Cenário do Estádio HD ao Fundo
  if (images.stadium.complete && images.stadium.naturalWidth !== 0) {
    ctx.drawImage(images.stadium, 0, 0, canvas.width, canvas.height);
  } else {
    // Fundo reserva caso a imagem ainda esteja carregando
    ctx.fillStyle = '#1b5e20';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // 2. Renderiza o Goleiro Laranja
  ctx.drawImage(images.keeper, keeperX, 235, 85, 125);

  // 3. Renderiza o Batedor (Camisa Listrada Azul)
  if (!isShot) {
    ctx.drawImage(images.player, playerX, playerY, 115, 175);
  }

  // 4. Velocímetro HUD (Alinhado na parte inferior)
  const cx = 490, cy = 460, radius = 70;
  
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 10, -Math.PI, 0);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fill();

  drawArc(cx, cy, radius, -Math.PI, -Math.PI * 0.65, '#00e676'); 
  drawArc(cx, cy, radius, -Math.PI * 0.65, -Math.PI * 0.35, '#ff1744'); 
  drawArc(cx, cy, radius, -Math.PI * 0.35, 0, '#00e676'); 

  // Seta Laranja de Alto Contraste
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

  // 5. Bola com Efeito de Sombra
  const ballRadius = 22 * ballScale;
  ctx.beginPath();
  ctx.ellipse(ballX, ballY + ballRadius - 2, ballRadius, ballRadius * 0.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fill();

  ctx.drawImage(images.ball, ballX - ballRadius, ballY - ballRadius, ballRadius * 2, ballRadius * 2);

  // 6. Placar e Mensagem de Tela
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(20, 15, 180, 45);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 15, 180, 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`PONTOS: ${score}`, 35, 45);

  if (isShot) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = shotResult.includes("GOL") ? '#00e676' : '#ff1744';
    ctx.fillText(shotResult, 220, 45);
  } else if (!isRunning) {
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("CLIQUE na tela ou aperte ESPAÇO para Chutar", 320, 485);
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
    ballX = 490;
    ballY = 430;
    keeperX = 455;
    return;
  }

  if (isRunning) return;

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

  isRunning = true;

  // Mapeamento ajustado para a largura exata da trave da imagem de fundo
  const normalized = (angle + Math.PI) / Math.PI; 
  const targetX = 250 + (normalized * 480);
  ballX = targetX;

  const randomSide = Math.random() < 0.6 
    ? (targetX < 490 ? 270 : 640) 
    : (targetX < 490 ? 640 : 270);

  if (targetX >= 430 && targetX <= 550) {
    keeperTargetX = 455;
  } else {
    keeperTargetX = randomSide;
  }

  setTimeout(() => {
    const saved = Math.abs(keeperTargetX - (targetX - 40)) < 60 || (targetX >= 430 && targetX <= 550);

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
