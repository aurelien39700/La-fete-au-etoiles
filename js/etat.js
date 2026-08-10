/* =================== état de partie =================== */
let room=null;          // état partagé
let roomKey='';
let pollI=null, hostI=null;
let animBusy=false;
const MAX_ROUNDS=8;
const STAR_SPOTS=[8,16,24,30];

/* ---------- objets (façon Mario Party) ---------- */
const ITEMS={
  mush:  {e:'🍄', name:'Champi Double',  price:5,  desc:'Lance 2 dés ce tour'},
  loaded:{e:'🎯', name:'Dé Pipé',        price:7,  desc:'Choisis ton chiffre (1–6)'},
  magnet:{e:'🧲', name:'Aimant',         price:8,  desc:'Vole 5 🪙 aux joueurs croisés'},
  shield:{e:'🛡️', name:'Bouclier',       price:6,  desc:'Bloque le prochain coup dur (auto)'},
  bomb:  {e:'🧨', name:'Bombe Piégée',   price:9,  desc:'Piège ta case : −12 🪙 au prochain qui s\'y arrête'},
  triple:{e:'🎲', name:'Dé Triple',      price:12, desc:'Lance 3 dés ce tour !'},
  ovni:  {e:'🛸', name:'OVNI',           price:14, desc:'Renvoie un joueur à la case départ !'},
  pipe:  {e:'🌀', name:'Tuyau Magique',  price:28, desc:'Téléporte-toi droit sur l\'étoile — ça se paie !'},
  mirror:{e:'🪞', name:'Miroir Maudit',  price:10, desc:'Échange ta place avec un joueur au choix'},
  spook: {e:'👻', name:'Fantôme Voleur', price:9,  desc:'Le fantôme vole 10 🪙 au joueur de ton choix'}
};
const ITEM_IDS=Object.keys(ITEMS);
/* vignettes illustrées des objets (repli emoji si absentes) */
const ITEM_OK={};
ITEM_IDS.forEach(id=>{
  const im=new Image();
  im.onload=()=>{ ITEM_OK[id]=1; };
  im.src='/art/item-'+id+'.png';
});
function itemPic(id,size){
  if(ITEM_OK[id]) return `<img src="/art/item-${id}.png" alt="" style="width:${size}px;height:${size}px;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4));">`;
  return `<span style="font-size:${Math.round(size*.72)}px;line-height:1;vertical-align:middle;">${ITEMS[id]?ITEMS[id].e:'❔'}</span>`;
}
function pItems(p){ if(!p.items) p.items=[]; return p.items; }
function addCoins(p,n){ if(n>0) p.coinsEarned=(p.coinsEarned||0)+n; p.coins=Math.max(0,p.coins+n); }
function popShield(p){ const it=pItems(p), i=it.indexOf('shield'); if(i>=0){ it.splice(i,1); return true; } return false; }
function starCost(){ return room.starCost||20; }

/* Cartes façon Mario Party v2 (grandes, multi-chemins) : chaque case est un nœud
   {t, x, y, next:[...], z:zone} — le plateau est un graphe fortement connexe.
   Une carte = {id, name, e, nodes, starSpots, meta:{view, isles, zones, deco}}. */
function mapFete(){
  // Île de la Fête — REFONTE : grande promenade (18 dalles larges) + Grand-Huit
  // intérieur (10), reliés par 4 échangeurs DIRECTS (pas de chapelet de cases),
  // plus un plongeon central. 31 dalles au lieu de 53 : tout se lit d'un coup.
  const nodes=[];
  const cx=220, cy=390;
  const OUT=18, ORx=185, ORy=330;   // 0..17  : grande promenade extérieure
  const INN=10, IRx=95,  IRy=200;   // 18..27 : boucle « Grand-Huit »
  for(let i=0;i<OUT;i++){
    const a=-Math.PI/2+i*2*Math.PI/OUT;
    const w=1+0.06*Math.sin(3*a+0.8);
    nodes.push({t:'blue', x:Math.round(cx+ORx*w*Math.cos(a)), y:Math.round(cy+ORy*w*Math.sin(a)), next:[(i+1)%OUT]});
  }
  for(let j=0;j<INN;j++){
    const a=-Math.PI/2+j*2*Math.PI/INN;
    nodes.push({t:'blue', x:Math.round(cx+IRx*Math.cos(a)), y:Math.round(cy+IRy*Math.sin(a)), next:[18+(j+1)%INN]});
  }
  // 28..30 : le plongeon central, du sommet du Grand-Huit jusqu'à son creux
  const T=nodes[18], B=nodes[23];
  for(let k=1;k<=3;k++){
    nodes.push({t:'blue',
      x:Math.round(cx+34*Math.sin(k*Math.PI/2.4)),
      y:Math.round(T.y+(B.y-T.y)*k/4),
      next:[k<3?28+k:23]});
  }
  // échangeurs : liaisons DIRECTES entre les deux anneaux (le pont se lit tout seul)
  nodes[5].next=[6,21];   nodes[5].labels=['🎡 Grande promenade (boutique !)','🎢 Échangeur Est → Grand-Huit !'];
  nodes[14].next=[15,26]; nodes[14].labels=['⛄ Longer la banquise','🎢 Échangeur Ouest → Grand-Huit !'];
  nodes[18].next=[19,28]; nodes[18].labels=['☄️ Suivre le Grand-Huit','🌀 Plongeon central (étoile ?)'];
  nodes[23].next=[24,9];  nodes[23].labels=['🎢 Boucler le Grand-Huit (étoile !)','🌲 Sortie Sud → Bois Étoilé'];
  nodes[27].next=[18,16]; nodes[27].labels=['☄️ Refaire un tour de Grand-Huit','❄️ Sortie Ouest → Glacier'];
  const starSpots=[3,11,16,22,25,29];
  const TYPES={start:[0], starT:starSpots, red:[4,8,13,20,26,30], lucky:[6,24],
    event:[2,10,15,19,28], shop:[5,17], boo:[12], duel:[7,21],
    bank:[9], chance:[18], bowser:[14,23]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 fête foraine (haut), 1 bois étoilé (sud-est), 2 glacier (sud-ouest),
  //         3 grand-huit des comètes (anneau intérieur + plongeon)
  nodes.forEach((n,i)=>{
    if(i<OUT) n.z = i<=5?0 : i<=10?1 : i<=15?2 : 0;
    else n.z=3;
  });
  return {
    id:'fete', name:'Île de la Fête', e:'🎪', nodes, starSpots,
    meta:{
      view:[-20,-10,480,800],
      isles:[{cx:220,cy:390,rx:230,ry:382}],
      zones:[{name:'Fête Foraine',blue:'#5AC8FA'},{name:'Bois Étoilé',blue:'#6FD69B'},
             {name:'Glacier Lunaire',blue:'#A8DCFF'},{name:'Grand-Huit des Comètes',blue:'#F09BD8'}],
      deco:[
        {x:220,y:118,e:'🎪',s:40},{x:302,y:150,e:'🎡',s:30,d:.8},{x:138,y:150,e:'🎠',s:26,d:1.4},{x:262,y:104,e:'🎈',s:20,d:.6},
        {x:330,y:566,e:'🌲',s:28,d:.3},{x:296,y:634,e:'🌳',s:24,d:1.1},{x:262,y:668,e:'🍄',s:18,d:.5},{x:356,y:520,e:'⛺',s:22,d:1.7},
        {x:112,y:566,e:'⛄',s:28,d:.6},{x:150,y:634,e:'🧊',s:20,d:1.6},{x:96,y:222,e:'❄️',s:20,d:1.2},
        {x:168,y:300,e:'☄️',s:22,d:.9},{x:272,y:300,e:'🎢',s:26,d:.4},{x:272,y:480,e:'🍭',s:22,d:1.3},{x:168,y:480,e:'🍿',s:20,d:1.8},
        {x:30,y:60,e:'🪐',s:24,d:1.8},{x:408,y:70,e:'🛸',s:20,d:2.3},{x:414,y:700,e:'🌙',s:22,d:.9},{x:34,y:706,e:'💫',s:20,d:1.5},
        {x:16,y:330,e:'☁️',s:15,st:1},{x:432,y:420,e:'☁️',s:16,st:1},{x:230,y:772,e:'☁️',s:14,st:1},
        {x:-6,y:150,e:'✦',s:13,st:1,c:'#FFD644'},{x:440,y:210,e:'✦',s:15,st:1,c:'#FF5FA2'},
        {x:436,y:560,e:'✦',s:13,st:1,c:'#3EE6C1'},{x:220,y:-2,e:'✧',s:11,st:1,c:'#5AC8FA'},{x:10,y:762,e:'✦',s:12,st:1,c:'#C39BFF'}
      ]
    }
  };
}
function mapSpirale(){
  // Spirale Céleste — REFONTE : la même descente de 2,5 tours vers le Cœur du
  // Vortex, mais en 30 dalles largement espacées au lieu de 44 serrées.
  // 0..29 : la spirale, 30 : le Cœur, 31..33 : le Trou de Ver, 34 : Pont Comète.
  const cx=215, cy=470, TURNS=2.5, K=30;
  const pos=t=>{ const a=-Math.PI/2+t*TURNS*2*Math.PI;
    return {x:cx+(205-150*t)*Math.cos(a), y:cy+(420-330*t)*Math.sin(a)}; };
  // table de longueur d'arc → pas constant le long de la spirale
  const STEPS=2500, S=[0]; let pv=pos(0);
  for(let i=1;i<=STEPS;i++){ const p=pos(i/STEPS); S.push(S[i-1]+Math.hypot(p.x-pv.x,p.y-pv.y)); pv=p; }
  const nodes=[], ts=[]; let lo=0;
  for(let i=0;i<K;i++){
    const g=S[STEPS]*i/(K-1);
    while(lo<STEPS-1&&S[lo+1]<g) lo++;
    const t=(lo+(g-S[lo])/((S[lo+1]-S[lo])||1))/STEPS;
    const p=pos(t); ts.push(t);
    nodes.push({t:'blue',x:Math.round(p.x),y:Math.round(p.y),next:[i+1]});
  }
  nodes[K-1].next=[30];                            // fin de spirale → Cœur
  nodes.push({t:'blue',x:215,y:470,next:[31]});    // 30 : le Cœur du Vortex
  // le Trou de Ver remonte par le couloir libre à gauche de la spirale
  nodes.push({t:'blue',x:158,y:458,next:[32]});    // 31 : trou de ver ↑
  nodes.push({t:'blue',x:170,y:270,next:[33,15]}); // 32 : carrefour d'éjection
  nodes.push({t:'blue',x:135,y:168,next:[0]});     // 33 : trou de ver → départ
  nodes.push({t:'blue',x:215,y:772,next:[22]});    // 34 : le Pont Comète
  // ponts stellaires : liaisons DIRECTES d'une spire à l'autre
  nodes[5].next=[6,19];   nodes[5].labels=['🌸 Grande spirale de la Nébuleuse','🌉 Pont stellaire : plonger vers la Ceinture'];
  nodes[9].next=[10,34];  nodes[9].labels=['🌌 Longer la grande spire','☄️ Pont comète : couper court (Bowser rôde !)'];
  nodes[19].next=[20,27]; nodes[19].labels=['🪨 Continuer la Ceinture d\'Astéroïdes','🌉 Pont stellaire : plonger vers l\'Aurore'];
  nodes[32].labels=['🌀 Remonter le Trou de Ver vers le départ','☄️ Éjection : retomber sur la Ceinture !'];
  const starSpots=[6,14,21,25,28,30];
  const TYPES={start:[0], starT:starSpots, red:[2,8,18,24,27], lucky:[11,31],
    event:[4,10,15,20,29], shop:[1,23], boo:[22], duel:[7,26],
    bank:[33], chance:[17], bowser:[13,34]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 nébuleuse, 1 ceinture (+ pont comète), 2 aurore, 3 cœur + trou de ver
  nodes.forEach((n,i)=>{ n.z=i<K?(ts[i]<0.4?0:(ts[i]<0.8?1:2)):(i===34?1:3); });
  return {
    id:'spirale', name:'Spirale Céleste', e:'🌀', nodes, starSpots,
    meta:{
      view:[-25,-30,490,900],
      isles:[{cx:215,cy:440,rx:238,ry:452}],
      zones:[{name:'Nébuleuse Rose',blue:'#F09BD8'},{name:'Ceinture d\'Astéroïdes',blue:'#9FB6D8'},{name:'Aurore Émeraude',blue:'#7FE3B8'},{name:'Cœur du Vortex',blue:'#C39BFF'}],
      deco:[
        {x:310,y:60,e:'🔭',s:30},{x:120,y:120,e:'💫',s:24,d:.5},{x:430,y:250,e:'🛰️',s:22,d:1.1},
        {x:375,y:585,e:'🪨',s:26,d:.3},{x:60,y:770,e:'🪨',s:24,d:.4},{x:300,y:748,e:'☄️',s:24,d:1.4},{x:82,y:560,e:'🌑',s:20,d:.8},
        {x:180,y:270,e:'✨',s:20,d:1.0},{x:310,y:420,e:'🌠',s:24,d:1.7},{x:248,y:505,e:'🌌',s:30,d:.6},
        {x:25,y:30,e:'🪐',s:24,d:1.8},{x:415,y:105,e:'🛸',s:20,d:2.3},{x:400,y:800,e:'🌙',s:22,d:.9},
        {x:35,y:250,e:'☁️',s:15,st:1},{x:420,y:640,e:'☁️',s:16,st:1},{x:90,y:855,e:'☁️',s:14,st:1},
        {x:-10,y:430,e:'✦',s:13,st:1,c:'#FFD644'},{x:440,y:380,e:'✦',s:15,st:1,c:'#FF5FA2'},
        {x:388,y:852,e:'✦',s:13,st:1,c:'#3EE6C1'},{x:120,y:-12,e:'✧',s:11,st:1,c:'#5AC8FA'},
        {x:20,y:640,e:'✦',s:12,st:1,c:'#C39BFF'},{x:330,y:-15,e:'✦',s:12,st:1,c:'#7FE3B8'}
      ]
    }
  };
}
function mapArchipel(){
  // Archipel Perdu — REFONTE : trois îles bien rondes (10 + 8 + 8 dalles larges)
  // reliées par des pontons courts. 33 dalles au lieu de 51.
  const nodes=[];
  const P=(cx,cy,rx,ry,deg)=>{ const a=deg*Math.PI/180;
    return {x:Math.round(cx+rx*Math.cos(a)), y:Math.round(cy+ry*Math.sin(a))}; };
  const ax=210, ay=140, aRx=145, aRy=112;   // île A : Plage Dorée
  const bx=120, by=440, bRx=92,  bRy=98;    // île B : Jungle Sauvage
  const gx=290, gy=740, gRx=110, gRy=105;   // île C : Grotte aux Perles
  for(let i=0;i<10;i++){ // 0..9 : boucle de la Plage
    const p=P(ax,ay,aRx,aRy,-90+i*36);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[(i+1)%10],z:0});
  }
  for(let k=0;k<8;k++){ // 10..17 : boucle de la Jungle
    const p=P(bx,by,bRx,bRy,-90+k*45);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[10+(k+1)%8],z:1});
  }
  for(let k=0;k<8;k++){ // 18..25 : boucle de la Grotte
    const p=P(gx,gy,gRx,gRy,-90+k*45);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[18+(k+1)%8],z:2});
  }
  // ponton : n dalles interpolées de from vers to (ondulation amp), zone 3
  const bridge=(from,to,n,amp)=>{
    const A=nodes[from], B=nodes[to], first=nodes.length;
    for(let s=1;s<=n;s++){
      const t=s/(n+1);
      nodes.push({t:'blue',
        x:Math.round(A.x+(B.x-A.x)*t+amp*Math.sin(t*Math.PI)),
        y:Math.round(A.y+(B.y-A.y)*t),
        next:[s<n?first+s:to], z:3});
    }
    return first;
  };
  const b1=bridge(6,10,1,0);    // 26    : Plage sud-ouest → Jungle nord
  const b2=bridge(4,18,3,34);   // 27..29: grande passerelle Plage → Grotte
  const b3=bridge(13,22,2,-24); // 30..31: Jungle sud → Grotte ouest
  const b4=bridge(17,8,1,-18);  // 32    : Jungle nord → Plage (retour)
  nodes[6].next=[7,b1];
  nodes[6].labels=['🏖️ Longer la Plage Dorée','🌉 Ponton vers la Jungle'];
  nodes[4].next=[5,b2];
  nodes[4].labels=['🏖️ Rester sur la Plage','🐚 Grande passerelle vers la Grotte'];
  nodes[13].next=[14,b3];
  nodes[13].labels=['🌴 Continuer dans la Jungle','🌉 Ponton vers la Grotte aux Perles'];
  nodes[17].next=[10,b4];
  nodes[17].labels=['🌴 Refaire un tour de Jungle','⛵ Retour vers la Plage'];
  nodes[22].next=[23,15];
  nodes[22].labels=['💎 Rester dans la Grotte','🌫️ Traversée brumeuse vers la Jungle'];
  const starSpots=[2,8,12,16,20,24];
  const TYPES={start:[0], starT:starSpots,
    red:[1,7,14,19,25,28], lucky:[5,17,31], event:[3,11,21,26,32],
    shop:[9,15], boo:[23], duel:[6,18],
    bank:[13], chance:[10], bowser:[4,29,30]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  return {
    id:'archipel', name:'Archipel Perdu', e:'🏝️', nodes, starSpots,
    meta:{
      view:[-30,-20,480,920],
      isles:[{cx:ax,cy:ay,rx:188,ry:152},{cx:bx,cy:by,rx:132,ry:138},{cx:gx,cy:gy,rx:150,ry:145}],
      zones:[{name:'Plage Dorée',blue:'#EFD48A'},{name:'Jungle Sauvage',blue:'#6FD69B'},
             {name:'Grotte aux Perles',blue:'#D8A8E0'},{name:'Pontons du Lagon',blue:'#7FD8E8'}],
      deco:[
        {x:210,y:132,e:'⛱️',s:32},{x:258,y:158,e:'🌴',s:28,d:.7},{x:162,y:168,e:'🐚',s:18,d:1.2},{x:262,y:102,e:'🦀',s:18,d:.4},
        {x:120,y:432,e:'🌴',s:34},{x:82,y:472,e:'🐒',s:20,d:.9},{x:156,y:466,e:'🌺',s:20,d:1.5},{x:96,y:398,e:'🦜',s:22,d:.3},
        {x:290,y:742,e:'🗿',s:36},{x:338,y:774,e:'💎',s:22,d:.6},{x:246,y:706,e:'🪸',s:20,d:1.3},{x:322,y:700,e:'🦪',s:20,d:1.0},
        {x:230,y:560,e:'⛵',s:22,d:1.1},{x:34,y:592,e:'🌊',s:16,st:1},{x:400,y:468,e:'🌊',s:18,st:1},{x:62,y:732,e:'🌊',s:16,st:1},{x:402,y:300,e:'🌊',s:14,st:1},
        {x:20,y:28,e:'🪐',s:24,d:1.8},{x:406,y:58,e:'🛸',s:20,d:2.3},{x:412,y:868,e:'🌙',s:22,d:.9},
        {x:42,y:250,e:'☁️',s:15,st:1},{x:392,y:590,e:'☁️',s:16,st:1},{x:72,y:862,e:'☁️',s:14,st:1},
        {x:-8,y:170,e:'✦',s:13,st:1,c:'#FFD644'},{x:426,y:182,e:'✦',s:15,st:1,c:'#FF5FA2'},
        {x:420,y:642,e:'✦',s:13,st:1,c:'#3EE6C1'},{x:210,y:-8,e:'✧',s:11,st:1,c:'#5AC8FA'},{x:16,y:522,e:'✦',s:12,st:1,c:'#C39BFF'}
      ]
    }
  };
}
function mapVolcan(){
  // REFONTE : 34 GRANDES dalles espacées (au lieu de 48 serrées) — lisible d'un
  // coup d'œil. Mêmes quartiers : pentes, caldera (2 ⭐), rivière de lave, gorge.
  const nodes=[];
  const P=(px,py,rx,ry,deg)=>{ const a=deg*Math.PI/180;
    return {x:Math.round(px+rx*Math.cos(a)), y:Math.round(py+ry*Math.sin(a))}; };
  const cx=205, cy=400, OUT=20;
  for(let i=0;i<OUT;i++){ // 0..19 : grande boucle des pentes, bord déchiqueté
    const deg=-90+i*(360/OUT);
    const w=1+0.05*Math.sin(3*deg*Math.PI/180+1.0);
    const pt=P(cx,cy,175*w,375*w,deg);
    nodes.push({t:'blue',x:pt.x,y:pt.y,next:[(i+1)%OUT]});
  }
  for(let k=0;k<8;k++){ // 20..27 : la Caldera Interdite (2 étoiles)
    const pt=P(205,280,86,104,-90+k*45);
    nodes.push({t:'blue',x:pt.x,y:pt.y,next:[20+(k+1)%8]});
  }
  // 28..31 : la Rivière de Lave — raccourci est→ouest sous la caldera
  const E=nodes[5], W=nodes[15];
  for(let j=1;j<=4;j++){
    const t=j/5;
    nodes.push({t:'blue',
      x:Math.round(E.x+(W.x-E.x)*t),
      y:Math.round(E.y+(W.y-E.y)*t+85*Math.sin(t*Math.PI)),
      next:[j<4?28+j:15]});
  }
  // 32 : la gorge d'entrée (pentes nord-est → caldera)
  nodes.push({t:'blue',x:Math.round((nodes[2].x+nodes[21].x)/2),
    y:Math.round((nodes[2].y+nodes[21].y)/2),next:[21]});
  // 33 : la coulée — sortie sud de la caldera vers la rivière
  nodes.push({t:'blue',x:Math.round((nodes[24].x+nodes[30].x)/2),
    y:Math.round((nodes[24].y+nodes[30].y)/2),next:[30]});
  // carrefours : le choix se fait sur la case même, étiquettes claires
  nodes[2].next=[3,32];
  nodes[2].labels=['🌫️ Longer les Pentes de Cendre','🔥 Monter à la Caldera (2 ⭐ !)'];
  nodes[5].next=[6,28];
  nodes[5].labels=['🏦 Descendre prudemment vers la banque','♨️ Surfer la Rivière de Lave (court… mais brûlant !)'];
  nodes[16].next=[17,26];
  nodes[16].labels=['💨 Continuer sur les cendres','🧗 Escalader jusqu\'à la Caldera (2 ⭐ !)'];
  nodes[24].next=[25,33];
  nodes[24].labels=['🔁 Refaire un tour de Caldera','🌋 Fuir par la coulée de lave'];
  const starSpots=[8,13,18,23,26,30];
  const TYPES={start:[0], starT:starSpots, red:[4,10,17,21,28,31], lucky:[3,14],
    event:[1,9,19,25,33], shop:[6,12], boo:[11], duel:[7,22],
    bank:[15], chance:[20], bowser:[27,29,32]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 pentes de cendre, 1 rivière de lave, 2 caldera, 3 plaines d'obsidienne
  nodes.forEach((n,i)=>{
    n.z=(i>=20&&i<=27)||i===32?2:((i>=28&&i<=31)||i===33?1:((i>=5&&i<=15)?3:0));
  });
  return {
    id:'volcan', name:'Volcan Maudit', e:'🌋', nodes, starSpots, starCost:15,
    meta:{
      view:[-30,-30,480,860],
      isles:[{cx:205,cy:400,rx:242,ry:428}],
      zones:[{name:'Pentes de Cendre',blue:'#B9AEC2'},{name:'Rivière de Lave',blue:'#FF9B6B'},{name:'Caldera Interdite',blue:'#E8746B'},{name:'Plaines d\'Obsidienne',blue:'#8F86B8'}],
      deco:[
        {x:205,y:278,e:'🌋',s:48},
        {x:150,y:222,e:'🔥',s:20,d:.4},{x:262,y:330,e:'🔥',s:22,d:1.1},{x:205,y:148,e:'💨',s:22,d:1.7},
        {x:96,y:118,e:'🪨',s:22,d:.8},{x:322,y:118,e:'🪨',s:20,d:.3},
        {x:255,y:470,e:'🔥',s:16,d:1.9},{x:120,y:588,e:'♨️',s:20,d:1.5},{x:300,y:560,e:'♨️',s:18,d:.9},
        {x:62,y:660,e:'🌲',s:24,d:.6},{x:298,y:678,e:'🪵',s:22,d:1.2},{x:205,y:712,e:'💀',s:20,d:.5},
        {x:20,y:28,e:'🪐',s:24,d:1.8},{x:415,y:92,e:'🛸',s:20,d:2.3},{x:412,y:700,e:'🌙',s:22,d:.9},
        {x:40,y:330,e:'☁️',s:15,st:1},{x:402,y:398,e:'☁️',s:16,st:1},{x:92,y:790,e:'☁️',s:14,st:1},
        {x:-12,y:520,e:'✦',s:13,st:1,c:'#FFD644'},{x:432,y:250,e:'✦',s:15,st:1,c:'#FF5FA2'},
        {x:396,y:802,e:'✦',s:13,st:1,c:'#3EE6C1'},{x:200,y:-18,e:'✧',s:11,st:1,c:'#5AC8FA'},{x:14,y:170,e:'✦',s:12,st:1,c:'#C39BFF'}
      ]
    }
  };
}
function mapTemple(){
  // Temple Oublié — REFONTE : la pyramide garde ses 4 étages (jungle, terrasse
  // des fauves, galerie d'or, sanctuaire) mais chaque étage est bien plus aéré,
  // et les escaliers ne font plus qu'UNE marche : 35 dalles au lieu de 56.
  const nodes=[];
  const cx=215, cy=430;
  const P=(px,py,rx,ry,deg)=>{ const a=deg*Math.PI/180;
    return {x:Math.round(px+rx*Math.cos(a)), y:Math.round(py+ry*Math.sin(a))}; };
  for(let i=0;i<14;i++){        // 0..13 : la Jungle (grande boucle au pied)
    const deg=-90+i*(360/14);
    const w=1+0.05*Math.sin(3*deg*Math.PI/180+0.7);
    const p=P(cx,cy,200*w,356*w,deg);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[(i+1)%14],z:0});
  }
  const MID=nodes.length;       // 14..21 : Terrasse des Fauves
  for(let i=0;i<8;i++){
    const p=P(cx,cy-30,142,240,-90+i*45);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[MID+(i+1)%8],z:1});
  }
  const UP=nodes.length;        // 22..27 : Galerie d'Or
  for(let i=0;i<6;i++){
    const p=P(cx,cy-58,88,146,-90+i*60);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[UP+(i+1)%6],z:2});
  }
  const SUM=nodes.length;       // 28..31 : Sanctuaire (sommet, 2 ⭐)
  for(let i=0;i<4;i++){
    const p=P(cx,cy-76,46,74,-90+i*90);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[SUM+(i+1)%4],z:3});
  }
  // les étages sont reliés DIRECTEMENT : la montée se lit d'un trait, sans
  // chapelet de petites marches qui venaient se coller aux dalles voisines
  nodes[2].next=[3,MID+1];
  nodes[2].labels=['🌿 Longer la Jungle Épaisse','🪜 Grimper vers la Terrasse des Fauves'];
  nodes[9].next=[10,MID+5];
  nodes[9].labels=['🌿 Rester dans la Jungle','🪜 Escalier ouest vers la Terrasse'];
  nodes[MID+2].next=[MID+3,UP+1];
  nodes[MID+2].labels=['🐆 Faire le tour de la Terrasse','🏺 Monter à la Galerie d\'Or'];
  nodes[MID+6].next=[MID+7,UP+4];
  nodes[MID+6].labels=['🐆 Continuer sur la Terrasse','🏺 Escalier secret vers la Galerie'];
  nodes[UP+2].next=[UP+3,SUM+1];
  nodes[UP+2].labels=['🏺 Rester dans la Galerie','☀️ Entrer dans le SANCTUAIRE (2 ⭐ !)'];
  nodes[SUM+2].next=[SUM+3,10];
  nodes[SUM+2].labels=['☀️ Refaire un tour du Sanctuaire','🌿 SAUTER À LA LIANE (retour jungle !)'];
  const starSpots=[4,11,MID+1,UP+4,SUM,SUM+3];
  const TYPES={
    start:[0], starT:starSpots,
    red:[3,8,12,MID+3,MID+7,UP+2],
    lucky:[5,MID+5,UP+5],
    event:[2,10,MID+4,UP+3],
    shop:[7,MID+6],
    boo:[13,UP+1],
    duel:[6,MID+2],
    bank:[9,UP+0],
    chance:[MID+0],
    bowser:[1,SUM+1]
  };
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  return {
    id:'temple', name:'Temple Oublié', e:'🗿', nodes, starSpots, starCost:18,
    meta:{
      view:[-30,-30,490,900],
      isles:[{cx:215,cy:420,rx:250,ry:436}],
      zones:[{name:'Jungle Épaisse',blue:'#4FB07A'},{name:'Terrasse des Fauves',blue:'#8FBF5A'},
             {name:'Galerie d\'Or',blue:'#E0B24E'},{name:'Sanctuaire du Soleil',blue:'#F2D98C'},
             {name:'Escaliers Sacrés',blue:'#9C8F72'},{name:'Lianes',blue:'#5FD9A0'}],
      deco:[
        {x:215,y:352,e:'🛕',s:46},
        {x:150,y:300,e:'🗿',s:28,d:.4},{x:284,y:306,e:'🗿',s:26,d:1.1},
        {x:215,y:250,e:'☀️',s:26,d:.8},
        {x:96,y:520,e:'🌴',s:30,d:.6},{x:330,y:544,e:'🌴',s:28,d:1.3},{x:120,y:700,e:'🌴',s:26,d:.9},
        {x:300,y:690,e:'🦜',s:22,d:.5},{x:80,y:610,e:'🐒',s:22,d:1.5},{x:340,y:430,e:'🦋',s:20,d:1.8},
        {x:180,y:760,e:'🌺',s:22,d:.3},{x:262,y:770,e:'🍃',s:20,d:1.2},
        {x:20,y:30,e:'🌙',s:24,d:1.8},{x:410,y:70,e:'✨',s:20,d:2.3},{x:400,y:800,e:'🪵',s:22,d:.9},
        {x:40,y:330,e:'☁️',s:15,st:1},{x:402,y:398,e:'☁️',s:16,st:1},{x:92,y:830,e:'☁️',s:14,st:1},
        {x:-12,y:520,e:'✦',s:13,st:1,c:'#7FE3B8'},{x:432,y:250,e:'✦',s:15,st:1,c:'#FFD644'},
        {x:396,y:842,e:'✦',s:13,st:1,c:'#3EE6C1'},{x:200,y:-18,e:'✧',s:11,st:1,c:'#9FF7FF'}
      ]
    }
  };
}
const MAP_MAKERS=[mapFete,mapSpirale,mapArchipel,mapVolcan,mapTemple];
const MAP_LIST=MAP_MAKERS.map(f=>{ const m=f(); return {id:m.id,name:m.name,e:m.e}; });
function mapById(id){
  for(const f of MAP_MAKERS){ const m=f(); if(m.id===id) return m; }
  return mapFete();
}
/* relief : chaque case reçoit une altitude h (0..3) qui donne du VOLUME au plateau.
   Le profil suit le sens de la carte : montagnes russes, spirale qui grimpe,
   îles-plateaux à falaises, volcan avec caldera au sommet. */
function computeHeights(nodes,id){
  const set=(i,h)=>{ if(nodes[i]) nodes[i].h=h; };
  nodes.forEach(n=>n.h=0);
  if(id==='fete'){
    // le Grand-Huit intérieur (28..43) est de vraies montagnes russes : 2 bosses
    const coaster=[1,2,3,3,2,1,1,2,3,3,2,1,1,1,1,1];
    for(let j=0;j<16;j++) set(28+j,coaster[j]);
    for(let i=44;i<nodes.length;i++) set(i,1); // passerelles d'accès
  } else if(id==='spirale'){
    // montée douce le long de la spirale (les spires sont proches : max 2 étages),
    // et le Cœur du Vortex trône seul au sommet (pic h3)
    for(let i=0;i<44;i++) set(i,Math.min(2,Math.floor(i/16)));
    set(44,3); set(45,2); set(46,1); set(47,1); set(48,0); set(49,0);
  } else if(id==='archipel'){
    // trois îles-plateaux : plage au niveau de la mer, jungle en terrasse,
    // grotte perchée sur sa falaise — les pontons restent au ras de l'eau
    nodes.forEach((n,i)=>{ n.h=n.z===1?1:(n.z===2?2:0); });
  } else if(id==='temple'){
    // la PYRAMIDE : chaque anneau est un étage, les escaliers montent marche à marche
    nodes.forEach((n,i)=>{
      n.h = n.z===0?0 : n.z===1?1 : n.z===2?2 : n.z===3?3 : 0;
    });
    // escaliers (z=4) et lianes (z=5) : altitude interpolée entre leurs extrémités
    const alt=i=>nodes[i]?nodes[i].h:0;
    nodes.forEach((n,i)=>{
      if(n.z!==4&&n.z!==5) return;
      const prevs=[]; nodes.forEach((m,j)=>{ if(m.next&&m.next.indexOf(i)>=0&&m.z!==4&&m.z!==5) prevs.push(j); });
      let suiv=i, garde=0;
      while(nodes[suiv]&&(nodes[suiv].z===4||nodes[suiv].z===5)&&garde++<8) suiv=nodes[suiv].next[0];
      const a=prevs.length?alt(prevs[0]):0, b=alt(suiv);
      n.h=Math.round((a+b)/2*10)/10;
    });
  } else if(id==='volcan'){
    // caldera au SOMMET (h3), gorge et coulée en pente, rivière de lave en contrebas
    nodes.forEach((n,i)=>{
      if(n.z===2) n.h=3;                 // caldera
      else if(i===46) n.h=2;             // gorge d'entrée
      else if(i===47) n.h=2;             // la coulée
      else if(n.z===1) n.h=0;            // rivière de lave (vallée)
      else if(n.z===0) n.h=1;            // pentes de cendre
      else n.h=0;                        // plaines d'obsidienne
    });
  }
  return nodes;
}
function applyMap(st,id){
  const m=mapById(id);
  st.mapId=m.id; st.board=computeHeights(m.nodes,m.id); st.mapMeta=m.meta;
  st.starSpots=m.starSpots; st.starIdx=m.starSpots[0];
  st.starCost=m.starCost||20;
  st.traps={};
  return m;
}

/* ---------- pop-ups : effets (tous les joueurs) & choix (joueur actif) ---------- */
let lastFxSeq=0;
const EVART_ICON={'🎰':'chance','👹':'bowser','👻':'boo','💀':'boo','🌟':'star','⚔️':'duel','☄️':'comet',
  '🌪️':'tornado','🌠':'rain','💨':'wind','🏦':'bank','🧨':'bombe','💥':'bombe','🛸':'ovni','🌀':'pipe'};
const EVART_OK={};
['chance','bowser','boo','star','duel','comet','tornado','rain','wind','bank','bombe','ovni','pipe'].forEach(k=>{
  const im=new Image();
  im.onload=()=>{ EVART_OK[k]=1; };
  im.src='/art/evart-'+k+'.jpg';
});
/* file d'attente des popups : chaque événement joue son temps PLEIN puis laisse
   respirer avant le suivant — plus jamais un jackpot coupé par le « tour suivant » */
let fxQueue=[], fxUntil=0, fxTimer=null;
function fxShow(f){
  fxQueue.push(f);
  if(fxQueue.length>4) fxQueue.shift(); // on ne laisse pas 20 s de retard s'accumuler
  pumpFx();
}
function pumpFx(){
  if(fxTimer) return;
  const now=Date.now();
  if(now<fxUntil){
    fxTimer=setTimeout(()=>{ fxTimer=null; pumpFx(); }, fxUntil-now+30);
    return;
  }
  const f=fxQueue.shift();
  if(!f) return;
  fxUntil=now+(f.ms||2200)+260; // 260 ms de respiration entre deux popups
  fxShowNow(f);
  if(fxQueue.length) pumpFx();
}
function fxShowNow(f){
  snd('pop');
  if(f.icon&&['👹','💥','😵','💀','🌪️','☄️'].indexOf(f.icon)>=0){
    document.body.classList.add('shake');
    setTimeout(()=>document.body.classList.remove('shake'),340);
  }
  const artK=EVART_ICON[f.icon];
  const art=(artK&&EVART_OK[artK])?`<img class="fxart" src="/art/evart-${artK}.jpg" alt="">`:'';
  const o=document.createElement('div'); o.className='ovl fx';
  o.innerHTML=`<div class="pop">${art}${art?'':`<div class="pic">${f.icon||'✨'}</div>`}<h3>${f.title||''}</h3>${f.text?`<p>${f.text}</p>`:''}</div>`;
  document.body.appendChild(o);
  setTimeout(()=>{ o.style.opacity='0'; setTimeout(()=>o.remove(),320); }, f.ms||2200);
}
function fxCast(icon,title,text,ms){
  if(!room) return;
  const seq=((room.fx&&room.fx.seq)||0)+1;
  room.fx={seq,icon,title,text,ms:ms||2200};
  lastFxSeq=seq; fxShow(room.fx);
}
function cotePanneau(){
  // sur grand écran le panneau se colle du côté OPPOSÉ au pion : on voit toujours
  // le personnage et la portion de plateau qui nous intéresse
  try{
    const el=document.querySelector('#boardWrap canvas')||document.querySelector('#boardWrap');
    if(!el) return '';
    const r=el.getBoundingClientRect();
    const pion=document.querySelector('#boardWrap .tok.cur');
    if(pion){
      const pr=pion.getBoundingClientRect();
      return (pr.left+pr.width/2)>(r.left+r.width/2)?' gauche':'';
    }
  }catch(e){}
  return '';
}
function ask(o){
  return new Promise(res=>{
    const ov=document.createElement('div'); ov.className='ovl'+(o.sheet?(' sheet'+cotePanneau()):'');
    ov.innerHTML=`<div class="pop">${o.icon?`<div class="pic">${o.icon}</div>`:''}<h3>${o.title||''}</h3>${o.text?`<p>${o.text}</p>`:''}<div class="popbtns"></div></div>`;
    const bx=ov.querySelector('.popbtns');
    o.options.forEach(op=>{
      const b=document.createElement('button'); b.className='btn '+(op.cls||'');
      b.innerHTML=op.label; b.disabled=!!op.disabled;
      b.onclick=()=>{ snd('tap'); ov.remove(); res(op.value); };
      bx.appendChild(b);
    });
    snd('pop');
    document.body.appendChild(ov);
  });
}
function askText(o){ // petite boîte de saisie (même habillage que ask)
  return new Promise(res=>{
    const ov=document.createElement('div'); ov.className='ovl';
    ov.innerHTML=`<div class="pop">${o.icon?`<div class="pic">${o.icon}</div>`:''}<h3>${o.title||''}</h3>${o.text?`<p>${o.text}</p>`:''}
      <input type="text" id="askTxtIn" placeholder="${o.placeholder||''}" maxlength="${o.max||12}"
        style="letter-spacing:4px;text-transform:uppercase;text-align:center;">
      <div class="popbtns">
        <button class="btn menthe" id="askTxtOk">${o.ok||'Valider'}</button>
        <button class="btn ghost" id="askTxtNo">Annuler</button>
      </div></div>`;
    document.body.appendChild(ov);
    const inp=ov.querySelector('#askTxtIn');
    setTimeout(()=>inp.focus(),80);
    ov.querySelector('#askTxtOk').onclick=()=>{ snd('tap'); const v=inp.value.trim(); ov.remove(); res(v||null); };
    ov.querySelector('#askTxtNo').onclick=()=>{ snd('tap'); ov.remove(); res(null); };
    snd('pop');
  });
}
function newCode(){ const A='ABCDEFGHJKMNPQRSTUVWXYZ'; let c=''; for(let i=0;i<4;i++)c+=A[rnd(A.length)]; return c; }

async function saveRoom(){
  saveSnapshot();
  if(local){ render(); return; }
  room.version=(room.version||0)+1;
  lastStateAt=Date.now();
  send({t:'update', code:room.code, state:room});
  render();
}

/* =================== créer / rejoindre =================== */
$('btnCreate').onclick=async()=>{
  readName();
  const url=getServerUrl();
  if(!url){ toast('Indique l\'adresse de ton serveur (ex : 192.168.1.10:3000) ⚙️'); $('serverAddr').focus(); return; }
  $('btnCreate').disabled=true; $('btnCreate').textContent='Connexion au serveur…';
  try{ if(!connected||wsUrl!==url) await netConnect(url); }
  catch(e){
    $('btnCreate').disabled=false; $('btnCreate').textContent='🎲 Créer une partie en ligne';
    netFail(url); return;
  }
  $('netNotice').style.display='none';
  const st={code:'', hostId:me.id, status:'lobby', version:1,
    players:[{id:me.id,name:me.name,hero:me.hero,skin:me.skin||null,avatar:me.avatar,color:me.color,pos:0,coins:10,stars:0,items:[],travel:0,mgWins:0,coinsEarned:0}],
    turn:0, round:1, maxRounds:MAX_ROUNDS, starCost:20, bank:0,
    startCoins:10, mgEvery:3, tourney:false, manche:1, crowns:{}, mgOff:[],
    log:['La partie est créée !'], mg:null, mgScores:{}};
  applyMap(st,'fete');
  const resp=await new Promise(res=>{ createResolve=res; send({t:'create', state:st});
    setTimeout(()=>{ if(createResolve){ createResolve(null); createResolve=null; } },6000); });
  $('btnCreate').disabled=false; $('btnCreate').textContent='🎲 Créer une partie en ligne';
  if(!resp){ toast('Le serveur n\'a pas répondu 😕'); return; }
  room=resp.state;
  enterRoom();
};

/* =================== mode local (un seul téléphone) =================== */
let local=false;
let localMg=null;
let localCount=0;
let localMapId='fete';
const localSet={rounds:8, coins:10, mgEvery:3, tourney:false, mgOff:[]};
const ROUND_OPTS=[6,8,10,12], COIN_OPTS=[5,10,20];
window.addEventListener('load',()=>{
  const b=$('btnLocalMap'); if(!b) return;
  b.onclick=()=>{
    const i=MAP_LIST.findIndex(m=>m.id===localMapId);
    const n=MAP_LIST[(i+1)%MAP_LIST.length];
    localMapId=n.id; snd('tap');
    b.textContent='🗺️ Carte : '+n.e+' '+n.name;
  };
  $('btnLocalRounds').onclick=()=>{
    localSet.rounds=ROUND_OPTS[(ROUND_OPTS.indexOf(localSet.rounds)+1)%ROUND_OPTS.length];
    snd('tap'); $('btnLocalRounds').textContent='🔁 '+localSet.rounds+' tours';
  };
  $('btnLocalCoins').onclick=()=>{
    localSet.coins=COIN_OPTS[(COIN_OPTS.indexOf(localSet.coins)+1)%COIN_OPTS.length];
    snd('tap'); $('btnLocalCoins').textContent='🪙 Départ '+localSet.coins;
  };
  $('btnLocalMgEvery').onclick=()=>{
    const O=[3,5,8,2];
    localSet.mgEvery=O[(O.indexOf(localSet.mgEvery)+1)%O.length];
    snd('tap'); $('btnLocalMgEvery').textContent='🎮 mini-jeu / '+localSet.mgEvery+' dés';
  };
  $('btnLocalMgPick').onclick=async()=>{
    await choisirMiniJeux(()=>localSet.mgOff,v=>{ localSet.mgOff=v; });
    $('btnLocalMgPick').textContent='🎛️ Mini-jeux ('+(MG_COUNT-localSet.mgOff.length)+')';
  };
  $('btnLocalTourney').onclick=()=>{
    localSet.tourney=!localSet.tourney;
    snd('tap');
    $('btnLocalTourney').textContent='🏆 Tournoi : '+(localSet.tourney?'OUI':'non');
    $('btnLocalTourney').classList.toggle('off',!localSet.tourney);
    if(localSet.tourney&&localSet.rounds>6){ localSet.rounds=6; $('btnLocalRounds').textContent='🔁 6 tours'; }
  };
});
/* vignette d'une ligne locale : le costume equipe s'affiche s'il correspond */
function localVignette(i,hIdx,cIdx){
  if(i===0&&me.skin&&skinOf(me.skin)&&skinOf(me.skin).hero===HEROES[hIdx].id&&window.SKIN_OK&&SKIN_OK[me.skin])
    return `<img src="/art/sprite-${me.skin}.png" alt="" style="width:34px;height:34px;object-fit:contain;">`;
  return heroThumb(HEROES[hIdx].id,AURAS[cIdx],34);
}
function addLocalRow(name){
  if(localCount>=8) return;
  const i=localCount++;
  const row=document.createElement('div'); row.className='prow';
  // la ligne 1 = le proprietaire du telephone : SON heros, donc SON costume
  const hMoi=HEROES.findIndex(h=>h.id===me.hero);
  row.dataset.h=(i===0&&hMoi>=0)?hMoi:i%HEROES.length;
  row.dataset.c=i%AURAS.length;
  row.innerHTML=`<span class="pav" style="cursor:pointer;">${localVignette(i,+row.dataset.h,+row.dataset.c)}</span>
    <input type="text" maxlength="12" placeholder="Joueur ${i+1}" value="${name||''}"
      style="flex:1; text-align:left; font-size:16px; padding:8px 12px; border-radius:12px;">`;
  row.querySelector('.pav').onclick=()=>{
    row.dataset.h=(+row.dataset.h+1)%HEROES.length; snd('tap');
    row.querySelector('.pav').innerHTML=localVignette(i,+row.dataset.h,+row.dataset.c);
  };
  $('localList').appendChild(row);
}
$('btnLocal').onclick=()=>{
  readName();
  $('localList').innerHTML=''; localCount=0;
  addLocalRow(me.name); addLocalRow('');
  show('scr-local');
};
$('btnAddLocal').onclick=()=>addLocalRow('');
$('btnStartLocal').onclick=()=>{
  const rows=[...$('localList').querySelectorAll('.prow')];
  const players=rows.map((r,i)=>({
    id:'loc'+i,
    name:(r.querySelector('input').value||'').trim()||('Joueur'+(i+1)),
    hero:HEROES[+r.dataset.h].id, avatar:HEROES[+r.dataset.h].e,
    // le costume équipé suit le propriétaire du téléphone (1er joueur, même héros)
    skin:(i===0&&me.skin&&skinOf(me.skin)&&skinOf(me.skin).hero===HEROES[+r.dataset.h].id)?me.skin:null,
    color:AURAS[+r.dataset.c], pos:0, coins:10, stars:0,
    items:[], travel:0, mgWins:0, coinsEarned:0
  }));
  if(players.length<2){ toast('Il faut au moins 2 joueurs 😉'); return; }
  local=true; roomKey='';
  clearInterval(pollI); clearInterval(hostI);
  room={code:'LOCAL', hostId:'local', status:'board', version:1,
    players, turn:0, round:1, maxRounds:localSet.rounds, starCost:20, bank:0,
    startCoins:localSet.coins, mgEvery:localSet.mgEvery, mgOff:localSet.mgOff.slice(),
    tourney:localSet.tourney, manche:1, crowns:{},
    log:['🎉 C\'est parti ! '+players[0].name+' commence.'], mg:null, mgScores:{}};
  applyMap(room, localMapId);
  room.players.forEach(p=>p.coins=localSet.coins);
  if(localSet.tourney) room.log.push('🏆 TOURNOI en 3 manches : que le meilleur gagne !');
  render();
};

$('btnGoJoin').onclick=()=>{ readName(); show('scr-join'); };

$('btnJoin').onclick=async()=>{
  readName();
  const code=($('joinCode').value||'').trim().toUpperCase();
  if(code.length!==4){ toast('Le code fait 4 lettres 😉'); return; }
  const url=getServerUrl();
  if(!url){ toast('Indique d\'abord l\'adresse du serveur sur l\'accueil ⚙️'); show('scr-home'); return; }
  try{ if(!connected||wsUrl!==url) await netConnect(url); }
  catch(e){ show('scr-home'); netFail(url); return; }
  const player={id:me.id,name:me.name,hero:me.hero,skin:me.skin||null,avatar:me.avatar,color:me.color,pos:0,coins:10,stars:0,items:[],travel:0,mgWins:0,coinsEarned:0};
  const resp=await new Promise(res=>{ joinResolve=res; send({t:'join', code, player});
    setTimeout(()=>{ if(joinResolve){ joinResolve(null); joinResolve=null; } },6000); });
  if(!resp||!resp.state) return; // l'erreur a déjà été affichée
  room=resp.state;
  enterRoom();
};

function enterRoom(){
  lastFxSeq=(room.fx&&room.fx.seq)||0;
  lastActN=room.actN||0;
  statsSaved=false; bonusShown=false; endSeqDone=false; endFanfared=false; lastTurnKey='';
  saveSnapshot();
  render();
  startHostLoop();
}
async function resumeOnline(snap){
  try{ if(!connected||wsUrl!==snap.url) await netConnect(snap.url||getServerUrl()); }
  catch(e){ return false; }
  const player={id:me.id,name:me.name||'Joueur',hero:me.hero,skin:me.skin||null,avatar:me.avatar,color:me.color,pos:0,coins:10,stars:0,items:[],travel:0,mgWins:0,coinsEarned:0};
  let resp=await new Promise(res=>{ joinResolve=res; send({t:'join', code:snap.state.code, player});
    setTimeout(()=>{ if(joinResolve){ joinResolve(null); joinResolve=null; } },5000); });
  if(!resp||!resp.state){
    // le serveur a perdu le salon (redémarrage) → on lui ré-injecte la partie sauvegardée
    resp=await new Promise(res=>{ joinResolve=res; send({t:'restore', state:snap.state, playerId:me.id});
      setTimeout(()=>{ if(joinResolve){ joinResolve(null); joinResolve=null; } },5000); });
  }
  if(!resp||!resp.state) return false;
  room=resp.state;
  enterRoom();
  toast('↻ Partie reprise !');
  return true;
}
window.addEventListener('load',()=>{
  const b=$('btnResume'); if(!b) return;
  let snap=null;
  try{ snap=JSON.parse(localStorage.getItem('fete-room')); }catch(e){}
  const fresh=snap&&snap.state&&snap.state.code&&Date.now()-(snap.at||0)<3*3600*1000&&snap.state.status!=='ended';
  if(!fresh) return;
  if(snap.local){
    b.style.display='block';
    b.textContent='↩️ Reprendre la partie locale ('+(snap.state.players||[]).map(p=>p.name).join(', ').slice(0,30)+')';
    b.onclick=()=>{
      snd('tap');
      local=true; room=snap.state; localMapId=room.mapId||'fete';
      statsSaved=false; bonusShown=false; endSeqDone=false; endFanfared=false; lastTurnKey='';
      lastActN=room.actN||0;
      render();
    };
    return;
  }
  // partie en ligne : reprise AUTOMATIQUE
  b.style.display='block';
  b.disabled=true;
  b.textContent='↻ Reconnexion à la partie '+snap.state.code+'…';
  (async()=>{
    await meReady;
    const ok=await resumeOnline(snap);
    if(ok){ b.style.display='none'; return; }
    b.disabled=false;
    b.textContent='↩️ Reprendre la partie '+snap.state.code;
    b.onclick=async()=>{
      b.disabled=true;
      const ok2=await resumeOnline(snap);
      if(!ok2){
        b.style.display='none';
        try{ localStorage.removeItem('fete-room'); }catch(e){}
        toast('Impossible de reprendre cette partie 😕');
      }
    };
  })();
});

