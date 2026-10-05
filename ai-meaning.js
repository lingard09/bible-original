'use strict';
function aiMeaningHTML(m,code){const lang=books.find(b=>b.code===code)?.testament==='ot'?'he':'gr';return `<section class="meaning-panel"><span class="eyebrow">AI MEANING IN CONTEXT</span><h4>원문 의미 풀이 <span class="ai-label">AI 생성 · 검토 전</span></h4><p class="meaning-reading">${esc(m.reading)}</p><h5>문맥 속 의미</h5><p>${esc(m.context)}</p><h5>핵심 원어 살펴보기</h5><div class="meaning-terms">${m.terms.map(t=>`<article><strong lang="${lang==='he'?'he':'el'}">${esc(t.original)}</strong><span>${esc(t.meaning)}</span>${termPronunciationHTML(t.original,lang)}<p>${esc(t.explanation)}</p></article>`).join('')}</div>${m.uncertainties.length?`<h5>해석에 주의할 점</h5><ul class="ai-uncertainties">${m.uncertainties.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:''}<p class="note">제공된 원문과 주변 구절을 바탕으로 AI가 작성한 학습용 설명입니다. 번역·문법 분석에 오류가 있을 수 있으므로 원문과 비교해 읽으세요.</p></section>`;}
function isAIMeaning(m){return m&&typeof m.reading==='string'&&typeof m.context==='string'&&Array.isArray(m.terms)&&m.terms.length&&m.terms.every(t=>['original','meaning','explanation'].every(k=>typeof t[k]==='string'))&&Array.isArray(m.uncertainties)&&m.uncertainties.every(t=>typeof t==='string');}
function meaningEndpoint(address){
 const raw=address.trim();
 const absolute=/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)?raw:'https://'+raw;
 let url;try{url=new URL(absolute);}catch{throw Error('AI 서버 주소가 올바르지 않습니다.');}
 if(url.protocol!=='https:')throw Error('AI 서버 주소는 https://로 시작해야 합니다.');
 if(url.username||url.password||url.search||url.hash)throw Error('AI 서버의 공개 HTTPS 주소만 설정해주세요.');
 url.pathname=url.pathname.replace(/\/$/,'').replace(/\/api\/meaning$/,'')+'/api/meaning';
 return url.href;
}
async function readMeaningResponse(response){
 const raw=await response.text();let value;
 try{value=JSON.parse(raw);}catch{throw Error(`AI 서버가 JSON 대신 다른 응답을 반환했습니다(HTTP ${response.status}). 서버 주소와 Cloudflare 배포 상태를 확인해주세요.`);}
 if(!response.ok)throw Error(typeof value?.error==='string'?value.error:`AI 서버 요청에 실패했습니다(HTTP ${response.status}).`);
 if(!isAIMeaning(value))throw Error('AI 서버의 풀이 응답 형식이 올바르지 않습니다.');
 return value;
}
async function loadAIMeaning(code,key){if(verseMeanings[`${code}.${key}`])return;const target=$('aiMeaning');if(!target)return;if(!MEANING_API_URL){target.innerHTML='<section class="meaning-panel"><h4>원문 의미 풀이</h4><p class="note">이 구절의 자동 의미 풀이를 준비 중입니다. 시편 57편 등 수록된 구절은 번역·문맥·핵심 단어 풀이를 바로 볼 수 있습니다.</p></section>';return;}
const id=requestId;target.innerHTML='<section class="meaning-panel"><h4>원문 의미 풀이</h4><p class="note" role="status">원문과 주변 구절을 분석하고 있습니다. 잠시 기다려주세요…</p></section>';try{const r=await fetch(meaningEndpoint(MEANING_API_URL),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,key}),signal:AbortSignal.timeout(110000)});const m=await readMeaningResponse(r);if(id!==requestId||!target.isConnected)return;if(!r.ok||!isAIMeaning(m))throw Error(m.error||'의미 풀이를 불러오지 못했습니다.');target.innerHTML=aiMeaningHTML(m,code);}catch(e){if(id!==requestId||!target.isConnected)return;target.innerHTML=`<section class="meaning-panel"><h4>원문 의미 풀이</h4><p class="note" role="status">${esc(e.name==='TimeoutError'?'분석 시간이 길어지고 있습니다. 다시 시도해주세요.':e.message)}</p><button id="retryMeaning" class="small-btn">풀이 다시 불러오기 ↗</button></section>`;$('retryMeaning').onclick=()=>loadAIMeaning(code,key);}}
