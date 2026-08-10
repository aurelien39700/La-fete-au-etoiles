/* ============================================================================
   MINI-JEUX 3D DE PLATEFORME
   Un petit noyau commun (gravité, saut, plateformes qui bougent, respawn,
   synchro des positions) sur lequel chaque jeu ne décrit que SES règles.
   ========================================================================== */

/* ---------- noyau ---------- */
function pfInit(area,opt){
  opt=opt||{};
  if(!MG3D.init(area,{theme:room.mapId,
      dist:opt.dist||27, el:opt.el===undefined?.52:opt.el, az:opt.az,
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
  window.__PF=W;
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
    W.plat(0,0,0,17,17,0x8F86C8);
    const bras=new T.Mesh(new T.BoxGeometry(25,.7,.7),W.matiere(0xFF5FA2,0x6a0a30));
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
        const lim=7.6;
        me.x=Math.max(-lim,Math.min(lim,me.x)); me.z=Math.max(-lim,Math.min(lim,me.z));
        // la poutre nous fauche si on est au sol et sur sa ligne exacte
        const d=Math.hypot(me.x,me.z);
        const bx=Math.cos(ang), bz=-Math.sin(ang);          // direction reelle du bras
        const ecart=Math.abs(me.x*bz-me.z*bx);              // distance a la ligne
        if(me.y<1.15&&d<12.6&&ecart<1.0){
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
      pfStep(W,me,dt,{sp:9.2,jv:14.6,g:29});
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
   MINI-JEUX 3D DE TIR
   Le joystick vise (réticule au centre de l'écran), le bouton tire. Même
   noyau réseau que les jeux de plateforme, mais on reste en place et on cadre.
   ========================================================================== */
function tirInit(area,opt){
  opt=opt||{};
  if(!MG3D.init(area,{theme:room.mapId,
      dist:opt.dist||3, el:opt.el===undefined?.12:opt.el, az:opt.az===undefined?0:opt.az,
      vise:opt.vise===undefined?1.6:opt.vise, lerp:opt.lerp||9,
      fog:opt.fog, far:opt.far||600, fov:opt.fov||52})) return null;
  const T=MG3D.THREE;
  const W={T,hs:{},feu:false,area,az:0,el:(opt.el===undefined?.12:opt.el)};
  W.stick=MG3D.joystick(area);
  // réticule fixe au centre
  const r=document.createElement('div');
  r.style.cssText='position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px 0 0 -19px;'+
    'border:3px solid rgba(255,255,255,.85);border-radius:50%;pointer-events:none;z-index:5;'+
    'box-shadow:0 0 0 2px rgba(0,0,0,.35),0 0 12px rgba(0,0,0,.5);';
  const pt=document.createElement('div');
  pt.style.cssText='position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;'+
    'background:#FF5FA2;border-radius:50%;pointer-events:none;z-index:6;';
  area.appendChild(r); area.appendChild(pt);
  // bouton de tir
  const b=document.createElement('button');
  b.textContent='🎯';
  b.style.cssText='position:absolute;right:14px;bottom:14px;width:88px;height:88px;border-radius:50%;'+
    'border:3px solid rgba(255,255,255,.45);background:rgba(255,95,162,.92);color:#fff;'+
    'font-size:36px;line-height:1;z-index:6;touch-action:none;cursor:pointer;'+
    'box-shadow:0 6px 16px rgba(0,0,0,.45);';
  b.addEventListener('pointerdown',e=>{ e.stopPropagation(); e.preventDefault(); W.feu=true; });
  area.appendChild(b);
  W.onDown=e=>{ if(e.code==='Space'){ W.feu=true; e.preventDefault(); } };
  addEventListener('keydown',W.onDown);
  W.fin=()=>{ removeEventListener('keydown',W.onDown); };
  W.matiere=(col,glow)=>new T.MeshStandardMaterial({color:col,emissive:glow||0,
    emissiveIntensity:glow?1.2:0,roughness:.6,flatShading:true});
  // le joystick fait pivoter la visée ; la caméra suit
  W.viser=dt=>{
    W.az-=W.stick.x*1.9*dt;
    W.el=Math.max(-.12,Math.min(.62,W.el-W.stick.y*1.2*dt));
    MG3D.cadre({az:W.az,el:W.el});
  };
  // direction du canon : pile là où pointe le réticule
  W.tir=()=>{
    const ce=Math.cos(W.el);
    return new T.Vector3(-Math.sin(W.az)*ce,Math.sin(W.el),-Math.cos(W.az)*ce);
  };
  // une cible est-elle dans le réticule ?
  W.touche=(p,tol)=>{
    const d=W.tir();
    const v=new T.Vector3(p.x,p.y-1.6,p.z).normalize();
    return v.dot(d)>Math.cos(tol||.13);
  };
  return W;
}
/* trait lumineux du tir, qui s'efface tout seul */
function trait(W,dir,portee,col){
  const T=W.T;
  const g=new T.BufferGeometry().setFromPoints([
    new T.Vector3(0,1.4,0), new T.Vector3(dir.x*portee,1.6+dir.y*portee,dir.z*portee)]);
  const l=new T.Line(g,new T.LineBasicMaterial({color:col||0xFFD644,transparent:true,opacity:.95}));
  MG3D.group().add(l);
  let t=0;
  const f=setInterval(()=>{
    t+=.05; l.material.opacity=Math.max(0,.95-t*4);
    if(t>.25){ clearInterval(f); MG3D.remove(l); }
  },50);
}

/* --- Stand de Tir : les cibles surgissent, on dégaine --- */
function mgStand3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirInit(area,{fog:[40,150]}); if(!W){ submitScore(0); return; }
    const T=W.T;
    const cibles=[];
    for(let i=0;i<14;i++){
      const a=(i/14)*Math.PI*2;
      const g=new T.Group();
      const d=new T.Mesh(new T.CylinderGeometry(1.15,1.15,.22,14),W.matiere(0xFF5FA2,0x5a0a28));
      d.rotation.x=Math.PI/2; g.add(d);
      const c=new T.Mesh(new T.CylinderGeometry(.5,.5,.26,12),W.matiere(0xFFF4D8,0x8a7a40));
      c.rotation.x=Math.PI/2; c.position.z=.03; g.add(c);
      const pied=new T.Mesh(new T.CylinderGeometry(.12,.16,2.4,6),W.matiere(0x6E63A8));
      pied.position.y=-2.3; g.add(pied);
      const R=17+((i*5)%3)*3.5;
      g.position.set(Math.sin(a)*R,2.4+((i*7)%3)*1.5,Math.cos(a)*R);
      g.lookAt(0,g.position.y,0);
      g.visible=false;
      MG3D.group().add(g);
      cibles.push({g,active:false,t:0});
    }
    const info=mg3dInfo(area,'0 pt');
    let over=false, pts=0, rate=0, prochaine=.5;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      W.viser(dt);
      prochaine-=dt;
      if(prochaine<=0){
        prochaine=Math.max(.32,1.15-el*.022);
        const libres=cibles.filter(c=>!c.active);
        if(libres.length){
          const c=libres[Math.floor(rng()*libres.length)];
          c.active=true; c.t=Math.max(1.1,2.4-el*.03); c.g.visible=true;
        }
      }
      cibles.forEach(c=>{
        if(!c.active) return;
        c.t-=dt;
        c.g.rotation.z=Math.sin(t*.006)*.25;
        if(c.t<=0){ c.active=false; c.g.visible=false; }
      });
      if(W.feu){
        W.feu=false;
        const d=W.tir();
        trait(W,d,42,0xFFD644);
        snd('shot');
        const vise=cibles.filter(c=>c.active&&W.touche(c.g.position,.10))
          .sort((a,b)=>a.g.position.length()-b.g.position.length())[0];
        if(vise){
          pts+=10; vise.active=false; vise.g.visible=false;
          snd('coin'); vib(18);
          MG3D.burst(vise.g.position.x,vise.g.position.y,vise.g.position.z,0xFFD644,14);
        } else rate++;
      }
      info.textContent=pts+' pt'+(pts>1?'s':'')+(rate?'  ·  '+rate+' raté'+(rate>1?'s':''):'');
      $('mgTimer').textContent=Math.max(0,32-el).toFixed(0)+' s';
      if(el>=32){ over=true; snd('fanfare'); pfFin(W,pts*9-rate*4); }
    });
  });
}

/* --- Pluie de Météores : abattre les rochers avant l'impact --- */
function mgMeteo3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirInit(area,{el:.30,vise:2.4,fog:[50,180]}); if(!W){ submitScore(0); return; }
    const T=W.T;
    const sol=new T.Mesh(new T.CylinderGeometry(26,26,1,30),W.matiere(0x6E63A8));
    sol.position.y=-.5; MG3D.group().add(sol);
    const roches=[];
    const info=mg3dInfo(area,'0 abattu');
    let over=false, abattus=0, impacts=0, prochaine=.6;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      W.viser(dt);
      prochaine-=dt;
      if(prochaine<=0){
        prochaine=Math.max(.34,1.3-el*.028);
        const a=rng()*Math.PI*2, R=9+rng()*13;
        const m=new T.Mesh(new T.DodecahedronGeometry(.95+rng()*.5),W.matiere(0x8A5A3A,0x3a1408));
        m.position.set(Math.sin(a)*R,26+rng()*7,Math.cos(a)*R);
        MG3D.group().add(m);
        roches.push({m,v:3.4+rng()*2.2+el*.07,sp:rng()*3});
      }
      for(let i=roches.length-1;i>=0;i--){
        const r=roches[i];
        r.m.position.y-=r.v*dt;
        r.m.rotation.x+=dt*r.sp; r.m.rotation.y+=dt*r.sp*.7;
        if(r.m.position.y<=.9){
          impacts++; snd('boom'); vib(45);
          MG3D.burst(r.m.position.x,.9,r.m.position.z,0xFF6B6B,16);
          MG3D.remove(r.m); roches.splice(i,1);
        }
      }
      if(W.feu){
        W.feu=false;
        const d=W.tir();
        trait(W,d,44,0x3EE6C1);
        snd('shot');
        let best=-1, bd=1e9;
        roches.forEach((r,i)=>{
          if(!W.touche(r.m.position,.12)) return;
          const dd=r.m.position.length();
          if(dd<bd){ bd=dd; best=i; }
        });
        if(best>=0){
          const r=roches[best];
          abattus++; snd('boom'); vib(20);
          MG3D.burst(r.m.position.x,r.m.position.y,r.m.position.z,0xFFD644,18);
          MG3D.remove(r.m); roches.splice(best,1);
        }
      }
      info.textContent=abattus+' abattu'+(abattus>1?'s':'')+(impacts?'  ·  '+impacts+' impact'+(impacts>1?'s':''):'');
      $('mgTimer').textContent=Math.max(0,34-el).toFixed(0)+' s';
      if(el>=34){ over=true; snd('fanfare'); pfFin(W,abattus*14-impacts*7); }
    });
  });
}

/* --- Duel de Ballons : crever les 22 ballons le plus vite possible --- */
function mgBallons3D(area){
  pfDepart(area,(preActs,start,rng)=>{
    const W=tirInit(area,{el:.22,vise:2.0,fog:[45,170]}); if(!W){ submitScore(0); return; }
    const T=W.T;
    const COLS=[0xFF5FA2,0x3EE6C1,0xFFD644,0x5AC8FA,0xC39BFF,0xFF9F45];
    const ballons=[];
    for(let i=0;i<22;i++){
      const a=(i/22)*Math.PI*2+rng()*.2, R=13+rng()*9;
      const col=COLS[i%COLS.length];
      const g=new T.Group();
      const b=new T.Mesh(new T.SphereGeometry(.95,10,9),W.matiere(col,col));
      b.material.emissiveIntensity=.35;
      b.scale.y=1.25; g.add(b);
      const n=new T.Mesh(new T.ConeGeometry(.22,.42,6),W.matiere(col));
      n.position.y=-1.3; n.rotation.x=Math.PI; g.add(n);
      g.position.set(Math.sin(a)*R,2.6+rng()*8,Math.cos(a)*R);
      MG3D.group().add(g);
      ballons.push({g,ph:rng()*7,amp:.5+rng()*.9,y0:g.position.y,vivant:true});
    }
    const info=mg3dInfo(area,'0 / 22');
    let over=false, creves=0, rate=0, fini=0;
    MG3D.frame((dt,t)=>{
      if(over) return;
      const el=(Date.now()-start)/1000;
      W.viser(dt);
      ballons.forEach(b=>{ if(b.vivant) b.g.position.y=b.y0+Math.sin(t*.0013+b.ph)*b.amp; });
      if(W.feu){
        W.feu=false;
        const d=W.tir();
        trait(W,d,40,0xFF5FA2);
        snd('shot');
        let best=null, bd=1e9;
        ballons.forEach(b=>{
          if(!b.vivant||!W.touche(b.g.position,.11)) return;
          const dd=b.g.position.length();
          if(dd<bd){ bd=dd; best=b; }
        });
        if(best){
          best.vivant=false; best.g.visible=false; creves++;
          snd('pop'); vib(16);
          MG3D.burst(best.g.position.x,best.g.position.y,best.g.position.z,0xFF5FA2,16);
          if(creves>=ballons.length&&!fini) fini=el;
        } else rate++;
      }
      info.textContent=creves+' / '+ballons.length;
      $('mgTimer').textContent=Math.max(0,34-el).toFixed(0)+' s';
      if(fini||el>=34){
        over=true; snd('fanfare');
        pfFin(W,fini?(760-fini*12-rate*4):(creves*26-rate*4));
      }
    });
  });
}
