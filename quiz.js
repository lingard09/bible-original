'use strict';
// 형태 분석 퀴즈: 실제 구절의 단어를 보고 시제·태·법·인칭·격 등을 하나씩 맞힙니다.
// 정답은 OSHB(히브리어)·MorphGNT(헬라어) 형태 분석이고, 용어는 morph.js의 한국어 표를 씁니다.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
const ROUND=10;
// 받침 유무에 따라 은/는
const topic=w=>{const c=w.charCodeAt(w.length-1)-0xac00;return w+(c>=0&&c<11172&&c%28?'은':'는');};
let lang='he',data=null,pool=[],round=null,filters={pos:'all',top:100,known:false};
// 문항 단계: [키, 질문, 정답 문자열]. 정답이 없는 단계(분석 정보 없음)는 뺍니다.
function hebrewSteps(code){
 const main=code.slice(1).split('/').find(s=>/^[VN]/.test(s));
 if(main[0]==='V'){
  const conj=main[2],f=main.slice(3),finite=!'rsac'.includes(conj),part='rs'.includes(conj);
  const steps=[['stem','어간',HE_STEMS[main[1]]],['conj','활용형',HE_CONJ[conj]]];
  if(finite)steps.push(['pgn','인칭·성·수',[HE_PERSON[f[0]],HE_GENDER[f[1]],HE_NUMBER[f[2]]].filter(Boolean).join(' ')]);
  if(part)steps.push(['gn','성·수',[HE_GENDER[f[0]],HE_NUMBER[f[1]]].filter(Boolean).join(' ')],['state','상태',HE_STATE[f[2]]]);
  return {pos:'동사',steps:steps.filter(s=>s[2])};
 }
 return {pos:'명사',steps:[['gender','성',HE_GENDER[main[2]]],['number','수',HE_NUMBER[main[3]]],['state','상태',HE_STATE[main[4]]]].filter(s=>s[2])};
}
function greekSteps(c){
 const [person,tense,voice,mood,cs,num,gen]=c.slice(2);
 if(c[0]==='V'){
  const steps=[['tense','시제',GR_TENSE[tense]],['voice','태',GR_VOICE[voice]],['mood','법',GR_MOOD[mood]]];
  if('IDSO'.includes(mood))steps.push(['pn','인칭·수',`${GR_PERSON[person]} ${GR_NUMBER[num]}`]);
  if(mood==='P')steps.push(['cn','격·수',`${GR_CASE[cs]} ${GR_NUMBER[num]}`]);
  return {pos:'동사',steps:steps.filter(s=>s[2])};
 }
 return {pos:'명사',steps:[['case','격',GR_CASE[cs]],['number','수',GR_NUMBER[num]],['gender','성',GR_GENDER[gen]]].filter(s=>s[2])};
}
const stepsFor=item=>lang==='he'?hebrewSteps(item.m):greekSteps(item.m);
// 단계별 보기 후보: 데이터에 실제로 나오는 값만 씁니다.
let optionPool={};
function buildOptionPool(){optionPool={};for(const it of data.items)for(const [k,,a] of stepsFor(it).steps)(optionPool[k]??=new Set()).add(a);}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function optionsFor(key,answer){return shuffle([answer,...shuffle([...optionPool[key]].filter(v=>v!==answer)).slice(0,3)]);}
function vocabCards(){try{return JSON.parse(localStorage.getItem('vocab:'+lang)||'{}').cards||{};}catch{return {};}}
function loadStats(){try{return JSON.parse(localStorage.getItem('quiz:'+lang)||'{}');}catch{return {};}}
function saveStats(s){try{localStorage.setItem('quiz:'+lang,JSON.stringify(s));}catch{}}
function filteredPool(){
 const cards=vocabCards();
 return data.items.filter(it=>{const [,,rank]=data.lemmas[it.id];if(rank>filters.top)return false;if(filters.known&&!((cards[it.id]?.b||0)>=1))return false;const p=stepsFor(it).pos;return filters.pos==='all'||(filters.pos==='verb'?p==='동사':p==='명사');});
}
function controlsHTML(){
 const known=Object.values(vocabCards()).filter(c=>c.b>=1).length,stats=loadStats();
 const weak=Object.entries(stats).filter(([,v])=>v.t>=5).map(([k,v])=>[v.l,v.r/v.t]).sort((a,b)=>a[1]-b[1]).slice(0,3);
 return `<div class="qz-controls"><label>품사 <select id="fPos"><option value="all">동사·명사</option><option value="verb" ${filters.pos==='verb'?'selected':''}>동사만</option><option value="noun" ${filters.pos==='noun'?'selected':''}>명사만</option></select></label><label>단어 범위 <select id="fTop">${[[50,'상위 50단어'],[100,'상위 100단어'],[300,'상위 300단어'],[500,'상위 500단어']].map(([n,l])=>`<option value="${n}" ${filters.top===n?'selected':''}>${l}</option>`).join('')}</select></label>${known?`<label class="qz-check"><input type="checkbox" id="fKnown" ${filters.known?'checked':''}> 단어 학습에서 익힌 단어만(${known}개)</label>`:''}</div>`
 +`<div class="qz-start"><button class="vc-start" id="startQuiz" ${pool.length?'':'disabled'}>${pool.length?`${ROUND}문제 풀기`:'조건에 맞는 문제가 없습니다'}</button><span>${pool.length.toLocaleString()}개 형태 중 무작위 출제</span></div>`
 +(weak.length?`<p class="qz-weak">자주 틀리는 항목: ${weak.map(([l,r])=>`<b>${esc(l)}</b> ${Math.round(r*100)}%`).join(' · ')}</p>`:'');
}
function newRound(){const picks=shuffle([...pool]).slice(0,ROUND);round={items:picks,at:0,step:0,answers:[],right:0,total:0,byKey:{}};renderQuestion();}
function verseHTML(it){
 const he=lang==='he',toks=data.verses[it.r].split(' ');
 return `<p class="qz-verse" lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${toks.map((t,i)=>i===it.i?`<mark>${esc(t)}</mark>`:esc(t)).join(' ')}</p>`;
}
function renderQuestion(){
 const it=round.items[round.at],{pos,steps}=stepsFor(it),[lemma,gloss]=data.lemmas[it.id],he=lang==='he';
 const done=round.step>=steps.length,step=steps[round.step];
 const prefix=he&&it.m.slice(1).split('/')[0][0]!==it.m.slice(1).split('/').find(s=>/^[VN]/.test(s))[0];
 if(!done&&!round.opts)round.opts=optionsFor(step[0],step[2]);
 $('quizArea').innerHTML=`<div class="vc-card qz-card"><div class="vc-card-top"><span>${round.at+1} / ${round.items.length}</span><span>${round.total?`${round.total}개 중 ${round.right}개 정답`:''}</span></div>`
 +verseHTML(it)
 +`<p class="qz-lemma"><b>${pos}</b> · 표제어 <span lang="${he?'he':'el'}">${esc(lemma)}</span> (${esc(gloss)})${prefix?' · 앞에 접두어가 붙은 형태입니다':''}</p>`
 +`<ol class="qz-steps">${steps.map(([k,q,a],i)=>{const ans=round.answers[i];return `<li class="${i<round.step?(ans===a?'ok':'no'):i===round.step&&!done?'now':''}"><span>${q}</span>${i<round.step?`<b>${esc(a)}</b>${ans!==a?` <s>${esc(ans)}</s>`:''}`:''}</li>`;}).join('')}</ol>`
 +(done?`<div class="qz-full">${morphHTML(he?morphHebrew(it.m):morphGreek(it.m))}<a href="./?q=${encodeURIComponent(it.r)}">${esc(it.r)} 원문 보기 ↗</a></div><button class="vc-start qz-next" id="nextWord">${round.at+1<round.items.length?'다음 단어 →':'결과 보기'}</button>`
 :`<p class="qz-q">${esc(topic(step[1]))}?</p><div class="lx-qopts">${round.opts.map((o,i)=>`<button class="lx-qopt" data-opt="${i}">${esc(o)}</button>`).join('')}</div>`)
 +`</div><p class="qz-source">정답은 ${he?'OSHB':'MorphGNT'} 형태 분석 기준입니다.</p>`;
 document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>answer(round.opts[+b.dataset.opt]));
 if($('nextWord'))$('nextWord').onclick=()=>{round.at++;round.step=0;round.answers=[];round.opts=null;if(round.at<round.items.length)renderQuestion();else renderResult();};
}
function answer(choice){
 const it=round.items[round.at],[key,label,correct]=stepsFor(it).steps[round.step],ok=choice===correct;
 round.answers.push(choice);round.total++;if(ok)round.right++;
 const k=(round.byKey[key]??={l:label,r:0,t:0});k.t++;if(ok)k.r++;
 const stats=loadStats(),s=(stats[key]??={l:label,r:0,t:0});s.t++;if(ok)s.r++;saveStats(stats);
 round.step++;round.opts=null;renderQuestion();
}
function renderResult(){
 const rows=Object.values(round.byKey).map(k=>`<li><span>${esc(k.l)}</span><b>${k.r} / ${k.t}</b></li>`).join('');
 $('quizArea').innerHTML=`<div class="vc-card vc-done"><h3>${round.total}개 항목 중 ${round.right}개 정답</h3><ul class="qz-result">${rows}</ul><button class="vc-start" id="againQuiz">다시 풀기</button></div>`;
 $('againQuiz').onclick=newRound;render();
}
function render(){
 pool=filteredPool();
 document.querySelectorAll('[data-lang]').forEach(b=>{const on=b.dataset.lang===lang;b.classList.toggle('active',on);b.setAttribute?.('aria-pressed',String(on));});
 $('quizTop').innerHTML=controlsHTML();
 $('fPos').onchange=e=>{filters.pos=e.target.value;render();};
 $('fTop').onchange=e=>{filters.top=+e.target.value;render();};
 if($('fKnown'))$('fKnown').onchange=e=>{filters.known=e.target.checked;render();};
 $('startQuiz').onclick=newRound;
}
async function setLang(next){
 lang=next==='gr'?'gr':'he';round=null;filters.known=false;$('quizArea').innerHTML='';
 try{history.replaceState(null,'',`#${lang}`);}catch{}
 $('quizTop').innerHTML='<p class="notice">문제를 불러오는 중…</p>';
 try{const r=await fetch(`data/quiz-${lang}.json`);if(!r.ok)throw Error();data=await r.json();buildOptionPool();render();}
 catch{$('quizTop').innerHTML='<p class="notice">문제를 불러오지 못했습니다. 페이지를 새로고침해주세요.</p>';}
}
function initQuiz(){document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));return setLang(location.hash==='#gr'?'gr':'he');}
