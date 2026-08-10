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
/* sea/seaGlow/em = matiere de l'etendue qui entoure l'ile : lave brulante, nuit de
   fete, nebuleuse, lagon, sous-bois. em = combien elle rayonne d'elle-meme. */
const AMBIANCE={
  volcan:  {sky:0x190F28,sun:0xFFC9A0,amb:0x8A6A90,sea:0x3A1006,seaGlow:0xFF5A18,em:.16},
  fete:    {sky:0x171030,sun:0xFFE2C4,amb:0x8A78C8,sea:0x241A46,seaGlow:0xFFC24A,em:.05},
  spirale: {sky:0x120C2C,sun:0xEDC6FF,amb:0x7A68B8,sea:0x1B1245,seaGlow:0xC96BB8,em:.09},
  archipel:{sky:0x0E1A32,sun:0xCFE6FF,amb:0x5C7AAA,sea:0x0E4258,seaGlow:0x3EE6C1,em:.07},
  temple:  {sky:0x0C1A14,sun:0xE8F0C0,amb:0x6A8A70,sea:0x1B3324,seaGlow:0x4FB07A,em:.05}
};

const ART_V='?v=3';  // version des images : force le navigateur a reprendre les neuves
const B3D={ready:false,ok:false,built:'',pions:{},focusId:null};
window.B3D=B3D;

/* ---------- CIEL PROCÉDURAL ----------
   Plus aucune photo de fond : le ciel est peint à la volée sur un canevas
   (dégradé vertical + astre + voile de nuages + étoiles). C'est net à toutes
   les résolutions, ça colle au style voxel, et ça n'a rien à télécharger. */
const CIEL={
  //          zénith     haute      basse      horizon    astre           halo de l'astre
  volcan:  {a:'#150B24',b:'#4A1430',c:'#A8331E',d:'#E8763A',astre:'#FFD9A0',halo:'#FF6A20',ax:.62,ay:.60,ar:.085,nuage:'#7A2418',etoiles:60},
  fete:    {a:'#140C2E',b:'#3A1A5E',c:'#8E2F6E',d:'#E89BC0',astre:'#FFF4D8',halo:'#FFC46A',ax:.30,ay:.30,ar:.055,nuage:'#4A2050',etoiles:150},
  spirale: {a:'#0C0824',b:'#1E1858',c:'#4148A0',d:'#9AA6E8',astre:'#D8C4FF',halo:'#8E6AD8',ax:.72,ay:.34,ar:.10,nuage:'#2A2470',etoiles:190},
  archipel:{a:'#08182E',b:'#1A4A74',c:'#3893B4',d:'#A8E4E8',astre:'#FFF6D0',halo:'#FFD07A',ax:.24,ay:.52,ar:.07,nuage:'#2E6E8C',etoiles:40},
  temple:  {a:'#07160F',b:'#123A2A',c:'#2F7048',d:'#A8C878',astre:'#EAF6C8',halo:'#9AD87A',ax:.78,ay:.26,ar:.05,nuage:'#1C4A34',etoiles:120}
};
const PANO={};
const PANO_HZ={};   // couleur de l'horizon : le sol lointain s'y dilue

function cielTex(k){
  const C=CIEL[k]||CIEL.fete;
  const W=2048, H=1024;
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
  const x=cv.getContext('2d');
  // 1) dégradé vertical : le zénith sombre descend vers un horizon lumineux
  const g=x.createLinearGradient(0,0,0,H*0.52);
  g.addColorStop(0,C.a); g.addColorStop(.45,C.b); g.addColorStop(.80,C.c); g.addColorStop(1,C.d);
  x.fillStyle=g; x.fillRect(0,0,W,H*0.52);
  // sous l'horizon : la teinte se referme (on ne la voit qu'en vue d'ensemble)
  const g2=x.createLinearGradient(0,H*0.52,0,H);
  g2.addColorStop(0,C.d); g2.addColorStop(.35,C.c); g2.addColorStop(1,C.a);
  x.fillStyle=g2; x.fillRect(0,H*0.52,W,H*0.48);
  // 2) étoiles (uniquement dans la moitié haute, densité propre au thème)
  for(let i=0;i<C.etoiles;i++){
    const px=Math.random()*W, py=Math.random()*H*0.42;
    const r=Math.random()*1.9+0.5;
    x.globalAlpha=0.25+Math.random()*0.75*(1-py/(H*0.42));
    x.fillStyle='#fff';
    x.beginPath(); x.arc(px,py,r,0,7); x.fill();
  }
  x.globalAlpha=1;
  // 3) voiles de nuages : ellipses très floues posées près de l'horizon
  for(let i=0;i<7;i++){
    const px=(i*0.1637+0.05)%1*W, py=H*(0.30+Math.random()*0.19);
    const rx=W*(0.09+Math.random()*0.13), ry=H*(0.022+Math.random()*0.035);
    const gr=x.createRadialGradient(px,py,0,px,py,rx);
    gr.addColorStop(0,C.nuage); gr.addColorStop(1,'rgba(0,0,0,0)');
    x.globalAlpha=.34;
    x.save(); x.translate(px,py); x.scale(1,ry/rx);
    x.fillStyle=gr; x.beginPath(); x.arc(0,0,rx,0,7); x.fill(); x.restore();
  }
  x.globalAlpha=1;
  // 4) l'astre : halo large puis disque net (soleil couchant, lune, planète…)
  const ax=C.ax*W, ay=C.ay*H*0.52, ar=C.ar*H;
  const hg=x.createRadialGradient(ax,ay,ar*0.6,ax,ay,ar*5.2);
  hg.addColorStop(0,C.halo); hg.addColorStop(1,'rgba(0,0,0,0)');
  x.globalAlpha=.55; x.fillStyle=hg;
  x.beginPath(); x.arc(ax,ay,ar*5.2,0,7); x.fill();
  x.globalAlpha=1;
  x.fillStyle=C.astre;
  x.beginPath(); x.arc(ax,ay,ar,0,7); x.fill();
  if(k==='spirale'){                       // la planète a des anneaux
    x.strokeStyle=C.halo; x.globalAlpha=.75;
    [1.9,2.25,2.6].forEach((m,i)=>{
      x.lineWidth=ar*(0.14-i*0.03);
      x.save(); x.translate(ax,ay); x.rotate(-0.32); x.scale(1,0.2);
      x.beginPath(); x.arc(0,0,ar*m,0,7); x.stroke(); x.restore();
    });
    x.globalAlpha=1;
  }
  // 5) la bande d'horizon, reprise telle quelle pour la brume du terrain
  const d=x.getImageData(0,Math.round(H*0.50),W,4).data;
  let r=0,v=0,b=0,n=0;
  for(let i=0;i<d.length;i+=4){ r+=d[i]; v+=d[i+1]; b+=d[i+2]; n++; }
  PANO_HZ[k]=(Math.round(r/n)<<16)|(Math.round(v/n)<<8)|Math.round(b/n);
  const t=new THREE.CanvasTexture(cv);
  t.mapping=THREE.EquirectangularReflectionMapping;
  t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=THREE.RepeatWrapping;
  t.needsUpdate=true;
  return t;
}
['volcan','fete','spirale','archipel','temple'].forEach(k=>{ PANO[k]=cielTex(k); });
/* textures Meshy plaquées sur les blocs du socle (une par thème de carte) */
const VOXTEX={};
['volcan','fete','spirale','archipel','temple'].forEach(k=>{
  new THREE.TextureLoader().load('/art/voxtex-'+k+'.jpg'+ART_V,t=>{
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=THREE.SRGBColorSpace;
    t.repeat.set(1,1); // un bloc = un motif COMPLET : la matiere se lit
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
let vClose=22, vFull=48, vCur=26, elCur=.56, azimAuto=0;    // zoom suivi / zoom vue d'ensemble (lerpé)
B3DoverviewInit();
function B3DoverviewInit(){ B3D.overview=false; }
let azim=0, azimBase=0, dragX=null, dragMoved=false;
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
/* ---------- DÉCOR 3D des cartes (modèles Meshy) ----------
   Chaque carte a ses pièces maîtresses et ses props de fond. On les charge à la
   demande, on les met à l'échelle par leur boîte réelle, et on les ancre au sol
   loin des dalles pour qu'aucun ne chevauche le parcours. */
const DECO3D={};
/* [fichier, hauteur en unités monde, rayon d'emprise, nombre d'exemplaires] */
const DECOR={
  volcan:[['volcan-cone',26,15,1],['volcan-crane',7,5,1],['volcan-arche',11,6,2],
          ['volcan-obsidienne',5,3.4,7],['volcan-geyser',3.4,3,5]],
  fete:  [['fete-roue',20,10,1],['fete-chapiteau',13,8,1],['fete-carrousel',9,6,1],
          ['fete-igloo',5,4,3],['fete-sapin',7,3.4,8]],
  spirale:[['spirale-station',12,7,1],['spirale-portail',13,7,1],['spirale-lune',9,6,1],
          ['spirale-asteroide',6,4,6],['spirale-cristal',5,3.2,7]],
  archipel:[['archipel-epave',12,8,1],['archipel-huitre',6,5,1],['archipel-tiki',8,4,3],
          ['archipel-palmier',9,4,8],['archipel-corail',4,3,6]],
  temple:[['temple-pyramide',18,11,1],['temple-olmeque',8,5,2],['temple-jaguar',6,4,2],
          ['temple-colonne',9,4,4],['temple-totem',6,3.4,3]]
};
function decoGLB(nom,cb){
  const e=DECO3D[nom];
  if(e){ if(e.ok) cb(e.scene); else if(!e.fail) (e.q=e.q||[]).push(cb); return; }
  DECO3D[nom]={ok:0,q:[cb]};
  loader.load('/art/deco-'+nom+'.glb',g=>{
    const q=(DECO3D[nom]&&DECO3D[nom].q)||[];
    DECO3D[nom]={ok:1,scene:g.scene};
    q.forEach(f=>{ try{ f(g.scene); }catch(err){} });
    B3D.built='';                       // le décor arrive : on rebâtit la carte
    try{ if(window.room&&room.status==='board'&&typeof render==='function') render(); }catch(e2){}
  },undefined,()=>{ DECO3D[nom]={ok:0,fail:1}; });
}
/* pose un modèle : mise à l'échelle par sa vraie boîte, pieds au sol */
function poseDeco(g,src,x,z,haut,rot,teinte){
  const m=src.clone(true);
  let bb=new THREE.Box3().setFromObject(m);
  const t=bb.getSize(new THREE.Vector3());
  m.scale.setScalar(haut/Math.max(.001,t.y));
  m.updateMatrixWorld(true);
  bb.setFromObject(m);
  m.position.set(x-(bb.min.x+bb.max.x)/2, -bb.min.y, z-(bb.min.z+bb.max.z)/2);
  m.rotation.y=rot||0;
  m.traverse(o=>{
    if(!o.isMesh) return;
    o.castShadow=true; o.receiveShadow=true;
    // les modèles arrivent sans texture : on les teinte au thème de la carte
    o.material=new THREE.MeshStandardMaterial({color:teinte,roughness:.88,flatShading:true});
  });
  g.add(m);
  return m;
}
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
  const c=document.createElement('canvas'); c.width=384; c.height=108;
  const g=c.getContext('2d');
  const txt=(nom||'?').slice(0,12);
  g.font='800 52px "Baloo 2", sans-serif';
  const w=Math.min(372,g.measureText(txt).width+48), x=(384-w)/2;
  // pastille sombre + liseré à la couleur du joueur : lisible sur n'importe quel décor
  g.fillStyle='rgba(16,10,38,.82)';
  g.beginPath(); g.roundRect(x,14,w,68,34); g.fill();
  g.lineWidth=6; g.strokeStyle=couleur||'#FFD644'; g.stroke();
  g.font='800 52px "Baloo 2", sans-serif';
  g.textAlign='center'; g.textBaseline='middle';
  g.fillStyle='#FFF7FF'; g.fillText(txt,192,50);
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

/* ---------- PAYSAGE : le plateau est posé dans un décor, pas sur une dalle ----------
   Un terrain radial en relief part du pied de l'île, ondule en collines puis se
   dresse en crêtes à l'horizon. Ses sommets sont teintés progressivement de la
   couleur du ciel : le raccord avec le panorama n'a plus de couture. */
function relief(x,z){
  return Math.sin(x*.0210)*Math.cos(z*.0170)*1.0
       + Math.sin(x*.0071+1.3)*Math.cos(z*.0091-.7)*2.4
       + Math.sin((x+z)*.0043+2.1)*3.2
       + Math.sin(x*.0031-.9)*Math.sin(z*.0037+1.7)*4.0;
}
function paysage(amb2,tex,rIle){
  const R=1000, ANN=58, SEG=112;      // anneaux / secteurs : assez dense pour la brume
  const y0=-3.2;                      // niveau du pied de l'île
  const plat=Math.max(70,rIle+30);    // couronne plate autour de l'île (on ne cache rien)
  const cSol=new THREE.Color(amb2.sea);
  // les reliefs lointains tirent vers le ciel sans s'y fondre : ils gardent
  // juste ce qu'il faut de matiere pour se decouper en silhouettes
  const cCiel=new THREE.Color(PANO_HZ[room.mapId]!=null?PANO_HZ[room.mapId]:amb2.sky);
  const cLoin=cCiel.clone().multiplyScalar(.72);
  const pos=[],col=[],uvs=[],idx=[];
  const c=new THREE.Color();
  for(let a=0;a<=ANN;a++){
    const t=a/ANN;
    const rad=plat+Math.pow(t,1.8)*(R-plat);
    for(let s=0;s<=SEG;s++){
      const ang=s/SEG*Math.PI*2;
      const x=Math.cos(ang)*rad, z=Math.sin(ang)*rad;
      // ondulations partout, puis chaine de sommets qui se dresse vers l'horizon
      // quelques sommets marques plutot qu'une tolerie reguliere
      const crete=(Math.pow(Math.abs(Math.sin(ang*1.7+.9)),3)
                 +Math.pow(Math.abs(Math.sin(ang*3.1-2.0)),6)*.8
                 +Math.pow(Math.abs(Math.cos(ang*2.3+2.6)),5)*.6)/2.4;
      // hauteurs a l'echelle du plateau : des collines, pas des Alpes
      const h=relief(x,z)*t*1.7 + Math.pow(t,2.3)*40*crete;
      pos.push(x,y0+h,z);
      uvs.push(x/27,z/27);
      c.copy(cSol).lerp(cLoin,Math.min(1,Math.pow(t,.8)*1.05));
      col.push(c.r,c.g,c.b);
    }
  }
  const row=SEG+1;
  for(let a=0;a<ANN;a++) for(let s=0;s<SEG;s++){
    const i=a*row+s;
    idx.push(i,i+row,i+1, i+1,i+row,i+row+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  let m=null;
  if(tex){
    m=tex.clone();
    m.wrapS=m.wrapT=THREE.RepeatWrapping;
    m.repeat.set(1,1);
    m.anisotropy=renderer?renderer.capabilities.getMaxAnisotropy():8;
    m.minFilter=THREE.LinearMipmapLinearFilter;
    m.generateMipmaps=true;
    m.needsUpdate=true;
  }
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,map:m,
    emissive:amb2.seaGlow,emissiveIntensity:amb2.em,roughness:.95,flatShading:true});
  const sol=new THREE.Mesh(geo,mat);
  sol.position.set(CENTER.x,0,CENTER.z);
  sol.receiveShadow=true;
  // semis de rochers : le milieu de plan respire au lieu d'etre une plaine nue
  const gRoc=new THREE.Group();
  const cRoc=new THREE.Color();
  for(let i=0;i<150;i++){
    const ang=i*2.39996;                       // spirale d'or : reparti sans motif
    const t=.06+Math.pow(i/150,.8)*.94;
    const rad=plat+12+t*(R*.52);
    const x=Math.cos(ang)*rad, z=Math.sin(ang)*rad;
    const ech=1.4+Math.abs(Math.sin(i*12.9898))*5.6+t*4;
    const g=new THREE.ConeGeometry(ech*.62,ech*(1.1+Math.abs(Math.cos(i*4.1))*1.5),5+(i%3));
    cRoc.copy(cSol).lerp(cLoin,Math.min(.85,t*.9)).multiplyScalar(.86);
    const r=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:cRoc.getHex(),roughness:1,flatShading:true}));
    r.position.set(x,y0+relief(x,z)*t*2.0+ech*.2,z);
    r.rotation.y=ang;
    r.rotation.z=Math.sin(i*7.3)*.09;
    gRoc.add(r);
  }
  gRoc.position.set(CENTER.x,0,CENTER.z);
  // le disque plat sous l'île, pour qu'aucun trou n'apparaisse au pied du socle
  const dg=new THREE.CircleGeometry(plat+1,SEG);
  const disq=new THREE.Mesh(dg,new THREE.MeshStandardMaterial({color:amb2.sea,map:m,
    emissive:amb2.seaGlow,emissiveIntensity:amb2.em,roughness:.95}));
  disq.rotation.x=-Math.PI/2;
  disq.position.set(CENTER.x,y0,CENTER.z);
  disq.receiveShadow=true;
  return {sol,disq,mat,plat,gRoc};
}

/* ---------- init ---------- */
function init(){
  wrap=document.getElementById('boardWrap');
  if(!wrap) return false;
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x171030);
  scene.fog=new THREE.Fog(0x171030,80,190);
  cam=new THREE.PerspectiveCamera(42,1,1.5,7000);
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
/* le cadre remplit tout l'espace entre les cartes joueurs et la barre de dé,
   pour qu'on suive la partie sans jamais scroller */
function hauteurCadre(){
  const l=Math.max(320,wrap.clientWidth);
  const hud=document.getElementById('hud');
  const dz=document.getElementById('diceZone');
  const haut=hud?hud.getBoundingClientRect().height+20:130;
  const bas=dz?Math.max(86,dz.getBoundingClientRect().height+8):104;
  const ratio=l<720?1.25:.82;   // tel : cadre plus haut que large / desktop : cinemascope
  return Math.round(Math.max(340,Math.min(innerHeight-haut-bas,l*ratio)));
}
function sizeToWrap(){
  if(!wrap||!canvas.parentNode) return;
  wrap.style.height=hauteurCadre()+'px';
  const w=wrap.clientWidth, h=wrap.clientHeight||1;
  renderer.setSize(w,h,false);
  cam.aspect=w/Math.max(1,h);
  cam.fov=(w/h)<0.85?50:42;          // portrait : on ouvre pour voir la route devant
  cam.updateProjectionMatrix();
  vClose=TILE*10.4;                   // suivi rapproche : ~7 dalles devant soi
  vFull=Math.max(SPAN*1.15,TILE*16); // vue d'ensemble
}
function applyCam(){}


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
  // fond : une VOÛTE lointaine (le panorama plaque sur une sphere geante) plutot
  // qu'un arriere-plan etire par la perspective — l'image reste nette
  scene.background=new THREE.Color(amb2.sky);
  if(B3D.ciel){ scene.remove(B3D.ciel); B3D.ciel=null; }
  const pano=PANO[room.mapId];
  if(pano){
    pano.mapping=THREE.EquirectangularReflectionMapping;
    const geoC=new THREE.SphereGeometry(420,40,26);
    geoC.scale(-1,1,1);
    const ciel=new THREE.Mesh(geoC,new THREE.MeshBasicMaterial({map:pano,fog:false,color:0xFFFFFF,
      toneMapped:false,depthWrite:false,depthTest:false}));
    ciel.renderOrder=-1000;
    ciel.position.set(CENTER.x,-3.2,CENTER.z); // horizon de la voute pile sur le sol
    B3D.ciel=ciel;
    scene.add(ciel);
  }
  // la brume prend la teinte exacte de l'horizon du panorama : le sol s'y fond
  // sans bande sombre ni bord visible
  scene.fog=new THREE.Fog(PANO_HZ[room.mapId]!=null?PANO_HZ[room.mapId]:amb2.sky,260,1800);
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
  const MARGE=54; // tres large plateforme : le parcours vit sur un vrai continent
  const NX=Math.ceil((maxX-minX+MARGE)/CELL), NZ=Math.ceil((maxZ-minZ+MARGE)/CELL);
  const g1=new THREE.BoxGeometry(CELL,1,CELL);
  const tex=VOXTEX[room.mapId];
  // texture du thème plaquée sur les blocs, teintes claires pour qu'elle RESSORTE
  // (le damier vient des deux teintes appliquées par-dessus la matière)
  const mA=new THREE.MeshStandardMaterial({color:tex?0xFFFFFF:pal.a,map:tex||null,roughness:.92});
  const mB=new THREE.MeshStandardMaterial({color:tex?0xBFB2E4:pal.b,map:tex||null,roughness:.92});
  const mGlow=new THREE.MeshStandardMaterial({color:pal.glowC,emissive:pal.glow,emissiveIntensity:1.3,roughness:.6});
  B3D.mGlow=mGlow;
  const rng=(s=>()=>{s=(s*16807)%2147483647;return s/2147483647;})(42);
  for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){
    const x=minX-MARGE/2+(i+.5)*CELL, z=minZ-MARGE/2+(j+.5)*CELL;
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
  // les cartes aérées (refonte) gagnent des dalles plus LARGES : l'empreinte
  // suit l'espacement moyen entre cases voisines, bornée pour ne pas se toucher
  let dSum=0,dN=0;
  nodes.forEach((n,i)=>{ const pw=toW(n); (n.next||[]).forEach(j=>{ const q=toW(nodes[j]);
    dSum+=Math.hypot(pw.x-q.x,pw.z-q.z); dN++; }); });
  const dMoy=dN?dSum/dN:TILE*1.6;
  const KD=Math.max(1,Math.min(1.42,dMoy/(TILE*1.75)));
  const pillG={}, pillM=new THREE.MeshStandardMaterial({color:0x2A2038,roughness:.9});
  nodes.forEach((n,i)=>{
    const p=toW(n);
    const active=n.t==='starT'&&i===room.starIdx;
    const hPil=.8+(n.h||0)*ETAGE;
    const gk=hPil.toFixed(2);
    if(!pillG[gk]) pillG[gk]=new THREE.BoxGeometry(TILE*KD,hPil,TILE*KD);
    const pl=new THREE.Mesh(pillG[gk],pillM);
    pl.position.set(p.x,p.y-hPil/2+.3,p.z);
    pl.castShadow=pl.receiveShadow=true; pl.userData.shared=1;
    gStatic.add(pl);
    const col=active?0xFFD644:TYPE_COL[n.t]||0x8F86C8;
    const emit=active?0xAA7A00:TYPE_EMIT[n.t]||0x191430;
    const rim=new THREE.Mesh(new THREE.BoxGeometry(TILE*1.18*KD,.14,TILE*1.18*KD),
      new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.5,roughness:.4}));
    rim.position.set(p.x,p.y+.32,p.z);
    rim.userData={ph:i*.7,base:active?.95:(n.t!=='blue'?.55:.32)};
    rims.push(rim);
    gStatic.add(rim);
    const top=new THREE.Mesh(new THREE.BoxGeometry(TILE*1.05*KD,TILE_H,TILE*1.05*KD),
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
  // ----- PAYSAGE : collines et cretes autour de l'ile jusqu'a l'horizon -----
  const pay=paysage(amb2,tex,Math.max(SPAN*.6,84));
  B3D.seaMat=pay.mat; B3D.seaEm=amb2.em;
  gStatic.add(pay.sol); gStatic.add(pay.disq); gStatic.add(pay.gRoc);
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
  // ----- masse rocheuse sous l'ile : elle repose sur quelque chose -----
  const sombre=(c,f)=>((Math.round(((c>>16)&255)*f)<<16)|(Math.round(((c>>8)&255)*f)<<8)|Math.round((c&255)*f));
  const rocheM=new THREE.MeshStandardMaterial({color:sombre(pal.a,.78),map:tex||null,roughness:1});
  const rocheM2=new THREE.MeshStandardMaterial({color:sombre(pal.a,.55),roughness:1,flatShading:true});
  const gRoche=new THREE.BoxGeometry(CELL,1,CELL);
  for(let couche=1;couche<=4;couche++){
    const marge=couche*1.15;                   // chaque couche rentre vers l'interieur
    const yy=-1.1-couche*1.25;
    for(let i=0;i<NX;i++) for(let j=0;j<NZ;j++){
      const x=minX-MARGE/2+(i+.5)*CELL, z=minZ-MARGE/2+(j+.5)*CELL;
      const edge=Math.min(i,NX-1-i,j,NZ-1-j);
      if(edge<marge) continue;                 // le dessous se retrecit : forme de rocher
      if(couche>2&&rng()<.3) continue;
      const m=new THREE.Mesh(gRoche,couche<3?rocheM:rocheM2);
      m.position.set(x,yy,z);
      m.scale.y=1.3;
      m.userData.shared=1;
      gStatic.add(m);
    }
  }
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
/* teintes du décor, une par carte (les modèles arrivent sans texture) */
const DECO_COL={
  volcan:[0x6B4038,0x8A5040,0x4A2A26],
  fete:[0xC96BB8,0x8E7CFF,0x5AC8FA],
  spirale:[0x8E7CFF,0x6A78C8,0xC39BFF],
  archipel:[0x5FA88A,0xC9A86A,0x7FD8C8],
  temple:[0x7A8A5A,0xA88A4A,0x5A7A4E]
};
/* sème les pièces du décor autour de l'île, jamais sur le parcours */
function semerDecor(g,mapId){
  const liste=DECOR[mapId]; if(!liste) return;
  const cols=DECO_COL[mapId]||DECO_COL.fete;
  const rnd=(s2=>()=>{s2=(s2*16807)%2147483647;return s2/2147483647;})(mapId.length*7717+13);
  let ci=0;
  liste.forEach(([nom,haut,emprise,nb],li)=>{
    decoGLB(nom,src=>{
      const teinte=cols[(ci++)%cols.length];
      for(let k=0;k<nb;k++){
        let x=0,z=0,ok=false;
        // la piece maitresse trone au COEUR de la carte (volcan, pyramide, grande
        // roue) : c'est la qu'elle raconte quelque chose. Le reste peuple l'anneau.
        if(li===0&&k===0){
          for(const d of [0,.18,.36,.54,.72]){
            for(let a2=0;a2<8&&!ok;a2++){
              const ang=a2*Math.PI/4;
              x=CENTER.x+Math.cos(ang)*SPAN*d; z=CENTER.z+Math.sin(ang)*SPAN*d;
              ok=libre(x,z,emprise+TILE*1.1);
            }
            if(ok) break;
          }
        }
        for(let essai=0;essai<50&&!ok;essai++){
          const a=rnd()*Math.PI*2;
          const r=SPAN*.34+rnd()*SPAN*.52;
          x=CENTER.x+Math.cos(a)*r; z=CENTER.z+Math.sin(a)*r;
          ok=libre(x,z,emprise+TILE*1.1);
        }
        if(!ok) continue;
        poseDeco(g,src,x,z,haut*(li<3?1:(.75+rnd()*.5)),rnd()*Math.PI*2,teinte);
      }
    });
  });
}
function buildProps(g,mapId,pal){
  NW=room.board.map(n=>toW(n));
  semerDecor(g,mapId);
  const dark=new THREE.MeshStandardMaterial({color:0x241B38,roughness:.95,flatShading:true});
  if(mapId==='volcan'){
    const volc=new THREE.Group();
    const cone=new THREE.Mesh(new THREE.ConeGeometry(4.4,5,9),dark);
    cone.position.y=2.5; cone.castShadow=true; volc.add(cone);
    const socleV=new THREE.Mesh(new THREE.CylinderGeometry(5.6,7.4,2.4,9),dark);
    socleV.position.y=-1; socleV.receiveShadow=true; volc.add(socleV); // il repose sur la roche
    const crater=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.9,1,9),
      new THREE.MeshStandardMaterial({color:0xFF7A22,emissive:0xFF5A10,emissiveIntensity:2,flatShading:true}));
    crater.position.y=4.8; volc.add(crater);
    B3D.crater=crater;
    const p0=toW({x:205,y:280,h:0});
    const p=ancre(p0.x,p0.z,6.2);   // le volcan ne mord sur aucune case
    volc.position.set(p.x,0,p.z); // pose au sol : plus de levitation
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
    const pied=new THREE.Mesh(new THREE.CylinderGeometry(.18,.55,4.6,6),dark);
    pied.position.y=-2.3;   // descend pile jusqu'au sol : la roue ne flotte plus
    roue.add(pied);
    const pr0=toW({x:355,y:120,h:0});
    const pr=ancre(pr0.x,pr0.z,7.2);
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
  lab.scale.set(5.4,1.5,1);
  lab.position.y=HERO_H*2.2+1.55;
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
  if(B3D.ciel) B3D.ciel.position.set(cam.position.x,-3.2,cam.position.z);
  if(B3D.fluxMat&&B3D.fluxMat.map) B3D.fluxMat.map.offset.y=-(t*.00022)%1; // les chevrons s'écoulent
  if(B3D.seaMat) B3D.seaMat.emissiveIntensity=B3D.seaEm*(1+Math.sin(t*.0016)*.28);
  if(B3D.gPortee) B3D.gPortee.children.forEach(sp=>{
    sp.position.y=sp.userData.y+Math.sin(t*.004-sp.userData.d*.9)*.24;
  });
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
  // ---- camera facon jeu de plateau : basse, derriere le joueur, tournee vers la route ----
  const cur=room&&room.players&&room.players[room.turn];
  const po=cur&&B3D.pions[cur.id];
  if(!B3D.overview&&po) focusTarget.copy(po.cur);
  else focusTarget.copy(CENTER);
  if(!B3D.overview&&po&&cur&&room.board){
    let dx=po.target.x-po.cur.x, dz=po.target.z-po.cur.z;
    if(Math.hypot(dx,dz)<.35){
      const n=room.board[cur.pos];
      const nx=n&&n.next&&room.board[n.next[0]];
      if(nx){ const a2=toW(n), b2=toW(nx); dx=b2.x-a2.x; dz=b2.z-a2.z; }
    }
    if(Math.hypot(dx,dz)>.05){
      const want=Math.atan2(-dx,-dz);
      let d2=want-azimAuto;
      while(d2>Math.PI) d2-=Math.PI*2;
      while(d2<-Math.PI) d2+=Math.PI*2;
      azimAuto+=d2*Math.min(1,dt*1.5);
      const L=Math.hypot(dx,dz)||1;
      focusTarget.x+=dx/L*TILE*2.2;
      focusTarget.z+=dz/L*TILE*2.2;
    }
  }
  FOCUS.lerp(focusTarget,Math.min(1,dt*2.6));
  const vWant=B3D.overview?vFull:vClose;
  vCur+=(vWant-vCur)*Math.min(1,dt*2.6);
  const elWant=B3D.overview?1.02:.70;
  elCur+=(elWant-elCur)*Math.min(1,dt*2.6);
  const az=(B3D.overview?azim:azimAuto+azim)+Math.sin(t*.00008)*.02;
  cam.position.set(FOCUS.x+Math.sin(az)*vCur*Math.cos(elCur),
                   Math.max(2.5,vCur*Math.sin(elCur)),
                   FOCUS.z+Math.cos(az)*vCur*Math.cos(elCur));
  cam.lookAt(FOCUS.x,B3D.overview?2.0:TILE*1.05,FOCUS.z); // le plateau remplit le cadre, l'horizon reste en haut
  renderer.render(scene,cam);
}

/* ---------- API appelée par le jeu (scripts classiques) ---------- */
B3D.render=function(){
  if(!B3D.ok) return false;
  if(!room||!room.board) return false;
  if(!canvas.parentNode||wrap.firstChild!==canvas){
    wrap.innerHTML='';
    wrap.style.height=hauteurCadre()+'px';
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
  wrap.classList.add('chargement');
  const key=room.mapId+':'+room.starIdx+':'+room.board.length+':'+Object.keys(EL3D).filter(k=>EL3D[k].ok).length+':'+(VOXTEX[room.mapId]?'T':'')+':'+(room.cataSeq||0);
  if(B3D.built!==key){ B3D.built=key; build(); }
  // tout est bâti : on lève le voile à la première image réellement rendue
  requestAnimationFrame(()=>requestAnimationFrame(()=>wrap.classList.remove('chargement')));
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
      // plusieurs joueurs sur la même case : les étiquettes s'empilent au lieu
      // de se recouvrir (la plus haute au joueur dont c'est le tour)
      const rang=here.findIndex(q=>q.id===p.id);
      po.label.position.y=HERO_H*2.2+1.55+(here.length-1-rang)*1.35;
      po.label.renderOrder=6+(here.length-1-rang);
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

/* ---------- carrefours : balises 3D geantes au-dessus des routes possibles ---------- */
B3D.routes=function(list){
  B3D.routesOff();
  if(!scene) return;
  const g=new THREE.Group();
  list.forEach(o=>{
    const w=toW(o.node);
    const col=new THREE.Color(o.col);
    // colonne de lumiere coloree : on voit la route depuis n'importe ou
    const ray=new THREE.Mesh(new THREE.CylinderGeometry(TILE*.62,TILE*.62,9,12,1,true),
      new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.30,side:THREE.DoubleSide,depthWrite:false}));
    ray.position.set(w.x,w.y+4.6,w.z);
    g.add(ray);
    // anneau au sol
    const an=new THREE.Mesh(new THREE.TorusGeometry(TILE*.72,.16,6,26),
      new THREE.MeshBasicMaterial({color:col}));
    an.rotation.x=Math.PI/2; an.position.set(w.x,w.y+.82,w.z);
    g.add(an);
    // gros numero flottant
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:badgeTex(String(o.num),'#'+col.getHexString(),'#1a1030'),
      transparent:true,depthWrite:false,depthTest:false}));
    sp.scale.set(3.4,3.4,1);
    sp.position.set(w.x,w.y+7.2,w.z);
    sp.renderOrder=9;
    g.add(sp);
  });
  B3D.gJonc=g;
  scene.add(g);
};
B3D.routesOff=function(){ if(B3D.gJonc&&scene){ scene.remove(B3D.gJonc); B3D.gJonc=null; } };

/* ---------- portée du dé : pastilles 1-6 au-dessus des cases atteignables ---------- */
const PORTEE_TEX={};
function porteeTex(d){
  if(PORTEE_TEX[d]) return PORTEE_TEX[d];
  const cols=['#3EE6C1','#3EE6C1','#FFD644','#FFD644','#FF9F45','#FF5FA2'];
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d');
  x.beginPath(); x.arc(64,64,54,0,7);
  x.fillStyle='rgba(16,10,38,.9)'; x.fill();
  x.lineWidth=9; x.strokeStyle=cols[d-1]; x.stroke();
  x.fillStyle='#fff'; x.font='800 66px "Baloo 2",sans-serif';
  x.textAlign='center'; x.textBaseline='middle'; x.fillText(String(d),64,70);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  PORTEE_TEX[d]=t; return t;
}
B3D.portee=function(list){
  if(!scene) return;
  B3D.porteeOff();
  const g=new THREE.Group();
  list.forEach(it=>{
    const p=toW(it.node);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:porteeTex(it.dist),transparent:true,depthTest:false,depthWrite:false}));
    sp.renderOrder=880;
    sp.position.set(p.x,p.y+1.4,p.z);
    sp.scale.set(1.2,1.2,1);
    sp.userData.d=it.dist; sp.userData.y=p.y+1.4;
    g.add(sp);
  });
  B3D.gPortee=g;
  scene.add(g);
};
B3D.porteeOff=function(){ if(B3D.gPortee&&scene){ scene.remove(B3D.gPortee); B3D.gPortee=null; } };
B3D.detach=function(){
  if(canvas&&canvas.parentNode) canvas.parentNode.removeChild(canvas);
};

try{ B3D.ok=init(); B3D.ready=B3D.ok; }catch(e){ B3D.ok=false; }
