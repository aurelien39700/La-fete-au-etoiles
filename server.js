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

/* ---------- persistance disque : les salons survivent aux redémarrages ---------- */
const SAVE_FILE = path.join(__dirname, 'rooms-sauvegarde.json');
let saveT = null;
function scheduleSave() {
  if (saveT) return;
  saveT = setTimeout(() => {
    saveT = null;
    try {
      const dump = {};
      for (const [code, r] of rooms) dump[code] = { state: r.state, scores: r.scores, lastActive: r.lastActive };
      fs.writeFile(SAVE_FILE, JSON.stringify(dump), () => {});
    } catch (e) {}
  }, 1500);
}
try {
  const dump = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf8'));
  const now = Date.now();
  for (const code in dump) {
    if (now - (dump[code].lastActive || 0) < 3 * 3600 * 1000) {
      rooms.set(code, { state: dump[code].state, scores: dump[code].scores || {}, clients: new Set(), lastActive: dump[code].lastActive });
    }
  }
  if (rooms.size) console.log(`[↻] ${rooms.size} salon(s) restauré(s) depuis la sauvegarde`);
} catch (e) {}

/* ---------- profils joueurs : les exploits ne se perdent JAMAIS ----------
   Chaque joueur a un « Code Étoile » (6 lettres/chiffres). Ses stats/succès
   y sont adossés côté serveur, avec fusion prudente (compteurs au max,
   succès en union) : vider le navigateur ou changer de téléphone ne fait
   plus rien perdre. Sans expiration, sauvegardé sur disque. */
const PROF_FILE = path.join(__dirname, 'profils-sauvegarde.json');
const profils = new Map(); // star -> { data, updatedAt }
let profT = null;
function scheduleProfSave() {
  if (profT) return;
  profT = setTimeout(() => {
    profT = null;
    try {
      // borne de sécurité : on garde les 5000 profils les plus récents
      const entries = [...profils.entries()].sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0)).slice(0, 5000);
      fs.writeFile(PROF_FILE, JSON.stringify(Object.fromEntries(entries)), () => {});
    } catch (e) {}
  }, 1500);
}
try {
  const dump = JSON.parse(fs.readFileSync(PROF_FILE, 'utf8'));
  for (const star in dump) profils.set(star, dump[star]);
  if (profils.size) console.log(`[★] ${profils.size} profil(s) joueurs chargés`);
} catch (e) {}
function genStar() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)];
  return profils.has(c) ? genStar() : c;
}
function mergeProf(a, b) {
  // fusion sans perte : compteurs au max, succès et cartes en union
  a = a || {}; b = b || {};
  const out = Object.assign({}, a, b);
  ['games', 'wins', 'stars', 'coins', 'mgWins', 'thefts'].forEach(k => {
    out[k] = Math.max(a[k] || 0, b[k] || 0);
  });
  out.ach = Object.assign({}, a.ach || {}, b.ach || {});
  out.maps = Object.assign({}, a.maps || {}, b.maps || {});
  out.byHero = {};
  const heroes = new Set([...Object.keys(a.byHero || {}), ...Object.keys(b.byHero || {})]);
  heroes.forEach(h => { out.byHero[h] = Math.max((a.byHero || {})[h] || 0, (b.byHero || {})[h] || 0); });
  return out;
}

/* ---------- serveur HTTP : sert le jeu ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/?')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) { res.writeHead(500); res.end('index.html introuvable — place-le à côté de server.js'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  } else if (req.url === '/sante') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, salons: rooms.size }));
  } else if (req.url.startsWith('/art/')) {
    // sert les illustrations (fonds de carte, portraits…)
    const name = req.url.slice(5).split('?')[0];
    if (!/^[\w.-]+$/.test(name)) { res.writeHead(400); res.end(); return; }
    fs.readFile(path.join(__dirname, 'art', name), (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      const ct = name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp'
        : name.endsWith('.glb') ? 'model/gltf-binary' : 'image/jpeg';
      res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' });
      res.end(data);
    });
  } else if (req.url.startsWith('/js/')) {
    // sert les modules du jeu (découpage de index.html)
    const name = req.url.slice(4).split('?')[0];
    if (!/^[\w.-]+\.js$/.test(name)) { res.writeHead(400); res.end(); return; }
    fs.readFile(path.join(__dirname, 'js', name), (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
  } else if (req.url === '/poc3d') {
    // maquette plateau 3D (démo)
    fs.readFile(path.join(__dirname, 'poc3d.html'), (err, data) => {
      if (err) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
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
  scheduleSave();
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
      ws.pid = m.state.players[0] ? m.state.players[0].id : null;
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
        room.clients.add(ws); ws.roomCode = code; ws.pid = m.player.id;
        room.state.mgScores = room.scores;
        if (already.gone) {
          already.gone = false;
          room.state.version = (room.state.version || 0) + 1;
          room.state.log.push('🔌 ' + already.name + ' est de retour !');
          sendTo(ws, { t: 'joined', state: room.state });
          broadcast(room);
        } else {
          sendTo(ws, { t: 'joined', state: room.state });
        }
        console.log(`[~] ${already.name} se reconnecte au salon ${code}`);
        return;
      }
      if (room.state.status !== 'lobby') { sendTo(ws, { t: 'error', msg: 'Cette partie a déjà commencé.' }); return; }
      if (room.state.players.length >= 6) { sendTo(ws, { t: 'error', msg: 'Le salon est plein (6 max).' }); return; }
      room.clients.add(ws); ws.roomCode = code; ws.pid = m.player.id;
      room.state.players.push(m.player);
      room.state.log.push(m.player.name + ' rejoint la fête !');
      room.state.version = (room.state.version || 0) + 1;
      sendTo(ws, { t: 'joined', state: room.state });
      broadcast(room);
      console.log(`[+] ${m.player.name} rejoint le salon ${code} (${room.state.players.length} joueurs)`);
    }

    /* --- restauration d'une partie perdue par le serveur (redémarrage) :
           un client ré-injecte l'état complet qu'il avait sauvegardé --- */
    else if (m.t === 'restore' && m.state && m.state.code) {
      const code = String(m.state.code).toUpperCase();
      if (rooms.has(code)) {
        // le salon existe finalement : simple reconnexion
        const room = rooms.get(code);
        room.clients.add(ws); ws.roomCode = code; ws.pid = m.playerId || null;
        room.state.mgScores = room.scores;
        sendTo(ws, { t: 'joined', state: room.state });
        return;
      }
      if (m.state.status === 'ended') return;
      const room = { state: m.state, scores: m.state.mgScores || {}, clients: new Set([ws]), lastActive: Date.now() };
      rooms.set(code, room);
      ws.roomCode = code; ws.pid = m.playerId || null;
      room.state.log.push('↻ Partie restaurée après un redémarrage du serveur !');
      room.state.version = (room.state.version || 0) + 1;
      sendTo(ws, { t: 'joined', state: room.state });
      scheduleSave();
      console.log(`[↻] Salon ${code} restauré par un joueur`);
    }

    /* --- reconnexion après coupure --- */
    else if (m.t === 'rejoin') {
      const code = String(m.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room) { sendTo(ws, { t: 'error', msg: 'Cette partie n\'existe plus.' }); return; }
      room.clients.add(ws); ws.roomCode = code;
      if (m.playerId) {
        ws.pid = m.playerId;
        const p = room.state.players.find(q => q.id === m.playerId);
        if (p && p.gone) {
          p.gone = false;
          room.state.version = (room.state.version || 0) + 1;
          room.state.log.push('🔌 ' + p.name + ' est de retour !');
          broadcast(room);
        }
      }
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
        // état périmé : on le rejette et on resynchronise l'expéditeur
        sendTo(ws, { t: 'state', state: room.state });
        return;
      }
      room.state = m.state;
      broadcast(room);
    }

    /* --- action temps réel (mini-jeux simultanés) : simple relais --- */
    else if (m.t === 'act') {
      const room = rooms.get(String(m.code || '').toUpperCase());
      if (!room) return;
      const msg = JSON.stringify({ t: 'act', data: m.data });
      room.clients.forEach(c => { if (c !== ws && c.readyState === WebSocket.OPEN) c.send(msg); });
    }

    /* --- profil joueur : synchronisation (création ou fusion) --- */
    else if (m.t === 'prof-sync') {
      let star = String(m.star || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (star && profils.has(star)) {
        const cur = profils.get(star);
        cur.data = mergeProf(cur.data, m.data || {});
        cur.updatedAt = Date.now();
        sendTo(ws, { t: 'prof', star, data: cur.data });
      } else {
        // code inconnu (serveur réinitialisé ?) ou premier passage : on (re)crée
        if (!star || star.length < 6) star = genStar();
        profils.set(star, { data: m.data || {}, updatedAt: Date.now() });
        sendTo(ws, { t: 'prof', star, data: profils.get(star).data });
        console.log(`[★] Profil ${star} créé`);
      }
      scheduleProfSave();
    }

    /* --- profil joueur : récupération sur un autre appareil --- */
    else if (m.t === 'prof-load') {
      const star = String(m.star || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      const p = profils.get(star);
      if (p) { p.updatedAt = Date.now(); sendTo(ws, { t: 'prof', star, data: p.data, loaded: 1 }); scheduleProfSave(); }
      else sendTo(ws, { t: 'prof-miss', star });
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
    if (!room) return;
    room.clients.delete(ws);
    const pid = ws.pid, code = ws.roomCode;
    if (!pid) return;
    // après 45 s sans reconnexion : retiré du salon, ou marqué absent en partie
    setTimeout(() => {
      const r = rooms.get(code);
      if (!r) return;
      for (const c of r.clients) if (c.pid === pid && c.readyState === WebSocket.OPEN) return;
      const p = r.state.players.find(q => q.id === pid);
      if (!p || p.gone) return;
      if (r.state.status === 'lobby') {
        r.state.players = r.state.players.filter(q => q.id !== pid);
        if (r.state.hostId === pid && r.state.players[0]) r.state.hostId = r.state.players[0].id;
        r.state.log.push('👋 ' + p.name + ' a quitté le salon.');
      } else {
        p.gone = true;
        r.state.log.push('💤 ' + p.name + ' a quitté la partie…');
      }
      r.state.version = (r.state.version || 0) + 1;
      broadcast(r);
      console.log(`[-] ${p.name} absent du salon ${code}`);
    }, 45000);
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
