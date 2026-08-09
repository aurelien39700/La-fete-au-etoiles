/* =================== rendu =================== */
function isHost(){ return local || (room && room.hostId===me.id); }
function myTurn(){ return local || (room && room.players[room.turn] && room.players[room.turn].id===me.id); }

function render(){
  if(!room) return;
  if(room.status==='lobby') renderLobby();
  else if(room.status==='board') renderBoard();
  else if(room.status==='minigame') renderMg();
  else if(room.status==='mgres') renderMgRes();
  else if(room.status==='manche') renderManche();
  else if(room.status==='ended') renderEnd();
  updateEmoteBar();
  keepAwake();
  music(!!room&&room.status!=='lobby'&&room.status!=='ended');
  weather(!!room&&room.status==='board');
}

/* ---------- émotes en direct ---------- */
const EMOTES=['😂','😱','🔥','👏','💀','❤️'];
let lastEmoteT=0;
window.addEventListener('load',()=>{
  const bar=$('emoBar'); if(!bar) return;
  bar.innerHTML=EMOTES.map(e=>`<button data-e="${e}">${e}</button>`).join('');
  bar.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const now=Date.now(); if(now-lastEmoteT<1200) return; lastEmoteT=now;
    const d={k:'emote',id:me.id,e:b.dataset.e};
    showEmote(d); actSend(d); snd('tap');
  });
});
function showEmote(d){
  const p=room&&room.players.find(q=>q.id===d.id);
  const el=document.createElement('div'); el.className='emofly';
  el.style.left=(18+rnd(64))+'%';
  el.innerHTML=`<div class="ea">${p?pAv(p,32):'❔'}</div><div class="ee">${d.e}</div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2700);
}
function updateEmoteBar(){
  const bar=$('emoBar'); if(!bar) return;
  bar.style.display=(room&&!local&&['board','minigame','mgres'].indexOf(room.status)>=0)?'flex':'none';
}

/* ---------- exploits persistants (par téléphone, parties en ligne) ---------- */
let statsSaved=false;
function recordStats(){
  if(local||statsSaved||!room) return;
  const meP=room.players.find(p=>p.id===me.id);
  if(!meP) return;
  statsSaved=true;
  const ranked=[...room.players].sort((a,b)=>(b.stars-a.stars)||(b.coins-a.coins));
  const crowns=room.crowns||{};
  const winnerId=room.tourney
    ? (Object.entries(crowns).sort((a,b)=>b[1]-a[1])[0]||[])[0]
    : (ranked[0]&&ranked[0].id);
  const won=winnerId===me.id;
  const s=loadStats();
  s.games=(s.games||0)+1;
  if(won) s.wins=(s.wins||0)+1;
  s.stars=(s.stars||0)+(meP.stars||0);
  s.coins=(s.coins||0)+(meP.coinsEarned||0);
  s.mgWins=(s.mgWins||0)+(meP.mgWins||0);
  s.thefts=(s.thefts||0)+(meP.thefts||0);
  s.maps=s.maps||{}; s.maps[room.mapId||'fete']=1;
  s.byHero=s.byHero||{};
  if(meP.hero) s.byHero[meP.hero]=(s.byHero[meP.hero]||0)+1;
  const g={coins:meP.coins||0, stars:meP.stars||0, won,
    itemsBought:meP.itemsBought||0, tourneyWon:!!(room.tourney&&won)};
  const fresh=checkAchievements(s,g);
  saveStats(s);
  // annonce les succès tout juste débloqués (par-dessus le podium)
  fresh.forEach((a,i)=>setTimeout(()=>{
    snd('star');
    fxShow({icon:a.e,title:'SUCCÈS DÉBLOQUÉ !',text:'<b>'+a.n+'</b><br>'+a.d,ms:2600});
    const aura=UNLOCK_AURAS.find(u=>u.need===a.id);
    if(aura) setTimeout(()=>toast('🎨 Nouvelle aura débloquée : '+aura.name+' !'),2700);
  },1200+i*2900));
  profSync(); // les exploits partent aussitôt à l'abri sur le serveur
}
window.addEventListener('load',()=>{
  const b=$('btnStats'); if(!b) return;
  b.onclick=async()=>{
    const s=loadStats();
    const fav=Object.entries(s.byHero||{}).sort((a,b)=>b[1]-a[1])[0];
    const favH=fav?HEROES.find(h=>h.id===fav[0]):null;
    const ach=s.ach||{};
    const nAch=Object.keys(ach).length;
    const star=getStar();
    const r=await ask({icon:'📊',title:statTitle(s.wins||0),
      text:`Parties en ligne : <b>${s.games||0}</b> · Victoires : <b>${s.wins||0}</b> 👑<br>`+
        `⭐ étoiles gagnées : <b>${s.stars||0}</b> · 🪙 pièces amassées : <b>${s.coins||0}</b><br>`+
        `🎮 mini-jeux gagnés : <b>${s.mgWins||0}</b><br>`+
        (favH?`Héros favori : ${heroThumb(favH.id,me.color,24)} <b>${favH.name}</b><br>`:'')+
        (star?`<br>🔑 Ton Code Étoile : <b style="letter-spacing:3px;color:var(--etoile);">${star}</b><br><span style="font-size:11.5px;opacity:.75;">Note-le : il retrouve tes exploits sur n'importe quel téléphone !</span><br>`
             :`<br><span style="font-size:11.5px;opacity:.75;">🔑 Ton Code Étoile apparaîtra ici à ta prochaine connexion en ligne.</span><br>`)+
        `<br><b>Succès (${nAch}/${ACHS.length})</b>`+
        `<div style="text-align:left;font-size:12.5px;margin-top:6px;">`+
        ACHS.map(a=>`<div style="margin:3px 0;opacity:${ach[a.id]?1:.45};">${ach[a.id]?('<span class="ros">'+a.e+'</span>'):'🔒'} <b>${a.n}</b> — ${a.d}</div>`).join('')+
        `</div>`,
      options:[{label:'OK ✨',value:1,cls:'menthe'},{label:'📲 J\'ai un Code Étoile',value:'load',cls:'ghost'}]});
    if(r==='load'){
      const code=await askText({icon:'🔑',title:'Récupérer mes exploits',
        text:'Entre le Code Étoile affiché sur ton autre téléphone :',placeholder:'ABC123',max:6});
      if(!code) return;
      if(!connected){
        const url=getServerUrl();
        if(!url){ toast('Indique d\'abord l\'adresse du serveur ⚙️'); return; }
        try{ await netConnect(url); }catch(e){ toast('Serveur injoignable 😕'); return; }
      }
      send({t:'prof-load', star:code});
    }
  };
});

/* ---------- météo d'ambiance par carte (particules légères) ---------- */
let weatherI=null, weatherMap='';
const WEATHER={
  fete:    {g:['✦','❋','·'], c:['#FFD644','#FF5FA2','#5AC8FA'], dir:'down', dur:[4200,6800]},
  spirale: {g:['✦','·','✧'], c:['#F09BD8','#9FF7FF','#C39BFF'], dir:'down', dur:[5200,8000]},
  archipel:{g:['○','◦','·'], c:['#9FF7FF','#3EE6C1','#FFFFFF'], dir:'up',   dur:[4600,7200]},
  volcan:  {g:['●','✦','·'], c:['#FF9B6B','#FF6B6B','#FFD644'], dir:'up',   dur:[3000,5400]},
  temple:  {g:['🍃','·','✦'], c:['#7FE3B8','#4FB07A','#E0B24E'], dir:'down', dur:[4800,7600]}
};
function weather(on){
  const id=(on&&room)?(room.mapId||'fete'):'';
  if(id===weatherMap) return;
  weatherMap=id;
  clearInterval(weatherI); weatherI=null;
  if(!id) return;
  weatherI=setInterval(()=>{
    if(document.hidden||!room||room.status!=='board') return;
    const bw=$('boardWrap'); if(!bw||!bw.clientHeight) return;
    const W2=WEATHER[id]||WEATHER.fete;
    const el=document.createElement('div');
    el.className='wpart';
    el.textContent=W2.g[rnd(W2.g.length)];
    el.style.cssText+=`left:${2+rnd(95)}%;color:${W2.c[rnd(W2.c.length)]};font-size:${7+rnd(7)}px;opacity:0;${W2.dir==='down'?'top:-14px;':'bottom:-14px;'}`;
    bw.appendChild(el);
    const h=bw.clientHeight+28;
    const dur=W2.dur[0]+rnd(W2.dur[1]-W2.dur[0]);
    el.animate([
      {transform:'translate(0,0)', opacity:0},
      {opacity:.8, offset:.12},
      {opacity:.65, offset:.85},
      {transform:`translate(${rnd(44)-22}px,${W2.dir==='down'?h:-h}px)`, opacity:0}
    ],{duration:dur, easing:'linear'});
    setTimeout(()=>el.remove(),dur+40);
  },540);
}

/* ---------- musique d'ambiance discrète, propre à chaque carte ---------- */
const MAP_MUSIC={
  fete:    {seq:[262,330,392,523,392,330,294,440], step:1500, w:'triangle'},
  spirale: {seq:[220,277,330,440,415,330,277,247], step:1750, w:'sine'},
  archipel:{seq:[294,370,440,494,440,370,330,294], step:1300, w:'triangle'},
  volcan:  {seq:[196,233,196,175,233,262,233,175], step:1650, w:'sawtooth'},
  temple:  {seq:[262,311,349,392,349,311,262,233], step:1420, w:'triangle'}
};
let musT=null, musOn=false;
function music(on){
  if(on===musOn) return;
  musOn=on;
  clearTimeout(musT); musT=null;
  if(!on) return;
  let mi=0;
  const tick=()=>{
    if(!musOn) return;
    const M=MAP_MUSIC[(room&&room.mapId)||'fete']||MAP_MUSIC.fete;
    if(sndOn&&!document.hidden){
      const f=M.seq[mi%M.seq.length];
      tone(f/2,1.6,'sine',.02);
      tone(f,1.9,M.w,M.w==='sawtooth'?.008:.014,.08);
      mi++;
    }
    musT=setTimeout(tick,M.step||1500); // tempo propre à la carte
  };
  tick();
}

/* ---------- jingle de héros au début du tour ---------- */
const HERO_JINGLE={
  astro:[523,659,784], robot:[220,220,440], alien:[494,466,523],
  ghost:[392,330,294], cat:[659,784,659], uni:[523,698,880],
  dino:[196,247,196], star:[784,988,1175],
  peng:[440,349,440], flam:[330,415,554]
};
let lastTurnKey='', lastPosKey='';
function heroJingle(p){
  const j=HERO_JINGLE[p&&p.hero];
  if(!j) return;
  j.forEach((f,i)=>tone(f,.14,'triangle',.09,i*.11));
}

/* ---------- étoiles filantes ---------- */
setInterval(()=>{
  if(document.hidden) return;
  const s=document.createElement('div'); s.className='shoot';
  s.style.left=(30+rnd(65))+'vw'; s.style.top=(5+rnd(30))+'vh';
  document.body.appendChild(s);
  setTimeout(()=>s.remove(),2400);
},7000);

/* ---------- écran toujours allumé pendant la partie ---------- */
let wakeL=null;
async function keepAwake(){
  try{
    if(!wakeL&&navigator.wakeLock&&room&&room.status!=='ended'){
      wakeL=await navigator.wakeLock.request('screen');
      wakeL.addEventListener('release',()=>{ wakeL=null; });
    }
  }catch(e){}
}
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') keepAwake(); });

function renderLobby(){
  show('scr-lobby');
  $('lobbyCode').textContent=room.code;
  const curMap=MAP_LIST.find(m=>m.id===room.mapId)||MAP_LIST[0];
  $('mapRow').innerHTML=isHost()
    ? MAP_LIST.map(m=>`<button class="ichip ${m.id===room.mapId?'':'off'}" data-m="${m.id}" style="font-size:13px;font-weight:800;font-family:'Baloo 2';">${m.e} ${m.name}</button>`).join('')
    : '<span class="hint">🗺️ Carte : '+curMap.e+' '+curMap.name+'</span>';
  if(isHost()) $('mapRow').querySelectorAll('.ichip').forEach(b=>b.onclick=async()=>{
    if(b.dataset.m===room.mapId) return;
    const m=applyMap(room,b.dataset.m);
    room.log.push('🗺️ Carte choisie : '+m.e+' '+m.name);
    snd('tap');
    await saveRoom();
  });
  const chip=(id,label,off)=>`<button class="ichip ${off?'off':''}" data-s="${id}" style="font-size:13px;font-weight:800;font-family:'Baloo 2';">${label}</button>`;
  if(isHost()){
    $('setRow').innerHTML=
      chip('rounds','🔁 '+(room.maxRounds||8)+' tours')+
      chip('coins','🪙 Départ '+(room.startCoins||10))+
      chip('mg','🎮 '+((room.mgEvery||1)===1?'Chaque tour':'1 tour sur 2'))+
      chip('tourney','🏆 Tournoi : '+(room.tourney?'OUI':'non'),!room.tourney);
    $('setRow').querySelectorAll('.ichip').forEach(b=>b.onclick=async()=>{
      const s=b.dataset.s;
      if(s==='rounds') room.maxRounds=ROUND_OPTS[(ROUND_OPTS.indexOf(room.maxRounds||8)+1)%ROUND_OPTS.length];
      else if(s==='coins') room.startCoins=COIN_OPTS[(COIN_OPTS.indexOf(room.startCoins||10)+1)%COIN_OPTS.length];
      else if(s==='mg') room.mgEvery=(room.mgEvery||1)===1?2:1;
      else if(s==='tourney'){ room.tourney=!room.tourney; if(room.tourney&&room.maxRounds>6) room.maxRounds=6; }
      snd('tap');
      await saveRoom();
    });
  } else {
    $('setRow').innerHTML='<span class="hint">🔁 '+(room.maxRounds||8)+' tours · 🪙 départ '+(room.startCoins||10)+
      ' · 🎮 '+((room.mgEvery||1)===1?'chaque tour':'1 tour sur 2')+(room.tourney?' · 🏆 TOURNOI':'')+'</span>';
  }
  $('lobbyList').innerHTML=room.players.map(p=>
    `<div class="prow" style="border-left:5px solid ${p.color||'#FFD644'};"><span class="pav">${pAv(p,32)}</span>${p.name}
     ${p.id===room.hostId?'<span class="tag">HÔTE</span>':''}</div>`).join('');
  $('btnStart').style.display=isHost()?'block':'none';
  $('btnStart').disabled=room.players.length<2;
  $('waitHost').style.display=isHost()?'none':'block';
}

$('btnStart').onclick=async()=>{
  room.players.forEach(p=>p.coins=room.startCoins||10);
  room.status='board'; room.log.push('🎉 C\'est parti ! '+room.players[0].name+' commence.');
  if(room.tourney) room.log.push('🏆 TOURNOI en 3 manches : que le meilleur gagne !');
  await saveRoom();
};
$('btnShare').onclick=async()=>{
  if(!room) return;
  const msg='Rejoins ma partie La Fête des Étoiles ! Code : '+room.code;
  try{
    if(navigator.share) await navigator.share({title:'La Fête des Étoiles', text:msg, url:location.href});
    else { await navigator.clipboard.writeText(msg+' — '+location.href); toast('Copié dans le presse-papier 📋'); }
  }catch(e){}
};

/* terrains d'île illustrés : le décor du plateau vient de Meshy (repli : ellipses) */
const TER_OK={};
['fete','spirale','archipel','volcan'].forEach(k=>{
  const im=new Image();
  im.onload=()=>{ TER_OK[k]=1; if(room&&room.status==='board') render(); };
  im.src='/art/terrain-'+k+'.jpg';
});
/* ---------- journal vivant : le héros réagit à chaque action ---------- */
let actBarEl=null, lastActN=0, actQueue=[], actBusy=false;
function ensureActBar(){
  if(!actBarEl){ actBarEl=document.createElement('div'); actBarEl.className='actbar'; document.body.appendChild(actBarEl); }
  return actBarEl;
}
function playActChip(a){
  const p=room&&room.players.find(q=>q.id===a.pid);
  const bar=ensureActBar();
  const chip=document.createElement('div'); chip.className='actchip';
  chip.innerHTML=(p?pAvPose(p,a.mood?36:30,a.mood):'')+'<span style="font-size:17px;">'+(a.icon||'')+'</span><span>'+a.txt+'</span>';
  bar.appendChild(chip);
  while(bar.children.length>3) bar.firstChild.remove();
  setTimeout(()=>chip.remove(),2600);
}
function pumpActs(){
  if(actBusy) return;
  const next=actQueue.shift();
  if(!next) return;
  actBusy=true; playActChip(next);
  setTimeout(()=>{ actBusy=false; pumpActs(); },520);
}
function logAct(p,icon,txt,logTxt,mood){
  room.log.push(logTxt||((p?p.name+' ':'')+txt.replace(/<[^>]*>/g,'')));
  room.actN=(room.actN||0)+1;
  room.acts=(room.acts||[]).slice(-5);
  room.acts.push({n:room.actN, pid:p&&p.id, icon, txt, mood:mood||null});
  lastActN=room.actN;
  actQueue.push({pid:p&&p.id, icon, txt, mood:mood||null});
  pumpActs();
}
function syncActs(){
  if(!room||!room.acts||!room.acts.length) return;
  const fresh=room.acts.filter(a=>a.n>lastActN);
  if(!fresh.length) return;
  lastActN=room.acts[room.acts.length-1].n;
  fresh.forEach(a=>actQueue.push(a));
  pumpActs();
}

/* props de décor illustrés (remplacent les emojis des îles si présents) */
const PROP_FILES={'🎪':'prop-chapiteau','🎡':'prop-roue','🎠':'prop-carrousel','🌴':'prop-palmier','🌋':'prop-volcan','⛄':'prop-neige'};
const PROP_OK={};
Object.values(PROP_FILES).forEach(f=>{
  const im=new Image(); im.onload=()=>{ PROP_OK[f]=1; if(room&&room.status==='board') render(); };
  im.src='/art/'+f+'.png';
});

/* deltas de pièces/étoiles flottants sur les cartes du HUD */
let prevVals={}, prevRoomCode='';
function spawnDelta(pid,txt,good){
  const card=document.querySelector('.pcard[data-pid="'+pid+'"]');
  if(!card) return;
  const d=document.createElement('div');
  d.className='dchip';
  d.style.color=good?'#3EE6C1':'#FF6B6B';
  d.textContent=txt;
  card.appendChild(d);
  setTimeout(()=>d.remove(),1250);
}
/* explosion d'étoiles (achat d'étoile, victoire) */
function starBurst(x,y){
  for(let i=0;i<14;i++){
    const s=document.createElement('div');
    const a=Math.random()*6.283, dd=44+rnd(70);
    s.textContent=['✦','⭐','✨'][rnd(3)];
    s.style.cssText=`position:fixed;left:${x}px;top:${y}px;font-size:${10+rnd(13)}px;pointer-events:none;z-index:66;
      color:#FFD644;opacity:1;transition:transform .8s cubic-bezier(.1,.8,.3,1),opacity .8s;`;
    document.body.appendChild(s);
    requestAnimationFrame(()=>{
      s.style.transform=`translate(${Math.cos(a)*dd}px,${Math.sin(a)*dd-34}px) rotate(${rnd(360)}deg)`;
      s.style.opacity='0';
    });
    setTimeout(()=>s.remove(),880);
  }
}

/* icônes vectorielles des cases (nettes sur tous les téléphones),
   ANIMÉES par type — le plateau vit. delay décale les cycles entre cases. */
function tileIcon(t,x,y,active,delay){
  const s='stroke="rgba(0,0,0,.3)" stroke-width="1"';
  let g='';
  switch(t){
    case 'start': g=`
      <line x1="-2" y1="9" x2="-2" y2="-11" stroke="#5A4632" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M-1 -11 L11 -7.5 L-1 -4 Z" fill="#FF5FA2" ${s}/>`; break;
    case 'red': g=`
      <path d="M0 -10 L2.5 -3.5 L9.5 -3 L4 1.5 L6 8.5 L0 4.5 L-6 8.5 L-4 1.5 L-9.5 -3 L-2.5 -3.5 Z" fill="#8F1D18" stroke="#5C120F" stroke-width="1.2"/>
      <rect x="-1.3" y="-5" width="2.6" height="6" rx="1.2" fill="#fff"/>
      <circle cy="3.6" r="1.4" fill="#fff"/>`; break;
    case 'lucky': g=`
      <circle cx="-3.4" cy="-2.6" r="3.6" fill="#1FA86B"/>
      <circle cx="3.4" cy="-2.6" r="3.6" fill="#27BE7B"/>
      <circle cx="0" cy="2" r="3.6" fill="#1FA86B"/>
      <circle cx="-4.2" cy="-3.6" r="1.1" fill="#fff" opacity=".5"/>
      <path d="M0 3 Q1.4 7 4 8.4" stroke="#166B45" stroke-width="1.8" fill="none" stroke-linecap="round"/>`; break;
    case 'event': g=`
      <rect x="-7.5" y="-3" width="15" height="10" rx="1.6" fill="#E8455F" ${s}/>
      <rect x="-8.5" y="-6.4" width="17" height="4" rx="1.4" fill="#FF5F7E" ${s}/>
      <rect x="-1.5" y="-6.4" width="3" height="13.4" fill="#FFD644"/>
      <path d="M0 -6.6 C-5 -12 -9 -7 -2.8 -6.4 M0 -6.6 C5 -12 9 -7 2.8 -6.4" fill="none" stroke="#FFD644" stroke-width="1.8"/>`; break;
    case 'starT': g=`
      <path d="M0 -9.6 L2.7 -3 L9.6 -2.6 L4.4 1.9 L6 8.6 L0 4.8 L-6 8.6 L-4.4 1.9 L-9.6 -2.6 L-2.7 -3 Z"
        fill="${active?'#FFF7CF':'rgba(255,255,255,.35)'}" stroke="${active?'#C79A00':'#6E5BD6'}" stroke-width="1.6"/>
      ${active?'<circle cx="-2.2" cy="-0.6" r="1" fill="#1E1440"/><circle cx="2.2" cy="-0.6" r="1" fill="#1E1440"/><path d="M-1.6 2 Q0 3.4 1.6 2" stroke="#1E1440" stroke-width="1" fill="none"/>':''}`; break;
    case 'shop': g=`
      <path d="M-7 -3 L7 -3 L5.8 9 L-5.8 9 Z" fill="#7E57D6" ${s}/>
      <path d="M-3.6 -3 C-3.6 -8.4 3.6 -8.4 3.6 -3" fill="none" stroke="#4B2E97" stroke-width="1.8"/>
      <circle cx="0" cy="3" r="2.1" fill="#FFD644"/>`; break;
    case 'boo': g=`
      <path d="M-6.5 8 L-6.5 -1 C-6.5 -7.6 6.5 -7.6 6.5 -1 L6.5 8 L4 6 L1.6 8.2 L-1 6 L-3.6 8.2 Z" fill="#F6F2FF" ${s}/>
      <circle cx="-2.4" cy="-1.4" r="1.5" fill="#1E1440"/><circle cx="2.4" cy="-1.4" r="1.5" fill="#1E1440"/>
      <path d="M-1.2 2.2 Q0 3.4 1.2 2.2" stroke="#1E1440" stroke-width="1.1" fill="none"/>`; break;
    case 'duel': g=`
      <g transform="rotate(45)">
        <rect x="-1.2" y="-9.5" width="2.4" height="12.6" rx="1" fill="#DDE7F5" ${s}/>
        <rect x="-3.4" y="3.2" width="6.8" height="1.9" rx="1" fill="#8A5A2B"/>
        <rect x="-1" y="5.1" width="2" height="3.4" rx="1" fill="#5A4632"/>
      </g>
      <g transform="rotate(-45)">
        <rect x="-1.2" y="-9.5" width="2.4" height="12.6" rx="1" fill="#DDE7F5" ${s}/>
        <rect x="-3.4" y="3.2" width="6.8" height="1.9" rx="1" fill="#8A5A2B"/>
        <rect x="-1" y="5.1" width="2" height="3.4" rx="1" fill="#5A4632"/>
      </g>`; break;
    case 'bank': g=`
      <rect x="-7.6" y="-7" width="15.2" height="14" rx="2.4" fill="#8FA3BF" ${s}/>
      <rect x="-5.6" y="-5" width="11.2" height="10" rx="1.6" fill="#5E7696"/>
      <circle r="2.9" fill="#DDE7F5" stroke="#33475E" stroke-width="1.4"/>
      <line x1="0" y1="0" x2="1.9" y2="-1.7" stroke="#33475E" stroke-width="1.3"/>`; break;
    case 'chance': g=`
      <rect x="-8" y="-6.5" width="16" height="11" rx="2.4" fill="#D6408F" ${s}/>
      <rect x="-6.1" y="-4.2" width="3.5" height="5.4" rx="1" fill="#fff"/>
      <rect x="-1.75" y="-4.2" width="3.5" height="5.4" rx="1" fill="#fff"/>
      <rect x="2.6" y="-4.2" width="3.5" height="5.4" rx="1" fill="#fff"/>
      <circle cx="0" cy="6.4" r="1.6" fill="#FFD644"/>
      <line x1="8.2" y1="-5" x2="10.4" y2="-8" stroke="#962862" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="10.8" cy="-8.6" r="1.5" fill="#FF6B6B"/>`; break;
    case 'bowser': g=`
      <path d="M-8 -6 L-4.2 -3 M8 -6 L4.2 -3" stroke="#2C1B36" stroke-width="2.8" stroke-linecap="round"/>
      <circle r="7" fill="#4A3550" ${s}/>
      <rect x="-4.4" y="4.4" width="8.8" height="3.8" rx="1.6" fill="#4A3550"/>
      <circle cx="-2.8" cy="-0.6" r="1.9" fill="#FF6B6B"/><circle cx="2.8" cy="-0.6" r="1.9" fill="#FF6B6B"/>
      <rect x="-2.9" y="4.9" width="1.4" height="2.7" fill="#241028"/>
      <rect x="-0.7" y="4.9" width="1.4" height="2.7" fill="#241028"/>
      <rect x="1.5" y="4.9" width="1.4" height="2.7" fill="#241028"/>`; break;
    default: g=` <!-- pièce -->
      <circle r="8.2" fill="#FFD644" stroke="#C79A00" stroke-width="2"/>
      <circle r="5.2" fill="none" stroke="#C79A00" stroke-width="1.1" opacity=".8"/>
      <path d="M0 -3.4 L1.1 -1 L3.6 -0.9 L1.8 0.8 L2.4 3.3 L0 2 L-2.4 3.3 L-1.8 0.8 L-3.6 -0.9 L-1.1 -1 Z" fill="#B8860B" opacity=".85"/>`;
  }
  const cls=t==='starT'?(active?'star':'starOff'):(t in {blue:1,red:1,lucky:1,event:1,shop:1,boo:1,duel:1,bank:1,chance:1,bowser:1,start:1}?t:'blue');
  return `<ellipse cx="${x}" cy="${y+7}" rx="8" ry="2.8" fill="rgba(0,0,0,.25)"/>
    <g class="ti ti-${cls}" style="animation-delay:${(delay||0).toFixed(2)}s">
      <g transform="translate(${x},${y-4}) scale(.92)">${g}</g>
    </g>`;
}

/* fait défiler l'écran pour suivre le pion du joueur en cours
   (zone morte : si le pion est déjà bien visible, on ne bouge pas) */
function scrollToPawn(smooth){
  const el=document.querySelector('#boardWrap .tok.cur');
  if(!el){
    // plateau 3D : la carte entière est cadrée — on ramène juste le diorama à l'écran
    if(window.B3D&&B3D.ok){
      const bw=$('boardWrap'), r=bw&&bw.getBoundingClientRect();
      if(r&&(r.top<-40||r.bottom>window.innerHeight+40))
        bw.scrollIntoView({block:'center',behavior:smooth===false?'auto':'smooth'});
    }
    return;
  }
  const r=el.getBoundingClientRect();
  const h=window.innerHeight;
  if(r.top>h*.2&&r.bottom<h*.62) return; // déjà dans la fenêtre confortable
  const target=r.top+window.scrollY-h*.36;
  window.scrollTo({top:Math.max(0,target), behavior:smooth===false?'auto':'smooth'});
}
function distToStar(fromIdx){
  if(fromIdx===room.starIdx) return 0;
  const seen=new Set([fromIdx]), q=[[fromIdx,0]];
  while(q.length){
    const it=q.shift();
    for(const j of room.board[it[0]].next){
      if(j===room.starIdx) return it[1]+1;
      if(!seen.has(j)){ seen.add(j); q.push([j,it[1]+1]); }
    }
  }
  return -1;
}
function renderBoard(){
  show('scr-board');
  const cur=room.players[room.turn];
  const tk=room.round+'-'+room.turn;
  if(tk!==lastTurnKey){
    lastTurnKey=tk; heroJingle(cur);
    setTimeout(()=>scrollToPawn(),120); // tout le monde suit le joueur dont c'est le tour
  }
  // spectateurs : la caméra suit AUSSI chaque pas du joueur actif (reçu en direct)
  const pk=tk+':'+cur.pos;
  if(pk!==lastPosKey){
    lastPosKey=pk;
    if(!myTurn()&&!animBusy) setTimeout(()=>scrollToPawn(),60);
  }
  // duel de case : c'est MOI qu'on défie → je lance mon dé sur MON téléphone
  if(!local&&room.duelAsk&&room.duelAsk.def===me.id&&lastDuelSeq!==room.duelAsk.seq){
    lastDuelSeq=room.duelAsk.seq;
    (async()=>{
      snd('duel'); vib(50);
      await ask({icon:'⚔️',title:'ON VEUT TA PLACE !',sheet:true,
        text:(room.duelAsk&&room.duelAsk.atkName||'Un joueur')+' a fait '+(room.duelAsk&&room.duelAsk.a)+' au dé ! Défends ta case !',
        options:[{label:'🎲 Lancer mon dé !',value:1,cls:'rose'}]});
      actSend({k:'dref', v:1+rnd(6)});
    })();
  }
  const who=local?cur.name+' de jouer !':(myTurn()?'TOI de jouer !':cur.name+' de jouer');
  const myP=local?cur:room.players.find(p=>p.id===me.id);
  const dStar=myP?distToStar(myP.pos):-1;
  $('roundInfo').textContent='Tour '+room.round+' / '+room.maxRounds+' — à '+who+
    (dStar>=0?' · ⭐ à '+dStar+' case'+(dStar>1?'s':''):'')+
    ((room.bank||0)>0?' · 🏦 '+room.bank+' 🪙':'');
  // pastilles de progression des tours (+ couronnes en tournoi)
  $('roundDots').innerHTML=
    (room.tourney?('<span style="font-size:11px;font-weight:800;margin-right:5px;">Manche '+(room.manche||1)+'/3</span>'):'')+
    Array.from({length:Math.min(12,room.maxRounds)},(_,i)=>
      `<i class="${i+1<room.round?'done':(i+1===room.round?'cur':'')}"></i>`).join('');
  const leader=[...room.players].sort((a,b)=>(b.stars-a.stars)||(b.coins-a.coins))[0];
  $('hud').innerHTML=room.players.map((p,i)=>
    `<div class="pcard ${i===room.turn?'turn':''}" data-pid="${p.id}" ${p.gone?'style="opacity:.4;"':''}>
      ${(p===leader&&(p.stars>0||p.coins>10))?'<div class="lead">👑</div>':''}
      ${(!local&&p.id===me.id&&i===room.turn)?'<div class="youtag">À TOI !</div>':''}
      <div class="pav">${pAv(p,36)}${p.gone?' 💤':''}</div>
      <div class="pname">${p.name}</div>
      <div class="pres">🪙${p.coins} ⭐${p.stars}</div>
      <div class="pres" style="font-size:13px;min-height:17px;">${pItems(p).map(id=>ITEMS[id]?ITEMS[id].e:'').join(' ')||'&nbsp;'}</div>
      <div style="height:4px;border-radius:2px;background:${p.color||'#FFD644'};margin-top:4px;"></div>
    </div>`).join('');
  // deltas flottants +N / −N sur les cartes joueurs
  if(prevRoomCode!==room.code){ prevRoomCode=room.code; prevVals={}; }
  room.players.forEach(p=>{
    const prev=prevVals[p.id];
    if(prev){
      const dc=p.coins-prev.c;
      if(dc) spawnDelta(p.id,(dc>0?'+':'')+dc+' 🪙',dc>0);
      const ds=p.stars-prev.s;
      if(ds) spawnDelta(p.id,(ds>0?'+':'')+ds+' ⭐',ds>0);
    }
    prevVals[p.id]={c:p.coins,s:p.stars};
  });
  // PLATEAU VOXEL 3D : pris en charge par le moteur three.js quand il est prêt ;
  // sinon (WebGL absent, module pas encore chargé) le rendu SVG ci-dessous prend le relais
  const use3D=!!(window.B3D&&B3D.ok&&B3D.render());
  if(!use3D){
  // carte façon Mario Party : graphe de nœuds sur une île volante ovale
  const nodes=room.board;
  const TOPC={start:'#F4F0FF',blue:'#5AC8FA',red:'#FF6B6B',lucky:'#3EE6C1',event:'#FF9F45',starT:'#8E7CFF',shop:'#C39BFF',boo:'#9B89D8',duel:'#FF8FAB',bank:'#F0C34E',chance:'#FF9FF3',bowser:'#5B3A8E'};
  const ICON={start:'🏁',blue:'🪙',red:'💥',lucky:'🍀',event:'🎁',shop:'🛍️',boo:'👻',duel:'⚔️',bank:'🏦',chance:'🎰',bowser:'👹'};
  const L=30, H=18, DEP=13, EL=24;         // EL : hauteur d'un étage de relief
  const ty=n=>n.y-(n.h||0)*EL;             // y du plateau de la case (sommet du pilier)
  const MM=room.mapMeta||mapFete().meta;
  // routes : piste balisée nette — ruban sombre, filets lumineux sur les bords,
  // chevrons dans le sens de circulation, marches sur les pentes
  let roadPath='', stairs='', rails='', chevrons='';
  nodes.forEach(n=>n.next.forEach(j=>{
    const m=nodes[j];
    const y1=ty(n), y2=ty(m);
    roadPath+=`M${n.x},${y1} L${m.x},${y2} `;
    const dx=m.x-n.x, dy=y2-y1, len=Math.hypot(dx,dy)||1;
    const ux=dx/len, uy=dy/len, px=-uy, py=ux;
    // filets de bord (balisage lumineux, en retrait des extrémités)
    const inset=10;
    if(len>2*inset){
      const ax=n.x+ux*inset, ay=y1+uy*inset, bx=m.x-ux*inset, by=y2-uy*inset;
      [[6.5],[-6.5]].forEach(([o])=>{
        rails+=`<line x1="${(ax+px*o).toFixed(1)}" y1="${(ay+py*o).toFixed(1)}" x2="${(bx+px*o).toFixed(1)}" y2="${(by+py*o).toFixed(1)}" stroke="rgba(178,156,255,.34)" stroke-width="1.6" stroke-linecap="round"/>`;
      });
    }
    // chevrons directionnels (sens de parcours toujours lisible)
    const ts=len>78?[.4,.72]:[.55];
    ts.forEach(t=>{
      const cx=n.x+dx*t, cy=y1+dy*t;
      chevrons+=`<path d="M${(cx-ux*3.4+px*4.4).toFixed(1)},${(cy-uy*3.4+py*4.4).toFixed(1)} L${(cx+ux*4).toFixed(1)},${(cy+uy*4).toFixed(1)} L${(cx-ux*3.4-px*4.4).toFixed(1)},${(cy-uy*3.4-py*4.4).toFixed(1)}"
        stroke="rgba(220,210,255,.66)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    const dh=(m.h||0)-(n.h||0);
    if(dh){
      // marches : petits barreaux perpendiculaires sur le segment en pente
      const steps=Math.abs(dh)*2+1;
      for(let s=1;s<=steps;s++){
        const t=s/(steps+1);
        const sx=n.x+dx*t, sy=y1+dy*t;
        stairs+=`<line x1="${(sx-px*7).toFixed(1)}" y1="${(sy-py*7).toFixed(1)}" x2="${(sx+px*7).toFixed(1)}" y2="${(sy+py*7).toFixed(1)}" stroke="rgba(255,255,255,.30)" stroke-width="2.5" stroke-linecap="round"/>`;
      }
    }
  }));
  const hasTer=!!TER_OK[room.mapId];
  const roads=hasTer?`
    <path d="${roadPath}" stroke="rgba(0,0,0,.35)" stroke-width="19" fill="none" stroke-linecap="round"/>
    <path d="${roadPath}" stroke="#31215C" stroke-width="13" fill="none" stroke-linecap="round" opacity=".96"/>
    ${rails}
    ${chevrons}
    ${stairs}`:`
    <path d="${roadPath}" stroke="#160D38" stroke-width="24" fill="none" stroke-linecap="round"/>
    <path d="${roadPath}" stroke="#2A1858" stroke-width="17" fill="none" stroke-linecap="round"/>
    <path d="${roadPath}" stroke="rgba(255,255,255,.22)" stroke-width="2.5" fill="none" stroke-dasharray="1 9" stroke-linecap="round"/>
    ${stairs}`;
  // sol du plateau : terrain illustré pleine surface, sinon îles organiques
  const V=MM.view||[-26,-24,472,588];
  const island=hasTer
    ? `<image href="/art/terrain-${room.mapId}.jpg" x="${V[0]}" y="${V[1]}" width="${V[2]}" height="${V[3]}" preserveAspectRatio="none"/>
       <rect x="${V[0]}" y="${V[1]}" width="${V[2]}" height="${V[3]}" fill="rgba(14,8,34,.28)"/>`
    : MM.isles.map(I=>`
    <ellipse cx="${I.cx}" cy="${I.cy+30}" rx="${I.rx}" ry="${I.ry}" fill="#150C36"/>
    <ellipse cx="${I.cx}" cy="${I.cy}" rx="${I.rx}" ry="${I.ry}" fill="#241553" stroke="#3A2A70" stroke-width="3"/>
    <ellipse cx="${I.cx}" cy="${I.cy}" rx="${Math.max(20,I.rx-28)}" ry="${Math.max(20,I.ry-26)}" fill="none" stroke="rgba(255,255,255,.045)" stroke-width="18"/>`).join('');
  // dégradés des faces supérieures (un par couleur utilisée)
  const gradSeen={};
  let defs='';
  const gfill=c=>{
    const k=c.replace('#','');
    if(!gradSeen[k]){ gradSeen[k]=1;
      defs+=`<linearGradient id="g${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tint(c,.3)}"/><stop offset="1" stop-color="${c}"/></linearGradient>`; }
    return `url(#g${k})`;
  };
  // cases (peintre : par y croissant, l'altitude départage à y égal)
  let cells='';
  nodes.map((n,i)=>({n,i})).sort((a,b)=>(a.n.y-b.n.y)||((a.n.h||0)-(b.n.h||0))).forEach(o=>{
    const x=o.n.x, hN=o.n.h||0, y=o.n.y-hN*EL, dep=DEP+hN*EL;
    const active=o.n.t==='starT'&&o.i===room.starIdx;
    const zone=MM.zones&&MM.zones[o.n.z||0];
    const vif=o.n.t==='blue'&&zone?zone.blue:TOPC[o.n.t]||'#5AC8FA';
    // sur terrain illustré : tuiles sobres au ton du thème, le TYPE se lit par
    // le liseré néon + l'icône (fini le patchwork multicolore criard)
    const spec=o.n.t!=='blue'&&o.n.t!=='start';
    const top=active?'#FFD644':(hasTer?shade(vif,spec?.42:.34):vif);
    const edge=active?'#FFE9A0':(hasTer?vif:shade(vif,.45));
    const edgeW=hasTer?(spec?2.4:1.3):1.5;
    // strates de roche sur les hauts piliers (lisibilité du relief)
    let strata='';
    for(let s2=1;s2<=hN;s2++){
      const sy=y+H+ (dep-DEP)*s2/(hN+0.001);
      strata+=`<line x1="${x-L+4}" y1="${sy-H/2}" x2="${x}" y2="${sy}" stroke="rgba(0,0,0,.14)" stroke-width="1.4"/>
        <line x1="${x}" y1="${sy}" x2="${x+L-4}" y2="${sy-H/2}" stroke="rgba(0,0,0,.20)" stroke-width="1.4"/>`;
    }
    cells+=`<g>
      ${hN?`<ellipse cx="${x}" cy="${o.n.y+H*.55}" rx="${L*.85}" ry="${H*.5}" fill="rgba(0,0,0,${(.12+hN*.05).toFixed(2)})"/>`:''}
      ${active?`<ellipse cx="${x}" cy="${y}" rx="${L+22}" ry="${H+16}" fill="#FFD64418"/>
      <ellipse class="ringA" cx="${x}" cy="${y}" rx="${L+8}" ry="${H+6}" fill="none" stroke="#FFD644" stroke-width="4"/>`:''}
      ${hasTer&&spec&&!active?`<ellipse cx="${x}" cy="${y}" rx="${L+9}" ry="${H+7}" fill="${vif}1E"/>`:''}
      <polygon points="${x-L},${y} ${x},${y+H} ${x},${y+H+dep} ${x-L},${y+dep}" fill="${hasTer?'#191130':shade(top,.5)}"/>
      <polygon points="${x+L},${y} ${x},${y+H} ${x},${y+H+dep} ${x+L},${y+dep}" fill="${hasTer?'#221741':shade(top,.68)}"/>
      ${strata}
      <polygon points="${x},${y-H} ${x+L},${y} ${x},${y+H} ${x-L},${y}" fill="${gfill(top)}" stroke="${edge}" stroke-width="${edgeW}"/>
      <polygon points="${x},${y-H+3} ${x+L-8},${y} ${x},${y+H-3} ${x-L+8},${y}" fill="rgba(255,255,255,${hasTer?'.07':'.10'})"/>
      ${tileIcon(o.n.t,x,y+1,active,(o.i%7)*.38)}
    </g>`;
    const here=room.players.map((p,pi)=>({p,pi})).filter(q=>q.p.pos===o.i);
    here.forEach((q,k)=>{
      const dx=(k-(here.length-1)/2)*17;
      const aura=q.p.color||'#FFD644';
      cells+=`<ellipse cx="${x+dx}" cy="${y-1}" rx="10" ry="4.4" fill="rgba(0,0,0,.35)"/>
        <circle cx="${x+dx}" cy="${y-19}" r="15.5" fill="${aura}26" stroke="${aura}" stroke-width="${q.pi===room.turn?2.5:1.2}" opacity="${q.pi===room.turn?1:.55}"/>
        <g class="tok ${q.pi===room.turn?'cur':''}">${pAvBoard(q.p,x+dx,y-3,30)}</g>`;
    });
  });
  // panneaux de carrefour (tout nœud à 2 sorties) : pastille vectorielle
  const junction=nodes.filter(n=>n.next.length>1)
    .map(n=>`<g opacity=".9">
      <circle cx="${n.x+24}" cy="${ty(n)-20}" r="8.5" fill="#20163F" stroke="#FFD644" stroke-width="1.6"/>
      <path d="M${n.x+24},${ty(n)-25.5} l3.6,5 h-2.1 v3.6 h-3 v-3.6 h-2.1 Z" fill="#FFD644"/>
    </g>`).join('');
  // décor de la carte — sur terrain illustré, AUCUN émoticône flottant :
  // le décor est dans l'image, seuls les props détourés (images) restent
  const deco=(MM.deco||[]).filter(d=>hasTer?(PROP_FILES[d.e]&&PROP_OK[PROP_FILES[d.e]]):true).map(d=>{
    if(d.st)
      return `<text x="${d.x}" y="${d.y}" font-size="${d.s}" text-anchor="middle" ${d.c?`fill="${d.c}"`:''} opacity="${d.c?'.5':'.4'}">${d.e}</text>`;
    const pf=PROP_FILES[d.e];
    if(pf&&PROP_OK[pf]){
      const w=d.s*2.3;
      return `<image class="deco" ${d.d?`style="animation-delay:${d.d}s"`:''} href="/art/${pf}.png"
        x="${d.x-w/2}" y="${d.y-w*.92}" width="${w}" height="${w}" preserveAspectRatio="xMidYMax meet"/>`;
    }
    return `<text class="deco" ${d.d?`style="animation-delay:${d.d}s"`:''} x="${d.x}" y="${d.y}" font-size="${d.s}" text-anchor="middle">${d.e}</text>`;
  }).join('');
  // aperçu de portée du dé : pastilles 1-6 sur les cases atteignables à mon tour
  let reach='';
  if(myTurn()&&!animBusy){
    const src=local?cur:room.players.find(p=>p.id===me.id);
    if(src){
      const depth={}; depth[src.pos]=0;
      const q=[src.pos];
      while(q.length){
        const i=q.shift();
        if(depth[i]>=6) continue;
        for(const j of nodes[i].next) if(depth[j]===undefined){ depth[j]=depth[i]+1; q.push(j); }
      }
      for(const i in depth){
        const d=depth[i];
        if(d<1) continue;
        const n=nodes[i];
        reach+=`<g opacity=".8">
          <circle cx="${n.x}" cy="${ty(n)-H-8}" r="6.6" fill="rgba(18,11,44,.75)" stroke="rgba(255,255,255,.55)" stroke-width="1"/>
          <text x="${n.x}" y="${ty(n)-H-5}" text-anchor="middle" font-size="8.5" fill="#fff" font-weight="800">${d}</text></g>`;
      }
    }
  }
  // bombes piégées : visibles uniquement par leur poseur (ou en mode local)
  let traps='';
  if(room.traps) for(const ti in room.traps){
    if(local||room.traps[ti].by===me.id){
      const n=nodes[ti];
      if(n) traps+=`<g><circle cx="${n.x+15}" cy="${ty(n)-12}" r="5" fill="#2B1230" stroke="#FF5A4A" stroke-width="1.8"/>
        <circle cx="${n.x+15}" cy="${ty(n)-12}" r="1.8" fill="#FF5A4A"><animate attributeName="opacity" values="1;.25;1" dur="1s" repeatCount="indefinite"/></circle></g>`;
    }
  }
  // fond d'ambiance illustré propre à la carte (voile assombrissant pour la lisibilité)
  const bw=$('boardWrap');
  const wantBg=`linear-gradient(rgba(16,10,42,.58),rgba(16,10,42,.74)), url('/art/bg-${room.mapId||'fete'}.jpg')`;
  if(bw.dataset.bg!==room.mapId){
    bw.dataset.bg=room.mapId;
    bw.style.backgroundImage=wantBg;
    bw.style.backgroundSize='cover';
    bw.style.backgroundPosition='center';
  }
  // lampions de gala pour les derniers tours
  let lamps='';
  if(room.round>=room.maxRounds-2){
    nodes.forEach((n,i)=>{
      if(i%4===0) lamps+=`<circle cx="${n.x}" cy="${ty(n)-30}" r="3" fill="#FFD644" opacity=".9">
        <animate attributeName="opacity" values=".9;.35;.9" dur="${(1.5+(i%3)*.5).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    });
  }
  bw.innerHTML=`<svg viewBox="${(MM.view||[-26,-24,472,588]).join(' ')}" style="width:100%;display:block;" role="img" aria-label="Plateau de jeu">
    <defs>${defs}</defs>
    ${island}
    ${deco}
    ${roads}
    ${cells}
    ${reach}
    ${traps}
    ${lamps}
    ${junction}
  </svg>`;
  // la nuit tombe au fil des tours
  const prog=(room.round-1)/Math.max(1,room.maxRounds-1);
  bw.querySelector('svg').style.filter=
    `brightness(${(1.03-prog*.15).toFixed(3)}) saturate(${(1+prog*.16).toFixed(3)}) hue-rotate(-${Math.round(prog*11)}deg)`;
  } // fin du repli SVG (le 3D gère son propre décor)
  $('rollBtns').style.display=(myTurn()&&!animBusy)?'flex':'none';
  renderItemRow();
  $('turnHint').textContent=(myTurn()&&!animBusy)?'Utilise un objet puis lance un dé !':'⭐ à '+starCost()+' 🪙 en passant dessus';
  $('gameLog').innerHTML=room.log.slice(-6).map(l=>'<div>• '+l+'</div>').join('');
  $('gameLog').scrollTop=9999;
}
function renderItemRow(){
  const row=$('itemRow');
  if(!myTurn()||animBusy){ row.innerHTML=''; return; }
  const p=room.players[room.turn];
  row.innerHTML=pItems(p).map((id,i)=>ITEMS[id]?`<button class="ichip" data-i="${i}" title="${ITEMS[id].name}">${itemPic(id,26)}</button>`:'').join('');
  row.querySelectorAll('.ichip').forEach(b=>b.onclick=()=>useItem(+b.dataset.i));
}

/* =================== tour de jeu =================== */
async function useItem(idx){
  if(!myTurn()||animBusy) return;
  const p=room.players[room.turn];
  const id=pItems(p)[idx]; if(!id) return;
  if(id==='shield'){ toast('🛡️ Le bouclier agit tout seul quand on t\'attaque !'); return; }
  const diceBusy=room.turnFx&&(room.turnFx.double||room.turnFx.triple);
  if(diceBusy&&(id==='mush'||id==='triple'||id==='loaded')){
    toast('Un seul dé spécial par tour 😉'); return;
  }
  if(id==='mush'){
    pItems(p).splice(idx,1);
    room.turnFx=Object.assign({},room.turnFx,{double:true});
    room.log.push('🍄 '+p.name+' utilise un Champi Double : 2 dés ce tour !');
    await saveRoom(); return;
  }
  if(id==='magnet'){
    pItems(p).splice(idx,1);
    room.turnFx=Object.assign({},room.turnFx,{magnet:true});
    room.log.push('🧲 '+p.name+' active son Aimant !');
    await saveRoom(); return;
  }
  if(id==='triple'){
    pItems(p).splice(idx,1);
    room.turnFx=Object.assign({},room.turnFx,{triple:true});
    room.log.push('🎲 '+p.name+' utilise un Dé Triple : 3 dés ce tour !');
    await saveRoom(); return;
  }
  if(id==='bomb'){
    pItems(p).splice(idx,1);
    room.traps=room.traps||{};
    room.traps[p.pos]={by:p.id};
    room.log.push('🤫 '+p.name+' manigance quelque chose sur sa case…');
    toast('🧨 Bombe posée en secret sur cette case !');
    await saveRoom(); return;
  }
  if(id==='ovni'){
    animBusy=true;
    scrollToPawn();
    const others=room.players.filter(o=>o.id!==p.id);
    const tid=await ask({title:'🛸 OVNI',text:'Qui renvoyer à la case départ ?',sheet:true,
      options:others.map(o=>({label:pAv(o,22)+' '+o.name,value:o.id}))
        .concat([{label:'Annuler',value:null,cls:'ghost'}])});
    if(!tid){ animBusy=false; render(); return; }
    pItems(p).splice(idx,1);
    const t=room.players.find(o=>o.id===tid);
    if(popShield(t)){
      fxCast('🛡️','RATÉ !','Le bouclier de '+t.name+' repousse l\'OVNI !');
      room.log.push('🛡️ '+t.name+' bloque l\'OVNI de '+p.name+' !');
    } else {
      t.pos=0;
      snd('whoosh');
      fxCast('🛸','ENLÈVEMENT !',t.name+' est téléporté à la case départ !',2800);
      room.log.push('🛸 '+p.name+' renvoie '+t.name+' à la case départ !');
    }
    animBusy=false;
    await saveRoom(); return;
  }
  if(id==='loaded'){
    animBusy=true; // fige l'état pendant la popup
    scrollToPawn();
    const v=await ask({title:'🎯 Dé Pipé',text:'Choisis le résultat de ton dé !',sheet:true,
      options:[1,2,3,4,5,6].map(n=>({label:'🎲 '+n,value:n})).concat([{label:'Annuler',value:null,cls:'ghost'}])});
    if(v==null){ animBusy=false; render(); return; }
    pItems(p).splice(idx,1);
    room.log.push('🎯 '+p.name+' utilise un Dé Pipé…');
    animBusy=false;
    startRoll('loaded',v); return;
  }
  if(id==='pipe'){
    animBusy=true; // fige l'état pendant la popup
    scrollToPawn();
    const go=await ask({title:'🌀 Tuyau Magique',text:'Te téléporter directement sur l\'étoile ⭐ ?',sheet:true,
      options:[{label:'Zouuu ! 🌀',value:1,cls:'menthe'},{label:'Annuler',value:null,cls:'ghost'}]});
    if(!go){ animBusy=false; render(); return; }
    pItems(p).splice(idx,1);
    p.pos=room.starIdx; p.travel=(p.travel||0)+1;
    room.log.push('🌀 '+p.name+' voyage en tuyau jusqu\'à l\'étoile !');
    fxCast('🌀','TUYAU !',p.name+' se téléporte sur l\'étoile !');
    renderBoard();
    await sleep(600);
    await passStar(p);
    animBusy=false;
    await saveRoom(); return;
  }
}

$('btnRoll').onclick=()=>startRoll('norm');
$('btnRisk').onclick=()=>startRoll('risk');

function setFace(v){
  const f=$('diceFace');
  const s=String(v);
  if(/^[1-6]$/.test(s)){
    const pips={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}[+s];
    f.innerHTML='<div class="pips">'+Array.from({length:9},(_,i)=>'<span class="'+(pips.indexOf(i)>=0?'on':'')+'"></span>').join('')+'</div>';
  } else f.textContent=s;
}
async function startRoll(kind,forced){
  if(!myTurn()||animBusy) return;
  if(kind==='risk'&&room.turnFx&&(room.turnFx.double||room.turnFx.triple)){
    toast('Ton dé spécial est déjà prêt — lance le dé normal ! 🎲'); return;
  }
  animBusy=true;
  $('rollBtns').style.display='none'; $('itemRow').innerHTML='';
  const p=room.players[room.turn];
  const face=$('diceFace');
  const RISK=[0,0,0,8,9,10];
  let d, label;
  snd('dice');
  face.classList.add('roll');
  if(kind==='loaded'){
    for(let i=0;i<6;i++){ setFace(1+rnd(6)); await sleep(60); }
    d=forced; label=''+d;
  } else if(kind==='risk'){
    for(let i=0;i<10;i++){ setFace(RISK[rnd(6)]); await sleep(65); }
    d=RISK[rnd(6)]; label=''+d;
  } else if(room.turnFx&&room.turnFx.triple){
    for(let i=0;i<8;i++){ setFace((1+rnd(6))+'+'+(1+rnd(6))+'+'+(1+rnd(6))); await sleep(70); }
    const d1=1+rnd(6), d2=1+rnd(6), d3=1+rnd(6); d=d1+d2+d3; label=d1+'+'+d2+'+'+d3;
  } else if(room.turnFx&&room.turnFx.double){
    for(let i=0;i<8;i++){ setFace((1+rnd(6))+'+'+(1+rnd(6))); await sleep(70); }
    const d1=1+rnd(6), d2=1+rnd(6); d=d1+d2; label=d1+'+'+d2;
  } else {
    for(let i=0;i<8;i++){ setFace(1+rnd(6)); await sleep(70); }
    d=1+rnd(6); label=''+d;
  }
  setFace(label); face.classList.remove('roll');
  face.classList.add('pop'); setTimeout(()=>face.classList.remove('pop'),480);
  const rr=$('rollRes');
  rr.textContent=d===0?'😵 ZÉRO !':('🎲 '+d+' !');
  rr.classList.add('show');
  setTimeout(()=>rr.classList.remove('show'),1400);
  if(d===0){
    addCoins(p,-2);
    fxCast('😵','PAS DE BOL !',p.name+' fait 0 et perd 2 🪙 !');
    room.log.push('😵 '+p.name+' tente le dé chaos… 0 ! (−2 🪙)');
    await sleep(800);
  } else {
    room.log.push('🎲 '+p.avatar+' '+p.name+' fait '+d+' !');
    await moveBy(p,d);
  }
  await endTurn();
}

async function nextPos(p){
  const node=room.board[p.pos], nxt=node.next;
  if(nxt.length<2) return nxt[0];
  snd('pop');
  const labels=node.labels||[];
  // on montre le plateau : scroll sur le pion + sorties surlignées et numérotées
  scrollToPawn();
  const cols=['#3EE6C1','#FF8FAB','#FFD644'];
  const svg=document.querySelector('#boardWrap svg');
  if(svg) nxt.forEach((j,k)=>{
    const t=room.board[j];
    svg.insertAdjacentHTML('beforeend',
      `<ellipse class="ringA jring" cx="${t.x}" cy="${t.y}" rx="34" ry="22" fill="none" stroke="${cols[k%3]}" stroke-width="4"/>`+
      `<text class="jring" x="${t.x}" y="${t.y-26}" text-anchor="middle" font-size="16" font-weight="800" fill="${cols[k%3]}" style="text-shadow:0 1px 2px #000;">${k+1}</text>`);
  });
  const v=await ask({title:'🧭 CARREFOUR !',text:p.name+', choisis ta route (regarde le plateau ☝️)',sheet:true,
    options:nxt.map((j,k)=>({
      label:(k+1)+' — '+(labels[k]||('Chemin '+(k+1))),
      value:j, cls:k===0?'menthe':'rose'
    }))});
  document.querySelectorAll('.jring').forEach(e=>e.remove());
  return v??nxt[0];
}

async function moveBy(p,d){
  const magnet=room.turnFx&&room.turnFx.magnet;
  const robbed={};
  for(let s=0;s<d;s++){
    p.pos=await nextPos(p); p.travel=(p.travel||0)+1;
    if(p.pos===0){ addCoins(p,8); logAct(p,'🏁','tour complet : <b>+8 🪙</b>','🏁 '+p.name+' finit un tour de plateau : +8 🪙','win'); }
    if(magnet){
      room.players.forEach(o=>{
        if(o.id!==p.id&&o.pos===p.pos&&!robbed[o.id]){
          robbed[o.id]=1;
          if(popShield(o)){ room.log.push('🛡️ '+o.name+' bloque l\'Aimant de '+p.name+' !'); }
          else{ const st=Math.min(5,o.coins); o.coins-=st; addCoins(p,st);
            logAct(p,'🧲','aimante <b>'+st+' 🪙</b> à '+o.name,'🧲 '+p.name+' aimante '+st+' 🪙 à '+o.name+' !','win'); }
        }
      });
    }
    snd('step');
    renderBoard();
    scrollToPawn();
    // chaque pas part immédiatement vers les autres téléphones :
    // tout le monde VOIT le pion marcher case par case
    if(!local){
      room.version=(room.version||0)+1;
      lastStateAt=Date.now();
      send({t:'update', code:room.code, state:room});
    }
    // poussière au pas + squash à l'atterrissage : le pion MARCHE
    const pawnEl=document.querySelector('#boardWrap .tok.cur');
    if(pawnEl){
      try{
        const r2=pawnEl.getBoundingClientRect();
        const dust=document.createElement('div');
        dust.textContent='💨';
        dust.style.cssText=`position:fixed;left:${r2.left+r2.width/2-8}px;top:${r2.bottom-8}px;font-size:11px;pointer-events:none;z-index:40;opacity:.75;`;
        document.body.appendChild(dust);
        dust.animate([{transform:'translate(0,0) scale(1)',opacity:.75},{transform:'translate(-15px,-7px) scale(1.5)',opacity:0}],{duration:470});
        setTimeout(()=>dust.remove(),480);
        if(s===d-1) pawnEl.animate(
          [{transform:'scale(1,1)'},{transform:'scale(1.28,.7)'},{transform:'scale(.92,1.12)'},{transform:'scale(1,1)'}],
          {duration:430,easing:'ease-out'});
      }catch(e){}
    }
    await sleep(620);
    const t=room.board[p.pos].t;
    if(t==='starT'&&p.pos===room.starIdx) await passStar(p);
    else if(t==='shop') await passShop(p);
    else if(t==='boo') await passBoo(p);
    else if(t==='bank'&&s<d-1){
      const dep=Math.min(3,p.coins);
      if(dep>0){ p.coins-=dep; room.bank=(room.bank||0)+dep; snd('coin');
        logAct(p,'🏦','dépose '+dep+' 🪙 (cagnotte : <b>'+room.bank+'</b>)','🏦 '+p.name+' dépose '+dep+' 🪙 à la banque ('+room.bank+' 🪙 dedans) !'); }
    }
  }
  await landEffect(p);
}

/* duel de case : le défenseur lance son dé depuis SON téléphone (relais act) */
let duelResolve=null, lastDuelSeq=0;
async function duelAskRemote(p,foe,aShown){
  room.duelAsk={seq:((room.duelAsk&&room.duelAsk.seq)||0)+1, atk:p.id, atkName:p.name, def:foe.id, a:aShown};
  await saveRoom();
  const v=await new Promise(res=>{
    duelResolve=res;
    // défenseur absent/AFK : son dé part tout seul après 15 s
    setTimeout(()=>{ if(duelResolve===res){ duelResolve=null; res(1+rnd(6)); } },15000);
  });
  room.duelAsk=null;
  await saveRoom();
  return v;
}
async function landEffect(p){
  // DUEL DE CASE : deux pions sur la même case → CHACUN lance son dé, le perdant recule !
  if(p.pos!==0){
    const squatters=room.players.filter(o=>o.id!==p.id&&!o.gone&&o.pos===p.pos);
    if(squatters.length){
      // verrou anti-écho : pendant le duel, les états entrants attendent —
      // sinon room peut être remplacé entre la mutation et l'envoi (positions perdues)
      const wasBusy=animBusy; animBusy=true;
      const foe=squatters[rnd(squatters.length)];
      snd('duel'); vib(30);
      fxCast('⚔️','CASE OCCUPÉE !',p.name+' débarque chez '+foe.name+' : duel de dés pour la place !',1900);
      await sleep(2000);
      // 1) l'arrivant lance SON dé — vrai geste, pas d'automatique
      scrollToPawn();
      await ask({icon:'⚔️',title:'DUEL DE CASE !',sheet:true,
        text:p.name+', lance ton dé pour prendre la place de '+foe.name+' !',
        options:[{label:'🎲 Lancer mon dé !',value:1,cls:'menthe'}]});
      let a=1+rnd(6);
      snd('duel'); vib(20);
      fxCast('🎲',p.name+' fait '+a+' !','À '+foe.name+' de défendre sa place…',1500);
      await sleep(1600);
      // 2) le défenseur lance le sien (sur SON téléphone en ligne, en main propre en local)
      let b;
      if(local){
        await ask({icon:'🎲',title:'DÉFENDS TA PLACE !',sheet:true,
          text:'Passe le téléphone à '+foe.name+' — lance ton dé pour garder ta case !',
          options:[{label:'🎲 Lancer mon dé !',value:1,cls:'rose'}]});
        b=1+rnd(6);
      } else {
        b=await duelAskRemote(p,foe,a);
      }
      snd('duel');
      fxCast('🎲',foe.name+' fait '+b+' !','',1500);
      await sleep(1600);
      // égalité : on relance les deux dés jusqu'à la décision
      while(a===b){
        fxCast('😮','ÉGALITÉ !','On relance les dés !',1300);
        await sleep(1400);
        a=1+rnd(6); b=1+rnd(6);
        fxCast('🎲',(p.avatar||'')+' '+a+' 🆚 '+b+' '+(foe.avatar||''),'',1500);
        await sleep(1600);
      }
      // après les attentes réseau, room a pu être resynchronisé :
      // on re-résout les joueurs PAR ID pour ne jamais muter un objet orphelin
      const pN=room.players.find(q=>q.id===p.id)||p;
      const foeN=room.players.find(q=>q.id===foe.id)||foe;
      const win=a>b?pN:foeN, lose=a>b?foeN:pN;
      // le perdant est repoussé d'une case en arrière (un prédécesseur de la case)
      const prevs=[];
      room.board.forEach((n,i)=>{ if(n.next&&n.next.indexOf(pN.pos)>=0) prevs.push(i); });
      lose.pos=prevs.length?prevs[rnd(prevs.length)]:0;
      snd(win===p?'yay':'bad');
      fxCast('⚔️','DUEL DE CASE !',(p.avatar||'')+' '+a+' 🆚 '+b+' '+(foe.avatar||'')+'<br><b>'+win.name+'</b> garde la place — '+lose.name+' recule !',2900);
      logAct(win,'⚔️','gagne le <b>duel de case</b> !','⚔️ Duel de case : '+win.name+' bat '+lose.name+' qui recule d\'une case !','win');
      renderBoard();
      await saveRoom();
      await sleep(500);
      animBusy=wasBusy;
      if(lose.id===p.id) return; // éjecté : l'effet de la case ne se déclenche pas
    }
  }
  // bombe piégée posée par un autre joueur ?
  const trap=room.traps&&room.traps[p.pos];
  if(trap&&trap.by!==p.id){
    delete room.traps[p.pos];
    const owner=room.players.find(q=>q.id===trap.by);
    if(popShield(p)){
      fxCast('🛡️','BLOQUÉ !','Le bouclier de '+p.name+' désamorce une bombe cachée !');
      room.log.push('🛡️ '+p.name+' désamorce la bombe de '+(owner?owner.name:'?')+' !');
    } else {
      const amt=Math.min(12,p.coins);
      addCoins(p,-amt); if(owner) addCoins(owner,amt);
      snd('boom');
      fxCast('🧨','PIÉGÉ !!',p.name+' saute sur la bombe de '+(owner?owner.name:'?')+' : −'+amt+' 🪙 !',2800);
      room.log.push('🧨 '+p.name+' saute sur une bombe ! −'+amt+' 🪙 pour '+(owner?owner.name:'?'));
    }
  }
  const t=room.board[p.pos].t;
  const dbl=room.finale&&room.finale.double;
  if(t==='blue'){ const g=dbl?6:3; addCoins(p,g); snd('coin'); logAct(p,'🪙','<b>+'+g+' 🪙</b>',p.name+' gagne +'+g+' 🪙'); }
  else if(t==='red'){
    const l=dbl?6:3;
    if(popShield(p)){ fxCast('🛡️','BLOQUÉ !','Le bouclier de '+p.name+' absorbe la case piège !');
      room.log.push('🛡️ '+p.name+' bloque la case piège !'); }
    else{ addCoins(p,-l); snd('bad'); logAct(p,'💥','<b>−'+l+' 🪙</b>',p.name+' perd −'+l+' 🪙','sad'); }
  }
  else if(t==='lucky'){
    const r=rnd(4);
    if(r===3&&pItems(p).length<2){
      const id=ITEM_IDS[rnd(ITEM_IDS.length)];
      pItems(p).push(id); snd('coin');
      fxCast('🍀','COUP DE CHANCE !',p.name+' trouve '+itemPic(id,54)+' <b>'+ITEMS[id].name+'</b> !');
      room.log.push('🍀 '+p.name+' trouve '+ITEMS[id].e+' '+ITEMS[id].name+' !');
    } else {
      const g=r===2?15:8;
      addCoins(p,g); snd('coin');
      logAct(p,'🍀','<b>+'+g+' 🪙</b> (chance !)','🍀 Case chance ! '+p.name+' gagne +'+g+' 🪙','win');
      if(g===15) fxCast('🍀','JACKPOT CHANCE !','+15 🪙 pour '+p.name+' !');
    }
  }
  else if(t==='duel') await doDuel(p);
  else if(t==='event'){ p.events=(p.events||0)+1; await doEvent(p); }
  else if(t==='bank') await doBank(p);
  else if(t==='chance') await doChance(p);
  else if(t==='bowser') await doBowser(p);
  renderBoard();
}

async function doBank(p){
  const amt=room.bank||0;
  if(amt<=0){
    fxCast('🏦','LA BANQUE…','Le coffre est vide ! Repasse plus tard 😅');
    room.log.push('🏦 '+p.name+' visite une banque vide.');
    return;
  }
  room.bank=0; addCoins(p,amt);
  snd('star');
  fxCast('🏦','JACKPOT !!',p.name+' rafle les '+amt+' 🪙 de la banque !',3000);
  room.log.push('🏦 JACKPOT : '+p.name+' rafle '+amt+' 🪙 !');
  await saveRoom();
}

async function doChance(p){
  snd('duel');
  fxCast('🎰','CHANCE TIME !','La roulette du destin tourne…',1600);
  await sleep(1750);
  const ps=room.players;
  const A=ps[rnd(ps.length)];
  let B=ps[rnd(ps.length)]; while(ps.length>1&&B.id===A.id) B=ps[rnd(ps.length)];
  const r=rnd(6);
  if(r<3){ // 10 pièces
    const amt=Math.min(10,A.coins); A.coins-=amt; addCoins(B,amt);
    fxCast('🎰','CHANCE TIME !',A.name+' donne '+amt+' 🪙 à '+B.name+' !',3000);
    room.log.push('🎰 '+A.name+' donne '+amt+' 🪙 à '+B.name+' !');
  } else if(r<5){ // échange des pièces
    const tmp=A.coins; A.coins=B.coins; B.coins=tmp;
    fxCast('🎰','CHANCE TIME !',A.name+' et '+B.name+' échangent TOUTES leurs 🪙 !',3000);
    room.log.push('🎰 '+A.name+' et '+B.name+' échangent leurs pièces !');
  } else { // une étoile !
    if(A.stars>0){ A.stars--; B.stars++;
      snd('star');
      fxCast('🎰','CHANCE TIME DE FOLIE !!',A.name+' donne une ⭐ à '+B.name+' !!',3400);
      room.log.push('🎰 INCROYABLE : '+A.name+' donne une ⭐ à '+B.name+' !');
    } else {
      const amt=Math.min(15,A.coins); A.coins-=amt; addCoins(B,amt);
      fxCast('🎰','CHANCE TIME !',A.name+' donne '+amt+' 🪙 à '+B.name+' !',3000);
      room.log.push('🎰 '+A.name+' donne '+amt+' 🪙 à '+B.name+' !');
    }
  }
  await saveRoom();
}

async function doBowser(p){
  snd('boo');
  fxCast('👹','LE ROI FANTÔME !','Il te tient… que va-t-il faire ?!',1800);
  await sleep(1950);
  const r=rnd(6);
  if(r===0){
    const amt=Math.min(10,p.coins); addCoins(p,-amt);
    fxCast('👹','TAXE ROYALE !',p.name+' perd '+amt+' 🪙 !',2600);
    room.log.push('👹 Le Roi Fantôme taxe '+amt+' 🪙 à '+p.name+' !');
  } else if(r===1){
    const amt=Math.floor(p.coins/2); addCoins(p,-amt);
    fxCast('👹','PILLAGE !','La moitié des 🪙 de '+p.name+' s\'envole ! (−'+amt+')',2600);
    room.log.push('👹 '+p.name+' perd la moitié de ses pièces ('+amt+') !');
  } else if(r===2){
    const total=room.players.reduce((a,q)=>a+q.coins,0);
    const share=Math.floor(total/room.players.length);
    room.players.forEach(q=>q.coins=share);
    fxCast('👹','RÉVOLUTION !','Toutes les 🪙 sont redistribuées : '+share+' chacun !',3200);
    room.log.push('👹 RÉVOLUTION : tout le monde repart avec '+share+' 🪙 !');
  } else if(r===3){
    if(pItems(p).length>0){
      const it=pItems(p).splice(rnd(pItems(p).length),1)[0];
      fxCast('👹','VOL D\'OBJET !','Le Roi Fantôme croque '+ITEMS[it].e+' '+ITEMS[it].name+' !',2600);
      room.log.push('👹 '+p.name+' perd '+ITEMS[it].e+' '+ITEMS[it].name+' !');
    } else { // pas d'objet à croquer → taxe
      const amt=Math.min(8,p.coins); addCoins(p,-amt);
      fxCast('👹','RIEN À CROQUER ?!','Alors ce sera '+amt+' 🪙 !',2600);
      room.log.push('👹 Le Roi Fantôme taxe '+amt+' 🪙 à '+p.name+' !');
    }
  } else if(r===4){
    room.players.forEach(q=>{ if(q.id!==p.id) addCoins(q,-3); });
    fxCast('👹','COLÈRE ROYALE !','Tous les AUTRES joueurs perdent 3 🪙 !',2600);
    room.log.push('👹 Les autres joueurs perdent 3 🪙 chacun !');
  } else {
    addCoins(p,5);
    fxCast('👹','IL RIGOLE…','Le Roi Fantôme est de bonne humeur : +5 🪙 !',2600);
    room.log.push('👹 Le Roi Fantôme offre 5 🪙 à '+p.name+' !');
  }
  await saveRoom();
}

async function passStar(p){
  const cost=starCost();
  if(p.coins<cost){ room.log.push('⭐ '+p.name+' passe devant l\'étoile… pas assez de 🪙 ('+cost+') !'); return; }
  scrollToPawn();
  const buy=await ask({title:'⭐ UNE ÉTOILE !',text:'Acheter cette étoile pour '+cost+' 🪙 ?',sheet:true,
    options:[{label:'OUI ! ⭐ (−'+cost+' 🪙)',value:1},{label:'Non, j\'économise',value:0,cls:'ghost'}]});
  if(!buy){ room.log.push(p.name+' fait le radin devant l\'étoile 😏'); return; }
  p.coins-=cost; p.stars++;
  snd('star');
  const pawn=document.querySelector('#boardWrap .tok.cur');
  if(pawn){ const r2=pawn.getBoundingClientRect(); starBurst(r2.left+r2.width/2,r2.top+r2.height/2); }
  const others=(room.starSpots||STAR_SPOTS).filter(x=>x!==room.starIdx);
  room.starIdx=others[rnd(others.length)];
  fxCast('🌟','ÉTOILE !',p.name+' achète une ÉTOILE ! Elle réapparaît ailleurs…',2600);
  logAct(p,'🌟','décroche une <b>ÉTOILE</b> !','🌟 '+p.name+' achète une ÉTOILE !','win');
  renderBoard(); await saveRoom();
}

async function passShop(p){
  if(pItems(p).length>=2){ room.log.push('🛍️ '+p.name+' passe à la boutique… sac plein (2 objets max) !'); return; }
  const opts=ITEM_IDS.map(id=>({
    label:'<span style="display:flex;align-items:center;gap:9px;text-align:left;">'+itemPic(id,42)+
      '<span>'+ITEMS[id].name+' — '+ITEMS[id].price+' 🪙<br><span style="font-size:12px;opacity:.75;font-weight:600;">'+ITEMS[id].desc+'</span></span></span>',
    value:id, disabled:p.coins<ITEMS[id].price, cls:'menthe'
  }));
  opts.push({label:'Non merci 👋',value:null,cls:'ghost'});
  scrollToPawn();
  const id=await ask({title:'🛍️ LA BOUTIQUE !',text:p.name+' — tu as '+p.coins+' 🪙 (1 achat max)',sheet:true,options:opts});
  if(!id){ room.log.push('🛍️ '+p.name+' lèche la vitrine de la boutique.'); return; }
  p.coins-=ITEMS[id].price;
  pItems(p).push(id);
  p.itemsBought=(p.itemsBought||0)+1;
  logAct(p,ITEMS[id].e,'achète <b>'+ITEMS[id].name+'</b>','🛍️ '+p.name+' achète '+ITEMS[id].e+' '+ITEMS[id].name+' !');
  renderBoard(); await saveRoom();
}

async function passBoo(p){
  const others=room.players.filter(o=>o.id!==p.id);
  if(!others.length) return;
  const canStar=p.coins>=35&&others.some(o=>o.stars>0);
  scrollToPawn();
  const act=await ask({title:'👻 LE FANTÔME VOLEUR…',text:'Il te propose ses services contre quelques pièces…',sheet:true,
    options:[
      {label:'👻 Voler des 🪙 à un joueur (−5 🪙)',value:'coins',disabled:p.coins<5},
      {label:'💀 Voler une ⭐ ÉTOILE (−35 🪙)',value:'star',cls:'rose',disabled:!canStar},
      {label:'Passer son chemin 😇',value:null,cls:'ghost'}
    ]});
  if(!act){ room.log.push('👻 '+p.name+' ignore le fantôme.'); return; }
  const pool=act==='star'?others.filter(o=>o.stars>0):others.filter(o=>o.coins>0);
  if(!pool.length){ toast('Personne à voler 😅'); return; }
  const tid=await ask({title:'👻 Voler qui ?',sheet:true,
    options:pool.map(o=>({label:pAv(o,22)+' '+o.name+' (🪙'+o.coins+' ⭐'+o.stars+')',value:o.id}))
      .concat([{label:'Annuler',value:null,cls:'ghost'}])});
  if(!tid) return;
  const t=room.players.find(o=>o.id===tid);
  p.coins-=act==='star'?35:5;
  snd('boo');
  if(popShield(t)){
    fxCast('🛡️','RATÉ !','Le bouclier de '+t.name+' repousse le fantôme !');
    room.log.push('🛡️ '+t.name+' bloque le fantôme envoyé par '+p.name+' !');
  } else if(act==='star'){
    t.stars--; p.stars++;
    p.thefts=(p.thefts||0)+1;
    fxCast('💀','VOL D\'ÉTOILE !',p.name+' vole une ⭐ à '+t.name+' !!',3000);
    room.log.push('💀 '+p.name+' vole une ÉTOILE à '+t.name+' !');
  } else {
    const amt=Math.min(4+rnd(6),t.coins);
    t.coins-=amt; addCoins(p,amt);
    fxCast('👻','VOL !',p.name+' vole '+amt+' 🪙 à '+t.name+' !');
    room.log.push('👻 '+p.name+' vole '+amt+' 🪙 à '+t.name+' !');
  }
  renderBoard(); await saveRoom();
}

async function doDuel(p){
  const others=room.players.filter(o=>o.id!==p.id&&o.coins>0);
  if(!others.length){ room.log.push('⚔️ '+p.name+' cherche la bagarre… personne à défier !'); return; }
  scrollToPawn();
  const tid=await ask({title:'⚔️ DUEL !',text:'Défie un joueur : le gagnant du dé rafle 10 🪙 !',sheet:true,
    options:others.map(o=>({label:pAv(o,22)+' '+o.name+' (🪙'+o.coins+')',value:o.id}))});
  const t=room.players.find(o=>o.id===tid);
  snd('duel');
  let a,b; do{ a=1+rnd(6); b=1+rnd(6); }while(a===b);
  const win=a>b?p:t, lose=a>b?t:p;
  const amt=Math.min(10,lose.coins);
  lose.coins-=amt; addCoins(win,amt);
  fxCast('⚔️','DUEL !',p.avatar+' '+a+' 🆚 '+b+' '+t.avatar+'<br>'+win.name+' rafle '+amt+' 🪙 !',3000);
  room.log.push('⚔️ Duel : '+win.name+' bat '+lose.name+' et prend '+amt+' 🪙 !');
  await saveRoom();
}

async function doEvent(p){
  fxCast('🎁','ÉVÉNEMENT !','La case surprise s\'active…',1300);
  await sleep(1450);
  const others=room.players.filter(o=>o.id!==p.id);
  const evs=['gift','trap','swap','rain','tornado','robin','star','comet','wind'];
  if(pItems(p).length<2) evs.push('item');
  const ev=evs[rnd(evs.length)];
  if(ev==='gift'){ addCoins(p,6); fxCast('🎉','CADEAU !','+6 🪙 pour '+p.name+' !'); room.log.push('🎉 Cadeau : +6 🪙 pour '+p.name); }
  else if(ev==='trap'){
    if(popShield(p)){ fxCast('🛡️','BLOQUÉ !','Le bouclier de '+p.name+' absorbe le piège !'); room.log.push('🛡️ '+p.name+' bloque un piège !'); }
    else{ addCoins(p,-6); fxCast('💥','PIÈGE !','−6 🪙 pour '+p.name+' !'); room.log.push('💥 Piège : −6 🪙 pour '+p.name); }
  }
  else if(ev==='swap'&&others.length){
    const o=others[rnd(others.length)];
    const tmp=p.pos; p.pos=o.pos; o.pos=tmp;
    fxCast('🌀','ÉCHANGE !',p.name+' échange sa place avec '+o.name+' !');
    room.log.push('🌀 '+p.name+' échange sa place avec '+o.name+' !');
  }
  else if(ev==='rain'){
    room.players.forEach(o=>addCoins(o,3));
    fxCast('🌠','PLUIE D\'ÉTOILES !','+3 🪙 pour tout le monde !');
    room.log.push('🌠 Pluie d\'étoiles filantes : +3 🪙 pour tous !');
  }
  else if(ev==='tornado'){
    const pos=room.players.map(o=>o.pos).sort(()=>Math.random()-.5);
    room.players.forEach((o,i)=>o.pos=pos[i]);
    fxCast('🌪️','TORNADE !','Tous les joueurs sont mélangés sur le plateau !');
    room.log.push('🌪️ Une tornade mélange tout le monde !');
  }
  else if(ev==='robin'){
    const rich=[...room.players].sort((a,b)=>b.coins-a.coins)[0];
    const poor=[...room.players].sort((a,b)=>a.coins-b.coins)[0];
    if(rich!==poor&&rich.coins>0){
      const amt=Math.min(5,rich.coins); rich.coins-=amt; addCoins(poor,amt);
      fxCast('🎭','ROBIN DES ÉTOILES !',rich.name+' (le plus riche) donne '+amt+' 🪙 à '+poor.name+' !');
      room.log.push('🎭 '+rich.name+' donne '+amt+' 🪙 à '+poor.name+' !');
    }
  }
  else if(ev==='star'){
    const spots=(room.starSpots||STAR_SPOTS).filter(x=>x!==room.starIdx);
    room.starIdx=spots[rnd(spots.length)];
    fxCast('⭐','L\'ÉTOILE S\'ENVOLE !','Elle change de place sur le plateau !');
    room.log.push('⭐ L\'étoile change de place !');
  }
  else if(ev==='comet'){
    const zones=(room.mapMeta&&room.mapMeta.zones)||[];
    const zi=rnd(Math.max(1,zones.length));
    const zname=zones[zi]?zones[zi].name:'la zone';
    let hits=0;
    room.players.forEach(o=>{
      if((room.board[o.pos].z||0)===zi){
        if(popShield(o)){ room.log.push('🛡️ '+o.name+' se protège de la comète !'); }
        else { addCoins(o,-4); hits++; }
      }
    });
    fxCast('☄️','COMÈTE !!','Elle s\'écrase sur '+zname+' : −4 🪙 pour ceux qui y sont !',3000);
    room.log.push('☄️ Comète sur '+zname+' ('+hits+' touché'+(hits>1?'s':'')+') !');
  }
  else if(ev==='wind'){
    room.players.forEach(o=>{ for(let s2=0;s2<2;s2++){ o.pos=room.board[o.pos].next[0]; o.travel=(o.travel||0)+1; } });
    snd('whoosh');
    fxCast('💨','VENT STELLAIRE !','Tout le monde est soufflé 2 cases plus loin !');
    room.log.push('💨 Le vent stellaire pousse tout le monde de 2 cases !');
  }
  else if(ev==='item'){
    const id=ITEM_IDS[rnd(ITEM_IDS.length)];
    pItems(p).push(id);
    fxCast('🎁','OBJET TROUVÉ !',p.name+' reçoit '+itemPic(id,54)+' <b>'+ITEMS[id].name+'</b> !');
    room.log.push('🎁 '+p.name+' trouve '+ITEMS[id].e+' '+ITEMS[id].name+' !');
  }
  renderBoard(); await sleep(1100);
}

function advanceRoundCore(){
  room.round++;
  if(room.round===room.maxRounds-2&&!room.finale) triggerFinale();
  else if(room.round===room.maxRounds) fxCast('🏁','DERNIER TOUR !!','Tout se joue maintenant…',2400);
  else fxCast('🎪','TOUR '+room.round+' !','',1400);
  room.status='board'; room.log.push('Tour '+room.round+' !');
}

async function endTurn(){
  room.turnFx=null;
  if(room.turn===room.players.length-1){
    room.turn=0;
    const wantMg=(room.mgEvery||1)===1||room.round%(room.mgEvery||1)===0;
    if(wantMg){
      room.status='minigame';
      // jamais deux fois le même mini-jeu tant que toute la ludothèque n'a pas tourné
      room.mgUsed=room.mgUsed||[];
      // les jeux 3D ne sortent que si le moteur WebGL a bien démarré chez l'hôte
      const no3D=!(window.MG3D&&MG3D.ok);
      const jouable=i=>!(local&&MG_INFO[i].rt)&&!(no3D&&MG_INFO[i].d3);
      let pool=[];
      for(let i=0;i<MG_COUNT;i++){
        if(!jouable(i)) continue;
        if(room.mgUsed.indexOf(i)>=0) continue;
        pool.push(i);
      }
      if(!pool.length){
        room.mgUsed=[];
        for(let i=0;i<MG_COUNT;i++) if(jouable(i)) pool.push(i);
      }
      const mgType=pool[rnd(pool.length)];
      room.mgUsed.push(mgType);
      let teams=null;
      if(MG_INFO[mgType].team||(room.players.length>=4&&rnd(10)<4)){
        const ids=room.players.map(q=>q.id).sort(()=>Math.random()-.5);
        teams={}; ids.forEach((id,i)=>teams[id]=i<Math.ceil(ids.length/2)?0:1);
        room.log.push('🤝 MINI-JEU EN ÉQUIPES : 🔵 contre 🔴 !');
      }
      // clé unique manche-tour : les scores d'une manche précédente ne peuvent plus
      // être confondus avec ceux-ci (bug de résolution automatique en tournoi)
      room.mg={type:mgType, startedAt:Date.now(), round:(room.manche||1)+'-'+room.round, teams};
      if(MG_INFO[mgType].vs){
        // un contre tous : un joueur tiré au sort affronte tout le monde
        const cands=room.players.filter(p=>!p.gone);
        const solo=cands[rnd(cands.length)]||room.players[0];
        room.mg.vs=true; room.mg.solo=solo.id;
        room.log.push('⚔️ UN CONTRE TOUS : '+solo.name+' affronte tous les autres !');
      }
      room.log.push('🎮 MINI-JEU ! Tout le monde joue sur son téléphone !');
    } else if(room.round>=room.maxRounds){
      animBusy=false;
      await endGame();
      await saveRoom();
      return;
    } else {
      advanceRoundCore(); // pas de mini-jeu ce tour-ci
    }
  } else {
    room.turn++;
  }
  animBusy=false;
  await saveRoom();
}

