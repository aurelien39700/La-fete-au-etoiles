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
  ovni:  {e:'🛸', name:'OVNI',           price:13, desc:'Renvoie un joueur à la case départ !'},
  pipe:  {e:'🌀', name:'Tuyau Magique',  price:15, desc:'Téléporte-toi sur l\'étoile !'}
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
  // Île de la Fête v2 — fête foraine céleste : grande promenade extérieure
  // + Grand-Huit intérieur reliés par 2 échangeurs, plus un plongeon central.
  const nodes=[];
  const cx=220, cy=390;
  const OUT=28, ORx=185, ORy=330;   // 0..27  : grande boucle extérieure
  const INN=16, IRx=95,  IRy=200;   // 28..43 : boucle « Grand-Huit »
  for(let i=0;i<OUT;i++){
    const a=-Math.PI/2+i*2*Math.PI/OUT;
    const w=1+0.06*Math.sin(3*a+0.8);
    nodes.push({t:'blue', x:Math.round(cx+ORx*w*Math.cos(a)), y:Math.round(cy+ORy*w*Math.sin(a)), next:[(i+1)%OUT]});
  }
  for(let j=0;j<INN;j++){
    const a=-Math.PI/2+j*2*Math.PI/INN;
    nodes.push({t:'blue', x:Math.round(cx+IRx*Math.cos(a)), y:Math.round(cy+IRy*Math.sin(a)), next:[28+(j+1)%INN]});
  }
  // échangeurs Est/Ouest : 4 passerelles au point médian (44..47)
  const mid=(a,b)=>({t:'blue', x:Math.round((nodes[a].x+nodes[b].x)/2), y:Math.round((nodes[a].y+nodes[b].y)/2), next:[b]});
  nodes.push(mid(6,31));   // 44 : entrée Est   (ext 6  → int 31)
  nodes.push(mid(33,8));   // 45 : sortie Est   (int 33 → ext 8)
  nodes.push(mid(20,39));  // 46 : entrée Ouest (ext 20 → int 39)
  nodes.push(mid(41,22));  // 47 : sortie Ouest (int 41 → ext 22)
  // plongeon central : du sommet (28) au creux (36) du Grand-Huit (48..52)
  const SC=5, T=nodes[28], B=nodes[36];
  for(let k=1;k<=SC;k++){
    nodes.push({t:'blue',
      x:Math.round(cx+30*Math.sin(k*Math.PI/3)),
      y:Math.round(T.y+(B.y-T.y)*k/(SC+1)),
      next:[k<SC?48+k:36]});
  }
  // carrefours (vrais choix de route)
  nodes[6].next=[7,44];   nodes[6].labels=['🎡 Grande promenade (boutique !)','🎢 Échangeur Est → Grand-Huit !'];
  nodes[20].next=[21,46]; nodes[20].labels=['⛄ Longer la banquise','🎢 Échangeur Ouest → Grand-Huit !'];
  nodes[28].next=[29,48]; nodes[28].labels=['☄️ Suivre le Grand-Huit','🌀 Plongeon central (étoile ?)'];
  nodes[33].next=[34,45]; nodes[33].labels=['🎢 Boucler le Grand-Huit (étoile !)','🌲 Sortie Est → Bois Étoilé'];
  nodes[41].next=[42,47]; nodes[41].labels=['☄️ Remonter le Grand-Huit','❄️ Sortie Ouest → Glacier'];
  const starSpots=[3,11,17,24,34,50];
  const TYPES={start:[0], starT:starSpots, red:[5,13,21,30,38,52], lucky:[10,46],
    event:[2,9,16,26,42], shop:[7,40], boo:[25], duel:[14,32],
    bank:[19], chance:[29], bowser:[37,49]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 fête foraine (haut), 1 bois étoilé (sud-est), 2 glacier (sud-ouest),
  //         3 grand-huit des comètes (boucle intérieure + plongeon)
  nodes.forEach((n,i)=>{
    if(i<OUT){ n.z = i<=8?0 : i<=15?1 : i<=23?2 : 0; }
    else if(i<44) n.z=3;
    else if(i===44) n.z=0;
    else if(i===45) n.z=1;
    else n.z=(i<=47)?2:3;
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
  // Spirale Céleste v2 : vraie spirale de 2,5 tours qui plonge vers le Cœur du Vortex.
  // 0..43 : la spirale (nœuds équidistants par longueur d'arc), 44 : le Cœur,
  // 45..48 : le Trou de Ver (remontée vers le départ), 49 : milieu du Pont Comète.
  // 3 ponts stellaires coupent d'une spire à l'autre : 7→28 (droite), 13→49→32 (bas), 28→41 (plongée).
  const cx=215, cy=470, TURNS=2.5, K=44;
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
  nodes[K-1].next=[44]; // fin de spirale → Cœur
  nodes.push({t:'blue',x:215,y:470,next:[45]});    // 44 : le Cœur du Vortex
  nodes.push({t:'blue',x:215,y:385,next:[46]});    // 45 : trou de ver ↑
  nodes.push({t:'blue',x:215,y:280,next:[47,24]}); // 46 : carrefour d'éjection
  nodes.push({t:'blue',x:215,y:218,next:[48]});    // 47 : trou de ver ↑
  nodes.push({t:'blue',x:215,y:134,next:[0]});     // 48 : trou de ver → départ
  nodes.push({t:'blue',x:215,y:758,next:[32]});    // 49 : milieu du Pont Comète
  // ponts stellaires : carrefours (vrais choix de route)
  nodes[7].next=[8,28];   nodes[7].labels=['🌸 Grande spirale de la Nébuleuse','🌉 Pont stellaire : plonger vers la Ceinture'];
  nodes[13].next=[14,49]; nodes[13].labels=['🌌 Longer la grande spire','☄️ Pont comète : couper court (Bowser rôde !)'];
  nodes[28].next=[29,41]; nodes[28].labels=['🪨 Continuer la Ceinture d\'Astéroïdes','🌉 Pont stellaire : plonger vers l\'Aurore'];
  nodes[46].labels=['🌀 Remonter le Trou de Ver vers le départ','☄️ Éjection : retomber sur la Ceinture !'];
  const starSpots=[9,20,30,37,42,44];
  const TYPES={start:[0], starT:starSpots, red:[3,12,26,35,41], lucky:[16,45],
    event:[5,14,22,31,43], shop:[2,34], boo:[33], duel:[10,36],
    bank:[47], chance:[25], bowser:[40,49]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 nébuleuse (1er tour), 1 ceinture (2e tour + pont comète), 2 aurore (spire finale), 3 cœur + trou de ver
  nodes.forEach((n,i)=>{ n.z=i<K?(ts[i]<0.4?0:(ts[i]<0.8?1:2)):(i===49?1:3); });
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
  // Archipel Perdu v2 — trois îles reliées par cinq pontons (zone à part) :
  // Plage Dorée (haut) ⇄ Jungle Sauvage (milieu-gauche) ⇄ Grotte aux Perles (bas-droite)
  const nodes=[];
  const P=(cx,cy,rx,ry,deg)=>{ const a=deg*Math.PI/180;
    return {x:Math.round(cx+rx*Math.cos(a)), y:Math.round(cy+ry*Math.sin(a))}; };
  const ax=210, ay=140, aRx=145, aRy=112;   // île A : Plage Dorée
  const bx=120, by=440, bRx=92,  bRy=98;    // île B : Jungle Sauvage
  const gx=290, gy=740, gRx=110, gRy=105;   // île C : Grotte aux Perles
  for(let i=0;i<14;i++){ // 0..13 : boucle de la Plage
    const p=P(ax,ay,aRx,aRy,-90+i*(360/14));
    nodes.push({t:'blue',x:p.x,y:p.y,next:[(i+1)%14],z:0});
  }
  for(let k=0;k<12;k++){ // 14..25 : boucle de la Jungle
    const p=P(bx,by,bRx,bRy,-90+k*30);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[14+(k+1)%12],z:1});
  }
  for(let k=0;k<12;k++){ // 26..37 : boucle de la Grotte
    const p=P(gx,gy,gRx,gRy,-90+k*30);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[26+(k+1)%12],z:2});
  }
  // ponton : n nœuds interpolés de from vers to (ondulation amp), zone 3
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
  const b1=bridge(9,14,2,0);    // 38..39 : Plage sud-ouest → Jungle nord
  const b2=bridge(6,26,4,26);   // 40..43 : grande passerelle Plage → Grotte
  const b3=bridge(19,36,2,-18); // 44..45 : Jungle sud-est → Grotte nord-ouest
  const b4=bridge(25,10,2,-20); // 46..47 : Jungle nord-ouest → Plage (retour)
  const b5=bridge(35,21,3,0);   // 48..50 : Grotte ouest → Jungle sud (retour)
  nodes[9].next=[10,b1];
  nodes[9].labels=['🏖️ Longer la Plage Dorée','🌉 Ponton vers la Jungle'];
  nodes[6].next=[7,b2];
  nodes[6].labels=['🏖️ Rester sur la Plage','🐚 Grande passerelle vers la Grotte'];
  nodes[19].next=[20,b3];
  nodes[19].labels=['🌴 Continuer dans la Jungle','🌉 Ponton vers la Grotte aux Perles'];
  nodes[25].next=[14,b4];
  nodes[25].labels=['🌴 Refaire un tour de Jungle','⛵ Retour vers la Plage'];
  nodes[35].next=[36,b5];
  nodes[35].labels=['💎 Rester dans la Grotte','🌫️ Ponton brumeux vers la Jungle'];
  const starSpots=[3,11,20,29,33];
  const TYPES={start:[0], starT:starSpots,
    red:[2,8,16,23,31,41,49], lucky:[5,22,37], event:[1,15,27,36,46],
    shop:[4,18,30], boo:[13,34], duel:[10,21,32],
    bank:[17], chance:[24], bowser:[7,42,48]};
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
  // grande boucle des pentes + rivière de lave traversante + caldera intérieure (2 étoiles)
  const nodes=[];
  const cx=205, cy=400, OUT=30;
  const P=(px,py,rx,ry,deg)=>{ const a=deg*Math.PI/180;
    return {x:Math.round(px+rx*Math.cos(a)), y:Math.round(py+ry*Math.sin(a))}; };
  for(let i=0;i<OUT;i++){ // 0..29 : grande boucle des pentes (bord déchiqueté)
    const deg=-90+i*(360/OUT);
    const w=1+0.05*Math.sin(3*deg*Math.PI/180+1.0);
    const p=P(cx,cy,175*w,375*w,deg);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[(i+1)%OUT]});
  }
  for(let k=0;k<10;k++){ // 30..39 : la Caldera Interdite (boucle intérieure, 2 étoiles)
    const p=P(205,280,82,100,-90+k*36);
    nodes.push({t:'blue',x:p.x,y:p.y,next:[30+(k+1)%10]});
  }
  // 40..45 : la Rivière de Lave — traversée est→ouest sous la caldera (raccourci brûlant)
  const E=nodes[8], W=nodes[21];
  for(let j=1;j<=6;j++){
    const t=j/7;
    nodes.push({t:'blue',
      x:Math.round(E.x+(W.x-E.x)*t),
      y:Math.round(E.y+(W.y-E.y)*t+80*Math.sin(t*Math.PI)),
      next:[j<6?40+j:21]});
  }
  // 46 : gorge d'entrée de la caldera (depuis les pentes est)
  nodes.push({t:'blue',x:Math.round((nodes[3].x+nodes[31].x)/2),
    y:Math.round((nodes[3].y+nodes[31].y)/2),next:[31]});
  // 47 : la coulée — sortie sud de la caldera qui rejoint la rivière
  nodes.push({t:'blue',x:Math.round((nodes[35].x+nodes[42].x)/2),
    y:Math.round((nodes[35].y+nodes[42].y)/2),next:[42]});
  // carrefours (vrais choix de route)
  nodes[3].next=[4,46];
  nodes[3].labels=['🌫️ Longer les Pentes de Cendre','🔥 Plonger dans la Caldera (2 ⭐ !)'];
  nodes[8].next=[9,40];
  nodes[8].labels=['🏦 Descente prudente vers la banque','♨️ Surfer la Rivière de Lave (court… mais brûlant !)'];
  nodes[24].next=[25,37];
  nodes[24].labels=['💨 Continuer sur les cendres','🧗 Escalader jusqu\'à la Caldera (2 ⭐ !)'];
  nodes[35].next=[36,47];
  nodes[35].labels=['🔁 Refaire un tour de Caldera','🌋 Fuir par la coulée de lave'];
  const starSpots=[12,18,27,32,38,43];
  const TYPES={start:[0], starT:starSpots, red:[2,7,16,22,31,36,40,44], lucky:[6,23],
    event:[1,15,28,37,47], shop:[4,17], boo:[25], duel:[11,20],
    bank:[9], chance:[14], bowser:[34,41,46]};
  for(const t in TYPES) TYPES[t].forEach(i=>{ if(nodes[i]) nodes[i].t=t; });
  // zones : 0 pentes de cendre (haut), 1 rivière de lave, 2 caldera, 3 plaines d'obsidienne (bas)
  nodes.forEach((n,i)=>{
    n.z=(i>=30&&i<=39)||i===46?2:((i>=40&&i<=45)||i===47?1:((i>=8&&i<=22)?3:0));
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
const MAP_MAKERS=[mapFete,mapSpirale,mapArchipel,mapVolcan];
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
    startCoins:10, mgEvery:1, tourney:false, manche:1, crowns:{},
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
const localSet={rounds:8, coins:10, mgEvery:1, tourney:false};
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
    localSet.mgEvery=localSet.mgEvery===1?2:1;
    snd('tap'); $('btnLocalMgEvery').textContent=localSet.mgEvery===1?'🎮 Chaque tour':'🎮 1 tour sur 2';
  };
  $('btnLocalTourney').onclick=()=>{
    localSet.tourney=!localSet.tourney;
    snd('tap');
    $('btnLocalTourney').textContent='🏆 Tournoi : '+(localSet.tourney?'OUI':'non');
    $('btnLocalTourney').classList.toggle('off',!localSet.tourney);
    if(localSet.tourney&&localSet.rounds>6){ localSet.rounds=6; $('btnLocalRounds').textContent='🔁 6 tours'; }
  };
});
function addLocalRow(name){
  if(localCount>=6) return;
  const i=localCount++;
  const row=document.createElement('div'); row.className='prow';
  row.dataset.h=i%HEROES.length; row.dataset.c=i%AURAS.length;
  row.innerHTML=`<span class="pav" style="cursor:pointer;">${heroThumb(HEROES[i%HEROES.length].id,AURAS[i%AURAS.length],34)}</span>
    <input type="text" maxlength="12" placeholder="Joueur ${i+1}" value="${name||''}"
      style="flex:1; text-align:left; font-size:16px; padding:8px 12px; border-radius:12px;">`;
  row.querySelector('.pav').onclick=()=>{
    row.dataset.h=(+row.dataset.h+1)%HEROES.length; snd('tap');
    row.querySelector('.pav').innerHTML=heroThumb(HEROES[+row.dataset.h].id,AURAS[+row.dataset.c],34);
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
    startCoins:localSet.coins, mgEvery:localSet.mgEvery,
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

