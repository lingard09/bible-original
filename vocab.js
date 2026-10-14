'use strict';
// 빈도순 단어 학습: 성경에 자주 나오는 표제어부터 카드로 익히고, 간격 반복(라이트너 상자)으로 복습합니다.
// 진도는 이 브라우저의 localStorage에만 저장합니다.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const INTERVALS=[0,1,3,7,16,35];// 상자 번호별 다음 복습까지의 일수
const RANGE=50;
let lang='he',vocab=null,state=null,session=null;
const today=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5);};
function loadState(){try{const s=JSON.parse(localStorage.getItem('vocab:'+lang)||'{}');return {cards:s.cards||{},flags:s.flags||{},perDay:s.perDay||10,day:s.day||0,newToday:s.newToday||0};}catch{return {cards:{},flags:{},perDay:10,day:0,newToday:0};}}
function saveState(){try{localStorage.setItem('vocab:'+lang,JSON.stringify(state));}catch{}}
function rollDay(){if(state.day!==today()){state.day=today();state.newToday=0;}}
const known=id=>(state.cards[id]?.b||0)>=1;
function coverage(){const n=vocab.words.reduce((s,w)=>s+(known(w.id)?w.c:0),0);return n/vocab.total;}
function stats(){const t=today();let due=0,learned=0;for(const w of vocab.words){const c=state.cards[w.id];if(!c)continue;if(c.b>=1)learned++;if(c.d<=t)due++;}return {due,learned,fresh:Math.max(0,state.perDay-state.newToday)};}
const pct=x=>`${(x*100).toFixed(1)}%`;
function progressHTML(){
 const s=stats(),cov=coverage(),he=lang==='he';
 return `<div class="vc-progress"><div class="vc-stat"><b>${s.learned.toLocaleString()}</b><span>아는 단어</span></div><div class="vc-stat"><b>${pct(cov)}</b><span>${he?'구약':'신약'} 본문 단어 중 읽을 수 있는 비율</span></div><div class="vc-stat"><b>${s.due}</b><span>오늘 복습</span></div><div class="vc-stat"><b>${s.fresh}</b><span>오늘 새 단어</span></div></div>`
 +`<div class="vc-bar" role="img" aria-label="본문 단어 중 ${pct(cov)}"><i style="width:${Math.min(100,cov*100)}%"></i></div>`
 +`<div class="vc-actions"><button class="vc-start" id="startSession" ${s.due+s.fresh?'':'disabled'}>${s.due+s.fresh?`학습 시작 · ${s.due+Math.min(s.fresh,vocab.words.filter(w=>!state.cards[w.id]).length)}장`:'오늘 학습을 마쳤습니다'}</button><label>하루 새 단어 <select id="perDay">${[5,10,20,30,50].map(n=>`<option ${n===state.perDay?'selected':''}>${n}</option>`).join('')}</select></label></div>`;
}
function buildSession(){
 rollDay();const t=today();
 const due=vocab.words.filter(w=>state.cards[w.id]&&state.cards[w.id].d<=t).sort((a,b)=>state.cards[a.id].d-state.cards[b.id].d);
 const fresh=vocab.words.filter(w=>!state.cards[w.id]).slice(0,Math.max(0,state.perDay-state.newToday));
 return {queue:[...due,...fresh],done:0,right:0,revealed:false};
}
function rankOf(w){return vocab.words.indexOf(w)+1;}
function exampleHTML(w){
 const he=lang==='he',toks=w.x.split(' ');
 const verse=toks.map((t,i)=>i===w.i?`<mark>${esc(t)}</mark>`:esc(t)).join(' ');
 return `<div class="vc-example"><p lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${verse}</p><a href="./?q=${encodeURIComponent(w.r)}">${esc(w.r)} 원문 보기 ↗</a></div>`;
}
function cardHTML(){
 const w=session.queue[0],he=lang==='he',p=pronunciationFor(w.w,he),c=state.cards[w.id],flag=state.flags[w.id];
 const left=session.queue.length;
 return `<div class="vc-card"><div class="vc-card-top"><span>${c?'복습':'새 단어'} · ${rankOf(w)}위 · 성경에 ${w.c.toLocaleString()}회</span><span>남은 카드 ${left}</span></div>`
 +`<div class="vc-word" lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${esc(w.w)}</div>`
 +(session.revealed?`<div class="vc-back"><p class="vc-pron">${esc(p.korean)} <span>· ${esc(p.roman)}</span></p><p class="vc-gloss">${esc(w.g)}</p><p class="vc-badge">사전 기본 뜻 · Strong 정의 기반 자동 번역(검토 전)${he?` · Strong ${esc(w.id)}`:''}</p>${exampleHTML(w)}<div class="vc-answer"><button data-grade="0">모름<small>다시 보기</small></button><button data-grade="1">헷갈림<small>내일</small></button><button data-grade="2">알아요<small>${INTERVALS[Math.min(5,(c?.b||0)+1)]}일 뒤</small></button></div><button class="vc-flag${flag?' on':''}" id="flagWord" aria-pressed="${!!flag}">${flag?'✓ 뜻 확인 요청함':'뜻이 이상해요'}</button></div>`
 :`<button class="vc-reveal" id="reveal">뜻 보기 <small>스페이스</small></button>`)
 +`</div>`;
}
function grade(g){
 const w=session.queue.shift(),c=state.cards[w.id]||{b:0,d:0},t=today();
 if(!state.cards[w.id]){state.newToday++;}
 if(g===0){c.b=0;c.d=t;session.queue.push(w);}
 else if(g===1){c.b=Math.max(1,c.b-1);c.d=t+1;session.done++;}
 else{c.b=Math.min(5,c.b+1);c.d=t+INTERVALS[c.b];session.done++;session.right++;}
 state.cards[w.id]=c;saveState();session.revealed=false;renderStudy();
}
function renderStudy(){
 if(!session){$('vocabStudy').innerHTML='';return;}
 if(!session.queue.length){$('vocabStudy').innerHTML=`<div class="vc-card vc-done"><h3>오늘 학습 완료</h3><p>${session.done}장 중 ${session.right}장을 알았습니다. 지금까지 익힌 단어로 ${lang==='he'?'구약':'신약'} 본문 단어의 <b>${pct(coverage())}</b>를 읽을 수 있습니다.</p><button class="vc-start" id="endSession">확인</button></div>`;$('endSession').onclick=()=>{session=null;render();};return;}
 $('vocabStudy').innerHTML=cardHTML();
 if($('reveal'))$('reveal').onclick=()=>{session.revealed=true;renderStudy();};
 document.querySelectorAll('[data-grade]').forEach(b=>b.onclick=()=>grade(+b.dataset.grade));
 if($('flagWord'))$('flagWord').onclick=()=>{const id=session.queue[0].id;if(state.flags[id])delete state.flags[id];else state.flags[id]=1;saveState();renderStudy();};
 $('vocabStudy').scrollIntoView?.({block:'nearest'});
}
function status(w){const c=state.cards[w.id];if(!c)return ['new','새 단어'];if(c.b>=3)return ['solid','익힘'];if(c.b>=1)return ['learning','학습 중'];return ['again','다시'];}
function listHTML(start){
 const he=lang==='he',ranges=[];let cum=0;
 for(let i=0;i<vocab.words.length;i+=RANGE){const part=vocab.words.slice(i,i+RANGE);cum+=part.reduce((s,w)=>s+w.c,0);ranges.push({i,end:i+part.length,cum:cum/vocab.total});}
 const rows=vocab.words.slice(start,start+RANGE).map((w,k)=>{const [cls,label]=status(w),p=pronunciationFor(w.w,he);return `<tr><td>${start+k+1}</td><td class="vc-lw" lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${esc(w.w)}</td><td>${esc(p.korean)}</td><td>${esc(w.g)}</td><td class="vc-num">${w.c.toLocaleString()}</td><td><button class="vc-st ${cls}" data-mark="${esc(w.id)}" title="누르면 '익힘'으로 표시하거나 되돌립니다">${label}</button></td></tr>`;}).join('');
 return `<div class="vc-listhead"><label>범위 <select id="rangeSelect">${ranges.map(r=>`<option value="${r.i}" ${r.i===start?'selected':''}>${r.i+1}–${r.end}위 · 누적 ${pct(r.cum)}</option>`).join('')}</select></label><span>이미 아는 단어는 상태를 눌러 '익힘'으로 표시할 수 있습니다.</span></div><div class="vc-table"><table><thead><tr><th>순위</th><th>단어</th><th>발음</th><th>기본 뜻</th><th>횟수</th><th>상태</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function flagsHTML(){
 const ids=Object.keys(state.flags);if(!ids.length)return '';
 const items=ids.map(id=>vocab.words.find(w=>w.id===id)).filter(Boolean);
 return `<section class="lx-section"><h2>뜻 확인 요청 ${items.length}개</h2><p class="lx-sub">학습 중 "뜻이 이상해요"를 누른 단어입니다. 목록을 복사해 검토에 쓸 수 있습니다.</p><div class="vc-flags">${items.map(w=>`<span><b lang="${lang==='he'?'he':'el'}">${esc(w.w)}</b> ${esc(w.g)}</span>`).join('')}</div><button class="small-btn" id="copyFlags">목록 복사(탭 구분)</button> <span class="lx-sub" id="copyStatus" role="status"></span></section>`;
}
let listStart=0;
function render(){
 rollDay();
 document.querySelectorAll('[data-lang]').forEach(b=>{const on=b.dataset.lang===lang;b.classList.toggle('active',on);b.setAttribute?.('aria-pressed',String(on));});
 $('vocabTop').innerHTML=progressHTML();
 $('vocabList').innerHTML=listHTML(listStart);
 $('vocabFlags').innerHTML=flagsHTML();
 renderStudy();
 $('startSession').onclick=()=>{session=buildSession();render();};
 $('perDay').onchange=e=>{state.perDay=+e.target.value;saveState();render();};
 $('rangeSelect').onchange=e=>{listStart=+e.target.value;render();};
 document.querySelectorAll('[data-mark]').forEach(b=>b.onclick=()=>{const id=b.dataset.mark,c=state.cards[id];if(c&&c.b>=3)delete state.cards[id];else state.cards[id]={b:5,d:today()+INTERVALS[5]};saveState();render();});
 if($('copyFlags'))$('copyFlags').onclick=async()=>{const text=Object.keys(state.flags).map(id=>vocab.words.find(w=>w.id===id)).filter(Boolean).map(w=>[w.id,w.w,w.g].join('\t')).join('\n');try{await navigator.clipboard.writeText(text);$('copyStatus').textContent='복사했습니다.';}catch{$('copyStatus').textContent='복사하지 못했습니다.';}};
}
async function setLang(next){
 lang=next==='gr'?'gr':'he';session=null;listStart=0;state=loadState();
 try{history.replaceState(null,'',`#${lang}`);}catch{}
 $('vocabTop').innerHTML='<p class="notice">단어 목록을 불러오는 중…</p>';
 try{const r=await fetch(`data/vocab-${lang}.json`);if(!r.ok)throw Error();vocab=await r.json();render();}
 catch{$('vocabTop').innerHTML='<p class="notice">단어 목록을 불러오지 못했습니다. 페이지를 새로고침해주세요.</p>';}
}
function initVocab(){
 document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
 document.addEventListener?.('keydown',e=>{if(!session||!session.queue.length||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(!session.revealed&&e.key===' '){e.preventDefault();session.revealed=true;renderStudy();}else if(session.revealed&&['1','2','3'].includes(e.key))grade(+e.key-1);});
 return setLang(location.hash==='#gr'?'gr':'he');
}
