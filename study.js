'use strict';
// 구절 학습 화면: 원문 단어 아래 발음·뜻을 붙인 단어별 보기, 번역, 탭으로 나눈 문맥 의미·핵심 단어·발음.
let studyState=null;
// 모든 단어의 기본 뜻과 형태: 히브리어는 Strong 번호, 헬라어는 MorphGNT 표제어 번호로 찾는 한국어 사전 뜻.
const studyFiles={};
function loadStudyFile(path){return studyFiles[path]??=fetch(path).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{delete studyFiles[path];return null;});}
const studyStrong=w=>w?.s.split('/').map(n=>n.replace(/[a-z\s]/g,'')).filter(n=>/^\d+$/.test(n)).pop();
function studyBasic(x,i,heb,g){if(!g)return '';if(heb)return g[studyStrong(x.w)]||'';const l=studyState.lemmas;return l?.length===studyState.tokens.length?g.glosses[l[i]]||'':'';}
const studyStrip=s=>s.normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g,'').replace(/ς/g,'σ').replace(/[^\p{L}\s]/gu,'').toLowerCase().trim();
const studyBare=s=>s.replace(/[^\p{L}\p{M}\s]/gu,'');
const STUDY_TABS=[['context','문맥 의미'],['terms','핵심 단어'],['pron','발음']];
function studyMode(){try{return localStorage.getItem('studyMode')==='sentence'?'sentence':'words';}catch{return 'words';}}
function studyTokens(v){return v.words?v.words.map(w=>({t:w.t,w})):v.text.split(/\s+/).filter(Boolean).map(t=>({t}));}
function normalizeMeaning(m){return {reading:m.reading,context:m.context,terms:m.terms.map(t=>Array.isArray(t)?{original:t[0],meaning:t[1],explanation:t[2]}:t),uncertainties:m.uncertainties||[]};}
function studyHTML(v,heb,code,key){
 const tokens=studyTokens(v),mode=studyMode(),lang=heb?'he':'el';
 studyState={tokens,heb,lemmas:v.l,parse:v.p,terms:[],matches:tokens.map(()=>({ti:-1})),basic:[]};
 const words=tokens.map((x,i)=>`<button class="iw" id="iw${i}" data-word="${i}" aria-label="${esc(x.t)} 단어 정보"><span class="iw-o">${esc(x.t)}</span><span class="iw-p" lang="ko">${esc(pronunciationFor(studyBare(x.t),heb).korean)}</span><span class="iw-m" id="gloss${i}" lang="ko"></span></button>`).join(' ');
 return `<div class="study-top"><div class="study-toolbar"><span>단어를 누르면 발음·뜻${heb?'·Strong 번호':''}를 볼 수 있습니다. <span class="gloss-key"><i class="key-term"></i>문맥 뜻 <i class="key-basic"></i>사전 기본 뜻</span></span><div class="view-toggle" role="group" aria-label="원문 보기 방식"><button id="viewWords" class="${mode==='words'?'active':''}" aria-pressed="${mode==='words'}">단어별</button><button id="viewSentence" class="${mode==='sentence'?'active':''}" aria-pressed="${mode==='sentence'}">문장</button></div></div>`
  +`<div class="original interlinear${mode==='sentence'?' sentence':''}" id="studyOriginal" lang="${lang}" dir="${heb?'rtl':'ltr'}">${words}</div>`
  +`<div class="vocab-line" id="vocabLine" hidden></div><div class="word-detail" id="wordDetail" hidden></div><div class="study-reading" id="studyReading"></div></div>`
  +`<div class="study-tabs" role="tablist">${STUDY_TABS.map(([k,l],i)=>`<button role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i===0}" class="${i===0?'active':''}">${l}</button>`).join('')}</div>`
  +STUDY_TABS.map(([k],i)=>`<div class="study-panel" role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}" ${i?'hidden':''}>${k==='pron'?pronunciationHTML(v.text,heb,code,key):''}</div>`).join('');
}
// 핵심 단어와 본문 단어 맞추기: 히브리어는 같은 형태이거나 앞에 접두어(ו ב ל ה מ כ ש, 최대 3자)만 붙은 경우,
// 헬라어는 같은 형태이거나 4자 이상 부분이 겹치는 경우. 단순 부분 일치는 בְּרֵאשִׁית 안의 ברא처럼 엉뚱한 단어를 잡습니다.
const studyTermHit=(w,p,heb)=>w===p||(heb?w.endsWith(p)&&/^[ובלהמכש]{1,3}$/.test(w.slice(0,w.length-p.length)):p.length>=4&&w.includes(p));
function studyMatch(tokens,terms,heb){
 const keys=terms.map(t=>studyStrip(t.original).split(/\s+/).filter(Boolean));let prev=-1;
 return tokens.map(x=>{const w=studyStrip(x.t);const ti=w?keys.findIndex(k=>k.some(p=>studyTermHit(w,p,heb))):-1;const label=ti>=0&&!(ti===prev&&keys[ti].length>1);prev=ti;return {ti,label};});
}
function setStudyStatus(message,retry){
 $('studyReading').innerHTML=`<span class="eyebrow">번역</span><p class="note" role="status">${esc(message)}</p>${retry?'<button id="retryMeaning" class="small-btn">풀이 다시 불러오기 ↗</button>':''}`;
 for(const k of ['context','terms'])$('panel-'+k).innerHTML=`<p class="note">${esc(message)}</p>`;
 if(retry)$('retryMeaning').onclick=retry;
}
function applyStudy(m,ai){
 if(!studyState)return;const {tokens,heb}=studyState,lang=heb?'he':'el';
 studyState.terms=m.terms;studyState.matches=studyMatch(tokens,m.terms,heb);
 $('studyReading').innerHTML=`<span class="eyebrow">번역${ai?' <span class="ai-label">AI 생성 · 검토 전</span>':''}</span><p>${esc(m.reading)}</p>`;
 $('panel-context').innerHTML=`<p>${esc(m.context)}</p>${m.uncertainties.length?`<h5>해석에 주의할 점</h5><ul class="ai-uncertainties">${m.uncertainties.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<p class="note">${ai?'제공된 원문과 주변 구절을 바탕으로 AI가 작성한 학습용 설명입니다. 번역·문법 분석에 오류가 있을 수 있으므로 원문과 비교해 읽으세요.':'학습용 자체 번역·풀이입니다. 단어의 기본 뜻, 문장 구조와 문맥을 함께 살펴보며 해석이 갈리는 부분은 별도로 표시합니다.'}</p>`;
 $('panel-terms').innerHTML=`<div class="meaning-terms">${m.terms.map(t=>`<article><strong lang="${lang}">${esc(t.original)}</strong><span>${esc(t.meaning)}</span>${termPronunciationHTML(t.original,heb?'he':'gr')}<p>${esc(t.explanation)}</p></article>`).join('')}</div>`;
 $('tab-terms').textContent=`핵심 단어 ${m.terms.length}`;
 renderGlosses();
}
// 단어 아래 라벨은 짧게: 쉼표로 나뉜 기본 뜻 중 앞의 것(두 개를 합쳐 10자 이하면 두 개)만 보이고, 전체 뜻은 단어 상세에 있습니다.
// 세미콜론으로 이어진 뜻(예: 매다; (δεῖ) ~해야 한다)은 나누지 않습니다.
function shortGloss(g){const parts=g.split(/,\s*/);return parts.length<2?g:parts.slice(0,2).join(', ').length<=10?parts.slice(0,2).join(', '):parts[0];}
function renderGlosses(){
 const {matches,terms,basic}=studyState;
 matches.forEach((r,i)=>{const term=r.label?terms[r.ti].meaning:'',g=$('gloss'+i),full=basic[i]||'';$('iw'+i).classList.toggle('has-term',r.ti>=0);g.textContent=term||shortGloss(full);if(g.setAttribute)g.setAttribute('title',term||full);g.classList.toggle('basic',!term);});
}
async function applyBasicGlosses(){
 const s=studyState,greekMorph=!s.heb&&s.parse?.length===s.tokens.length;
 const [g,table]=await Promise.all([loadStudyFile(`data/glosses-${s.heb?'he':'gr'}.json`),greekMorph?loadStudyFile('data/morph-gr.json'):null]);if(s!==studyState)return;
 if(table)s.morphCodes=s.parse.map(n=>table[n]);
 if(g){s.basic=s.tokens.map((x,i)=>studyBasic(x,i,s.heb,g));if(!s.heb&&s.lemmas?.length===s.tokens.length)s.lemmaText=s.lemmas.map(n=>g.lemmas[n]);renderGlosses();}
 if(s.selected!==undefined)showWordDetail(s.selected);
}
// 단어 학습 진도와 연결: 학습 목록(빈도순 표제어)에 있지만 아직 익히지 않은 단어를 표시합니다. 진도는 vocab.js와 같은 localStorage 키를 씁니다.
const vocabToday=()=>{const d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/864e5);};
function vocabProgress(lang){try{const p=JSON.parse(localStorage.getItem('vocab:'+lang)||'{}');return {...p,cards:p.cards||{}};}catch{return {cards:{}};}}
function vocabSave(lang,p){try{localStorage.setItem('vocab:'+lang,JSON.stringify(p));}catch{}}
function showUnlearned(){try{return localStorage.getItem('studyUnlearned')!=='off';}catch{return true;}}
function studyVocabIds(s){return s.tokens.map((x,i)=>{if(s.heb){const n=studyStrong(x.w);return n?'H'+n:null;}return s.lemmas?.length===s.tokens.length?String(s.lemmas[i]):null;});}
async function applyVocabMarks(){
 const s=studyState,idx=await loadStudyFile('data/vocab-index.json');if(s!==studyState||!idx)return;
 const lang=s.heb?'he':'gr';s.vocab={lang,ids:studyVocabIds(s),rank:new Map(idx[lang].map((id,i)=>[id,i+1]))};s.reviewed=(await loadStudyFile('data/gloss-review.json'))?.[lang]||{};if(s!==studyState)return;
 renderVocabMarks();if(s.selected!==undefined)showWordDetail(s.selected);
}
function renderVocabMarks(){
 const v=studyState?.vocab;if(!v)return;
 const cards=vocabProgress(v.lang).cards,started=Object.keys(cards).length>0,on=started&&showUnlearned(),list=new Set(),known=new Set();
 v.ids.forEach((id,i)=>{const inList=!!(id&&v.rank.has(id)),k=inList&&(cards[id]?.b||0)>=1;if(inList){list.add(id);if(k)known.add(id);}$('iw'+i).classList.toggle('unlearned',on&&inList&&!k);});
 const line=$('vocabLine');
 if(!started||!list.size){line.hidden=true;line.innerHTML='';return;}
 line.hidden=false;
 line.innerHTML=`<span>단어 학습 기준 이 구절의 학습 단어 ${list.size}개 중 <b>${known.size}개</b>를 압니다${on&&list.size>known.size?` · <i class="unlearned-key"></i>안 배운 단어 ${list.size-known.size}개`:''}</span><span class="vl-actions"><button class="vl-btn" id="toggleUnlearned">${showUnlearned()?'표시 끄기':'안 배운 단어 표시'}</button><a href="vocab.html#${v.lang}">단어 학습 →</a></span>`;
 $('toggleUnlearned').onclick=()=>{try{localStorage.setItem('studyUnlearned',showUnlearned()?'off':'on');}catch{}renderVocabMarks();};
}
function vocabDetailHTML(i){
 const v=studyState.vocab;if(!v)return '';const id=v.ids[i];
 if(!id||!v.rank.has(id))return '<p class="wd-vocab wd-empty">단어 학습 목록 밖의 단어입니다(10회 미만 또는 고유명사).</p>';
 const c=vocabProgress(v.lang).cards[id],label=!c?'아직 안 배움':c.b>=3?'익힘':c.b>=1?'학습 중':'복습 예정';
 return `<p class="wd-vocab"><b>단어 학습 ${v.rank.get(id)}위</b> · ${label}${c?'':' <button class="small-btn" id="addVocab">오늘 학습에 추가</button>'}</p>`;
}
function addToVocab(i){
 const v=studyState.vocab,p=vocabProgress(v.lang);p.cards[v.ids[i]]={b:0,d:vocabToday()};vocabSave(v.lang,p);renderVocabMarks();showWordDetail(i);
}
function showWordDetail(i){
 studyState.selected=i;
 const x=studyState.tokens[i],heb=studyState.heb,p=pronunciationFor(studyBare(x.t),heb),term=studyState.terms[studyState.matches[i]?.ti];
 const codes=x.w?x.w.s.split('/').map(n=>n.replace(/[a-z\s]/g,'')).filter(n=>/^\d+$/.test(n)).map(n=>'H'+n):[],basic=studyState.basic[i],greekCode=heb?'':studyState.morphCodes?.[i],morph=heb?morphHebrew(x.w?.m):morphGreek(greekCode);
 studyState.tokens.forEach((_,j)=>$('iw'+j).classList.toggle('selected',j===i));
 $('wordDetail').hidden=false;
 $('wordDetail').innerHTML=`<div class="wd-head"><strong lang="${heb?'he':'el'}" dir="${heb?'rtl':'ltr'}">${esc(x.t)}</strong><button class="wd-close" id="wdClose" aria-label="단어 정보 닫기">×</button></div><p class="wd-pron">${esc(p.korean)} <span>· ${esc(p.roman)} · 자동 전사</span></p>${basic?`<p class="wd-basic"><b>기본 뜻</b>${esc(basic)} <span>· ${studyState.lemmaText?`표제어 ${esc(studyState.lemmaText[i])} · `:''}${studyState.reviewed?.[studyState.vocab?.ids[i]]?'검토한 기본 뜻':'Strong 사전 기반 자동 번역'}</span></p>`:''}${morphHTML(morph)}${vocabDetailHTML(i)}${term?`<p class="wd-term"><b>${esc(term.meaning)}</b>${esc(term.explanation)}</p>`:'<p class="wd-term wd-empty">이 구절의 핵심 원어 풀이에는 포함되어 있지 않습니다.</p>'}${x.w?`<p class="wd-meta">Strong ${esc(codes.join(' / ')||x.w.s)} · OSHB 형태 코드 ${esc(x.w.m)}</p>${codes.length?`<div class="wd-actions">${codes.map(c=>`<button class="small-btn" data-query="${c}">${c} 성경 전체 용례 ↗</button>`).join('')}</div>`:''}`:greekCode?`<p class="wd-meta">MorphGNT 형태 코드 ${esc(greekCode)}</p>`:''}`;
 $('wdClose').onclick=()=>{$('wordDetail').hidden=true;studyState.selected=undefined;studyState.tokens.forEach((_,j)=>$('iw'+j).classList.toggle('selected',false));};
 if($('addVocab'))$('addVocab').onclick=()=>addToVocab(i);
 bindQueries();
}
function selectStudyTab(name){for(const [k] of STUDY_TABS){const on=k===name;$('tab-'+k).classList.toggle('active',on);$('tab-'+k).setAttribute?.('aria-selected',String(on));$('panel-'+k).hidden=!on;}}
function setStudyMode(mode){try{localStorage.setItem('studyMode',mode);}catch{}$('studyOriginal').classList.toggle('sentence',mode==='sentence');for(const [id,m] of [['viewWords','words'],['viewSentence','sentence']]){$(id).classList.toggle('active',m===mode);$(id).setAttribute?.('aria-pressed',String(m===mode));}}
function bindStudy(){
 studyState.tokens.forEach((_,i)=>$('iw'+i).onclick=()=>showWordDetail(i));
 for(const [k] of STUDY_TABS)$('tab-'+k).onclick=()=>selectStudyTab(k);
 $('viewWords').onclick=()=>setStudyMode('words');$('viewSentence').onclick=()=>setStudyMode('sentence');
 applyBasicGlosses();applyVocabMarks();
}
// 다른 탭의 단어 학습 진도가 바뀌면 표시를 다시 계산합니다.
if(typeof addEventListener==='function')addEventListener('storage',e=>{if(e.key?.startsWith('vocab:')&&studyState?.vocab){renderVocabMarks();if(studyState.selected!==undefined)showWordDetail(studyState.selected);}});
