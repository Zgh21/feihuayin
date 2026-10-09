/* ============================================================
   飞花音 · 交互逻辑
   ============================================================ */
const $  = (s,e=document)=>e.querySelector(s);
const $$ = (s,e=document)=>[...e.querySelectorAll(s)];
const screen = document.getElementById('screen');
const toastEl = document.getElementById('toast');
const rnd = (a)=>a[Math.floor(Math.random()*a.length)];
const rint = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const esc = (s)=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const AVA_COLORS = ['#B23A2E','#3C6E5D','#7A5EA8','#B08A4F','#3D6FA8','#A8574E','#5C8A5A','#8A6A3E'];
let toastTimer=null, matchIv=null, matchT=null;
function toast(msg,ms=1900){ toastEl.innerHTML=msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'),ms); }

/* ============================================================
   声音引擎：真实可听的语音（TTS）+ 合成旋律（Web Audio）
   —— 让「接歌」不只是字幕，而是能点开听的语音条
   ============================================================ */
const Voice = {
  on:true,
  ctx:null,
  speaking:false,
  ac(){ if(!this.ctx){ try{ this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ this.ctx=null; } } if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); return this.ctx; },
  cancel(){ try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){} this.speaking=false; },
  beep(freq=880,dur=0.12,type='sine',vol=0.08){
    if(!this.on) return; const ac=this.ac(); if(!ac) return;
    const t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t+dur+0.02);
  },
  /* 模拟「原唱副歌」：五声音阶随机短句，听感像一段国风旋律 */
  melody(seed,opt={}){
    if(!this.on) return; const ac=this.ac(); if(!ac) return;
    const scale=[0,2,4,7,9,12,14,16,19];
    let s=(seed>>>0)||1; const rand=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
    const base=196*(opt.up?1.5:1), t0=ac.currentTime+0.03, step=opt.step||0.32, n=opt.n||rint(6,9);
    for(let i=0;i<n;i++){
      const st=scale[Math.floor(rand()*scale.length)]+(rand()>0.78?12:0);
      const f=base*Math.pow(2,st/12);
      const start=t0+i*step, dur=(opt.len||0.62)+rand()*0.35;
      const o=ac.createOscillator(), g=ac.createGain(), o2=ac.createOscillator(), g2=ac.createGain();
      o.type = i%2 ? 'triangle':'sine'; o.frequency.value=f;
      o2.type='sine'; o2.frequency.value=f*2.005;
      g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(0.14,start+0.035); g.gain.exponentialRampToValueAtTime(0.0001,start+dur);
      g2.gain.setValueAtTime(0,start); g2.gain.linearRampToValueAtTime(0.035,start+0.03); g2.gain.exponentialRampToValueAtTime(0.0001,start+dur*0.7);
      o.connect(g); g.connect(ac.destination); o2.connect(g2); g2.connect(ac.destination);
      o.start(start); o.stop(start+dur+0.05); o2.start(start); o2.stop(start+dur+0.05);
    }
  }
};
/* 让浏览器预加载语音列表 */

/* ============================================================
   麦克风录音：真的录下玩家自己的声音，并用这段真实音频回放
   ============================================================ */
const Mic = {
  stream:null, rec:null, chunks:[], ac:null, an:null, raf:null, ok:false, startedAt:0,
  async ensure(){
    if(this.ok && this.stream && this.stream.active) return true;
    if(!navigator.mediaDevices || !window.MediaRecorder) return false;
    try{
      this.stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      this.ok = true; return true;
    }catch(e){ this.ok=false; return false; }
  },
  async start(){
    const ready = await this.ensure();
    if(!ready) return false;
    this.chunks=[];
    try{
      const cands=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
      const mime = cands.find(t=>{ try{ return window.MediaRecorder.isTypeSupported(t); }catch(e){ return false; } });
      this.rec = mime ? new MediaRecorder(this.stream,{mimeType:mime}) : new MediaRecorder(this.stream);
    }catch(e){ return false; }
    this.rec.ondataavailable = e=>{ if(e.data && e.data.size) this.chunks.push(e.data); };
    try{ this.rec.start(120); }catch(e){ return false; }
    this.startedAt = Date.now();
    this.meter();
    return true;
  },
  async stop(){
    const rec=this.rec; this.stopMeter();
    if(!rec || rec.state==='inactive') return null;
    const dur = Math.max(0.4,(Date.now()-this.startedAt)/1000);
    return new Promise(res=>{
      let done=false; const fin=v=>{ if(!done){ done=true; res(v); } };
      rec.onstop=()=>{
        try{
          const blob=new Blob(this.chunks,{type:(rec.mimeType||'audio/webm').split(';')[0]});
          if(blob.size<800) return fin(null);
          fin({url:URL.createObjectURL(blob), dur: Math.round(dur*10)/10, size:blob.size});
        }catch(e){ fin(null); }
      };
      try{ rec.stop(); }catch(e){ fin(null); }
      setTimeout(()=>fin(null),900);
    });
  },
  meter(){
    try{
      if(!this.ac){ this.ac=new (window.AudioContext||window.webkitAudioContext)(); }
      if(this.ac.state==='suspended') this.ac.resume();
      if(!this.an){
        const src=this.ac.createMediaStreamSource(this.stream);
        this.an=this.ac.createAnalyser(); this.an.fftSize=64; src.connect(this.an);
      }
      const data=new Uint8Array(this.an.frequencyBinCount);
      const loop=()=>{
        this.raf=requestAnimationFrame(loop);
        try{ this.an.getByteFrequencyData(data); }catch(e){ return; }
        const bs=document.querySelectorAll('#recbtn .holdingwave i');
        const n=bs.length||1;
        bs.forEach((b,i)=>{ const v=data[Math.min(data.length-1,Math.floor(i*data.length/n))]||0; b.style.height=Math.max(20,Math.min(100,v/255*100))+'%'; });
      };
      loop();
    }catch(e){}
  },
  stopMeter(){ if(this.raf) cancelAnimationFrame(this.raf); this.raf=null; }
};

/* ============================================================
   原唱播放器 · 真实歌曲片段（Apple Music 官方 30s 试听，直连 CDN）
   没有版权片段的歌曲 → 自动回退「合成试听」
   ============================================================ */
let audioEl=null, playerTimer=null;
function getAudio(){ if(!audioEl){ audioEl=new Audio(); audioEl.preload='auto'; } return audioEl; }
function musicOf(song){ return MUSIC[song]||null; }

function positionPlayerBar(){
  const el=document.getElementById('playerBar'); if(!el) return;
  el.style.bottom = document.querySelector('#screen .bottomnav') ? '68px' : '0px';
}
function ensurePlayerBar(){
  let el=document.getElementById('playerBar');
  if(!el){ el=document.createElement('div'); el.id='playerBar'; el.className='playerbar'; document.getElementById('phone').appendChild(el); }
  positionPlayerBar(); return el;
}
function hidePlayerBar(){ const el=document.getElementById('playerBar'); if(el){ el.classList.remove('on'); el.innerHTML=''; } const sc=document.getElementById('screen'); if(sc) sc.classList.remove('has-player'); }
function paintPlayerBar(state){
  const el=ensurePlayerBar(); const a=getAudio();
  el.classList.add('on');
  const sc=document.getElementById('screen'); if(sc) sc.classList.add('has-player');
  const pct = a.duration? Math.min(100, a.currentTime/a.duration*100):0;
  const kind = state.kind||'real';
  const real = kind==='real';
  const isVoice = kind==='voice';
  const icon = isVoice?'🎙':(real?'♪':'✎');
  const tag  = isVoice?'我的录音':(real?'原唱片段 · 30s':'合成试听');
  const note = isVoice?'这是你自己刚录下的原声':(real?'来自音乐库正版曲库':'暂无可播放版权片段，已用语音合成代替');
  const title = isVoice? state.song : `《${esc(state.song)}》`;
  el.innerHTML=`
    <div class="prow">
      <div class="cov">${icon}</div>
      <div class="ptx"><b>${title}</b><span>${esc(state.artist||'—')}</span></div>
      <button class="pbtn" id="pToggle">${state.playing?'❚❚':'▶'}</button>
      <button class="pclose" id="pClose">✕</button>
    </div>
    <div class="pline"><i style="width:${pct}%"></i></div>
    <div class="pnote"><span class="livetag ${real?'':'synth'}">${tag}</span><span>${note}</span><span style="margin-left:auto" id="pTime">${fmtSec(a.currentTime)}</span></div>`;
  $('#pToggle').onclick=()=>{ togglePlay(); };
  $('#pClose').onclick=()=>{ stopAllAudio(); };
}
function fmtSec(t){ t=Math.max(0,Math.floor(t||0)); return Math.floor(t/60)+':'+String(t%60).padStart(2,'0'); }
function tickPlayer(){ if(audioEl&&!audioEl.paused) paintPlayerBar({song:nowPlaying.song, artist:nowPlaying.artist, playing:true, kind:nowPlaying.kind}); }
let nowPlaying={song:'',artist:'',kind:'real'};

/* 播放真实原唱片段；resolve(true/false) */
let autoStopTimer=null;
function playReal(song, artist, maxSec){
  Voice.cancel();
  return new Promise(resolve=>{
    const e=musicOf(song), a=getAudio();
    if(!e){ resolve(false); return; }
    nowPlaying={song,artist:artist||e.a,kind:'real'};
    paintPlayerBar({song,artist:artist||e.a,playing:false,kind:'real'});
    a.pause(); a.src=e.u; a.currentTime=0; a.volume=1;
    let settled=false;
    const ok=()=>{ if(settled) return; settled=true; clearTimeout(to); clearInterval(playerTimer); playerTimer=setInterval(tickPlayer,300); paintPlayerBar({song,artist:artist||e.a,playing:true,kind:'real'});
      if(maxSec){ clearTimeout(autoStopTimer); autoStopTimer=setTimeout(()=>{ try{ a.pause(); }catch(err){} clearInterval(playerTimer); paintPlayerBar({song,artist:artist||e.a,playing:false,kind:'real'}); }, maxSec*1000); }
      resolve(true); };
    const bad=()=>{ if(settled) return; settled=true; clearTimeout(to); resolve(false); };
    a.addEventListener('playing',ok,{once:true});
    a.addEventListener('error',bad,{once:true});
    a.addEventListener('ended',()=>{ stopAllAudio(); },{once:true});
    const pr=a.play();
    if(pr&&pr.catch) pr.catch(()=>{
      /* 自动播放被拦：不要谎报“正在播放”，重试一次再交给上层兜底 */
      setTimeout(()=>{
        if(settled) return;
        if(a.readyState>=2 && !a.paused){ ok(); return; }
        const p2=a.play();
        if(p2&&p2.catch) p2.catch(()=>bad());
        else if(a.paused) bad();
      },250);
    });
    const to=setTimeout(()=>{ if(settled) return; if(a.readyState>=2) ok(); else bad(); },6000);
  });
}
/* 合成伴奏也纳入「是否还在响」的判断（Web Audio 不走 <audio> 元素） */
let melodyUntil=0;
function melodyLeft(){ return Math.max(0, melodyUntil - Date.now()); }
function isAudioIdle(){
  const a=audioEl;
  if(!a || !a.src) return melodyLeft()<=0;
  const ended = a.ended || a.paused || (a.duration>0 && a.currentTime >= a.duration-0.15);
  return ended && melodyLeft()<=0;
}
/* 等上一位把音乐/伴奏彻底放完：用轮询而不是事件，避免错过 ended 时序 */
function waitAudioIdle(maxMs=34000){
  const t0=Date.now();
  return new Promise(res=>{
    const tick=()=>{
      if(isAudioIdle() || Date.now()-t0>=maxMs) return res();
      setTimeout(tick,180);
    };
    tick();
  });
}
/* 无版权片段时的「合成伴奏」：只放旋律，绝不朗读 */
function playMelodyOnly(song, sec){
  const dur=(sec||8);
  melodyUntil=Date.now()+dur*1000;
  nowPlaying={song, artist:'合成伴奏', kind:'synth'};
  paintPlayerBar({song, artist:'合成伴奏', playing:true, kind:'synth'});
  Voice.melody(hash(song),{up:true,n:8});
  return new Promise(r=>setTimeout(()=>{ paintPlayerBar({song,artist:'合成伴奏',playing:false,kind:'synth'}); r(false); }, dur*1000));
}
/* 自动播放：优先接入的真实原唱片段，没有则放合成伴奏（不会朗读） */
function playAutoSong(song, maxSec){
  if(!song || song==='—') return Promise.resolve(false);
  const e=musicOf(song);
  const sec = maxSec!=null ? maxSec : (S.clipSec||20);
  if(!e) return playMelodyOnly(song, Math.min(sec,8));
  nowPlaying={song, artist:e.a, kind:'real'};
  return playReal(song, e.a, sec);
}
function togglePlay(){ const a=getAudio(); if(!a.src) return; if(a.paused){ a.play(); paintPlayerBar({...nowPlaying,playing:true}); } else { a.pause(); paintPlayerBar({...nowPlaying,playing:false}); } }
function stopAllAudio(){
  clearTimeout(autoStopTimer); melodyUntil=0;
  try{ if(audioEl){ audioEl.pause(); audioEl.removeAttribute('src'); } }catch(e){}
  clearInterval(playerTimer); playerTimer=null; Voice.cancel(); hidePlayerBar();
}
/* 合成试听（回退） */
async function synthListen(song, lyric, artist){
  /* 无版权片段：只放合成伴奏，不朗读歌词 */
  await playMelodyOnly(song, 8);
}

/* 语音波形条 */
function waveHTML(n){ n=n||rint(16,26); let h=''; for(let i=0;i<n;i++) h+='<i></i>'; return '<span class="wave">'+h+'</span>'; }
function durText(){ return '0:0'+rint(3,9); }


/* ---------------- 状态 ---------------- */
const S = {
  view:'home', history:[],
  selType:'single', prefs:{lang:[],era:[],genre:[],singer:[]}, prefsOpen:false,
  mode:'random',           // random(在线组队) / host(私房) / duel(人机)
  deal:{word:null,type:null},
  room:null,
  cfIndex:0,
  duel:null,
  dbWord:'月',
  archives:[],             // 留档条目
  chain:[],
  skill:{pass:0, owned:{}, earned:[]},
  turnSec:30,
  clipSec:20,          // 每条接歌播放的片段时长（秒）
  stats:{songs:18, wins:6, bestStreak:5, matches:9, archived:3},
  matches:[{word:'月',type:'single',play:'standard',score:3,mvp:'我',time:'今天 20:12'},{word:'雨',type:'single',play:'bomb',score:2,mvp:'阿令',time:'昨天 21:40'},{word:'风',type:'combo',play:'standard',score:4,mvp:'我',time:'10-07 19:20'}],
  myPlaylist:[{song:'但愿人长久',artist:'王菲'},{song:'城里的月光',artist:'许美静'},{song:'东风破',artist:'周杰伦'}],
  seed:Date.now()
};

const ME = { id:'me', name:'我', color:'#B23A2E', initial:'我', isNpc:false, score:0, streak:0, passes:0 };
function makeNpc(name,i){ return { id:'npc'+i, name, color:AVA_COLORS[(i+1)%AVA_COLORS.length], initial:name[0], isNpc:true, score:0, streak:0, passes:0, persona:null }; }
function av(p,cls=''){ return `<div class="avatar ${cls}" style="background:linear-gradient(150deg,${p.color},${shade(p.color,-22)})" title="${esc(p.name)}">${esc(p.initial)}${p.isNpc?'':'<span class="dot"></span>'}</div>`; }
function shade(hex,p){ const n=parseInt(hex.slice(1),16); let r=(n>>16)+p*2.55,g=((n>>8)&255)+p*2.55,b=(n&255)+p*2.55; r=Math.max(0,Math.min(255,r|0));g=Math.max(0,Math.min(255,g|0));b=Math.max(0,Math.min(255,b|0)); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }

/* 封面图：月/雨/夜用文档里的水墨背景板，其余单字用生成的主题图（卡牌白字对应图中黑字诗句） */
const BG_MAP = {
  '月':'assets/ink-moon.jpg','雨':'assets/ink-rain.jpg','风':'assets/风.png','夜':'assets/ink-night.jpg',
  '花':'assets/花主题图片生成.png',
  '酒':'assets/花主题图片生成 (1).png',
  '山':'assets/花主题图片生成 (2).png',
  '水':'assets/花主题图片生成 (3).png',
  '天':'assets/花主题图片生成 (4).png',
  '心':'assets/花主题图片生成 (5).png',
  '人':'assets/花主题图片生成 (6).png',
  '云':'assets/花主题图片生成 (7).png',
  '雪':'assets/花主题图片生成 (8).png',
  '春':'assets/花主题图片生成 (9).png'
};
const BG_LIST = ['assets/ink-moon.jpg','assets/ink-rain.jpg','assets/ink-wind.jpg','assets/ink-night.jpg'];
/* 卡面不再叠白色令字：题目统一显示在卡片下方标题处 */
function bgFor(word){
  if(BG_MAP[word]) return BG_MAP[word];
  let h=0; for(const c of word) h=(h*131+c.charCodeAt(0))>>>0;
  return BG_LIST[h%BG_LIST.length];
}
function inkboard(word,cap){
  return `<div class="inkboard"><div class="bg" style="background-image:url('${bgFor(word)}')"></div><div class="veil"></div>
    <div class="inner"><div class="glyph serif">${esc(word)}</div>${cap?`<div class="cap">${esc(cap)}</div>`:''}</div></div>`;
}

/* ---------------- 路由 ---------------- */
const VIEWS = {};
function go(view,params={}){
  if(S.view!==view) S.history.push(S.view);
  /* 离开某视图时清理它的定时器，避免孤儿定时器写到已卸载的 DOM */
  if(view!=='match'){ clearInterval(matchIv); clearTimeout(matchT); matchIv=null; matchT=null; }
  if(view!=='room'){
    clearInterval(timerHandle);
    if(S.room){
      if(S.view==='room') S.room.abandoned=true;   /* 只在真正离开房间时作废，防止陈旧异步误伤 */
      if(S.room.npcTimer) clearTimeout(S.room.npcTimer);
    }
  }
  if(view!=='duel'){ clearInterval(duelTimer); }
  S.view=view; Object.assign(S,params);
  render();
  const sc=$('.scroll',screen); if(sc) sc.scrollTop=0;
}
function back(){ const p=S.history.pop()||'home'; S.view=p; render(); }
function render(){
  const v=VIEWS[S.view]; if(!v){ S.view='home'; return render(); }
  screen.innerHTML='<div class="view active">'+v.html()+'</div>';
  if(v.mount) v.mount();
  const sc=$('.scroll',screen); if(sc) sc.scrollTop=0;
}


/* 段位 / 称号 */
function tierOf(){
  const songs=S.stats.songs||0;
  const per=[0,8,20,40,70,110];
  let i=0; for(let k=0;k<per.length;k++){ if(songs>=per[k]) i=k; }
  const cur=per[i], next=per[Math.min(i+1,per.length-1)];
  const pct = i>=per.length-1 ? 100 : Math.min(100, Math.round((songs-cur)/Math.max(1,next-cur)*100));
  return { i, name:TITLES[i], next:TITLES[Math.min(i+1,TITLES.length-1)], pct, cur, nextNeed:next };
}

/* ---------------- 首页 ---------------- */
VIEWS.home = {
  html(){
    const t=TYPE_META[S.selType];
    return `
    <div class="scroll">
      <div class="hero">
        <div class="moon"></div>
        <h1 class="serif">飞花音</h1>
        <div class="sub">以歌为令 · 以字会友</div>
        <div class="punch">选一个飞花令类型，AI 帮你匹配在线玩家、自动出题并当裁判。${S.turnSec} 秒接一句带这个字的歌（可在「我的」里调）。</div>
      </div>

      <div class="sec-title">快速开局 <span class="muted" style="font-size:11px;font-weight:400">点击即开局，无需再选配置</span></div>
      <div class="presets">
        ${Object.entries(PRESETS).map(([k,p])=>`
          <div class="presetcard ${k==='joyful'?'joy':k==='hardcore'?'hard':''}" data-preset="${k}">
            <div class="seal">${p.name[0]}</div>
            <div class="grow"><b>${p.name}档 · ${TYPE_META[p.type].name.replace('飞花令','')}×${GAMEPLAYS[p.play].name.split('（')[0]}</b><p>${p.desc}</p></div>
            <div class="go">开局 →</div>
          </div>`).join('')}
      </div>

      <div class="sec-title">选择飞花令类型 <span class="tag red">必选</span></div>
      <div class="typelist" id="typelist">
        ${Object.entries(TYPE_META).map(([k,m])=>`
          <div class="typerow ${S.selType===k?'active':''}" data-type="${k}">
            <div class="lv serif">${m.icon}</div>
            <div class="tx"><b>${m.name} <span class="tag">${m.lv}</span></b><p>${m.desc}</p></div>
            <div class="ok">✓</div>
          </div>`).join('')}
      </div>

      <div class="sec-title">曲库偏好 <span class="muted" style="font-size:11px;font-weight:400">可选 · 默认不限</span></div>
      <div class="prefbox">
        <div class="prefhead" id="prefhead">
          <div><b class="serif">缩小范围</b><div class="muted" style="font-size:11px;margin-top:3px">语种 / 年代 / 曲风 / 歌手专场</div></div>
          <span id="prefarrow" style="font-size:18px">${S.prefsOpen?'▾':'▸'}</span>
        </div>
        <div class="prefbody" id="prefbody" style="${S.prefsOpen?'':'display:none'}">
          ${Object.entries(LIB_PREFS).map(([g,arr])=>{
            const lv={lang:'语种',era:'年代',genre:'曲风',singer:'歌手'}[g];
            return `<div class="prefrow"><div class="lb">${lv}</div><div class="chips">
              ${arr.map(x=>`<button class="chip jade ${S.prefs[g].includes(x)?'active':''}" data-pref="${g}" data-val="${x}">${x}</button>`).join('')}
            </div></div>`;
          }).join('')}
          <div class="pill-note">AI 会据此从对应曲库出题（勾粤语即从粤语歌出字），并优先匹配口味相近者。不强制、不影响开局。</div>
        </div>
      </div>

      <div class="startbar">
        <button class="btn btn-primary btn-lg" id="goRandom">在线随机组队</button>
        <button class="btn btn-ghost btn-lg" id="goHost">私下开房</button>
      </div>

      <div class="sec-title">发现</div>
      <div class="quickgrid">
        <div class="qcard" data-go="duelSetup"><div class="ic serif">人</div><b>人机练习</b><span>1v1 陪练 · 选人设 · 凑不齐也能玩</span></div>
        <div class="qcard" data-go="db"><div class="ic serif">库</div><b>字·飞花总库</b><span>看这个字所有留档答案，跟唱评论</span></div>
        <div class="qcard" data-go="rank"><div class="ic serif">榜</div><b>热门排行榜</b><span>按参与人数、接歌条数排序</span></div>
        <div class="qcard" data-go="community"><div class="ic serif">社</div><b>歌友社群</b><span>约战、长期歌友、称号进阶</span></div>
      </div>

      <div class="pill-note" style="margin-top:16px">当前落地形态：全民K歌歌房内轻玩法 · 「一起听」与语音条已接入<b>真实原唱片段</b>（官方音乐库 30 秒试听，共 25 首）；无版权片段的歌曲自动回退合成试听。生产环境接入 TME / QQ 音乐正版曲库后即可全曲播放。</div>
    </div>
    ${S.view==='home'?'':''}`;
  },
  mount(){
    $$('#typelist .typerow').forEach(el=>el.onclick=()=>{ S.selType=el.dataset.type; render(); });
    $('#prefhead').onclick=()=>{ S.prefsOpen=!S.prefsOpen; render(); };
    $$('[data-pref]').forEach(el=>el.onclick=()=>{
      const g=el.dataset.pref,v=el.dataset.val,arr=S.prefs[g];
      const i=arr.indexOf(v); i<0?arr.push(v):arr.splice(i,1); render();
    });
    $$('[data-preset]').forEach(el=>el.onclick=()=>{
      const p=PRESETS[el.dataset.preset];
      S.selType=p.type; S.roomPlay=p.play; maybePlay=p.play;
      Voice.beep(1046,.09,'triangle');
      toast(`「${p.name}」档开局：${TYPE_META[p.type].name} · ${GAMEPLAYS[p.play].name}`);
      startMatch('random');
    });
    const on=(id,fn)=>{ const el=$(id); if(el) el.onclick=fn; };
    on('#goRandom',()=>startMatch('random'));
    on('#goHost',()=>go('create'));
    $$('[data-go]').forEach(el=>el.onclick=()=>go(el.dataset.go));
  }
};
let maybePlay=null;

/* ---------------- 在线随机组队：AI 匹配分房 ---------------- */
function startMatch(kind){
  S.mode = kind === 'random' ? 'random' : 'host';
  go('match');
}
VIEWS.match = {
  html(){ return `
    <div class="matchstage">
      <div class="ring" id="matchring">
        <div class="radar"></div><div class="radar"></div><div class="radar"></div>
        <div class="matchcenter serif">令</div>
      </div>
      <div class="center">
        <h3 class="serif" style="font-size:18px" id="matchmsg">AI 正在匹配在线玩家…</h3>
        <p class="muted" style="font-size:12.5px;margin-top:8px" id="matchsub">每房最佳 4 人 · 3–6 人弹性</p>
      </div>
    </div>
    <div style="padding:0 20px 30px"><button class="btn btn-ghost btn-block" id="matchBack">取消匹配</button></div>`; },
  mount(){
    clearInterval(matchIv); clearTimeout(matchT); matchIv=null; matchT=null;
    const ring=$('#matchring');
    const fillers=[];
    let n=0;
    const names=[...NPC_NAMES].sort(()=>Math.random()-.5);
    matchIv=setInterval(()=>{
      if(n>=3) return;
      const ang=n*120+rnd([-8,8]);
      const r=82;
      const x=98+r*Math.cos((ang-90)*Math.PI/180)-28;
      const y=98+r*Math.sin((ang-90)*Math.PI/180)-28;
      const p=makeNpc(names[n],n);
      fillers.push(p);
      const d=document.createElement('div');
      d.className='orb'; d.style.left=x+'px'; d.style.top=y+'px';
      d.style.background=`linear-gradient(150deg,${p.color},${shade(p.color,-22)})`;
      d.textContent=p.initial;
      ring.appendChild(d);
      n++;
      const mm=$('#matchmsg'); if(mm) mm.textContent = ['已找到 '+n+' 位歌友…','正在凑齐 4 人…','NPC 补位中…'][Math.min(n-1,2)];
    },700);
    matchT=setTimeout(()=>{
      clearInterval(matchIv); clearTimeout(matchT); matchIv=null; matchT=null;
      const mm=$('#matchmsg'); if(mm) mm.textContent='匹配成功！';
      const ms=$('#matchsub'); if(ms) ms.textContent='正在分配房间…';
      // 组队：我 + 3 个 NPC（最后一个可能换成真人感名字）
      const roster=[{...ME,score:0,passes:0,streak:0}];
      for(let i=0;i<3;i++){ const p=makeNpc(names[i]||('歌友'+i),i); roster.push(p); }
      const word = pickWord(S.selType);
      S.room = newRoom(S.selType, word, S.mode, roster, maybePlay);
      maybePlay=null;
      go('dealGame');
    }, 2500);
    $('#matchBack').onclick=()=>{ clearInterval(matchIv); clearTimeout(matchT); matchIv=null; matchT=null; go('home'); };
  }
};

/* 给一句歌词打分：越可能在试听片段里唱到令字，分越高 */
function scoreLine(e, word){
  if(!e || !e.s) return -1;
  let sc = 0;
  const hasClip = !!musicOf(e.s);
  if(hasClip) sc += 4; else sc -= 6;              /* 没有版权片段直接压到底 */
  const lyric = (e.l||'').replace(/\s/g,'');
  const title = (e.s||'').replace(/[（(].*?[)）]/g,'').trim();
  const titleKey = title.replace(/\s/g,'');
  if(title.includes(word)) sc += 4;               /* 歌名含令字：副歌极可能唱到 */
  if(titleKey && lyric.includes(titleKey)) sc += 3; /* 歌词里就是歌名 = 副歌 hook */
  if((e.l||'').includes(word)) sc += 2;            /* 歌词含令字 */
  if((e.hit||'').includes(word)) sc += 2;
  return sc;
}
/* 为某个令字挑一句：取分数最高的若干条里随机 */
function pickLineFor(word, usedLyrics){
  const all=(BANK[word]||[]).slice();
  if(!all.length) return null;
  /* 第一优先：只从「有版权片段」的歌里选，绝不退回纯音乐 */
  const withClip=all.filter(e=>musicOf(e.s));
  const base = withClip.length ? withClip : all;
  let pool = base;
  /* 第二优先：本局没唱过的歌词，减少同句折叠 */
  if(usedLyrics && usedLyrics.length){
    const used=new Set(usedLyrics);
    const fresh=base.filter(e=>!used.has(e.l));
    if(fresh.length) pool=fresh;
  }
  /* 第三优先：取分数最高的若干条（歌名含令字 / 歌词即歌名 hook） */
  const scored=pool.map(e=>({e, s:scoreLine(e, word)}));
  const max=Math.max.apply(null, scored.map(x=>x.s));
  return rnd(scored.filter(x=>x.s===max).map(x=>x.e));
}
function pickWord(type){ const pool=WORD_POOL[type]; return rnd(pool); }
function prefSummary(){ const o=[]; ['lang','era','genre','singer'].forEach(g=>{ if(S.prefs[g]&&S.prefs[g].length) o.push(S.prefs[g].join('/')); }); return o.join(' · '); }
function newRoom(type,word,mode,players,play){
  const pl=play||'standard';
  const room={ type, word, mode, play:pl,
    players, turn:0, round:1, max:3,
    feed:[], playlist:[], bombs:{},
    log:[], over:false, awaiting:false, banned:null, npcTimer:null, tick:0, abandoned:false };
  if(pl==='bomb'){ const bank=BANK[word]||[]; players.forEach((p,i)=>{ const e=bank[(i+1)%Math.max(1,bank.length)]||{s:'月亮之上'}; room.bombs[p.id]=e.s; }); }
  if(pl==='ban'){ const pool=['的','我','你','是','不','了','一']; room.banned=rnd(pool); }
  return room;
}

/* ============================================================
   AI 出题官 —— 发牌机（视觉参考：卡牌扇开 + 指针选牌，视频 3a69）
   ============================================================ */
VIEWS.dealGame = {
  html(){
    const t=TYPE_META[S.selType];
    return `
    <div class="dealstage">
      <div class="halo"></div>
      <div class="pointer" id="pointer" style="opacity:0"></div>
      <div class="fandeck" id="fandeck"></div>
    </div>
    <div class="dealbtm">
      <h3 id="dealtitle">AI 出题官 · 正在洗牌</h3>
      <p id="dealsub">${t.name} · ${S.mode==='host'?'房主自由出题':'AI 依曲库偏好随机出题'}</p>
    </div>`;
  },
  mount(){ dealSequence(); }
};

function cardFaceHTML(){
  return `<div class="face"><div class="core"></div></div>`;
}
let dealToken=0;
async function dealSequence(){
  const my=++dealToken;
  const alive=()=>my===dealToken && S.view==='dealGame';
  const deck=$('#fandeck'); if(!deck) return;
  const title=$('#dealtitle'), sub=$('#dealsub'), pointer=$('#pointer');
  const N=9, spread=15;
  const base=[]; for(let i=0;i<N;i++) base.push((i-(N-1)/2)*spread);
  deck.innerHTML='';
  const cards=[];
  for(let i=0;i<N;i++){
    const c=document.createElement('div');
    c.className='pcard'; c.innerHTML=cardFaceHTML();
    c.style.transform='rotate(0deg)';
    deck.appendChild(c); cards.push(c);
  }
  await sleep(520);
  if(!alive()) return;
  title.textContent='AI 出题官 · 正在发牌';
  sub.textContent='按住呼吸，牌要开了…';
  // 1) 扇开
  cards.forEach((c,i)=>{ c.style.transitionDuration='.72s'; c.style.transitionDelay=(i*26)+'ms'; c.style.transform=`rotate(${base[i]}deg)`; });
  await sleep(1050);
  if(!alive()) return;
  // 2) 抖牌（洗牌感）
  deck.style.transition='transform .28s ease';
  deck.style.transform='rotate(4deg)'; await sleep(240);
  deck.style.transform='rotate(-3deg)'; await sleep(220);
  deck.style.transform='rotate(0deg)'; await sleep(220);
  // 3) 指针落下
  pointer.style.transition='opacity .3s, transform .3s';
  pointer.style.opacity=1;
  pointer.style.transform='translateX(-50%) translateY(6px)';
  await sleep(340);
  if(!alive()) return;
  // 4) 选中：base 最接近 0 的那张（正好在指针正下方）
  let chosen=0,best=1e9;
  base.forEach((b,i)=>{ const d=Math.abs(((b%360)+360)%360); const dd=Math.min(d,360-d); if(dd<best){best=dd;chosen=i;} });
  cards.forEach((c,i)=>{ c.style.transitionDelay='0ms'; });
  cards[chosen].classList.add('chosen');
  // 先摇摆，再翻出
  title.textContent='就是这一张！';
  for(let k=0;k<2;k++){ cards[chosen].style.transform=`rotate(${base[chosen]+ (k?4:-4)}deg) scale(1.06)`; await sleep(150); }
  cards[chosen].style.transition='transform .6s cubic-bezier(.2,.9,.3,1.1)';
  cards[chosen].style.transform=`rotate(${base[chosen]}deg) translateY(-16px) scale(1.22)`;
  await sleep(620);
  if(!alive()) return;
  // 其余牌淡出
  cards.forEach((c,i)=>{ if(i!==chosen){ c.style.transition='transform .5s, opacity .5s'; c.style.opacity=0; c.style.transform=`rotate(${base[i]*1.5}deg) translateY(30px) scale(.9)`; } });
  // 翻面
  cards[chosen].style.transition='transform .55s ease, box-shadow .4s';
  cards[chosen].style.transform=`rotate(${base[chosen]}deg) translateY(-16px) scale(1.22) rotateY(180deg)`;
  await sleep(650);
  if(!alive()) return;
  // 出结果
  const word = S.mode==='host' ? (S.hostPickWord||pickWord(S.selType)) : pickWord(S.selType);
  if(!alive()) return;
  S.deal={word,type:S.selType};
  go('reveal');
}

VIEWS.reveal = {
  html(){
    if(!S.deal||!S.deal.word) S.deal={word:pickWord(S.selType),type:S.selType};
    const w=S.deal.word, t=TYPE_META[S.deal.type];
    return `
    <div class="revealwrap">
      <div class="bg" style="background-image:url('${bgFor(w)}')"></div>
      <div class="veil"></div>
      <div class="revealword serif">${esc(w)}</div>
      <div class="revealmeta">
        <div class="typ">${t.lv} · ${t.name}</div>
        <div class="desc">${t.desc}</div>
      </div>
    </div>
    <div style="padding:14px 20px 26px;background:linear-gradient(180deg,rgba(20,18,16,.0),#141210)">
      <div class="between" style="margin-bottom:12px;color:#C9BFAA;font-size:12px">
        <span>本局玩法：${GAMEPLAYS[S.roomPlay||'standard'].name}</span>
        <span>每回合 ${S.turnSec} 秒</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="enterRoom">进入房间 · 开始接歌</button>
    </div>`;
  },
  mount(){
    const r=S.room;
    $('#enterRoom').onclick=()=>{
      S.room = newRoom(S.selType, S.deal.word, S.mode, r?r.players:defaultRoster(), r?r.play:'standard');
      S.room.feed=[]; S.room.playlist=[];
      go('room');
    };
  }
};
function defaultRoster(){ const r=[{...ME,score:0,passes:0,streak:0}]; for(let i=0;i<3;i++) r.push(makeNpc(NPC_NAMES[i],i)); return r; }

/* ============================================================
   私下开房 · 选题卡（视觉参考：cover-flow 横向卡牌，视频 a9946）
   ============================================================ */
VIEWS.create = {
  html(){
    const pool=WORD_POOL[S.selType];
    return `
    <div class="topbar">
      <button class="iconbtn" id="cBack">‹</button>
      <b class="serif">私下开房 · 选题目</b>
      <span class="muted" style="font-size:11px">房主自由出题</span>
    </div>
    <div class="cfstage">
      <div class="title">左右滑动 / 点两侧卡片切换<small>${TYPE_META[S.selType].name} · ${TYPE_META[S.selType].lv}</small></div>
      <div class="cftrack" id="cftrack"></div>
      <div class="cfctrl">
        <h3 class="serif" id="cfword">${pool[0]}</h3>
        <p id="cfdesc">${TYPE_META[S.selType].desc}</p>
        <div class="cfnav">
          <button id="cfPrev">‹</button>
          <button class="btn btn-ghost" id="cfRefresh" style="border-radius:999px;font-size:13px;padding:10px 16px">换一换</button>
          <button id="cfNext">›</button>
        </div>
        <div class="cfdots" id="cfdots"></div>
      </div>
    </div>
    <div class="darkbar" style="padding:12px 20px 24px">
      <div class="chips" style="margin-bottom:12px" id="cfplays">
        ${Object.entries(GAMEPLAYS).filter(([k])=>k!=='tail').map(([k,g])=>`<button class="chip ${S.roomPlay===k?'active':''}" data-play="${k}">${g.name}</button>`).join('')}
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="cfConfirm">确认出题 · 邀请好友</button>
    </div>`;
  },
  mount(){
    const track=$('#cftrack'), dots=$('#cfdots');
    const pool=WORD_POOL[S.selType];
    if(S.cfIndex>=pool.length) S.cfIndex=0;
    function paint(){
      track.innerHTML='';
      const n=pool.length;
      for(let off=-2;off<=2;off++){
        const i=((S.cfIndex+off)%n+n)%n;
        const w=pool[i];
        const cls = off===0?'center':off===-1?'l1':off===-2?'l2':off===1?'r1':'r2';
        const d=document.createElement('div');
        d.className='cfcard '+cls;
        d.innerHTML=`<div class="bg" style="background-image:url('${bgFor(w)}')"></div><div class="veil"></div>`;
        d.onclick=()=>{ if(off!==0){ S.cfIndex=i; paint(); } };
        track.appendChild(d);
      }
      dots.innerHTML=pool.map((_,i)=>`<i class="${i===S.cfIndex?'on':''}"></i>`).join('');
      $('#cfword').textContent=pool[S.cfIndex];
    }
    paint();
    $('#cfPrev').onclick=()=>{ S.cfIndex=(S.cfIndex-1+pool.length)%pool.length; paint(); };
    $('#cfNext').onclick=()=>{ S.cfIndex=(S.cfIndex+1)%pool.length; paint(); };
    $('#cfRefresh').onclick=()=>{ S.cfIndex=rint(0,pool.length-1); paint(); toast('已为你换一个题目建议'); };
    $('#cBack').onclick=()=>go('home');
    $$('#cfplays .chip').forEach(el=>el.onclick=()=>{ S.roomPlay=el.dataset.play; render(); });
    $('#cfConfirm').onclick=()=>{
      S.hostPickWord = pool[S.cfIndex];
      S.mode='host';
      S.room = newRoom(S.selType, S.hostPickWord, 'host', defaultRoster(), S.roomPlay||'standard');
      go('hostLobby');
    };
  }
};

/* 私房大厅：拉人 */
VIEWS.hostLobby = {
  html(){
    if(!S.room) S.room=newRoom(S.selType,pickWord(S.selType),'host',defaultRoster(),S.roomPlay||'standard');
    const r=S.room;
    const joined=r.players.length;
    return `
    <div class="topbar"><button class="iconbtn" onclick="back()">‹</button><b class="serif">我的歌房</b><span class="muted" style="font-size:11px">${TYPE_META[S.selType].name}</span></div>
    <div class="scroll">
      ${inkboard(r.word,'房主出题 · '+GAMEPLAYS[r.play].name)}
      <div class="sec-title">已加入 ${joined}/6</div>
      <div class="card">
        <div class="row wrap" style="gap:14px">
          ${r.players.map(p=>`<div class="row" style="gap:8px">${av(p)}<div><b class="serif" style="font-size:13px">${esc(p.name)}</b><div class="muted" style="font-size:10.5px">${p.isNpc?'AI 歌友':'房主 · 我'}</div></div></div>`).join('')}
        </div>
      </div>
      <div class="sec-title">邀请好友</div>
      <div class="card center">
        <div class="qr" style="margin:0 auto 10px;width:150px;height:150px"><canvas id="qr" width="140" height="140"></canvas></div>
        <p class="muted" style="font-size:12px;margin:0">扫码进房 · 或复制链接发给好友</p>
        <div class="row" style="gap:8px;margin-top:12px">
          <button class="btn btn-soft grow" id="copyLink">复制链接</button>
          <button class="btn btn-jade grow" id="inviteNpc">让 AI 补位</button>
        </div>
      </div>
      <div class="pill-note">人少也没关系：匹配等待 30–60 秒后，仍不够由 AI NPC 补位到至少 3 人先开局，不让人干等。</div>
    </div>
    <div style="padding:12px 20px 24px"><button class="btn btn-primary btn-block btn-lg" id="hostStart">${joined>=3?'开始游戏':'不足 3 人，AI 补位后开局'}</button></div>`;
  },
  mount(){
    drawQR($('#qr'));
    $('#copyLink').onclick=()=>toast('房号 FHY-328 链接已复制，快发到群里吧～');
    $('#inviteNpc').onclick=()=>{
      const r=S.room;
      if(r.players.length>=6){ toast('房间已满（6 人）'); return; }
      const p=makeNpc(NPC_NAMES[r.players.length%NPC_NAMES.length]+rint(1,9),r.players.length);
      r.players.push(p); render(); toast(`${p.name} 已加入歌房`);
    };
    $('#hostStart').onclick=()=>{
      const r=S.room;
      while(r.players.length<3){ const p=makeNpc(NPC_NAMES[r.players.length%NPC_NAMES.length]+rint(1,9),r.players.length); r.players.push(p); }
      go('room');
    };
  }
};
function drawQR(cv){
  if(!cv) return; const x=cv.getContext('2d'); const n=21,s=cv.width/n;
  x.fillStyle='#fff'; x.fillRect(0,0,cv.width,cv.height);
  x.fillStyle='#1b1a16';
  const m=(i,j)=>{ let h=(i*73856093)^(j*19349663)^(Math.floor(S.seed)); h=Math.abs(h); return (h%3)!==0; };
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){ if(m(i,j)) x.fillRect(i*s,j*s,Math.ceil(s),Math.ceil(s)); }
  // 定位角
  [[0,0],[n-7,0],[0,n-7]].forEach(([i,j])=>{
    x.fillStyle='#fff'; x.fillRect(i*s,j*s,7*s,7*s);
    x.fillStyle='#1b1a16'; x.fillRect(i*s,j*s,7*s,7*s);
    x.fillStyle='#fff'; x.fillRect((i+1)*s,(j+1)*s,5*s,5*s);
    x.fillStyle='#1b1a16'; x.fillRect((i+2)*s,(j+2)*s,3*s,3*s);
  });
}

/* ============================================================
   实时房间 · 8 秒回合 + AI 语义裁判 + 三层交互
   ============================================================ */
VIEWS.room = {
  html(){
    if(!S.room) S.room=newRoom(S.selType,pickWord(S.selType),'random',defaultRoster(),'standard');
    const r=S.room, cur=r.players[r.turn];
    const turnName = cur.isNpc? esc(cur.name) : '你';
    return `
    <div class="topbar">
      <button class="iconbtn" id="leaveRoom">‹</button>
      <b class="serif">实时房间 · FHY-328</b>
      <button class="iconbtn" id="openSkills" style="width:auto;padding:0 10px;font-size:12px">道具</button>
    </div>
    <div class="roomtop">
      <div class="between">
        <div><div class="muted" style="font-size:11px">本局令字 · ${TYPE_META[r.type].lv}</div><div class="word serif">${esc(r.word)}</div></div>
        <div style="text-align:right">
          <div class="muted" style="font-size:11px">第 ${Math.min(r.round,r.max)} / ${r.max} 轮</div>
          <div class="serif" style="font-size:15px;color:var(--jade)">${GAMEPLAYS[r.play].name}</div>
        </div>
      </div>
      ${r.banned?`<div class="pill-note" style="margin-top:8px">⚠ 禁字玩法：谁唱出「${esc(r.banned)}」谁出局</div>`:''}
      ${r.play==='bomb'?`<div class="pill-note" style="margin-top:8px">💣 炸弹歌：各人已秘密设一首含「${esc(r.word)}」的歌，唱到别人的炸弹就引爆</div>`:''}
    </div>
    <div class="playertabs" id="ptabs">
      ${r.players.map((p,i)=>`<div class="ptab ${i===r.turn?'turn':''}" data-p="${i}">${av(p,'sm')}<span>${esc(p.name)}</span><span class="sc">${p.score}</span></div>`).join('')}
    </div>
    <div class="feed" id="feed"></div>
    <div class="recbar" id="recbar"></div>
    <div class="fxboom" id="fxboom"><div class="danmu" id="danmu"></div></div>`;
  },
  mount(){
    $('#leaveRoom').onclick=()=>{ if(S.room.npcTimer) clearTimeout(S.room.npcTimer); go('home'); };
    $('#openSkills').onclick=openSkillSheet;
    renderFeed(); renderRecBar();
    if(!S.room.started){ S.room.started=true;
      S.room.feed.push({ sys:true, text:`令字「${S.room.word}」· ${TYPE_META[S.room.type].name} · ${GAMEPLAYS[S.room.play].name}，第一回合开始` });
      renderFeed(); startTurn();
    }
  }
};

function meIdx(){ return S.room.players.findIndex(p=>p.id==='me'); }
function curPlayer(){ return S.room.players[S.room.turn]; }

function renderFeed(){
  const feed=$('#feed'); if(!feed) return;
  feed.innerHTML = S.room.feed.map(e=>feedHTML(e)).join('') + `<div id="feedend" style="height:4px"></div>`;
  $$('.reply-toggle',feed).forEach(el=>el.onclick=()=>{ el.nextElementSibling.classList.toggle('open'); });
  $$('.playbtn',feed).forEach(el=>el.onclick=()=>playVoice(el, +el.dataset.voice));
  $$('.listen',feed).forEach(el=>el.onclick=()=>listenSong(el, el.dataset.song, el.dataset.artist));
  $$('.emobtn',feed).forEach(el=>el.onclick=()=>react(+el.dataset.idx, el.textContent));
  $$('.foldtag',feed).forEach(el=>el.onclick=()=>toast('同句已飞书式归并，不刷屏'));
  feed.scrollTop=feed.scrollHeight;
}
/* 通用：试听一段文字（AI 念出识别到的歌词） */
async function playVoiceText(btn, text, song, artist, audioUrl){
  if(audioUrl) return playClip(btn, audioUrl, '我的录音', '接歌原声');
  const row=btn.closest('.voicerow'), w=row?row.querySelector('.wave'):null;
  if(btn.classList.contains('on')){ stopAllAudio(); btn.classList.remove('on'); btn.textContent='▶'; if(w) w.classList.remove('playing'); return; }
  btn.classList.add('on'); btn.textContent='❚❚'; if(w) w.classList.add('playing');
  Voice.beep(720,.07,'sine',.05);
  const found = song?{s:song,a:artist}:songForLyric(text);
  let ok=false;
  if(found&&found.s) ok = await playReal(found.s, found.a, S.clipSec||20);
  if(!ok) await playMelodyOnly((found&&found.s)||'未收录曲目', 6);
  btn.classList.remove('on'); btn.textContent='▶'; if(w) w.classList.remove('playing');
}
async function playVoice(btn, idx){
  const e=(S.room&&S.room.feed[idx])||SEED_DB[idx];
  if(!e) return;
  if(e.audioUrl) return playClip(btn, e.audioUrl, '我的录音', e.song&&e.song!=='—'? ('接歌 · '+e.song) : '接歌原声');
  return playVoiceText(btn, e.lyric, e.song, e.artist);
}
/* 播放玩家自己的真实录音（或其它 Blob 音频） */
async function playClip(btn, url, title, sub){
  const row = btn && btn.closest ? btn.closest('.voicerow') : null;
  const w = row ? row.querySelector('.wave') : null;
  const a=getAudio();
  if(btn && btn.classList.contains('on')){ stopAllAudio(); btn.classList.remove('on'); btn.textContent='▶'; if(w) w.classList.remove('playing'); return; }
  Voice.cancel();
  if(btn){ btn.classList.add('on'); btn.textContent='❚❚'; }
  if(w) w.classList.add('playing');
  nowPlaying={song:title, artist:sub, kind:'voice'};
  a.pause(); a.src=url; a.currentTime=0;
  paintPlayerBar({song:title, artist:sub, playing:true, kind:'voice'});
  clearInterval(playerTimer); playerTimer=setInterval(tickPlayer,300);
  try{ await a.play(); }catch(err){}
  await new Promise(r=>{ let done=false; const h=()=>{ if(done) return; done=true; a.removeEventListener('ended',h); a.removeEventListener('error',h); r(); }; a.addEventListener('ended',h); a.addEventListener('error',h); });
  if(btn){ btn.classList.remove('on'); btn.textContent='▶'; }
  if(w) w.classList.remove('playing');
}
/* 一起听原唱副歌（合成旋律 + 报歌名） */
async function listenSong(el, song, artist){
  if(el.classList.contains('playing')){ el.classList.remove('playing'); el.textContent='一起听'; stopAllAudio(); return; }
  el.classList.add('playing'); el.textContent='聆听中…';
  const ok = await playReal(song, artist);
  if(ok){ toast(`正在一起听《${song}》原唱片段`); }
  else { toast(`《${song}》暂无版权片段，改用合成试听`); await synthListen(song, null, artist); }
  el.classList.remove('playing'); el.textContent='一起听';
}
/* 由歌词反查歌曲（用于数据库 / 人机练习里的语音条） */
function songForLyric(text){
  if(!text) return null;
  for(const k in BANK){ const e=BANK[k].find(x=>x.l===text); if(e&&e.s&&e.s!=='—') return {s:e.s,a:e.a}; }
  return null;
}
function react(idx,em){
  const e=S.room.feed[idx]; if(!e) return;
  e.replies=e.replies||[];
  if(e.replies.length && e.replies[e.replies.length-1].who==='我' && e.replies[e.replies.length-1].em===em){ return; }
  e.replies.push({who:'我',txt:'',em});
  renderFeed(); toast('已发表情回应');
}
function hl(lyric,hit,m){
  if(!hit) return esc(lyric);
  if(hit.includes('/')) return esc(lyric)+` <span class="tag jade">AI 语义</span>`;
  const i=lyric.indexOf(hit);
  if(i<0) return esc(lyric);
  return esc(lyric.slice(0,i))+`<span class="k">${esc(hit)}</span>`+esc(lyric.slice(i+hit.length));
}
function feedHTML(e){
  if(e.sys) return `<div style="text-align:center;margin:10px 0 14px"><span class="tag" style="background:var(--paper-3);color:var(--ink-3);padding:4px 12px">${esc(e.text)}</span></div>`;
  const idx=S.room.feed.indexOf(e);
  const folds = (e.folded&&e.folded.length)?`<div class="folded">${e.folded.map(f=>`<div class="fitem">${av({color:f.color,initial:f.initial,name:f.who},'sm')}<span class="who">${esc(f.who)}</span><span>跟唱了同一句</span></div>`).join('')}</div>`:'';
  const replies=(e.replies&&e.replies.length)?`
    <div class="replies">
      <span class="reply-toggle">💬 ${e.replies.length} 条回应 ▾</span>
      <div class="reply-list">${e.replies.map(r=>`<div class="reply"><b>${esc(r.who)}</b> ${r.em?`<span class="em">${r.em}</span>`:''}${esc(r.txt)}</div>`).join('')}</div>
    </div>`:'';
  return `
  <div class="msg ${e.pid==='me'?'self':''}">
    ${av({color:e.color,initial:e.initial,name:e.name}, e.ink?'inkblot':'')}
    <div class="body">
      <div class="head"><b>${esc(e.name)}</b>${e.isNpc?'<span class="tag">AI</span>':''}${e.ok?'<span class="tag jade">判定通过</span>':'<span class="tag red">判定失败</span>'}<span>${e.time||''}</span></div>
      <div class="bubble">
        <div class="lyric">${e.ok?hl(e.lyric,e.hit,e.m):esc(e.lyric)}</div>
        <div class="voicerow"><button class="playbtn" data-voice="${idx}" title="试听这句（优先播放原唱片段）">▶</button>${waveHTML()}${''}<span class="dur">${e.audioUrl?fmtSec(e.audioDur):(musicOf(e.song)?'0:30':(e.dur||durText()))}</span><span class="vt">${e.audioUrl?'我的录音':(musicOf(e.song)?'原唱片段':'合成试听')}</span></div>
        ${e.ok?`<div class="songline"><span>AI 识歌：</span><span class="song">《${esc(e.song)}》</span><span>· ${esc(e.artist||'未知')}</span><button class="listen" data-song="${esc(e.song)}" data-artist="${esc(e.artist||"")}">一起听</button>${e.caption?`<span class="tag">${esc(e.caption)}</span>`:''}</div>`
              :`<div class="songline bad">✗ ${esc(e.reason||'判定未通过')} ${e.clue?`· 提示：${esc(e.clue)}`:''}</div>`}
        <div class="meta-row">
          <span class="mi">👍 ${e.likes||0}</span>
          <span class="mi">🎤 跟唱 ${e.folded?e.folded.length:0}</span>
          <span class="mi emobtn" data-idx="${idx}">😀</span>
          <span class="mi emobtn" data-idx="${idx}">🔥</span>
          <span class="mi emobtn" data-idx="${idx}">👏</span>
        </div>
      </div>
      ${folds}
      ${replies}
    </div>
  </div>`;
}


/* ---------------- 回合引擎 ---------------- */
async function startTurn(){
  const r=S.room; if(!r||r.over) return;
  r.awaiting=false; turnDone=false; r.thinking=false;
  renderTabs();
  const p=curPlayer();
  const alive=()=>S.room===r && !r.over && !r.abandoned && curPlayer()===p;
  if(p.id==='me'){
    r.thinking = !isAudioIdle();                 /* 规则：上一位的歌没放完，下一位不能开口 */
    renderTabs(); renderRecBar();
    if(r.thinking){
      await waitAudioIdle();
      if(!alive()) return;
      r.thinking=false; renderTabs(); renderRecBar();
    }
    startTimer();
  } else {
    r.thinking=true; renderTabs(); renderRecBar();
    await waitAudioIdle();                       /* ① 一定要等上一位把音乐放完 */
    if(!alive()) return;
    const gap=rint(5000,10000);                  /* ② 再间隔 5~10 秒才开口 */
    r.npcTimer=setTimeout(()=>{ r.thinking=false; if(alive()) npcSing(p); }, gap);
  }
}
function renderTabs(){
  const t=$('#ptabs'); if(!t) return;
  t.innerHTML=S.room.players.map((p,i)=>{
    const cur=i===S.room.turn, think=cur&&S.room.thinking&&p.isNpc;
    return `<div class="ptab ${cur?'turn':''}">${av(p,'sm')}<span>${esc(p.name)}</span><span class="sc">${think?'…':p.score}</span></div>`;
  }).join('');
}
/* NPC 的“思考”已并入 startTurn：等上一位放完 + 随机 5~10 秒 */
function npcSing(p){
  const r=S.room;
  const bank=BANK[r.word]||[];
  let ok = Math.random()<0.86;   /* NPC 也会偶尔接错，但以唱对为主 */
  let lyric, song, artist, hit, m='literal', reason='';
  if(ok && bank.length){
    const used=r.feed.filter(x=>!x.sys).map(x=>x.lyric);
    const e=pickLineFor(r.word, used)||rnd(bank); lyric=e.l; song=e.s; artist=e.a; hit=e.hit; m=e.m;
  } else if(!ok){
    /* 唱错也要挑「有版权片段」的歌，绝不退回纯旋律 */
    const other=Object.keys(BANK).filter(k=>k!==r.word);
    const pool=[];
    other.forEach(k=>(BANK[k]||[]).forEach(e=>{ if(musicOf(e.s)) pool.push(e); }));
    const oe = pool.length? rnd(pool) : rnd(BANK[rnd(other)]);
    lyric=oe.l; song=oe.s; artist=oe.a; hit=oe.hit;
    reason = `歌词不含「${r.word}」`;
  } else { const e=pickLineFor(r.word)||rnd(bank); lyric=e.l;song=e.s;artist=e.a;hit=e.hit;m=e.m; }
  // 禁字/炸弹判定
  if(r.banned && lyric.includes(r.banned)){ ok=false; reason=`唱出了禁字「${r.banned}」`; }
  if(r.play==='bomb' && ok){
    const hitBomb=r.players.find(q=>q.id!==p.id && r.bombs[q.id]===song);
    if(hitBomb){ ok=false; reason=`踩中「${hitBomb.name}」的炸弹歌《${song}》，炸弹引爆`; bombFx(hitBomb.name); }
  }
  addEntry(p, {lyric,song,artist,hit,m,ok,reason, caption:m==='semantic'?'AI 语义判定':''});
  setTimeout(()=>advance(), ok?700:1500);
}
function advance(){
  const r=S.room; if(r.over) return;
  r.turn=(r.turn+1)%r.players.length;
  if(r.turn===0){ r.round++; if(r.round>r.max){ return settle(); } }
  startTurn().catch(()=>{});
}
function addEntry(p,res){
  const r=S.room;
  const base={ pid:p.id, name:p.name, color:p.color, initial:p.initial, isNpc:p.isNpc,
    lyric:res.lyric, song:res.song, artist:res.artist, hit:res.hit, m:res.m||'literal',
    ok:res.ok, reason:res.reason, clue:res.clue, caption:res.caption, ink:!res.ok,
    audioUrl:res.audioUrl||null, audioDur:res.audioDur||0,
    folded:[], replies:[], likes:0, time:nowTime() };
  if(res.ok){
    p.score += (r.play==='double'?2:1); p.streak=(p.streak||0)+1; p.passes=(p.passes||0)+1;
    if(!r.playlist.find(x=>x.song===res.song)) r.playlist.push({song:res.song,artist:res.artist,by:p.name});
    // 第二层：同句归并
    const same=r.feed.find(e=>e.lyric===res.lyric);
    if(same){ same.folded.push({who:p.name,color:p.color,initial:p.initial}); renderFeed(); if(Voice.on){ if(res.audioUrl) playClip(null,res.audioUrl,'我的录音','接歌原声'); else playAutoSong(res.song); } recordSkill(p); return; }
  } else { p.streak=0; }
  r.feed.push(base); renderFeed(); renderTabs(); recordSkill(p);
  /* 直接放声音：玩家放自己刚录的原声，NPC 放接入的真实音乐片段（不再用 AI 朗读） */
  if(Voice.on && !/^（/.test(res.lyric||'')){
    if(base.audioUrl) playClip(null, base.audioUrl, '我的录音', base.song&&base.song!=='—'?('接歌 · '+base.song):'接歌原声');
    else playAutoSong(base.song); /* 完整 30 秒片段，尽量唱到含令字那一句 */
  }
  if(!res.ok){ inkFx(); }
}
function recordSkill(p){
  if(p.id!=='me') return;
  S.skill.pass++;
  if(S.skill.pass>=3){ S.skill.pass=0; const c=rnd(SKILL_CARDS); S.skill.owned[c.id]=(S.skill.owned[c.id]||0)+1; S.skill.earned.push(c.id); toast(`🎴 累计 3 次通过，获得技能卡：${c.name}`); }
}
function turnSec(){ return S.turnSec||15; }
function nowTime(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }

/* ---------------- 录音 / 计时 ---------------- */
let timerHandle=null, timeLeft=30, recording=false, turnDone=false, micActive=false;
function renderRecBar(){
  const r=S.room, p=curPlayer(), bar=$('#recbar'); if(!bar) return;
  if(r.over) return;
  bar.classList.remove('done');
  const mine=p.id==='me';
  bar.innerHTML=`
    <div class="turnhint">
      <span>当前回合 · <b>${mine?(r.thinking?'上一位还在唱，稍等…':'轮到你唱'):(esc(p.name)+(r.thinking?' 正在想…':' 正在接歌'))}</b></span>
      <span>${GAMEPLAYS[r.play].name} · ${turnSec()} 秒</span>
    </div>
    <div class="recrow">
      ${mine?`
        <div class="timering" id="timering">
          <svg width="64" height="64"><circle cx="32" cy="32" r="27" fill="none" stroke="#E4DACA" stroke-width="6"/>
          <circle id="ringfg" cx="32" cy="32" r="27" fill="none" stroke="#3C6E5D" stroke-width="6" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="0"/></svg>
          <div class="num serif" id="timenum">8</div>
        </div>
        <button class="recbtn" id="recbtn" ${r.thinking?'disabled':''}><span class="holdingwave"><i></i><i></i><i></i><i></i><i></i></span><span id="reclabel">${r.thinking?'上一首还没放完，稍等…':'按住唱这一句'}</span></button>
        <button class="recbtn alt" id="typeBtn" ${r.thinking?'disabled':''} title="手写歌词">✍</button>
      `:`
        <div class="timering"><svg width="64" height="64"><circle cx="32" cy="32" r="27" fill="none" stroke="#E4DACA" stroke-width="6"/></svg><div class="num serif">♪</div></div>
        <button class="recbtn npc" disabled><span id="reclabel">${r.thinking? esc(p.name)+' 正在想…' : esc(p.name)+' 正在接歌…'}</span></button>
      `}
    </div>
    <div style="margin-top:10px"><div class="muted" style="font-size:11px;margin-bottom:8px">技能卡（累计通过 3 次得 1 张）· 当前进度 ${S.skill.pass}/3</div><div class="tray" id="tray"></div></div>`;
  renderTray();
  if(mine && !r.thinking){
    const btn=$('#recbtn');
    btn.addEventListener('pointerdown',e=>{ e.preventDefault(); beginRec(); });
    btn.addEventListener('pointerup',e=>{ e.preventDefault(); endRec(); });
    btn.addEventListener('pointerleave',()=>{ if(recording) endRec(true); });
    $('#typeBtn').onclick=openTypeSheet;
  }
}
function renderTray(){
  const tray=$('#tray'); if(!tray) return;
  const owned=SKILL_CARDS.filter(c=>(S.skill.owned[c.id]||0)>0);
  tray.innerHTML = owned.length? owned.map(c=>`<div class="skill" data-skill="${c.id}"><div class="sy serif">${c.sym}</div><div class="nm">${c.name}</div><div class="ct">×${S.skill.owned[c.id]}</div></div>`).join('')
    : `<div class="muted" style="font-size:11.5px;padding:8px 0">还没有技能卡，认真唱几句就能打出来～</div>`;
  $$('.skill',tray).forEach(el=>el.onclick=()=>useSkill(el.dataset.skill,el));
}
function useSkill(id,el){
  const c=SKILL_CARDS.find(x=>x.id===id);
  if((S.skill.owned[id]||0)<=0) return;
  if(turnDone){ toast('本回合已结束，等下一个回合再用'); return; }
  S.skill.owned[id]--; if(el&&el.classList) el.classList.add('used'); renderTray();
  const r=S.room;
  if(id==='skip'){ const p=curPlayer(); p.score=Math.max(0,p.score-1); toast('跳过卡：本轮跳过，扣 1 分'); addEntry(p,{lyric:'（使用跳过卡，跳过本轮）',song:'—',artist:'',hit:'',ok:false,reason:'使用跳过卡 · 扣 1 分'}); setTimeout(()=>advance(),900); }
  else if(id==='help'){ toast('求救卡：已指定队友帮唱，一起得分'); setTimeout(()=>{ const p=curPlayer(); const bank=BANK[r.word]||[]; const e=rnd(bank)||{l:'明月几时有',s:'但愿人长久',a:'王菲',hit:'明月',m:'literal'}; addEntry(p,{lyric:e.l,song:e.s,artist:e.a,hit:e.hit,m:e.m,ok:true,caption:'求救卡 · 队友帮唱'}); setTimeout(()=>advance(),900); },700); }
  else if(id==='ban'){ const song=(BANK[r.word]&&BANK[r.word][0].s)||'任意一首'; toast(`禁句卡：本轮谁都不能唱《${song}》`); }
  else if(id==='double'){ toast('双倍卡：本轮唱出即可得双倍分'); S.room.play='double'; }
  else if(id==='reverse'){ toast('反转卡：已指定下一个接歌的人'); const p=rnd(S.room.players); S.room.turn=S.room.players.indexOf(p); toast(`${p.name} 被指定接歌`); }
}
function startTimer(){
  clearInterval(timerHandle); timeLeft=turnSec(); turnDone=false;
  const fg=$('#ringfg'), num=$('#timenum'), ring=$('#timering');
  if(fg){ fg.style.strokeDashoffset=0; fg.style.stroke='#3C6E5D'; }
  if(num) num.textContent=String(turnSec());
  if(ring) ring.classList.remove('warn');
  timerHandle=setInterval(()=>{
    timeLeft-=0.1; if(timeLeft<0){ timeLeft=0; }
    const off=169.6*(1-timeLeft/turnSec());
    if(fg){ fg.style.strokeDashoffset=off; fg.setAttribute('stroke', timeLeft<=3?'#B23A2E':'#3C6E5D'); }
    if(num){ num.textContent=Math.ceil(timeLeft); }
    if(ring && timeLeft<=3) ring.classList.add('warn');
    if(timeLeft<=0){ clearInterval(timerHandle); if(recording) endRec(); else if(curPlayer().id==='me') timeoutFail(); }
  },100);
}
async function beginRec(){
  if(recording||turnDone||S.room.thinking||curPlayer().id!=='me') return;
  recording=true;
  const b=$('#recbtn'); if(b) b.classList.add('holding');
  const w=document.querySelector('#recbtn .holdingwave');
  const l=$('#reclabel'); if(l) l.innerHTML='<span class="micdot"></span> 正在录音…松开发送';
  micActive = await Mic.start();
  if(micActive){ if(w) w.classList.add('live'); }
  else { if(l) l.textContent='松开结束（未取得麦克风，将用合成试听）'; toast('未获取到麦克风权限，本条语音将用合成试听代替'); }
}
async function endRec(cancel){
  if(!recording) return; recording=false; turnDone=true;
  clearInterval(timerHandle);
  const w=document.querySelector('#recbtn .holdingwave'); if(w) w.classList.remove('live');
  const clip = micActive ? await Mic.stop() : null;
  micActive=false;
  renderRecBarDone(clip? '已录下你的原声 · AI 正在识别 → 语义判定 → 曲库验证…' : 'AI 正在识别 → 语义判定 → 曲库验证…');
  setTimeout(()=>{
    const r=S.room, p=curPlayer();
    const bank=BANK[r.word]||BANK['月'];
    let res;
    if(Math.random()<0.8){ const used=r.feed.filter(x=>!x.sys).map(x=>x.lyric); const e=pickLineFor(r.word, used)||rnd(bank); res={lyric:e.l,song:e.s,artist:e.a,hit:e.hit,m:e.m,ok:true,caption:e.m==='semantic'?'AI 语义判定':'AI 识别'}; }
    else { const otherKey=Object.keys(BANK).filter(k=>k!==r.word); const oe=rnd(BANK[rnd(otherKey)]); res={lyric:oe.l,song:oe.s,artist:oe.a,hit:oe.hit,m:'literal',ok:false,reason:`AI 识别到的歌词不含「${r.word}」`,clue:clueFor(r.word)}; }
    if(r.banned && res.lyric.includes(r.banned)){ res.ok=false; res.reason=`唱出了禁字「${r.banned}」`; }
    if(clip){ res.audioUrl=clip.url; res.audioDur=clip.dur; }
    addEntry(p,res);
    setTimeout(()=>advance(), res.ok?900:1800);
  }, 950);
}
function timeoutFail(){
  if(turnDone) return; turnDone=true;
  const p=curPlayer();
  clearInterval(timerHandle);
  renderRecBarDone(`${turnSec()} 秒到，超时算负`);
  addEntry(p,{lyric:'（超时未接上）',song:'—',artist:'',hit:'',ok:false,reason:`${turnSec()} 秒到，超时算负`,clue:clueFor(S.room.word)});
  setTimeout(()=>advance(),1600);
}
/* 回合结算态：彻底解决「倒计时卡在上一次时间」的观感 */
function renderRecBarDone(hint){
  const bar=$('#recbar'); if(!bar) return;
  bar.classList.add('done');
  bar.innerHTML=`
    <div class="turnhint"><span>本回合结束</span><span>${GAMEPLAYS[S.room.play].name} · ${turnSec()} 秒</span></div>
    <div class="recrow"><div class="donebox"><div class="tick">✓</div>
      <div class="tx"><b>已提交，倒计时已归零重置</b><span>${hint||'AI 已完成识别与判定'}</span></div></div></div>
    <div style="margin-top:10px"><div class="muted" style="font-size:11px;margin-bottom:8px">技能卡（累计通过 3 次得 1 张）· 当前进度 ${S.skill.pass}/3</div><div class="tray" id="tray"></div></div>`;
  renderTray();
}
function clueFor(w){ return `关键字「${w}」，想想带它的歌词…`; }

function openTypeSheet(){
  sheet(`<h3 class="serif">手写这一句</h3><p class="muted" style="font-size:12px;margin:6px 0 12px">演示用：直接输入歌词，AI 会做语义判定 + 曲库验证 + 自动查重。</p>
    <input id="lyricInput" placeholder="例如：明月几时有 把酒问青天" style="width:100%;padding:13px;border:1px solid var(--line);border-radius:12px;font-size:15px;font-family:var(--serif)">
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost grow" data-close>取消</button><button class="btn btn-primary grow" id="lyricGo">交给 AI 判定</button></div>`);
  setTimeout(()=>$('#lyricInput')&&$('#lyricInput').focus(),200);
  $('#lyricGo').onclick=()=>{
    const text=($('#lyricInput').value||'').trim(); if(!text){ toast('先写一句歌词吧'); return; }
    closeSheet();
    const r=S.room,p=curPlayer();
    const judged=judgeText(text, r.type, r.word);
    if(!judged.ok) judged.clue=clueFor(r.word);
    if(r.banned && text.includes(r.banned)){ judged.ok=false; judged.reason=`唱出了禁字「${r.banned}」`; }
    addEntry(p,judged); setTimeout(()=>advance(), judged.ok?900:1800);
  };
}
function judgeText(text,type,word){
  const bank=BANK[word]||[];
  const norm=s=>s.replace(/\s/g,'');
  const exact=bank.find(e=>norm(e.l)===norm(text));
  if(exact) return {lyric:text,song:exact.s,artist:exact.a,hit:exact.hit,m:exact.m,ok:true,caption:'曲库验证通过'};
  const part=bank.find(e=>text.includes(e.l)||e.l.includes(text));
  if(part) return {lyric:part.l,song:part.s,artist:part.a,hit:part.hit,m:part.m,ok:true,caption:'曲库验证通过'};
  if(text.includes(word)) return {lyric:text,song:'（曲库识别中）',artist:'—',hit:word,m:'literal',ok:true,caption:'字面判定通过'};
  return {lyric:text,song:'—',artist:'—',hit:'',ok:false,reason:`歌词不含「${word}」，也不符合主题`};
}

/* ---------------- 失败视觉反馈 ---------------- */
function inkFx(){
  const el=$('#fxboom'); if(!el) return;
  el.innerHTML=`<div class="splat"></div><div class="boomtext serif">炸了</div><div class="danmu" id="danmu">${['炸了炸了','再来一局','这也能接错？','别慌，还有机会','墨都炸开了'].map((t,i)=>`<span style="top:${18+i*14}%;animation-delay:${i*0.15}s">${t}</span>`).join('')}</div>`;
  el.classList.add('on');
  const ph=document.getElementById('phone'); if(ph){ ph.classList.add('shake'); setTimeout(()=>ph.classList.remove('shake'),520); }
  setTimeout(()=>{ el.classList.remove('on'); el.innerHTML=''; },1250);
}
function bombFx(name){
  const el=$('#fxboom'); if(!el) return;
  el.innerHTML=`<div class="splat" style="background:radial-gradient(circle at 50% 50%,rgba(60,110,93,.96),rgba(30,70,58,.9) 45%,rgba(12,30,24,.86) 62%,transparent 70%)"></div><div class="boomtext serif">💣 引爆</div>`;
  el.classList.add('on'); setTimeout(()=>{ el.classList.remove('on'); el.innerHTML=''; },1200);
}

/* ---------------- 技能卡弹层 ---------------- */
function openSkillSheet(){
  const owned=SKILL_CARDS.filter(c=>(S.skill.owned[c.id]||0)>0);
  sheet(`<h3 class="serif">本局道具 · 使用</h3>
    <p class="muted" style="font-size:12px;margin:6px 0 12px">回合进行中点「使用」立即生效；获得进度 ${S.skill.pass}/3（累计通过 3 次得 1 张）。</p>
    ${owned.length? owned.map(c=>`<div class="card row" style="gap:12px;margin-bottom:9px;text-align:left">
      <div style="width:42px;height:42px;border-radius:10px;display:grid;place-items:center;background:var(--cinnabar);color:#fff;font-family:var(--serif);font-size:19px">${c.sym}</div>
      <div class="grow"><b class="serif" style="font-size:14px">${c.name} <span class="tag">×${S.skill.owned[c.id]}</span></b><p class="muted" style="font-size:11.5px;margin:4px 0 0;line-height:1.5">${c.desc}</p></div>
      <button class="btn btn-primary" data-use="${c.id}" style="padding:9px 14px">使用</button></div>`).join('')
      : '<div class="empty">还没有技能卡<br>认真唱几句，累计通过 3 次就能获得</div>'}
    <button class="btn btn-soft btn-block" data-close style="margin-top:14px">关闭</button>`);
  $$('[data-use]').forEach(b=>b.onclick=()=>{ const id=b.dataset.use; closeSheet(); useSkill(id, null); });
}

/* ---------------- 结算 / 战报 / 留档 ---------------- */
function settle(){
  const r=S.room; r.over=true; if(r.npcTimer) clearTimeout(r.npcTimer); clearInterval(timerHandle);
  const me=r.players.find(p=>p.id==='me')||{score:0,streak:0};
  const sorted=[...r.players].sort((a,b)=>b.score-a.score);
  const hits=r.feed.filter(e=>e.ok&&e.pid==='me').length;
  S.stats.songs+=hits; S.stats.matches+=1;
  S.stats.bestStreak=Math.max(S.stats.bestStreak, me.streak||0);
  if(sorted[0] && sorted[0].id==='me') S.stats.wins+=1;
  S.matches.unshift({word:r.word,type:r.type,play:r.play,score:me.score,mvp:(sorted[0]||{name:'—'}).name,time:'刚刚'});
  S.matches=S.matches.slice(0,8);
  r.playlist.forEach(x=>{ if(!S.myPlaylist.find(y=>y.song===x.song)) S.myPlaylist.push({song:x.song,artist:x.artist}); });
  go('result');
}
VIEWS.result = {
  html(){
    if(!S.room) S.room=newRoom(S.selType,pickWord(S.selType),'random',defaultRoster(),'standard');
    const r=S.room;
    const sorted=[...r.players].sort((a,b)=>b.score-a.score);
    const me=r.players.find(p=>p.id==='me');
    const best=r.feed.filter(e=>e.ok&&e.pid==='me').length;
    const streak=Math.max(...r.players.map(p=>p.streak||0),0);
    const mvp=sorted[0];
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">本局战报</b><span class="muted" style="font-size:11px">令字「${esc(r.word)}」</span></div>
    <div class="scroll">
      <div class="poster" id="poster">
        <div class="pmoon"></div>
        <div class="serif" style="font-size:12px;letter-spacing:.3em;color:#B7AC95">飞花音 · 战绩</div>
        <div class="pbig serif">${esc(r.word)}</div>
        <div style="font-family:var(--serif);font-size:15px;color:#EFE7D5">${TYPE_META[r.type].name} · ${GAMEPLAYS[r.play].name}</div>
        <div class="pstats">
          <div class="pstat"><b>${me.score}</b><span>我的得分</span></div>
          <div class="pstat"><b>${best}</b><span>接对句数</span></div>
          <div class="pstat"><b>${streak}</b><span>最长连对</span></div>
        </div>
        <div class="between" style="margin-top:16px;align-items:flex-end">
          <div><div style="font-size:12px;color:#B7AC95">MVP</div><div class="serif" style="font-size:17px;color:#EAD9B0">${esc(mvp.name)} · ${mvp.score} 分</div>
          <div style="font-size:11px;color:#8E8571;margin-top:6px">扫码进房，随时开一局</div></div>
          <div class="qr"><canvas id="posterQr" width="120" height="120"></canvas></div>
        </div>
      </div>

      <div class="sec-title">名次</div>
      ${sorted.map((p,i)=>`<div class="rankrow ${i===0?'top1':''}"><div class="no serif">${i+1}</div>${av(p)}<div class="grow"><b class="serif">${esc(p.name)}</b><div class="bar"><i style="width:${Math.min(100,p.score/Math.max(1,sorted[0].score)*100)}%"></i></div></div><b class="serif" style="color:var(--cinnabar)">${p.score}</b></div>`).join('')}

      <div class="sec-title">赛后复盘 · 与 TME 闭环</div>
      <div class="card">
        <b class="serif" style="font-size:14px">你今天命中的 ${r.playlist.length} 首歌</b>
        <div style="margin-top:10px">
          ${r.playlist.length?r.playlist.map(x=>`<div class="between" style="padding:8px 0;border-bottom:1px solid var(--line)"><div><div class="serif" style="font-size:14px">《${esc(x.song)}》</div><div class="muted" style="font-size:11px">${esc(x.artist)} · 由 ${esc(x.by)} 接出</div></div><span class="tag jade">命中</span></div>`).join(''):'<div class="muted" style="font-size:12px">本局还没有接对完整歌曲</div>'}
        </div>
        <button class="btn btn-jade btn-block" id="collectAll" style="margin-top:12px">一键收藏到 QQ 音乐</button>
      </div>
      <div class="pill-note">推荐「没接上但适合你的歌」：《城里的月光》《风继续吹》《夜空中最亮的星》——依据本局语义命中与你的听歌历史。</div>

      <div class="sec-title">分享</div>
      <div class="quickgrid">
        <div class="qcard" data-share="screen"><div class="ic serif">录</div><b>一键录屏 / 截图</b><span>转发朋友圈，分享卡片附本局歌单</span></div>
        <div class="qcard" data-share="poster"><div class="ic serif">报</div><b>保存战绩海报</b><span>突出最高数据 + 房间二维码</span></div>
      </div>

      <button class="btn btn-primary btn-block btn-lg" id="again" style="margin-top:16px">再来一局 · 人不散房不散</button>
      <button class="btn btn-ghost btn-block" id="toArchive" style="margin-top:10px">把本局音频留档进数据库</button>
    </div>`;
  },
  mount(){
    drawQR($('#posterQr'));
    $('#collectAll').onclick=()=>toast('已收藏 '+S.room.playlist.length+' 首到 QQ 音乐，听歌时长 +N');
    $$('[data-share]').forEach(el=>el.onclick=()=>toast(el.dataset.share==='screen'?'已开始录屏，结束后自动生成分享卡片':'战绩海报已保存到相册'));
    $('#again').onclick=()=>{ const r=S.room; S.room=newRoom(r.type,pickWord(r.type),r.mode,r.players.map(p=>({...p,score:0,streak:0,passes:0})),r.play); go('room'); };
    $('#toArchive').onclick=()=>archiveSheet();
  }
};
function archiveSheet(){
  const r=S.room;
  const mine=r.feed.filter(e=>e.pid==='me');
  if(!mine.length){ toast('本局你还没有可留档的语音条'); return; }
  sheet(`<h3 class="serif">把音频留档进数据库？</h3><p class="muted" style="font-size:12px;margin:6px 0 14px">默认不留。留档即视为授权用于公开展示与 AI 训练，界面会明确说明，不默认占用你的数据。</p>
    <div class="card" style="padding:8px 12px">
      <div class="switchrow"><div><b class="serif" style="font-size:13px">默认不留档</b><div class="muted" style="font-size:11px">本局音频不会进入「字·飞花总库」</div></div><div class="switch" data-sw="keep"><i></i></div></div>
      <div class="switchrow"><div><b class="serif" style="font-size:13px">一键全部留档</b><div class="muted" style="font-size:11px">本局 ${mine.length} 条语音全部入库</div></div><div class="switch on" data-sw="all"><i></i></div></div>
      <div class="switchrow"><div><b class="serif" style="font-size:13px">入库后匿名</b><div class="muted" style="font-size:11px">头像与昵称对他人不可见</div></div><div class="switch on" data-sw="anon"><i></i></div></div>
      <div class="switchrow"><div><b class="serif" style="font-size:13px">授权用于 AI 训练</b><div class="muted" style="font-size:11px">让 AI 1v1 更懂「人会怎么接」</div></div><div class="switch on" data-sw="ai"><i></i></div></div>
    </div>
    <div class="row" style="gap:8px;margin-top:16px"><button class="btn btn-ghost grow" data-close>暂不留档</button><button class="btn btn-primary grow" id="doArchive">确认留档</button></div>`);
  $$('.switch').forEach(el=>el.onclick=()=>el.classList.toggle('on'));
  $('#doArchive').onclick=()=>{
    const anon=$('[data-sw="anon"]').classList.contains('on');
    mine.forEach(e=>{
      S.archives.push({ word:r.word, lyric:e.lyric, song:e.song, artist:e.artist, hit:e.hit, m:e.m,
        who:anon?'匿名歌友':'我', color:e.color, initial:e.initial, likes:e.likes||0, folded:[], replies:[], time:nowTime(),
        audioUrl:e.audioUrl||null, audioDur:e.audioDur||0 });
    });
    closeSheet(); toast(`已留档 ${mine.length} 条到「${r.word}」字库，并授权 AI 训练`);
    setTimeout(()=>go('dbword',{dbWord:r.word}),600);
  };
}

/* ============================================================
   人机对战练习（单人）
   ============================================================ */
VIEWS.duelSetup = {
  html(){
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">人机练习</b><span class="muted" style="font-size:11px">AI 1v1 陪练</span></div>
    <div class="scroll">
      <div class="pill-note">凑不齐人时也能练：先选类型方向、挑题目卡片，AI 1v1 陪练，限时进行。AI 对手有人设，接歌时会吐槽、夸奖。</div>
      <div class="sec-title">1 · 选飞花令类型</div>
      <div class="typelist">${Object.entries(TYPE_META).map(([k,m])=>`<div class="typerow ${S.selType===k?'active':''}" data-dtype="${k}"><div class="lv serif">${m.icon}</div><div class="tx"><b>${m.name} <span class="tag">${m.lv}</span></b><p>${m.desc}</p></div><div class="ok">✓</div></div>`).join('')}</div>
      <div class="sec-title">2 · 挑题目卡片</div>
      <div class="chips" id="dwords">${WORD_POOL[S.selType].map(w=>`<button class="chip ${S.duelWord===w?'active':''}" data-dw="${w}">${w}</button>`).join('')}</div>
      <div class="sec-title">3 · 选 AI 对手人设</div>
      <div class="chips" id="dpersona">${Object.entries(PERSONAS).map(([k,p])=>`<button class="chip ${S.duelPersona===k?'active':''}" data-dp="${k}">${p.name} · ${p.tag}</button>`).join('')}</div>
    </div>
    <div style="padding:12px 20px 24px"><button class="btn btn-primary btn-block btn-lg" id="startDuel">开始 1v1 练习</button></div>`;
  },
  mount(){
    $$('[data-dtype]').forEach(el=>el.onclick=()=>{ S.selType=el.dataset.dtype; S.duelWord=null; render(); });
    $$('[data-dw]').forEach(el=>el.onclick=()=>{ S.duelWord=el.dataset.dw; render(); });
    $$('[data-dp]').forEach(el=>el.onclick=()=>{ S.duelPersona=el.dataset.dp; render(); });
    $('#startDuel').onclick=()=>{
      S.duel={ type:S.selType, word:S.duelWord||WORD_POOL[S.selType][0], persona:S.duelPersona||'gentle', log:[], myScore:0, aiScore:0, turn:0, rounds:4, round:1 };
      go('duel');
    };
  }
};
VIEWS.duel = {
  html(){
    if(!S.duel) S.duel={ type:S.selType, word:WORD_POOL[S.selType][0], persona:S.duelPersona||'gentle', log:[], myScore:0, aiScore:0, turn:0, rounds:4, round:1 };
    const d=S.duel, P=PERSONAS[d.persona];
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('duelSetup')">‹</button><b class="serif">人机练习 · 令字「${esc(d.word)}」</b><span class="tag">${P.name}</span></div>
    <div class="duelstage" id="duelstage">
      <div class="between" style="margin-bottom:12px"><span class="tag jade">我 ${d.myScore}</span><span class="muted" style="font-size:11px">第 ${d.round}/${d.rounds} 轮</span><span class="tag red">${P.name} ${d.aiScore}</span></div>
      <div id="duelog"></div>
    </div>
    <div class="recbar">
      <div class="turnhint"><span id="duelhint">轮到你了</span><span>${GAMEPLAYS.standard.name} · ${turnSec()} 秒</span></div>
      <div class="recrow">
        <div class="timering" id="dtimer"><svg width="64" height="64"><circle cx="32" cy="32" r="27" fill="none" stroke="#E4DACA" stroke-width="6"/><circle id="dringfg" cx="32" cy="32" r="27" fill="none" stroke="#3C6E5D" stroke-width="6" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="0"/></svg><div class="num serif" id="dtnum">${turnSec()}</div></div>
        <button class="recbtn" id="drec"><span class="holdingwave"><i></i><i></i><i></i><i></i><i></i></span><span id="dreclabel">按住唱这一句</span></button>
        <button class="recbtn alt" id="dtype" title="手写歌词">✍</button>
      </div>
    </div>`;
  },
  mount(){
    const d=S.duel, P=PERSONAS[d.persona];
    if(!d.log.length){ d.log.push({who:'ai',name:P.name,txt:P.line}); }
    renderDuel(); duelDone=false; duelResetTimer();
    const btn=$('#drec');
    btn.addEventListener('pointerdown',e=>{ e.preventDefault(); duelRecStart(); });
    btn.addEventListener('pointerup',e=>{ e.preventDefault(); duelRecEnd(); });
    $('#dtype').onclick=duelType;
  }
};
function renderDuel(){
  const d=S.duel, P=PERSONAS[d.persona], box=$('#duelog'); if(!box) return;
  box.innerHTML=d.log.map(m=>`<div class="duelrow ${m.who==='me'?'me':''}">
    ${av(m.who==='me'?{color:ME.color,initial:'我',name:'我'}:{color:'#3C6E5D',initial:'AI',name:P.name})}
    <div><div class="who">${m.who==='me'?'我':P.name}</div><div class="bub">${m.who==='me'?(m.ok?hl(m.txt,m.hit):esc(m.txt)):esc(m.txt)}${m.song?`<div class="songline"><span class="song">《${esc(m.song)}》</span>${m.hit?`<span>命中「${esc(m.hit)}」</span>`:''}</div>`:''}
      <div class="voicerow"><button class="playbtn" data-lyric="${esc(m.txt)}" data-song="${esc(m.song||"")}" title="试听（优先播放原唱片段）">▶</button>${waveHTML(14)}<span class="dur">${durText()}</span><span class="vt">${musicOf(m.song)?'原唱片段':'合成试听'}</span></div></div></div>
  </div>`).join('');
  $$('.playbtn',box).forEach(el=>el.onclick=()=>playVoiceText(el, el.dataset.lyric, el.dataset.song, ''));
  const st=$('.duelstage'); if(st) st.scrollTop=st.scrollHeight;
}
let duelRecording=false, duelTimer=null, duelLeft=30;
function duelResetTimer(){
  duelLeft=turnSec(); clearInterval(duelTimer); duelDone=false;
  const fg=$('#dringfg'); if(fg){ fg.style.strokeDashoffset=0; fg.style.stroke='#3C6E5D'; }
  const n=$('#dtnum'); if(n) n.textContent=String(turnSec());
  const lbl=$('#dreclabel'); if(lbl) lbl.textContent='按住唱这一句';
  const t=$('#dtimer'); if(t) t.classList.remove('warn');
}
let duelDone=false;
function duelRecStart(){ if(duelRecording||duelDone) return; duelRecording=true; $('#drec').classList.add('holding'); duelStartTimer(); }
function duelRecEnd(){
  if(!duelRecording) return; duelRecording=false; duelDone=true; clearInterval(duelTimer);
  const b=$('#drec'); if(b) b.classList.remove('holding');
  const lbl=$('#dreclabel'); if(lbl) lbl.textContent='AI 判定中…';
  setTimeout(()=>duelTurn(),900);
}
function duelStartTimer(){
  duelLeft=turnSec(); clearInterval(duelTimer);
  duelTimer=setInterval(()=>{ duelLeft-=0.1; const fg=$('#dringfg'); if(fg) fg.style.strokeDashoffset=169.6*(1-duelLeft/turnSec()); const n=$('#dtnum'); if(n) n.textContent=Math.max(0,Math.ceil(duelLeft)); if(duelLeft<=0){ clearInterval(duelTimer); if(duelRecording) duelRecEnd(); else duelTurn(true); } },100);
}
function duelType(){
  sheet(`<h3 class="serif">手写这一句</h3><input id="dli" placeholder="写下你接的歌词" style="width:100%;padding:13px;border:1px solid var(--line);border-radius:12px;font-size:15px;font-family:var(--serif);margin-top:10px">
    <button class="btn btn-primary btn-block" id="dligo" style="margin-top:14px">交给 AI 判定</button>`);
  $('#dligo').onclick=()=>{ const t=($('#dli').value||'').trim(); if(!t){ toast('先写一句'); return; } closeSheet(); duelTurn(false,t); };
}
function duelTurn(timeout,text){
  const d=S.duel, P=PERSONAS[d.persona];
  let res;
  if(timeout){ res={ok:false,txt:'（超时未接上）'}; }
  else if(text){ const j=judgeText(text,d.type,d.word); res={ok:j.ok,txt:text,hit:j.hit,song:j.song}; }
  else { const bank=BANK[d.word]||BANK['月']; const e=rnd(bank); const ok=Math.random()<0.82; res= ok?{ok:true,txt:e.l,hit:e.hit,song:e.s}:{ok:false,txt:rnd(BANK['月']).l}; }
  d.log.push({who:'me',...res});
  let aiReply='';
  if(res.ok){ d.myScore++; aiReply=rnd(P.praise); }
  else { aiReply=rnd(P.tease)+'（关键词是「'+d.word+'」）'; }
  d.log.push({who:'ai',name:P.name,txt:aiReply});
  d.round++;
  if(d.round>d.rounds){ setTimeout(()=>{ toast(`练习结束 · 我 ${d.myScore} : ${d.aiScore} ${P.name}`); renderDuel(); const l=$('#dreclabel'); if(l) l.textContent='练习结束'; const rb=$('#drec'); if(rb) rb.disabled=true; },600); }
  duelDone=false; duelResetTimer();               /* 立刻重置倒计时 */
  if(d.round<=d.rounds){                            /* AI 想 3~5 秒再接 */
    const wait=rint(3000,5000);
    const hint=$('#duelhint'); if(hint) hint.textContent=`${P.name} 正在想…`;
    const lbl=$('#dreclabel'); if(lbl) lbl.textContent='等对手接歌…';
    setTimeout(()=>{
      const bank=BANK[d.word]||BANK['月']; const e=rnd(bank);
      d.log.push({who:'ai',name:P.name,txt:e.l,hit:e.hit,song:e.s}); d.aiScore+=Math.random()<0.8?1:0; renderDuel();
      if(Voice.on) playAutoSong(e.s);
      const h2=$('#duelhint'); if(h2) h2.textContent='轮到你了';
      const l2=$('#dreclabel'); if(l2) l2.textContent='按住唱这一句';
    }, wait);
  }
  renderDuel();
}

/* ============================================================
   数据库 · 字·飞花总库
   ============================================================ */
VIEWS.db = {
  html(){
    const words=Object.keys(BANK);
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">字·飞花总库</b><span class="muted" style="font-size:11px">${S.archives.length} 条留档</span></div>
    <div class="scroll">
      <div class="pill-note">每个字都有一个数据库，实时局产生的音频可留档于此，供人回看、跟唱，也用于训练 AI。相同歌词飞书式折叠，回应只挂在对应条下。</div>
      <div class="sec-title">选一个字进入</div>
      <div class="quickgrid">
        ${words.map(w=>`<div class="qcard" data-word="${w}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="serif" style="font-size:24px">${w}</span><span class="tag jade">${dbCount(w)} 条</span></div><span>${dbSongs(w)} 首歌曲</span></div>`).join('')}
      </div>
    </div>`;
  },
  mount(){ $$('[data-word]').forEach(el=>el.onclick=()=>go('dbword',{dbWord:el.dataset.word})); }
};
function dbEntries(w){ return S.archives.filter(a=>a.word===w); }
function dbCount(w){ return dbEntries(w).length + SEED_DB.filter(a=>a.word===w).length; }
function dbSongs(w){ const s=new Set([...dbEntries(w),...SEED_DB.filter(a=>a.word===w)].map(a=>a.song)); return s.size; }
VIEWS.dbword = {
  html(){
    const w=S.dbWord;
    const list=[...SEED_DB.filter(a=>a.word===w), ...dbEntries(w)];
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('db')">‹</button><b class="serif">「${esc(w)}」字库</b><span class="muted" style="font-size:11px">${list.length} 条留档</span></div>
    <div class="scroll">
      <div class="inkboard" style="height:180px"><div class="bg" style="background-image:url('${bgFor(w)}')"></div><div class="veil"></div>
        <div class="inner"><div class="glyph serif">${esc(w)}</div><div class="cap">AI 水墨意境背景板 · 由「${esc(w)}」字生成</div></div></div>
      <div class="statgrid">
        <div class="stat"><b>${list.length}</b><span>留档语音</span></div>
        <div class="stat"><b>${new Set(list.map(a=>a.song)).size}</b><span>命中歌曲</span></div>
        <div class="stat"><b>${list.reduce((n,a)=>n+(a.folded?a.folded.length:0),0)}</b><span>跟唱</span></div>
      </div>
      <div class="sec-title">留档回看（最新的在最前）</div>
      <div id="dbfeed">${list.length?list.map(a=>dbItemHTML(a)).join(''):'<div class="empty">这个字还没有留档，去实时局接一句吧～</div>'}</div>
    </div>`;
  },
  mount(){
    const f=$('#dbfeed');
    $$('.playbtn',f).forEach(el=>el.onclick=()=>playVoiceText(el, el.dataset.lyric, el.dataset.song, el.dataset.artist, el.dataset.audio));
    $$('.listen',f).forEach(el=>el.onclick=()=>listenSong(el, el.dataset.song, el.dataset.artist));
    $$('.reply-toggle',f).forEach(el=>el.onclick=()=>el.nextElementSibling.classList.toggle('open'));
    $$('.avatar',f).forEach(a=>{ let t=null; a.onclick=()=>{ clearTimeout(t); t=setTimeout(()=>toast('再双击头像就能加好友哦'),260); }; a.ondblclick=()=>toast('已向 TA 发出好友申请'); });
    $$('.emobtn',f).forEach(el=>el.onclick=()=>toast('已发表情回应'));
  }
};
function dbItemHTML(a){
  const folds=(a.folded&&a.folded.length)?`<div class="folded">${a.folded.map(x=>`<div class="fitem"><span class="who">${esc(x)}</span><span>跟唱了同一句</span></div>`).join('')}</div>`:'';
  const replies=(a.replies&&a.replies.length)?`<div class="replies"><span class="reply-toggle">💬 ${a.replies.length} 条回应 ▾</span><div class="reply-list">${a.replies.map(r=>`<div class="reply"><b>${esc(r.who)}</b> ${esc(r.txt||'')}</div>`).join('')}</div></div>`:'';
  return `<div class="msg">
    ${av({color:a.color,initial:a.initial,name:a.who})}
    <div class="body">
      <div class="head"><b>${esc(a.who)}</b><span class="tag jade">已留档</span><span>${a.time||''}</span></div>
      <div class="bubble"><div class="lyric">${hl(a.lyric,a.hit,a.m)}</div>
        <div class="voicerow"><button class="playbtn" data-lyric="${esc(a.lyric)}" data-song="${esc(a.song)}" data-artist="${esc(a.artist||"")}" data-audio="${esc(a.audioUrl||"")}" title="试听">▶</button>${waveHTML()}<span class="dur">${a.audioUrl?fmtSec(a.audioDur):(musicOf(a.song)?'0:30':durText())}</span><span class="vt">${a.audioUrl?'我的录音':(musicOf(a.song)?'原唱片段':'合成试听')}</span></div>
        <div class="songline"><span>AI 识歌：</span><span class="song">《${esc(a.song)}》</span><span>· ${esc(a.artist||'未知')}</span><button class="listen" data-song="${esc(a.song)}" data-artist="${esc(a.artist||"")}">一起听</button></div>
        <div class="meta-row"><span class="mi">👍 ${a.likes||0}</span><span class="mi">🎤 跟唱 ${a.folded?a.folded.length:0}</span><span class="mi emobtn">😀</span><span class="mi emobtn">🔥</span><span class="mi emobtn">👏</span></div>
      </div>
      ${folds}${replies}
    </div></div>`;
}

/* ============================================================
   常驻尾字接龙（永久在线 · 倒序查看 · 我来接置顶）
   ============================================================ */
VIEWS.chain = {
  html(){
    const c=S.chain;
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">尾字接龙</b><span class="muted" style="font-size:11px">永久在线</span></div>
    <div class="scroll">
      <div class="inkboard" style="height:150px"><div class="bg" style="background-image:url('assets/ink-night.jpg')"></div><div class="veil"></div>
        <div class="inner"><div class="cap" style="font-size:13px;letter-spacing:.24em">永不关门的接歌长链</div>
        <div class="serif" style="font-size:20px;color:#EFE7D5;margin-top:8px">上一首的尾字 = 下一首的首字</div></div></div>
      <div class="between" style="margin:14px 2px 8px">
        <div class="chips"><button class="chip active">国语链</button><button class="chip">粤语链</button><button class="chip">英语链</button></div>
        <label class="row" style="gap:6px;font-size:11.5px;color:var(--ink-3)"><span>不许谐音</span><div class="switch on" style="cursor:pointer"><i></i></div></label>
      </div>
      <div class="card row" style="gap:12px;background:#FFF9F7;border-color:#EFD6D0">
        <div class="grow"><b class="serif" style="font-size:14px">链尾字 · 「${esc(c.length?c[c.length-1].tail:'月')}」</b><div class="muted" style="font-size:11.5px;margin-top:4px">接一首首字为「${esc(c.length?c[c.length-1].tail:'月')}」的歌，自动置顶</div></div>
        <button class="btn btn-primary" id="chainAdd">我来接</button>
      </div>
      <div class="sec-title">接龙链 <span class="muted" style="font-size:11px;font-weight:400">最新在最前</span></div>
      <div class="chain">${[...c].reverse().map((it,i)=>chainItemHTML(it,i)).join('')}</div>
      <div class="pill-note">AI 校验：自动校验首尾是否相接、歌曲是否真实、有没有重复或成环；不合规不接上，并提示正确首字。当前链尾没人接得上时，AI 给首字线索，或由 NPC 先接一首兜底。</div>
    </div>`;
  },
  mount(){
    $('#chainAdd').onclick=chainAdd;
    $$('.foldtag').forEach(el=>el.onclick=()=>toast('已被接走，请接新尾字'));
  }
};
function chainItemHTML(it,i){
  return `<div class="chainitem ${i===0?'hot':''}"><div class="node"></div>
    <div class="linktag">${esc(it.head)} → ${esc(it.tail)}</div>
    <div class="card" style="padding:11px 12px"><div class="lyric">${esc(it.lyric)}</div>
      <div class="songline"><span class="song">《${esc(it.song)}》</span><span>· ${esc(it.artist)}</span><span style="margin-left:auto" class="muted">${esc(it.by)} · ${esc(it.time)}</span></div>
    </div></div>`;
}
function chainAdd(){
  const c=S.chain, tail=c.length?c[c.length-1].tail:'月';
  sheet(`<h3 class="serif">我来接 · 首字须为「${esc(tail)}」</h3>
    <p class="muted" style="font-size:12px;margin:6px 0 12px">AI 会校验首尾相接、歌曲真实性、重复与成环。</p>
    <input id="cSong" placeholder="歌名，例如：月亮之上" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:12px;font-size:14px">
    <input id="cLine" placeholder="歌词首句（首字须为「${esc(tail)}」）" style="width:100%;padding:12px;border:1px solid var(--line);border-radius:12px;font-size:14px;margin-top:9px">
    <div class="row" style="gap:8px;margin-top:14px"><button class="btn btn-ghost grow" data-close>取消</button><button class="btn btn-primary grow" id="chainGo">校验并接上</button></div>`);
  $('#chainGo').onclick=()=>{
    const song=($('#cSong').value||'').trim(), line=($('#cLine').value||'').trim();
    if(!song||!line){ toast('歌名与歌词都要填哦'); return; }
    if(line[0]!==tail){ toast(`不合规：首字应为「${tail}」，你写的是「${line[0]}」`); return; }
    if(c.some(x=>x.song===song)){ toast('这首歌链上已经出现过了，换个新的吧'); return; }
    const newTail=line[line.length-1];
    c.push({ song, artist:'（AI 已识歌）', lyric:line, head:line[0], tail:newTail, by:'我', time:nowTime() });
    closeSheet(); render(); toast(`接龙成功！「${tail} → ${newTail}」已置顶`);
  };
}


/* ============================================================
   我的 · 段位、技能卡、战绩、留档、设置
   ============================================================ */
VIEWS.me = {
  html(){
    const t=tierOf();
    const ownedTotal=Object.values(S.skill.owned).reduce((a,b)=>a+b,0);
    return `
    <div class="scroll">
      <div class="profile-head">
        <div class="pmoon"></div>
        <div class="prow">
          ${av(ME,'lg')}
          <div class="grow">
            <div class="nm">我</div>
            <div class="tierline"><span class="tier">${t.name}</span><span style="font-size:11px;color:#9E937E">接歌 ${S.stats.songs} 首</span></div>
          </div>
        </div>
        <div class="tierbar"><i style="width:${t.pct}%"></i></div>
        <div class="tiercap"><span>${t.cur} 首</span><span>${t.i>=TITLES.length-1?'已达最高称号':'距「'+t.next+'」还需 '+(t.nextNeed-S.stats.songs)+' 首'}</span></div>
      </div>

      <div class="sec-title">我的数据</div>
      <div class="statgrid4">
        <div class="statwide"><b>${S.stats.songs}</b><span>累计接歌</span></div>
        <div class="statwide"><b>${S.stats.wins}</b><span>胜局 / 共 ${S.stats.matches} 局</span></div>
        <div class="statwide"><b>${S.stats.bestStreak}</b><span>最长连对</span></div>
        <div class="statwide"><b>${S.stats.archived}</b><span>我的留档</span></div>
      </div>

      <div class="sec-title">我的内容</div>
      <div class="listrow" data-me="cards"><div class="ic red">卡</div><div class="tx"><b>我的技能卡</b><p>禁句 · 求救 · 跳过 · 双倍 · 反转，持有 ${ownedTotal} 张 · 获得进度 ${S.skill.pass}/3</p></div><span class="arw">›</span></div>
      <div class="listrow" data-me="playlist"><div class="ic jade">歌</div><div class="tx"><b>我的共享歌单</b><p>接对自动汇总 ${S.myPlaylist.length} 首，可一键收藏 QQ 音乐</p></div><span class="arw">›</span></div>
      <div class="listrow" data-me="matches"><div class="ic">战</div><div class="tx"><b>我的战绩</b><p>最近 ${S.matches.length} 局回顾，可再生成战绩海报</p></div><span class="arw">›</span></div>
      <div class="listrow" data-me="db"><div class="ic jade">库</div><div class="tx"><b>我的留档</b><p>${S.stats.archived} 条音频留在「字·飞花总库」，可回看与跟唱</p></div><span class="arw">›</span></div>
      <div class="listrow" data-me="titles"><div class="ic red">称</div><div class="tx"><b>称号进阶</b><p>从「初入乐林」到「诗仙」，当前 ${t.name}</p></div><span class="arw">›</span></div>

      <div class="sec-title">设置</div>
      <div class="card" style="padding:4px 14px">
        <div class="soundrow"><div><b class="serif" style="font-size:13px">接歌时长</b><div class="muted" style="font-size:11px">每回合限时，超时算负（文档原设定为 8 秒）</div></div>
          <div class="chips">${[8,15,20,30].map(x=>`<button class="chip ${S.turnSec===x?'active':''}" data-sec="${x}">${x}s</button>`).join('')}</div></div>
        <div class="soundrow"><div><b class="serif" style="font-size:13px">接歌片段时长</b><div class="muted" style="font-size:11px">每条接歌播放多长的原唱片段（30 秒是官方试听上限）</div></div>
          <div class="chips">${[10,20,30].map(x=>`<button class="chip ${S.clipSec===x?'active':''}" data-clip="${x}">${x}s</button>`).join('')}</div></div>
        <div class="soundrow"><div><b class="serif" style="font-size:13px">接歌声音播放</b><div class="muted" style="font-size:11px">直接播放接入的真实原唱片段（不再 AI 朗读）；无版权片段时只放合成伴奏</div></div><div class="switch ${Voice.on?'on':''}" id="swVoice"><i></i></div></div>
        <div class="soundrow"><div><b class="serif" style="font-size:13px">默认不留档</b><div class="muted" style="font-size:11px">本局音频默认不进「字·飞花总库」</div></div><div class="switch on"><i></i></div></div>
        <div class="soundrow"><div><b class="serif" style="font-size:13px">授权用于 AI 训练</b><div class="muted" style="font-size:11px">让 AI 1v1 更懂「人会怎么接」</div></div><div class="switch on"><i></i></div></div>
      </div>

      <div class="pill-note" style="margin-top:14px">落地形态：全民K歌歌房内轻玩法 · 账号与 QQ 音乐 / 全民K歌打通，战绩、收藏、社群天然同步。</div>
    </div>`;
  },
  mount(){
    $('#swVoice').onclick=()=>{ Voice.on=!Voice.on; if(!Voice.on) Voice.cancel(); render(); toast(Voice.on?'已开启接歌语音播放':'已关闭接歌语音播放'); };
    $$('[data-sec]').forEach(el=>el.onclick=()=>{ S.turnSec=+el.dataset.sec; render(); toast(`接歌时长已设为 ${S.turnSec} 秒`); });
    $$('[data-clip]').forEach(el=>el.onclick=()=>{ S.clipSec=+el.dataset.clip; render(); toast(`接歌片段已设为 ${S.clipSec} 秒`); });
    $$('[data-me]').forEach(el=>el.onclick=()=>{
      const k=el.dataset.me;
      if(k==='cards') go('cards');
      else if(k==='db') go('db');
      else if(k==='playlist') mePlaylist();
      else if(k==='matches') meMatches();
      else if(k==='titles') meTitles();
    });
  }
};
function mePlaylist(){
  sheet(`<h3 class="serif">我的共享歌单</h3><p class="muted" style="font-size:12px;margin:6px 0 12px">实时局里接对的歌会自动汇总到这里。</p>
    ${S.myPlaylist.length?S.myPlaylist.map(x=>`<div class="between" style="padding:9px 0;border-bottom:1px solid var(--line)"><div><b class="serif" style="font-size:14px">《${esc(x.song)}》</b><div class="muted" style="font-size:11px">${esc(x.artist)}</div></div><button class="btn btn-soft" data-play="${esc(x.song)}">试听</button></div>`).join(''):'<div class="empty">还没有接对过歌曲</div>'}
    <button class="btn btn-jade btn-block" style="margin-top:14px" id="meCollect">一键收藏到 QQ 音乐</button>`);
  $$('[data-play]').forEach(b=>b.onclick=()=>{ Voice.melody(hash(b.dataset.play),{up:true}); toast(`一起听《${b.dataset.play}》原唱副歌`); });
  $('#meCollect').onclick=()=>toast(`已收藏 ${S.myPlaylist.length} 首到 QQ 音乐`);
}
function meMatches(){
  sheet(`<h3 class="serif">我的战绩</h3>
    ${S.matches.map(m=>`<div class="card between" style="margin-bottom:9px"><div><b class="serif" style="font-size:14px">令字「${m.word}」· ${TYPE_META[m.type].name}</b><div class="muted" style="font-size:11px;margin-top:4px">${GAMEPLAYS[m.play].name} · MVP ${esc(m.mvp)} · ${esc(m.time)}</div></div><div style="text-align:right"><b class="serif" style="color:var(--cinnabar);font-size:18px">${m.score}</b><div class="muted" style="font-size:10px">我的得分</div></div></div>`).join('')}
    <button class="btn btn-soft btn-block" data-close>关闭</button>`);
}
function meTitles(){
  const t=tierOf();
  sheet(`<h3 class="serif">称号进阶</h3><p class="muted" style="font-size:12px;margin:6px 0 12px">战绩贡献可进阶称号。</p>
    <div class="badgeline">${TITLES.map((x,i)=>`<span class="badge ${i<=t.i?'on':''}">${x}</span>`).join('')}</div>
    <div class="pill-note" style="margin-top:14px">当前：<b>${t.name}</b> · 累计接歌 ${S.stats.songs} 首${t.i<TITLES.length-1?`，距「${t.next}」还需 ${t.nextNeed-S.stats.songs} 首`:'，已达成最高称号'}。</div>
    <button class="btn btn-soft btn-block" data-close style="margin-top:14px">关闭</button>`);
}
function hash(str){ let h=2166136261; for(const c of String(str)){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }

/* ============================================================
   技能卡独立页 / 排行榜 / 社群
   ============================================================ */
VIEWS.cards = {
  html(){ return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">我的技能卡</b><span class="muted" style="font-size:11px">累计通过获得</span></div>
    <div class="scroll">
      <div class="card" style="text-align:center">
        <div class="serif" style="font-size:14px">获得进度</div>
        <div class="serif" style="font-size:34px;color:var(--cinnabar);margin:6px 0">${S.skill.pass}<span style="font-size:16px;color:var(--ink-3)">/3</span></div>
        <div class="bar"><i style="width:${S.skill.pass/3*100}%"></i></div>
        <div class="muted" style="font-size:11.5px;margin-top:8px">个人语音被 AI 审核累计通过 3 次，即获得一张随机技能卡</div>
      </div>
      <div class="sec-title">五种技能卡</div>
      ${SKILL_CARDS.map(c=>`<div class="card row" style="gap:12px;margin-bottom:10px">
        <div class="lv serif" style="width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:${(S.skill.owned[c.id]||0)>0?'var(--cinnabar)':'var(--ink)'};color:#F6F1E7;font-size:20px">${c.sym}</div>
        <div class="grow"><b class="serif" style="font-size:14px">${c.name} <span class="tag">持有 ×${S.skill.owned[c.id]||0}</span></b>
        <p class="muted" style="font-size:11.5px;margin:5px 0 0;line-height:1.55">${c.desc}<br><span style="color:var(--jade)">为什么好玩：${c.why}</span></p></div></div>`).join('')}
    </div>`; },
  mount(){}
};
VIEWS.rank = {
  html(){
    const max=RANKING[0].v;
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">热门排行榜</b><span class="muted" style="font-size:11px">官方与自建话题同榜</span></div>
    <div class="scroll">
      <div class="chips" style="margin-bottom:12px"><button class="chip active">参与人数</button><button class="chip">接歌条数</button><button class="chip">本周</button></div>
      ${RANKING.map((r,i)=>`<div class="rankrow ${i===0?'top1':''}"><div class="no serif">${i+1}</div>
        <div style="width:38px;height:38px;border-radius:10px;background:#201E24;color:#EAD9B0;display:grid;place-items:center;font-family:var(--serif);font-size:20px">${r.c}</div>
        <div class="grow"><b class="serif" style="font-size:14px">《${esc(r.n)}》</b><div class="muted" style="font-size:11px">令字「${r.c}」· 由 ${esc(r.by)} 发起</div><div class="bar"><i style="width:${r.v/max*100}%"></i></div></div>
        <div style="text-align:right"><b class="serif" style="color:var(--cinnabar);font-size:16px">${(r.v/1000).toFixed(1)}k</b><div class="muted" style="font-size:10px">参与</div></div></div>`).join('')}
      <div class="sec-title">称号进阶</div>
      <div class="chips">${TITLES.map((t,i)=>`<button class="chip ${i>=4?'jade':''}">${t}</button>`).join('')}</div>
      <div class="pill-note">战绩贡献可进阶「令主」「诗仙」称号；双击头像加好友，随时约局。</div>
    </div>`;
  },
  mount(){}
};
VIEWS.community = {
  html(){
    return `
    <div class="topbar"><button class="iconbtn" onclick="go('home')">‹</button><b class="serif">歌友社群</b><span class="muted" style="font-size:11px">长期歌友 · 约战</span></div>
    <div class="scroll">
      <div class="pill-note">可建立长期歌友社群，随时约局；战绩贡献进阶称号。冷启动期官方 AI NPC 在热门房间打底，新用户进来不对空墙。</div>
      <div class="sec-title">我的歌友群</div>
      ${GROUPS.map(g=>`<div class="card between" style="margin-bottom:10px"><div><b class="serif" style="font-size:14px">${esc(g.n)}</b><div class="muted" style="font-size:11.5px;margin-top:4px">${esc(g.d)}</div><div class="row" style="gap:6px;margin-top:7px"><span class="tag jade">${g.tag}</span><span class="tag">${g.m} 人</span></div></div><button class="btn btn-soft" onclick="toast('已向群内发起约战邀请')">约战</button></div>`).join('')}
      <div class="sec-title">找我玩过的人</div>
      <div class="card"><div class="row wrap" style="gap:16px">
        ${NPC_NAMES.slice(0,6).map((n,i)=>`<div style="text-align:center" ondblclick="toast('已向 ${n} 发出好友申请')">${av(makeNpc(n,i))}<div style="font-size:11px;margin-top:4px">${n}</div></div>`).join('')}
      </div><div class="muted" style="font-size:11px;margin-top:10px">双击头像即可加好友</div></div>
    </div>`;
  },
  mount(){}
};

/* ============================================================
   通用弹层 / 提示
   ============================================================ */
function sheet(inner){
  let ov=$('#sheetOv');
  if(!ov){ ov=document.createElement('div'); ov.id='sheetOv'; ov.className='overlay'; screen.appendChild(ov); }
  ov.innerHTML=`<div class="sheet"><button class="btn btn-soft close" data-close style="padding:6px 10px">✕</button>${inner}</div>`;
  ov.classList.add('open');
  ov.onclick=(e)=>{ if(e.target===ov) closeSheet(); };
  $$('[data-close]',ov).forEach(b=>b.onclick=closeSheet);
}
function closeSheet(){ const ov=$('#sheetOv'); if(ov){ ov.classList.remove('open'); ov.innerHTML=''; } }

/* ============================================================
   底部导航
   ============================================================ */
const NAV_VIEWS=new Set(['home','db','chain','community','cards','rank','me']);
function nav(active){
  const tabs=[['home','首','首页'],['chain','龙','接龙'],['db','库','数据库'],['community','社','社群'],['me','我','我的']];
  const act = active==='cards' ? 'me' : active;
  return `<div class="bottomnav">${tabs.map(([k,g,label])=>`<div class="tab ${act===k?'active':''}" data-nav="${k}"><span class="g">${g}</span><span>${label}</span></div>`).join('')}</div>`;
}

/* ============================================================
   种子数据 & 启动
   ============================================================ */
const SEED_DB=[
  {word:'月',lyric:'城里的月光 把梦照亮',song:'城里的月光',artist:'许美静',hit:'月光',m:'literal',who:'墨白',color:'#3C6E5D',initial:'墨',likes:126,folded:['小狐','南风'],replies:[{who:'南风',txt:'这段气口太稳了'},{who:'小狐',txt:'跟唱+1'}],time:'20:12'},
  {word:'月',lyric:'明月几时有 把酒问青天',song:'但愿人长久',artist:'王菲',hit:'明月',m:'literal',who:'清商',color:'#7A5EA8',initial:'清',likes:98,folded:[],replies:[{who:'知野',txt:'经典，稳'}],time:'19:58'},
  {word:'雨',lyric:'我听见雨滴落在青青草地',song:'小幸运',artist:'田馥甄',hit:'雨滴',m:'literal',who:'小狐',color:'#B08A4F',initial:'狐',likes:210,folded:['墨白'],replies:[{who:'清商',txt:'一开口就是青春'}],time:'21:02'},
  {word:'风',lyric:'谁在用琵琶弹奏一曲东风破',song:'东风破',artist:'周杰伦',hit:'东风',m:'literal',who:'南风',color:'#3D6FA8',initial:'南',likes:175,folded:[],replies:[],time:'20:41'},
  {word:'夜',lyric:'夜空中最亮的星 能否听清',song:'夜空中最亮的星',artist:'逃跑计划',hit:'夜',m:'literal',who:'知野',color:'#A8574E',initial:'知',likes:302,folded:['拾光','清商'],replies:[{who:'墨白',txt:'副歌一起听的触发点'}],time:'20:20'}
];
S.chain=[
  { song:'月亮之上', artist:'凤凰传奇', lyric:'月亮之上', head:'月', tail:'上', by:'知野', time:'19:20' },
  { song:'上弦月', artist:'群星', lyric:'上弦月 挂在天空', head:'上', tail:'空', by:'清商', time:'19:46' },
  { song:'空城', artist:'杨坤', lyric:'空城 只剩下我', head:'空', tail:'我', by:'小狐', time:'20:18' },
  { song:'我的未来不是梦', artist:'张雨生', lyric:'我的未来不是梦', head:'我', tail:'梦', by:'墨白', time:'20:51' }
];

function boot(){
  const c=document.getElementById('clock'); if(c){ const d=new Date(); c.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  // 给 home / db 等主视图附加底部导航
  const _render=render;
  render=function(){ _render();
    if(NAV_VIEWS.has(S.view) && !$('.bottomnav',screen)){ const vv=$('.view',screen); (vv||screen).insertAdjacentHTML('beforeend',nav(S.view)); }
    $$('[data-nav]',screen).forEach(el=>el.onclick=()=>go(el.dataset.nav));
    positionPlayerBar();
  };
  go('home');
}
window.addEventListener('DOMContentLoaded',boot);
