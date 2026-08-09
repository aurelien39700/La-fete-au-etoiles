/* =================== boucle hôte : résoudre le mini-jeu, gérer les absents =================== */
function startHostLoop(){
  clearInterval(hostI);
  hostI=setInterval(async()=>{
    if(!room||local) return;
    // migration d'hôte : si l'hôte est parti, le premier joueur présent reprend la couronne
    const hostP=room.players.find(p=>p.id===room.hostId);
    if(hostP&&hostP.gone&&!animBusy){
      const alive=room.players.filter(p=>!p.gone);
      if(alive[0]&&alive[0].id===me.id){
        room.hostId=me.id;
        room.log.push('👑 '+me.name+' devient l\'hôte de la partie !');
        await saveRoom();
        return;
      }
    }
    if(!isHost()) return;
    // saut de tour d'un joueur absent (après 10 s sans activité)
    if(room.status==='board'&&!animBusy){
      const cur=room.players[room.turn];
      if(cur&&cur.gone&&Date.now()-lastStateAt>10000){
        room.log.push('💤 '+cur.name+' est absent : son tour est passé.');
        animBusy=true;
        await endTurn();
        return;
      }
    }
    if(room.status!=='minigame') return;
    const sc=(room.mgScores&&room.mg&&room.mgScores[room.mg.round])||{};
    const active=room.players.filter(p=>!p.gone);
    const n=active.filter(p=>sc[p.id]!==undefined).length;
    const timeout=Date.now()-room.mg.startedAt>150000;
    if((active.length>0&&n===active.length)||(timeout&&n>0)){
      await resolveMg(sc);
    }
  },2000);
}

function renderMgRes(){
  show('scr-mgres');
  clearInterval(mgTimerI); mgTimerI=null;
  const res=room.mg.results||[];
  const VR=room.mg.vsRes;
  const TR=room.mg.teamRes;
  if(VR){
    $('mgPodium').innerHTML='';
    const teamRows=res.filter(r=>!r.solo);
    $('mgRanks').innerHTML=`<div style="display:flex;gap:10px;align-items:stretch;text-align:center;">
      <div style="flex:1;border-radius:20px;padding:12px 8px;background:rgba(255,159,69,.16);border:3px solid ${VR.soloWins?'var(--etoile)':'rgba(255,255,255,.15)'};">
        <div class="titan" style="font-size:19px;">🎯 SEUL ${VR.soloWins?'🏆':''}</div>
        <div style="margin-top:6px;">${pAvPose({hero:VR.soloHero,skin:VR.soloSkin,color:VR.soloColor,avatar:VR.soloAvatar},46,VR.soloWins?'win':'sad')}</div>
        <div style="font-weight:800;font-size:14px;">${VR.soloName}</div>
        <div class="titan" style="font-size:24px;color:var(--menthe);">${VR.soloScore} pts</div>
        <div style="font-size:12px;color:var(--menthe);font-weight:800;">+${VR.soloWins?15:2} 🪙</div>
      </div>
      <div style="flex:1.2;border-radius:20px;padding:12px 8px;background:rgba(90,200,250,.14);border:3px solid ${VR.soloWins?'rgba(255,255,255,.15)':'var(--etoile)'};">
        <div class="titan" style="font-size:19px;">👥 L'ÉQUIPE ${VR.soloWins?'':'🏆'}</div>
        <div class="titan" style="font-size:24px;color:var(--menthe);">${VR.avg} pts</div>
        <div style="font-size:11px;opacity:.7;font-weight:700;">de moyenne</div>
        ${teamRows.map(m=>`<div style="font-weight:700;font-size:13px;margin-top:5px;">${pAvPose(m,24,VR.soloWins?'sad':'win')} ${m.name} — ${m.score} pts <span style="color:var(--menthe);">+${m.gain} 🪙</span></div>`).join('')}
      </div>
    </div>`;
  } else if(TR){
    $('mgPodium').innerHTML='';
    const teamCard=t=>{
      const members=res.filter(r=>r.team===t);
      const win=TR.win===t;
      return `<div style="flex:1;border-radius:20px;padding:12px 8px;background:${t===0?'rgba(90,200,250,.15)':'rgba(255,107,107,.15)'};border:3px solid ${win?'var(--etoile)':'rgba(255,255,255,.15)'};">
        <div class="titan" style="font-size:22px;">${t===0?'🔵':'🔴'} ${win?'🏆':''}</div>
        <div class="titan" style="font-size:26px;color:var(--menthe);">${TR.avg[t]} pts</div>
        <div style="font-size:12px;opacity:.7;font-weight:700;">de moyenne</div>
        ${members.map(m=>`<div style="font-weight:700;font-size:13px;margin-top:6px;">${pAvPose(m,26,win?'win':'sad')} ${m.name}<br>${m.score} pts · <span style="color:var(--menthe);">+${m.gain} 🪙</span></div>`).join('')}
      </div>`;
    };
    $('mgRanks').innerHTML=`<div style="display:flex;gap:10px;align-items:stretch;text-align:center;">${teamCard(0)}${teamCard(1)}</div>`;
  } else {
    const medals=['🥇','🥈','🥉'];
    const hts=[114,86,64], cols=['#FFD644','#C9D1E0','#D08B4C'];
    const order=[1,0,2].filter(i=>res[i]);
    $('mgPodium').innerHTML=order.map((i,k)=>`
      <div class="pod" style="animation-delay:${(i===0?0.1:0.25+k*0.12)}s;">
        <div class="pav">${pAvPose(res[i],i===0?50:42,i===0?'win':(i===res.length-1?'sad':null))}</div>
        <div class="gname">${res[i].name}</div>
        <div class="base" style="height:${hts[i]}px;background:${cols[i]};">
          <div class="med">${medals[i]}</div>
          <div class="g">+${res[i].gain} 🪙</div>
          <div style="font-size:11px;font-family:'Baloo 2';font-weight:700;">${res[i].score} pts</div>
        </div>
      </div>`).join('');
    $('mgRanks').innerHTML=
      (room.mg.bonusNote?`<p class="center" style="font-weight:800;color:var(--peche);margin:8px 0 4px;">${room.mg.bonusNote}</p>`:'')+
      res.slice(3).map((r,i)=>`<div class="rank"><span class="pos">${i+4}</span><span>${pAvPose(r,22,i+4===res.length?'sad':null)} ${r.name}</span>
       <span class="hint">${r.score} pts</span><span class="gain">+${r.gain} 🪙</span></div>`).join('');
  }
  $('btnMgNext').style.display=isHost()?'block':'none';
  $('mgWaitHost').style.display=isHost()?'none':'block';
}
let advancing=false;
$('btnMgNext').onclick=async()=>{
  if(advancing) return; // anti double-tap pendant le duel final
  advancing=true;
  try{
    if(room.mgTourFini===false){
      // le mini-jeu s'est glissé au milieu du tour : on reprend simplement le plateau
      room.mgTourFini=null; room.status='board'; room.mg=null;
    } else if(room.round>=room.maxRounds){ await endGame(); }
    else { room.mgTourFini=null; advanceRoundCore(); }
    await saveRoom();
  } finally { advancing=false; }
};
function triggerFinale(){
  const f=rnd(3);
  if(f===0){
    room.finale={double:true};
    fxCast('🚨','DERNIERS TOURS !','Les cases 🪙 et 💥 valent DOUBLE : +6 / −6 !',3400);
    room.log.push('🚨 Derniers tours : cases doublées !');
  } else if(f===1){
    room.finale={promo:true}; room.starCost=10;
    fxCast('🚨','DERNIERS TOURS !','⭐ SOLDES : l\'étoile ne coûte plus que 10 🪙 !',3400);
    room.log.push('🚨 Derniers tours : étoile à 10 🪙 !');
  } else {
    room.finale={boost:true};
    const last=[...room.players].sort((a,b)=>(a.stars-b.stars)||(a.coins-b.coins))[0];
    if(pItems(last).length<2) pItems(last).push('pipe');
    addCoins(last,5);
    fxCast('🚨','DERNIERS TOURS !',last.name+' (dernier) reçoit un 🌀 Tuyau et +5 🪙 de rattrapage !',3400);
    room.log.push('🚨 Rattrapage pour '+last.name+' !');
  }
}
async function finalTieBreak(){
  // égalité parfaite en tête (étoiles ET pièces) → duel de dés en mort subite
  animBusy=true; // fige room : l'écho serveur ne doit pas remplacer nos références
  try{
    const ranked=[...room.players].sort((a,b)=>(b.stars-a.stars)||(b.coins-a.coins));
    const top=ranked[0];
    const tied=room.players.filter(p=>p.stars===top.stars&&p.coins===top.coins);
    if(tied.length<2) return;
    snd('duel');
    fxCast('⚔️','ÉGALITÉ PARFAITE !!','Duel de dés final : '+tied.map(p=>p.name).join(' 🆚 ')+' !',3000);
    await saveRoom(); await sleep(3200);
    let winners=tied;
    for(let g=0;g<6&&winners.length>1;g++){
      const rolls=winners.map(p=>({p,r:1+rnd(6)}));
      const max=Math.max(...rolls.map(x=>x.r));
      snd('dice');
      fxCast('🎲','DUEL FINAL !',rolls.map(x=>pAv(x.p,20)+' '+x.p.name+' : <b>'+x.r+'</b>').join('<br>'),2600);
      await saveRoom(); await sleep(2800);
      winners=rolls.filter(x=>x.r===max).map(x=>x.p);
    }
    const w0=winners[rnd(winners.length)];
    const w=room.players.find(p=>p.id===w0.id)||w0; // toujours l'objet du room courant
    w.stars++;
    snd('star');
    fxCast('👑','VAINQUEUR DU DUEL !',w.name+' arrache la victoire : +1 ⭐ !',3200);
    room.log.push('⚔️ '+w.name+' remporte le duel final !');
    await saveRoom(); await sleep(3400);
  } finally { animBusy=false; }
}
async function endGame(){
  const cats=[
    {icon:'💰',t:'Étoile du Richissime',d:'a gagné le plus de 🪙 au total',val:p=>p.coinsEarned||0},
    {icon:'🎮',t:'Étoile du Champion',d:'a gagné le plus de mini-jeux',val:p=>p.mgWins||0},
    {icon:'🚀',t:'Étoile du Voyageur',d:'a parcouru le plus de cases',val:p=>p.travel||0},
    {icon:'🎁',t:'Étoile de l\'Aventurier',d:'a déclenché le plus d\'événements',val:p=>p.events||0}
  ].sort(()=>Math.random()-.5).slice(0,2);
  room.bonus=[];
  for(const c of cats){
    const best=Math.max(...room.players.map(c.val));
    if(best<=0) continue; // pas d'étoile pour une stat à zéro
    const cands=room.players.filter(p=>c.val(p)===best);
    const w=cands[rnd(cands.length)];
    w.stars++;
    room.bonus.push({icon:c.icon,t:c.t,d:c.d,name:w.name,avatar:w.avatar,hero:w.hero,color:w.color,val:best});
  }
  await finalTieBreak();
  if(room.tourney){
    // tournoi : le vainqueur de la manche prend une couronne
    const ranked=[...room.players].sort((a,b)=>(b.stars-a.stars)||(b.coins-a.coins));
    const champ=ranked[0];
    room.crowns=room.crowns||{};
    room.crowns[champ.id]=(room.crowns[champ.id]||0)+1;
    room.log.push('👑 '+champ.name+' remporte la manche '+room.manche+' !');
    const maxCrowns=Math.max(...Object.values(room.crowns));
    if(maxCrowns>=2||room.manche>=3){
      room.status='ended'; // champion du tournoi
      room.log.push('🏆 Fin du tournoi !');
    } else {
      room.status='manche';
    }
    return;
  }
  room.status='ended';
  room.log.push('🏆 Fin de partie !');
}

function resetManche(){
  const cost=mapById(room.mapId).starCost||20;
  room.players.forEach(p=>{
    p.pos=0; p.coins=room.startCoins||10; p.stars=0; p.items=[];
    p.travel=0; p.mgWins=0; p.events=0; p.coinsEarned=0;
  });
  room.round=1; room.bank=0; room.traps={}; room.finale=null;
  room.starCost=cost; room.starIdx=(room.starSpots||[8])[0];
  room.bonus=null; room.lastWinner=null; room.lastMg=undefined;
  room.turn=0; room.turnFx=null;
  room.log.push('🏆 MANCHE '+room.manche+' — tout le monde repart de zéro, les couronnes restent !');
}

function renderManche(){
  show('scr-manche');
  $('mancheNum').textContent=room.manche;
  const crowns=room.crowns||{};
  const ranked=[...room.players].sort((a,b)=>(crowns[b.id]||0)-(crowns[a.id]||0)||(b.stars-a.stars)||(b.coins-a.coins));
  $('mancheRanks').innerHTML=
    (room.bonus&&room.bonus.length?`<p class="center hint">Étoiles bonus : ${room.bonus.map(b=>b.icon+' '+b.name).join(' · ')}</p>`:'')+
    ranked.map(p=>`<div class="rank${(crowns[p.id]||0)>0?' winner':''}">
      <span class="pos">${'👑'.repeat(crowns[p.id]||0)||'·'}</span>
      <span>${pAv(p,26)} ${p.name}</span>
      <span class="gain">⭐${p.stars} · 🪙${p.coins}</span></div>`).join('')+
    '<p class="center hint" style="margin-top:10px;">Premier à 2 couronnes (ou meilleur en 3 manches) 🏆</p>';
  $('btnMancheNext').style.display=isHost()?'block':'none';
  $('mancheWait').style.display=isHost()?'none':'block';
}
$('btnMancheNext').onclick=async()=>{
  if(advancing) return;
  advancing=true;
  try{
    room.manche++;
    resetManche();
    room.status='board';
    fxCast('🏆','MANCHE '+room.manche+' !','Les couronnes restent, tout le reste repart de zéro !',2600);
    await saveRoom();
  } finally { advancing=false; }
};

/* =================== fin =================== */
let bonusShown=false, endSeqDone=false, endFanfared=false;
function renderEnd(){
  show('scr-end');
  clearInterval(pollI); clearInterval(hostI);
  try{ localStorage.removeItem('fete-room'); }catch(e){}
  recordStats();
  const showRanks=()=>{
    const crowns=room.crowns||{};
    const ranked=[...room.players].sort((a,b)=>room.tourney
      ?(((crowns[b.id]||0)-(crowns[a.id]||0))||(b.stars-a.stars)||(b.coins-a.coins))
      :((b.stars-a.stars)||(b.coins-a.coins)));
    $('endTitle').textContent=room.tourney?'🏆 CHAMPION DU TOURNOI 🏆':'🏆 FIN DE PARTIE 🏆';
    const med=['🥇','🥈','🥉'], hts=[122,92,70], cols=['#FFD644','#C9D1E0','#D08B4C'];
    const order=[1,0,2].filter(i=>ranked[i]);
    $('finalRanks').innerHTML=
      `<div class="podium">`+order.map((i,k)=>`
        <div class="pod" style="animation-delay:${(i===0?0.1:0.25+k*0.12)}s;">
          <div class="pav">${pAvPose(ranked[i],i===0?58:48,i===0?'win':(i===ranked.length-1?'sad':null))}</div>
          <div class="gname">${i===0?'👑 ':''}${ranked[i].name}</div>
          <div class="base" style="height:${hts[i]}px;background:${cols[i]};">
            <div class="med">${med[i]}</div>
            <div class="g">${room.tourney?('👑'+(crowns[ranked[i].id]||0)):('⭐'+ranked[i].stars)}</div>
            <div style="font-size:11px;font-family:'Baloo 2';font-weight:700;">${room.tourney?('⭐'+ranked[i].stars+' '):''}🪙${ranked[i].coins}</div>
          </div>
        </div>`).join('')+`</div>`+
      (room.bonus?room.bonus.map(b=>
        `<div class="rank" style="border:2px solid var(--etoile);"><span class="pos">${b.icon}</span>
         <span style="font-size:14px;">${b.t}<br><span class="hint">${pAv(b,18)} ${b.name} (${b.val}) : +1 ⭐</span></span></div>`).join(''):'')+
      ranked.slice(3).map((p,i)=>`<div class="rank"><span class="pos">${i+4}</span><span>${pAvPose(p,26,i+4===ranked.length?'sad':null)} ${p.name}</span>
       <span class="gain">${room.tourney?('👑'+(crowns[p.id]||0)+' · '):''}⭐${p.stars} · 🪙${p.coins}</span></div>`).join('');
    if(!endFanfared){
      endFanfared=true; snd('fanfare'); confetti();
      setTimeout(()=>starBurst(window.innerWidth/2,220),350);
    }
  };
  const hasBonus=room.bonus&&room.bonus.length>0;
  if(hasBonus&&!bonusShown){
    bonusShown=true;
    $('finalRanks').innerHTML='<p class="center hint">Roulement de tambour… 🥁</p>';
    (async()=>{
      await sleep(700);
      for(const b of room.bonus){
        snd('star');
        fxShow({icon:b.icon,title:b.t,text:pAv(b,26)+' '+b.name+' — '+b.d+' ('+b.val+') !<br>+1 ⭐ BONUS !',ms:2800});
        await sleep(3100);
      }
      showRanks();
      endSeqDone=true;
    })();
  } else if(!hasBonus||endSeqDone) showRanks();
  // sinon : la séquence de révélation est en cours, elle affichera le classement
}
function confetti(){
  const c=document.createElement('div'); c.className='confetti'; document.body.appendChild(c);
  const cols=['#FF5FA2','#FFD644','#3EE6C1','#FF9F45','#5AC8FA'];
  for(let i=0;i<60;i++){ const p=document.createElement('i');
    p.style.left=rnd(100)+'vw'; p.style.background=cols[rnd(cols.length)];
    p.style.animationDuration=(2+Math.random()*2)+'s'; p.style.animationDelay=(Math.random()*1.5)+'s';
    c.appendChild(p); }
  setTimeout(()=>c.remove(),6000);
}
