/* =================== mini-jeux =================== */
const MG_INFO=[
  {name:'Attrape-Étoiles',desc:'Tape les ⭐ (+10) ! 🌟 en or = +30, évite les ☄️ (-20) ! 12 secondes.'},
  {name:'Tapo-Tapo',desc:'Tape sur le bouton le plus vite possible ! 8 secondes.'},
  {name:'Stop-Réflexe',desc:'Attends le VERT puis tape le plus vite possible. 3 essais.'},
  {name:'Mémo-Éclair',desc:'Mémorise la suite de couleurs et répète-la. Une erreur = fini !'},
  {name:'Calcul-Turbo',desc:'Résous un max de calculs en 20 secondes !'},
  {name:'Couleur Piégée',desc:'Tape la COULEUR DE L\'ENCRE, pas le mot écrit ! 15 secondes.'},
  {name:'Chasse-Taupe',desc:'Tape les taupes 🐹, évite les bombes 💣 ! 12 secondes.'},
  {name:'Stop-Pile',desc:'Arrête le chrono le plus près possible de 5,00 s. 3 essais.'},
  {name:'Flèches Folles',desc:'Tape la bonne direction… sauf si c\'est marqué OPPOSÉ ! 15 secondes.'},
  {name:'Compte-Vite',desc:'Compte les moutons qui apparaissent ! 3 manches.'},
  {name:'Bulles Folles',desc:'Éclate les bulles : les petites rapportent plus ! 12 secondes.'},
  {name:'Jauge Parfaite',desc:'Arrête le curseur dans la zone verte ! 3 essais, ça accélère…'},
  {name:'Pluie de Comètes',desc:'Glisse ton doigt pour piloter 🚀 et esquive les comètes ! Survis 20 s.'},
  {name:'Invasion Cosmique',desc:'Glisse pour bouger, ton vaisseau tire tout seul : dégomme les 🛸 avant qu\'ils atterrissent ! 20 s.'},
  {name:'Tir à l\'Étoile',desc:'Tape pour tirer sur les cibles qui passent ! 12 balles, 15 s, vise bien…'},
  {name:'Sprint Céleste',desc:'Tape GAUCHE puis DROITE en alternant à toute vitesse : 100 m de sprint !'},
  {name:'Panier d\'Étoiles',desc:'Glisse le panier 🧺 : attrape ⭐ et 💎, évite les 💣 ! 15 s.'},
  {name:'Canon Cosmique',desc:'Maintiens pour charger, relâche pour tirer pile sur la cible 🎯 ! 3 tirs.'},
  {name:'Mèche Folle',desc:'Maintiens la bombe 💣 pour gagner des points… mais lâche AVANT l\'explosion ! 3 manches.'},
  {name:'Cerveau d\'Étoiles',desc:'Les chiffres se cachent : tape-les dans l\'ordre croissant ! Ça se corse…'},
  {name:'L\'Intrus',desc:'Trouve l\'emoji différent des autres le plus vite possible ! 8 manches.'},
  {name:'Bonneteau Cosmique',desc:'Suis la coupelle qui cache l\'étoile ⭐… ça mélange de plus en plus vite ! 5 manches.'},
  {name:'Fusée Folle',desc:'Tape pour faire monter la fusée 🚀, passe entre les astéroïdes ! Chaque passage = +10.'},
  {name:'Rythme des Étoiles',desc:'Tape PILE quand le cercle se referme sur l\'étoile ! 10 notes, en rythme…'},
  {name:'Alunissage',desc:'Maintiens pour freiner 🚀 et pose-toi EN DOUCEUR sur la lune ! 3 atterrissages.'},
  {name:'Bataille Spatiale',desc:'BATAILLE EN DIRECT 🔵🔴 : glisse ton doigt pour piloter, ton vaisseau tire tout seul sur l\'ennemi le plus proche ! 30 s.',rt:true,team:true},
  {name:'Course Céleste LIVE',desc:'COURSE EN DIRECT : tape GAUCHE-DROITE en alternance, premier aux 100 m ! Vous vous voyez courir en temps réel.',rt:true},
  {name:'Ruée aux Étoiles',desc:'DUEL EN DIRECT : pilote ton vaisseau et rafle les ⭐ avant les autres ! Évite les 💣. 30 s.',rt:true},
  {name:'Capture d\'Étoile',desc:'ÉQUIPES EN DIRECT 🔵🔴 : attrape l\'étoile au centre et rapporte-la dans TA base ! Touche le porteur adverse pour la faire tomber. 35 s.',rt:true,team:true},
  {name:'Ninja d\'Étoiles',desc:'Tranche les ⭐ et 💎 d\'un coup de doigt comme un ninja, évite les 💣 ! 20 s.'},
  {name:'Gonfle-Ballon',desc:'Tape pour gonfler le ballon, encaisse avec STOP avant qu\'il éclate ! 3 ballons.'},
  {name:'Paires Cosmiques',desc:'Retourne les cartes et retrouve les 6 paires en 30 s !'},
  {name:'Démineur Express',desc:'Retourne les cases (+8 🪙 chacune), encaisse avec STOP… 3 💣 sont cachées !'},
  {name:'Le Tireur Fou',desc:'UN CONTRE TOUS 🎯 : le tireur bombarde l\'arène, les autres esquivent ses tirs ! 30 s.',rt:true,vs:true},
  {name:'Gardien du Trésor',desc:'UN CONTRE TOUS 👹 : volez les étoiles du gardien et filez vers le bas — sans vous faire toucher ! 30 s.',rt:true,vs:true},
  {name:'Dalles Piégées',desc:'EN DIRECT ⬛ : les dalles s\'effondrent une à une — saute de case en case et reste le dernier debout !',rt:true},
  {name:'Sumo des Glaces',desc:'EN DIRECT 🧊 : pousse les autres hors de la banquise… qui rétrécit !',rt:true},
  {name:'Roi de la Colline',desc:'EN DIRECT 👑 : reste SEUL sur la case dorée pour marquer — elle se déplace !',rt:true},
  {name:'Traversée Céleste',desc:'Saute de dalle en dalle entre les comètes (tape à gauche ou à droite de l\'écran) ! 25 s.'},
  {name:'Guerre de Peinture',desc:'EN DIRECT 🎨 : peins un max de dalles en marchant, repasse sur celles des autres ! Les dalles ✨ comptent quadruple. 30 s.',rt:true},
  {name:'La Lave Monte',desc:'EN DIRECT 🌋 : les piliers montent et descendent, la lave engloutit tout ! Grimpe haut pour marquer (1 étage max par saut). 30 s.',rt:true},
  {name:'Château contre Château',desc:'ÉQUIPES EN DIRECT 🏰 : glisse en arrière et lâche (lance-pierre) pour bombarder le château adverse en cloche ! 35 s.',rt:true,team:true},
  {name:'Ruée aux Pièces 3D',desc:'EN 3D 🪙 : ton héros descend dans l\'arène ! Glisse pour le piloter, ramasse les pièces, attrape l\'étoile ✨ et esquive les bombes. 22 s.',d3:true},
  {name:'Sumo Cosmique 3D',desc:'EN 3D & EN DIRECT 🧊 : vos héros s\'affrontent sur la banquise qui rétrécit — prends de l\'élan et éjecte les autres ! 30 s.',rt:true,d3:true},
  {name:'Sprint des Étoiles 3D',desc:'EN 3D & EN DIRECT 🏁 : vos héros courent côte à côte ! Tape GAUCHE-DROITE en alternance, premier aux 100 m.',rt:true,d3:true}
];
const MG_COUNT=MG_INFO.length;
let mgPlayed=false, mgTimerI=null, mgDone=false, mgRoundKey=null;

function renderMg(){
  const info=MG_INFO[room.mg.type];
  $('mgName').textContent=info.name;
  $('mgDesc').textContent=info.desc;
  const T=room.mg.teams, tb=$('mgTeam');
  if(room.mg.vs&&room.mg.solo){
    const soloP=room.players.find(p=>p.id===room.mg.solo);
    tb.style.display='block';
    tb.innerHTML='⚔️ UN CONTRE TOUS : '+(soloP?pAv(soloP,20)+' <b>'+soloP.name+'</b>':'?')+
      (room.mg.solo===me.id?' — C\'EST TOI le solo !':' affronte tout le monde !');
  } else if(T){
    const t0=room.players.filter(p=>T[p.id]===0), t1=room.players.filter(p=>T[p.id]===1);
    tb.style.display='block';
    tb.innerHTML='🤝 ÉQUIPES — meilleure moyenne gagne !<br>🔵 '+t0.map(p=>pAv(p,18)+' '+p.name).join(' · ')+'<br>🔴 '+t1.map(p=>pAv(p,18)+' '+p.name).join(' · ');
  } else tb.style.display='none';
  if(!$('scr-mg').classList.contains('on')){
    // on laisse d'abord le PLATEAU visible un instant : chacun voit la fin du
    // déplacement et l'effet de la case avant que l'écran mini-jeu n'arrive
    const key=(room.mg&&room.mg.round)||'?';
    if(mgRevealKey!==key){
      mgRevealKey=key;
      clearTimeout(mgRevealT);
      if($('scr-board').classList.contains('on')){
        toast('🎮 Mini-jeu dans un instant…');
        mgRevealT=setTimeout(()=>{ if(room&&room.status==='minigame') mgReveal(); },1600);
      } else mgReveal(); // pas de plateau affiché (reprise, spectateur en retard…)
    }
    return;
  }
  if(!local) updateMgStatus();
}
let mgRevealKey=null, mgRevealT=null;
function mgReveal(){
  if(!room||room.status!=='minigame'||$('scr-mg').classList.contains('on')) return;
  snd('fanfare');
  mgPlayed=false; show('scr-mg');
  // roulette de sélection + compte à rebours façon Mario Party
  mgIntro(()=>{
    if(local){ localMg={idx:0,scores:{}}; passPhone(); }
    else {
      startMiniGame();
      setTimeout(()=>{ const go=document.querySelector('#mgArea .big-tap'); if(go) go.click(); },150);
    }
  });
  if(!local) updateMgStatus();
}
function passPhone(){
  const p=room.players[localMg.idx];
  $('mgTimer').textContent=''; $('mgStatus').textContent='Joueur '+(localMg.idx+1)+' / '+room.players.length;
  $('mgArea').innerHTML=`<div class="center">
    <div>${pAv(p,56)}</div>
    <p style="font-weight:800;font-size:20px;margin:6px 0;">Passe le téléphone à<br>${p.name} !</p>
    <button class="btn menthe" id="btnReady" style="max-width:220px;margin:12px auto 0;">Je suis prêt·e !</button>
  </div>`;
  $('btnReady').onclick=()=>startMiniGame();
}
async function updateMgStatus(){
  if(!mgPlayed) return;
  const sc=(room.mgScores&&room.mg&&room.mgScores[room.mg.round])||{};
  const done=room.players.filter(p=>sc[p.id]!==undefined).map(p=>p.name);
  $('mgStatus').textContent='Ont fini : '+done.join(', ')+' ('+done.length+'/'+room.players.length+')';
}

/* roulette qui fait défiler les mini-jeux, puis 3-2-1 */
function mgIntro(cb){
  const area=$('mgArea');
  area.innerHTML='';
  const ov=document.createElement('div');
  ov.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:6;text-align:center;padding:14px;';
  ov.innerHTML=`<div class="hint" style="font-weight:800;letter-spacing:2px;">MINI-JEU</div>
    <div class="titan" id="riName" style="font-size:23px;color:var(--etoile);min-height:60px;display:flex;align-items:center;"></div>
    <div class="titan" id="riCnt" style="font-size:52px;min-height:64px;"></div>`;
  area.appendChild(ov);
  const nameEl=ov.querySelector('#riName'), cnt=ov.querySelector('#riCnt');
  let ticks=0;
  const spin=setInterval(()=>{
    nameEl.textContent=MG_INFO[rnd(MG_COUNT)].name;
    if(ticks%2===0) snd('tick');
    if(++ticks>=22){
      clearInterval(spin);
      nameEl.textContent=MG_INFO[room.mg.type].name;
      snd('star'); vib(20);
      let n=3;
      cnt.textContent=n; cnt.style.color='#FF6B6B';
      const ci=setInterval(()=>{
        n--;
        if(n<=0){
          clearInterval(ci);
          cnt.textContent='GO !'; cnt.style.color='#3EE6C1'; snd('yay');
          setTimeout(()=>{ ov.remove(); cb&&cb(); },350);
        } else {
          snd('tap');
          cnt.textContent=n;
          cnt.style.color=n===2?'#FFD644':'#3EE6C1';
        }
      },650);
    }
  },90);
}
/* fonds d'arène illustrés par famille de mini-jeu */
const ARENA_OK={};
['espace','glace','course','dalles','fete','paint','lava','siege'].forEach(k=>{
  const im=new Image(); im.onload=()=>{ ARENA_OK[k]=1; }; im.src='/art/arena-'+k+'.jpg';
});
const MG_BG=(()=>{
  const m={};
  [0,12,13,14,22,24,25,27,33,38].forEach(i=>m[i]='espace');
  [36].forEach(i=>m[i]='glace');
  [15,26].forEach(i=>m[i]='course');
  [3,19,20,21,30,31,32,34,35,37].forEach(i=>m[i]='dalles');
  m[39]='paint'; m[40]='lava'; m[41]='siege';
  return m;
})();
function startMiniGame(){
  const area=$('mgArea'); area.innerHTML='';
  area.onpointerdown=null; area.onpointermove=null; area.onpointerup=null; area.onpointercancel=null;
  area.style.touchAction='none';
  const fam=MG_BG[room.mg?room.mg.type:-1]||'fete';
  if(ARENA_OK[fam]){
    area.style.backgroundImage=`linear-gradient(rgba(10,6,30,.55),rgba(10,6,30,.66)), url('/art/arena-${fam}.jpg')`;
    area.style.backgroundSize='cover';
    area.style.backgroundPosition='center';
  } else {
    area.style.backgroundImage='';
  }
  window.mgAct=null;
  mgDone=false; mgRoundKey=room.mg?room.mg.round:null;
  clearInterval(mgTimerI); mgTimerI=null;
  $('mgTimer').textContent='';
  const type=room.mg.type;
  const games=[mgStars,mgTapo,mgReflex,mgMemo,mgMath,mgStroop,mgMole,mgStopPile,mgArrows,mgCount,mgBubbles,mgGauge,
    mgComets,mgInvasion,mgSniper,mgSprint,mgCatch,mgCannon,mgFuse,mgChimp,mgOdd,mgShell,mgFlappy,mgRhythm,mgLander,mgBattle,
    mgRaceLive,mgStarRush,mgFlag,mgSlice,mgBalloon,mgPairs,mgMines,
    mgTurret,mgGuard,mgTiles,mgSumo,mgHill,mgFrog,mgPaint,mgLava,mgSiege,
    mgCoins3D,mgSumo3D,mgRun3D];
  (games[type]||mgTapo)(area);
}

async function submitScore(score){
  if(mgDone) return; // garde de ré-entrée : timers/handlers résiduels
  mgDone=true;
  if(local){
    if(!localMg||localMg.idx>=room.players.length) return;
    const p=room.players[localMg.idx];
    localMg.scores[p.id]=score;
    localMg.idx++;
    if(localMg.idx<room.players.length){
      $('mgArea').innerHTML='<div class="center"><div class="mg-score">'+score+' pts</div><p class="hint">Bien joué '+p.name+' !</p></div>';
      setTimeout(passPhone,1400);
    } else {
      await resolveMg(localMg.scores);
    }
    return;
  }
  if(!room.mg||room.mg.round!==mgRoundKey) return; // manche déjà close
  mgPlayed=true;
  snd('yay');
  $('mgArea').innerHTML='<div class="center"><div class="mg-score">'+score+' pts</div><p class="hint">Score envoyé ! En attente des autres joueurs…</p></div>';
  send({t:'score', code:room.code, round:mgRoundKey, playerId:me.id, score});
  updateMgStatus();
}

async function resolveMg(scores){
  const T=room.mg&&room.mg.teams;
  room.mg.bonusNote=null;
  let results;
  if(room.mg&&room.mg.vs&&room.mg.solo){
    // un contre tous : le score du solo affronte la moyenne des autres
    const soloId=room.mg.solo;
    const soloP=room.players.find(p=>p.id===soloId);
    const others=room.players.filter(p=>p.id!==soloId&&!p.gone);
    const soloScore=scores[soloId]??0;
    const avg=others.length?others.reduce((a,p)=>a+(scores[p.id]||0),0)/others.length:0;
    const soloWins=soloScore>avg;
    results=[...room.players].sort((a,b)=>(scores[b.id]??-1)-(scores[a.id]??-1)).map(p=>{
      const isSolo=p.id===soloId;
      const g=isSolo?(soloWins?15:2):(soloWins?2:8);
      const pl=room.players.find(x=>x.id===p.id);
      addCoins(pl,g);
      if((isSolo&&soloWins)||(!isSolo&&!soloWins)) pl.mgWins=(pl.mgWins||0)+1;
      return {id:p.id,name:p.name,avatar:p.avatar,hero:p.hero,skin:p.skin||null,color:p.color,score:scores[p.id]??0,gain:g,solo:isSolo};
    });
    room.mg.vsRes={soloScore:Math.round(soloScore),avg:Math.round(avg),soloWins,
      soloName:soloP?soloP.name:'?',soloHero:soloP&&soloP.hero,soloSkin:soloP&&soloP.skin,soloColor:soloP&&soloP.color,soloAvatar:soloP&&soloP.avatar};
    room.log.push(soloWins?('⚔️ '+(soloP?soloP.name:'?')+' bat tout le monde À LUI TOUT SEUL !')
      :('⚔️ L\'équipe fait tomber '+(soloP?soloP.name:'?')+' !'));
  } else if(T){
    const tot=[0,0], cnt=[0,0];
    room.players.forEach(p=>{ const t=T[p.id]||0; tot[t]+=scores[p.id]||0; cnt[t]++; });
    const avg=[tot[0]/Math.max(1,cnt[0]), tot[1]/Math.max(1,cnt[1])];
    const win=avg[0]===avg[1]?rnd(2):(avg[0]>avg[1]?0:1);
    results=[...room.players].sort((a,b)=>(scores[b.id]??-1)-(scores[a.id]??-1)).map(p=>{
      const t=T[p.id]||0, g=t===win?10:4;
      const pl=room.players.find(x=>x.id===p.id);
      addCoins(pl,g); if(t===win) pl.mgWins=(pl.mgWins||0)+1;
      return {id:p.id,name:p.name,avatar:p.avatar,hero:p.hero,skin:p.skin||null,color:p.color,score:scores[p.id]??0,gain:g,team:t};
    });
    room.mg.teamRes={tot:[Math.round(tot[0]),Math.round(tot[1])],avg:[Math.round(avg[0]),Math.round(avg[1])],win};
    room.log.push('🏅 L\'équipe '+(win===0?'🔵':'🔴')+' gagne le mini-jeu !');
  } else {
    const ranked=[...room.players].sort((a,b)=>(scores[b.id]??-1)-(scores[a.id]??-1));
    const gains=[12,8,5,3,2,1];
    results=ranked.map((p,i)=>{
      const g=(scores[p.id]===undefined)?0:(gains[i]??1);
      const pl=room.players.find(x=>x.id===p.id); addCoins(pl,g);
      return {id:p.id,name:p.name,avatar:p.avatar,hero:p.hero,skin:p.skin||null,color:p.color,score:scores[p.id]??0,gain:g};
    });
    if(results[0]&&results[0].gain>0){
      const wp=room.players.find(x=>x.id===results[0].id);
      wp.mgWins=(wp.mgWins||0)+1;
      if(room.lastWinner===results[0].id){
        addCoins(wp,5); results[0].gain+=5;
        room.mg.bonusNote='🔥 '+results[0].name+' enchaîne les victoires : +5 🪙 de bonus série !';
      }
      room.lastWinner=results[0].id;
    }
    room.log.push('🏅 '+results[0].name+' gagne le mini-jeu !');
  }
  room.mg.results=results;
  room.status='mgres';
  await saveRoom();
}

/* --- mini-jeu 1 : attrape-étoiles --- */
function mgStars(area){
  let score=0, time=12;
  const spd=Math.max(320,560-((room.round||1)*25));
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    area.innerHTML='';
    const spawn=()=>{
      const r=rnd(10);
      const kind=r===0?{e:'🌟',p:30}:r===1?{e:'☄️',p:-20}:{e:'⭐',p:10};
      const s=document.createElement('div'); s.className='mg-star'; s.textContent=kind.e;
      s.style.left=rnd(75)+'%'; s.style.top=rnd(80)+'%';
      s.onpointerdown=()=>{ score+=kind.p; s.remove(); };
      area.appendChild(s);
      setTimeout(()=>s.remove(),1400);
    };
    const spawnI=setInterval(spawn,spd); spawn();
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); clearInterval(spawnI); $('mgTimer').textContent=''; submitScore(Math.max(0,score)); } },1000);
    mgTimerI=tI;
  };
  area.appendChild(btn);
}
/* --- mini-jeu 2 : tapo-tapo --- */
function mgTapo(area){
  let score=0, time=8, started=false;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onpointerdown=()=>{
    if(!started){ started=true; btn.textContent='0';
      const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
        if(time<=0){ clearInterval(tI); $('mgTimer').textContent=''; submitScore(score*5); } },1000);
      mgTimerI=tI;
      return; }
    score++; btn.textContent=score;
  };
  area.appendChild(btn);
}
/* --- mini-jeu 3 : réflexe --- */
function mgReflex(area){
  let trial=0, times=[], goAt=0, state='idle';
  const b=document.createElement('button'); b.className='reflex wait'; b.textContent='Appuie pour commencer';
  const next=()=>{
    state='wait'; b.className='reflex wait'; b.textContent='Attends le vert… ('+(trial+1)+'/3)';
    setTimeout(()=>{ if(state==='wait'){ state='go'; b.className='reflex go'; b.textContent='TAPE !'; goAt=Date.now(); } },1200+rnd(2500));
  };
  b.onpointerdown=()=>{
    if(state==='idle'){ next(); return; }
    if(state==='wait'){ b.textContent='Trop tôt ! 😅 On recommence…'; state='idle'; setTimeout(next,900); return; }
    if(state==='go'){
      const ms=Date.now()-goAt; times.push(ms); trial++;
      if(trial>=3){ const avg=Math.round(times.reduce((a,c)=>a+c,0)/3);
        submitScore(Math.max(10,1000-avg)); }
      else { state='idle'; b.className='reflex wait'; b.textContent=ms+' ms ! Encore…'; setTimeout(next,900); }
    }
  };
  area.appendChild(b);
}
/* --- mini-jeu 4 : mémo-éclair (simon) --- */
function mgMemo(area){
  const COLS=[['#FF5FA2','🌸'],['#FFD644','⭐'],['#3EE6C1','🍀'],['#5AC8FA','💧']];
  let seq=[], input=0, level=0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{ area.innerHTML=buildPads(); startLevel(); };
  area.appendChild(btn);
  function buildPads(){
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:85%;height:85%;">'+
      COLS.map((c,i)=>`<button class="memo-pad" data-i="${i}" style="border:none;border-radius:20px;background:${c[0]};font-size:38px;opacity:.55;transition:opacity .15s,transform .1s;">${c[1]}</button>`).join('')+'</div>';
  }
  function pads(){ return [...area.querySelectorAll('.memo-pad')]; }
  function flash(i,ms=380){ return new Promise(r=>{ const p=pads()[i]; p.style.opacity='1'; p.style.transform='scale(1.05)';
    setTimeout(()=>{ p.style.opacity='.55'; p.style.transform='scale(1)'; setTimeout(r,140); },ms); }); }
  async function startLevel(){
    seq.push(rnd(4)); input=0;
    $('mgTimer').textContent='Niveau '+(level+1);
    pads().forEach(p=>p.onpointerdown=null);
    await sleep(500);
    for(const s of seq) await flash(s);
    pads().forEach(p=>p.onpointerdown=async()=>{
      const i=+p.dataset.i;
      flash(i,150);
      if(i!==seq[input]){ $('mgTimer').textContent=''; submitScore(level*40); return; }
      input++;
      if(input===seq.length){ level++;
        if(level>=8){ $('mgTimer').textContent=''; submitScore(level*40); return; }
        setTimeout(startLevel,600); }
    });
  }
}
/* --- mini-jeu 5 : calcul-turbo --- */
function mgMath(area){
  let score=0, time=20;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); $('mgTimer').textContent=''; submitScore(Math.max(0,score)); } },1000);
    mgTimerI=tI;
    nextQ();
  };
  area.appendChild(btn);
  function nextQ(){
    const a=2+rnd(12), b=2+rnd(12), plus=rnd(2)===0;
    const ans=plus?a+b:Math.max(a,b)-Math.min(a,b);
    const q=plus?`${a} + ${b}`:`${Math.max(a,b)} − ${Math.min(a,b)}`;
    const opts=new Set([ans]);
    while(opts.size<3) opts.add(Math.max(0,ans+(rnd(2)?1:-1)*(1+rnd(4))));
    const arr=[...opts].sort(()=>Math.random()-.5);
    area.innerHTML=`<div style="width:88%;text-align:center;">
      <div class="titan" style="font-size:44px;margin-bottom:18px;">${q} = ?</div>
      <div style="display:flex;gap:10px;">${arr.map(o=>`<button class="btn menthe mq" data-v="${o}" style="margin:0;">${o}</button>`).join('')}</div></div>`;
    area.querySelectorAll('.mq').forEach(b=>b.onpointerdown=()=>{
      if(+b.dataset.v===ans) score+=20; else score-=10;
      nextQ();
    });
  }
}
/* --- mini-jeu 6 : couleur piégée (stroop) --- */
function mgStroop(area){
  const C=[['ROSE','#FF5FA2'],['JAUNE','#FFD644'],['VERT','#3EE6C1'],['BLEU','#5AC8FA']];
  let score=0, time=15;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); $('mgTimer').textContent=''; submitScore(Math.max(0,score)); } },1000);
    mgTimerI=tI;
    nextQ();
  };
  area.appendChild(btn);
  function nextQ(){
    const word=rnd(4); let ink=rnd(4); if(rnd(3)===0) ink=word; // parfois pas piégé
    area.innerHTML=`<div style="width:88%;text-align:center;">
      <div class="titan" style="font-size:46px;color:${C[ink][1]};margin-bottom:18px;">${C[word][0]}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${C.map((c,i)=>`<button class="sq" data-i="${i}" style="border:none;border-radius:16px;padding:16px 0;background:${c[1]};font-family:'Baloo 2';font-weight:800;font-size:16px;color:#1E1440;">${c[0]}</button>`).join('')}
      </div></div>`;
    area.querySelectorAll('.sq').forEach(b=>b.onpointerdown=()=>{
      if(+b.dataset.i===ink) score+=20; else score-=10;
      nextQ();
    });
  }
}
/* --- mini-jeu 7 : chasse-taupe --- */
function mgMole(area){
  let score=0, time=12;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    area.innerHTML='';
    const spawn=()=>{
      const bomb=rnd(4)===0;
      const s=document.createElement('div'); s.className='mg-star'; s.textContent=bomb?'💣':'🐹';
      s.style.left=rnd(75)+'%'; s.style.top=rnd(80)+'%';
      s.onpointerdown=()=>{ score+=bomb?-15:10; s.remove(); };
      area.appendChild(s);
      setTimeout(()=>s.remove(),1100);
    };
    const spawnI=setInterval(spawn,480); spawn();
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); clearInterval(spawnI); $('mgTimer').textContent=''; submitScore(Math.max(0,score)); } },1000);
    mgTimerI=tI;
  };
  area.appendChild(btn);
}
/* --- mini-jeu 8 : stop-pile --- */
function mgStopPile(area){
  let trial=0, total=0, startAt=0, showI=null;
  const b=document.createElement('button'); b.className='reflex wait'; b.textContent='Appuie pour lancer le chrono (essai 1/3)';
  b.style.background='#6B5BD6';
  area.appendChild(b);
  let spDone=false;
  b.onpointerdown=()=>{
    if(spDone) return;
    if(!startAt){
      startAt=Date.now();
      let visible=true;
      showI=setInterval(()=>{
        const el=(Date.now()-startAt)/1000;
        if(el>3.2) visible=false; // le chrono se cache après 3,2 s !
        b.textContent=visible?el.toFixed(2)+' s':'? ? ?';
      },50);
      return;
    }
    clearInterval(showI); showI=null;
    const el=(Date.now()-startAt)/1000;
    const diff=Math.abs(5-el);
    const pts=Math.max(0,Math.round(100-diff*100));
    total+=pts; trial++; startAt=0;
    if(trial>=3){ spDone=true; b.onpointerdown=null; submitScore(total); return; }
    b.textContent=el.toFixed(2)+' s → +'+pts+' pts. Essai '+(trial+1)+'/3 : appuie !';
  };
}
/* --- mini-jeu 9 : flèches folles --- */
function mgArrows(area){
  const DIRS=['⬅️','⬆️','⬇️','➡️'];
  const OPP={0:3,1:2,2:1,3:0};
  let score=0, time=15;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); $('mgTimer').textContent=''; submitScore(Math.max(0,score)); } },1000);
    mgTimerI=tI;
    nextQ();
  };
  area.appendChild(btn);
  function nextQ(){
    const d=rnd(4), inv=rnd(3)===0;
    const target=inv?OPP[d]:d;
    area.innerHTML=`<div style="width:88%;text-align:center;">
      <div style="font-size:60px;">${DIRS[d]}</div>
      <div class="titan" style="font-size:22px;color:${inv?'#FF6B6B':'#3EE6C1'};margin:4px 0 14px;">${inv?'OPPOSÉ !':'PAREIL'}</div>
      <div style="display:flex;gap:8px;justify-content:center;">
        ${DIRS.map((a,i)=>`<button class="ar" data-i="${i}" style="border:none;border-radius:16px;width:60px;height:60px;font-size:28px;background:rgba(255,255,255,.15);">${a}</button>`).join('')}
      </div></div>`;
    area.querySelectorAll('.ar').forEach(b=>b.onpointerdown=()=>{
      if(+b.dataset.i===target) score+=15; else score-=10;
      nextQ();
    });
  }
}
/* --- mini-jeu 10 : compte-vite --- */
function mgCount(area){
  let round=0, score=0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>runRound();
  area.appendChild(btn);
  function runRound(){
    round++;
    const n=5+rnd(8);
    area.innerHTML='';
    $('mgTimer').textContent='Manche '+round+'/3';
    for(let i=0;i<n;i++){
      const s=document.createElement('div'); s.className='mg-star'; s.textContent='🐑';
      s.style.left=(5+rnd(78))+'%'; s.style.top=(5+rnd(80))+'%';
      area.appendChild(s);
    }
    setTimeout(()=>{
      const opts=new Set([n]); while(opts.size<3) opts.add(Math.max(1,n+(rnd(2)?1:-1)*(1+rnd(3))));
      const arr=[...opts].sort(()=>Math.random()-.5);
      area.innerHTML=`<div style="width:88%;text-align:center;">
        <div class="titan" style="font-size:24px;margin-bottom:14px;">Combien de moutons ? 🐑</div>
        <div style="display:flex;gap:10px;">${arr.map(o=>`<button class="btn menthe cq" data-v="${o}" style="margin:0;">${o}</button>`).join('')}</div></div>`;
      area.querySelectorAll('.cq').forEach(b=>b.onpointerdown=()=>{
        const good=+b.dataset.v===n;
        if(good) score+=30;
        if(round>=3){ $('mgTimer').textContent=''; submitScore(score); }
        else{
          area.innerHTML='<div class="center titan" style="font-size:28px;color:'+(good?'#3EE6C1':'#FF6B6B')+';">'+(good?'Exact ! +30':'Raté ! C\'était '+n)+'</div>';
          setTimeout(runRound,1100);
        }
      });
    },2300);
  }
}
/* --- mini-jeu 11 : bulles folles --- */
function mgBubbles(area){
  let score=0, time=12;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    area.innerHTML='';
    const spawn=()=>{
      const size=28+rnd(46);
      const pts=size<40?30:size<58?20:10;
      const b=document.createElement('div');
      b.style.cssText=`position:absolute;width:${size}px;height:${size}px;border-radius:50%;cursor:pointer;
        left:${rnd(82)}%;top:${rnd(80)}%;
        background:radial-gradient(circle at 32% 28%, rgba(255,255,255,.9), rgba(90,200,250,.55) 45%, rgba(90,200,250,.25));
        border:2px solid rgba(255,255,255,.6); animation:pop .25s;`;
      b.onpointerdown=()=>{ score+=pts; b.remove(); };
      area.appendChild(b);
      setTimeout(()=>b.remove(),1500);
    };
    const spawnI=setInterval(spawn,420); spawn(); spawn();
    const tI=setInterval(()=>{ time--; $('mgTimer').textContent=time+'s';
      if(time<=0){ clearInterval(tI); clearInterval(spawnI); $('mgTimer').textContent=''; submitScore(score); } },1000);
    mgTimerI=tI;
  };
  area.appendChild(btn);
}
/* --- mini-jeu 12 : jauge parfaite --- */
function mgGauge(area){
  let trial=0, total=0, pos=0, dir=1, speed=1.5, raf=null, running=false;
  area.innerHTML=`<div style="width:86%;text-align:center;">
    <div class="titan" id="ggMsg" style="font-size:20px;margin-bottom:16px;">Appuie pour lancer, puis appuie pour arrêter dans le VERT !</div>
    <div class="gauge"><div class="cur" id="ggCur"></div></div>
    <div class="titan" id="ggPts" style="font-size:26px;color:var(--menthe);margin-top:14px;min-height:32px;"></div>
  </div>`;
  const cur=area.querySelector('#ggCur'), msg=area.querySelector('#ggMsg'), ptsEl=area.querySelector('#ggPts');
  function frame(){
    pos+=dir*speed;
    if(pos>=100||pos<=0){ dir*=-1; pos=Math.max(0,Math.min(100,pos)); }
    cur.style.left=pos+'%';
    raf=requestAnimationFrame(frame);
  }
  let gDone=false;
  area.onpointerdown=()=>{
    if(gDone) return;
    if(!running){
      running=true; pos=0; dir=1;
      msg.textContent='Essai '+(trial+1)+'/3 — arrête dans le vert !';
      ptsEl.textContent='';
      raf=requestAnimationFrame(frame);
      return;
    }
    cancelAnimationFrame(raf); running=false;
    const d=Math.abs(pos-50);
    const pts=d<=6?40:d<=13?25:d<=22?10:2;
    total+=pts; trial++; speed+=0.8;
    ptsEl.textContent='+'+pts+' pts !';
    if(trial>=3){ gDone=true; area.onpointerdown=null; setTimeout(()=>submitScore(total),800); }
    else msg.textContent='Appuie pour l\'essai '+(trial+1)+'/3 (ça accélère 😈)';
  };
}

/* --- mini-jeu 13 : pluie de comètes (esquive + déplacement) --- */
function mgComets(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    const ship=document.createElement('div'); ship.className='ship'; ship.textContent='🚀';
    let sx=W/2; const sy=H-52;
    ship.style.top=sy+'px'; area.appendChild(ship);
    const mv=e=>{ const r=area.getBoundingClientRect(); sx=Math.max(16,Math.min(W-16,e.clientX-r.left)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    const start=Date.now(); let comets=[], alive=true, raf, spawnT=0, last=start;
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,20-el).toFixed(0)+' s';
      ship.style.left=(sx-17)+'px';
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=Math.max(.16,.5-el*.015);
        const c={x:10+rnd(W-40),y:-30,v:110+el*9+rnd(60),el:document.createElement('div')};
        c.el.className='fall'; c.el.textContent='☄️'; c.el.style.fontSize=(22+rnd(14))+'px';
        area.appendChild(c.el); comets.push(c);
      }
      comets.forEach(c=>{ c.y+=c.v*dt; c.el.style.left=c.x+'px'; c.el.style.top=c.y+'px'; });
      comets=comets.filter(c=>{ if(c.y>H+30){ c.el.remove(); return false; } return true; });
      for(const c of comets){ if(Math.abs(c.x+14-sx)<22&&Math.abs(c.y+14-(sy+16))<22){ alive=false; break; } }
      if(!alive||el>=20){
        cancelAnimationFrame(raf); area.onpointermove=null; area.onpointerdown=null;
        const sc=Math.round(Math.min(20,el)*12)+(el>=20?60:0);
        if(!alive){ ship.textContent='💥'; snd('boom'); }
        $('mgTimer').textContent='';
        setTimeout(()=>submitScore(sc),700);
        return;
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 14 : invasion cosmique (tir auto + déplacement) --- */
function mgInvasion(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    const ship=document.createElement('div'); ship.className='ship'; ship.textContent='🚀';
    let sx=W/2; const sy=H-52;
    ship.style.top=sy+'px'; area.appendChild(ship);
    const mv=e=>{ const r=area.getBoundingClientRect(); sx=Math.max(16,Math.min(W-16,e.clientX-r.left)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let score=0, aliens=[], bullets=[], raf, fireT=0, spawnT=0;
    const start=Date.now(); let last=start;
    function hitFx(x,y,e){ const h=document.createElement('div'); h.className='hitfx'; h.textContent=e;
      h.style.left=x+'px'; h.style.top=y+'px'; area.appendChild(h); setTimeout(()=>h.remove(),320); }
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,20-el).toFixed(0)+' s · '+score+' pts';
      ship.style.left=(sx-17)+'px';
      fireT-=dt;
      if(fireT<=0){ fireT=.34; snd('shot');
        const b={x:sx,y:sy-6,el:document.createElement('div')};
        b.el.className='bullet'; area.appendChild(b.el); bullets.push(b); }
      spawnT-=dt;
      if(spawnT<=0){ spawnT=Math.max(.45,.95-el*.025);
        const a={x:20+rnd(W-56),y:-24,v:34+el*3+rnd(22),el:document.createElement('div')};
        a.el.className='fall'; a.el.textContent='🛸'; a.el.style.fontSize='28px';
        area.appendChild(a.el); aliens.push(a); }
      bullets.forEach(b=>{ b.y-=320*dt; b.el.style.left=(b.x-2)+'px'; b.el.style.top=b.y+'px'; });
      aliens.forEach(a=>{ a.y+=a.v*dt; a.el.style.left=a.x+'px'; a.el.style.top=a.y+'px'; });
      for(const b of bullets){
        for(const a of aliens){
          if(!a.dead&&!b.dead&&Math.abs(a.x+16-b.x)<20&&Math.abs(a.y+14-b.y)<18){
            a.dead=b.dead=true; score+=15; snd('boom'); hitFx(a.x,a.y,'💥');
          }
        }
      }
      aliens=aliens.filter(a=>{
        if(a.dead){ a.el.remove(); return false; }
        if(a.y>H-36){ a.el.remove(); score-=10; snd('bad'); hitFx(a.x,H-46,'⚠️'); return false; }
        return true;
      });
      bullets=bullets.filter(b=>{ if(b.dead||b.y<-16){ b.el.remove(); return false; } return true; });
      if(el>=20){
        cancelAnimationFrame(raf); area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        submitScore(Math.max(0,score)); return;
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 15 : tir à l'étoile (précision) --- */
function mgSniper(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    const am=document.createElement('div'); am.className='ammo'; area.appendChild(am);
    let score=0, ammo=12, targets=[], raf, spawnT=0, done=false;
    const start=Date.now(); let last=start;
    function endGame(){
      if(done) return; done=true;
      cancelAnimationFrame(raf); area.onpointerdown=null;
      $('mgTimer').textContent='';
      setTimeout(()=>submitScore(Math.max(0,score)),400);
    }
    area.onpointerdown=e=>{
      if(ammo<=0||done) return;
      ammo--; snd('shot');
      const r=area.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
      const h=document.createElement('div'); h.className='hitfx'; h.textContent='✛';
      h.style.left=(px-14)+'px'; h.style.top=(py-14)+'px'; h.style.color='#FFD644'; area.appendChild(h);
      setTimeout(()=>h.remove(),250);
      let hit=false;
      for(const t of targets){
        if(!t.dead&&Math.abs(t.x+t.s/2-px)<t.s/2+6&&Math.abs(t.y+t.s/2-py)<t.s/2+6){
          t.dead=hit=true; score+=t.pts; snd('boom');
          const fx=document.createElement('div'); fx.className='hitfx'; fx.textContent='💥+'+t.pts;
          fx.style.left=t.x+'px'; fx.style.top=t.y+'px'; area.appendChild(fx);
          setTimeout(()=>fx.remove(),380); break;
        }
      }
      if(!hit) score-=2;
      if(ammo<=0) setTimeout(endGame,500);
    };
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,15-el).toFixed(0)+' s';
      am.textContent='🔸'.repeat(Math.max(0,ammo))||'—';
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=.75;
        const small=rnd(3)===0, s=small?26:40;
        const dir=rnd(2)?1:-1;
        const t={x:dir>0?-s:W+s, y:24+rnd(H-90), v:dir*(70+el*6+rnd(50))*(small?1.5:1), s, pts:small?30:15,
          el:document.createElement('div')};
        t.el.className='fall'; t.el.textContent=small?'🛸':'🎯'; t.el.style.fontSize=s+'px';
        area.appendChild(t.el); targets.push(t);
      }
      targets.forEach(t=>{ t.x+=t.v*dt; t.el.style.left=t.x+'px'; t.el.style.top=t.y+'px'; });
      targets=targets.filter(t=>{ if(t.dead||t.x<-60||t.x>W+60){ t.el.remove(); return false; } return true; });
      if(el>=15){ endGame(); return; }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 16 : sprint céleste (course tap alterné) --- */
function mgSprint(area){
  area.innerHTML=`<div style="width:92%;">
    <div style="background:rgba(255,255,255,.12);border-radius:12px;height:36px;position:relative;margin-bottom:14px;overflow:hidden;">
      <div id="spFill" style="position:absolute;left:0;top:0;bottom:0;width:0%;background:linear-gradient(90deg,var(--menthe),var(--etoile));border-radius:12px;transition:width .1s;"></div>
      <div id="spRun" style="position:absolute;top:2px;left:0%;font-size:26px;transition:left .1s;">🏃</div>
      <div style="position:absolute;right:6px;top:7px;">🏁</div>
    </div>
    <div class="titan center" id="spMsg" style="font-size:16px;margin-bottom:10px;">Alterne 👟 GAUCHE / DROITE !</div>
    <div style="display:flex;gap:12px;">
      <button class="runbtn" style="background:var(--bleu);" id="spL">👟 GAUCHE</button>
      <button class="runbtn" style="background:var(--rose);" id="spR">👟 DROITE</button>
    </div>
  </div>`;
  let dist=0, lastSide=null, t0=null, ended=false, timerI=null;
  function step(side){
    if(ended) return;
    if(!t0){ t0=Date.now();
      timerI=setInterval(()=>{
        const el=(Date.now()-t0)/1000;
        $('mgTimer').textContent=el.toFixed(1)+' s';
        if(el>=15) finish(false);
      },100);
    }
    if(side===lastSide){ $('spMsg').textContent='Alterne les jambes ! 😅'; return; }
    lastSide=side; dist+=2; snd('step');
    $('spMsg').textContent=dist+' m / 100 m';
    area.querySelector('#spFill').style.width=dist+'%';
    area.querySelector('#spRun').style.left=Math.min(88,dist*.88)+'%';
    if(dist>=100) finish(true);
  }
  function finish(won){
    if(ended) return; ended=true;
    clearInterval(timerI);
    const el=(Date.now()-t0)/1000;
    $('mgTimer').textContent='';
    const sc=won?Math.max(60,Math.round(60+(15-el)*30)):dist*2;
    if(won){ area.querySelector('#spRun').textContent='🎉'; snd('yay'); }
    setTimeout(()=>submitScore(sc),600);
  }
  area.querySelector('#spL').onpointerdown=e=>{ e.preventDefault(); step('L'); };
  area.querySelector('#spR').onpointerdown=e=>{ e.preventDefault(); step('R'); };
}
/* --- mini-jeu 17 : panier d'étoiles (déplacement + collecte) --- */
function mgCatch(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    const basket=document.createElement('div'); basket.className='ship'; basket.textContent='🧺';
    let bx=W/2; const by=H-50;
    basket.style.top=by+'px'; area.appendChild(basket);
    const mv=e=>{ const r=area.getBoundingClientRect(); bx=Math.max(20,Math.min(W-20,e.clientX-r.left)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let score=0, items=[], raf, spawnT=0;
    const start=Date.now(); let last=start;
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,15-el).toFixed(0)+' s · '+score+' pts';
      basket.style.left=(bx-17)+'px';
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=Math.max(.28,.55-el*.015);
        const r=rnd(10);
        const kind=r<5?{e:'⭐',p:10,v:90}:r<7?{e:'💣',p:-20,v:110}:r<9?{e:'🪙',p:15,v:120}:{e:'💎',p:30,v:170};
        const it={x:14+rnd(W-42),y:-24,v:kind.v+el*6+rnd(30),p:kind.p,e:kind.e,el:document.createElement('div')};
        it.el.className='fall'; it.el.textContent=kind.e; it.el.style.fontSize='26px';
        area.appendChild(it.el); items.push(it);
      }
      items.forEach(it=>{ it.y+=it.v*dt; it.el.style.left=it.x+'px'; it.el.style.top=it.y+'px'; });
      items=items.filter(it=>{
        if(it.y>H+26){ it.el.remove(); return false; }
        if(Math.abs(it.x+13-bx)<26&&Math.abs(it.y+13-(by+14))<22){
          score+=it.p; snd(it.p>0?'coin':'boom'); it.el.remove(); return false;
        }
        return true;
      });
      if(el>=15){
        cancelAnimationFrame(raf); area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        submitScore(Math.max(0,score)); return;
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 18 : canon cosmique (charge + timing) --- */
function mgCannon(area){
  let shot=0, total=0, power=0, dir=1, holding=false, raf=null, target=25+rnd(66);
  area.innerHTML=`<div style="width:88%;text-align:center;">
    <div class="titan" id="cnMsg" style="font-size:18px;margin-bottom:14px;">Maintiens pour charger,<br>relâche PILE sur la cible 🎯 !</div>
    <div style="position:relative;height:46px;border-radius:23px;background:rgba(255,255,255,.12);overflow:hidden;">
      <div id="cnFill" style="position:absolute;left:0;top:0;bottom:0;width:0%;background:linear-gradient(90deg,var(--menthe),var(--etoile),var(--rose));"></div>
      <div id="cnTgt" style="position:absolute;top:0;bottom:0;width:4px;background:#fff;box-shadow:0 0 10px #fff;"></div>
      <div id="cnTgtIco" style="position:absolute;top:8px;margin-left:-13px;font-size:24px;">🎯</div>
    </div>
    <div class="titan" id="cnPts" style="font-size:24px;color:var(--menthe);margin-top:14px;min-height:30px;"></div>
    <div style="font-size:44px;margin-top:6px;">🫳💣</div>
  </div>`;
  const fill=area.querySelector('#cnFill'), msg=area.querySelector('#cnMsg'), pts=area.querySelector('#cnPts');
  function setTarget(){ target=25+rnd(66);
    area.querySelector('#cnTgt').style.left=target+'%';
    area.querySelector('#cnTgtIco').style.left=target+'%'; }
  setTarget();
  function frame(){
    power+=dir*2.1;
    if(power>=100||power<=0){ dir*=-1; power=Math.max(0,Math.min(100,power)); }
    fill.style.width=power+'%';
    raf=requestAnimationFrame(frame);
  }
  area.onpointerdown=e=>{
    e.preventDefault();
    if(holding||shot>=3) return;
    holding=true; power=0; dir=1; snd('whoosh');
    msg.textContent='Tir '+(shot+1)+'/3 — relâche sur le 🎯 !';
    raf=requestAnimationFrame(frame);
  };
  area.onpointerup=()=>{
    if(!holding) return;
    holding=false; cancelAnimationFrame(raf);
    const d=Math.abs(power-target);
    const p=d<=4?40:d<=10?25:d<=20?10:2;
    total+=p; shot++;
    snd(p>=25?'star':'shot');
    pts.textContent=(d<=4?'PILE DESSUS ! 💥 ':'')+'+'+p+' pts';
    if(shot>=3){
      area.onpointerdown=null; area.onpointerup=null; area.onpointercancel=null;
      setTimeout(()=>submitScore(total),900);
    }
    else { setTarget(); msg.textContent='Maintiens pour le tir '+(shot+1)+'/3 !'; }
  };
  area.onpointercancel=area.onpointerup;
}
/* --- mini-jeu 19 : mèche folle (push-your-luck) --- */
function mgFuse(area){
  let round=0, total=0, holding=false, boomAt=0, t0=0, raf=null;
  area.innerHTML=`<div style="width:88%;text-align:center;">
    <div class="titan" id="fzMsg" style="font-size:18px;margin-bottom:10px;">Maintiens la bombe :<br>+30 pts/s… lâche avant le BOUM !</div>
    <div id="fzBomb" style="font-size:74px;user-select:none;">💣</div>
    <div class="titan" id="fzPts" style="font-size:26px;color:var(--menthe);min-height:34px;margin-top:8px;"></div>
    <p class="hint">Manche <span id="fzRd">1</span>/3 — total : <span id="fzTot">0</span> pts</p>
  </div>`;
  const bomb=area.querySelector('#fzBomb'), msg=area.querySelector('#fzMsg'), ptsEl=area.querySelector('#fzPts');
  function frame(){
    const held=(Date.now()-t0)/1000;
    ptsEl.textContent='+'+Math.round(held*30)+' pts…';
    bomb.style.transform='scale('+(1+held*.09)+') rotate('+(Math.sin(held*22)*held*3)+'deg)';
    if(held>=boomAt){ // BOUM
      holding=false; cancelAnimationFrame(raf);
      bomb.textContent='💥'; bomb.style.transform='scale(1.35)'; snd('boom');
      ptsEl.textContent='BOUM ! 0 pt cette manche 😵';
      setTimeout(nextRound,1100);
      return;
    }
    if(holding) raf=requestAnimationFrame(frame);
  }
  let fzDone=false;
  function nextRound(){
    if(fzDone) return;
    round++;
    if(round>=3){
      fzDone=true;
      area.onpointerdown=null; area.onpointerup=null; area.onpointercancel=null;
      $('mgTimer').textContent=''; submitScore(total); return;
    }
    bomb.textContent='💣'; bomb.style.transform='none';
    area.querySelector('#fzRd').textContent=round+1;
    ptsEl.textContent='';
    msg.textContent='Manche suivante… tiens bon !';
  }
  area.onpointerdown=e=>{
    e.preventDefault();
    if(fzDone||holding||bomb.textContent==='💥') return;
    holding=true; t0=Date.now(); boomAt=1.5+Math.random()*3;
    snd('whoosh');
    raf=requestAnimationFrame(frame);
  };
  area.onpointerup=()=>{
    if(fzDone||!holding) return;
    holding=false; cancelAnimationFrame(raf);
    const held=(Date.now()-t0)/1000, p=Math.round(held*30);
    total+=p; snd('coin');
    area.querySelector('#fzTot').textContent=total;
    ptsEl.textContent='+'+p+' pts en sécurité ! 😮‍💨';
    bomb.style.transform='none';
    setTimeout(nextRound,900);
  };
  area.onpointercancel=area.onpointerup;
}
/* --- mini-jeu 20 : cerveau d'étoiles (mémoire des nombres) --- */
function mgChimp(area){
  let level=0, score=0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{ snd('tap'); runLevel(); };
  area.appendChild(btn);
  function runLevel(){
    const n=Math.min(3+level,7);
    $('mgTimer').textContent='Niveau '+(level+1);
    const cells=[];
    for(let r=0;r<3;r++) for(let c=0;c<4;c++) cells.push([c,r]);
    cells.sort(()=>Math.random()-.5);
    area.innerHTML='';
    const picked=cells.slice(0,n);
    const pads=picked.map((cell,i)=>{
      const d=document.createElement('button');
      d.style.cssText=`position:absolute;left:${6+cell[0]*24}%;top:${6+cell[1]*32}%;width:20%;height:26%;
        border:none;border-radius:16px;background:rgba(255,255,255,.16);color:#fff;
        font-family:'Titan One';font-size:26px;cursor:pointer;`;
      d.textContent=i+1; d.dataset.v=i+1;
      area.appendChild(d); return d;
    });
    let expect=1, masked=false;
    setTimeout(()=>{
      masked=true;
      pads.forEach(p=>{ p.textContent='⭐'; p.style.background='rgba(142,124,255,.35)'; });
    },1400+level*150);
    pads.forEach(p=>p.onpointerdown=()=>{
      if(!masked) return;
      if(+p.dataset.v===expect){
        snd('tap');
        p.textContent=p.dataset.v; p.style.background='rgba(62,230,193,.4)'; p.onpointerdown=null;
        expect++;
        if(expect>+pads.length){
          score+=n*15; level++; snd('coin');
          if(level>=5){ $('mgTimer').textContent=''; submitScore(score); return; }
          setTimeout(runLevel,700);
        }
      } else {
        snd('bad');
        p.textContent='❌';
        pads.forEach(q=>q.onpointerdown=null); // fige la grille
        $('mgTimer').textContent='';
        setTimeout(()=>submitScore(score),800);
      }
    });
  }
}
/* --- mini-jeu 21 : l'intrus --- */
function mgOdd(area){
  const PAIRS=[['🙂','🙃'],['⭐','🌟'],['🍀','☘️'],['🐵','🙈'],['😀','😃'],['🌸','💮'],['🐶','🐺'],['🟡','🟠'],['🌙','🌛'],['🎈','🪀']];
  let round=0, score=0, t0=0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{ snd('tap'); next(); };
  area.appendChild(btn);
  function next(){
    round++;
    if(round>8){ $('mgTimer').textContent=''; submitScore(score); return; }
    $('mgTimer').textContent='Manche '+round+'/8 · '+score+' pts';
    const pair=PAIRS[rnd(PAIRS.length)];
    const odd=rnd(16);
    area.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:88%;height:88%;">'+
      Array.from({length:16},(_,i)=>
        `<button class="oddc" data-o="${i===odd?1:0}" style="border:none;border-radius:14px;background:rgba(255,255,255,.1);font-size:28px;cursor:pointer;">${i===odd?pair[1]:pair[0]}</button>`).join('')+'</div>';
    t0=Date.now();
    let locked=false;
    area.querySelectorAll('.oddc').forEach(b=>b.onpointerdown=()=>{
      if(locked) return;
      if(b.dataset.o==='1'){
        locked=true;
        const el=(Date.now()-t0)/1000;
        const p=Math.max(8,30-Math.round(el*5));
        score+=p; snd('coin');
        b.style.background='rgba(62,230,193,.5)';
        setTimeout(next,420);
      } else {
        score=Math.max(0,score-5); snd('bad');
        b.style.background='rgba(255,107,107,.5)';
        $('mgTimer').textContent='Manche '+round+'/8 · '+score+' pts';
      }
    });
  }
}
/* --- mini-jeu 22 : bonneteau cosmique --- */
function mgShell(area){
  let round=0, score=0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{ snd('tap'); runRound(); };
  area.appendChild(btn);
  async function runRound(){
    round++;
    $('mgTimer').textContent='Manche '+round+'/5 · '+score+' pts';
    area.innerHTML='<div id="shWrap" style="position:relative;width:88%;height:60%;"></div>'+
      '<div class="titan center" id="shMsg" style="position:absolute;bottom:18px;left:0;right:0;font-size:18px;">Regarde bien…</div>';
    const wrap=area.querySelector('#shWrap'), msg=area.querySelector('#shMsg');
    const slots=[8,38,68]; // % gauche
    let starAt=rnd(3);
    const hats=slots.map((L,i)=>{
      const d=document.createElement('div');
      d.style.cssText=`position:absolute;top:30%;left:${L}%;width:24%;text-align:center;font-size:52px;
        transition:left .28s ease-in-out;cursor:pointer;user-select:none;filter:drop-shadow(0 6px 6px rgba(0,0,0,.4));`;
      d.textContent='🎩'; d.dataset.slot=i;
      wrap.appendChild(d); return d;
    });
    // montre l'étoile
    hats[starAt].textContent='⭐';
    await sleep(1000);
    hats[starAt].textContent='🎩';
    await sleep(350);
    // mélange : on échange des positions
    const pos=[0,1,2]; // pos[i] = slot visuel du chapeau i
    const swaps=3+round*2, spd=Math.max(120,300-round*35);
    hats.forEach(h=>h.style.transition='left '+spd/1000+'s ease-in-out');
    for(let s=0;s<swaps;s++){
      const a=rnd(3); let b=rnd(3); while(b===a) b=rnd(3);
      const tmp=pos[a]; pos[a]=pos[b]; pos[b]=tmp;
      hats[a].style.left=slots[pos[a]]+'%';
      hats[b].style.left=slots[pos[b]]+'%';
      snd('whoosh');
      await sleep(spd+60);
    }
    msg.textContent='Où est l\'étoile ⭐ ?';
    hats.forEach((h,i)=>h.onpointerdown=async()=>{
      hats.forEach(x=>x.onpointerdown=null);
      const good=i===starAt;
      h.textContent=good?'⭐':'💨';
      hats[starAt].textContent='⭐';
      if(good){ score+=30; snd('star'); msg.textContent='Trouvée ! +30 🌟'; }
      else { snd('bad'); msg.textContent='Raté ! Elle était là… 😅'; }
      await sleep(1000);
      if(round>=5){ $('mgTimer').textContent=''; submitScore(score); }
      else runRound();
    });
  }
}

/* --- mini-jeu 23 : fusée folle (flappy) --- */
function mgFlappy(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    const ship=document.createElement('div'); ship.className='ship'; ship.textContent='🚀';
    ship.style.left='46px'; ship.style.transform='rotate(45deg)';
    area.appendChild(ship);
    let y=H/2, vy=0, score=0, walls=[], raf, spawnT=0, dead=false;
    let last=Date.now();
    area.onpointerdown=e=>{ e.preventDefault(); vy=-210; snd('tap'); };
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      vy+=560*dt; y+=vy*dt;
      ship.style.top=(y-16)+'px';
      ship.style.transform='rotate('+(45+Math.max(-25,Math.min(25,vy*.06)))+'deg)';
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=1.55;
        const gap=104, gy=50+rnd(Math.max(30,H-160));
        const mk=(top)=>{ const d=document.createElement('div'); d.className='fall';
          d.style.cssText+=`left:${W}px;font-size:30px;letter-spacing:-6px;white-space:pre;line-height:26px;width:34px;`;
          d.textContent=top?'🪨\n'.repeat(Math.ceil(gy/26)).trim():'🪨\n'.repeat(Math.ceil((H-gy-gap)/26)).trim();
          d.style.top=top?(gy-Math.ceil(gy/26)*26)+'px':(gy+gap)+'px';
          area.appendChild(d); return d; };
        walls.push({x:W, gy, gap, t:mk(true), b:mk(false), passed:false});
      }
      const spd=95+score*.6;
      walls.forEach(w=>{ w.x-=spd*dt; w.t.style.left=w.x+'px'; w.b.style.left=w.x+'px'; });
      walls=walls.filter(w=>{ if(w.x<-40){ w.t.remove(); w.b.remove(); return false; } return true; });
      for(const w of walls){
        if(!w.passed&&w.x+17<46){ w.passed=true; score+=10; snd('coin'); }
        if(Math.abs(w.x+17-63)<26&&(y-14<w.gy||y+14>w.gy+w.gap)) dead=true;
      }
      if(y<8||y>H-8) dead=true;
      $('mgTimer').textContent=score+' pts';
      if(dead){
        cancelAnimationFrame(raf); area.onpointerdown=null;
        ship.textContent='💥'; snd('boom');
        $('mgTimer').textContent='';
        setTimeout(()=>submitScore(score),800);
        return;
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 24 : rythme des étoiles --- */
function mgRhythm(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    let note=0, score=0, ring=null, raf=null, t0=0, dur=0, waiting=false, ended=false;
    area.innerHTML=`<div style="text-align:center;width:100%;position:relative;height:100%;">
      <div id="ryStar" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:54px;">⭐</div>
      <div id="ryRing" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);border:5px solid var(--menthe);border-radius:50%;width:300px;height:300px;opacity:0;"></div>
      <div class="titan" id="ryMsg" style="position:absolute;bottom:14px;left:0;right:0;font-size:18px;"></div>
    </div>`;
    const ringEl=area.querySelector('#ryRing'), msg=area.querySelector('#ryMsg'), star=area.querySelector('#ryStar');
    function launch(){
      note++;
      if(note>10){ ended=true; $('mgTimer').textContent=''; submitScore(score); return; }
      $('mgTimer').textContent='Note '+note+'/10 · '+score+' pts';
      dur=Math.max(650,1350-note*70); t0=Date.now(); waiting=true;
      ringEl.style.opacity='1';
      function anim(){
        if(!waiting) return;
        const k=Math.min(1,(Date.now()-t0)/dur);
        const s=300-k*236;
        ringEl.style.width=s+'px'; ringEl.style.height=s+'px';
        ringEl.style.borderColor=k>.82?'#3EE6C1':k>.6?'#FFD644':'#5AC8FA';
        if(k>=1.18){ }
        if(k>=1){ // trop tard toléré un instant
          if((Date.now()-t0)>dur+180){ waiting=false; ringEl.style.opacity='0'; msg.textContent='Trop tard ! 😅'; snd('bad'); setTimeout(launch,600); return; }
        }
        raf=requestAnimationFrame(anim);
      }
      raf=requestAnimationFrame(anim);
    }
    area.onpointerdown=e=>{
      e.preventDefault();
      if(!waiting||ended) return;
      waiting=false; cancelAnimationFrame(raf); ringEl.style.opacity='0';
      const err=Math.abs((Date.now()-t0)-dur);
      const p=err<=80?30:err<=160?20:err<=280?10:0;
      score+=p;
      star.style.transform='translate(-50%,-50%) scale('+(p>=30?1.5:1.15)+')';
      setTimeout(()=>star.style.transform='translate(-50%,-50%)',180);
      msg.textContent=p>=30?'PARFAIT ! +30 🌟':p>=20?'Bien ! +20':p>=10?'Ouf… +10':'Raté ! +0';
      snd(p>=30?'star':p>0?'coin':'bad');
      setTimeout(launch,650);
    };
    launch();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 25 : alunissage --- */
function mgLander(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML=''; area.style.touchAction='none';
    const H=area.clientHeight;
    let trial=0, total=0;
    area.innerHTML=`<div style="position:relative;width:100%;height:100%;">
      <div id="ldShip" class="ship" style="left:50%;margin-left:-17px;transform:rotate(135deg);">🚀</div>
      <div id="ldFlame" style="position:absolute;left:50%;margin-left:-8px;font-size:18px;opacity:0;">🔥</div>
      <div style="position:absolute;bottom:6px;left:0;right:0;text-align:center;font-size:34px;">🌕🌕🌕🌕🌕🌕🌕</div>
      <div class="titan" id="ldMsg" style="position:absolute;top:8px;left:0;right:0;text-align:center;font-size:15px;">Maintiens = rétrofusées 🔥</div>
      <div class="titan" id="ldV" style="position:absolute;top:30px;right:12px;font-size:16px;color:var(--menthe);"></div>
    </div>`;
    const ship=area.querySelector('#ldShip'), flame=area.querySelector('#ldFlame'),
      msg=area.querySelector('#ldMsg'), vEl=area.querySelector('#ldV');
    let y, vy, thrust=false, raf, last;
    area.onpointerdown=e=>{ e.preventDefault(); thrust=true; };
    area.onpointerup=()=>{ thrust=false; };
    area.onpointercancel=()=>{ thrust=false; };
    function reset(){
      y=20; vy=30+rnd(30); last=Date.now();
      $('mgTimer').textContent='Atterrissage '+(trial+1)+'/3';
      raf=requestAnimationFrame(loop);
    }
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      vy+=(thrust?-150:95)*dt;
      if(vy<-40) vy=-40;
      y+=vy*dt;
      if(y<10){ y=10; vy=Math.max(0,vy); }
      ship.style.top=y+'px';
      flame.style.top=(y-6)+'px';
      flame.style.opacity=thrust?'1':'0';
      if(thrust&&rnd(4)===0) snd('tick');
      vEl.textContent=Math.round(vy)+' km/h';
      vEl.style.color=vy<=32?'#3EE6C1':vy<=60?'#FFD644':'#FF6B6B';
      if(y>=H-74){ // contact
        cancelAnimationFrame(raf);
        const p=vy<=18?50:vy<=32?35:vy<=60?15:0;
        total+=p; trial++;
        if(p===0){ ship.textContent='💥'; snd('boom'); msg.textContent='CRASH ! 0 pt 😵'; }
        else { snd(p>=35?'star':'coin'); msg.textContent=(p>=50?'EN DOUCEUR ! ':'Posé ! ')+'+'+p+' pts'; }
        setTimeout(()=>{
          if(trial>=3){ $('mgTimer').textContent=''; submitScore(total); }
          else { ship.textContent='🚀'; reset(); }
        },1100);
        return;
      }
      raf=requestAnimationFrame(loop);
    }
    reset();
  };
  area.appendChild(btn);
}

/* --- mini-jeu 26 : bataille spatiale (temps réel, équipes, en ligne) --- */
function mgBattle(area){
  const T=(room.mg&&room.mg.teams)||{};
  room.players.forEach((p,i)=>{ if(T[p.id]===undefined) T[p.id]=i%2; });
  const myTeam=T[me.id]||0;
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    // sol de l'arène en losanges iso
    let floor='';
    for(let r=0;r<5;r++) for(let c=0;c<5;c++){
      const fx=W/2+(c-r)*(W/11), fy=40+(c+r)*((H-70)/9);
      floor+=`<polygon points="${fx},${fy-(H-70)/18} ${fx+W/22},${fy} ${fx},${fy+(H-70)/18} ${fx-W/22},${fy}" fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.08)"/>`;
    }
    area.innerHTML=`<svg style="position:absolute;inset:0;width:100%;height:100%;">${floor}</svg>
      <div class="ammo" id="btScore" style="left:50%;transform:translateX(-50%);">🔵 0 — 0 🔴</div>`;
    const scores=[0,0], scoreEl=area.querySelector('#btScore');
    const upScore=()=>scoreEl.textContent='🔵 '+scores[0]+' — '+scores[1]+' 🔴';
    const spawn=t=>({x:t===0?36:W-36, y:44+rnd(Math.max(40,H-100))});
    const ships={};
    room.players.forEach(p=>{
      const t=T[p.id]||0, sp=spawn(t);
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div>${pAv(p,30)}</div>
        <div style="font-size:9px;font-weight:800;color:${t===0?'#5AC8FA':'#FF6B6B'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      ships[p.id]={x:sp.x,y:sp.y,el,team:t,dead:0};
    });
    const mine=ships[me.id]||ships[Object.keys(ships)[0]];
    const mv=e=>{ const r=area.getBoundingClientRect();
      mine.x=Math.max(16,Math.min(W-16,e.clientX-r.left));
      mine.y=Math.max(34,Math.min(H-26,e.clientY-r.top)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let kills=0, over=false, lastSend=0, lastFire=0;
    const start=Date.now();
    function boom(x,y){ const b=document.createElement('div'); b.className='hitfx'; b.textContent='💥';
      b.style.left=(x-15)+'px'; b.style.top=(y-15)+'px'; area.appendChild(b); setTimeout(()=>b.remove(),350); }
    function respawn(id){
      const s=ships[id]; if(!s) return;
      s.dead=Date.now()+1400; s.el.style.opacity='.15';
      const sp=spawn(s.team); s.x=sp.x; s.y=sp.y;
      setTimeout(()=>{ if(!over&&s.el) s.el.style.opacity='1'; },1400);
    }
    function fire(from,tx,ty,cb){
      const b=document.createElement('div'); b.className='bullet';
      b.style.background='linear-gradient(#fff,'+(from.team===0?'#5AC8FA':'#FF6B6B')+')';
      area.appendChild(b);
      const x0=from.x, y0=from.y, t0=Date.now();
      (function anim(){
        if(over){ b.remove(); return; }
        const k=Math.min(1,(Date.now()-t0)/260);
        b.style.left=(x0+(tx-x0)*k)+'px'; b.style.top=(y0+(ty-y0)*k)+'px';
        if(k>=1){ b.remove(); cb(tx,ty); } else requestAnimationFrame(anim);
      })();
    }
    const myAct=d=>{
      if(over) return;
      if(d.k==='pos'&&ships[d.id]&&d.id!==me.id){ ships[d.id].x=d.x*W; ships[d.id].y=d.y*H; }
      else if(d.k==='hit'){
        scores[d.team]=(scores[d.team]||0)+1; upScore();
        const s=ships[d.target];
        if(s){ boom(s.x,s.y); respawn(d.target); }
        if(d.target===me.id) snd('boom');
      }
      else if(d.k==='shot'&&ships[d.from]){
        const s=ships[d.from];
        fire(s,d.x*W,d.y*H,()=>{});
      }
    };
    window.mgAct=myAct;
    function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s · '+kills+' touches';
      for(const id in ships){ const s=ships[id]; s.el.style.left=s.x+'px'; s.el.style.top=(s.y-20)+'px'; }
      if(now-lastSend>110){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      if(now-lastFire>680&&now>(mine.dead||0)){
        let bestId=null, bd=1e18;
        for(const id in ships){ const s=ships[id];
          if(s.team!==myTeam&&now>(s.dead||0)){
            const d2=(s.x-mine.x)*(s.x-mine.x)+(s.y-mine.y)*(s.y-mine.y);
            if(d2<bd){ bd=d2; bestId=id; }
          } }
        if(bestId){
          lastFire=now; snd('shot');
          const tgt=ships[bestId], tx=tgt.x, ty=tgt.y;
          actSend({k:'shot',from:me.id,x:tx/W,y:ty/H});
          fire(mine,tx,ty,(hx,hy)=>{
            if(over) return;
            const s2=ships[bestId];
            if(s2&&Math.abs(s2.x-hx)<30&&Math.abs(s2.y-hy)<30&&Date.now()>(s2.dead||0)){
              kills++; scores[myTeam]++; upScore(); boom(hx,hy); snd('boom');
              actSend({k:'hit',target:bestId,team:myTeam});
              respawn(bestId);
            }
          });
        }
      }
      if(el2>=30){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(kills*10);
        return;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}

/* --- mini-jeu 27 : course céleste LIVE (temps réel, en ligne) --- */
function mgRaceLive(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.style.touchAction='none';
    const others=room.players;
    area.innerHTML=`<div style="width:94%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:10px 0;">
      <div id="rlLanes"></div>
      <div style="display:flex;gap:10px;">
        <button class="runbtn" style="background:var(--bleu);height:88px;" id="rlL">👟 GAUCHE</button>
        <button class="runbtn" style="background:var(--rose);height:88px;" id="rlR">👟 DROITE</button>
      </div>
    </div>`;
    const lanes=area.querySelector('#rlLanes');
    const state={}; // id -> {d, el, done}
    others.forEach(p=>{
      const row=document.createElement('div');
      row.style.cssText='position:relative;height:30px;margin:3px 0;background:rgba(255,255,255,.09);border-radius:10px;overflow:hidden;';
      row.innerHTML=`<div class="rlFill" style="position:absolute;left:0;top:0;bottom:0;width:0%;background:${p.color||'#FFD644'}44;border-radius:10px;transition:width .15s;"></div>
        <div class="rlAv" style="position:absolute;top:2px;left:0%;transition:left .15s;">${pAv(p,24)}</div>
        <div style="position:absolute;right:6px;top:6px;font-size:11px;font-weight:800;opacity:.7;">${p.id===me.id?'TOI':p.name.slice(0,9)}</div>
        <div class="rlFlag" style="position:absolute;right:26px;top:4px;font-size:15px;display:none;">🏁</div>`;
      lanes.appendChild(row);
      state[p.id]={d:0,el:row,done:false};
    });
    let myDist=0, lastSide=null, t0=null, over=false, lastSend=0, finishedCount=0;
    const start=Date.now();
    function paint(id){
      const s=state[id]; if(!s) return;
      s.el.querySelector('.rlFill').style.width=s.d+'%';
      s.el.querySelector('.rlAv').style.left=Math.min(86,s.d*.86)+'%';
      if(s.done) s.el.querySelector('.rlFlag').style.display='block';
    }
    const myAct=d=>{
      if(over) return;
      if(d.k==='rd'&&state[d.id]&&d.id!==me.id){
        state[d.id].d=d.d; if(d.f&&!state[d.id].done){ state[d.id].done=true; finishedCount++; snd('tick'); }
        paint(d.id);
      }
    };
    window.mgAct=myAct;
    function finish(win){
      if(over) return; over=true;
      clearInterval(timerI);
      if(window.mgAct===myAct) window.mgAct=null;
      const el2=t0?(Date.now()-t0)/1000:99;
      // finir la course domine TOUJOURS ne pas la finir ; premier vu = bonus
      const sc=win
        ? 200+Math.max(0,Math.round((30-el2)*8))+(finishedCount===0?60:0)
        : myDist;
      actSend({k:'rd',id:me.id,d:myDist,f:win?1:0});
      $('mgTimer').textContent='';
      if(win){ snd('yay'); state[me.id].done=true; paint(me.id); }
      setTimeout(()=>submitScore(sc),900);
    }
    const timerI=setInterval(()=>{
      const el2=(Date.now()-start)/1000;
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s · '+myDist+' m';
      if(el2>=30) finish(false);
    },200);
    function step(side){
      if(over) return;
      if(!t0) t0=Date.now();
      if(side===lastSide) return;
      lastSide=side; myDist=Math.min(100,myDist+2); snd('step');
      state[me.id].d=myDist; paint(me.id);
      const now=Date.now();
      if(now-lastSend>140||myDist>=100){ lastSend=now; actSend({k:'rd',id:me.id,d:myDist,f:0}); }
      if(myDist>=100) finish(true);
    }
    area.querySelector('#rlL').onpointerdown=e=>{ e.preventDefault(); step('L'); };
    area.querySelector('#rlR').onpointerdown=e=>{ e.preventDefault(); step('R'); };
  };
  area.appendChild(btn);
}
/* --- mini-jeu 28 : ruée aux étoiles (temps réel, en ligne) --- */
function mulberry32(seed){
  let t=seed>>>0;
  return function(){
    t+=0x6D2B79F5;
    let r=Math.imul(t^t>>>15,1|t);
    r^=r+Math.imul(r^r>>>7,61|r);
    return ((r^r>>>14)>>>0)/4294967296;
  };
}
function mgStarRush(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.style.touchAction='none';
    const W=area.clientWidth, H=area.clientHeight;
    area.innerHTML='';
    // spawns identiques sur tous les téléphones (graine = début du mini-jeu)
    const rng=mulberry32(Math.floor((room.mg.startedAt||1)%2147483647));
    const spawns=[]; let ts=900;
    for(let i=0;i<46;i++){
      ts+=430+rng()*330;
      spawns.push({at:ts, x:.06+.88*rng(), y:.14+.72*rng(), bomb:rng()<.22, id:i});
    }
    const ships={}, live={}, taken={};
    room.players.forEach(p=>{
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:46px;margin-left:-23px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div>${pAv(p,28)}</div>
        <div class="srPts" style="font-size:10px;font-weight:800;color:${p.color||'#FFD644'};text-shadow:0 1px 2px #000;">0</div>`;
      area.appendChild(el);
      ships[p.id]={x:W*(.2+.6*Math.random()), y:H*.5, el, score:0, stun:0};
    });
    const mine=ships[me.id]||ships[Object.keys(ships)[0]];
    const mv=e=>{ const r=area.getBoundingClientRect();
      mine.x=Math.max(16,Math.min(W-16,e.clientX-r.left));
      mine.y=Math.max(24,Math.min(H-24,e.clientY-r.top)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let over=false, lastSend=0;
    const localStart=Date.now();
    // horloge commune à tous les téléphones (début du mini-jeu), avec garde anti-dérive
    const start=(()=>{
      const s=room.mg.startedAt||Date.now();
      const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now();
    })();
    function fxAt(x,y,txt,col){
      const h=document.createElement('div'); h.className='hitfx'; h.textContent=txt;
      h.style.left=(x-14)+'px'; h.style.top=(y-14)+'px'; if(col)h.style.color=col;
      area.appendChild(h); setTimeout(()=>h.remove(),380);
    }
    function removeStar(id){ if(live[id]){ live[id].el.remove(); delete live[id]; } taken[id]=1; }
    const myAct=d=>{
      if(over) return;
      if(d.k==='pos'&&ships[d.id]&&d.id!==me.id){
        ships[d.id].x=d.x*W; ships[d.id].y=d.y*H;
        ships[d.id].score=d.s||0;
      }
      else if(d.k==='take'){
        const s=live[d.sid];
        if(s) fxAt(s.x,s.y,d.bomb?'💥':'✨');
        removeStar(d.sid);
      }
    };
    window.mgAct=myAct;
    function loop(){
      const now=Date.now(), el2=now-start;
      $('mgTimer').textContent=Math.max(0,30-el2/1000).toFixed(0)+' s · '+mine.score+' pts';
      // apparitions programmées
      spawns.forEach(sp=>{
        if(!sp.spawned&&el2>=sp.at&&el2<sp.at+2600&&!taken[sp.id]){
          sp.spawned=true;
          const el=document.createElement('div'); el.className='mg-star';
          el.textContent=sp.bomb?'💣':'⭐';
          el.style.left=(sp.x*W-20)+'px'; el.style.top=(sp.y*H-20)+'px';
          el.style.pointerEvents='none';
          area.appendChild(el);
          live[sp.id]={x:sp.x*W, y:sp.y*H, bomb:sp.bomb, el, dieAt:el2+2600};
        }
      });
      for(const id in live){
        if(el2>=live[id].dieAt){ live[id].el.style.opacity='.25'; if(el2>=live[id].dieAt+350) removeStar(id); }
      }
      // collecte
      if(now>mine.stun){
        for(const id in live){
          const s=live[id];
          if(Math.abs(s.x-mine.x)<26&&Math.abs(s.y-mine.y)<26){
            if(s.bomb){ mine.score=Math.max(0,mine.score-15); mine.stun=now+800; snd('boom'); fxAt(s.x,s.y,'💥'); mine.el.style.opacity='.35'; setTimeout(()=>{ if(!over) mine.el.style.opacity='1'; },800); }
            else { mine.score+=10; snd('coin'); fxAt(s.x,s.y,'+10','#3EE6C1'); }
            actSend({k:'take',sid:id,bomb:s.bomb?1:0});
            removeStar(id);
            break;
          }
        }
      }
      // affichage vaisseaux + scores
      for(const id in ships){
        const s=ships[id];
        s.el.style.left=s.x+'px'; s.el.style.top=(s.y-18)+'px';
        s.el.querySelector('.srPts').textContent=s.score;
      }
      if(now-lastSend>120){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H,s:mine.score}); }
      if((el2>=30000&&now-localStart>=8000)||now-localStart>=42000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(mine.score);
        return;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}

/* --- mini-jeu 29 : capture d'étoile (temps réel, équipes, drapeau) --- */
function mgFlag(area){
  const T=(room.mg&&room.mg.teams)||{};
  room.players.forEach((p,i)=>{ if(T[p.id]===undefined) T[p.id]=i%2; });
  const myTeam=T[me.id]||0;
  // capture les événements arrivés avant le GO (rejoués au lancement)
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    area.innerHTML=`
      <div style="position:absolute;left:0;top:0;bottom:0;width:44px;background:linear-gradient(90deg,rgba(90,200,250,.28),transparent);border-right:2px dashed rgba(90,200,250,.5);"></div>
      <div style="position:absolute;right:0;top:0;bottom:0;width:44px;background:linear-gradient(-90deg,rgba(255,107,107,.28),transparent);border-left:2px dashed rgba(255,107,107,.5);"></div>
      <div class="ammo" id="cfScore" style="left:50%;transform:translateX(-50%);">🔵 0 — 0 🔴</div>`;
    const scores=[0,0], scoreEl=area.querySelector('#cfScore');
    const upScore=()=>scoreEl.textContent='🔵 '+scores[0]+' — '+scores[1]+' 🔴';
    const spawn=t=>({x:t===0?30:W-30, y:44+rnd(Math.max(40,H-100))});
    const ships={};
    room.players.forEach(p=>{
      const t=T[p.id]||0, sp=spawn(t);
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:46px;margin-left:-23px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div class="cfAv">${pAv(p,28)}</div>
        <div style="font-size:9px;font-weight:800;color:${t===0?'#5AC8FA':'#FF6B6B'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      ships[p.id]={x:sp.x,y:sp.y,el,team:t,stun:0};
    });
    // le drapeau-étoile
    const flagEl=document.createElement('div');
    flagEl.className='fall'; flagEl.textContent='⭐'; flagEl.style.fontSize='30px';
    area.appendChild(flagEl);
    let flag={x:W/2,y:H/2,carrier:null};
    const mine=ships[me.id]||ships[Object.keys(ships)[0]];
    const mv=e=>{ const r=area.getBoundingClientRect();
      mine.x=Math.max(16,Math.min(W-16,e.clientX-r.left));
      mine.y=Math.max(34,Math.min(H-26,e.clientY-r.top)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let caps=0, tags=0, over=false, lastSend=0;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    function boom(x,y,e2){ const b=document.createElement('div'); b.className='hitfx'; b.textContent=e2||'💥';
      b.style.left=(x-15)+'px'; b.style.top=(y-15)+'px'; area.appendChild(b); setTimeout(()=>b.remove(),380); }
    function resetFlag(){ flag={x:W/2,y:H/2,carrier:null}; }
    const myAct=d=>{
      if(over&&d.k!=='fscore') return; // pendant le sursis de fin, on compte encore les captures
      if(d.k==='pos'&&ships[d.id]&&d.id!==me.id){ ships[d.id].x=d.x*W; ships[d.id].y=d.y*H; }
      else if(d.k==='ftake'){
        // ramassages simultanés : arbitrage déterministe identique sur tous les téléphones
        if(!flag.carrier||flag.carrier===d.id) flag.carrier=d.id;
        else flag.carrier=[flag.carrier,d.id].sort()[0];
        snd('tick');
      }
      else if(d.k==='fscore'){ scores[d.team]=(scores[d.team]||0)+1; upScore(); resetFlag(); snd('coin'); }
      else if(d.k==='fdrop'){
        const bx=flag.x, by=flag.y; // position AVANT le reset
        if(ships[d.id]) ships[d.id].stun=Date.now()+900;
        resetFlag(); boom(bx,by);
      }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,35-el2).toFixed(0)+' s · '+caps+' capture'+(caps>1?'s':'');
      // position du drapeau
      if(flag.carrier&&ships[flag.carrier]){ flag.x=ships[flag.carrier].x; flag.y=ships[flag.carrier].y-26; }
      flagEl.style.left=(flag.x-15)+'px'; flagEl.style.top=(flag.y-15)+'px';
      flagEl.style.filter=flag.carrier?'drop-shadow(0 0 8px #FFD644)':'none';
      for(const id in ships){ const s=ships[id];
        s.el.style.left=s.x+'px'; s.el.style.top=(s.y-18)+'px';
        s.el.style.opacity=now<(s.stun||0)?'.35':'1'; }
      if(now>(mine.stun||0)){
        // ramasser le drapeau libre
        if(!flag.carrier&&Math.abs(flag.x-mine.x)<26&&Math.abs(flag.y-mine.y)<30){
          flag.carrier=me.id; snd('star'); actSend({k:'ftake',id:me.id});
        }
        // marquer dans sa base
        if(flag.carrier===me.id){
          if((myTeam===0&&mine.x<46)||(myTeam===1&&mine.x>W-46)){
            caps++; scores[myTeam]++; upScore(); boom(mine.x,mine.y,'🎉'); snd('coin');
            actSend({k:'fscore',team:myTeam});
            resetFlag();
          }
        }
        // tacler le porteur adverse
        const cid=flag.carrier;
        if(cid&&cid!==me.id&&ships[cid]&&ships[cid].team!==myTeam){
          const s2=ships[cid];
          if(Math.abs(s2.x-mine.x)<26&&Math.abs(s2.y-mine.y)<26&&now>(s2.stun||0)){
            tags++; s2.stun=now+900;
            boom(s2.x,s2.y); snd('boom');
            actSend({k:'fdrop',id:cid});
            resetFlag();
          }
        }
      }
      if(now-lastSend>110){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      // fin : 35 s d'horloge commune, avec 8 s de jeu minimum garanti et 40 s max local
      if((el2>=35&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='…';
        // petit sursis : on compte les toutes dernières captures des autres téléphones
        setTimeout(()=>{
          if(window.mgAct===myAct) window.mgAct=null;
          $('mgTimer').textContent='';
          snd('fanfare');
          // le score d'équipe domine, la contribution personnelle départage
          submitScore(scores[myTeam]*50+caps*5+tags*2);
        },1200);
        return;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 30 : ninja d'étoiles (slice du doigt) --- */
function mgSlice(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap'); area.innerHTML='';
    const W=area.clientWidth, H=area.clientHeight;
    let score=0, items=[], raf, spawnT=0, over=false;
    const start=Date.now(); let last=start;
    let px=-99, py=-99, pActive=false;
    const mv=e=>{ const r=area.getBoundingClientRect(); px=e.clientX-r.left; py=e.clientY-r.top;
      const t=document.createElement('div');
      t.style.cssText=`position:absolute;left:${px-3}px;top:${py-3}px;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.8);pointer-events:none;`;
      area.appendChild(t); setTimeout(()=>t.remove(),160); };
    area.onpointermove=e=>{ if(pActive) mv(e); };
    area.onpointerdown=e=>{ pActive=true; mv(e); };
    area.onpointerup=()=>{ pActive=false; px=py=-99; };
    area.onpointercancel=area.onpointerup;
    function loop(){
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,20-el2).toFixed(0)+' s · '+score+' pts';
      spawnT-=dt;
      if(spawnT<=0){
        spawnT=Math.max(.28,.5-el2*.008);
        const r=rnd(20);
        const kind=r<12?{e:'⭐',p:10}:r<15?{e:'💎',p:25}:{e:'💣',p:-20};
        const fromLeft=rnd(2)===0;
        const it={x:fromLeft?-24:W+24, y:36+rnd(Math.max(30,H-100)),
          vx:(fromLeft?1:-1)*(110+el2*5+rnd(70)), ph:Math.random()*6, ...kind,
          el:document.createElement('div')};
        it.el.className='fall'; it.el.textContent=kind.e; it.el.style.fontSize='30px';
        area.appendChild(it.el); items.push(it);
      }
      items.forEach(it=>{
        it.x+=it.vx*dt; it.ph+=dt*3;
        it.el.style.left=it.x+'px';
        it.el.style.top=(it.y+Math.sin(it.ph)*14)+'px';
      });
      items=items.filter(it=>{
        const iy=it.y+Math.sin(it.ph)*14;
        if(pActive&&Math.abs(it.x+15-px)<26&&Math.abs(iy+15-py)<26){
          score+=it.p; snd(it.p>0?(it.p>10?'star':'coin'):'boom');
          const h=document.createElement('div'); h.className='hitfx';
          h.textContent=it.p>0?'+'+it.p:'💥';
          h.style.left=it.x+'px'; h.style.top=iy+'px';
          h.style.color=it.p>0?'#3EE6C1':'#FF6B6B';
          area.appendChild(h); setTimeout(()=>h.remove(),380);
          it.el.remove(); return false;
        }
        if(it.x<-40||it.x>W+40){ it.el.remove(); return false; }
        return true;
      });
      if(el2>=20){
        over=true;
        area.onpointermove=null; area.onpointerdown=null; area.onpointerup=null;
        $('mgTimer').textContent='';
        submitScore(Math.max(0,score)); return;
      }
      raf=requestAnimationFrame(loop);
    }
    raf=requestAnimationFrame(loop);
  };
  area.appendChild(btn);
}
/* --- mini-jeu 30 : gonfle-ballon (push your luck) --- */
function mgBalloon(area){
  let round=0, total=0, cnt=0, burstAt=0, roundOver=false, done=false;
  area.innerHTML=`<div style="width:88%;text-align:center;">
    <div class="titan" id="blMsg" style="font-size:17px;margin-bottom:6px;">Tape le ballon pour le gonfler…<br>encaisse AVANT qu'il éclate !</div>
    <div id="blB" style="font-size:56px;transition:transform .08s;user-select:none;cursor:pointer;padding:16px;">🎈</div>
    <div class="titan" id="blPts" style="font-size:22px;color:var(--menthe);min-height:28px;">0 pt</div>
    <button class="btn menthe" id="blStop" style="max-width:220px;margin:8px auto 0;">💰 ENCAISSER</button>
    <p class="hint">Ballon <span id="blRd">1</span>/3 — total : <span id="blTot">0</span> pts</p>
  </div>`;
  const B=area.querySelector('#blB'), msg=area.querySelector('#blMsg'),
    ptsEl=area.querySelector('#blPts'), stopB=area.querySelector('#blStop');
  function newRound(){
    round++; cnt=0; roundOver=false;
    burstAt=14+rnd(14);
    area.querySelector('#blRd').textContent=round;
    B.textContent='🎈'; B.style.transform='scale(1)';
    ptsEl.textContent='0 pt';
    msg.innerHTML='Ballon '+round+'/3 : gonfle… et encaisse à temps !';
  }
  function endRound(){
    if(round>=3){ done=true; setTimeout(()=>submitScore(total),900); }
    else setTimeout(newRound,1000);
  }
  B.onpointerdown=e=>{
    e.preventDefault();
    if(roundOver||done) return;
    cnt++; snd('tick');
    if(cnt>=burstAt){
      roundOver=true;
      B.textContent='💥'; snd('boom');
      ptsEl.textContent='ÉCLATÉ ! 0 pt 😵';
      endRound(); return;
    }
    B.style.transform='scale('+(1+cnt*.06)+')';
    ptsEl.textContent=(cnt*3)+' pts…';
  };
  stopB.onclick=()=>{
    if(roundOver||done||cnt===0) return;
    roundOver=true;
    total+=cnt*3; snd('coin');
    area.querySelector('#blTot').textContent=total;
    ptsEl.textContent='+'+(cnt*3)+' pts en poche !';
    endRound();
  };
  newRound();
}
/* --- mini-jeu 31 : paires cosmiques (memory) --- */
function mgPairs(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const EMO=['🚀','⭐','🪐','👾','🌙','☄️'];
    const deck=[...EMO,...EMO].sort(()=>Math.random()-.5);
    let first=null, lock=false, found=0, score=0, done=false;
    area.innerHTML='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:88%;height:86%;">'+
      deck.map((e,i)=>`<button class="pcard2" data-i="${i}" data-e="${e}" style="border:none;border-radius:14px;background:rgba(142,124,255,.3);font-size:26px;cursor:pointer;transition:background .2s;">✦</button>`).join('')+'</div>';
    let time=30;
    const tI=setInterval(()=>{
      time--; $('mgTimer').textContent=time+' s · '+score+' pts';
      if(time<=0){ clearInterval(tI); if(!done){ done=true; $('mgTimer').textContent=''; submitScore(score); } }
    },1000);
    mgTimerI=tI;
    area.querySelectorAll('.pcard2').forEach(b=>b.onpointerdown=()=>{
      if(lock||done||b.dataset.done||b===first) return;
      b.textContent=b.dataset.e; b.style.background='rgba(255,255,255,.25)';
      snd('tap');
      if(!first){ first=b; return; }
      const a=first; first=null;
      if(a.dataset.e===b.dataset.e){
        a.dataset.done=b.dataset.done='1';
        a.style.background=b.style.background='rgba(62,230,193,.4)';
        score+=15; found++; snd('coin');
        $('mgTimer').textContent=time+' s · '+score+' pts';
        if(found>=6&&!done){
          done=true; clearInterval(tI);
          score+=time*2; snd('star');
          $('mgTimer').textContent='';
          setTimeout(()=>submitScore(score),700);
        }
      } else {
        lock=true;
        setTimeout(()=>{
          a.textContent=b.textContent='✦';
          a.style.background=b.style.background='rgba(142,124,255,.3)';
          lock=false;
        },650);
      }
    });
  };
  area.appendChild(btn);
}
/* --- mini-jeu 32 : démineur express (push your luck) --- */
function mgMines(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const bombs=new Set(); while(bombs.size<3) bombs.add(rnd(16));
    let pot=0, done=false;
    area.innerHTML=`<div style="width:88%;text-align:center;">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;">`+
      Array.from({length:16},(_,i)=>`<button class="mcell" data-i="${i}" style="border:none;border-radius:12px;background:rgba(255,255,255,.14);font-size:22px;height:44px;cursor:pointer;">🌑</button>`).join('')+
      `</div>
      <button class="btn menthe" id="mnStop" style="margin-top:10px;">💰 ENCAISSER <span id="mnPot">0</span> pts</button>
    </div>`;
    let time=20;
    const tI=setInterval(()=>{
      time--; $('mgTimer').textContent=time+' s';
      if(time<=0){ clearInterval(tI); if(!done){ done=true; $('mgTimer').textContent=''; submitScore(pot); } }
    },1000);
    mgTimerI=tI;
    area.querySelectorAll('.mcell').forEach(b=>b.onpointerdown=()=>{
      if(done||b.dataset.done) return;
      b.dataset.done='1';
      if(bombs.has(+b.dataset.i)){
        b.textContent='💣'; b.style.background='rgba(255,107,107,.5)';
        snd('boom'); done=true; clearInterval(tI);
        area.querySelectorAll('.mcell').forEach(c=>{ if(bombs.has(+c.dataset.i)) c.textContent='💣'; });
        $('mgTimer').textContent='';
        setTimeout(()=>submitScore(Math.floor(pot/2)),900);
      } else {
        pot+=8; b.textContent='⭐'; b.style.background='rgba(62,230,193,.35)';
        snd('coin');
        area.querySelector('#mnPot').textContent=pot;
      }
    });
    area.querySelector('#mnStop').onclick=()=>{
      if(done) return;
      done=true; clearInterval(tI); snd('star');
      $('mgTimer').textContent='';
      submitScore(pot);
    };
  };
  area.appendChild(btn);
}

/* ---------- petit moteur de sol iso pour les arènes ---------- */
function isoGrid(W,H,cols,rows,top){
  const TW=Math.min(66,(W-24)*2/(cols+rows));
  const TH=TW*.52;
  const cx=W/2;
  const cy=(top||34)+((H-(top||34)-14)-(cols+rows-2)*TH/2)/2;
  const at=(c,r)=>({x:cx+(c-r)*TW/2, y:cy+(c+r)*TH/2});
  let svg='';
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const p=at(c,r);
    svg+=`<polygon id="tl-${c}-${r}" points="${p.x},${p.y-TH/2} ${p.x+TW/2},${p.y} ${p.x},${p.y+TH/2} ${p.x-TW/2},${p.y}"
      fill="rgba(255,255,255,.055)" stroke="rgba(255,255,255,.12)"/>`;
  }
  return {svg,at,TW,TH};
}
/* --- mini-jeu 34 : le tireur fou (1 contre tous, temps réel) --- */
function mgTurret(area){
  const soloId=room.mg&&room.mg.solo, meSolo=soloId===me.id;
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap';
  btn.textContent=meSolo?'🎯 TIRE !':'GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const G=isoGrid(W,H,6,6,46);
    area.innerHTML=`<svg style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>
      <div style="position:absolute;top:6px;left:50%;transform:translateX(-50%);font-size:26px;">🎯</div>
      <div class="ammo" id="ttInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>`;
    const dodgers=room.players.filter(p=>p.id!==soloId);
    const ships={};
    dodgers.forEach((p,i)=>{
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div>${pAv(p,26)}</div><div style="font-size:9px;font-weight:800;color:${p.color||'#FFD644'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      const sp=G.at(1+(i*2)%5, 2+(i%3));
      ships[p.id]={x:sp.x,y:sp.y,el,lives:3,dead:false};
    });
    const mine=meSolo?null:ships[me.id];
    let hits=0, lastShot=0, over=false, deadAt=0;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    function boomAt(x,y){
      const b=document.createElement('div'); b.className='hitfx'; b.textContent='💥';
      b.style.left=(x-15)+'px'; b.style.top=(y-15)+'px'; area.appendChild(b);
      setTimeout(()=>b.remove(),400);
    }
    function aimAt(nx,ny){
      const x=nx*W, y=ny*H;
      const ring=document.createElement('div');
      ring.style.cssText=`position:absolute;left:${x-26}px;top:${y-26}px;width:52px;height:52px;border-radius:50%;
        border:3px dashed #FF6B6B;pointer-events:none;animation:ringp 0.7s;`;
      area.appendChild(ring);
      setTimeout(()=>{
        ring.remove(); boomAt(x,y); snd('boom');
        if(mine&&!mine.dead&&Math.hypot(mine.x-x,mine.y-y)<38){
          mine.lives--;
          mine.el.style.opacity='.35'; setTimeout(()=>{ if(mine&&!mine.dead) mine.el.style.opacity='1'; },700);
          actSend({k:'thit',id:me.id});
          snd('bad');
          if(mine.lives<=0){ mine.dead=true; deadAt=Date.now(); mine.el.style.opacity='.15'; }
        }
      },700);
    }
    if(meSolo){
      area.onpointerdown=e=>{
        const now=Date.now();
        if(now-lastShot<900||over) return;
        lastShot=now;
        const r=area.getBoundingClientRect();
        const nx=(e.clientX-r.left)/W, ny=(e.clientY-r.top)/H;
        snd('shot');
        actSend({k:'aim',x:nx,y:ny});
        aimAt(nx,ny);
      };
    } else {
      const mv=e=>{ if(mine.dead) return; const r=area.getBoundingClientRect();
        mine.x=Math.max(16,Math.min(W-16,e.clientX-r.left));
        mine.y=Math.max(40,Math.min(H-26,e.clientY-r.top)); };
      area.onpointermove=mv; area.onpointerdown=mv;
    }
    const myAct=d=>{
      if(over) return;
      if(d.k==='pos'&&ships[d.id]&&d.id!==me.id){ ships[d.id].x=d.x*W; ships[d.id].y=d.y*H; }
      else if(d.k==='aim'&&!meSolo===false){ aimAt(d.x,d.y); }
      else if(d.k==='aim'){ aimAt(d.x,d.y); }
      else if(d.k==='thit'){ if(meSolo){ hits++; snd('coin'); } if(ships[d.id]){ ships[d.id].lives--; if(ships[d.id].lives<=0){ ships[d.id].dead=true; ships[d.id].el.style.opacity='.15'; } } }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    let lastSend=0;
    (function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s';
      $('ttInfo').textContent=meSolo?('🎯 '+hits+' touche'+(hits>1?'s':'')):('❤️'.repeat(Math.max(0,mine?mine.lives:0))||'💀');
      for(const id in ships){ const s=ships[id]; s.el.style.left=s.x+'px'; s.el.style.top=(s.y-18)+'px'; }
      if(mine&&!mine.dead&&now-lastSend>120){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      if((el2>=30&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        const surv=mine?Math.min(30,((mine.dead?deadAt:now)-localStart)/1000):0;
        submitScore(meSolo?hits*30:Math.round((mine.lives>0?mine.lives*40:0)+surv*2));
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 35 : gardien du trésor (1 contre tous, temps réel) --- */
function mgGuard(area){
  const soloId=room.mg&&room.mg.solo, meSolo=soloId===me.id;
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap';
  btn.textContent=meSolo?'👹 GARDE !':'GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const G=isoGrid(W,H,6,6,40);
    area.innerHTML=`<svg style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>
      <div id="gdPile" style="position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;">
        <div style="font-size:30px;">✨</div><div class="titan" id="gdCnt" style="font-size:16px;color:var(--etoile);">8</div>
      </div>
      <div style="position:absolute;bottom:2px;left:0;right:0;height:26px;background:linear-gradient(0deg,rgba(62,230,193,.3),transparent);pointer-events:none;"></div>
      <div class="ammo" id="gdInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>`;
    const cx=W/2, cy=H*.42;
    let pile=8, stolen=0, tags=0, carrying=false, over=false;
    const ships={};
    room.players.forEach((p,i)=>{
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div class="gAv">${pAv(p,p.id===soloId?32:26)}</div>
        <div class="gStar" style="font-size:13px;height:14px;">${''}</div>
        <div style="font-size:9px;font-weight:800;color:${p.id===soloId?'#FF6B6B':(p.color||'#FFD644')};text-shadow:0 1px 2px #000;">${p.id===soloId?'👹 ':''}${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      const sp=p.id===soloId?{x:cx,y:cy-40}:G.at((i*2)%6,5);
      ships[p.id]={x:sp.x,y:sp.y,el,stun:0,carrying:false};
    });
    const mine=ships[me.id];
    const mv=e=>{ const now=Date.now(); if(now<(mine.stun||0)) return;
      const r=area.getBoundingClientRect();
      mine.x=Math.max(16,Math.min(W-16,e.clientX-r.left));
      mine.y=Math.max(36,Math.min(H-14,e.clientY-r.top)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    function setPile(n){ pile=Math.max(0,n); $('gdCnt').textContent=pile; }
    const myAct=d=>{
      if(over&&d.k!=='gout') return;
      if(d.k==='pos'&&ships[d.id]&&d.id!==me.id){ ships[d.id].x=d.x*W; ships[d.id].y=d.y*H; }
      else if(d.k==='gtake'){ setPile(pile-1); if(ships[d.id]){ ships[d.id].carrying=true; ships[d.id].el.querySelector('.gStar').textContent='⭐'; } snd('tick'); }
      else if(d.k==='gout'){ if(ships[d.id]){ ships[d.id].carrying=false; ships[d.id].el.querySelector('.gStar').textContent=''; } snd('coin'); }
      else if(d.k==='gtag'){
        if(ships[d.id]){ ships[d.id].stun=Date.now()+1500; ships[d.id].el.style.opacity='.4';
          setTimeout(()=>{ if(ships[d.id]) ships[d.id].el.style.opacity='1'; },1500); }
        if(d.id===me.id){ snd('bad');
          if(carrying){ carrying=false; mine.carrying=false; mine.el.querySelector('.gStar').textContent=''; actSend({k:'gdrop'}); setPile(pile+1); }
        }
      }
      else if(d.k==='gdrop'){ setPile(pile+1); const s=ships[d.id]; if(s){ s.carrying=false; s.el.querySelector('.gStar').textContent=''; } }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    let lastSend=0;
    (function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s';
      $('gdInfo').textContent=meSolo?('👹 '+tags+' touches · '+pile+' ✨ au trésor'):('⭐ volées : '+stolen+(carrying?' (+1 en main !)':''));
      for(const id in ships){ const s=ships[id]; s.el.style.left=s.x+'px'; s.el.style.top=(s.y-20)+'px'; }
      if(now>(mine.stun||0)){
        if(!meSolo){
          // ramasser au tas
          if(!carrying&&pile>0&&Math.hypot(mine.x-cx,mine.y-cy)<34){
            carrying=true; mine.carrying=true; mine.el.querySelector('.gStar').textContent='⭐';
            setPile(pile-1); snd('tick'); actSend({k:'gtake',id:me.id});
          }
          // sortir en bas
          if(carrying&&mine.y>H-30){
            carrying=false; stolen++; mine.carrying=false; mine.el.querySelector('.gStar').textContent='';
            snd('coin'); actSend({k:'gout',id:me.id});
          }
        } else {
          // taguer un voleur
          for(const id in ships){
            if(id===soloId.toString()||id===soloId) continue;
            const s=ships[id];
            if(now>(s.stun||0)&&Math.hypot(s.x-mine.x,s.y-mine.y)<28){
              tags++; s.stun=now+1500; s.el.style.opacity='.4';
              setTimeout(()=>{ if(s.el) s.el.style.opacity='1'; },1500);
              snd('boom'); actSend({k:'gtag',id});
            }
          }
        }
      }
      if(now-lastSend>120){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      if((el2>=30&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(meSolo?tags*20+pile*8:stolen*35);
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 36 : dalles piégées (survie iso, temps réel) --- */
function mgTiles(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const COLS=5, ROWS=5;
    const G=isoGrid(W,H,COLS,ROWS,40);
    area.innerHTML=`<svg id="tlSvg" style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>`;
    const svg=area.querySelector('#tlSvg');
    const rng=mulberry32(Math.floor((room.mg.startedAt||1)%2147483647));
    // ordre de chute des dalles, identique sur tous les téléphones
    const order=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) order.push({c,r});
    for(let i=order.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=order[i]; order[i]=order[j]; order[j]=t; }
    const alive={}; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) alive[c+'-'+r]=true;
    const spawns=[[0,0],[COLS-1,ROWS-1],[0,ROWS-1],[COLS-1,0],[2,2],[2,0]];
    const heroes={};
    room.players.forEach((p,i)=>{
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;transition:left .22s,top .22s,opacity .3s;';
      el.innerHTML=`<div>${pAv(p,26)}</div><div style="font-size:9px;font-weight:800;color:${p.color||'#FFD644'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      heroes[p.id]={c:spawns[i%spawns.length][0], r:spawns[i%spawns.length][1], el, out:false};
    });
    const mine=heroes[me.id];
    let over=false, myOut=false, outCount=0, fallIdx=0;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    // planning des chutes : t croissant, cadence qui accélère
    const falls=[]; let ft=3000;
    order.forEach(o=>{ falls.push({...o,at:ft,flash:ft-1100}); ft+=Math.max(800,2200-falls.length*60); });
    area.onpointerdown=e=>{
      if(over||myOut) return;
      const r2=area.getBoundingClientRect();
      const px=e.clientX-r2.left, py=e.clientY-r2.top;
      let best=null,bd=1e9;
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
        const p=G.at(c,r);
        const d2=Math.hypot(p.x-px,p.y-py);
        if(d2<bd){ bd=d2; best={c,r}; }
      }
      if(!best||bd>46) return;
      const dc=Math.abs(best.c-mine.c), dr=Math.abs(best.r-mine.r);
      if(dc+dr!==1) return;                       // une case adjacente à la fois
      if(!alive[best.c+'-'+best.r]) return;       // pas de saut dans le vide
      mine.c=best.c; mine.r=best.r; snd('step');
      actSend({k:'pos',id:me.id,c:mine.c,r:mine.r});
    };
    function fallOut(id){
      const h2=heroes[id]; if(!h2||h2.out) return;
      h2.out=true; outCount++;
      h2.el.style.opacity='.12';
      if(id===me.id){ snd('boom'); }
    }
    const myAct=d=>{
      if(d.k==='pos'&&heroes[d.id]&&d.id!==me.id){ heroes[d.id].c=d.c; heroes[d.id].r=d.r; }
      else if(d.k==='out') fallOut(d.id);
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    function endMe(win){
      if(over) return; over=true;
      if(window.mgAct===myAct) window.mgAct=null;
      area.onpointerdown=null;
      $('mgTimer').textContent='';
      snd(win?'yay':'bad');
      const surv=(Date.now()-localStart)/1000;
      submitScore(Math.round(Math.min(40,surv)*10)+(win?80:0));
    }
    (function loop(){
      if(over) return;
      const now=Date.now(), el2=now-start;
      $('mgTimer').textContent=Math.max(0,40-el2/1000).toFixed(0)+' s · '+(myOut?'💀':'reste dessus !');
      // chutes programmées
      while(fallIdx<falls.length&&el2>=falls[fallIdx].flash){
        const f=falls[fallIdx];
        const tile=svg.querySelector('#tl-'+f.c+'-'+f.r);
        if(el2>=f.at){
          if(alive[f.c+'-'+f.r]){
            alive[f.c+'-'+f.r]=false;
            if(tile) tile.style.display='none';
            snd('whoosh');
          }
          fallIdx++;
        } else {
          if(tile&&alive[f.c+'-'+f.r]) tile.style.fill='rgba(255,107,107,.55)';
          break;
        }
      }
      // je tombe ?
      if(!myOut&&!alive[mine.c+'-'+mine.r]){
        myOut=true; fallOut(me.id); actSend({k:'out',id:me.id});
      }
      // placement
      for(const id in heroes){ const h2=heroes[id]; const p=G.at(h2.c,h2.r);
        h2.el.style.left=p.x+'px'; h2.el.style.top=(p.y-26)+'px'; }
      const survivors=room.players.length-outCount;
      if(!myOut&&survivors<=1){ endMe(true); return; }
      if(myOut&&Date.now()-localStart>800){ endMe(false); return; }
      if(el2>=40000||now-localStart>=48000){ endMe(!myOut); return; }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 37 : sumo des glaces (temps réel) --- */
function mgSumo(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const cx=W/2, cy=H*.52, R0=Math.min(W,H)*.42;
    area.innerHTML=`<svg style="position:absolute;inset:0;width:100%;height:100%;">
      <ellipse id="smIce" cx="${cx}" cy="${cy}" rx="${R0}" ry="${R0*.62}" fill="rgba(159,247,255,.14)" stroke="rgba(159,247,255,.5)" stroke-width="3"/>
    </svg>`;
    const ice=area.querySelector('#smIce');
    const heroes={};
    room.players.forEach((p,i)=>{
      const a=i*2*Math.PI/room.players.length;
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;transition:opacity .3s;';
      el.innerHTML=`<div>${pAv(p,26)}</div><div style="font-size:9px;font-weight:800;color:${p.color||'#FFD644'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      heroes[p.id]={x:cx+Math.cos(a)*R0*.6, y:cy+Math.sin(a)*R0*.37, vx:0, vy:0, el, out:false};
    });
    const mine=heroes[me.id];
    let tx=mine.x, ty=mine.y, over=false, myOut=false, outCount=0;
    const mv=e=>{ const r2=area.getBoundingClientRect(); tx=e.clientX-r2.left; ty=e.clientY-r2.top; };
    area.onpointermove=mv; area.onpointerdown=mv;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    function fallOut(id){
      const h2=heroes[id]; if(!h2||h2.out) return;
      h2.out=true; outCount++; h2.el.style.opacity='.12';
    }
    const myAct=d=>{
      if(d.k==='pos'&&heroes[d.id]&&d.id!==me.id){ heroes[d.id].x=d.x*W; heroes[d.id].y=d.y*H; }
      else if(d.k==='out') fallOut(d.id);
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    function endMe(win){
      if(over) return; over=true;
      if(window.mgAct===myAct) window.mgAct=null;
      area.onpointermove=null; area.onpointerdown=null;
      $('mgTimer').textContent='';
      snd(win?'yay':'bad');
      const surv=(Date.now()-localStart)/1000;
      submitScore(Math.round(Math.min(35,surv)*12)+(win?60:0));
    }
    let lastSend=0, last=Date.now();
    (function loop(){
      if(over) return;
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el2=(now-start)/1000;
      const R=R0*Math.max(.34,1-el2/55);
      ice.setAttribute('rx',R); ice.setAttribute('ry',R*.62);
      $('mgTimer').textContent=Math.max(0,35-el2).toFixed(0)+' s'+(myOut?' · 💀':'');
      if(!myOut){
        mine.vx+=(tx-mine.x)*4*dt; mine.vy+=(ty-mine.y)*4*dt;
        mine.vx*=.9; mine.vy*=.9;
        mine.x+=mine.vx; mine.y+=mine.vy;
        // poussées : je m'écarte de ceux qui me chevauchent
        for(const id in heroes){
          if(id===me.id) continue;
          const o=heroes[id]; if(o.out) continue;
          const dx=mine.x-o.x, dy=mine.y-o.y, d2=Math.hypot(dx,dy);
          if(d2>0&&d2<30){ const push=(30-d2)*.55; mine.x+=dx/d2*push; mine.y+=dy/d2*push; snd('tick'); }
        }
        // dehors ?
        const ex=(mine.x-cx)/R, ey=(mine.y-cy)/(R*.62);
        if(ex*ex+ey*ey>1){ myOut=true; fallOut(me.id); actSend({k:'out',id:me.id}); snd('boom'); }
      }
      for(const id in heroes){ const h2=heroes[id]; h2.el.style.left=h2.x+'px'; h2.el.style.top=(h2.y-20)+'px'; }
      if(now-lastSend>110&&!myOut){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      const survivors=room.players.length-outCount;
      if(!myOut&&survivors<=1){ endMe(true); return; }
      if(myOut&&now-localStart>800){ endMe(false); return; }
      if((el2>=35&&now-localStart>=8000)||now-localStart>=45000){ endMe(!myOut); return; }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 38 : roi de la colline (temps réel) --- */
function mgHill(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const COLS=5, ROWS=5;
    const G=isoGrid(W,H,COLS,ROWS,40);
    area.innerHTML=`<svg id="hlSvg" style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>
      <div class="ammo" id="hlInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>`;
    const svg=area.querySelector('#hlSvg');
    const rng=mulberry32(Math.floor((room.mg.startedAt||1)%2147483647));
    // la case dorée se déplace toutes les 5 s, pareil chez tout le monde
    const hills=[]; for(let i=0;i<9;i++) hills.push({c:Math.floor(rng()*COLS), r:Math.floor(rng()*ROWS)});
    const heroes={};
    room.players.forEach((p,i)=>{
      const a=i*2*Math.PI/room.players.length;
      const el=document.createElement('div');
      el.style.cssText='position:absolute;text-align:center;width:44px;margin-left:-22px;pointer-events:none;';
      el.innerHTML=`<div>${pAv(p,26)}</div><div style="font-size:9px;font-weight:800;color:${p.color||'#FFD644'};text-shadow:0 1px 2px #000;">${p.name.slice(0,8)}</div>`;
      area.appendChild(el);
      heroes[p.id]={x:W/2+Math.cos(a)*W*.3, y:H*.5+Math.sin(a)*H*.24, el};
    });
    const mine=heroes[me.id];
    const mv=e=>{ const r2=area.getBoundingClientRect();
      mine.x=Math.max(16,Math.min(W-16,e.clientX-r2.left));
      mine.y=Math.max(40,Math.min(H-16,e.clientY-r2.top)); };
    area.onpointermove=mv; area.onpointerdown=mv;
    let score=0, over=false, curHill=-1, lastSend=0, last=Date.now();
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    const myAct=d=>{
      if(d.k==='pos'&&heroes[d.id]&&d.id!==me.id){ heroes[d.id].x=d.x*W; heroes[d.id].y=d.y*H; }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    (function loop(){
      if(over) return;
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el2=(now-start)/1000;
      const hi=Math.min(hills.length-1,Math.floor(el2/5));
      if(hi!==curHill){
        if(curHill>=0){ const o=svg.querySelector('#tl-'+hills[curHill].c+'-'+hills[curHill].r); if(o) o.style.fill='rgba(255,255,255,.055)'; }
        curHill=hi; snd('tick');
        const t=svg.querySelector('#tl-'+hills[hi].c+'-'+hills[hi].r);
        if(t) t.style.fill='rgba(255,214,68,.55)';
      }
      const hp=G.at(hills[hi].c,hills[hi].r);
      const meOn=Math.hypot(mine.x-hp.x,mine.y-hp.y)<30;
      let othersOn=0;
      for(const id in heroes){ if(id!==me.id&&Math.hypot(heroes[id].x-hp.x,heroes[id].y-hp.y)<30) othersOn++; }
      if(meOn&&othersOn===0){ score+=dt*8; }
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s · '+Math.round(score)+' pts';
      $('hlInfo').textContent=meOn?(othersOn?'⚔️ case contestée !':'👑 tu marques !'):'👑 file sur la case dorée !';
      for(const id in heroes){ const h2=heroes[id]; h2.el.style.left=h2.x+'px'; h2.el.style.top=(h2.y-20)+'px'; }
      if(now-lastSend>120){ lastSend=now; actSend({k:'pos',id:me.id,x:mine.x/W,y:mine.y/H}); }
      if((el2>=30&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointermove=null; area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(Math.round(score));
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 39 : traversée céleste (frogger iso, solo) --- */
function mgFrog(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const COLS=7, ROWS=8;
    const G=isoGrid(W,H,COLS,ROWS,30);
    area.innerHTML=`<svg style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>
      <div style="position:absolute;bottom:4px;left:8px;font-size:12px;font-weight:800;opacity:.6;">◀️ tape à gauche</div>
      <div style="position:absolute;bottom:4px;right:8px;font-size:12px;font-weight:800;opacity:.6;">tape à droite ▶️</div>`;
    const hero=document.createElement('div');
    hero.style.cssText='position:absolute;text-align:center;width:40px;margin-left:-20px;pointer-events:none;transition:left .16s,top .16s;';
    hero.innerHTML=pAv(room.players.find(p=>p.id===me.id)||room.players[0],26);
    area.appendChild(hero);
    let c=3, r=ROWS-1, cross=0, best=0, score=0, over=false, flash=0;
    // comètes : une par rangée intérieure, vitesse et sens alternés
    const lanes=[];
    for(let lr=1;lr<ROWS-1;lr++) lanes.push({r:lr, fc:rnd(COLS), v:(lr%2?1:-1)*(0.9+lr*0.14+Math.random()*.4), el:null});
    lanes.forEach(l=>{
      l.el=document.createElement('div'); l.el.className='fall'; l.el.textContent='☄️';
      l.el.style.fontSize='24px'; area.appendChild(l.el);
    });
    area.onpointerdown=e=>{
      if(over||Date.now()<flash) return;
      if(r-1<0) return;
      const r2=area.getBoundingClientRect();
      const leftSide=(e.clientX-r2.left)<W/2;
      r=r-1;
      c=leftSide?Math.max(0,c-1):Math.min(COLS-1,c+1);
      snd('step');
      if(r===0){ cross++; score+=40; snd('star');
        const fx=document.createElement('div'); fx.className='hitfx'; fx.textContent='🎉+40';
        const p=G.at(c,0); fx.style.left=p.x+'px'; fx.style.top=(p.y-20)+'px';
        area.appendChild(fx); setTimeout(()=>fx.remove(),500);
        r=ROWS-1; c=3;
        lanes.forEach(l=>l.v*=1.13); // ça accélère !
      }
      best=Math.max(best,ROWS-1-r);
    };
    const startT=Date.now(); let last=startT;
    (function loop(){
      if(over) return;
      const now=Date.now(), dt=Math.min(.05,(now-last)/1000); last=now;
      const el2=(now-startT)/1000;
      $('mgTimer').textContent=Math.max(0,25-el2).toFixed(0)+' s · '+score+' pts';
      lanes.forEach(l=>{
        l.fc+=l.v*dt;
        if(l.fc>COLS+1) l.fc=-1;
        if(l.fc<-1) l.fc=COLS+1;
        const p=G.at(Math.max(-1,Math.min(COLS,l.fc)),l.r);
        l.el.style.left=(p.x-12)+'px'; l.el.style.top=(p.y-14)+'px';
        // collision
        if(now>=flash&&l.r===r&&Math.abs(l.fc-c)<.55){
          snd('boom'); flash=now+900;
          hero.style.opacity='.35'; setTimeout(()=>hero.style.opacity='1',900);
          r=ROWS-1; c=3; // retour au départ
        }
      });
      const hp=G.at(c,r);
      hero.style.left=hp.x+'px'; hero.style.top=(hp.y-24)+'px';
      if(el2>=25){
        over=true;
        area.onpointerdown=null;
        $('mgTimer').textContent='';
        submitScore(score+best*3);
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 39 : guerre de peinture (tous en même temps, temps réel) --- */
function mgPaint(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const COLS=7, ROWS=7;
    const G=isoGrid(W,H,COLS,ROWS,40);
    area.innerHTML=`<svg id="ptSvg" style="position:absolute;inset:0;width:100%;height:100%;">${G.svg}</svg>
      <div class="ammo" id="ptInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>`;
    // 5 dalles dorées (semées : identiques chez tout le monde) — comptent quadruple
    const rng=mulberry32(room.mg.startedAt||1);
    const gold={};
    while(Object.keys(gold).length<5) gold[(1+Math.floor(rng()*(COLS-2)))+'-'+(1+Math.floor(rng()*(ROWS-2)))]=1;
    for(const k in gold){
      const [c,r]=k.split('-').map(Number), p=G.at(c,r);
      const t=document.getElementById('tl-'+c+'-'+r);
      if(t) t.setAttribute('stroke','#FFD644');
      const s=document.createElementNS('http://www.w3.org/2000/svg','text');
      s.setAttribute('x',p.x); s.setAttribute('y',p.y+4); s.setAttribute('text-anchor','middle');
      s.setAttribute('font-size','12'); s.textContent='✨'; s.style.pointerEvents='none';
      document.getElementById('ptSvg').appendChild(s);
    }
    // état des dalles : fusion « le plus récent gagne » → tout le monde converge
    const tiles={}; // 'c-r' → {pid,t}
    function colOf(pid){ const p=room.players.find(q=>q.id===pid); return (p&&p.color)||'#3EE6C1'; }
    function paint(c,r,pid,t){
      const k=c+'-'+r, cur=tiles[k];
      if(cur&&(cur.t>t||(cur.t===t&&cur.pid>=pid))) return;
      tiles[k]={pid,t};
      const el=document.getElementById('tl-'+c+'-'+r);
      if(el){ el.setAttribute('fill',colOf(pid)+'99'); }
    }
    // mon bonhomme + ceux des autres
    const chars={};
    function charEl(p){
      const el=document.createElement('div');
      el.style.cssText='position:absolute;width:40px;margin-left:-20px;text-align:center;pointer-events:none;transition:left .3s,top .3s;';
      el.innerHTML=pAv(p,26);
      area.appendChild(el);
      return el;
    }
    room.players.forEach((p,i)=>{
      const corners=[[0,0],[COLS-1,ROWS-1],[COLS-1,0],[0,ROWS-1],[3,0],[3,ROWS-1]];
      const [c,r]=corners[i%corners.length];
      chars[p.id]={c,r,el:charEl(p)};
      if(p.id===me.id) paint(c,r,me.id,1);
    });
    const mine=chars[me.id]||chars[room.players[0].id];
    let over=false, target=null, lastHop=0;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    const track=e=>{ const r2=area.getBoundingClientRect(); target={x:e.clientX-r2.left,y:e.clientY-r2.top}; };
    area.onpointerdown=e=>{ track(e); area.onpointermove=track; };
    area.onpointerup=()=>{ target=null; area.onpointermove=null; };
    const myAct=d=>{
      if(d.k==='pt') paint(d.c,d.r,d.pid,d.t);
      else if(d.k==='pp'&&chars[d.pid]&&d.pid!==me.id){ chars[d.pid].c=d.c; chars[d.pid].r=d.r; }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    (function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s';
      // déplacement : un saut de case vers le doigt toutes les 340 ms
      if(target&&now-lastHop>340&&!over){
        const cur=G.at(mine.c,mine.r);
        const dx=target.x-cur.x, dy=target.y-cur.y;
        if(Math.hypot(dx,dy)>14){
          lastHop=now;
          let nc=mine.c, nr=mine.r;
          // direction iso dominante
          if(Math.abs(dx)*0.6>Math.abs(dy)){ if(dx>0){nc++;nr--;} else {nc--;nr++;} }
          else if(dy>0){ if(dx>0)nc++; else nr++; }
          else { if(dx>0)nr--; else nc--; }
          nc=Math.max(0,Math.min(COLS-1,nc)); nr=Math.max(0,Math.min(ROWS-1,nr));
          if(nc!==mine.c||nr!==mine.r){
            mine.c=nc; mine.r=nr;
            snd('step'); vib(6);
            const t=now-start;
            paint(nc,nr,me.id,t);
            actSend({k:'pt',c:nc,r:nr,pid:me.id,t});
            actSend({k:'pp',pid:me.id,c:nc,r:nr});
          }
        }
      }
      for(const id in chars){ const ch=chars[id], p=G.at(ch.c,ch.r);
        ch.el.style.left=p.x+'px'; ch.el.style.top=(p.y-22)+'px'; }
      let mineN=0, goldN=0;
      for(const k in tiles){ if(tiles[k].pid===me.id){ mineN++; if(gold[k]) goldN++; } }
      const ptInfo=document.getElementById('ptInfo');
      if(!ptInfo){ over=true; if(window.mgAct===myAct) window.mgAct=null; return; } // l'arène a été remplacée
      ptInfo.textContent='🎨 '+mineN+' dalle'+(mineN>1?'s':'')+(goldN?' · ✨'+goldN:'');
      if((el2>=30&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointerdown=null; area.onpointermove=null; area.onpointerup=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(mineN*10+goldN*30);
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 40 : la lave monte (tous en même temps, temps réel, vertical !) --- */
function mgLava(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const COLS=6, ROWS=6, EL=15;
    const G=isoGrid(W,H,COLS,ROWS,64);
    const NS='http://www.w3.org/2000/svg';
    area.innerHTML=`<svg id="lvSvg" style="position:absolute;inset:0;width:100%;height:100%;"></svg>
      <div id="lvLava" style="position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(#FF9B4A88,#FF5A2Acc);border-top:3px solid #FFD644;box-shadow:0 -10px 30px #FF6B2A88;pointer-events:none;"></div>
      <div class="ammo" id="lvInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>`;
    const svg=document.getElementById('lvSvg');
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    // hauteurs des piliers par phase de 5 s : semées → identiques chez tout le monde
    function hAt(c,r,ph){
      const g=mulberry32((room.mg.startedAt||1)+ph*7919+c*131+r*17)();
      return Math.floor(g*4); // 0..3
    }
    const tiles=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      const g=document.createElementNS(NS,'g');
      const sL=document.createElementNS(NS,'polygon');
      const sR=document.createElementNS(NS,'polygon');
      const top=document.createElementNS(NS,'polygon');
      g.appendChild(sL); g.appendChild(sR); g.appendChild(top);
      svg.appendChild(g);
      tiles.push({c,r,g,top,sL,sR,h:hAt(c,r,0),vh:hAt(c,r,0)});
    }
    [...tiles].sort((a,b)=>(a.c+a.r)-(b.c+b.r)).forEach(t=>svg.appendChild(t.g)); // peintre iso (l'index de `tiles` reste c/r)
    function drawTile(t){
      const p=G.at(t.c,t.r), y=p.y-t.vh*EL;
      const L2=G.TW/2, H2=G.TH/2, dep=8+t.vh*EL;
      const burning=t.vh<lavaLvl-.15;
      const col=burning?'#7A2E1E':(t.vh>=3?'#F0E6FF':t.vh>=2?'#C7B8E8':t.vh>=1?'#9C8CC8':'#6E5F9E');
      t.top.setAttribute('points',`${p.x},${y-H2} ${p.x+L2},${y} ${p.x},${y+H2} ${p.x-L2},${y}`);
      t.top.setAttribute('fill',col);
      t.top.setAttribute('stroke',burning?'#FF6B2A':'rgba(255,255,255,.25)');
      t.sL.setAttribute('points',`${p.x-L2},${y} ${p.x},${y+H2} ${p.x},${y+H2+dep} ${p.x-L2},${y+dep}`);
      t.sL.setAttribute('fill',shade(col,.55));
      t.sR.setAttribute('points',`${p.x+L2},${y} ${p.x},${y+H2} ${p.x},${y+H2+dep} ${p.x+L2},${y+dep}`);
      t.sR.setAttribute('fill',shade(col,.72));
    }
    const at=(c,r)=>tiles[r*COLS+c];
    // personnages
    const chars={};
    room.players.forEach((p,i)=>{
      const el=document.createElement('div');
      el.style.cssText='position:absolute;width:40px;margin-left:-20px;text-align:center;pointer-events:none;transition:left .25s,top .25s;';
      el.innerHTML=pAv(p,25);
      area.appendChild(el);
      const spots=[[0,0],[COLS-1,ROWS-1],[COLS-1,0],[0,ROWS-1],[2,2],[3,3]];
      const [c,r]=spots[i%spots.length];
      chars[p.id]={c,r,el};
    });
    const mine=chars[me.id]||chars[room.players[0].id];
    let over=false, burns=0, alt=0, lastMove=0, safeUntil=0, lavaLvl=-1;
    const localStart=Date.now();
    area.onpointerdown=e=>{
      const now=Date.now();
      if(over||now-lastMove<300||now<safeUntil-800) return;
      const r2=area.getBoundingClientRect();
      const tx=e.clientX-r2.left, ty2=e.clientY-r2.top;
      const cur=G.at(mine.c,mine.r);
      const dx=tx-cur.x, dy=ty2-(cur.y-at(mine.c,mine.r).vh*EL);
      let nc=mine.c, nr=mine.r;
      if(Math.abs(dx)*0.6>Math.abs(dy)){ if(dx>0){nc++;nr--;} else {nc--;nr++;} }
      else if(dy>0){ if(dx>0)nc++; else nr++; }
      else { if(dx>0)nr--; else nc--; }
      nc=Math.max(0,Math.min(COLS-1,nc)); nr=Math.max(0,Math.min(ROWS-1,nr));
      if(nc===mine.c&&nr===mine.r) return;
      // on ne grimpe que d'un étage à la fois (descendre : toujours permis)
      if(at(nc,nr).h-at(mine.c,mine.r).h>1){ snd('bad'); vib(10); return; }
      lastMove=now;
      mine.c=nc; mine.r=nr;
      snd('step'); vib(6);
      actSend({k:'lp',pid:me.id,c:nc,r:nr});
    };
    const myAct=d=>{
      if(d.k==='lp'&&chars[d.pid]&&d.pid!==me.id){ chars[d.pid].c=d.c; chars[d.pid].r=d.r; }
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    let lastT=Date.now();
    (function loop(){
      const now=Date.now(), el2=(now-start)/1000, dt=Math.min(.06,(now-lastT)/1000); lastT=now;
      const ph=Math.floor(el2/5);
      const phT=Math.min(1,(el2-ph*5)/0.7); // transition douce de 0,7 s
      tiles.forEach(t=>{
        t.h=hAt(t.c,t.r,ph);
        const prev=hAt(t.c,t.r,Math.max(0,ph-1));
        t.vh=prev+(t.h-prev)*phT;
        drawTile(t);
      });
      lavaLvl=-1+el2/8; // la lave engloutit l'étage 0 à ~8 s, l'étage 1 à ~16 s…
      const lavaEl=document.getElementById('lvLava');
      if(!lavaEl){ over=true; if(window.mgAct===myAct) window.mgAct=null; return; } // l'arène a été remplacée
      lavaEl.style.height=Math.max(0,Math.min(H*.5,(lavaLvl+1)/4.4*H*.5))+'px';
      // points d'altitude + brûlure
      const myTile=at(mine.c,mine.r);
      if(now>=safeUntil){
        alt+=myTile.vh*dt*3;
        if(myTile.vh<lavaLvl-.15){
          burns++; snd('boom'); vib(60);
          document.body.classList.add('shake'); setTimeout(()=>document.body.classList.remove('shake'),300);
          // téléporté sur un pilier haut, brève invulnérabilité
          let best=tiles[0];
          tiles.forEach(t=>{ if(t.h>best.h) best=t; });
          mine.c=best.c; mine.r=best.r;
          safeUntil=now+1500;
          mine.el.style.opacity='.4'; setTimeout(()=>mine.el.style.opacity='1',1500);
          actSend({k:'lp',pid:me.id,c:mine.c,r:mine.r});
        }
      }
      for(const id in chars){ const ch=chars[id], p=G.at(ch.c,ch.r);
        ch.el.style.left=p.x+'px'; ch.el.style.top=(p.y-at(ch.c,ch.r).vh*EL-22)+'px'; }
      $('mgTimer').textContent=Math.max(0,30-el2).toFixed(0)+' s';
      $('lvInfo').textContent='⛰️ '+Math.round(alt)+' pts'+(burns?' · 🔥'+burns:'');
      if((el2>=30&&now-localStart>=8000)||now-localStart>=40000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(Math.max(0,Math.round(alt)-burns*25+(burns===0?30:0)));
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}
/* --- mini-jeu 41 : château contre château (équipes, temps réel, tir en cloche) --- */
function mgSiege(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    const W=area.clientWidth, H=area.clientHeight;
    const T=room.mg.teams||{}, myTeam=T[me.id]||0;
    const NS='http://www.w3.org/2000/svg';
    area.innerHTML=`<svg id="sgSvg" style="position:absolute;inset:0;width:100%;height:100%;"></svg>
      <div class="ammo" id="sgInfo" style="left:50%;transform:translateX(-50%);top:auto;bottom:8px;"></div>
      <div id="sgHint" style="position:absolute;top:8px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:800;opacity:.75;text-align:center;width:90%;">🏹 glisse vers l'ARRIÈRE puis lâche : lance-pierre !</div>`;
    const svg=document.getElementById('sgSvg');
    // deux châteaux : grille de blocs 3×4 posée au sol
    const BW=26, BH=17, baseY=H-46;
    const castles=[[],[]]; // [team][idx] = {x,y,el,dead}
    const COLS4=3, ROWS4=4;
    [0,1].forEach(team=>{
      const x0=team===0?26:W-26-COLS4*BW;
      for(let i=0;i<COLS4*ROWS4;i++){
        const cc=i%COLS4, rr2=Math.floor(i/COLS4);
        const x=x0+cc*BW, y=baseY-(ROWS4-rr2)*BH;
        const g=document.createElementNS(NS,'g');
        g.innerHTML=`<rect x="${x}" y="${y}" width="${BW-2}" height="${BH-2}" rx="3"
            fill="${team===0?'#5AC8FA':'#FF6B6B'}" stroke="${team===0?'#2E7DB0':'#B03A3A'}" stroke-width="2"/>
          <rect x="${x+3}" y="${y+3}" width="${BW-8}" height="4" rx="2" fill="rgba(255,255,255,.35)"/>`;
        svg.appendChild(g);
        castles[team].push({x:x+BW/2,y:y+BH/2,el:g,dead:false});
      }
      const fx=x0+COLS4*BW/2;
      const flag=document.createElementNS(NS,'text');
      flag.setAttribute('x',fx); flag.setAttribute('y',baseY-ROWS4*BH-8);
      flag.setAttribute('text-anchor','middle'); flag.setAttribute('font-size','18');
      flag.textContent=team===0?'🔵':'🔴';
      svg.appendChild(flag);
    });
    const myX=myTeam===0?26+COLS4*BW/2:W-26-COLS4*BW/2;
    const destroyed={}; // 'team-idx' → 1 (fusion idempotente → converge partout)
    function killBlock(team,idx){
      const k=team+'-'+idx;
      if(destroyed[k]) return false;
      destroyed[k]=1;
      const b=castles[team][idx];
      if(b&&!b.dead){ b.dead=true; b.el.style.opacity='.14';
        const fx=document.createElement('div'); fx.className='hitfx'; fx.textContent='💥';
        fx.style.left=(b.x-13)+'px'; fx.style.top=(b.y-13)+'px';
        area.appendChild(fx); setTimeout(()=>fx.remove(),450);
      }
      return true;
    }
    let myHits=0, over=false, lastShot=0, drag=null;
    const localStart=Date.now();
    const start=(()=>{ const s=room.mg.startedAt||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    const GRAV=430;
    function flyBall(x0,y0,vx,vy,team,scoreIt){
      const ball=document.createElement('div');
      ball.style.cssText='position:absolute;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFE9A8,#D8A24A);box-shadow:0 0 8px #FFD64488;pointer-events:none;margin:-7px 0 0 -7px;z-index:5;';
      area.appendChild(ball);
      let x=x0, y=y0, t0=Date.now();
      const boom=()=>{
        ball.remove();
        if(!scoreIt) return;
        // impact : blocs ennemis dans le rayon d'éclat
        const enemy=1-team;
        let hits=0;
        castles[enemy].forEach((b,i)=>{
          if(!b.dead&&Math.hypot(b.x-x,b.y-y)<30){
            if(killBlock(enemy,i)){ hits++; actSend({k:'sgb',team:enemy,idx:i}); }
          }
        });
        if(hits){ myHits+=hits; snd('boom'); vib(30); } else snd('pop');
      };
      (function fly(){
        const t=(Date.now()-t0)/1000;
        x=x0+vx*t; y=y0+vy*t+GRAV*t*t/2;
        ball.style.left=x+'px'; ball.style.top=y+'px';
        // le boulet explose AU CONTACT d'un bloc ennemi (pas seulement au sol)
        if(scoreIt){
          const enemy=1-team;
          if(castles[enemy].some(b=>!b.dead&&Math.hypot(b.x-x,b.y-y)<15)){ boom(); return; }
        }
        if(y>=baseY-2||x<-30||x>W+30){ boom(); return; }
        requestAnimationFrame(fly);
      })();
    }
    area.onpointerdown=e=>{
      if(over) return;
      const r2=area.getBoundingClientRect();
      drag={x0:e.clientX-r2.left,y0:e.clientY-r2.top,x:e.clientX-r2.left,y:e.clientY-r2.top};
    };
    area.onpointermove=e=>{
      if(!drag) return;
      const r2=area.getBoundingClientRect();
      drag.x=e.clientX-r2.left; drag.y=e.clientY-r2.top;
      // aperçu de trajectoire (5 points)
      document.querySelectorAll('.sg-dot').forEach(d=>d.remove());
      const vx=(drag.x0-drag.x)*3.2, vy=(drag.y0-drag.y)*3.2;
      for(let i=1;i<=5;i++){
        const t=i*.16;
        const px=myX+vx*t, py=(baseY-BH*4.6)+vy*t+GRAV*t*t/2;
        if(py>baseY) break;
        const d=document.createElement('div'); d.className='sg-dot';
        d.style.cssText=`position:absolute;left:${px-3}px;top:${py-3}px;width:6px;height:6px;border-radius:50%;background:#FFD644;opacity:${1-i*.15};pointer-events:none;`;
        area.appendChild(d);
      }
    };
    area.onpointerup=()=>{
      document.querySelectorAll('.sg-dot').forEach(d=>d.remove());
      if(!drag||over){ drag=null; return; }
      const now=Date.now();
      const vx=(drag.x0-drag.x)*3.2, vy=(drag.y0-drag.y)*3.2;
      drag=null;
      if(now-lastShot<1500||Math.hypot(vx,vy)<60) return;
      lastShot=now;
      const hint=document.getElementById('sgHint'); if(hint) hint.remove();
      snd('shot'); vib(15);
      flyBall(myX,baseY-BH*4.6,vx,vy,myTeam,true);
      actSend({k:'sgs',x0:myX,y0:baseY-BH*4.6,vx,vy,team:myTeam});
    };
    const myAct=d=>{
      if(d.k==='sgb') killBlock(d.team,d.idx);
      else if(d.k==='sgs') flyBall(d.x0,d.y0,d.vx,d.vy,d.team,false);
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    (function loop(){
      const now=Date.now(), el2=(now-start)/1000;
      $('mgTimer').textContent=Math.max(0,35-el2).toFixed(0)+' s';
      const enemyLeft=castles[1-myTeam].filter(b=>!b.dead).length;
      const mineLeft=castles[myTeam].filter(b=>!b.dead).length;
      const sgInfo=document.getElementById('sgInfo');
      if(!sgInfo){ over=true; if(window.mgAct===myAct) window.mgAct=null; return; } // l'arène a été remplacée
      sgInfo.textContent='🏰 '+mineLeft+' blocs · 💥 '+myHits+' détruits · 🎯 reste '+enemyLeft;
      const raze=enemyLeft===0;
      if((el2>=35&&now-localStart>=8000)||now-localStart>=40000||raze&&now-localStart>=8000){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointerdown=null; area.onpointermove=null; area.onpointerup=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        submitScore(myHits*15+(raze?40:0)+mineLeft*2);
        return;
      }
      requestAnimationFrame(loop);
    })();
  };
  area.appendChild(btn);
}


/* =================== mini-jeux en 3D (personnages Meshy dans l'arène) =================== */
function curP(){ // le joueur qui tient la manette (local : celui dont c'est le tour)
  if(local&&window.localMg&&room.players[localMg.idx]) return room.players[localMg.idx];
  return room.players.find(p=>p.id===me.id)||room.players[0];
}
function mg3dInfo(area,txt){
  const d=document.createElement('div');
  d.className='ammo';
  d.style.cssText+='left:50%;transform:translateX(-50%);top:auto;bottom:8px;z-index:6;';
  d.textContent=txt||'';
  area.appendChild(d);
  return d;
}
/* --- mini-jeu 42 : Ruée aux Pièces 3D (chacun son tour) --- */
function mgCoins3D(area){
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    area.innerHTML='';
    if(!MG3D.init(area,{theme:room.mapId,dist:26,el:.60})){ submitScore(0); return; }
    const R=11.5;
    MG3D.floor({size:26,theme:room.mapId});
    const H=MG3D.hero(curP(),{x:0,z:0});
    const stick=MG3D.joystick(area);
    const info=mg3dInfo(area,'🪙 0');
    const rng=mulberry32((room.mg&&room.mg.startedAt)||1);
    const spot=()=>{ const a=rng()*7, r=2+rng()*(R-2.5); return {x:Math.cos(a)*r,z:Math.sin(a)*r}; };
    const coins=[];
    for(let i=0;i<12;i++){ const s=spot(); coins.push({m:MG3D.obj('coin',{x:s.x,z:s.z,y:1}),alive:true}); }
    const bombs=[];
    for(let i=0;i<3;i++){ bombs.push({m:MG3D.obj('bomb',{x:0,z:0,y:.9}),a:i*2.1,r:4+i*2.6,v:.55+i*.18}); }
    let star=null, starT=4, score=0, nb=0, over=false, stun=0;
    const startT=Date.now();
    MG3D.frame((dt,t)=>{
      if(over) return;
      if(stun>0) stun-=dt;
      const sp=stun>0?0:10.5;
      const vx=stick.x*sp*dt, vz=stick.y*sp*dt;
      if(vx||vz){
        H.x+=vx; H.z+=vz;
        const d=Math.hypot(H.x,H.z);
        if(d>R){ H.x*=R/d; H.z*=R/d; }
        H.dir=Math.atan2(vx,vz);
        H.moving=true;
      } else H.moving=false;
      MG3D.look(H.x*.35,H.z*.35);
      coins.forEach(c=>{
        if(!c.alive) return;
        c.m.rotation.z=t*.004;
        c.m.position.y=1+Math.sin(t*.004+c.m.position.x)*.16;
        if(Math.hypot(c.m.position.x-H.x,c.m.position.z-H.z)<1.5){
          c.alive=false; c.m.visible=false;
          score+=10; nb++; snd('coin'); vib(8);
          MG3D.burst(c.m.position.x,1.2,c.m.position.z,0xFFD644,14);
          setTimeout(()=>{ if(over) return; const s=spot(); c.m.position.set(s.x,1,s.z); c.m.visible=true; c.alive=true; },700);
        }
      });
      bombs.forEach(b=>{
        b.a+=b.v*dt;
        b.m.position.set(Math.cos(b.a)*b.r,.9+Math.sin(t*.005+b.a)*.2,Math.sin(b.a)*b.r);
        if(stun<=0&&Math.hypot(b.m.position.x-H.x,b.m.position.z-H.z)<1.4){
          stun=1; score=Math.max(0,score-15); snd('boom'); vib(45);
          MG3D.burst(H.x,1.4,H.z,0xFF6B6B,18);
          document.body.classList.add('shake'); setTimeout(()=>document.body.classList.remove('shake'),300);
        }
      });
      starT-=dt;
      if(!star&&starT<=0){ const s=spot(); star=MG3D.obj('star',{x:s.x,z:s.z,y:1.5}); star.life=5; }
      if(star){
        star.rotation.y=t*.003; star.position.y=1.5+Math.sin(t*.005)*.3;
        star.life-=dt;
        if(Math.hypot(star.position.x-H.x,star.position.z-H.z)<1.7){
          score+=30; snd('star'); vib(30);
          MG3D.burst(star.position.x,1.8,star.position.z,0xFFE9A8,22);
          MG3D.remove(star); star=null; starT=6;
        } else if(star.life<=0){ MG3D.remove(star); star=null; starT=6; }
      }
      const el=(Date.now()-startT)/1000;
      $('mgTimer').textContent=Math.max(0,22-el).toFixed(0)+' s';
      info.textContent='🪙 '+nb+(score?' · '+score+' pts':'');
      if(el>=22){
        over=true;
        $('mgTimer').textContent='';
        snd('fanfare');
        MG3D.stop();
        submitScore(score);
      }
    });
  };
  area.appendChild(btn);
}
/* --- mini-jeu 43 : Sumo Cosmique 3D (temps réel) --- */
function mgSumo3D(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    area.innerHTML='';
    if(!MG3D.init(area,{theme:room.mapId,dist:32,el:.66})){ submitScore(0); return; }
    const floor=MG3D.floor({size:24,theme:room.mapId});
    const stick=MG3D.joystick(area);
    const info=mg3dInfo(area,'');
    const hs={};
    room.players.forEach((p,i)=>{
      const a=i/room.players.length*Math.PI*2;
      const h=MG3D.hero(p,{x:Math.cos(a)*7,z:Math.sin(a)*7});
      h.vx=0; h.vz=0; h.pid=p.id;
      hs[p.id]=h;
    });
    const mine=hs[curP().id];
    let over=false, deadAt=0, lastSend=0;
    const localStart=Date.now();
    const start=(()=>{ const s=(room.mg&&room.mg.startedAt)||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    const myAct=d=>{
      if(d.k==='sp'&&hs[d.id]&&d.id!==mine.pid){ hs[d.id].x=d.x; hs[d.id].z=d.z; hs[d.id].moving=!!d.m; }
      else if(d.k==='sd'&&hs[d.id]) hs[d.id].alive=false;
    };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      const R=Math.max(5.5,12-el*.22); // la banquise rétrécit
      floor.shrink(R);
      if(mine.alive){
        mine.vx+=stick.x*38*dt; mine.vz+=stick.y*38*dt;
        mine.vx*=.90; mine.vz*=.90;
        const sp=Math.hypot(mine.vx,mine.vz);
        if(sp>11){ mine.vx*=11/sp; mine.vz*=11/sp; }
        mine.x+=mine.vx*dt; mine.z+=mine.vz*dt;
        mine.moving=sp>.7;
        if(sp>.7) mine.dir=Math.atan2(mine.vx,mine.vz);
        for(const id in hs){
          const o=hs[id];
          if(o===mine||!o.alive) continue;
          const dx=mine.x-o.x, dz=mine.z-o.z, d=Math.hypot(dx,dz);
          if(d<1.9&&d>.01){
            const push=(1.9-d)*14;
            mine.vx+=dx/d*push; mine.vz+=dz/d*push;
            if(sp>4){ snd('tap'); vib(12); MG3D.burst((mine.x+o.x)/2,1.4,(mine.z+o.z)/2,0xFFFFFF,8); }
          }
        }
        if(Math.hypot(mine.x,mine.z)>R){
          mine.alive=false; deadAt=Date.now();
          snd('bad'); vib(60);
          actSend({k:'sd',id:mine.pid});
        }
      } else mine.y=(mine.y||0)-dt*11;
      for(const id in hs){ const o=hs[id]; if(!o.alive&&o!==mine) o.y=(o.y||0)-dt*11; }
      if(Date.now()-lastSend>110&&mine.alive){
        lastSend=Date.now();
        actSend({k:'sp',id:mine.pid,x:+mine.x.toFixed(2),z:+mine.z.toFixed(2),m:mine.moving});
      }
      MG3D.look(0,0);
      const vivants=Object.values(hs).filter(h=>h.alive).length;
      $('mgTimer').textContent=Math.max(0,30-el).toFixed(0)+' s';
      info.textContent=mine.alive?('🧊 '+vivants+' en piste'):'💀 tombé !';
      if((el>=30&&Date.now()-localStart>=8000)||Date.now()-localStart>=42000||(!mine.alive&&Date.now()-deadAt>2200)){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        const surv=Math.min(30,((mine.alive?Date.now():deadAt)-localStart)/1000);
        MG3D.stop();
        submitScore(Math.round(surv*8)+(mine.alive?60:0));
      }
    });
  };
  area.appendChild(btn);
}
/* --- mini-jeu 44 : Sprint des Étoiles 3D (temps réel) --- */
function mgRun3D(area){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button'); btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    area.innerHTML='';
    if(!MG3D.init(area,{theme:room.mapId,dist:15,el:.42,az:Math.PI})){ submitScore(0); return; }
    const T=MG3D.THREE;
    const rail=MG3D.group();
    const matA=new T.MeshStandardMaterial({color:0x4A3C78,roughness:.9});
    const matB=new T.MeshStandardMaterial({color:0x5A4A8E,roughness:.9});
    const geo=new T.BoxGeometry(13,1,3.6);
    const tiles=[], bords=[];
    const bordM=new T.MeshStandardMaterial({color:0xFFD644,emissive:0x6a4a00,emissiveIntensity:1});
    for(let i=0;i<22;i++){
      const m=new T.Mesh(geo,i%2?matA:matB);
      m.position.set(0,-.6,i*3.6-8);
      m.receiveShadow=true;
      rail.add(m); tiles.push(m);
      [-6.9,6.9].forEach(x=>{
        const b=new T.Mesh(new T.BoxGeometry(.5,.5,.5),bordM);
        b.position.set(x,0,i*3.6-8);
        rail.add(b); bords.push(b);
      });
    }
    const arche=MG3D.obj('cube',{x:0,y:3.4,z:400,color:0x3EE6C1});
    arche.scale.set(14,.8,.8);
    const players=room.players, hs={};
    players.forEach((p,i)=>{
      const lane=(i-(players.length-1)/2)*2.6;
      const h=MG3D.hero(p,{x:lane,z:0});
      h.lane=lane; h.pid=p.id; h.dist=0;
      hs[p.id]=h;
    });
    const mine=hs[curP().id];
    const info=mg3dInfo(area,'0 m');
    const hint=document.createElement('div');
    hint.style.cssText='position:absolute;bottom:44px;left:0;right:0;display:flex;justify-content:space-between;'+
      'padding:0 12px;font-weight:800;font-size:15px;opacity:.8;pointer-events:none;z-index:6;';
    hint.innerHTML='<span>◀️ GAUCHE</span><span>DROITE ▶️</span>';
    area.appendChild(hint);
    let sideNext=0, speed=0, over=false, lastSend=0, fini=0;
    const localStart=Date.now();
    const start=(()=>{ const s=(room.mg&&room.mg.startedAt)||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    area.onpointerdown=e=>{
      if(over) return;
      const r=area.getBoundingClientRect();
      const side=(e.clientX-r.left)<r.width/2?0:1;
      if(side===sideNext){ // alternance gauche-droite = foulées
        sideNext=1-sideNext;
        speed=Math.min(15,speed+3.1);
        snd('step'); vib(5);
      }
    };
    const myAct=d=>{ if(d.k==='rd'&&hs[d.id]&&d.id!==mine.pid) hs[d.id].dist=d.d; };
    window.mgAct=myAct;
    preActs.splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      speed=Math.max(0,speed-5.4*dt); // il faut relancer sans cesse
      if(!fini) mine.dist+=speed*dt;
      mine.moving=speed>1.2;
      const dz=speed*dt;
      tiles.forEach(m=>{ m.position.z-=dz; if(m.position.z<-10) m.position.z+=22*3.6; });
      bords.forEach(b=>{ b.position.z-=dz; if(b.position.z<-10) b.position.z+=22*3.6; });
      arche.position.z=Math.max(-6,100-mine.dist);
      for(const id in hs){
        const o=hs[id];
        if(o===mine) continue;
        o.z=Math.max(-9,Math.min(17,o.dist-mine.dist));
        o.x=o.lane;
        o.moving=true;
      }
      mine.x=mine.lane; mine.z=0;
      MG3D.look(0,2,true);
      if(Date.now()-lastSend>150){
        lastSend=Date.now();
        actSend({k:'rd',id:mine.pid,d:+mine.dist.toFixed(1)});
      }
      if(!fini&&mine.dist>=100){ fini=Date.now(); snd('yay'); MG3D.burst(mine.lane,2,1,0x3EE6C1,26); }
      const rang=1+Object.values(hs).filter(o=>o!==mine&&o.dist>mine.dist).length;
      $('mgTimer').textContent=Math.max(0,32-el).toFixed(0)+' s';
      info.textContent=fini?('🏁 ARRIVÉ ! '+rang+(rang===1?'er':'e')):(Math.floor(mine.dist)+' m · '+rang+(rang===1?'er':'e'));
      if((el>=32&&Date.now()-localStart>=8000)||Date.now()-localStart>=44000||(fini&&Date.now()-fini>1800)){
        over=true;
        if(window.mgAct===myAct) window.mgAct=null;
        area.onpointerdown=null;
        $('mgTimer').textContent='';
        snd('fanfare');
        const temps=(fini-localStart)/1000;
        MG3D.stop();
        submitScore(fini?Math.max(90,Math.round(240-temps*5)):Math.round(mine.dist*1.6));
      }
    });
  };
  area.appendChild(btn);
}
