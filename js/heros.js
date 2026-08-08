/* =================== exploits, succès & auras à débloquer (définitions) =================== */
function loadStats(){
  try{ return JSON.parse(localStorage.getItem('fete-stats'))||{}; }catch(e){ return {}; }
}
function saveStats(s){ try{ localStorage.setItem('fete-stats',JSON.stringify(s)); }catch(e){} }
/* ---------- Code Étoile : les exploits sont adossés au serveur, rien ne se perd ----------
   Le profil est fusionné (compteurs au max, succès en union) entre l'appareil et le
   serveur à chaque connexion et fin de partie. Le Code Étoile permet de tout
   retrouver sur un autre téléphone (affiché dans « Mes exploits »). */
function getStar(){ try{ return localStorage.getItem('fete-star')||''; }catch(e){ return ''; } }
function setStar(s){ try{ localStorage.setItem('fete-star',s); }catch(e){} }
function mergeStats(a,b){
  a=a||{}; b=b||{};
  const out=Object.assign({},a,b);
  ['games','wins','stars','coins','mgWins','thefts'].forEach(k=>{ out[k]=Math.max(a[k]||0,b[k]||0); });
  out.ach=Object.assign({},a.ach||{},b.ach||{});
  out.maps=Object.assign({},a.maps||{},b.maps||{});
  out.byHero={};
  new Set([...Object.keys(a.byHero||{}),...Object.keys(b.byHero||{})])
    .forEach(h=>{ out.byHero[h]=Math.max((a.byHero||{})[h]||0,(b.byHero||{})[h]||0); });
  return out;
}
function profSync(){
  if(!connected) return;
  send({t:'prof-sync', star:getStar(), data:loadStats()});
}
function profGot(m){
  if(!m.star) return;
  const merged=mergeStats(loadStats(),m.data||{});
  saveStats(merged);
  setStar(m.star);
  // les succès/skins fraîchement récupérés apparaissent immédiatement
  try{ buildAvGrid(); buildColGrid(); updatePreview(); }catch(e){}
  if(m.loaded){ snd('fanfare'); toast('★ Exploits récupérés ! ('+Object.keys(merged.ach||{}).length+' succès)'); }
}
function statTitle(w){
  return w>=10?'🏆 Légende Galactique':w>=6?'🌟 Maître de la Fête':w>=3?'🚀 Capitaine Cosmique':w>=1?'✨ Étoile Montante':'🌱 Novice de la Fête';
}
const ACHS=[
  {id:'premiere',e:'🎉',n:'Bienvenue à la Fête',d:'Jouer ta première partie en ligne',c:s=>(s.games||0)>=1},
  {id:'vainqueur',e:'👑',n:'Première Couronne',d:'Gagner une partie',c:s=>(s.wins||0)>=1},
  {id:'serial',e:'🔥',n:'Triple Couronne',d:'Gagner 3 parties',c:s=>(s.wins||0)>=3},
  {id:'marathon',e:'🏃',n:'Marathonien',d:'Jouer 10 parties',c:s=>(s.games||0)>=10},
  {id:'ninja',e:'🎮',n:'Ninja des Mini-Jeux',d:'Gagner 10 mini-jeux en tout',c:s=>(s.mgWins||0)>=10},
  {id:'voleur',e:'👻',n:'Complice du Fantôme',d:'Voler une étoile à un joueur',c:s=>(s.thefts||0)>=1},
  {id:'richard',e:'💰',n:'Richissime',d:'Finir une partie avec 60 🪙 ou plus',c:(s,g)=>g&&g.coins>=60},
  {id:'collec',e:'🌟',n:'Constellation',d:'Finir une partie avec 4 ⭐ ou plus',c:(s,g)=>g&&g.stars>=4},
  {id:'ascete',e:'🧘',n:'Mains Vides',d:'Gagner sans acheter un seul objet',c:(s,g)=>g&&g.won&&!g.itemsBought},
  {id:'globetrotteur',e:'🗺️',n:'Globe-Trotteur',d:'Jouer sur les 4 cartes',c:s=>Object.keys(s.maps||{}).length>=4},
  {id:'tournoi',e:'🏆',n:'Grand Champion',d:'Gagner un tournoi',c:(s,g)=>g&&g.tourneyWon}
];
const UNLOCK_AURAS=[
  {color:'#FFD700', name:'Or Céleste',      need:'vainqueur', hint:'gagne une partie'},
  {color:'#FF3860', name:'Rubis Ardent',    need:'serial',    hint:'gagne 3 parties'},
  {color:'#9FF7FF', name:'Diamant Lunaire', need:'marathon',  hint:'joue 10 parties'}
];
function allAuras(){
  const a=loadStats().ach||{};
  return AURAS.concat(UNLOCK_AURAS.filter(u=>a[u.need]).map(u=>u.color));
}
function checkAchievements(s,g){
  s.ach=s.ach||{};
  const fresh=[];
  ACHS.forEach(a=>{ if(!s.ach[a.id]&&a.c(s,g)){ s.ach[a.id]=1; fresh.push(a); } });
  return fresh;
}

/* =================== héros vectoriels (SVG, colorés par l'aura) =================== */
function tint(hex,f){ // éclaircit vers le blanc (f 0..1)
  const n=parseInt(hex.slice(1),16);
  const r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  const m=x=>Math.round(x+(255-x)*f);
  return '#'+((1<<24)+(m(r)<<16)+(m(g)<<8)+m(b)).toString(16).slice(1);
}
const HEROES=[
  {id:'astro', name:'Cosmo',     e:'🧑‍🚀'},
  {id:'robot', name:'Roboto',    e:'🤖'},
  {id:'alien', name:'Zigzag',    e:'👾'},
  {id:'ghost', name:'Fantômio',  e:'👻'},
  {id:'cat',   name:'Griffou',   e:'🐱'},
  {id:'uni',   name:'Étincelle', e:'🦄'},
  {id:'dino',  name:'Krokos',    e:'🦖'},
  {id:'star',  name:'Stella',    e:'⭐'},
  {id:'peng',  name:'Frisquet',  e:'🐧'},
  {id:'flam',  name:'Braise',    e:'🔥'}
];
/* skins alternatifs : costumes débloqués par les exploits (Mes exploits) */
const SKINS=[
  {id:'astro2', hero:'astro', name:'Cosmo Pirate',       e:'🏴‍☠️', need:'vainqueur'},
  {id:'robot2', hero:'robot', name:'Roboto Chevalier',   e:'⚔️',  need:'ninja'},
  {id:'ghost2', hero:'ghost', name:'Fantômio Royal',     e:'👑',  need:'serial'},
  {id:'cat2',   hero:'cat',   name:'Griffou Sorcier',    e:'🪄',  need:'voleur'},
  {id:'dino2',  hero:'dino',  name:'Krokos Dragon',      e:'🐉',  need:'marathon'},
  {id:'peng2',  hero:'peng',  name:'Frisquet Capitaine', e:'⚓',  need:'globetrotteur'}
];
function skinOf(id){ return SKINS.find(s=>s.id===id); }
function heroInner(id,C){
  C=C||'#FFD644';
  const D=shade(C,.62), T=tint(C,.55);
  switch(id){
    case 'robot': return `
      <rect x="14" y="26" width="20" height="14" rx="4" fill="${C}"/>
      <rect x="17" y="29" width="14" height="6" rx="2" fill="${D}"/>
      <circle cx="24" cy="32" r="2" fill="#FFD644"/>
      <rect x="10" y="8" width="28" height="17" rx="6" fill="${T}"/>
      <rect x="13" y="12" width="22" height="9" rx="4" fill="#1E1440"/>
      <circle cx="19" cy="16.5" r="2.4" fill="#7CF6FF"/>
      <circle cx="29" cy="16.5" r="2.4" fill="#7CF6FF"/>
      <line x1="24" y1="8" x2="24" y2="3.5" stroke="${D}" stroke-width="2"/>
      <circle cx="24" cy="3" r="2.2" fill="#FF6B6B"/>
      <rect x="6" y="27" width="6" height="9" rx="3" fill="${D}"/>
      <rect x="36" y="27" width="6" height="9" rx="3" fill="${D}"/>
      <rect x="16" y="40" width="7" height="5" rx="2.5" fill="${D}"/>
      <rect x="25" y="40" width="7" height="5" rx="2.5" fill="${D}"/>`;
    case 'alien': return `
      <ellipse cx="24" cy="36" rx="9" ry="8" fill="${C}"/>
      <path d="M24 4 C34 4 40 13 38 21 C36 29 30 32 24 32 C18 32 12 29 10 21 C8 13 14 4 24 4 Z" fill="${T}"/>
      <circle cx="17" cy="18" r="3" fill="#1E1440"/><circle cx="24" cy="20" r="3" fill="#1E1440"/><circle cx="31" cy="18" r="3" fill="#1E1440"/>
      <circle cx="17.8" cy="17.2" r="1" fill="#fff"/><circle cx="24.8" cy="19.2" r="1" fill="#fff"/><circle cx="31.8" cy="17.2" r="1" fill="#fff"/>
      <path d="M20 26 Q24 29 28 26" stroke="#1E1440" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <line x1="15" y1="6" x2="12" y2="2" stroke="${D}" stroke-width="1.8"/><circle cx="11.4" cy="1.8" r="1.8" fill="${C}"/>
      <line x1="33" y1="6" x2="36" y2="2" stroke="${D}" stroke-width="1.8"/><circle cx="36.6" cy="1.8" r="1.8" fill="${C}"/>
      <ellipse cx="13" cy="38" rx="3.4" ry="5" fill="${D}"/><ellipse cx="35" cy="38" rx="3.4" ry="5" fill="${D}"/>`;
    case 'ghost': return `
      <path d="M10 22 C10 11 16 5 24 5 C32 5 38 11 38 22 L38 40 L34 36 L30 41 L26 36.5 L22 41 L18 36 L14 41 L10 37 Z" fill="#F6F2FF"/>
      <path d="M10 22 C10 11 16 5 24 5 C32 5 38 11 38 22 L38 26 L10 26 Z" fill="${T}" opacity=".45"/>
      <circle cx="18.5" cy="19" r="3" fill="#1E1440"/><circle cx="29.5" cy="19" r="3" fill="#1E1440"/>
      <circle cx="19.4" cy="18" r="1.1" fill="#fff"/><circle cx="30.4" cy="18" r="1.1" fill="#fff"/>
      <ellipse cx="14.5" cy="24.5" rx="2.4" ry="1.6" fill="${C}" opacity=".6"/>
      <ellipse cx="33.5" cy="24.5" rx="2.4" ry="1.6" fill="${C}" opacity=".6"/>
      <path d="M21 26 Q24 29 27 26" stroke="#1E1440" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="M12 30 Q24 34 36 30" stroke="${C}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    case 'cat': return `
      <path d="M12 14 L9 3 L19 8 Z" fill="${C}"/><path d="M36 14 L39 3 L29 8 Z" fill="${C}"/>
      <path d="M12.8 12.4 L11.2 6.2 L16.8 9 Z" fill="#FFB6D9"/><path d="M35.2 12.4 L36.8 6.2 L31.2 9 Z" fill="#FFB6D9"/>
      <circle cx="24" cy="20" r="14" fill="${C}"/>
      <ellipse cx="24" cy="25" rx="8" ry="6.4" fill="${T}"/>
      <circle cx="18" cy="18" r="2.8" fill="#1E1440"/><circle cx="30" cy="18" r="2.8" fill="#1E1440"/>
      <circle cx="18.9" cy="17.1" r="1" fill="#fff"/><circle cx="30.9" cy="17.1" r="1" fill="#fff"/>
      <path d="M22.5 23 L24 24.6 L25.5 23 Z" fill="#FF8FAB"/>
      <path d="M24 24.6 L24 26.4 M24 26.4 Q21 28.6 19.4 26.8 M24 26.4 Q27 28.6 28.6 26.8" stroke="#1E1440" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="40" rx="10" ry="7" fill="${D}"/>
      <path d="M34 40 Q42 38 41 31" stroke="${D}" stroke-width="3.6" fill="none" stroke-linecap="round"/>`;
    case 'uni': return `
      <path d="M24 2 L26.6 11 L21.4 11 Z" fill="#FFD644"/>
      <path d="M13 13 Q7 20 10 28 Q4 26 4 18 Q4 11 13 13 Z" fill="${C}"/>
      <circle cx="24" cy="22" r="13.6" fill="#FDF6FF"/>
      <path d="M12 16 Q10 6 18 8 Q14 12 16 16 Z" fill="${C}"/>
      <path d="M36 16 Q38 6 30 8 Q34 12 32 16 Z" fill="${C}"/>
      <path d="M24 9 Q31 8 35 14 Q30 12 24 13 Q18 12 13 14 Q17 8 24 9 Z" fill="${C}"/>
      <circle cx="18.6" cy="21" r="2.7" fill="#1E1440"/><circle cx="29.4" cy="21" r="2.7" fill="#1E1440"/>
      <circle cx="19.5" cy="20.1" r="1" fill="#fff"/><circle cx="30.3" cy="20.1" r="1" fill="#fff"/>
      <ellipse cx="15.6" cy="26" rx="2.2" ry="1.5" fill="#FFB6D9"/><ellipse cx="32.4" cy="26" rx="2.2" ry="1.5" fill="#FFB6D9"/>
      <path d="M21 27.5 Q24 30 27 27.5" stroke="#1E1440" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="41" rx="9" ry="6" fill="${T}"/>`;
    case 'dino': return `
      <path d="M22 5 L26 0.8 L28 6 Z" fill="${D}"/><path d="M28 5.4 L33 2.6 L33.4 8 Z" fill="${D}"/>
      <ellipse cx="26" cy="15" rx="13" ry="11" fill="${C}"/>
      <ellipse cx="30" cy="18.4" rx="8" ry="6" fill="${T}"/>
      <circle cx="21" cy="13" r="2.8" fill="#1E1440"/><circle cx="30" cy="12.6" r="2.8" fill="#1E1440"/>
      <circle cx="21.9" cy="12.1" r="1" fill="#fff"/><circle cx="30.9" cy="11.7" r="1" fill="#fff"/>
      <circle cx="33" cy="17.6" r="1" fill="${D}"/><circle cx="36" cy="17.2" r="1" fill="${D}"/>
      <ellipse cx="20" cy="35" rx="12" ry="11" fill="${C}"/>
      <ellipse cx="20" cy="37" rx="7" ry="7.4" fill="${T}"/>
      <path d="M31 32 Q42 34 44 42 Q36 42 30 40 Z" fill="${C}"/>
      <ellipse cx="13" cy="45" rx="4.4" ry="2.8" fill="${D}"/><ellipse cx="25" cy="45.4" rx="4.4" ry="2.8" fill="${D}"/>`;
    case 'peng': return `
      <ellipse cx="24" cy="26" rx="14" ry="18" fill="#2B2B3B"/>
      <ellipse cx="24" cy="30" rx="9.4" ry="12.5" fill="#F6F4FF"/>
      <circle cx="18.6" cy="17" r="2.6" fill="#1E1440"/><circle cx="29.4" cy="17" r="2.6" fill="#1E1440"/>
      <circle cx="19.4" cy="16.2" r=".9" fill="#fff"/><circle cx="30.2" cy="16.2" r=".9" fill="#fff"/>
      <path d="M21 21.6 L24 25 L27 21.6 Z" fill="#FF9F45"/>
      <path d="M10.5 24 Q6 30 9.5 36 Q13 33 13.4 27 Z" fill="#2B2B3B"/>
      <path d="M37.5 24 Q42 30 38.5 36 Q35 33 34.6 27 Z" fill="#2B2B3B"/>
      <path d="M13 12 Q10 6 15.5 6.6 Q14 9 15.4 11 Z" fill="${C}"/>
      <path d="M12 13.4 Q24 5.5 36 13.4 Q24 9.5 12 13.4 Z" fill="${C}"/>
      <path d="M14 41 Q11 45 15 45.4 L20 45.4 Q21 42.6 19 41 Z" fill="#FF9F45"/>
      <path d="M34 41 Q37 45 33 45.4 L28 45.4 Q27 42.6 29 41 Z" fill="#FF9F45"/>
      <path d="M15 34 Q24 38.5 33 34" stroke="${C}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    case 'flam': return `
      <path d="M24 2 C30 10 36 13 36 24 C36 34 31 40 24 40 C17 40 12 34 12 24 C12 17 15 14 17 10 C18 15 20 16 21 15 C20 10 21 6 24 2 Z" fill="${C}"/>
      <path d="M24 12 C28 17 30 19 30 26 C30 32 27.4 35.5 24 35.5 C20.6 35.5 18 32 18 26 C18 21 20 18.6 21.4 16 C22 19 23.4 19.6 24 18.6 C23.4 16 23 14.4 24 12 Z" fill="${T}"/>
      <circle cx="20.6" cy="25.4" r="2.3" fill="#1E1440"/><circle cx="27.4" cy="25.4" r="2.3" fill="#1E1440"/>
      <circle cx="21.4" cy="24.6" r=".85" fill="#fff"/><circle cx="28.2" cy="24.6" r=".85" fill="#fff"/>
      <path d="M21.4 30 Q24 32.4 26.6 30" stroke="#1E1440" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="44" rx="8.4" ry="2.4" fill="${D}" opacity=".5"/>
      <path d="M9 30 Q6.6 26 9.6 23.6 Q10.6 26.6 12.4 27.6 Z" fill="${C}" opacity=".85"/>
      <path d="M39 30 Q41.4 26 38.4 23.6 Q37.4 26.6 35.6 27.6 Z" fill="${C}" opacity=".85"/>`;
    case 'star': return `
      <path d="M24 2 L29.4 15.8 L44 16.6 L32.6 25.6 L36.6 39.8 L24 31.8 L11.4 39.8 L15.4 25.6 L4 16.6 L18.6 15.8 Z" fill="${C}" stroke="${D}" stroke-width="1.4"/>
      <circle cx="19.6" cy="20" r="2.6" fill="#1E1440"/><circle cx="28.4" cy="20" r="2.6" fill="#1E1440"/>
      <circle cx="20.4" cy="19.1" r=".95" fill="#fff"/><circle cx="29.2" cy="19.1" r=".95" fill="#fff"/>
      <ellipse cx="16.4" cy="24.4" rx="2.1" ry="1.5" fill="#FF8FAB" opacity=".8"/>
      <ellipse cx="31.6" cy="24.4" rx="2.1" ry="1.5" fill="#FF8FAB" opacity=".8"/>
      <path d="M20.5 25.5 Q24 28.8 27.5 25.5" stroke="#1E1440" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <ellipse cx="24" cy="43.4" rx="7" ry="2.2" fill="${D}" opacity=".55"/>`;
    default: return ` <!-- astro -->
      <ellipse cx="24" cy="32" rx="12" ry="12.5" fill="${C}"/>
      <rect x="16" y="30" width="16" height="4" rx="2" fill="#fff" opacity=".5"/>
      <ellipse cx="10.5" cy="31" rx="3.4" ry="6" fill="${C}"/>
      <ellipse cx="37.5" cy="31" rx="3.4" ry="6" fill="${C}"/>
      <ellipse cx="18.5" cy="44" rx="4.4" ry="3" fill="#D9E2F5"/>
      <ellipse cx="29.5" cy="44" rx="4.4" ry="3" fill="#D9E2F5"/>
      <circle cx="24" cy="15" r="11.6" fill="#fff"/>
      <circle cx="24" cy="15.4" r="9.4" fill="#8ED4FF"/>
      <ellipse cx="20.4" cy="12" rx="3.2" ry="2" fill="#fff" opacity=".75"/>
      <circle cx="20.6" cy="16.4" r="1.7" fill="#1E1440"/><circle cx="27.4" cy="16.4" r="1.7" fill="#1E1440"/>
      <path d="M21.6 20 Q24 22 26.4 20" stroke="#1E1440" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <circle cx="24" cy="15" r="11.6" fill="none" stroke="${shade(C,.8)}" stroke-width="1.6"/>`;
  }
}
function heroSvg(id,color,size){
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" style="display:inline-block;vertical-align:middle;overflow:visible;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35));">${heroInner(id,color)}</svg>`;
}
/* portraits (menus), sprites détourés, poses (victoire/défaite) et skins :
   sondés au chargement, repli propre si l'image manque */
const HERO_OK={}, SPRITE_OK={}, POSE_OK={}, SKIN_OK={};
(function(){
  let left=HEROES.length*4+SKINS.length;
  const done=()=>{
    if(--left!==0) return;
    // rafraîchit tout ce qui affiche des héros (menu compris)
    try{ buildAvGrid(); updatePreview(); }catch(e){}
    try{
      document.querySelectorAll('#localList .prow').forEach(row=>{
        row.querySelector('.pav').innerHTML=heroThumb(HEROES[+row.dataset.h].id,AURAS[+row.dataset.c],34);
      });
    }catch(e){}
    if(typeof room!=='undefined'&&room) render();
  };
  const probe=(src,cb)=>{
    const im=new Image();
    im.onload=()=>{ cb(); done(); };
    im.onerror=done;
    im.src=src;
  };
  HEROES.forEach(h=>{
    probe('/art/hero-'+h.id+'.jpg',()=>HERO_OK[h.id]=1);
    probe('/art/sprite-'+h.id+'.png',()=>SPRITE_OK[h.id]=1);
    probe('/art/pose-'+h.id+'-win.png',()=>POSE_OK[h.id+'-win']=1);
    probe('/art/pose-'+h.id+'-sad.png',()=>POSE_OK[h.id+'-sad']=1);
  });
  SKINS.forEach(s=>probe('/art/sprite-'+s.id+'.png',()=>SKIN_OK[s.id]=1));
})();
function heroThumb(id,color,size){
  if(HERO_OK[id]) return `<img src="/art/hero-${id}.jpg" alt="" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;vertical-align:middle;border:2px solid ${color||'#FFD644'};box-shadow:0 2px 5px rgba(0,0,0,.35);">`;
  return heroSvg(id,color,size);
}
function pSpriteId(p){ // visuel en jeu : skin détouré si équipé et dispo, sinon héros de base
  if(p&&p.skin&&SKIN_OK[p.skin]) return p.skin;
  if(p&&p.hero&&SPRITE_OK[p.hero]) return p.hero;
  return null;
}
function pAv(p,size){
  const sp=pSpriteId(p);
  if(sp){
    // le personnage détouré, sans fond
    return `<img src="/art/sprite-${sp}.png" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));">`;
  }
  if(p&&p.hero) return heroSvg(p.hero,p.color||'#FFD644',size);
  return '<span style="font-size:'+Math.round(size*.82)+'px;line-height:1;">'+((p&&p.avatar)||'❔')+'</span>';
}
function pAvPose(p,size,mood){ // pose émotion (win/sad) du héros de base, repli sur pAv
  if(mood&&p){
    const sk=p.skin&&skinOf(p.skin);
    const base=sk?sk.hero:p.hero;
    if(base&&POSE_OK[base+'-'+mood])
      return `<img src="/art/pose-${base}-${mood}.png" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));">`;
  }
  return pAv(p,size);
}
function pAvBoard(p,x,y,size){ // pour l'intérieur du SVG du plateau
  const sp=pSpriteId(p);
  if(sp){
    return `<image href="/art/sprite-${sp}.png" x="${x-size/2}" y="${y-size}" width="${size}" height="${size}" preserveAspectRatio="xMidYMax meet"/>`;
  }
  if(p&&p.hero) return `<svg x="${x-size/2}" y="${y-size}" width="${size}" height="${size}" viewBox="0 0 48 48" style="overflow:visible;">${heroInner(p.hero,p.color||'#FFD644')}</svg>`;
  return `<text x="${x}" y="${y-2}" text-anchor="middle" font-size="${Math.round(size*.85)}">${(p&&p.avatar)||'❔'}</text>`;
}

/* =================== identité & créateur de perso =================== */
const AVATARS2=['🐸','🦊','🐙','🦄','🐝','🤖','🐧','🐲','🦁','🐼','👾','🐯'];
AVATARS.length=0; AVATARS.push(...AVATARS2);
const AURAS=['#FF5FA2','#FFD644','#3EE6C1','#5AC8FA','#FF9F45','#C39BFF'];
const RND_A=['Capitaine','Princesse','Docteur','Ninja','Super','Petit','Grand','Méga','Turbo','Sir'];
const RND_B=['Fusée','Étoile','Nouille','Banane','Comète','Paillette','Tonnerre','Bulle','Cactus','Pixel'];
let me={id:null,name:'',hero:HEROES[0].id,avatar:HEROES[0].e,color:AURAS[2],skin:null};
let selAv=0, selCol=2;

function updatePreview(){
  // grand portrait illustré du héros (skin en pied si équipé, repli sur le SVG)
  const pv=$('prevAv'); pv.innerHTML='';
  const im=document.createElement('img');
  if(me.skin&&SKIN_OK[me.skin]){
    im.src='/art/sprite-'+me.skin+'.png'; im.alt='';
    im.style.cssText='width:116px;height:116px;object-fit:contain;'+
      'filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));';
  } else {
    im.src='/art/hero-'+me.hero+'.jpg'; im.alt='';
    im.style.cssText='width:116px;height:116px;border-radius:26px;object-fit:cover;'+
      'box-shadow:0 8px 18px rgba(0,0,0,.45);border:3px solid '+me.color+';';
  }
  im.onerror=()=>{ pv.innerHTML=heroSvg(me.hero,me.color,66); };
  pv.appendChild(im);
  $('prevName').textContent=me.name||($('myName').value.trim())||'Ton pseudo';
  $('prevCard').style.borderColor=me.color;
  $('prevCard').style.background=`radial-gradient(circle at 50% 0%, ${me.color}55, transparent 72%), rgba(255,255,255,.07)`;
}
function buildAvGrid(){
  const g=$('avGrid'); g.innerHTML='';
  HEROES.forEach((h,i)=>{
    const d=document.createElement('div'); d.className='av'+(i===selAv&&!me.skin?' sel':'');
    d.innerHTML=heroThumb(h.id,me.color,40)+'<div class="avn">'+h.name+'</div>';
    d.onclick=()=>{ selAv=i; me.hero=h.id; me.avatar=h.e; me.skin=null; snd('tap');
      buildAvGrid(); updatePreview(); };
    g.appendChild(d);
  });
  // costumes à débloquer via Mes exploits
  const ach=loadStats().ach||{};
  SKINS.forEach(s=>{
    const un=!!ach[s.need];
    const d=document.createElement('div'); d.className='av'+(me.skin===s.id?' sel':'');
    const gray=un?'':'filter:grayscale(1) brightness(.55);';
    const vis=SKIN_OK[s.id]
      ?`<img src="/art/sprite-${s.id}.png" alt="" style="width:40px;height:40px;object-fit:contain;${gray}">`
      :`<span style="font-size:26px;line-height:40px;${gray}">${s.e}</span>`;
    d.innerHTML=vis+'<div class="avn">'+(un?'✨':'🔒')+' '+s.name+'</div>';
    d.onclick=()=>{
      if(!un){
        const a=ACHS.find(x=>x.id===s.need);
        toast('🔒 '+s.name+' — exploit « '+(a?a.n:'?')+' » : '+(a?a.d.toLowerCase():'')+' !');
        return;
      }
      const hi=HEROES.findIndex(h=>h.id===s.hero);
      selAv=hi; me.hero=s.hero; me.avatar=HEROES[hi].e; me.skin=s.id; snd('tap');
      buildAvGrid(); updatePreview();
    };
    g.appendChild(d);
  });
}
function buildColGrid(){
  const c=$('colGrid'); c.innerHTML='';
  const ach=loadStats().ach||{};
  const addSw=(col,unlocked,u)=>{
    const d=document.createElement('div');
    d.className='col'+(me.color===col?' sel':'');
    d.style.background=unlocked?col:'rgba(255,255,255,.12)';
    if(!unlocked) d.innerHTML='<span class="lk">🔒</span>';
    d.title=u?u.name:'';
    d.onclick=()=>{
      if(!unlocked){ toast('🔒 '+u.name+' : '+u.hint+' pour la débloquer !'); return; }
      me.color=col; snd('tap');
      buildColGrid(); buildAvGrid(); updatePreview();
    };
    c.appendChild(d);
  };
  AURAS.forEach(col=>addSw(col,true,null));
  UNLOCK_AURAS.forEach(u=>addSw(u.color,!!ach[u.need],u));
}
(()=>{
  buildAvGrid();
  buildColGrid();
  $('myName').addEventListener('input',()=>{ me.name=$('myName').value.trim(); updatePreview(); });
  $('btnRndName').onclick=()=>{
    const n=RND_A[rnd(RND_A.length)]+RND_B[rnd(RND_B.length)];
    $('myName').value=n; me.name=n; updatePreview();
  };
  updatePreview();
})();

async function loadMe(){
  const saved=await S.get('fete-me');
  if(saved){
    me.id=saved.id;
    if(saved.name){ me.name=saved.name; $('myName').value=saved.name; }
    if(saved.hero && HEROES.some(h=>h.id===saved.hero)){
      me.hero=saved.hero; selAv=HEROES.findIndex(h=>h.id===saved.hero);
      me.avatar=HEROES[selAv].e;
    }
    if(saved.skin){
      const s=skinOf(saved.skin);
      if(s && (loadStats().ach||{})[s.need]){
        me.skin=s.id; me.hero=s.hero;
        selAv=HEROES.findIndex(h=>h.id===s.hero);
        me.avatar=HEROES[selAv].e;
      }
    }
    if(saved.color && allAuras().includes(saved.color)){
      me.color=saved.color;
    }
    buildColGrid();
    buildAvGrid();
    updatePreview();
  }
  if(!me.id) me.id='p'+Date.now().toString(36)+rnd(999);
}
const meReady=loadMe();

function readName(){
  me.name=($('myName').value||'').trim()||('Joueur'+rnd(99));
  S.set('fete-me',{id:me.id,name:me.name,hero:me.hero,color:me.color,skin:me.skin||null});
}

