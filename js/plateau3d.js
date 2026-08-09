/* =================== plateau voxel 3D (three.js) ===================
   Remplace le rendu SVG du plateau par un diorama 3D temps réel.
   - mêmes données que la 2D : room.board {t,x,y,h,z,next}, room.mapId
   - ÉCHELLES UNIFIÉES : tout dérive de TILE (largeur d'une dalle)
   - repli automatique sur le SVG si WebGL indisponible
   Module ES (three via importmap) ; expose window.B3D pour les scripts classiques. */
import * as THREE from 'three';
import {GLTFLoader} from '/js/GLTFLoader.js';
import {clone as cloneSkinned} from '/js/SkeletonUtils.js';

/* ---------- échelles (la consigne : des proportions justes partout) ---------- */
const SC=1/9.6;          // 1 unité monde ≈ 11,5 px de carte 2D
const TILE=3.0;           // largeur d'une dalle
const TILE_H=0.34;        // épaisseur du plateau de dalle
const ETAGE=1.35;         // hauteur d'un étage de relief (h)
const HERO_H=TILE*0.59;   // héros à l'échelle du diorama (~0,6 dalle de haut)
const EL_H=TILE*0.56;     // les éléments posés sur les cases (pièce, cadeau…)
const STEP_W=TILE*0.29;   // pas japonais des routes

const TYPE_COL={start:0xEDE7FF,blue:0x8F86C8,red:0xE85A50,lucky:0x3EE6C1,event:0xFF9F45,
  starT:0x8E7CFF,shop:0xC39BFF,boo:0xB9A8E8,duel:0xFF8FAB,bank:0xF0C34E,chance:0xFF9FF3,bowser:0x6B4A9E};
const TYPE_EMIT={red:0x571510,lucky:0x0E4A3C,event:0x50290A,starT:0x241A5E,shop:0x33205E,
  boo:0x2A2050,duel:0x53202E,bank:0x4A3A0E,chance:0x4A2545,bowser:0x241040,start:0x333055,blue:0x191430};
/* teinte des éléments 3D posés sur les dalles */
const EL_COL={blue:0xFFD644,starT:0xC9BBFF,event:0xFF7BAC,lucky:0x3EE6C1,red:0x2B2235,
  duel:0xC9D1E0,boo:0xF3EFFF,bank:0xC98B3A,chance:0xFFF3D6,bowser:0xE8D9C4,shop:0xC39BFF,start:0xF3EFFF};
/* palette du socle voxel par carte */
const SOCLE={
  volcan:  {a:0x241B44,b:0x2B2152,glow:0xFF5A18,glowC:0xFF6A22},
  fete:    {a:0x2A1C50,b:0x33235E,glow:0xFFB400,glowC:0xFFD644},
  spirale: {a:0x201847,b:0x281E54,glow:0xC96BB8,glowC:0xF09BD8},
  archipel:{a:0x232045,b:0x2A2650,glow:0x18B89A,glowC:0x3EE6C1},
  temple:  {a:0x1E2E24,b:0x25382C,glow:0xE0B24E,glowC:0xF2D98C}
};
/* ambiance complète par carte : ciel, brume, lumières, océan sous l'île */
const AMBIANCE={
  volcan:  {sky:0x190F28,sun:0xFFC9A0,amb:0x8A6A90,sea:0x3A1006,seaGlow:0xFF5A18},
  fete:    {sky:0x171030,sun:0xFFE2C4,amb:0x8A78C8,sea:0x1E1442,seaGlow:0xFFD644},
  spirale: {sky:0x120C2C,sun:0xEDC6FF,amb:0x7A68B8,sea:0x160F3C,seaGlow:0xC96BB8},
  archipel:{sky:0x0E1A32,sun:0xCFE6FF,amb:0x5C7AAA,sea:0x0A3448,seaGlow:0x3EE6C1},
  temple:  {sky:0x0C1A14,sun:0xE8F0C0,amb:0x6A8A70,sea:0x123020,seaGlow:0x4FB07A}
};

const B3D={ready:false,ok:false,built:'',pions:{},focusId:null};
window.B3D=B3D;

/* panoramas 360° d'ambiance (fond de diorama, tourne avec la caméra) */
const PANO={};
['volcan','fete','spirale','archipel','temple'].forEach(k=>{
  new THREE.TextureLoader().load('/art/pano-'+k+'.jpg',t=>{
    t.mapping=THREE.EquirectangularReflectionMapping;
    t.colorSpace=THREE.SRGBColorSpace;
    PANO[k]=t;
    B3D.built='';
    try{ if(window.room&&room.status==='board'&&typeof render==='function') render(); }catch(e){}
  });
});
/* textures Meshy plaquées sur les blocs du socle (une par thème de carte) */
const VOXTEX={};
['volcan','fete','spirale','archipel','temple'].forEach(k=>{
  new THREE.TextureLoader().load('/art/voxtex-'+k+'.jpg',t=>{
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=THREE.SRGBColorSpace;
    t.repeat.set(.5,.5); // un bloc = un fragment lisible de la matière
    VOXTEX[k]=t;
    B3D.built=''; // reconstruire avec la matière dès qu'elle arrive
    try{ if(window.room&&room.status==='board'&&typeof render==='function') render(); }catch(e){}
  });
});

let scene,cam,renderer,wrap,canvas;
let gStatic=null,gReach=null,gTraps=null,gPions=null,gFx=null;
let sun,amb,lavaLight,embers=null,embV=[],embGeo=null;
let rims=[],bobs=[],spinners=[],mixers=[],puffs=[];
let CENTER=new THREE.Vector3(), SPAN=30;
let BOUNDS={minX:-20,maxX:20,minZ:-30,maxZ:30};
let FOCUS=new THREE.Vector3(), focusTarget=new THREE.Vector3(); // caméra qui suit le joueur actif
let vClose=16, vFull=30, vCur=22;    // zoom suivi / zoom vue d'ensemble (lerpé)
B3DoverviewInit();
function B3DoverviewInit(){ B3D.overview=false; }
let azim=Math.PI/4, azimBase=Math.PI/4, dragX=null, dragMoved=false;
let lastT=performance.now();

const toW=n=>new THREE.Vector3((n.x-210)*SC,(n.h||0)*ETAGE,(n.y-390)*SC);

/* ---------- assets 3D : éléments de cases + héros (chargés une fois) ---------- */
const loader=new GLTFLoader();
const EL3D={};      // type -> {scene, ok}
const HERO3D={};    // heroId -> {gltf, ok}
const EL_TYPES=['blue','starT','event','lucky','red','duel','boo','bank','chance','bowser','shop','start'];
EL_TYPES.forEach(t=>{
  loader.load('/art/el3d-'+t+'.glb',g=>{
    // normalise : ancré au sol, EL_H de haut, matériau flat coloré (style voxel)
    const m=g.scene;
    let bb=new THREE.Box3().setFromObject(m);
    let size=bb.getSize(new THREE.Vector3());
    // une pièce générée couchée (plate) se redresse comme une pièce de jeu
    if(t==='blue'&&size.y<Math.min(size.x,size.z)*.6){ m.rotation.x=Math.PI/2; m.updateMatrixWorld(true); }
    bb=new THREE.Box3().setFromObject(m);
    size=bb.getSize(new THREE.Vector3());
    const s=EL_H/Math.max(.0001,size.y);
    m.scale.setScalar(s);
    m.updateMatrixWorld(true);
    bb.setFromObject(m);
    m.position.set(-(bb.min.x+bb.max.x)/2,-bb.min.y,-(bb.min.z+bb.max.z)/2);
    const mat=new THREE.MeshStandardMaterial({color:EL_COL[t]||0xC9BBFF,roughness:.6,flatShading:true});
    m.traverse(o=>{ if(o.isMesh){ o.material=mat; o.castShadow=true; } });
    const holder=new THREE.Group(); holder.add(m);
    EL3D[t]={scene:holder,ok:1};
    B3D.built=''; // les dalles se reconstruisent avec l'élément
    try{ if(window.room&&room.status==='board'&&typeof render==='function') render(); }catch(e){}
  },undefined,()=>{ EL3D[t]={ok:0}; });
});
function heroGLB(id,cb){
  const e=HERO3D[id];
  if(e){
    if(e.ok) cb(e.gltf);
    else if(!e.fail) (e.q=e.q||[]).push(cb); // le modèle arrive : on prend la file
    return;
  }
  HERO3D[id]={ok:0,q:[cb]};
  loader.load('/art/hero3d-'+id+'-anim.glb',g=>{
    const q=(HERO3D[id]&&HERO3D[id].q)||[];
    HERO3D[id]={ok:1,gltf:g};
    q.forEach(f=>{ try{ f(g); }catch(err){} }); // TOUS les joueurs servis
  },undefined,()=>{ HERO3D[id]={ok:0,fail:1}; });
}

/* ---------- textures canvas (icônes de secours, pastilles) ---------- */
function canvasTex(draw){
  const c=document.createElement('canvas'); c.width=c.height=96;
  draw(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
const texCache={};
function badgeTex(txt,bg,fg){
  const k='b'+txt+bg;
  if(!texCache[k]) texCache[k]=canvasTex(g=>{
    g.beginPath(); g.arc(48,48,40,0,7); g.fillStyle=bg; g.fill();
    g.lineWidth=6; g.strokeStyle='rgba(255,255,255,.85)'; g.stroke();
    g.font='800 46px "Baloo 2",sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    g.fillStyle=fg; g.fillText(txt,48,52);
  });
  return texCache[k];
}
function nomTex(nom,couleur){
  const k='n'+nom+couleur;
  if(texCache[k]) return texCache[k];
  const c=document.createElement('canvas'); c.width=256; c.height=72;
  const g=c.getContext('2d');
  const txt=(nom||'?').slice(0,12);
  g.font='800 34px "Baloo 2", sans-serif';
  const w=Math.min(248,g.measureText(txt).width+34), x=(256-w)/2;
  // pastille sombre + liseré à la couleur du joueur : lisible sur n'importe quel décor
  g.fillStyle='rgba(16,10,38,.82)';
  g.beginPath(); g.roundRect(x,10,w,44,22); g.fill();
  g.lineWidth=4; g.strokeStyle=couleur||'#FFD644'; g.stroke();
  g.font='800 34px "Baloo 2", sans-serif';
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#FFF7FF'; g.fillText(txt,128,33);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  texCache[k]=t;
  return t;
}
function emojiTex(ch){
  const k='e'+ch;
  if(!texCache[k]) texCache[k]=canvasTex(g=>{
    g.font='68px serif'; g.textAlign='center'; g.textBaseline='middle';
    g.shadowColor='rgba(0,0,0,.55)'; g.shadowBlur=8; g.shadowOffsetY=3;
    g.fillText(ch,48,52);
  });
  return texCache[k];
}

/* ---------- init ---------- */
function init(){
  wrap=document.getElementById('boardWrap');
  if(!wrap) return false;
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x171030);
  scene.fog=new THREE.Fog(0x171030,80,190);
  cam=new THREE.OrthographicCamera(-1,1,1,-1,1,420);
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(2,devicePixelRatio));
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  canvas=renderer.domElement;
  canvas.style.cssText='display:block;width:100%;height:100%;border-radius:18px;touch-action:pan-y;';
  amb=new THREE.AmbientLight(0xB8A8E8,1.85);
  sun=new THREE.DirectionalLight(0xFFF0DC,2.15);
  sun.position.set(26,42,14);
  sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  scene.add(amb,sun);
  lavaLight=new THREE.PointLight(0xFF7A30,0,46);
  scene.add(lavaLight);
  // rotation du plateau au doigt (glisser horizontalement)
  canvas.addEventListener('pointerdown',e=>{ dragX={x:e.clientX,a:azim}; dragMoved=false; });
  addEventListener('pointermove',e=>{
    if(!dragX) return;
    const d=e.clientX-dragX.x;
    if(Math.abs(d)>6) dragMoved=true;
    azim=dragX.a+d*.005;
  });
  addEventListener('pointerup',()=>{ dragX=null; });
  addEventListener('resize',()=>{ B3D.ready&&sizeToWrap(); });
  loop();
  return true;
}
function sizeToWrap(){
  if(!wrap||!canvas.parentNode) return;
  const w=wrap.clientWidth, h=wrap.clientHeight||1;
  renderer.setSize(w,h,false);
  const a=w/h;
  // deux niveaux de zoom : lecture des dalles (suivi) / carte entière (ensemble)
  vClose=Math.max(SPAN*0.30,(SPAN*0.64)/Math.max(.5,a)*0.30);
  vFull=Math.max(SPAN*0.55,(SPAN*1.06)/Math.max(.5,a)*0.55);
  applyCam(a);
}
function applyCam(a){
  a=a||((wrap&&wrap.clientWidth||1)/(wrap&&wrap.clientHeight||1));
  cam.left=-vCur*a; cam.right=vCur*a; cam.top=vCur; cam.bottom=-vCur;
  cam.updateProjectionMatrix();
}

/* ---------- construction statique (une fois par carte / étoile) ---------- */
function clearGroup(g){
  if(!g) return;
  scene.remove(g);
  g.traverse(o=>{ if(o.geometry&&!o.userData.shared) o.geometry.dispose(); });
}
function build(){
  const nodes=room.board;
  clearGroup(gStatic); rims=[]; bobs=[]; spinners=[]; puffs=[];
  B3D.falls=[]; B3D.orbites=null; B3D.roue=null; B3D.starRay=null;
  gStatic=new THREE.Group();
  const pal=SOCLE[room.mapId]||SOCLE.fete;
  // ambiance du thème : panorama 360° en fond de diorama (sinon couleur), brume, lumières
  const amb2=AMBIANCE[room.mapId]||AMBIANCE.fete;
  scene.background=PANO[room.mapId]||new THREE.Color(amb2.sky);
  scene.fog=new THREE.Fog(amb2.sky,80,190);
  sun.color.setHex(amb2.sun);
  amb.color.setHex(amb2.amb);
  // emprise de la carte → centre caméra + cadrage
  let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
  nodes.forEach(n=>{ const p=toW(n); minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x); minZ=Math.min(minZ,p.z); maxZ=Math.max(maxZ,p.z); });
  CENTER.set((minX+maxX)/2,0,(minZ+maxZ)/2);
  SPAN=Math.max(maxX-minX,(maxZ-minZ)*0.72)+10;
  BOUNDS={minX,maxX,minZ,maxZ};
  // ----- socle voxel (damier, bord grignoté, cubes lumineux du thème) -----
  const CELL=2.05;
  const NX=Math.ceil((maxX-minX+10)/CELL), NZ=Math.ceil((maxZ-minZ+10)/CELL);
  const g1=new THREE.BoxGeometry(CELL,1,CELL);
  const tex=VOXTEX[room.mapId];
  // texture du thème plaquée sur les blocs, teintes claires pour qu'elle RESSORTE
  // (le damier vient des deux teintes appliquées par-dessus la matière)
  const mA=new THREE.MeshStandardMaterial({color:tex?0xD8CCF2:pal.a,map:tex||null,roughness:.92});
  const mB=new THREE.MeshStandardMaterial({color:tex?0xFFFFFF:pal.b,map:tex||null,roughness:.92});
  const mGlow=new THREE.MeshStandardMaterial({color:pal.glowC,emissive:pal.glow,emissiveIntensity:1.3,roughness:.6});
  B3D.mGlow=mGlow;
  const rng=(s=>()=>{s=(s*16807)%2147483647;return s/2147483647;})(42);
  for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){
    const x=minX-5+(i+.5)*CELL, z=minZ-5+(j+.5)*CELL;
    const edge=Math.min(i,NX-1-i,j,NZ-1-j);
    if(edge===0&&rng()<.34) continue;
    const isGlow=edge===0&&rng()<.16;
    const m=new THREE.Mesh(g1,isGlow?mGlow:((i+j)%2?mA:mB));
    m.position.set(x,-0.55-(edge===0?0.42:0)-rng()*.06,z);
    m.scale.y=1+(edge===0?0.5:0);
    if(isGlow) m.scale.set(.82,m.scale.y*.8,.82);
    m.receiveShadow=true;
    m.userData.shared=1;
    gStatic.add(m);
  }
  // ----- dalles : pilier + liseré émissif + plateau + élément 3D du type -----
  const pillG={}, pillM=new THREE.MeshStandardMaterial({color:0x2A2038,roughness:.9});
  nodes.forEach((n,i)=>{
    const p=toW(n);
    const active=n.t==='starT'&&i===room.starIdx;
    const hPil=.8+(n.h||0)*ETAGE;
    const gk=hPil.toFixed(2);
    if(!pillG[gk]) pillG[gk]=new THREE.BoxGeometry(TILE,hPil,TILE);
    const pl=new THREE.Mesh(pillG[gk],pillM);
    pl.position.set(p.x,p.y-hPil/2+.3,p.z);
    pl.castShadow=pl.receiveShadow=true; pl.userData.shared=1;
    gStatic.add(pl);
    const col=active?0xFFD644:TYPE_COL[n.t]||0x8F86C8;
    const emit=active?0xAA7A00:TYPE_EMIT[n.t]||0x191430;
    const rim=new THREE.Mesh(new THREE.BoxGeometry(TILE*1.18,.14,TILE*1.18),
      new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,roughness:.4}));
    rim.position.set(p.x,p.y+.32,p.z);
    rim.userData={ph:i*.7,base:active?.95:(n.t!=='blue'?.55:.32)};
    rims.push(rim);
    gStatic.add(rim);
    const top=new THREE.Mesh(new THREE.BoxGeometry(TILE*1.05,TILE_H,TILE*1.05),
      new THREE.MeshStandardMaterial({color:col,emissive:emit,emissiveIntensity:.85,roughness:.55}));
    top.position.set(p.x,p.y+.56,p.z);
    top.castShadow=top.receiveShadow=true;
    gStatic.add(top);
    // l'élément 3D posé sur la dalle (pièce, cadeau, coffre… généré par Meshy)
    const elKey=active?'starT':n.t;
    if(EL3D[elKey]&&EL3D[elKey].ok){
      const el=EL3D[elKey].scene.clone();
      if(active){
        el.traverse(o=>{ if(o.isMesh) o.material=new THREE.MeshStandardMaterial({color:0xFFD644,emissive:0xCC8A00,emissiveIntensity:1.1,roughness:.4,flatShading:true}); });
        el.scale.multiplyScalar(1.5);
      }
      el.position.set(p.x,p.y+.72,p.z);
      // tout tourne : vite pour pièces/étoiles, doucement pour le reste
      el.userData={ph:i*.9,y0:p.y+.72,spin:true,s0:el.scale.x,
        sv:(active||n.t==='blue'||n.t==='starT')?.0024:.0008};
      bobs.push(el);
      gStatic.add(el);
    } else if(elKey!=='blue'){
      // repli : icône plate flottante tant que le modèle n'est pas là
      const ICO={start:'🏁',red:'💥',lucky:'🍀',event:'🎁',shop:'🛍️',boo:'👻',duel:'⚔️',bank:'🏦',chance:'🎰',bowser:'👹',starT:'⭐'};
      if(ICO[elKey]){
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:emojiTex(ICO[elKey]),transparent:true,depthWrite:false}));
        s.scale.set(1.4,1.4,1);
        s.position.set(p.x,p.y+1.35,p.z);
        s.userData={ph:i*.9,y0:p.y+1.35,s0:1.4};
        bobs.push(s);
        gStatic.add(s);
      }
    }
    if(active){
      const halo=new THREE.PointLight(0xFFD644,24,9);
      halo.position.set(p.x,p.y+2.2,p.z);
      gStatic.add(halo);
      // colonne de lumière au-dessus de l'étoile (visible de loin, tourne doucement)
      const ray=new THREE.Mesh(new THREE.ConeGeometry(1.5,7,6,1,true),
        new THREE.MeshBasicMaterial({color:0xFFD644,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false}));
      ray.position.set(p.x,p.y+4.1,p.z);
      B3D.starRay=ray;
      gStatic.add(ray);
    }
    // pastille de carrefour
    if(n.next.length>1){
      const s=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex('⇑','#20163F','#FFD644'),transparent:true,depthWrite:false}));
      s.scale.set(.9,.9,1);
      s.position.set(p.x+TILE*.62,p.y+1.9,p.z);
      gStatic.add(s);
    }
  });
  // ----- ROUTES : ruban de pierre continu + flux lumineux qui s'écoule -----
  buildRoutes(gStatic,nodes,pal);
  // ----- océan animé sous l'île (lave / nuit de fête / nébuleuse / lagon) -----
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(340,340),
    new THREE.MeshStandardMaterial({color:amb2.sea,emissive:amb2.seaGlow,emissiveIntensity:.14,roughness:.85}));
  sea.rotation.x=-Math.PI/2;
  sea.position.set(CENTER.x,-7.2,CENTER.z);
  B3D.seaMat=sea.material;
  gStatic.add(sea);
  // ----- cascades voxel sur le bord de l'île (flux qui tombe en boucle) -----
  const fallM=new THREE.MeshStandardMaterial({color:pal.glowC,emissive:pal.glow,emissiveIntensity:1.1,transparent:true,opacity:.85});
  const fallG=new THREE.BoxGeometry(.6,1.4,.6);
  for(let i=0;i<7;i++){
    const ang=(i/7)*Math.PI*2+.4;
    const fx=CENTER.x+Math.cos(ang)*((maxX-minX)/2+4.4);
    const fz=CENTER.z+Math.sin(ang)*((maxZ-minZ)/2+4.4);
    for(let s2=0;s2<3;s2++){
      const cube=new THREE.Mesh(fallG,fallM);
      cube.position.set(fx,-1-s2*2,fz);
      cube.userData={y0:-1,ph:i*.9+s2*2.1};
      B3D.falls.push(cube);
      gStatic.add(cube);
    }
  }
  // ----- props emblématiques par carte (primitives low-poly à l'échelle) -----
  buildProps(gStatic,room.mapId,pal);
  // ----- diorama de fond : îlots voxel flottants + nuages + faune du thème -----
  buildDiorama(gStatic,room.mapId,pal);
  // ----- braises / particules d'ambiance -----
  const embN=70; embV=[];
  const pos=new Float32Array(embN*3);
  for(let i2=0;i2<embN;i2++){
    pos[i2*3]=CENTER.x+(Math.random()-.5)*(maxX-minX+8);
    pos[i2*3+1]=Math.random()*14-2;
    pos[i2*3+2]=CENTER.z+(Math.random()-.5)*(maxZ-minZ+8);
    embV.push(.008+Math.random()*.02);
  }
  embGeo=new THREE.BufferGeometry();
  embGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  if(embers){ scene.remove(embers); }
  embers=new THREE.Points(embGeo,new THREE.PointsMaterial({color:room.mapId==='volcan'?0xFF9A40:pal.glowC,size:.4,transparent:true,opacity:.8}));
  scene.add(embers);
  // étoiles du ciel
  const sg=new THREE.BufferGeometry(), sp=[];
  for(let i2=0;i2<220;i2++) sp.push(CENTER.x+(Math.random()-.5)*260,Math.random()*90-10,CENTER.z+(Math.random()-.5)*260);
  sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
  gStatic.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xFFE9A8,size:.5,transparent:true,opacity:.75})));
  scene.add(gStatic);
  lavaLight.position.set(CENTER.x,6,CENTER.z-8);
  lavaLight.intensity=room.mapId==='volcan'?46:14;
  sizeToWrap();
}
/* ---------- ROUTES : un ruban de pierre qui relie les cases ----------
   Toutes les liaisons sont fusionnées en UNE géométrie (léger), posées au ras
   des dalles, et recouvertes d'un second ruban translucide dont les chevrons
   S'ÉCOULENT vers la case suivante : le sens de marche se lit sans surcharge. */
function chevronTex(){
  if(texCache.__flux) return texCache.__flux;
  const c=document.createElement('canvas'); c.width=64; c.height=128;
  const g=c.getContext('2d');
  g.clearRect(0,0,64,128);
  g.strokeStyle='rgba(255,255,255,.92)';
  g.lineWidth=9; g.lineCap='round'; g.lineJoin='round';
  for(const y of [30,86]){          // deux chevrons par motif : flux continu
    g.beginPath();
    g.moveTo(14,y+16); g.lineTo(32,y-12); g.lineTo(50,y+16);
    g.stroke();
  }
  const t=new THREE.CanvasTexture(c);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.colorSpace=THREE.SRGBColorSpace;
  texCache.__flux=t;
  return t;
}
function buildRoutes(g,nodes,pal){
  const W=TILE*.58, INSET=TILE*.40, MOTIF=2.6;
  const posA=[], uvA=[], idxA=[];
  const vus={};
  const up=new THREE.Vector3(0,1,0), dir=new THREE.Vector3(), per=new THREE.Vector3();
  nodes.forEach((n,i)=>n.next.forEach(j=>{
    const k=Math.min(i,j)+'-'+Math.max(i,j);
    if(vus[k]) return;              // pas deux rubans superposés pour un aller-retour
    vus[k]=1;
    const a=toW(n), b=toW(nodes[j]);
    dir.subVectors(b,a);
    const len=dir.length();
    if(len<.3) return;
    dir.divideScalar(len);
    per.crossVectors(dir,up).normalize().multiplyScalar(W/2);
    // le ruban part du bord de la case et s'arrête au bord de la suivante
    const inset=Math.min(INSET,len*.34);
    const A=a.clone().addScaledVector(dir,inset), B=b.clone().addScaledVector(dir,-inset);
    A.y+=.30; B.y+=.30;
    const o=posA.length/3;
    posA.push(A.x-per.x,A.y,A.z-per.z, A.x+per.x,A.y,A.z+per.z,
              B.x-per.x,B.y,B.z-per.z, B.x+per.x,B.y,B.z+per.z);
    const v=(len-2*inset)/MOTIF;    // le motif se répète selon la LONGUEUR réelle
    uvA.push(0,0, 1,0, 0,v, 1,v);
    idxA.push(o,o+2,o+1, o+1,o+2,o+3);
  }));
  if(!posA.length) return;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(posA,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvA,2));
  geo.setIndex(idxA);
  geo.computeVertexNormals();
  // 1) le pavage : la matière de la carte, un ton plus clair que le socle
  const solM=new THREE.MeshStandardMaterial({color:0x8B7FC0,map:VOXTEX[room.mapId]||null,
    roughness:.9,side:THREE.DoubleSide});
  const sol=new THREE.Mesh(geo,solM);
  sol.receiveShadow=true;
  g.add(sol);
  // 2) le flux de chevrons qui glisse vers la case suivante
  const fluxM=new THREE.MeshBasicMaterial({map:chevronTex(),transparent:true,
    opacity:.62,depthWrite:false,side:THREE.DoubleSide,color:pal.glowC});
  const flux=new THREE.Mesh(geo,fluxM);
  flux.position.y=.012;
  B3D.fluxMat=fluxM;
  g.add(flux);
}

/* ---------- ancrage du décor : aucun prop ne doit chevaucher une case ----------
   On cherche la position libre la plus proche de l'emplacement souhaité, et on
   pose l'objet AU SOL (y=0) : le décor s'intègre au lieu de flotter dedans. */
let NW=[]; // positions monde des cases (recalculées à chaque construction)
function libre(x,z,r){
  for(const p of NW){ const dx=p.x-x, dz=p.z-z; if(dx*dx+dz*dz<r*r) return false; }
  return true;
}
function ancre(x,z,r){
  if(libre(x,z,r)) return {x,z};
  for(let ray=1;ray<=10;ray++){
    for(let a=0;a<14;a++){
      const ang=a/14*Math.PI*2+ray*.3;
      const nx=x+Math.cos(ang)*ray*1.7, nz=z+Math.sin(ang)*ray*1.7;
      if(libre(nx,nz,r)) return {x:nx,z:nz};
    }
  }
  return {x,z};
}
function buildProps(g,mapId,pal){
  NW=room.board.map(n=>toW(n));
  const dark=new THREE.MeshStandardMaterial({color:0x241B38,roughness:.95,flatShading:true});
  if(mapId==='volcan'){
    const volc=new THREE.Group();
    const cone=new THREE.Mesh(new THREE.ConeGeometry(4.4,5,9),dark);
    cone.position.y=2.5; cone.castShadow=true; volc.add(cone);
    const crater=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.9,1,9),
      new THREE.MeshStandardMaterial({color:0xFF7A22,emissive:0xFF5A10,emissiveIntensity:2,flatShading:true}));
    crater.position.y=4.8; volc.add(crater);
    B3D.crater=crater;
    const p0=toW({x:205,y:280,h:0});
    const p=ancre(p0.x,p0.z,6.2);   // le volcan ne mord sur aucune case
    volc.position.set(p.x,3.9,p.z);
    g.add(volc);
    for(let i=0;i<3;i++){
      const puff=new THREE.Mesh(new THREE.SphereGeometry(1+i*.26,7,6),
        new THREE.MeshStandardMaterial({color:0x4A4258,transparent:true,opacity:.5,flatShading:true}));
      puff.position.set(p.x,0,p.z);
      puff.userData.o=i*1.4;
      g.add(puff); puffs.push(puff);
    }
    // pics de basalte fumants autour de la caldera
    const rockM2=new THREE.MeshStandardMaterial({color:0x2E2248,roughness:1,flatShading:true});
    [[-7,-4],[7.5,-6],[-8,4],[8,6],[0,12]].forEach(([ox,oz],i)=>{
      const q=ancre(p.x+ox,p.z+oz,2.4);
      const pic=new THREE.Mesh(new THREE.ConeGeometry(.9+(i%2)*.4,2.4+(i%3),5),rockM2);
      pic.position.set(q.x,1.1,q.z);
      pic.castShadow=true;
      g.add(pic);
    });
  } else if(mapId==='fete'){
    const p0=toW({x:210,y:90,h:0});
    const p=ancre(p0.x,p0.z,4.6);
    const tent=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.9,1.9,10),
      new THREE.MeshStandardMaterial({color:0xE8455A,roughness:.8,flatShading:true}));
    base.position.y=.95; tent.add(base);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(3.2,2.3,10),
      new THREE.MeshStandardMaterial({color:0xF3EFFF,roughness:.8,flatShading:true}));
    roof.position.y=3; tent.add(roof);
    const flag=new THREE.Mesh(new THREE.ConeGeometry(.3,.8,4),
      new THREE.MeshStandardMaterial({color:0xFFD644,emissive:0x8a6a00,flatShading:true}));
    flag.position.y=4.5; tent.add(flag);
    tent.position.set(p.x,0,p.z);
    tent.children.forEach(m=>m.castShadow=true);
    g.add(tent);
    // GRANDE ROUE qui tourne, cabines colorées
    const roue=new THREE.Group();
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3,.22,7,18),
      new THREE.MeshStandardMaterial({color:0xE8C05A,emissive:0x6a4a10,roughness:.6,flatShading:true}));
    roue.add(ring);
    const cabCols=[0xFF5FA2,0x3EE6C1,0x5AC8FA,0xFFD644,0xFF9F45,0xC39BFF];
    for(let i=0;i<6;i++){
      const cab=new THREE.Mesh(new THREE.BoxGeometry(.8,.8,.8),
        new THREE.MeshStandardMaterial({color:cabCols[i],roughness:.7,flatShading:true}));
      const ang=i/6*Math.PI*2;
      cab.position.set(Math.cos(ang)*3,Math.sin(ang)*3,0);
      cab.userData.spoke=ang;
      roue.add(cab);
      const spoke=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3,4),
        new THREE.MeshStandardMaterial({color:0xB8933A,flatShading:true}));
      spoke.position.set(Math.cos(ang)*1.5,Math.sin(ang)*1.5,0);
      spoke.rotation.z=ang+Math.PI/2;
      roue.add(spoke);
    }
    const pied=new THREE.Mesh(new THREE.CylinderGeometry(.16,.3,4,5),dark);
    pied.position.y=-2;
    roue.add(pied);
    const pr0=toW({x:355,y:120,h:0});
    const pr=ancre(pr0.x,pr0.z,4.4);
    roue.position.set(pr.x,4.6,pr.z);
    roue.rotation.y=.6;
    roue.children.forEach(m=>m.castShadow=true);
    B3D.roue=roue;
    g.add(roue);
  } else if(mapId==='spirale'){
    const p=toW({x:215,y:470,h:3});
    const vor=new THREE.Mesh(new THREE.TorusGeometry(2.1,.5,7,16),
      new THREE.MeshStandardMaterial({color:0xC39BFF,emissive:0x7A4AC8,emissiveIntensity:1.2,flatShading:true}));
    vor.rotation.x=Math.PI/2.25;
    vor.position.set(p.x,p.y+2.6,p.z);
    B3D.vortex=vor;
    g.add(vor);
    // anneaux orbitaux + petites planètes qui tournent AUTOUR de l'île (au-delà du bord)
    const orb=new THREE.Group();
    [[SPAN*.46,.9,0xF09BD8],[SPAN*.56,-.5,0x9FF7FF]].forEach(([r,tilt,col])=>{
      const an=new THREE.Mesh(new THREE.TorusGeometry(r,.09,5,40),
        new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,transparent:true,opacity:.55}));
      an.rotation.x=Math.PI/2+tilt*.14;
      orb.add(an);
      const pla=new THREE.Mesh(new THREE.SphereGeometry(.8,7,6),
        new THREE.MeshStandardMaterial({color:col,roughness:.8,flatShading:true}));
      pla.userData={r,tilt:tilt*.14,ph:r};
      orb.add(pla);
    });
    orb.position.set(CENTER.x,2.5,CENTER.z);
    B3D.orbites=orb;
    g.add(orb);
  } else if(mapId==='archipel'){
    [[210,140],[120,440],[290,740]].forEach(([px,py])=>{
      const pw=toW({x:px,y:py,h:0});
      const palm=new THREE.Group();
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(.16,.26,2.6,5),
        new THREE.MeshStandardMaterial({color:0x6B4A32,roughness:1,flatShading:true}));
      tr.position.y=1.3; tr.rotation.z=.12; palm.add(tr);
      for(let b=0;b<5;b++){
        const leaf=new THREE.Mesh(new THREE.ConeGeometry(.34,1.9,4),
          new THREE.MeshStandardMaterial({color:0x2FA872,roughness:.9,flatShading:true}));
        leaf.position.set(Math.cos(b*1.26)*.9,2.7,Math.sin(b*1.26)*.9);
        leaf.rotation.z=Math.cos(b*1.26)*1.25;
        leaf.rotation.x=-Math.sin(b*1.26)*1.25;
        palm.add(leaf);
      }
      palm.children.forEach(m=>m.castShadow=true);
      const q=ancre(pw.x+2.6,pw.z-1.2,2.2);
      palm.position.set(q.x,0,q.z);
      g.add(palm);
    });
    // rochers du lagon qui émergent de l'eau autour de l'île
    const wet=new THREE.MeshStandardMaterial({color:0x1E3A50,roughness:.85,flatShading:true});
    for(let i=0;i<6;i++){
      const ang=i/6*Math.PI*2+.8;
      const rk=new THREE.Mesh(new THREE.DodecahedronGeometry(.9+(i%3)*.5),wet);
      rk.position.set(CENTER.x+Math.cos(ang)*21,-6.4,CENTER.z+Math.sin(ang)*26);
      g.add(rk);
    }
  } else if(mapId==='temple'){
    // la PYRAMIDE à degrés qui monte au centre du plateau
    const pierre=new THREE.MeshStandardMaterial({color:0x33513C,roughness:.95,flatShading:true});
    const orM=new THREE.MeshStandardMaterial({color:0xE0B24E,emissive:0x6a4a10,emissiveIntensity:.9,roughness:.5,flatShading:true});
    // les terrasses de cases FORMENT déjà la pyramide : au centre du sanctuaire
    // on ne pose que l'autel et son disque solaire, calés sur l'altitude du sommet
    const cxT=CENTER.x, czT=toW({x:215,y:366,h:0}).z;
    const hSom=3*ETAGE;
    const autel=new THREE.Mesh(new THREE.BoxGeometry(2,1.1,2),pierre);
    autel.position.set(cxT,hSom+.55,czT);
    autel.castShadow=autel.receiveShadow=true;
    g.add(autel);
    const soleil=new THREE.Mesh(new THREE.TorusGeometry(1.35,.22,6,18),orM);
    soleil.position.set(cxT,hSom+2.6,czT);
    soleil.rotation.x=.35;
    B3D.soleil=soleil;
    g.add(soleil);
    const halo=new THREE.PointLight(0xE0B24E,20,14);
    halo.position.set(cxT,hSom+3,czT);
    g.add(halo);
    // totems et torches autour du temple
    const torche=new THREE.MeshStandardMaterial({color:0xFF9F45,emissive:0xFF7A22,emissiveIntensity:1.6});
    B3D.torches=[];
    [[-13,-9],[13,-9],[-13,10],[13,10],[0,-19],[0,20]].forEach(([ox,oz],i)=>{
      const q=ancre(cxT+ox,czT+oz,2.3); // aucune torche plantée dans une case
      const t2=new THREE.Group();
      const mat=new THREE.Mesh(new THREE.CylinderGeometry(.16,.24,2.4,5),pierre);
      mat.position.y=1.2; t2.add(mat);
      const fl=new THREE.Mesh(new THREE.ConeGeometry(.42,.9,6),torche);
      fl.position.y=2.75; t2.add(fl);
      t2.position.set(q.x,0,q.z);
      t2.children.forEach(m=>m.castShadow=true);
      B3D.torches.push(fl);
      g.add(t2);
      const lum=new THREE.PointLight(0xFF9F45,9,10);
      lum.position.set(q.x,3,q.z);
      g.add(lum);
    });
    // totems de pierre plantés dans la jungle
    for(let i=0;i<5;i++){
      const ang=i/5*Math.PI*2+.5;
      const q=ancre(cxT+Math.cos(ang)*17,czT+Math.sin(ang)*27,2.6);
      const tot=new THREE.Group();
      for(let b=0;b<3;b++){
        const bloc=new THREE.Mesh(new THREE.BoxGeometry(1.1-b*.14,.9,1.1-b*.14),pierre);
        bloc.position.y=.45+b*.9;
        bloc.rotation.y=b*.4;
        bloc.castShadow=true;
        tot.add(bloc);
      }
      tot.position.set(q.x,0,q.z);
      g.add(tot);
    }
  }
}

/* ---------- diorama de fond + faune d'ambiance (la VIE des cartes) ---------- */
function buildDiorama(g,mapId,pal){
  B3D.amb3d=[];
  const R=SPAN*0.85;
  // îlots voxel qui flottent au loin dans la brume (toutes cartes)
  const mIle=new THREE.MeshStandardMaterial({color:pal.a,roughness:.95,flatShading:true});
  const mIle2=new THREE.MeshStandardMaterial({color:pal.b,roughness:.95,flatShading:true});
  const mGl=new THREE.MeshStandardMaterial({color:pal.glowC,emissive:pal.glow,emissiveIntensity:1,roughness:.7});
  for(let i=0;i<4;i++){
    const ile=new THREE.Group();
    const nb=4+(i%3);
    for(let c=0;c<nb;c++){
      const cube=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.6),(c===nb-1)?mGl:(c%2?mIle:mIle2));
      cube.position.set((c%3-1)*1.5,(c%2)*.9,((c/3|0)-0.5)*1.5);
      ile.add(cube);
    }
    const ang=i/4*Math.PI*2+.7;
    ile.position.set(CENTER.x+Math.cos(ang)*R*1.15,2+(i%3)*4,CENTER.z+Math.sin(ang)*R*1.25);
    ile.userData={type:'ile',ph:i*1.7,y0:ile.position.y};
    B3D.amb3d.push(ile); g.add(ile);
  }
  // nuages plats qui dérivent lentement
  const mNu=new THREE.MeshStandardMaterial({color:0x8A80B8,transparent:true,opacity:.32,flatShading:true});
  for(let i=0;i<3;i++){
    const nu=new THREE.Group();
    for(let c=0;c<3;c++){
      const s=new THREE.Mesh(new THREE.SphereGeometry(1.6-c*.35,7,5),mNu);
      s.position.set(c*1.7-1.7,c*.2,0); s.scale.y=.45;
      nu.add(s);
    }
    nu.position.set(CENTER.x-R+i*R*.9,9+i*3,CENTER.z+(i-1)*R*.7);
    nu.userData={type:'nuage',v:.006+i*.003,x0:CENTER.x-R*1.3,x1:CENTER.x+R*1.3};
    B3D.amb3d.push(nu); g.add(nu);
  }
  // faune du thème
  if(mapId==='volcan'){
    // chauves-souris qui tournent autour de la caldera en battant des ailes
    const mBat=new THREE.MeshStandardMaterial({color:0x1A1230,roughness:1,flatShading:true});
    for(let i=0;i<3;i++){
      const bat=new THREE.Group();
      const corps=new THREE.Mesh(new THREE.SphereGeometry(.28,6,5),mBat); bat.add(corps);
      const a1=new THREE.Mesh(new THREE.ConeGeometry(.5,.9,3),mBat);
      a1.rotation.z=Math.PI/2; a1.position.x=-.55; bat.add(a1);
      const a2=a1.clone(); a2.rotation.z=-Math.PI/2; a2.position.x=.55; bat.add(a2);
      bat.userData={type:'bat',ph:i*2.1,r:8+i*2.4,h:7+i*1.6,a1,a2};
      B3D.amb3d.push(bat); g.add(bat);
    }
  } else if(mapId==='fete'){
    // ballons qui montent + pluie de confettis
    const cols=[0xFF5FA2,0x3EE6C1,0x5AC8FA,0xFFD644];
    for(let i=0;i<4;i++){
      const bal=new THREE.Group();
      const b=new THREE.Mesh(new THREE.SphereGeometry(.55,7,6),
        new THREE.MeshStandardMaterial({color:cols[i],roughness:.5,flatShading:true}));
      bal.add(b);
      const fil=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.2,3),
        new THREE.MeshStandardMaterial({color:0xF3EFFF}));
      fil.position.y=-.85; bal.add(fil);
      bal.userData={type:'ballon',ph:i*2.3,x:CENTER.x+(i-1.5)*7,z:CENTER.z+((i%2)*2-1)*9};
      B3D.amb3d.push(bal); g.add(bal);
    }
    const cfN=60, cfPos=new Float32Array(cfN*3);
    for(let i=0;i<cfN;i++){ cfPos[i*3]=CENTER.x+(Math.random()-.5)*30; cfPos[i*3+1]=Math.random()*16; cfPos[i*3+2]=CENTER.z+(Math.random()-.5)*46; }
    const cfGeo=new THREE.BufferGeometry();
    cfGeo.setAttribute('position',new THREE.BufferAttribute(cfPos,3));
    const cf=new THREE.Points(cfGeo,new THREE.PointsMaterial({color:0xFF9FF3,size:.32,transparent:true,opacity:.85}));
    cf.userData={type:'confetti',geo:cfGeo};
    B3D.amb3d.push(cf); g.add(cf);
  } else if(mapId==='spirale'){
    // étoiles filantes qui traversent le ciel
    for(let i=0;i<3;i++){
      const fil=new THREE.Mesh(new THREE.CylinderGeometry(.06,.02,3.2,4),
        new THREE.MeshStandardMaterial({color:0xFFE9A8,emissive:0xFFD644,emissiveIntensity:1.6}));
      fil.rotation.z=-.7;
      fil.userData={type:'filante',ph:i*4.2,y:12+i*4,z:CENTER.z+(i-1)*16};
      B3D.amb3d.push(fil); g.add(fil);
    }
  } else if(mapId==='temple'){
    // singes qui traversent la canopée + aras qui volent au-dessus de la jungle
    const mSing=new THREE.MeshStandardMaterial({color:0x6B4A32,roughness:.95,flatShading:true});
    for(let i=0;i<3;i++){
      const s=new THREE.Group();
      s.add(new THREE.Mesh(new THREE.SphereGeometry(.34,6,5),mSing));
      const tete=new THREE.Mesh(new THREE.SphereGeometry(.22,6,5),mSing);
      tete.position.y=.4; s.add(tete);
      s.userData={type:'ile',ph:i*2.4,y0:5.5+i*1.6}; // ils flottent dans la canopée
      s.position.set(CENTER.x+(i-1)*11,5.5+i*1.6,CENTER.z+(i%2?12:-13));
      B3D.amb3d.push(s); g.add(s);
    }
    const mAra=new THREE.MeshStandardMaterial({color:0x3EE6C1,emissive:0x0E4A3C,emissiveIntensity:.6,flatShading:true});
    for(let i=0;i<4;i++){
      const ara=new THREE.Mesh(new THREE.ConeGeometry(.22,.8,4),mAra);
      ara.rotation.z=Math.PI/2;
      ara.userData={type:'luciole',ph:i*1.7,x:CENTER.x+(i-1.5)*9,z:CENTER.z+((i%3)-1)*16};
      B3D.amb3d.push(ara); g.add(ara);
    }
  } else if(mapId==='archipel'){
    // lucioles menthe qui errent + poisson qui saute du lagon
    for(let i=0;i<5;i++){
      const lu=new THREE.Mesh(new THREE.SphereGeometry(.14,5,4),
        new THREE.MeshStandardMaterial({color:0x3EE6C1,emissive:0x18B89A,emissiveIntensity:2}));
      lu.userData={type:'luciole',ph:i*1.9,x:CENTER.x+(i-2)*6,z:CENTER.z+((i%3)-1)*13};
      B3D.amb3d.push(lu); g.add(lu);
    }
    const fish=new THREE.Mesh(new THREE.ConeGeometry(.35,1.1,5),
      new THREE.MeshStandardMaterial({color:0x5AC8FA,roughness:.6,flatShading:true}));
    fish.userData={type:'poisson',ph:0};
    B3D.amb3d.push(fish); g.add(fish);
  }
}

/* ---------- mise à l'échelle FIABLE d'un personnage ----------
   La boîte englobante d'un modèle riggé est calculée sur sa pose de repos
   (souvent recroquevillée) : elle ment. On mesure donc le SQUELETTE une fois
   le personnage posé par l'animation, ce qui donne sa vraie stature. */
function heroBox(m){
  // boîte englobante RÉELLE : pour un maillage riggé, on la recalcule sur la pose
  // déformée par les os (sinon on mesure la pose de repos, qui ment)
  const bb=new THREE.Box3();
  m.updateMatrixWorld(true);
  let any=false;
  m.traverse(o=>{
    if(!o.isMesh||!o.geometry) return;
    let box=null;
    if(o.isSkinnedMesh&&o.computeBoundingBox){ o.computeBoundingBox(); box=o.boundingBox; }
    if(!box){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box=o.geometry.boundingBox; }
    if(!box) return;
    bb.union(box.clone().applyMatrix4(o.matrixWorld));
    any=true;
  });
  if(!any) bb.setFromObject(m);
  return bb;
}
function fitHero(m,targetH){
  // MÊME règle pour tout le monde : la boîte réelle fait exactement targetH de haut
  const bb=heroBox(m);
  const size=bb.getSize(new THREE.Vector3());
  m.scale.setScalar(targetH/Math.max(.0001,size.y));
  const bb2=heroBox(m);
  m.position.y-=bb2.min.y;
  m.position.x-=(bb2.min.x+bb2.max.x)/2;
  m.position.z-=(bb2.min.z+bb2.max.z)/2;
}

/* ---------- pions (héros 3D animé → sprite détouré, jamais déformé) ---------- */
function ensurePion(p){
  let po=B3D.pions[p.id];
  if(po) return po;
  const group=new THREE.Group();
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true}));
  spr.center.set(.5,.06);
  group.add(spr);
  po=B3D.pions[p.id]={group,spr,cur:new THREE.Vector3(),target:new THREE.Vector3(),mixer:null,mesh:null,walkT:0};
  // étiquette flottante : on sait toujours QUI est QUI
  const lab=new THREE.Sprite(new THREE.SpriteMaterial({map:nomTex(p.name,p.color),
    transparent:true,depthWrite:false,depthTest:false}));
  lab.scale.set(3.5,.98,1);
  lab.position.y=HERO_H*2.2+1.15;
  lab.renderOrder=6;
  group.add(lab);
  po.label=lab; po.labKey=p.name+'|'+p.color;
  const skin=(p.skin&&window.SKIN_OK&&SKIN_OK[p.skin])?p.skin:p.hero;
  new THREE.TextureLoader().load('/art/sprite-'+skin+'.png',t=>{
    t.colorSpace=THREE.SRGBColorSpace;
    spr.material.map=t; spr.material.needsUpdate=true;
    const r=t.image.width/t.image.height;
    spr.scale.set(HERO_H*r,HERO_H,1);   // proportions du PNG respectées
  },undefined,()=>{ spr.material.map=emojiTex(p.avatar||'❔'); spr.scale.set(1.6,1.6,1); });
  heroGLB(skin,g=>{ // le costume 3D si produit, sinon le héros 3D, sinon le sprite
    const skinned=!!(g.animations&&g.animations.length);
    // chaque joueur reçoit SA copie, squelette compris : deux joueurs peuvent
    // choisir le même héros et être tous les deux en 3D
    const m=skinned?cloneSkinned(g.scene):g.scene.clone(true);
    if(skinned){
      po.mixer=new THREE.AnimationMixer(m);
      const walk=g.animations.find(a=>/walk/i.test(a.name))||g.animations[0];
      po.action=po.mixer.clipAction(walk);
      po.action.play();
      po.mixer.update(.35); // le personnage est POSÉ avant d'être mesuré
    }
    // mesure fiable : squelette animé pour les riggés, boîte pour les statiques
    fitHero(m,HERO_H*2.2);
    m.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
    group.remove(spr);
    group.add(m);
    po.mesh=m;
    po.baseY=m.position.y;
  });
  gPions.add(group);
  return po;
}

/* ---------- boucle ---------- */
function loop(){
  requestAnimationFrame(loop);
  if(!B3D.ready||!canvas.parentNode) return;
  // écran plateau caché (mini-jeu, menus) : on ne gaspille pas le GPU
  const scrB=document.getElementById('scr-board');
  if(scrB&&!scrB.classList.contains('on')){ lastT=performance.now(); return; }
  const t=performance.now(), dt=Math.min(.06,(t-lastT)/1000); lastT=t;
  // vie des dalles
  rims.forEach(r=>{ r.material.emissiveIntensity=r.userData.base+Math.sin(t*.0026+r.userData.ph)*.2; });
  // les éléments de cases s'effacent SOUS les pions (et à leur passage), reviennent après
  const pionsSur=[];
  for(const id in B3D.pions){ const po=B3D.pions[id]; if(po.group.visible) pionsSur.push(po.cur); }
  bobs.forEach(b=>{
    b.position.y=b.userData.y0+Math.sin(t*.0021+b.userData.ph)*.15;
    if(b.userData.spin) b.rotation.y=t*(b.userData.sv||.0018)+b.userData.ph; // tout TOURNE
    const s0=b.userData.s0||1;
    let occ=false;
    for(const pp of pionsSur){
      const dx=pp.x-b.position.x, dz=pp.z-b.position.z;
      if(dx*dx+dz*dz<2.1){ occ=true; break; } // un pion est sur cette dalle
    }
    const cible=occ?0.001:s0;
    const k=occ?Math.min(1,dt*11):Math.min(1,dt*5); // se rétracte vite, repope en douceur
    b.scale.setScalar(b.scale.x+(cible-b.scale.x)*k);
  });
  if(B3D.crater) B3D.crater.material.emissiveIntensity=1.6+Math.sin(t*.004)*.5;
  if(B3D.vortex) B3D.vortex.rotation.z=t*.0011;
  if(B3D.mGlow) B3D.mGlow.emissiveIntensity=1.1+Math.sin(t*.003)*.45;
  // la vie du décor : cascades qui coulent, grande roue, orbites, océan, rayon d'étoile
  if(B3D.falls) B3D.falls.forEach(c=>{ c.position.y=c.userData.y0-((t*.004+c.userData.ph)%6.2); });
  if(B3D.roue){
    B3D.roue.rotation.z=t*.00035;
    B3D.roue.children.forEach(ch=>{ if(ch.userData.spoke!==undefined) ch.rotation.z=-B3D.roue.rotation.z; });
  }
  if(B3D.orbites){
    B3D.orbites.rotation.y=t*.00016;
    B3D.orbites.children.forEach(ch=>{
      if(ch.userData.r){
        const a2=t*.0004+ch.userData.ph;
        ch.position.set(Math.cos(a2)*ch.userData.r,Math.sin(a2)*ch.userData.r*Math.sin(ch.userData.tilt),Math.sin(a2)*ch.userData.r);
      }
    });
  }
  if(B3D.soleil){ B3D.soleil.rotation.z=t*.0009; B3D.soleil.material.emissiveIntensity=.7+Math.sin(t*.0026)*.3; }
  if(B3D.torches) B3D.torches.forEach((f,i)=>{ const k=1+Math.sin(t*.011+i*1.7)*.16; f.scale.set(k,1/k,k); });
  if(B3D.fluxMat&&B3D.fluxMat.map) B3D.fluxMat.map.offset.y=-(t*.00022)%1; // les chevrons s'écoulent
  if(B3D.seaMat) B3D.seaMat.emissiveIntensity=.12+Math.sin(t*.0016)*.06;
  if(B3D.starRay){ B3D.starRay.rotation.y=t*.0012; B3D.starRay.material.opacity=.13+Math.sin(t*.0035)*.05; }
  // la faune et le diorama vivent
  if(B3D.amb3d) B3D.amb3d.forEach(o=>{
    const u=o.userData;
    if(u.type==='ile'){ o.position.y=u.y0+Math.sin(t*.0006+u.ph)*1.4; o.rotation.y=t*.00008+u.ph; }
    else if(u.type==='nuage'){ o.position.x+=u.v; if(o.position.x>u.x1) o.position.x=u.x0; }
    else if(u.type==='bat'){
      const a2=t*.0006+u.ph;
      o.position.set(CENTER.x+Math.cos(a2)*u.r,u.h+Math.sin(t*.002+u.ph)*.8,CENTER.z-8+Math.sin(a2)*u.r*.7);
      o.rotation.y=-a2;
      const bat=Math.sin(t*.02+u.ph)*.55;
      u.a1.rotation.x=bat; u.a2.rotation.x=-bat;
    }
    else if(u.type==='ballon'){
      const cy=((t*.0012+u.ph)%9);
      o.position.set(u.x+Math.sin(t*.001+u.ph)*1.2,1+cy*2.2,u.z);
      o.children[0].material.opacity=1;
      o.visible=cy<8;
    }
    else if(u.type==='confetti'){
      const arr=u.geo.attributes.position.array;
      for(let i=1;i<arr.length;i+=3){ arr[i]-=.016; if(arr[i]<0) arr[i]=16; }
      u.geo.attributes.position.needsUpdate=true;
    }
    else if(u.type==='filante'){
      const cy=((t*.0011+u.ph)%7);
      o.visible=cy<1.6;
      o.position.set(CENTER.x-24+cy*32,u.y-cy*6,u.z);
    }
    else if(u.type==='luciole'){
      o.position.set(u.x+Math.sin(t*.0013+u.ph)*3.2,2.2+Math.sin(t*.0021+u.ph*2)*1.6,u.z+Math.cos(t*.0009+u.ph)*3.2);
      o.material.emissiveIntensity=1.4+Math.sin(t*.006+u.ph)*.8;
    }
    else if(u.type==='poisson'){
      const cy=((t*.0009)%6);
      o.visible=cy<1.2;
      const tt=cy/1.2;
      o.position.set(CENTER.x+16,-6.8+Math.sin(tt*Math.PI)*4.5,CENTER.z+8);
      o.rotation.z=Math.PI-tt*Math.PI*1.6;
    }
  });
  puffs.forEach(p2=>{
    p2.position.y=6.5+p2.userData.o+((t*.0011+p2.userData.o)%3.2);
    p2.material.opacity=.55-((p2.position.y-6.5)/3.2)*.4;
  });
  if(embGeo){
    const ep=embGeo.attributes.position.array;
    for(let i=0;i<embV.length;i++){
      ep[i*3+1]+=embV[i]*3;
      if(ep[i*3+1]>15) ep[i*3+1]=-2;
    }
    embGeo.attributes.position.needsUpdate=true;
  }
  // pions : glissent vers leur dalle, marchent pendant le trajet
  for(const id in B3D.pions){
    const po=B3D.pions[id];
    const d=po.cur.distanceTo(po.target);
    const moving=d>.04;
    if(moving){
      const step=Math.min(1,dt*4.2);
      const dir=new THREE.Vector3().subVectors(po.target,po.cur);
      po.cur.addScaledVector(dir,step);
      if(po.mesh) po.group.rotation.y=Math.atan2(dir.x,dir.z);
      if(po.action&&po.action.paused){ po.action.paused=false; }
      po.walkT=t;
    } else if(po.action&&!po.action.paused&&t-po.walkT>350){
      po.action.paused=true; // à l'arrêt : plus de marche sur place
    }
    // marche procédurale pour tous ceux qui n'ont pas de rig : sautille + roulis
    if(!po.mixer){
      const hop=moving?Math.abs(Math.sin(t*.014))*.42:0;
      const roll=moving?Math.sin(t*.014)*.08:0;
      if(po.mesh){ po.mesh.position.y=(po.baseY||0)+hop; po.mesh.rotation.z=roll; }
      else if(po.spr){ po.spr.position.y=hop; }
    }
    po.group.position.copy(po.cur);
    if(po.mixer) po.mixer.update(dt);
  }
  // caméra : suit le joueur dont c'est le tour, ou cadre TOUTE la carte (🗺️)
  const cur=room&&room.players&&room.players[room.turn];
  if(!B3D.overview&&cur&&B3D.pions[cur.id]) focusTarget.copy(B3D.pions[cur.id].cur);
  else focusTarget.copy(CENTER);
  if(!B3D.overview){
    // au bord de carte, on ne montre pas la moitié de vide : la visée reste dans l'île
    const mX=Math.min(vCur*.72,(BOUNDS.maxX-BOUNDS.minX)/2);
    const mZ=Math.min(vCur*.72,(BOUNDS.maxZ-BOUNDS.minZ)/2);
    focusTarget.x=Math.max(BOUNDS.minX+mX,Math.min(BOUNDS.maxX-mX,focusTarget.x));
    focusTarget.z=Math.max(BOUNDS.minZ+mZ,Math.min(BOUNDS.maxZ-mZ,focusTarget.z));
  }
  FOCUS.lerp(focusTarget,Math.min(1,dt*2.4));
  const vWant=B3D.overview?vFull:vClose;
  if(Math.abs(vCur-vWant)>.05){ vCur+=(vWant-vCur)*Math.min(1,dt*3.4); applyCam(); }
  const az=azim+Math.sin(t*.00012)*.04;
  const R=SPAN*2.1, el=1.02;
  cam.position.set(FOCUS.x+Math.sin(az)*R*Math.cos(el),R*Math.sin(el),FOCUS.z+Math.cos(az)*R*Math.cos(el));
  cam.lookAt(FOCUS.x,1.2,FOCUS.z);
  renderer.render(scene,cam);
}

/* ---------- API appelée par le jeu (scripts classiques) ---------- */
B3D.render=function(){
  if(!B3D.ok) return false;
  if(!room||!room.board) return false;
  if(!canvas.parentNode||wrap.firstChild!==canvas){
    wrap.innerHTML='';
    wrap.style.height=Math.min(innerHeight*.86,wrap.clientWidth*1.72)+'px';
    wrap.style.position='relative';
    wrap.appendChild(canvas);
    // bascule suivi 🎯 / vue d'ensemble 🗺️
    const vb=document.createElement('button');
    vb.id='b3dView';
    vb.style.cssText='position:absolute;top:10px;right:10px;z-index:5;width:44px;height:44px;'+
      'border-radius:14px;border:2px solid rgba(255,255,255,.28);background:rgba(23,16,48,.72);'+
      'font-size:21px;cursor:pointer;backdrop-filter:blur(3px);';
    vb.textContent='🗺️';
    vb.onclick=()=>{
      B3D.overview=!B3D.overview;
      vb.textContent=B3D.overview?'🎯':'🗺️';
      if(typeof snd==='function') snd('tap');
    };
    wrap.appendChild(vb);
    sizeToWrap();
  }
  const key=room.mapId+':'+room.starIdx+':'+room.board.length+':'+Object.keys(EL3D).filter(k=>EL3D[k].ok).length+':'+(VOXTEX[room.mapId]?'T':'');
  if(B3D.built!==key){ B3D.built=key; build(); }
  // groupes dynamiques
  if(!gPions){ gPions=new THREE.Group(); scene.add(gPions); }
  if(gReach){ scene.remove(gReach); gReach=null; }
  if(gTraps){ scene.remove(gTraps); gTraps=null; }
  // pions
  const seen={};
  room.players.forEach((p,pi)=>{
    const po=ensurePion(p);
    seen[p.id]=1;
    const n=room.board[p.pos]||room.board[0];
    const here=room.players.filter(q=>q.pos===p.pos);
    const k=here.findIndex(q=>q.id===p.id);
    const off=(k-(here.length-1)/2)*1.1;
    const w=toW(n);
    po.target.set(w.x+off,w.y+.72,w.z+ (k%2?-.4:.2));
    if(po.cur.lengthSq()===0) po.cur.copy(po.target);
    po.group.visible=!p.gone;
    const scale=pi===room.turn?1.08:1;
    po.group.scale.setScalar(scale);
    if(po.label){
      const key=p.name+'|'+p.color;
      if(po.labKey!==key){ po.labKey=key; po.label.material.map=nomTex(p.name,p.color); po.label.material.needsUpdate=true; }
      po.label.material.opacity=p.gone?.35:1;
    }
  });
  for(const id in B3D.pions) if(!seen[id]){ gPions.remove(B3D.pions[id].group); delete B3D.pions[id]; }
  // pastilles de portée du dé (mon tour)
  if(typeof myTurn==='function'&&myTurn()&&!animBusy){
    const src=local?room.players[room.turn]:room.players.find(p=>p.id===me.id);
    if(src){
      gReach=new THREE.Group();
      const depth={}; depth[src.pos]=0;
      const q=[src.pos];
      while(q.length){
        const i=q.shift();
        if(depth[i]>=6) continue;
        for(const j of room.board[i].next) if(depth[j]===undefined){ depth[j]=depth[i]+1; q.push(j); }
      }
      for(const i in depth){
        if(depth[i]<1) continue;
        const n=room.board[i], w=toW(n);
        const s=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex(String(depth[i]),'rgba(18,11,44,.92)','#fff'),transparent:true,depthWrite:false}));
        s.scale.set(.85,.85,1);
        s.position.set(w.x,w.y+2.5,w.z);
        gReach.add(s);
      }
      scene.add(gReach);
    }
  }
  // bombes piégées (visibles par le poseur / en local)
  if(room.traps){
    gTraps=new THREE.Group();
    for(const ti in room.traps){
      if(local||room.traps[ti].by===me.id){
        const n=room.board[ti];
        if(n){
          const w=toW(n);
          const s=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex('!','#2B1230','#FF5A4A'),transparent:true,depthWrite:false}));
          s.scale.set(.55,.55,1);
          s.position.set(w.x+TILE*.55,w.y+1.6,w.z);
          gTraps.add(s);
        }
      }
    }
    scene.add(gTraps);
  }
  // la nuit tombe au fil des tours
  const prog=(room.round-1)/Math.max(1,room.maxRounds-1);
  sun.intensity=2.15-prog*.45;
  amb.intensity=1.85-prog*.25;
  return true;
};
B3D.detach=function(){
  if(canvas&&canvas.parentNode) canvas.parentNode.removeChild(canvas);
};

try{ B3D.ok=init(); B3D.ready=B3D.ok; }catch(e){ B3D.ok=false; }
