/* ============================================================================
   MINI-JEUX 3D DE PLATEFORME
   Un petit noyau commun (gravité, saut, plateformes qui bougent, respawn,
   synchro des positions) sur lequel chaque jeu ne décrit que SES règles.
   ========================================================================== */

/* ---------- noyau ---------- */
function pfInit(area,opt){
  opt=opt||{};
  if(!MG3D.init(area,{theme:room.mapId,dist:opt.dist||27,el:opt.el===undefined?.52:opt.el})) return null;
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
    if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){ W.saut=true; e.preventDefault(); }
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
  const sp=o.sp||10.5, g=o.g||36, jv=o.jv||14.5;
  let mx=W.stick.x+W.kx, mz=W.stick.y+W.kz;
  const n=Math.hypot(mx,mz);
  if(n>1){ mx/=n; mz/=n; }
  if(o.axeZ) mz=o.axeZ;                 // certains jeux avancent tout seuls
  me.x+=mx*sp*dt; me.z+=mz*sp*dt;
  me.moving=Math.hypot(mx,mz)>.12;
  if(me.moving) me.dir=Math.atan2(mx,mz);
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
function pfHeros(W,x0,z0,ecart){
  room.players.forEach((p,k)=>{
    const h=MG3D.hero(p,{x:x0+(k-(room.players.length-1)/2)*(ecart||2.2),z:z0});
    h.pid=p.id; h.y=0; h.vy=0;
    W.hs[p.id]=h;
  });
  return W.hs[curP().id];
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
    const W=pfInit(area,{dist:24,el:.34}); if(!W){ submitScore(0); return; }
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
      pfStep(W,me,dt,{sp:8.6,jv:13.4});
      if(me.y>haut){ haut=me.y; if(me.grounded) checkY=me.y; }
      if(me.y<checkY-14){ me.x=0; me.z=0; me.y=checkY+1; me.vy=0; snd('bad'); vib(40); }
      MG3D.look(me.x,me.z,false,me.y);
      pfEnvoi(W,me,env);
      info.textContent=(haut*.9).toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,42-el).toFixed(0)+' s';
      if(el>=42){ over=true; snd('fanfare'); pfFin(W,haut*9); }
    });
  });
}

/* --- 49 : Course d'Obstacles — sauter les rondins qui arrivent --- */
function mgObst3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:24,el:.40}); if(!W){ submitScore(0); return; }
    const T=W.T, LONG=120;
    W.plat(0,0,LONG/2-6,13,LONG,0x8F86C8);
    const me=pfHeros(W,0,0,2.0);
    const info=mg3dInfo(area,'0 m');
    pfReseau(W,me,preActs);
    const rondins=[];
    for(let i=0;i<26;i++){
      const z=9+i*4.2+rng()*1.4;
      const m=new T.Mesh(new T.CylinderGeometry(.62,.62,9,8),W.matiere(0xC06A3A));
      m.rotation.z=Math.PI/2;
      m.position.set((rng()-.5)*4,.62,z);
      MG3D.group().add(m);
      rondins.push({m,z,x:m.position.x,v:(rng()<.5?-1:1)*(1.2+rng()*2.6)});
    }
    const env={}; let over=false, chocs=0, fini=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      pfStep(W,me,dt,{sp:10.4,jv:14.2});
      rondins.forEach(r=>{
        r.x+=r.v*dt; if(Math.abs(r.x)>3.6) r.v*=-1;
        r.m.position.x=r.x; r.m.rotation.x-=r.v*dt*1.4;
        if(me.y<1.25&&Math.abs(me.z-r.z)<1.0&&Math.abs(me.x-r.x)<4.6){
          me.z-=4.2; chocs++; snd('bad'); vib(50);
          MG3D.burst(me.x,1,me.z,0xFF6B6B,10);
        }
      });
      me.x=Math.max(-6,Math.min(6,me.x));
      me.z=Math.max(-3,me.z);
      if(me.z>=LONG-14&&!fini) fini=el;
      MG3D.look(me.x*.4,me.z,false,0);
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
    const W=pfInit(area,{dist:27,el:.60}); if(!W){ submitScore(0); return; }
    const N=7, CELL=3.4, ORI=-(N-1)/2*CELL;
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
        pfStep(W,me,dt,{sp:11,jv:13.2});
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
    const W=pfInit(area,{dist:23,el:.42}); if(!W){ submitScore(0); return; }
    const T=W.T;
    W.plat(0,0,0,17,17,0x8F86C8);
    const bras=new T.Mesh(new T.BoxGeometry(16,.7,.7),W.matiere(0xFF5FA2,0x6a0a30));
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
        pfStep(W,me,dt,{sp:9.5,jv:12.6});
        const lim=7.6;
        me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
        // la poutre nous fauche si on est au sol et sur son passage
        const d=Math.hypot(me.x,me.z);
        const aMe=Math.atan2(me.x,me.z);
        let da=Math.abs(((aMe-ang)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI);
        if(me.y<1.15&&d<8&&Math.min(da,Math.PI-da)<.13){
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
    const W=pfInit(area,{dist:25,el:.44}); if(!W){ submitScore(0); return; }
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
    const me=pfHeros(W,0,-4,1.5);
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
      pfStep(W,me,dt,{sp:9.8,jv:14.6});
      if(me.y<-10){ chutes++; me.x=0; me.z=Math.max(-4,me.z-8); me.y=1; me.vy=0; snd('bad'); vib(60); }
      if(me.z>=ARR&&!fini) fini=el;
      MG3D.look(me.x*.4,me.z,false,0);
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
    const W=pfInit(area,{dist:26,el:.40}); if(!W){ submitScore(0); return; }
    W.plat(0,0,0,20,20,0x6E63A8);
    for(let i=0;i<7;i++){
      const a=i/7*Math.PI*2;
      const p=W.plat(Math.cos(a)*6.4,.5,Math.sin(a)*6.4,3.6,3.6,0x3EE6C1,.5);
      p.ressort=22+i%3*2;
    }
    const etoiles=[];
    for(let i=0;i<26;i++){
      const a=rng()*7, r=rng()*8.4;
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
      pfStep(W,me,dt,{sp:9.2,jv:13,g:30});
      const lim=9.4;
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
      MG3D.look(me.x*.4,me.z*.4,false,Math.max(0,me.y*.5));
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
    const W=pfInit(area,{dist:24,el:.36}); if(!W){ submitScore(0); return; }
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
      niv+=(1.55+el*.045)*dt;
      lave.position.y=niv+Math.sin(t*.003)*.16;
      if(me.alive!==false){
        pfStep(W,me,dt,{sp:9.4,jv:14.2});
        haut=Math.max(haut,me.y);
        if(me.y<niv+.5){
          me.alive=false; mortA=Date.now(); snd('bad'); vib(70);
          MG3D.burst(me.x,niv+1,me.z,0xFF5A18,16);
          actSend({k:'pd',id:me.pid});
        }
      }
      MG3D.look(me.x*.5,me.z*.5,false,Math.max(niv,me.y));
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
    const W=pfInit(area,{dist:20,el:.30}); if(!W){ submitScore(0); return; }
    const T=W.T;
    const anneaux=[];
    for(let i=0;i<40;i++){
      const g=new T.Group();
      const y=-8-i*7;
      const trou=rng()*Math.PI*2, large=1.05-Math.min(.55,i*.014);
      for(let k=0;k<11;k++){
        const a=k/11*Math.PI*2;
        let da=Math.abs(((a-trou)+Math.PI*3)%(Math.PI*2)-Math.PI);
        if(da<large) continue;
        const m=new T.Mesh(new T.BoxGeometry(2.3,.8,1.7),W.matiere(i%4===0?0xFF6B6B:0x8F86C8));
        m.position.set(Math.cos(a)*6.2,y,Math.sin(a)*6.2);
        m.rotation.y=-a;
        g.add(m);
      }
      MG3D.group().add(g);
      anneaux.push({g,y,trou,large,r:6.2});
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
      me.vy=Math.max(-19,(me.vy||0)-26*dt);
      me.y+=me.vy*dt;
      let mx=W.stick.x+W.kx, mz=W.stick.y+W.kz;
      me.x+=mx*11*dt; me.z+=mz*11*dt;
      const d=Math.hypot(me.x,me.z);
      if(d>5.4){ me.x*=5.4/d; me.z*=5.4/d; }
      me.moving=true; me.dir=Math.atan2(mx,mz);
      anneaux.forEach(A=>{
        if(A.passe) return;
        if(me.y<A.y+.7&&me.y>A.y-.9){
          const aMe=Math.atan2(me.z,me.x);
          let da=Math.abs(((aMe-A.trou)+Math.PI*3)%(Math.PI*2)-Math.PI);
          const dist=Math.hypot(me.x,me.z);
          if(dist>4.2&&da>=A.large){
            A.passe=true; chocs++; me.vy=2; snd('bad'); vib(50);
            MG3D.burst(me.x,me.y,me.z,0xFF6B6B,12);
          } else { A.passe=true; snd('coin'); }
        }
      });
      prof=Math.max(prof,-me.y);
      MG3D.look(me.x*.3,me.z*.3,false,me.y);
      pfEnvoi(W,me,env);
      info.textContent=prof.toFixed(0)+' m';
      $('mgTimer').textContent=Math.max(0,32-el).toFixed(0)+' s';
      if(el>=32||prof>270){ over=true; snd('fanfare'); pfFin(W,prof*2.4-chocs*22); }
    });
  });
}

/* --- 56 : Escalier Roulant — l'escalier descend, il faut monter --- */
function mgEscalier3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=pfInit(area,{dist:25,el:.42}); if(!W){ submitScore(0); return; }
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
        pfStep(W,me,dt,{sp:9.6,jv:13.6});
        best=Math.max(best,el);
        if(me.y<-13||me.z<-11){
          me.alive=false; mortA=Date.now(); snd('bad'); vib(70);
          actSend({k:'pd',id:me.pid});
        }
      }
      MG3D.look(me.x*.5,me.z,false,me.y);
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
    const W=pfInit(area,{dist:25,el:.36}); if(!W){ submitScore(0); return; }
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
      pfStep(W,me,dt,{sp:9.4,jv:14.4});
      haut=Math.max(haut,me.y);
      if(me.y<-11){ me.x=0; me.z=0; me.y=1; me.vy=0; snd('bad'); vib(50); }
      if(me.y>SOM-.6&&Math.hypot(me.x,me.z)<3.4&&!fini){ fini=el; snd('fanfare'); MG3D.burst(0,SOM+2,0,0xFFD644,26); }
      MG3D.look(me.x*.5,me.z*.5,false,me.y);
      pfEnvoi(W,me,env);
      info.textContent=fini?'DRAPEAU !':Math.min(99,haut/SOM*100).toFixed(0)+' %';
      $('mgTimer').textContent=Math.max(0,50-el).toFixed(0)+' s';
      if(fini||el>=50){ over=true; pfFin(W,fini?(760-fini*9):(haut/SOM*420)); }
    });
  });
}
