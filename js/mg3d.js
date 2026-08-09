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
  scene.fog=new THREE.Fog(sky,42,110);
  cam=new THREE.PerspectiveCamera(42,W/H,.5,300);
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
  camDist=opt.dist||30; camEl=opt.el||.86; camAz=opt.az||Math.PI/4;
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
M.look=function(x,z,snap){ camWant.set(x,0,z); if(snap) camFocus.copy(camWant); };
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
    const r=R();
    o={x:e.clientX-r.left,y:e.clientY-r.top};
    S.active=true;
    dot.style.display=nub.style.display='block';
    dot.style.left=o.x+'px'; dot.style.top=o.y+'px';
    nub.style.left=o.x+'px'; nub.style.top=o.y+'px';
  };
  el.onpointermove=e=>{
    if(!o) return;
    const r=R();
    let dx=(e.clientX-r.left)-o.x, dy=(e.clientY-r.top)-o.y;
    const d=Math.hypot(dx,dy)||1, max=42;
    if(d>max){ dx*=max/d; dy*=max/d; }
    S.x=dx/max; S.y=dy/max;
    nub.style.left=(o.x+dx)+'px'; nub.style.top=(o.y+dy)+'px';
  };
  const up=()=>{ o=null; S.x=S.y=0; S.active=false; dot.style.display=nub.style.display='none'; };
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
  camFocus.lerp(camWant,Math.min(1,dt*3.2));
  cam.position.set(camFocus.x+Math.sin(camAz)*camDist*Math.cos(camEl),
                   camDist*Math.sin(camEl),
                   camFocus.z+Math.cos(camAz)*camDist*Math.cos(camEl));
  cam.lookAt(camFocus.x,1,camFocus.z);
  const W=areaEl.clientWidth,H2=areaEl.clientHeight;
  if(W&&H2&&(cam.aspect!==W/H2)){ cam.aspect=W/H2; cam.updateProjectionMatrix(); ren.setSize(W,H2,false); }
  ren.render(scene,cam);
}
