'use strict';
// 구절 학습 화면: 원문 단어 아래 발음·뜻을 붙인 단어별 보기, 번역, 탭으로 나눈 문맥 의미·핵심 단어·발음.
let studyState=null;
const studyStrip=s=>s.normalize('NFD').replace(/[̀-֑ͯ-ׇ]/g,'').replace(/ς/g,'σ').replace(/[^\p{L}\s]/gu,'').toLowerCase().trim();
const studyBare=s=>s.replace(/[^\p{L}\p{M}\s]/gu,'');
const STUDY_TABS=[['context','문맥 의미'],['terms','핵심 단어'],['pron','발음']];
function studyMode(){try{return localStorage.getItem('studyMode')==='sentence'?'sentence':'words';}catch{return 'words';}}
function studyTokens(v){return v.words?v.words.map(w=>({t:w.t,w})):v.text.split(/\s+/).filter(Boolean).map(t=>({t}));}
function normalizeMeaning(m){return {reading:m.reading,context:m.context,terms:m.terms.map(t=>Array.isArray(t)?{original:t[0],meaning:t[1],explanation:t[2]}:t),uncertainties:m.uncertainties||[]};}
function studyHTML(v,heb,code,key){
 const tokens=studyTokens(v),mode=studyMode(),lang=heb?'he':'el';
 studyState={tokens,heb,terms:[],matches:tokens.map(()=>({ti:-1}))};
 const words=tokens.map((x,i)=>`<button class="iw" id="iw${i}" data-word="${i}" aria-label="${esc(x.t)} 단어 정보"><span class="iw-o">${esc(x.t)}</span><span class="iw-p" lang="ko">${esc(pronunciationFor(studyBare(x.t),heb).korean)}</span><span class="iw-m" id="gloss${i}" lang="ko"></span></button>`).join(' ');
 return `<div class="study-top"><div class="study-toolbar"><span>단어를 누르면 발음·뜻${heb?'·Strong 번호':''}를 볼 수 있습니다.</span><div class="view-toggle" role="group" aria-label="원문 보기 방식"><button id="viewWords" class="${mode==='words'?'active':''}" aria-pressed="${mode==='words'}">단어별</button><button id="viewSentence" class="${mode==='sentence'?'active':''}" aria-pressed="${mode==='sentence'}">문장</button></div></div>`
  +`<div class="original interlinear${mode==='sentence'?' sentence':''}" id="studyOriginal" lang="${lang}" dir="${heb?'rtl':'ltr'}">${words}</div>`
  +`<div class="word-detail" id="wordDetail" hidden></div><div class="study-reading" id="studyReading"></div></div>`
  +`<div class="study-tabs" role="tablist">${STUDY_TABS.map(([k,l],i)=>`<button role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i===0}" class="${i===0?'active':''}">${l}</button>`).join('')}</div>`
  +STUDY_TABS.map(([k],i)=>`<div class="study-panel" role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}" ${i?'hidden':''}>${k==='pron'?pronunciationHTML(v.text,heb,code,key):''}</div>`).join('');
}
function studyMatch(tokens,terms){
 const keys=terms.map(t=>studyStrip(t.original).split(/\s+/).filter(Boolean));let prev=-1;
 return tokens.map(x=>{const w=studyStrip(x.t);const ti=w?keys.findIndex(k=>k.some(p=>w===p||(p.length>=3&&w.includes(p)))):-1;const label=ti>=0&&!(ti===prev&&keys[ti].length>1);prev=ti;return {ti,label};});
}
function setStudyStatus(message,retry){
 $('studyReading').innerHTML=`<span class="eyebrow">번역</span><p class="note" role="status">${esc(message)}</p>${retry?'<button id="retryMeaning" class="small-btn">풀이 다시 불러오기 ↗</button>':''}`;
 for(const k of ['context','terms'])$('panel-'+k).innerHTML=`<p class="note">${esc(message)}</p>`;
 if(retry)$('retryMeaning').onclick=retry;
}
function applyStudy(m,ai){
 if(!studyState)return;const {tokens,heb}=studyState,lang=heb?'he':'el';
 studyState.terms=m.terms;studyState.matches=studyMatch(tokens,m.terms);
 $('studyReading').innerHTML=`<span class="eyebrow">번역${ai?' <span class="ai-label">AI 생성 · 검토 전</span>':''}</span><p>${esc(m.reading)}</p>`;
 $('panel-context').innerHTML=`<p>${esc(m.context)}</p>${m.uncertainties.length?`<h5>해석에 주의할 점</h5><ul class="ai-uncertainties">${m.uncertainties.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<p class="note">${ai?'제공된 원문과 주변 구절을 바탕으로 AI가 작성한 학습용 설명입니다. 번역·문법 분석에 오류가 있을 수 있으므로 원문과 비교해 읽으세요.':'학습용 자체 번역·풀이입니다. 단어의 기본 뜻, 문장 구조와 문맥을 함께 살펴보며 해석이 갈리는 부분은 별도로 표시합니다.'}</p>`;
 $('panel-terms').innerHTML=`<div class="meaning-terms">${m.terms.map(t=>`<article><strong lang="${lang}">${esc(t.original)}</strong><span>${esc(t.meaning)}</span>${termPronunciationHTML(t.original,heb?'he':'gr')}<p>${esc(t.explanation)}</p></article>`).join('')}</div>`;
 $('tab-terms').textContent=`핵심 단어 ${m.terms.length}`;
 studyState.matches.forEach((r,i)=>{$('iw'+i).classList.toggle('has-term',r.ti>=0);$('gloss'+i).textContent=r.label?m.terms[r.ti].meaning:'';});
}
function showWordDetail(i){
 const x=studyState.tokens[i],heb=studyState.heb,p=pronunciationFor(studyBare(x.t),heb),term=studyState.terms[studyState.matches[i]?.ti];
 const codes=x.w?x.w.s.split('/').map(n=>n.replace(/[a-z\s]/g,'')).filter(n=>/^\d+$/.test(n)).map(n=>'H'+n):[];
 studyState.tokens.forEach((_,j)=>$('iw'+j).classList.toggle('selected',j===i));
 $('wordDetail').hidden=false;
 $('wordDetail').innerHTML=`<div class="wd-head"><strong lang="${heb?'he':'el'}" dir="${heb?'rtl':'ltr'}">${esc(x.t)}</strong><button class="wd-close" id="wdClose" aria-label="단어 정보 닫기">×</button></div><p class="wd-pron">${esc(p.korean)} <span>· ${esc(p.roman)} · 자동 전사</span></p>${term?`<p class="wd-term"><b>${esc(term.meaning)}</b>${esc(term.explanation)}</p>`:'<p class="wd-term wd-empty">이 단어는 핵심 원어 풀이에 포함되어 있지 않습니다.</p>'}${x.w?`<p class="wd-meta">Strong ${esc(codes.join(' / ')||x.w.s)} · 형태 코드 ${esc(x.w.m)} (OSHB 원본 코드)</p>${codes.length?`<div class="wd-actions">${codes.map(c=>`<button class="small-btn" data-query="${c}">${c} 성경 전체 용례 ↗</button>`).join('')}</div>`:''}`:''}`;
 $('wdClose').onclick=()=>{$('wordDetail').hidden=true;studyState.tokens.forEach((_,j)=>$('iw'+j).classList.toggle('selected',false));};
 bindQueries();
}
function selectStudyTab(name){for(const [k] of STUDY_TABS){const on=k===name;$('tab-'+k).classList.toggle('active',on);$('tab-'+k).setAttribute?.('aria-selected',String(on));$('panel-'+k).hidden=!on;}}
function setStudyMode(mode){try{localStorage.setItem('studyMode',mode);}catch{}$('studyOriginal').classList.toggle('sentence',mode==='sentence');for(const [id,m] of [['viewWords','words'],['viewSentence','sentence']]){$(id).classList.toggle('active',m===mode);$(id).setAttribute?.('aria-pressed',String(m===mode));}}
function bindStudy(){
 studyState.tokens.forEach((_,i)=>$('iw'+i).onclick=()=>showWordDetail(i));
 for(const [k] of STUDY_TABS)$('tab-'+k).onclick=()=>selectStudyTab(k);
 $('viewWords').onclick=()=>setStudyMode('words');$('viewSentence').onclick=()=>setStudyMode('sentence');
}
