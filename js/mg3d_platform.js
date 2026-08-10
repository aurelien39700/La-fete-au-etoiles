/* ============================================================================
   MINI-JEUX 3D DE PLATEFORME
   Un petit noyau commun (gravité, saut, plateformes qui bougent, respawn,
   synchro des positions) sur lequel chaque jeu ne décrit que SES règles.
   ========================================================================== */

/* ---------- noyau ---------- */
/* À 2 ou 3 on est à l'aise ; à 8 on se marche dessus. Toutes les arènes
   s'élargissent donc avec le nombre de joueurs (jusqu'à +65 %). */
function mgEch(){
  const n=(typeof room!=='undefined'&&room&&room.players)?room.players.length:2;
  return 1+Math.max(0,Math.min(5,n-3))*.13;
}
function pfInit(area,opt){
  opt=opt||{};
  const E=mgEch();
  if(!MG3D.init(area,{theme:room.mapId,
      dist:(opt.dist||27)*(opt.brut?1:E), el:opt.el===undefined?.52:opt.el, az:opt.az,
      vise:opt.vise===undefined?1:opt.vise,   // ce que la camera regarde par rapport au joueur
      lerp:opt.lerp||3.2,                     // suivi vif : les jeux verticaux vont vite
      fog:opt.fog, far:opt.far})) return null;
  const T=MG3D.THREE;
  const W={T,plats:[],hs:{},saut:false,kx:0,kz:0,area};
  W.stick=MG3D.joystick(area);
  // bouton de saut (pouce droit) — il ne doit pas déclencher le joystick
  const b=document.createElement('button');
  b.textContent='⤒';
  b.style.cssText='position:absolute;right:14px;bottom:14px;width:84px;height:84px;border-radius:50%;'+
    'border:3px solid rgba(255,255,255,.45);background:rgba(255,214,68,.92);color:#20163F;'+
    'font-size:36px;font-weight:900;line-height:1;z-index:6;touch-action:none;cursor:pointer;'+
    'box-shadow:0 6px 16px rgba(0,0,0,.45);';
  const presse=e=>{ e.stopPropagation(); e.preventDefault(); W.saut=true; };
  b.addEventListener('pointerdown',presse);
  area.appendChild(b);
  W.btnSaut=b;
  // clavier : flèches + espace
  W.onDown=e=>{
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){ W.saut=true; W.feu=true; e.preventDefault(); }
    if(e.code==='ArrowLeft'||e.code==='KeyA') W.kx=-1;
    if(e.code==='ArrowRight'||e.code==='KeyD') W.kx=1;
    if(e.code==='KeyS'||e.code==='ArrowDown') W.kz=1;
    if(e.code==='KeyW') W.kz=-1;
  };
  W.onUp=e=>{
    if(e.code==='ArrowLeft'||e.code==='KeyA'||e.code==='ArrowRight'||e.code==='KeyD') W.kx=0;
    if(e.code==='KeyS'||e.code==='ArrowDown'||e.code==='KeyW') W.kz=0;
  };
  addEventListener('keydown',W.onDown); addEventListener('keyup',W.onUp);
  W.fin=()=>{ removeEventListener('keydown',W.onDown); removeEventListener('keyup',W.onUp); };
  W.matiere=(col,glow)=>new T.MeshStandardMaterial({color:col,emissive:glow||0,
    emissiveIntensity:glow?1:0,roughness:.82,flatShading:true});
  // pose une plateforme : y est la SURFACE sur laquelle on marche
  W.plat=(x,y,z,w,d,col,ep)=>{
    const h=ep||.9;
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),W.matiere(col===undefined?0x8F86C8:col));
    m.position.set(x,y-h/2,z);
    m.receiveShadow=true; m.castShadow=true;
    MG3D.group().add(m);
    const p={m,x,y,z,w,d,h,on:true,dx:0,dz:0,dy:0};
    p.place=(nx,ny,nz)=>{ p.dx=nx-p.x; p.dy=ny-p.y; p.dz=nz-p.z;
      p.x=nx; p.y=ny; p.z=nz; m.position.set(nx,ny-p.h/2,nz); };
    W.plats.push(p);
    return p;
  };
  return W;
}

/* déplacement + gravité + saut d'un héros piloté */
function pfStep(W,me,dt,o){
  o=o||{};
  const sp=o.sp||10.5, g=o.g||34, jv=o.jv||16.2;
  let sx=W.stick.x+W.kx, sy=W.stick.y+W.kz;
  const n=Math.hypot(sx,sy);
  if(n>1){ sx/=n; sy/=n; }
  // le haut du joystick = vers le fond de l'ecran, quel que soit l'angle de vue
  const d=MG3D.dir(sx,sy);
  me.x+=d.x*sp*dt; me.z+=d.z*sp*dt;
  me.moving=n>.12;
  if(me.moving) me.dir=Math.atan2(d.x,d.z);
  // la plateforme sous les pieds nous emporte avec elle
  if(me.surSol&&me.surSol.on){ me.x+=me.surSol.dx; me.z+=me.surSol.dz; me.y+=me.surSol.dy; }
  me.vy=(me.vy||0)-g*dt;
  const ny=me.y+me.vy*dt;
  let sol=null;
  for(const p of W.plats){
    if(!p.on) continue;
    if(Math.abs(me.x-p.x)<=p.w/2+.4 && Math.abs(me.z-p.z)<=p.d/2+.4
       && me.y>=p.y-.30 && ny<=p.y+.02 && (!sol||p.y>sol.y)) sol=p;
  }
  if(sol&&me.vy<=0){
    me.y=sol.y; me.vy=0; me.grounded=true; me.coyote=.13; me.surSol=sol;
    if(sol.touche) sol.touche(me);
  } else {
    me.y=ny; me.grounded=false; me.surSol=null;
    me.coyote=Math.max(0,(me.coyote||0)-dt);
  }
  if(W.saut){
    W.saut=false;
    if(W.sansSaut) return;
    if(me.grounded||me.coyote>0){
      me.vy=(me.surSol&&me.surSol.ressort)?me.surSol.ressort:jv;
      me.grounded=false; me.coyote=0; snd('tap');
    }
  }
}

/* synchro légère des autres joueurs (position + hauteur) */
function pfReseau(W,me,preActs){
  const myAct=d=>{
    const h=W.hs[d.id];
    if(!h||d.id===me.pid) return;
    if(d.k==='pp'){ h.x=d.x; h.y=d.y; h.z=d.z; h.moving=!!d.m; }
    else if(d.k==='pd') h.alive=false;
  };
  window.mgAct=myAct;
  (preActs||[]).splice(0).forEach(d=>{ try{ myAct(d); }catch(e){} });
  return myAct;
}
function pfEnvoi(W,me,etat){
  if(Date.now()-(etat.t||0)<110) return;
  etat.t=Date.now();
  actSend({k:'pp',id:me.pid,x:+me.x.toFixed(2),y:+me.y.toFixed(2),z:+me.z.toFixed(2),m:me.moving});
}
/* départ commun : bouton GO, héros posés, horloge partagée */
function pfDepart(area,fn){
  const preActs=[];
  window.mgAct=d=>{ preActs.push(d); if(preActs.length>300) preActs.shift(); };
  const btn=document.createElement('button');
  btn.className='big-tap'; btn.textContent='GO !';
  btn.onclick=()=>{
    snd('tap');
    area.innerHTML='';
    const start=(()=>{ const s=(room.mg&&room.mg.startedAt)||Date.now(); const off=Date.now()-s;
      return (off>=0&&off<120000)?s:Date.now(); })();
    fn(preActs,start,mulberry32((room.mg&&room.mg.startedAt)||1));
  };
  area.appendChild(btn);
}
function pfHeros(W,x0,z0,rayon){
  const n=room.players.length, R=rayon||1.6;
  room.players.forEach((p,k)=>{
    // tout le monde tient sur la plateforme de depart, meme a 8
    const a=k/Math.max(1,n)*Math.PI*2;
    const h=MG3D.hero(p,{x:x0+(n>1?Math.cos(a)*R:0),z:z0+(n>1?Math.sin(a)*R:0)});
    h.pid=p.id; h.y=0; h.vy=0;
    W.hs[p.id]=h;
  });
  return W.hs[curP().id]||W.hs[room.players[0].id];
}
/* fin propre : on rend la main au moteur et on note le joueur */
function pfFin(W,score){
  if(window.mgAct) window.mgAct=null;
  $('mgTimer').textContent='';
  W.fin();
  MG3D.stop();
  submitScore(Math.max(0,Math.round(score)));
}

/* ============================ LES 10 JEUX ============================ */

/* --- 48 : la Tour Infinie — grimper une spirale de plateformes --- */
function mgTour3D(area){
  pfDepart(area,(preActs,start)=>{
    const W=pfInit(area,{dist:22,el:.32,vise:2.6,lerp:6,fog:[70,210],far:600}); if(!W){ submitScore(0); return; }
    const NIV=44;
    for(let i=0;i<NIV;i++){
      const a=i*1.05, r=6.2+Math.sin(i*.7)*1.4;
      W.plat(Math.cos(a)*r,i*2.35,Math.sin(a)*r,4.4,4.4,i%5===0?0xFFD644:0x8F86C8);
    }
    W.plat(0,0,0,7,7,0x6E63A8);
    const me=pfHeros(W,0,0,1.4);
    const info=mg3dInfo(area,'0 m');
    pfReseau(W,me,preActs);
    const env={}; let over=false, haut=0, checkY=0;
    MG3D.frame(dt=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:8.6,jv:15.0});
      if(me.y>haut){ haut=me.y; if(me.grounded) checkY=me.y; }
      if(me.y<checkY-14){ me.x=0; me.z=0; me.y=checkY+1; me.vy=0; snd('bad'); vib(40); }
      MG3D.look(me.x,me.z,false,me.y);
      if(me.moving) MG3D.cadre({azWant:me.dir+Math.PI});   // camera dans le dos du grimpeur
      pfEnvoi(W,me,env);
      info.textContent=(haut*.9).toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,42-el).toFixed(0)+' s';
      if(el>=42){ over=true; snd('fanfare'); pfFin(W,haut*9); }
    });
  });
}

/* --- 49 : Course d'Obstacles — haies, balayeurs et fosses sur 120 m --- */
function mgObst3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:24,el:.42,az:Math.PI,vise:2.2,lerp:5,fog:[70,230],far:600}); if(!W){ submitScore(0); return; }
    const T=W.T, LONG=120;
    W.plat(0,0,LONG/2-6,13,LONG,0x8F86C8);
    const me=pfHeros(W,0,0,2.4);
    const info=mg3dInfo(area,'0 m');
    pfReseau(W,me,preActs);
    // trois familles d'obstacles qui alternent le long de la piste
    const haies=[], balais=[], fosses=[];
    for(let i=0;i<24;i++){
      const z=10+i*4.6+rng()*1.2;
      const type=i%3;
      if(type===0){          // HAIE : barre basse a sauter
        const g=new T.Group();
        const bar=new T.Mesh(new T.BoxGeometry(9,.5,.5),W.matiere(0xFF9F45,0x5a2a00));
        bar.position.y=.85; g.add(bar);
        [-4.5,4.5].forEach(x=>{ const p2=new T.Mesh(new T.CylinderGeometry(.18,.22,1.7,6),W.matiere(0x6E63A8));
          p2.position.set(x,.85-.85,0); p2.position.y=.42; g.add(p2); });
        g.position.set(0,0,z);
        MG3D.group().add(g);
        haies.push({z});
      } else if(type===1){   // BALAYEUR : colonne qui glisse en travers
        const m=new T.Mesh(new T.CylinderGeometry(.75,.9,3.4,10),W.matiere(0x3EE6C1,0x0E4A3C));
        m.position.set(0,1.7,z);
        MG3D.group().add(m);
        balais.push({m,z,ph:rng()*7,sp:.9+rng()*1.1,amp:2.6+rng()*2});
      } else {               // FOSSE : bande sombre a sauter, sinon on y tombe
        const trou=new T.Mesh(new T.BoxGeometry(13.2,.35,2.2),
          new T.MeshStandardMaterial({color:0x120B24,roughness:1}));
        trou.position.set(0,.28,z);
        MG3D.group().add(trou);
        const lis=new T.Mesh(new T.BoxGeometry(13.2,.1,.24),W.matiere(0xFF6B6B,0x571510));
        lis.position.set(0,.5,z-1.2); MG3D.group().add(lis);
        const lis2=lis.clone(); lis2.position.z=z+1.2; MG3D.group().add(lis2);
        fosses.push({z});
      }
    }
    const env={}; let over=false, chocs=0, fini=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:10.4,jv:15.8});
      // haies : on saute ou on percute
      haies.forEach(h=>{
        if(me.y<0.95&&Math.abs(me.z-h.z)<.55&&Math.abs(me.x)<4.9){
          me.z=h.z-1.6; chocs++; snd('bad'); vib(45);
          MG3D.burst(me.x,1,me.z,0xFF9F45,10);
        }
      });
      // balayeurs : ils glissent, on slalome
      balais.forEach(b2=>{
        b2.m.position.x=Math.sin(t*.001*b2.sp+b2.ph)*b2.amp;
        const dx=me.x-b2.m.position.x, dz=me.z-b2.z;
        if(me.y<1.6&&dx*dx+dz*dz<1.9){
          me.z=b2.z-1.8; me.x+=dx>0?1.2:-1.2; chocs++; snd('bad'); vib(45);
          MG3D.burst(me.x,1.2,me.z,0x3EE6C1,10);
        }
      });
      // fosses : au sol dedans = on tombe, retour 4 m en arriere
      fosses.forEach(f=>{
        if(me.grounded&&Math.abs(me.z-f.z)<1.1&&Math.abs(me.x)<6.6){
          chocs++; snd('boom'); vib(70);
          MG3D.burst(me.x,.4,me.z,0x120B24,14);
          me.z=Math.max(0,f.z-4); me.vy=0;
        }
      });
      me.x=Math.max(-6,Math.min(6,me.x));
      me.z=Math.max(-3,me.z);
      if(me.z>=LONG-14&&!fini) fini=el;
      MG3D.look(me.x*.45,me.z+5,false,0);   // on voit les obstacles arriver
      pfEnvoi(W,me,env);
      info.textContent=Math.max(0,me.z).toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,45-el).toFixed(0)+' s';
      if(fini||el>=45){
        over=true; snd('fanfare');
        pfFin(W,fini?(700-fini*9-chocs*8):(me.z*4-chocs*6));
      }
    });
  });
}

/* --- 50 : Plateformes Fuyantes — chaque dalle touchée s'effrite --- */
function mgFuite3D(area){
  pfDepart(area,(preActs,start)=>{
    const W=pfInit(area,{dist:30,el:.66,vise:1,lerp:4.5}); if(!W){ submitScore(0); return; }
    const N=7+(room.players.length>4?2:0)+(room.players.length>6?2:0);
    const CELL=3.4, ORI=-(N-1)/2*CELL;
    for(let i=0;i<N;i++) for(let j=0;j<N;j++){
      const p=W.plat(ORI+i*CELL,0,ORI+j*CELL,CELL*.9,CELL*.9,0x8F86C8);
      p.vie=-1;
      p.touche=()=>{ if(p.vie<0){ p.vie=1.5; p.m.material=W.matiere(0xFF6B6B,0x571510); } };
    }
    const me=pfHeros(W,0,0,1.6);
    const info=mg3dInfo(area,'');
    pfReseau(W,me,preActs);
    const env={}; let over=false, mortA=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      W.plats.forEach(p=>{
        if(p.vie>0){
          p.vie-=dt;
          p.m.position.x=p.x+Math.sin(t*.05)*.05;
          if(p.vie<=0){ p.on=false; p.chute=true; }
        }
        if(p.chute){ p.m.position.y-=dt*14; if(p.m.position.y<-30) p.chute=false; }
      });
      if(me.alive!==false){
        pfStep(W,me,dt,{sp:11,jv:14.8});
        if(me.y<-9){ me.alive=false; mortA=Date.now(); snd('bad'); vib(60); actSend({k:'pd',id:me.pid}); }
      }
      MG3D.look(me.x*.35,me.z*.35,false,0);
      pfEnvoi(W,me,env);
      const debout=Object.values(W.hs).filter(h=>h.alive!==false).length;
      info.textContent=me.alive===false?'tombé !':debout+' debout';
      $('mgTimer').textContent=Math.max(0,40-el).toFixed(0)+' s';
      if(el>=40||(me.alive===false&&Date.now()-mortA>1800)){
        over=true; snd('fanfare');
        const surv=me.alive===false?(mortA-start)/1000:40;
        pfFin(W,surv*10+(me.alive===false?0:70));
      }
    });
  });
}

/* --- 51 : Saut à la Corde — la poutre balaie, on saute par-dessus --- */
function mgCorde3D(area){
  pfDepart(area,(preActs,start)=>{
    const W=pfInit(area,{dist:26,el:.52,vise:1.6,lerp:3.4}); if(!W){ submitScore(0); return; }
    const T=W.T;
    const E=mgEch();
    W.plat(0,0,0,17*E,17*E,0x8F86C8);
    const bras=new T.Mesh(new T.BoxGeometry(25*E,.7,.7),W.matiere(0xFF5FA2,0x6a0a30));
    bras.position.set(0,.75,0);
    MG3D.group().add(bras);
    const mat=new T.Mesh(new T.CylinderGeometry(.5,.5,5,7),W.matiere(0x2A2038));
    mat.position.y=2.5; MG3D.group().add(mat);
    const me=pfHeros(W,0,5,1.6);
    const info=mg3dInfo(area,'0 tour');
    pfReseau(W,me,preActs);
    const env={}; let over=false, ang=0, tours=0, mortA=0;
    MG3D.frame(dt=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      const vit=2.0+el*.09;
      const av=ang; ang+=vit*dt;
      if(Math.floor(ang/(Math.PI*2))>Math.floor(av/(Math.PI*2))){ tours++; snd('coin'); }
      bras.rotation.y=ang;
      if(me.alive!==false){
        pfStep(W,me,dt,{sp:9.5,jv:14.2});
        const lim=7.6*E;
        me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
        // la poutre nous fauche si on est au sol et sur sa ligne exacte
        const d=Math.hypot(me.x,me.z);
        const bx=Math.cos(ang), bz=-Math.sin(ang);          // direction reelle du bras
        const ecart=Math.abs(me.x*bz-me.z*bx);              // distance a la ligne
        if(me.y<1.15&&d<12.6*E&&ecart<1.0){
          me.alive=false; mortA=Date.now(); snd('bad'); vib(70);
          MG3D.burst(me.x,1,me.z,0xFF5FA2,14);
          actSend({k:'pd',id:me.pid});
        }
      }
      MG3D.look(0,0,false,0);
      pfEnvoi(W,me,env);
      info.textContent=tours+' tour'+(tours>1?'s':'');
      $('mgTimer').textContent=Math.max(0,45-el).toFixed(0)+' s';
      if(el>=45||(me.alive===false&&Date.now()-mortA>1600)){
        over=true; snd('fanfare');
        pfFin(W,(me.alive===false?(mortA-start)/1000:45)*11+(me.alive===false?0:60));
      }
    });
  });
}

/* --- 52 : le Pont Cassé — traverser avant que les planches lâchent --- */
function mgPont3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:24,el:.44,az:Math.PI,vise:2.2,lerp:5,fog:[60,200],far:500}); if(!W){ submitScore(0); return; }
    W.plat(0,0,-4,10,8,0x6E63A8);
    const NB=30;
    for(let i=0;i<NB;i++){
      const z=2+i*2.6, trou=rng()<.16;
      if(trou) continue;
      const p=W.plat((rng()-.5)*5.2,0,z,3.4,2.1,rng()<.3?0xC06A3A:0x8F86C8);
      p.fragile=rng()<.45;
      if(p.fragile) p.touche=()=>{ if(p.vie===undefined) p.vie=.75; };
    }
    W.plat(0,0,NB*2.6+4,11,9,0xFFD644);
    const me=pfHeros(W,0,-4,2.2);
    const info=mg3dInfo(area,'0 %');
    pfReseau(W,me,preActs);
    const env={}; let over=false, fini=0, chutes=0;
    const ARR=NB*2.6+2;
    MG3D.frame(dt=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      W.plats.forEach(p=>{
        if(p.vie>0){ p.vie-=dt; p.m.rotation.z=Math.sin(p.vie*40)*.06;
          if(p.vie<=0){ p.on=false; p.chute=true; } }
        if(p.chute){ p.m.position.y-=dt*13; if(p.m.position.y<-40) p.chute=false; }
      });
      pfStep(W,me,dt,{sp:9.8,jv:16.2});
      if(me.y<-10){ chutes++; me.x=0; me.z=Math.max(-4,me.z-8); me.y=1; me.vy=0; snd('bad'); vib(60); }
      if(me.z>=ARR&&!fini) fini=el;
      MG3D.look(me.x*.5,me.z+4,false,0);    // la suite du pont reste dans le cadre
      pfEnvoi(W,me,env);
      info.textContent=Math.min(100,Math.max(0,me.z/ARR*100)).toFixed(0)+' %';
      $('mgTimer').textContent=Math.max(0,42-el).toFixed(0)+' s';
      if(fini||el>=42){
        over=true; snd('fanfare');
        pfFin(W,fini?(650-fini*10-chutes*25):(me.z/ARR*380-chutes*20));
      }
    });
  });
}

/* --- 53 : Trampolines — rebondir et gober les étoiles en l'air --- */
function mgTrampo3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:28,el:.46,vise:3,lerp:4.5,fog:[60,180]}); if(!W){ submitScore(0); return; }
    const E=mgEch();
    W.plat(0,0,0,20*E,20*E,0x6E63A8);
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2;
      const p=W.plat(Math.cos(a)*6.4*E,.5,Math.sin(a)*6.4*E,3.6,3.6,0x3EE6C1,.5);
      p.ressort=22+i%3*2;
    }
    const etoiles=[];
    for(let i=0;i<26;i++){
      const a=rng()*7, r=rng()*8.4*E;
      const m=MG3D.obj('star',{x:Math.cos(a)*r,y:3+rng()*13,z:Math.sin(a)*r});
      etoiles.push({m,pris:false});
    }
    const me=pfHeros(W,0,0,1.6);
    const info=mg3dInfo(area,'0 ⭐');
    pfReseau(W,me,preActs);
    const env={}; let over=false, pts=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:9.2,jv:14.6,g:29});
      const lim=9.4*E;
      me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
      if(me.y<-6){ me.x=0; me.z=0; me.y=1; me.vy=0; }
      etoiles.forEach(e=>{
        if(e.pris) return;
        e.m.rotation.y+=dt*2.4;
        const dx=e.m.position.x-me.x, dy=e.m.position.y-(me.y+1.2), dz=e.m.position.z-me.z;
        if(dx*dx+dy*dy+dz*dz<3.4){
          e.pris=true; MG3D.remove(e.m); pts++;
          snd('coin'); MG3D.burst(me.x,me.y+1.4,me.z,0xFFD644,10);
        }
      });
      MG3D.look(me.x*.5,me.z*.5,false,me.y*.8);
      pfEnvoi(W,me,env);
      info.textContent=pts+' ⭐';
      $('mgTimer').textContent=Math.max(0,35-el).toFixed(0)+' s';
      if(el>=35){ over=true; snd('fanfare'); pfFin(W,pts*45); }
    });
  });
}

/* --- 54 : la Lave Monte — grimper plus vite que le niveau --- */
function mgMontee3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:24,el:.34,vise:2.8,lerp:7,fog:[70,210],far:600}); if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,11,11,0x6E63A8);
    for(let i=0;i<46;i++){
      const a=rng()*7, r=3.4+rng()*7.4;
      W.plat(Math.cos(a)*r,2.4+i*1.95,Math.sin(a)*r,3.6,3.6,i%6===0?0xFFD644:0x8F86C8,.7);
    }
    const lave=new T.Mesh(new T.CylinderGeometry(15,15,1.4,26),
      new T.MeshStandardMaterial({color:0xFF5A18,emissive:0xFF5A18,emissiveIntensity:1.5,roughness:.4}));
    lave.position.y=-6; MG3D.group().add(lave);
    const me=pfHeros(W,0,0,1.5);
    const info=mg3dInfo(area,'0 m');
    pfReseau(W,me,preActs);
    const env={}; let over=false, niv=-6, haut=0, mortA=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      niv+=(el<3?0:(0.62+Math.max(0,el-3)*.021))*dt;   // 3 s de repit, puis montee lente
      lave.position.y=niv+Math.sin(t*.003)*.16;
      if(me.alive!==false){
        pfStep(W,me,dt,{sp:9.4,jv:15.8});
        haut=Math.max(haut,me.y);
        if(me.y<niv+.5){
          me.alive=false; mortA=Date.now(); snd('bad'); vib(70);
          MG3D.burst(me.x,niv+1,me.z,0xFF5A18,16);
          actSend({k:'pd',id:me.pid});
        }
      }
      MG3D.look(me.x*.8,me.z*.8,false,me.y);  // on suit le grimpeur : la lave entre par le bas
      if(me.alive!==false&&me.moving) MG3D.cadre({azWant:me.dir+Math.PI});
      pfEnvoi(W,me,env);
      info.textContent=(haut*.9).toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,46-el).toFixed(0)+' s';
      if(el>=46||(me.alive===false&&Date.now()-mortA>1600)){
        over=true; snd('fanfare'); pfFin(W,haut*13+(me.alive===false?0:80));
      }
    });
  });
}

/* --- 55 : Chute Libre — plonger dans le puits et viser les trous --- */
function mgChute3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:23,el:.98,vise:-3.5,lerp:8,fog:[60,190],far:700}); if(!W){ submitScore(0); return; }
    const T=W.T;
    // chaque plancher est PLEIN sauf une ouverture : impossible de passer au centre
    const anneaux=[];
    for(let i=0;i<34;i++){
      const g=new T.Group();
      const y=-10-i*9;
      const trou=rng()*Math.PI*2, large=1.00-Math.min(.44,i*.013);
      [[2.1,10],[4.4,16],[6.6,22]].forEach(([r,n])=>{
        for(let k=0;k<n;k++){
          const a=k/n*Math.PI*2;
          const da=Math.abs(((a-trou)+Math.PI*3)%(Math.PI*2)-Math.PI);
          if(da<large) continue;
          const m=new T.Mesh(new T.BoxGeometry(2.4*r/6.6+.9,.85,2*Math.PI*r/n+.5),
            W.matiere(i%4===0?0xFF6B6B:0x8F86C8));
          m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);
          m.rotation.y=-a;
          g.add(m);
        }
      });
      // balise dans l'ouverture : la cible se lit d'un coup d'oeil
      const bal=new T.Mesh(new T.TorusGeometry(1.5,.2,6,14),
        new T.MeshStandardMaterial({color:0x3EE6C1,emissive:0x18B89A,emissiveIntensity:1.8,roughness:.4}));
      bal.rotation.x=Math.PI/2;
      bal.position.set(Math.cos(trou)*4.4,y+.1,Math.sin(trou)*4.4);
      g.add(bal);
      MG3D.group().add(g);
      anneaux.push({g,y,trou,large});
    }
    const me=pfHeros(W,0,0,1.4);
    me.y=0;
    const info=mg3dInfo(area,'0 m');
    pfReseau(W,me,preActs);
    const env={}; let over=false, chocs=0, prof=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      // pas de sol : on tombe, on ne fait que se diriger
      me.vy=Math.max(-13,(me.vy||0)-19*dt);   // chute posee : on a le temps de viser
      me.y+=me.vy*dt;
      const dd=MG3D.dir(W.stick.x+W.kx,W.stick.y+W.kz);
      me.x+=dd.x*12*dt; me.z+=dd.z*12*dt;
      const d=Math.hypot(me.x,me.z);
      if(d>7.4){ me.x*=7.4/d; me.z*=7.4/d; }
      me.moving=true; me.dir=Math.atan2(dd.x,dd.z);
      anneaux.forEach(A=>{
        // un plancher deja franchi disparait : il ne bouche plus la vue plongeante
        A.g.visible=A.y<me.y+2.5&&A.y>me.y-30;
        if(A.passe) return;
        if(me.y<A.y+.8&&me.y>A.y-1.1){
          A.passe=true;
          const aMe=Math.atan2(me.z,me.x);
          const da=Math.abs(((aMe-A.trou)+Math.PI*3)%(Math.PI*2)-Math.PI);
          if(da>=A.large){                     // on a tape le plancher
            chocs++; me.y=A.y+1.2; me.vy=1.5; snd('bad'); vib(50);
            MG3D.burst(me.x,me.y,me.z,0xFF6B6B,12);
          } else snd('coin');
        }
      });
      prof=Math.max(prof,-me.y);
      MG3D.look(me.x*.5,me.z*.5,false,me.y);  // vue plongeante : les anneaux arrivent d'en bas
      pfEnvoi(W,me,env);
      info.textContent=prof.toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,32-el).toFixed(0)+' s';
      if(el>=32||prof>300){ over=true; snd('fanfare'); pfFin(W,prof*2.2-chocs*20); }
    });
  });
}

/* --- 56 : Escalier Roulant — l'escalier descend, il faut monter --- */
function mgEscalier3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:23,el:.46,az:Math.PI,vise:2.5,lerp:6.5,fog:[65,200],far:500}); if(!W){ submitScore(0); return; }
    const NB=26;
    const marches=[];
    for(let i=0;i<NB;i++){
      // la premiere marche reste centree : c'est le palier de depart
      const p=W.plat(i?(rng()-.5)*6:0,i*1.65,-2+i*2.5,i?5.4:7.5,2.6,i%4===0?0xFFD644:0x8F86C8,1.15);
      marches.push(p);
    }
    const me=pfHeros(W,0,-2,1.5);
    const info=mg3dInfo(area,'0 marche');
    pfReseau(W,me,preActs);
    const env={}; let over=false, vitesse=1.5, mortA=0, best=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      vitesse=el<2.5?0:1.5+(el-2.5)*.09;   // 2,5 s de repit pour se placer
      marches.forEach(p=>{
        let ny=p.y-vitesse*dt, nz=p.z-vitesse*1.5*dt;
        const recycle=nz<-9;
        if(recycle){ ny+=NB*1.65; nz+=NB*2.5; }
        p.place(p.x,ny,nz);
        if(recycle) p.dx=p.dy=p.dz=0;      // la marche remonte SANS emporter son passager
      });
      if(me.alive!==false){
        pfStep(W,me,dt,{sp:9.6,jv:15.2});
        best=Math.max(best,el);
        if(me.y<-13||me.z<-11){
          me.alive=false; mortA=Date.now(); snd('bad'); vib(70);
          actSend({k:'pd',id:me.pid});
        }
      }
      MG3D.look(me.x*.35,me.z+5,false,me.y+1.5);   // on voit la montee devant soi
      pfEnvoi(W,me,env);
      info.textContent=Math.floor(best*2)+' marches';
      $('mgTimer').textContent=Math.max(0,44-el).toFixed(0)+' s';
      if(el>=44||(me.alive===false&&Date.now()-mortA>1600)){
        over=true; snd('fanfare');
        pfFin(W,(me.alive===false?(mortA-start)/1000:44)*12+(me.alive===false?0:70));
      }
    });
  });
}

/* --- 57 : le Drapeau — parkour sur plateformes mobiles jusqu'au sommet --- */
function mgDrapeau3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:27,el:.42,vise:4,lerp:5.5,fog:[65,200],far:500}); if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,9,9,0x6E63A8);
    const mobiles=[];
    for(let i=0;i<20;i++){
      const y=2.6+i*2.2, a=i*1.2;
      const p=W.plat(Math.cos(a)*5.5,y,Math.sin(a)*5.5,3.8,3.8,i%5===0?0xFFD644:0x8F86C8,.6);
      p.base={a,y,r:5.5+ (i%3)*1.1};
      p.vit=(i%2?1:-1)*(.55+rng()*.5);
      mobiles.push(p);
    }
    const SOM=2.6+20*2.2;
    W.plat(0,SOM,0,6,6,0xFFD644);
    const mat=new T.Mesh(new T.CylinderGeometry(.14,.14,4,6),W.matiere(0xE8E8F0));
    mat.position.set(0,SOM+2,0); MG3D.group().add(mat);
    const dr=new T.Mesh(new T.BoxGeometry(2,1.2,.1),W.matiere(0xFF5FA2,0x6a0a30));
    dr.position.set(1,SOM+3.2,0); MG3D.group().add(dr);
    const me=pfHeros(W,0,0,1.5);
    const info=mg3dInfo(area,'0 %');
    pfReseau(W,me,preActs);
    const env={}; let over=false, fini=0, haut=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      mobiles.forEach(p=>{
        const a=p.base.a+t*.001*p.vit;
        p.place(Math.cos(a)*p.base.r,p.base.y,Math.sin(a)*p.base.r);
      });
      dr.rotation.y=Math.sin(t*.002)*.35;
      pfStep(W,me,dt,{sp:9.4,jv:16.0});
      haut=Math.max(haut,me.y);
      if(me.y<-11){ me.x=0; me.z=0; me.y=1; me.vy=0; snd('bad'); vib(50); }
      if(me.y>SOM-.6&&Math.hypot(me.x,me.z)<3.4&&!fini){ fini=el; snd('fanfare'); MG3D.burst(0,SOM+2,0,0xFFD644,26); }
      MG3D.look(me.x*.8,me.z*.8,false,me.y);
      if(!fini&&me.moving) MG3D.cadre({azWant:me.dir+Math.PI});
      pfEnvoi(W,me,env);
      info.textContent=fini?'DRAPEAU !':Math.min(99,haut/SOM*100).toFixed(0)+' %';
      $('mgTimer').textContent=Math.max(0,50-el).toFixed(0)+' s';
      if(fini||el>=50){ over=true; pfFin(W,fini?(760-fini*9):(haut/SOM*420)); }
    });
  });
}

/* ============================================================================
   MINI-JEUX 3D DE TIR — VUE DU DESSUS, VRAIS PROJECTILES
   On voit les personnages d'en haut, le joystick les déplace et les oriente,
   le bouton 🎯 tire DROIT DEVANT. Les projectiles sont de vrais objets qui
   voyagent dans l'arène : on peut les voir partir, les rater, les anticiper.
   ========================================================================== */
function tirTop(area,opt){
  opt=opt||{};
  const W=pfInit(area,{dist:opt.dist||34, el:opt.el===undefined?.98:opt.el,
    vise:opt.vise===undefined?1:opt.vise, lerp:opt.lerp||5,
    fog:opt.fog||[60,200], far:600});
  if(!W) return null;
  const T=W.T;
  W.ech=mgEch();
  W.portee=(opt.portee||26)*W.ech;
  W.cadence=opt.cadence||.26;
  W.vitesse=opt.vitesse||30;
  W.calibre=opt.calibre||.28;
  W.rayonTouche=opt.rayonTouche||1.7;
  W.recharge=0; W.feu=false; W.balles=[]; W.obstacles=[];
  W.sansSaut=true;   // ici le bouton tire : il ne doit pas faire bondir le héros
  /* pose un abri : il stoppe les tirs et on ne le traverse pas */
  W.mur=(x,z,l,h,prof,col,rot)=>{
    const m=new T.Mesh(new T.BoxGeometry(l,h,prof),W.matiere(col===undefined?0xE8F4FF:col));
    m.position.set(x,h/2,z);
    m.rotation.y=rot||0;
    m.castShadow=m.receiveShadow=true;
    MG3D.group().add(m);
    // emprise circulaire : simple, et suffisant pour des abris trapus
    W.obstacles.push({x,z,r:Math.max(l,prof)*.5,h});
    return m;
  };
  /* la balle a-t-elle percuté un abri ? */
  W.bloque=(x,y,z)=>{
    for(const o of W.obstacles){
      if(y>o.h) continue;
      const dx=x-o.x, dz=z-o.z;
      if(dx*dx+dz*dz<o.r*o.r) return o;
    }
    return null;
  };
  /* repousse un personnage hors des abris : on se cache VRAIMENT derrière */
  W.degage=(h,rayon)=>{
    for(const o of W.obstacles){
      const dx=h.x-o.x, dz=h.z-o.z;
      const d=Math.hypot(dx,dz), min=o.r+(rayon||.8);
      if(d<min){
        // pile au centre : on choisit une sortie plutôt que de rester coincé
        if(d<.001){ h.x=o.x+min; h.z=o.z; }
        else { h.x=o.x+dx/d*min; h.z=o.z+dz/d*min; }
      }
    }
  };
  // le bouton de saut devient le BOUTON DE TIR
  W.btnSaut.textContent='🎯';
  W.btnSaut.style.background='rgba(255,95,162,.94)';
  W.btnSaut.style.color='#fff';
  W.btnSaut.style.fontSize='34px';
  W.btnSaut.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); W.feu=true; });
  // repère au sol : la ligne de tir part des pieds du personnage
  const ligne=new T.Mesh(new T.PlaneGeometry(.5,opt.jauge||13),
    new T.MeshBasicMaterial({color:0x3EE6C1,transparent:true,opacity:.28,side:T.DoubleSide}));
  ligne.rotation.x=-Math.PI/2;
  ligne.position.z=(opt.jauge||13)/2;
  const pivot=new T.Group(); pivot.add(ligne);
  MG3D.group().add(pivot);
  W.mire=pivot;
  W.geoBalle=new T.SphereGeometry(W.calibre,7,6);
  /* tire un projectile droit devant le personnage */
  W.tirer=(me,col,monte,vertical)=>{
    const m=new T.Mesh(W.geoBalle,new T.MeshStandardMaterial({
      color:col,emissive:col,emissiveIntensity:1.1,roughness:.4}));
    const fx=Math.sin(me.dir||0), fz=Math.cos(me.dir||0);
    if(vertical){
      // DCA : l'obus monte droit au-dessus du tireur
      m.position.set(me.x,1.6,me.z);
      MG3D.group().add(m);
      W.balles.push({m,vx:0,vy:W.vitesse,vz:0,vie:W.portee/W.vitesse,haut:1});
    } else {
      m.position.set(me.x+fx*.9,1.45,me.z+fz*.9);
      MG3D.group().add(m);
      W.balles.push({m,vx:fx*W.vitesse,vy:monte||0,vz:fz*W.vitesse,vie:W.portee/W.vitesse});
    }
    snd('shot');
  };
  /* fait voyager les balles et teste les impacts */
  W.majBalles=(dt,cibles,pos,onTouche)=>{
    for(let i=W.balles.length-1;i>=0;i--){
      const b=W.balles[i];
      const ax=b.m.position.x, ay=b.m.position.y, az=b.m.position.z;
      b.m.position.x+=b.vx*dt; b.m.position.y+=b.vy*dt; b.m.position.z+=b.vz*dt;
      b.vie-=dt;
      // on teste aussi le MILIEU du trajet : une balle rapide ne traverse plus une cible
      const mx=(ax+b.m.position.x)/2, my=(ay+b.m.position.y)/2, mz=(az+b.m.position.z)/2;
      let fini=b.vie<=0||(!b.haut&&b.m.position.y<.2);
      if(!fini&&W.bloque(b.m.position.x,b.m.position.y,b.m.position.z)){
        MG3D.burst(b.m.position.x,b.m.position.y,b.m.position.z,0xE8F4FF,7);
        fini=true;                       // l'abri encaisse le tir
      }
      if(!fini&&cibles){
        for(const c of cibles){
          const p=pos(c); if(!p) continue;
          const R2=W.rayonTouche*W.rayonTouche;
          const dx=p.x-b.m.position.x, dy=p.y-b.m.position.y, dz=p.z-b.m.position.z;
          const ex=p.x-mx, ey=p.y-my, ez=p.z-mz;
          if(dx*dx+dy*dy+dz*dz<R2||ex*ex+ey*ey+ez*ez<R2){
            try{ onTouche(c,b.m.position.clone()); }catch(e){}
            fini=true; break;
          }
        }
      }
      if(fini){ MG3D.remove(b.m); W.balles.splice(i,1); }
    }
  };
  W.videBalles=()=>{ W.balles.forEach(b=>MG3D.remove(b.m)); W.balles.length=0; };
  return W;
}

/* --- Bataille de Boules de Neige : tout le monde dans l'arène, on se canarde --- */
function mgNeige3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirTop(area,{portee:34,cadence:.26,vitesse:42,calibre:.38,rayonTouche:2.7,jauge:15});
    if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,46*W.ech,46*W.ech,0xBBD4E8);
    // abris : on se cache derrière pour recharger
    for(let i=0;i<9;i++){
      const a=(i/9)*Math.PI*2, R=(8+((i*7)%3)*4.5)*W.ech;
      W.mur(Math.cos(a)*R,Math.sin(a)*R,3.4,2.3,3.4,0xE8F4FF,rng()*2);
    }
    const me=pfHeros(W,0,0,3.2);
    const info=mg3dInfo(area,'0 touche');
    pfReseau(W,me,preActs);
    const rivaux=Object.values(W.hs).filter(h=>h!==me);
    rivaux.forEach((h,k)=>{ h.cap=rng()*7; h.chg=0; });
    const env={}; let over=false, touches=0, recus=0, gele=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      if(gele>0) gele-=dt;
      else pfStep(W,me,dt,{sp:12});
      const lim=21*W.ech; me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
      W.degage(me,.9);
      W.mire.position.set(me.x,.07,me.z); W.mire.rotation.y=me.dir||0;
      // les rivaux bougent : en local ils patrouillent, en ligne le réseau les pilote
      if(local) rivaux.forEach(h=>{
        h.chg-=dt;
        if(h.chg<=0){ h.chg=.8+rng()*1.6; h.cap=rng()*Math.PI*2; }
        h.x+=Math.sin(h.cap)*3.6*dt; h.z+=Math.cos(h.cap)*3.6*dt;
        if(Math.abs(h.x)>lim||Math.abs(h.z)>lim){ h.cap+=Math.PI; h.chg=.4; }
        h.x=Math.max(-lim,Math.min(lim,h.x)); h.z=Math.max(-lim,Math.min(lim,h.z));
        W.degage(h,.9);
        h.dir=h.cap; h.moving=true;
      });
      W.recharge-=dt;
      if(W.feu){
        W.feu=false;
        if(W.recharge<=0&&gele<=0){ W.recharge=W.cadence; W.tirer(me,0xE8F8FF,0); }
      }
      W.majBalles(dt,rivaux,h=>({x:h.x,y:1.3,z:h.z}),(h,p)=>{
        touches++; vib(18);
        MG3D.burst(p.x,p.y,p.z,0xFFFFFF,16);
        // le touché part se replacer plus loin
        const a=rng()*Math.PI*2, R=(10+rng()*8)*W.ech;
        h.x=Math.cos(a)*R; h.z=Math.sin(a)*R;
      });
      MG3D.look(me.x*.5,me.z*.5,false,0);
      pfEnvoi(W,me,env);
      info.textContent=touches+' touche'+(touches>1?'s':'');
      $('mgTimer').textContent=Math.max(0,36-el).toFixed(0)+' s';
      if(el>=36){ over=true; W.videBalles(); snd('fanfare'); pfFin(W,touches*22); }
    });
  });
}

/* --- Chasse aux Ballons : ils dérivent, il faut les prendre de vitesse --- */
function mgBallons3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirTop(area,{portee:30,cadence:.22,vitesse:40,calibre:.34,rayonTouche:2.5,dist:33,jauge:13});
    if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,44*W.ech,44*W.ech,0x6E63A8);
    const COLS=[0xFF5FA2,0x3EE6C1,0xFFD644,0x5AC8FA,0xC39BFF,0xFF9F45];
    const ballons=[];
    const NB=24+(room.players.length>4?8:0);
    for(let i=0;i<NB;i++){
      const a=rng()*Math.PI*2, R=(4+rng()*16)*W.ech;
      const col=COLS[i%COLS.length];
      const g=new T.Group();
      const b=new T.Mesh(new T.SphereGeometry(.95,10,9),W.matiere(col,col));
      b.material.emissiveIntensity=.45; b.scale.y=1.2; g.add(b);
      const fil=new T.Mesh(new T.CylinderGeometry(.05,.05,1.6,4),W.matiere(0xE8E8F0));
      fil.position.y=-1.3; g.add(fil);
      g.position.set(Math.cos(a)*R,1.5,Math.sin(a)*R);
      MG3D.group().add(g);
      ballons.push({g,ph:rng()*7,amp:.3+rng()*.35,y0:1.5,vivant:true,
        vx:(rng()-.5)*2.6,vz:(rng()-.5)*2.6});
    }
    const me=pfHeros(W,0,0,2.2);
    const info=mg3dInfo(area,'0 / 24');
    pfReseau(W,me,preActs);
    const env={}; let over=false, creves=0, tires=0, fini=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:12.5});
      const lim=20*W.ech; me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
      W.mire.position.set(me.x,.07,me.z); W.mire.rotation.y=me.dir||0;
      ballons.forEach(b=>{
        if(!b.vivant) return;
        b.g.position.x+=b.vx*dt; b.g.position.z+=b.vz*dt;
        if(Math.abs(b.g.position.x)>20*W.ech) b.vx*=-1;
        if(Math.abs(b.g.position.z)>20*W.ech) b.vz*=-1;
        b.g.position.y=b.y0+Math.sin(t*.0014+b.ph)*b.amp;
      });
      W.recharge-=dt;
      if(W.feu){
        W.feu=false;
        if(W.recharge<=0){ W.recharge=W.cadence; tires++; W.tirer(me,0xFFD644,0); }
      }
      W.majBalles(dt,ballons.filter(b=>b.vivant),b=>b.g.position,(b,p)=>{
        b.vivant=false; b.g.visible=false; creves++;
        snd('pop'); vib(14);
        MG3D.burst(p.x,p.y,p.z,0xFF5FA2,16);
        if(creves>=ballons.length&&!fini) fini=el;
      });
      MG3D.look(me.x*.5,me.z*.5,false,0);
      pfEnvoi(W,me,env);
      info.textContent=creves+' / '+ballons.length;
      $('mgTimer').textContent=Math.max(0,36-el).toFixed(0)+' s';
      if(fini||el>=36){
        over=true; W.videBalles(); snd('fanfare');
        pfFin(W,fini?(800-fini*13):(creves*28-Math.max(0,tires-creves)*2));
      }
    });
  });
}

/* --- Invasion des Bots : ils avancent vers toi, tiens la ligne --- */
function mgRobots3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirTop(area,{portee:32,cadence:.24,vitesse:42,calibre:.36,rayonTouche:2.7,dist:35,jauge:15});
    if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,46*W.ech,46*W.ech,0x5A5478);
    // le cœur du réacteur, au centre : c'est lui qu'on défend
    const coeur=new T.Mesh(new T.IcosahedronGeometry(1.9,0),W.matiere(0x3EE6C1,0x18B89A));
    coeur.position.y=1.9; MG3D.group().add(coeur);
    const socle=new T.Mesh(new T.CylinderGeometry(2.6,3.2,1.1,10),W.matiere(0x4A4270));
    socle.position.y=.55; MG3D.group().add(socle);
    for(let i=0;i<6;i++){
      const a=(i/6)*Math.PI*2+.4, R=11*W.ech;
      W.mur(Math.cos(a)*R,Math.sin(a)*R,3.6,2.4,2.2,0x4A4270,-a);
    }
    const bots=[];
    const me=pfHeros(W,0,5,2.2);
    const info=mg3dInfo(area,'0 bot');
    pfReseau(W,me,preActs);
    const env={}; let over=false, abattus=0, perdus=0, prochaine=.6;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:12});
      const lim=21*W.ech; me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
      W.degage(me,.9);
      W.mire.position.set(me.x,.07,me.z); W.mire.rotation.y=me.dir||0;
      coeur.rotation.y+=dt*.8;
      coeur.position.y=1.9+Math.sin(t*.0022)*.18;
      // les bots surgissent du bord et marchent vers le cœur
      prochaine-=dt;
      if(prochaine<=0){
        prochaine=Math.max(.40,1.5-el*.026);
        const a=rng()*Math.PI*2, R=23*W.ech;
        const g=new T.Group();
        const corps=new T.Mesh(new T.BoxGeometry(1.5,1.7,1.2),W.matiere(0xC96BB8,0x4a1040));
        corps.position.y=1.25; g.add(corps);
        const tete=new T.Mesh(new T.BoxGeometry(.95,.8,.9),W.matiere(0xFF9F45,0x5a2a00));
        tete.position.y=2.45; g.add(tete);
        [[-.55,0],[.55,0]].forEach(([x])=>{
          const j=new T.Mesh(new T.BoxGeometry(.42,1,.42),W.matiere(0x4A4270));
          j.position.set(x,.5,0); g.add(j);
        });
        g.position.set(Math.cos(a)*R,0,Math.sin(a)*R);
        MG3D.group().add(g);
        bots.push({g,v:1.9+rng()*1.1+el*.038,ph:rng()*7,vivant:true});
      }
      for(let i=bots.length-1;i>=0;i--){
        const b=bots[i];
        const d2=Math.hypot(b.g.position.x,b.g.position.z)||1;
        b.g.position.x-=(b.g.position.x/d2)*b.v*dt;
        b.g.position.z-=(b.g.position.z/d2)*b.v*dt;
        b.g.rotation.y=Math.atan2(-b.g.position.x,-b.g.position.z);
        b.g.position.y=Math.abs(Math.sin(t*.008+b.ph))*.22;   // démarche saccadée
        if(d2<3.4){                                            // il atteint le cœur
          perdus++; snd('bad'); vib(45);
          MG3D.burst(b.g.position.x,1.4,b.g.position.z,0xFF6B6B,14);
          MG3D.remove(b.g); bots.splice(i,1);
        }
      }
      W.recharge-=dt;
      if(W.feu){
        W.feu=false;
        if(W.recharge<=0){ W.recharge=W.cadence; W.tirer(me,0xFFD644,0); }
      }
      W.majBalles(dt,bots,b=>({x:b.g.position.x,y:1.5,z:b.g.position.z}),(b,p)=>{
        abattus++; vib(14);
        MG3D.burst(p.x,p.y,p.z,0xFFD644,16);
        MG3D.remove(b.g);
        const k=bots.indexOf(b); if(k>=0) bots.splice(k,1);
      });
      MG3D.look(me.x*.4,me.z*.4,false,0);
      pfEnvoi(W,me,env);
      info.textContent=abattus+' bot'+(abattus>1?'s':'')+(perdus?'  ·  '+perdus+' passé'+(perdus>1?'s':''):'');
      $('mgTimer').textContent=Math.max(0,38-el).toFixed(0)+' s';
      if(el>=38){ over=true; W.videBalles(); snd('fanfare'); pfFin(W,abattus*15-perdus*18); }
    });
  });
}
