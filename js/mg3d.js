/* =================== moteur d'arène 3D des mini-jeux ===================
   Scène three.js jetable montée dans #mgArea : sol voxel du thème, héros 3D
   (les mêmes modèles que sur le plateau), objets, joystick tactile.
   Exposé en window.MG3D pour les mini-jeux (scripts classiques). */
import * as THREE from 'three';
import {GLTFLoader} from '/js/GLTFLoader.js';

const M={ok:false,on:false};
window.MG3D=M;

let ren=null,scene=null,cam=null,areaEl=null,raf=null,frameCb=null,lastT=0;
let camFocus=new THREE.Vector3(), camWant=new THREE.Vector3(), camDist=30, camEl=.86, camAz=Math.PI/4;
let camVise=1, camLerp=3.2, fovBase=42, camAzWant=null, camFps=false, camEpaule=0;   // point visé au-dessus/au-dessous du joueur, et vivacité du suivi
const loader=new GLTFLoader(), texL=new THREE.TextureLoader();
const TEX={};
const heroes=[]; // handles vivants (pour l'animation procédurale)

try{
  const c=document.createElement('canvas');
  M.ok=!!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl')));
}catch(e){ M.ok=false; }

function tex(theme){
  const k=theme||'fete';
  if(!TEX[k]){
    TEX[k]=texL.load('/art/voxtex-'+k+'.jpg?v=3');
    TEX[k].wrapS=TEX[k].wrapT=THREE.RepeatWrapping;
    TEX[k].colorSpace=THREE.SRGBColorSpace;
    TEX[k].repeat.set(.5,.5);
  }
  return TEX[k];
}

/* ---------- création / destruction de l'arène ---------- */
M.init=function(el,opt){
  if(!M.ok) return false;
  M.stop();
  opt=opt||{};
  areaEl=el;
  const W=el.clientWidth||320, H=el.clientHeight||320;
  scene=new THREE.Scene();
  const sky=opt.sky!==undefined?opt.sky:0x171030;
  scene.background=new THREE.Color(sky);
  const fg=opt.fog||[42,110];
  scene.fog=new THREE.Fog(sky,fg[0],fg[1]);
  fovBase=opt.fov||42;
  cam=new THREE.PerspectiveCamera(fovBase,W/H,.5,opt.far||300);
  ren=new THREE.WebGLRenderer({antialias:true});
  ren.setPixelRatio(Math.min(2,devicePixelRatio));
  ren.setSize(W,H,false);
  ren.shadowMap.enabled=true;
  ren.shadowMap.type=THREE.PCFSoftShadowMap;
  ren.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;border-radius:16px;touch-action:none;';
  el.appendChild(ren.domElement);
  scene.add(new THREE.AmbientLight(0x9A8AD0,1.25));
  const sun=new THREE.DirectionalLight(0xFFE6C8,1.7);
  sun.position.set(16,30,12); sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);
  const sc=sun.shadow.camera; sc.left=-30; sc.right=30; sc.top=30; sc.bottom=-30;
  scene.add(sun);
  camDist=opt.dist||30; camEl=opt.el||.86;
  camAz=opt.az!==undefined?opt.az:Math.PI/4;
  camAzWant=null;
  camFps=!!opt.fps;                          // visee par-dessus l'epaule (jeux de tir)
  camEpaule=opt.epaule||0;                   // decalage lateral : le heros libere la mire
  camVise=opt.vise!==undefined?opt.vise:1;   // hauteur visee par rapport au joueur
  camLerp=opt.lerp||3.2;                     // vivacite du suivi
  camFocus.set(0,0,0); camWant.set(0,0,0);
  heroes.length=0;
  M.on=true; lastT=performance.now();
  loop();
  return true;
};
M.stop=function(){
  M.on=false; frameCb=null;
  if(raf) cancelAnimationFrame(raf); raf=null;
  if(ren){
    try{ if(ren.domElement.parentNode) ren.domElement.parentNode.removeChild(ren.domElement); }catch(e){}
    try{ ren.dispose(); }catch(e){}
  }
  ren=null; scene=null; cam=null; areaEl=null; heroes.length=0;
  M.stick=null;
};
M.frame=function(cb){ frameCb=cb; };
/* convertit le joystick en direction MONDE relative a la camera :
   pousser vers le haut envoie toujours le heros vers le fond de l'ecran,
   quel que soit l'angle de vue. */
/* oeil + direction reellement rendus : la mire et le tir ne peuvent plus diverger */
M.viseur=function(){
  if(!cam) return null;
  const d=new THREE.Vector3(); cam.getWorldDirection(d);
  return {pos:cam.position.clone(), dir:d};
};
M.dir=function(sx,sy){
  const c=Math.cos(camAz), s2=Math.sin(camAz);
  return {x:sx*c+sy*s2, z:-sx*s2+sy*c};
};
M.look=function(x,z,snap,y){ camWant.set(x,y||0,z); if(snap) camFocus.copy(camWant); };
/* recadrage en cours de jeu : distance, hauteur d'oeil, point vise, vivacite */
M.cadre=function(o){
  if(!o) return;
  if(o.dist!==undefined) camDist=o.dist;
  if(o.el!==undefined) camEl=o.el;
  if(o.az!==undefined){ camAz=o.az; camAzWant=null; }
  if(o.azWant!==undefined) camAzWant=o.azWant;   // vue de dos : on glisse derriere le joueur
  if(o.vise!==undefined) camVise=o.vise;
  if(o.fps!==undefined) camFps=!!o.fps;
  if(o.epaule!==undefined) camEpaule=o.epaule;
  if(o.lerp!==undefined) camLerp=o.lerp;
};
M.setAz=function(a){ camAz=a; };

/* ---------- sol : plateforme circulaire du thème + liseré lumineux + bord voxel ---------- */
M.floor=function(o){
  o=o||{};
  const size=o.size||24, R=size/2;
  const t=tex(o.theme); t.repeat.set(4,4); // texture propre au moteur des mini-jeux
  const g=new THREE.Group();
  const disc=new THREE.Mesh(new THREE.CylinderGeometry(R,R*.94,1.8,40),
    new THREE.MeshStandardMaterial({color:0xC9BDE8,map:t,roughness:.92}));
  disc.position.y=-.9; disc.receiveShadow=true;
  g.add(disc);
  const col=o.rim!==undefined?o.rim:0xFFD644;
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,.24,6,44),
    new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:1.1,roughness:.4}));
  rim.rotation.x=Math.PI/2;
  g.add(rim);
  // petits blocs qui débordent (le style voxel du plateau)
  const cubM=new THREE.MeshStandardMaterial({color:0x2A2038,roughness:.95});
  for(let i=0;i<26;i++){
    const a=i/26*Math.PI*2;
    const c=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.4,1.5),cubM);
    c.position.set(Math.cos(a)*(R+.5),-1.5-(i%3)*.4,Math.sin(a)*(R+.5));
    g.add(c);
  }
  scene.add(g);
  return {group:g,disc,rim,
    shrink(r){ const k=Math.max(.05,r/R); disc.scale.set(k,1,k); rim.scale.set(k,k,1); }};
};

/* ---------- mise à l'échelle FIABLE d'un personnage ----------
   La boîte englobante d'un modèle riggé est calculée sur sa pose de repos
   (souvent recroquevillée) : elle ment. On mesure donc le SQUELETTE une fois
   le personnage posé par l'animation, ce qui donne sa vraie stature. */
function heroBox(m){
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
M.fit=function(m,targetH){
  // MÊME règle pour tout le monde : la boîte réelle fait exactement targetH de haut
  const bb=heroBox(m);
  const size=bb.getSize(new THREE.Vector3());
  m.scale.setScalar(targetH/Math.max(.0001,size.y));
  const bb2=heroBox(m);
  m.position.y-=bb2.min.y;
  m.position.x-=(bb2.min.x+bb2.max.x)/2;
  m.position.z-=(bb2.min.z+bb2.max.z)/2;
};

/* etiquette flottante : pastille sombre, liseré couleur du joueur, dorée pour SOI */
function labelSpr(nom,couleur,moi){
  const c=document.createElement('canvas'); c.width=512; c.height=128;
  const x=c.getContext('2d');
  x.font='800 54px "Baloo 2",sans-serif';
  const l=Math.min(430,x.measureText(nom).width+70);
  const X=(512-l)/2, R=46;
  x.beginPath();
  x.moveTo(X+R,14); x.arcTo(X+l,14,X+l,14+R,R); x.arcTo(X+l,106,X+l-R,106,R);
  x.arcTo(X,106,X,106-R,R); x.arcTo(X,14,X+R,14,R); x.closePath();
  x.fillStyle='rgba(18,11,40,.88)'; x.fill();
  x.lineWidth=moi?9:6;
  x.strokeStyle=moi?'#FFD644':(couleur||'#8E7CFF');
  x.stroke();
  x.fillStyle='#fff'; x.textAlign='center'; x.textBaseline='middle';
  x.fillText(nom,256,62,l-54);
  if(moi){ x.font='800 40px "Baloo 2",sans-serif'; x.fillStyle='#FFD644'; x.fillText('▼',256,120); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false,depthWrite:false}));
  sp.renderOrder=900;                       // lisible meme derriere une plateforme
  sp.scale.set(moi?3.4:2.8,(moi?3.4:2.8)/4,1);
  return sp;
}

/* ---------- héros : modèle 3D du joueur (repli sprite détouré) ---------- */
M.hero=function(p,o){
  o=o||{};
  const h=o.h||2.3;
  const grp=new THREE.Group();
  scene.add(grp);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true}));
  spr.center.set(.5,.04);
  grp.add(spr);
  const skin=(p&&p.skin&&window.SKIN_OK&&SKIN_OK[p.skin])?p.skin:(p&&p.hero)||'astro';
  texL.load('/art/sprite-'+skin+'.png',t2=>{
    t2.colorSpace=THREE.SRGBColorSpace;
    spr.material.map=t2; spr.material.needsUpdate=true;
    const r=t2.image.width/t2.image.height;
    spr.scale.set(h*r,h,1);
  });
  // nom au-dessus de la tete : on sait toujours qui on pilote
  let moi=false;
  try{ moi=!!(window.curP&&p&&curP().id===p.id); }catch(e){}
  const lab=labelSpr((p&&p.name)||'?',(p&&p.color)||'#8E7CFF',moi);
  lab.position.y=h*2.15+(moi?.55:.3);
  grp.add(lab);
  const H={grp,mesh:null,x:o.x||0,z:o.z||0,dir:0,moving:false,alive:true,
    set(x,z){ H.x=x; H.z=z; grp.position.set(x,H.y||0,z); },
    face(a){ H.dir=a; if(H.mesh) grp.rotation.y=a; },
    kill(){ H.alive=false; }};
  H.y=0;
  grp.position.set(H.x,0,H.z);
  loader.load('/art/hero3d-'+skin+'-anim.glb',g=>{
    const m=g.scene;
    const skinned=!!(g.animations&&g.animations.length);
    if(skinned){
      H.mixer=new THREE.AnimationMixer(m);
      const walk=g.animations.find(a=>/walk/i.test(a.name))||g.animations[0];
      H.action=H.mixer.clipAction(walk); H.action.play();
      H.mixer.update(.35); // on pose le personnage AVANT de le mesurer
    }
    M.fit(m,h*1.9);
    m.traverse(q=>{ if(q.isMesh) q.castShadow=true; });
    grp.remove(spr);
    grp.add(m);
    H.mesh=m; H.baseY=m.position.y;
  },undefined,()=>{});
  heroes.push(H);
  return H;
};

/* ---------- objets simples (pièce, bombe, étoile, cube) ---------- */
const OBJ_GEO={};
M.obj=function(kind,o){
  o=o||{};
  const col=o.color!==undefined?o.color:(kind==='coin'?0xFFD644:kind==='bomb'?0x2A2038:kind==='star'?0xFFE9A8:0x8F86C8);
  if(!OBJ_GEO[kind]){
    OBJ_GEO[kind]=kind==='coin'?new THREE.CylinderGeometry(.62,.62,.16,12)
      :kind==='bomb'?new THREE.SphereGeometry(.62,8,7)
      :kind==='star'?new THREE.OctahedronGeometry(.8)
      :new THREE.BoxGeometry(1,1,1);
  }
  const m=new THREE.Mesh(OBJ_GEO[kind],new THREE.MeshStandardMaterial({
    color:col,emissive:o.emissive!==undefined?o.emissive:(kind==='coin'?0x6a4a00:kind==='star'?0x8a6a00:0),
    emissiveIntensity:.8,roughness:.5,flatShading:kind==='star'}));
  if(kind==='coin') m.rotation.x=Math.PI/2;
  m.position.set(o.x||0,o.y!==undefined?o.y:1,o.z||0);
  m.castShadow=true;
  scene.add(m);
  return m;
};
M.remove=function(m){ if(m&&scene) scene.remove(m); };
M.group=function(){ const g=new THREE.Group(); scene.add(g); return g; };
M.THREE=THREE;
M.debug=()=>({cam:cam?cam.position.toArray().map(v=>+v.toFixed(1)):null,
  focus:camFocus.toArray().map(v=>+v.toFixed(1)), az:+camAz.toFixed(2), el:+camEl.toFixed(2),
  heroes:heroes.map(h=>[+h.x.toFixed(1),+(h.y||0).toFixed(1),+h.z.toFixed(1)])});

/* ---------- éclat de particules (impact, ramassage) ---------- */
M.burst=function(x,y,z,col,n){
  if(!scene) return;
  const N=n||12, pos=new Float32Array(N*3), vel=[];
  for(let i=0;i<N;i++){
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
    const a=Math.random()*7, s=2+Math.random()*4;
    vel.push([Math.cos(a)*s,3+Math.random()*4,Math.sin(a)*s]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({color:col||0xFFD644,size:.42,transparent:true,opacity:1}));
  scene.add(pts);
  const t0=performance.now();
  (function anim(){
    const el=(performance.now()-t0)/1000;
    if(el>.9||!scene){ if(scene) scene.remove(pts); return; }
    const a=geo.attributes.position.array;
    for(let i=0;i<N;i++){
      a[i*3]+=vel[i][0]*.016; a[i*3+1]+=vel[i][1]*.016; a[i*3+2]+=vel[i][2]*.016;
      vel[i][1]-=.28;
    }
    geo.attributes.position.needsUpdate=true;
    pts.material.opacity=1-el/.9;
    requestAnimationFrame(anim);
  })();
};

/* ---------- joystick tactile : glisser n'importe où dans l'arène ---------- */
M.joystick=function(el){
  const S={x:0,y:0,active:false};
  let o=null;
  const dot=document.createElement('div');
  dot.style.cssText='position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;'+
    'border:3px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);pointer-events:none;display:none;z-index:4;';
  const nub=document.createElement('div');
  nub.style.cssText='position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;'+
    'background:rgba(255,255,255,.75);pointer-events:none;display:none;z-index:5;';
  el.appendChild(dot); el.appendChild(nub);
  const R=el.getBoundingClientRect.bind(el);
  el.onpointerdown=e=>{
    if(o) return;                                  // un doigt pilote deja
    const r=R();
    o={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top};
    S.active=true;
    dot.style.display=nub.style.display='block';
    dot.style.left=o.x+'px'; dot.style.top=o.y+'px';
    nub.style.left=o.x+'px'; nub.style.top=o.y+'px';
  };
  el.onpointermove=e=>{
    if(!o||e.pointerId!==o.id) return;             // on ignore les autres doigts
    const r=R();
    let dx=(e.clientX-r.left)-o.x, dy=(e.clientY-r.top)-o.y;
    const d=Math.hypot(dx,dy)||1, max=42;
    if(d>max){ dx*=max/d; dy*=max/d; }
    S.x=dx/max; S.y=dy/max;
    nub.style.left=(o.x+dx)+'px'; nub.style.top=(o.y+dy)+'px';
  };
  const up=e=>{
    if(o&&e&&e.pointerId!==undefined&&e.pointerId!==o.id) return;   // c'etait l'autre doigt (saut)
    o=null; S.x=S.y=0; S.active=false; dot.style.display=nub.style.display='none';
  };
  el.onpointerup=up; el.onpointercancel=up; el.onpointerleave=up;
  M.stick=S;
  return S;
};

/* ---------- boucle ---------- */
function loop(){
  raf=requestAnimationFrame(loop);
  if(!M.on||!ren) return;
  // l'arène a été remplacée (fin de mini-jeu, écran quitté) : on libère le GPU
  if(!ren.domElement.isConnected){ M.stop(); return; }
  const t=performance.now(), dt=Math.min(.05,(t-lastT)/1000); lastT=t;
  // marche procédurale des héros (sautille + roulis quand ils bougent)
  heroes.forEach(H=>{
    if(H.mixer){
      H.mixer.update(dt);
      if(H.action) H.action.paused=!H.moving;
    } else if(H.mesh){
      const hop=H.moving?Math.abs(Math.sin(t*.015))*.34:0;
      H.mesh.position.y=(H.baseY||0)+hop;
      H.mesh.rotation.z=H.moving?Math.sin(t*.015)*.09:0;
    }
    H.grp.position.set(H.x,H.y||0,H.z);
    if(H.mesh) H.grp.rotation.y=H.dir;
  });
  if(frameCb){ try{ frameCb(dt,t); }catch(e){} }
  if(!M.on||!ren||!cam) return; // le mini-jeu vient de se terminer (MG3D.stop dans la frame)
  camFocus.lerp(camWant,Math.min(1,dt*camLerp));
  if(camAzWant!=null){
    let d=((camAzWant-camAz)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;
    camAz+=d*Math.min(1,dt*2.4);
  }
  if(camFps){
    // VISEE PAR-DESSUS L'EPAULE : la caméra se place DERRIÈRE le héros, sur l'axe
    // de visée, et regarde dans cette direction. On voit donc son personnage, et
    // le centre de l'écran reste exactement la ligne de tir. camDist=0 → 1re personne.
    const ce=Math.cos(camEl);
    const dx=-Math.sin(camAz)*ce, dy=Math.sin(camEl), dz=-Math.cos(camAz)*ce;
    // décalage d'épaule : translation PURE (l'axe de visée reste exactement d)
    const rl=Math.hypot(-dz,dx)||1, rx=-dz/rl*camEpaule, rz=dx/rl*camEpaule;
    const ox=camFocus.x+rx, oy=camFocus.y+camVise, oz=camFocus.z+rz;
    cam.position.set(ox-dx*camDist, oy-dy*camDist, oz-dz*camDist);
    cam.lookAt(ox+dx*24, oy+dy*24, oz+dz*24);
  } else {
    cam.position.set(camFocus.x+Math.sin(camAz)*camDist*Math.cos(camEl),
                     camFocus.y+camDist*Math.sin(camEl),
                     camFocus.z+Math.cos(camAz)*camDist*Math.cos(camEl));
    cam.lookAt(camFocus.x,camFocus.y+camVise,camFocus.z);
  }
  const W=areaEl.clientWidth,H2=areaEl.clientHeight;
  if(W&&H2&&(cam.aspect!==W/H2)){
    cam.aspect=W/H2;
    const r=W/H2;
    cam.fov=fovBase*(r>1.9?1.16:r>1.4?1.06:r<.9?1.22:1);  // arene large : on ouvre pour ne pas rogner
    cam.updateProjectionMatrix();
    ren.setSize(W,H2,false);
  }
  ren.render(scene,cam);
}

/* ---------- portrait 3D tournant (écran de création : héros ET costumes) ----------
   Les héros de base ont une photo de studio ; les costumes n'en ont pas.
   On rend donc leur modèle en direct, dans une petite vignette qui tourne. */
let pRen=null,pScn=null,pCam=null,pRaf=null,pMix=null,pGrp=null,pLast=0,pId=null;
M.portraitOff=function(){
  if(pRaf) cancelAnimationFrame(pRaf);
  pRaf=null; pMix=null; pGrp=null; pId=null;
  if(pRen){
    try{ if(pRen.domElement.parentNode) pRen.domElement.parentNode.removeChild(pRen.domElement); }catch(e){}
    try{ pRen.dispose(); }catch(e){}
  }
  pRen=null; pScn=null; pCam=null;
};
M.portrait=function(el,id,taille,siEchec){
  if(!M.ok||!el||!id) return false;
  if(pId===id&&pRen&&pRen.domElement.parentNode===el) return true;
  M.portraitOff();
  const S=taille||116;
  pId=id;
  pScn=new THREE.Scene();
  pCam=new THREE.PerspectiveCamera(32,1,.1,60);
  pRen=new THREE.WebGLRenderer({antialias:true,alpha:true});
  pRen.setPixelRatio(Math.min(2,devicePixelRatio));
  pRen.setSize(S,S,false);
  pRen.domElement.style.cssText='width:'+S+'px;height:'+S+'px;display:block;'+
    'filter:drop-shadow(0 8px 14px rgba(0,0,0,.5));';
  el.appendChild(pRen.domElement);
  pScn.add(new THREE.AmbientLight(0xBBAAE8,1.7));
  const key=new THREE.DirectionalLight(0xFFF0DC,2.2); key.position.set(2.4,4,3); pScn.add(key);
  const rim=new THREE.DirectionalLight(0xC9B8FF,1.1); rim.position.set(-3,2,-2); pScn.add(rim);
  const grp=new THREE.Group(); pScn.add(grp); pGrp=grp;
  loader.load('/art/hero3d-'+id+'-anim.glb',g=>{
    if(pId!==id) return;                       // l'utilisateur a déjà changé de costume
    const m=g.scene;
    if(g.animations&&g.animations.length){
      pMix=new THREE.AnimationMixer(m);
      const idle=g.animations.find(a=>/idle|stand/i.test(a.name))||g.animations[0];
      pMix.clipAction(idle).play();
      pMix.update(.35);                        // on pose le modèle avant de le mesurer
    }
    M.fit(m,2);                                // même règle d'échelle que partout
    grp.add(m);
    const bb=new THREE.Box3().setFromObject(grp);
    const c=bb.getCenter(new THREE.Vector3());
    pCam.position.set(0,c.y+.15,3.9);   // recul : le personnage tient entier dans la vignette
    pCam.lookAt(0,c.y-.05,0);
  },undefined,()=>{ M.portraitOff(); if(siEchec) try{ siEchec(); }catch(e){} });
  pLast=performance.now();
  (function tour(){
    pRaf=requestAnimationFrame(tour);
    if(!pRen||!pRen.domElement.isConnected){ M.portraitOff(); return; }
    const t=performance.now(), dt=Math.min(.05,(t-pLast)/1000); pLast=t;
    if(pMix) pMix.update(dt);
    if(pGrp) pGrp.rotation.y+=dt*.75;
    pRen.render(pScn,pCam);
  })();
  return true;
};
