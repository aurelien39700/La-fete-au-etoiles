/* ============================================================
   LA FÊTE DES ÉTOILES — serveur de jeu auto-hébergé
   Lancement :  npm install  puis  node server.js
   Les joueurs ouvrent ensuite  http://TON-IP:3000  sur leur téléphone.
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

// salons en mémoire : code -> { state, scores, clients, lastActive }
const rooms = new Map();

/* ---------- serveur HTTP : sert le jeu ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('index.html introuvable — place-le à côté de server.js'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (req.url === '/sante') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, salons: rooms.size }));
  } else if (req.url === '/favicon.ico') {
    // petite étoile SVG pour éviter le 404
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    res.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><text y="13" font-size="13">🎉</text></svg>');
  } else {
    res.writeHead(404); res.end('404');
  }
});

/* ---------- serveur WebSocket ---------- */
const wss = new WebSocket.Server({ server });

function genCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  let c = '';
  for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)];
  return rooms.has(c) ? genCode() : c;
}

function broadcast(room) {
  room.lastActive = Date.now();
  room.state.mgScores = room.scores; // le serveur est la référence pour les scores
  const msg = JSON.stringify({ t: 'state', state: room.state });
  room.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
}

function sendTo(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', raw => {
    let m;
    try { m = JSON.parse(raw); } catch (e) { return; }

    /* --- créer un salon --- */
    if (m.t === 'create' && m.state) {
      const code = genCode();
      m.state.code = code;
      const room = { state: m.state, scores: {}, clients: new Set([ws]), lastActive: Date.now() };
      rooms.set(code, room);
      ws.roomCode = code;
      room.state.mgScores = room.scores;
      sendTo(ws, { t: 'created', code, state: room.state });
      console.log(`[+] Salon ${code} créé (${room.state.players[0]?.name || '?'})`);
    }

    /* --- rejoindre un salon --- */
    else if (m.t === 'join' && m.player) {
      const code = String(m.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) { sendTo(ws, { t: 'error', msg: 'Aucune partie avec ce code.' }); return; }
      const already = room.state.players.find(p => p.id === m.player.id);
      if (already) {
        // reconnexion d'un joueur connu : ok même en cours de partie
        room.clients.add(ws); ws.roomCode = code;
        room.state.mgScores = room.scores;
        sendTo(ws, { t: 'joined', state: room.state });
        console.log(`[~] ${already.name} se reconnecte au salon ${code}`);
        return;
      }
      if (room.state.status !== 'lobby') { sendTo(ws, { t: 'error', msg: 'Cette partie a déjà commencé.' }); return; }
      if (room.state.players.length >= 6) { sendTo(ws, { t: 'error', msg: 'Le salon est plein (6 max).' }); return; }
      room.clients.add(ws); ws.roomCode = code;
      room.state.players.push(m.player);
      room.state.log.push(m.player.name + ' rejoint la fête !');
      room.state.version = (room.state.version || 0) + 1;
      sendTo(ws, { t: 'joined', state: room.state });
      broadcast(room);
      console.log(`[+] ${m.player.name} rejoint le salon ${code} (${room.state.players.length} joueurs)`);
    }

    /* --- reconnexion après coupure --- */
    else if (m.t === 'rejoin') {
      const code = String(m.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) { sendTo(ws, { t: 'error', msg: 'Cette partie n\'existe plus.' }); return; }
      room.clients.add(ws); ws.roomCode = code;
      room.state.mgScores = room.scores;
      sendTo(ws, { t: 'joined', state: room.state });
    }

    /* --- mise à jour de l'état (joueur qui agit / hôte) --- */
    else if (m.t === 'update' && m.state) {
      const code = String(m.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) return;
      m.state.code = code;                        // le code ne change jamais
      if ((m.state.version || 0) <= (room.state.version || 0)) {
        m.state.version = (room.state.version || 0) + 1;  // toujours croissant
      }
      room.state = m.state;
      broadcast(room);
    }

    /* --- score de mini-jeu --- */
    else if (m.t === 'score') {
      const code = String(m.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) return;
      if (!room.scores[m.round]) room.scores[m.round] = {};
      room.scores[m.round][m.playerId] = m.score;
      room.state.version = (room.state.version || 0) + 1;
      broadcast(room);
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (room) room.clients.delete(ws);
  });
});

/* ---------- maintien des connexions ---------- */
setInterval(() => {
  wss.clients.forEach(ws => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

/* ---------- nettoyage des salons inactifs (3 h) ---------- */
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActive > 3 * 3600 * 1000) {
      rooms.delete(code);
      console.log(`[-] Salon ${code} supprimé (inactif)`);
    }
  }
}, 10 * 60 * 1000);

/* ---------- démarrage ---------- */
server.listen(PORT, () => {
  console.log('');
  console.log('🎉 LA FÊTE DES ÉTOILES — serveur démarré !');
  console.log('');
  console.log('   Les joueurs doivent ouvrir dans leur navigateur :');
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`   👉 http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(`   (ou http://localhost:${PORT} sur cette machine)`);
  console.log('');
  console.log('   Tout le monde doit être sur le même Wi-Fi que ce serveur.');
  console.log('');
});
