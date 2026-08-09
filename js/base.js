/* =================== outils =================== */
const $=id=>document.getElementById(id);
const AVATARS=['🐸','🦊','🐙','🦄','🐝','🤖','🐧','🐲'];
const rnd=n=>Math.floor(Math.random()*n);
let toastT;
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on')); $(id).classList.add('on'); window.scrollTo(0,0); }

const S={
  async get(k,sh=false){
    try{
      if(window.storage){ const r=await window.storage.get(k,sh); return r?JSON.parse(r.value):null; }
      const v=localStorage.getItem(k); return v?JSON.parse(v):null;
    }catch(e){ return null; }
  },
  async set(k,v,sh=false){
    try{
      if(window.storage){ const r=await window.storage.set(k,JSON.stringify(v),sh); return !!r; }
      localStorage.setItem(k,JSON.stringify(v)); return true;
    }catch(e){ return false; }
  }
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function shade(hex,f){ // assombrit une couleur hexa (f 0..1)
  const n=parseInt(hex.slice(1),16);
  const r=Math.round(((n>>16)&255)*f), g=Math.round(((n>>8)&255)*f), b=Math.round((n&255)*f);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

/* =================== sons (WebAudio synthétisé, zéro fichier) =================== */
let AC=null, sndOn=true;
try{ sndOn=localStorage.getItem('fete-snd')!=='off'; }catch(e){}
function ac(){
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(AC&&AC.state==='suspended') AC.resume();
  return AC;
}
document.addEventListener('pointerdown',()=>ac(),{once:true,capture:true});
function tone(f,dur,type,vol,delay,slide){
  const c=ac(); if(!c||!sndOn) return;
  const t0=c.currentTime+(delay||0);
  const o=c.createOscillator(), g=c.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(f,t0);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(30,slide),t0+dur);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(vol||.15,t0+.012);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0+dur+.02);
}
function noiseS(dur,vol,delay,fc){
  const c=ac(); if(!c||!sndOn) return;
  const t0=c.currentTime+(delay||0);
  const len=Math.max(1,Math.floor(c.sampleRate*dur));
  const buf=c.createBuffer(1,len,c.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  const n=c.createBufferSource(); n.buffer=buf;
  const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=fc||900;
  const g=c.createGain();
  g.gain.setValueAtTime(vol||.2,t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  n.connect(f); f.connect(g); g.connect(c.destination);
  n.start(t0);
}
const SND={
  tap:   ()=>tone(660,.06,'square',.07),
  dice:  ()=>{ for(let i=0;i<6;i++) tone(300+rnd(300),.04,'square',.05,i*.07); },
  step:  ()=>tone(500+rnd(80),.05,'triangle',.09),
  coin:  ()=>{ tone(880,.09,'square',.1); tone(1320,.14,'square',.1,.08); },
  bad:   ()=>tone(320,.2,'sawtooth',.11,0,110),
  star:  ()=>{ [523,659,784,1047,1319].forEach((f,i)=>tone(f,.16,'triangle',.14,i*.09)); },
  fanfare:()=>{ [523,523,659,784,1047].forEach((f,i)=>tone(f,.2,'square',.1,i*.13)); },
  boo:   ()=>{ tone(220,.5,'sine',.14,0,80); tone(180,.5,'sine',.09,.1,60); },
  duel:  ()=>{ noiseS(.15,.18,0,2400); tone(880,.12,'sawtooth',.09,.05,440); },
  pop:   ()=>tone(440,.09,'sine',.11,0,880),
  tick:  ()=>tone(1000,.04,'square',.06),
  shot:  ()=>{ noiseS(.08,.16,0,3000); tone(700,.07,'square',.07,0,200); },
  boom:  ()=>{ noiseS(.4,.28,0,300); tone(90,.35,'sine',.22,0,40); },
  whoosh:()=>noiseS(.25,.11,0,1200),
  yay:   ()=>{ [659,784,988,1319].forEach((f,i)=>tone(f,.15,'triangle',.12,i*.08)); }
};
/* haptique courte et signifiante (coupée si reduced-motion) */
let canVib=true;
try{ canVib=!matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
const VIBES={dice:12, coin:8, star:[20,30,50], boom:35, bad:20, yay:[15,20,30],
  duel:25, fanfare:[10,20,10,20,40], tap:5, boo:[15,30,15], pop:0, whoosh:0};
function vib(p){ try{ if(canVib&&p&&navigator.vibrate) navigator.vibrate(p); }catch(e){} }
function snd(n){ try{ if(SND[n])SND[n](); if(VIBES[n]) vib(VIBES[n]); }catch(e){} }
window.addEventListener('load',()=>{
  const b=$('btnSnd'); if(!b) return;
  b.textContent=sndOn?'🔊':'🔇';
  b.onclick=()=>{ sndOn=!sndOn; b.textContent=sndOn?'🔊':'🔇';
    try{ localStorage.setItem('fete-snd',sndOn?'on':'off'); }catch(e){}
    if(sndOn) snd('coin'); };
});

/* =================== réseau : serveur auto-hébergé (WebSocket) =================== */
let ws=null, wsUrl='', connected=false, reconnectT=null, pendingState=null;
let createResolve=null, joinResolve=null;

function defaultServer(){
  if((location.protocol==='http:'||location.protocol==='https:') && location.host)
    return (location.protocol==='https:'?'wss://':'ws://')+location.host;
  return '';
}
function getServerUrl(){
  let v=($('serverAddr').value||'').trim();
  if(!v) v=defaultServer();
  if(v && !/^wss?:\/\//i.test(v)) v=(location.protocol==='https:'?'wss://':'ws://')+v;
  return v;
}
function netConnect(url){
  return new Promise((resolve,reject)=>{
    let sock;
    try{ sock=new WebSocket(url); }catch(e){ reject(e); return; }
    let opened=false;
    const failT=setTimeout(()=>{ if(!opened){ try{sock.close();}catch(e){} reject(new Error('timeout')); } },5000);
    sock.onopen=()=>{ opened=true; clearTimeout(failT); ws=sock; connected=true; wsUrl=url; resolve();
      setTimeout(()=>{ try{ profSync(); }catch(e){} },250); };
    sock.onerror=()=>{ if(!opened){ clearTimeout(failT); reject(new Error('conn')); } };
    sock.onclose=()=>{
      if(!opened) return;
      connected=false;
      if(room && !local && room.status!=='ended'){
        toast('Connexion perdue… reconnexion 🔄');
        clearTimeout(reconnectT);
        reconnectT=setTimeout(async()=>{
          try{ await netConnect(wsUrl); send({t:'rejoin', code:room.code, playerId:me.id}); toast('Reconnecté ✅'); }
          catch(e){ sock.onclose(); }
        },2500);
      }
    };
    sock.onmessage=ev=>{ let m; try{ m=JSON.parse(ev.data); }catch(e){ return; } onNet(m); };
  });
}
function send(o){ if(ws&&ws.readyState===1) ws.send(JSON.stringify(o)); }
function actSend(data){ if(room&&!local) send({t:'act', code:room.code, data}); }
let lastStateAt=Date.now();
/* sauvegarde continue : la partie survit à la fermeture du navigateur
   ET aux redémarrages du serveur (restauration par le premier revenu) */
let snapT=null;
function saveSnapshot(){
  if(snapT||!room) return;
  snapT=setTimeout(()=>{
    snapT=null;
    try{
      if(!room||room.status==='ended'){ localStorage.removeItem('fete-room'); return; }
      localStorage.setItem('fete-room',JSON.stringify({state:room, at:Date.now(), url:wsUrl, local:local}));
    }catch(e){}
  },1200);
}
function applyState(st){
  if(!st) return;
  if(room && !local && st.version<room.version) return; // état plus vieux que le nôtre
  if(animBusy){ pendingState=st; return; }
  room=st;
  lastStateAt=Date.now();
  if(room.fx && room.fx.seq>lastFxSeq){ lastFxSeq=room.fx.seq; fxShow(room.fx); }
  syncActs();
  saveSnapshot();
  render();
}
setInterval(()=>{ if(pendingState&&!animBusy){ const s=pendingState; pendingState=null; applyState(s); } },400);
function onNet(m){
  if(m.t==='created' && createResolve){ createResolve(m); createResolve=null; }
  else if(m.t==='joined'){
    if(joinResolve){ joinResolve(m); joinResolve=null; }
    else applyState(m.state); // reconnexion après coupure
  }
  else if(m.t==='state'){ applyState(m.state); }
  else if(m.t==='act'){
    const d=m.data;
    if(d&&d.k==='emote') showEmote(d);
    else if(d&&d.k==='dref'){ // dé du défenseur dans un duel de case
      if(typeof duelResolve==='function'&&duelResolve){ const r=duelResolve; duelResolve=null; r(d.v); }
    }
    else if(window.mgAct) try{ window.mgAct(d); }catch(e){}
  }
  else if(m.t==='prof'){ profGot(m); }
  else if(m.t==='prof-miss'){ toast('Aucun profil avec le code '+(m.star||'?')+' 😕'); }
  else if(m.t==='error'){
    toast(m.msg||'Erreur serveur');
    if(createResolve){ createResolve(null); createResolve=null; }
    if(joinResolve){ joinResolve(null); joinResolve=null; }
  }
}
function netFail(url){
  const n=$('netNotice'); n.style.display='block';
  n.innerHTML='Impossible de joindre <b>'+url+'</b>.<br>'+
    '1) Vérifie que <b>node server.js</b> tourne bien.<br>'+
    '2) Sois sur le même Wi-Fi que le serveur.<br>'+
    '3) Ouvre le jeu via <b>http://ADRESSE-DU-SERVEUR:3000</b> dans ton navigateur — obligatoire si cette page est en https (le navigateur bloque sinon la connexion ws://).';
}
window.addEventListener('load',()=>{
  const d=defaultServer();
  if(d) $('serverAddr').value=d.replace(/^wss?:\/\//,'');
});

/* bannière titre cinématique : visible si le groupe détouré est disponible */
window.addEventListener('load',()=>{
  const im=new Image();
  im.onload=()=>{
    const g=$('thGroup'); if(!g) return;
    g.src='/art/sprite-groupe.png';
    $('titleHero').style.display='block';
    $('titlePlain').querySelector('h1').style.display='none';
  };
  im.src='/art/sprite-groupe.png';
});

/* fond étoilé */
(()=>{ const bg=$('starsBg'); for(let i=0;i<26;i++){ const s=document.createElement('span');
  s.textContent='✦'; s.style.left=rnd(100)+'vw'; s.style.top=rnd(100)+'vh';
  s.style.fontSize=(8+rnd(12))+'px'; s.style.animationDelay=(Math.random()*3)+'s'; bg.appendChild(s);} })();

