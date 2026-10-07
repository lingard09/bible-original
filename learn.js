'use strict';
// 원어 입문: 히브리어·헬라어 글자, 모음 부호, 실제 성경 단어로 읽기 연습과 글자 퀴즈.
// 소리 표기는 pronunciation.js와 같은 학습용 기준(히브리어 현대식 자음 + 모음 표기, 헬라어 에라스뮈스식)을 따릅니다.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
// 한국어 문장 속 히브리어는 글자 묶음마다 방향을 분리해 순서가 뒤집히지 않게 합니다.
const mixed=s=>esc(s).replace(/[\u0590-\u05ff]+/g,m=>`<bdi lang="he">${m}</bdi>`);
// [글자, 한국어 이름, 영어 이름, 로마자, 한글 근사, 메모]
const HE_LETTERS=[
 ['א','알레프','Aleph','ʾ','(묵음)','자체 소리가 거의 없고 붙은 모음만 읽습니다.'],
 ['ב','베트','Bet','b / v','ㅂ','점(다게쉬)이 있으면 b(בּ), 없으면 v(ב).'],
 ['ג','기멜','Gimel','g','ㄱ',''],
 ['ד','달레트','Dalet','d','ㄷ','ר(레쉬)와 모양이 비슷합니다. 오른쪽 위 모서리가 각져 있습니다.'],
 ['ה','헤','He','h','ㅎ','단어 끝의 ה는 보통 소리 나지 않습니다.'],
 ['ו','바브','Vav','v','ㅂ','고대에는 w. וּ는 u, וֹ는 o로 읽는 모음 글자로도 쓰입니다. 단어 첫머리의 ו는 대개 접속사 "그리고"입니다.'],
 ['ז','자인','Zayin','z','ㅈ',''],
 ['ח','헤트','Het','ḥ','ㅎ','목 깊은 곳에서 긁는 ㅎ(독일어 Bach의 ch). ה(헤)와 구별합니다.'],
 ['ט','테트','Tet','ṭ','ㅌ','오늘날 ת(타브)와 같은 소리로 읽습니다.'],
 ['י','요드','Yod','y','ㅣ 계열','가장 작은 글자. 모음 글자로도 쓰입니다(예: אִישׁ의 י는 긴 i).'],
 ['כ','카프','Kaf','k / kh','ㅋ / ㅎ','점이 있으면 k(כּ), 없으면 목 깊은 kh(כ). 단어 끝에서는 ך.'],
 ['ל','라메드','Lamed','l','ㄹ','위로 솟은 유일한 글자.'],
 ['מ','멤','Mem','m','ㅁ','단어 끝에서는 ם.'],
 ['נ','눈','Nun','n','ㄴ','단어 끝에서는 ן.'],
 ['ס','사메크','Samekh','s','ㅅ','ם(끝 멤)과 비슷하지만 아래가 둥급니다.'],
 ['ע','아인','Ayin','ʿ','(묵음)','본래 목 깊은 울림소리. 오늘날 대개 소리 내지 않고 모음만 읽습니다.'],
 ['פ','페','Pe','p / f','ㅍ','점이 있으면 p(פּ), 없으면 f(פ). 단어 끝에서는 ף.'],
 ['צ','차데','Tsade','ts','ㅊ','단어 끝에서는 ץ.'],
 ['ק','코프','Qof','q','ㅋ','본래 목 뒤쪽에서 내는 k.'],
 ['ר','레쉬','Resh','r','ㄹ','ד(달레트)와 달리 오른쪽 위가 둥급니다.'],
 ['ש','쉰 / 신','Shin / Sin','sh / s','쉬 / ㅅ','오른쪽 위 점이면 쉰 sh(שׁ), 왼쪽 위 점이면 신 s(שׂ).'],
 ['ת','타브','Tav','t','ㅌ','']
];
const HE_FINALS=[['כ','ך'],['מ','ם'],['נ','ן'],['פ','ף'],['צ','ץ']];
const HE_CONFUSE=[['ב','כ','아래 가로획 끝이 튀어나오면 ב, 둥글게 이어지면 כ'],['ד','ר','오른쪽 위가 각지면 ד, 둥글면 ר'],['ה','ח','ת','ה는 왼쪽 기둥이 떨어져 있고, ח는 붙어 있으며, ת는 왼쪽 아래에 발이 있습니다'],['ו','ז','ן','ו는 머리가 왼쪽으로 살짝, ז는 머리가 양쪽으로, ן은 아래로 길게 내려옵니다'],['ט','מ','ט는 위가 열리고 안으로 말려 있고, מ는 왼쪽 아래가 열려 있습니다'],['ס','ם','ס는 아래가 둥글고, ם은 사각형입니다'],['ג','נ','ג는 왼쪽 아래에 발이 있고, נ은 아래가 평평합니다']];
// [표시용 모음(ב 위에), 데이터 키, 이름, 로마자, 한글, 메모]
const HE_VOWELS=[
 ['בָ','ָ','카메츠','ā','아','드물게 짧은 o(카메츠 하투프)로 읽습니다. 예: כָּל(콜, 모든)'],
 ['בַ','ַ','파타흐','a','아','단어 끝 ח·ע 아래에서는 자음보다 먼저 읽습니다. 예: רוּחַ 루아흐'],
 ['בֵ','ֵ','체레','ē','에',''],
 ['בֶ','ֶ','세골','e','에',''],
 ['בִ','ִ','히렉','i','이',''],
 ['בִי','ִי','히렉 요드','ī','이','י가 모음 글자로 쓰여 긴 i를 나타냅니다.'],
 ['בֹ','ֹ','홀렘','ō','오','글자 왼쪽 위의 점.'],
 ['בוֹ','וֹ','홀렘 바브','ō','오','ו 위의 점. 자음 v가 아니라 모음 o입니다.'],
 ['בֻ','ֻ','키부츠','u','우','비스듬한 점 세 개.'],
 ['בוּ','וּ','슈렉','ū','우','ו 가운데 점. 자음 v가 아니라 모음 u입니다.'],
 ['בְ','ְ','셰바','e / 묵음','에 / 묵음','아주 짧은 "에"로 읽거나(유성), 소리 내지 않습니다(무성). 단어 첫 글자 아래의 셰바는 소리 납니다.'],
 ['חֲ','ֲ','하테프 파타흐','ă','짧은 아','셰바와 모음이 합쳐진 아주 짧은 모음. 주로 후음(א ה ח ע) 아래에 옵니다.'],
 ['אֱ','ֱ','하테프 세골','ĕ','짧은 에',''],
 ['חֳ','ֳ','하테프 카메츠','ŏ','짧은 오','']
];
// [대문자, 소문자, 한국어 이름, 영어 이름, 로마자, 한글 근사, 메모]
const GR_LETTERS=[
 ['Α','α','알파','alpha','a','아',''],['Β','β','베타','beta','b','ㅂ',''],
 ['Γ','γ','감마','gamma','g','ㄱ','γ·κ·χ·ξ 앞의 γ는 n으로 읽습니다. 예: ἄγγελος 안겔로스'],
 ['Δ','δ','델타','delta','d','ㄷ',''],['Ε','ε','엡실론','epsilon','e','에','짧은 e'],
 ['Ζ','ζ','제타','zeta','z','ㅈ',''],['Η','η','에타','eta','ē','에','긴 e. 소문자가 n처럼 생겼습니다.'],
 ['Θ','θ','테타','theta','th','ㅌ','영어 think의 th'],['Ι','ι','이오타','iota','i','이',''],
 ['Κ','κ','카파','kappa','k','ㅋ',''],['Λ','λ','람다','lambda','l','ㄹ',''],
 ['Μ','μ','뮈','mu','m','ㅁ',''],['Ν','ν','뉘','nu','n','ㄴ','소문자가 v처럼 생겼습니다.'],
 ['Ξ','ξ','크시','xi','x (ks)','크스',''],['Ο','ο','오미크론','omicron','o','오','짧은 o'],
 ['Π','π','피','pi','p','ㅍ',''],['Ρ','ρ','로','rho','r','ㄹ','소문자가 p처럼 생겼습니다. 단어 첫머리에서는 ῥ(rh).'],
 ['Σ','σ / ς','시그마','sigma','s','ㅅ','단어 끝에서는 ς'],['Τ','τ','타우','tau','t','ㅌ',''],
 ['Υ','υ','윕실론','upsilon','u','우','본래 프랑스어 u(위)에 가까운 소리. 단어 첫머리에는 늘 거친 숨표가 붙어 hu로 읽습니다.'],
 ['Φ','φ','피','phi','ph','ㅍ','오늘날 f처럼 읽기도 합니다.'],['Χ','χ','키','chi','kh','ㅎ / ㅋ','목 깊은 kh. 소문자가 x처럼 생겼습니다.'],
 ['Ψ','ψ','프시','psi','ps','프스',''],['Ω','ω','오메가','omega','ō','오','긴 o. 소문자가 w처럼 생겼습니다.']
];
const GR_DIPHTHONGS=[['αι','ai','아이'],['ει','ei','에이'],['οι','oi','오이'],['υι','ui','위 (자동 전사는 우이)'],['αυ','au','아우'],['ευ','eu','에우'],['ου','ou','우'],['ηυ','ēu','에우']];
const GR_MARKS=[
 ['ἁ','거친 숨표 ( ῾ )','모음(또는 ρ) 위의 왼쪽으로 열린 표. 앞에 h를 붙여 읽습니다. 예: ὁ 호, ἡμέρα 헤메라'],
 ['ἀ','부드러운 숨표 ( ᾿ )','오른쪽으로 열린 표. 소리가 없습니다. 모음으로 시작하는 단어에는 둘 중 하나가 꼭 붙습니다.'],
 ['ά ὰ ᾶ','악센트 ( ´ ` ῀ )','강세가 오는 음절을 표시합니다. 학습용으로는 세 가지 모두 "여기에 강세"로 읽으면 됩니다.'],
 ['ᾳ ῃ ῳ','이오타 하기( ͅ )','모음 아래의 작은 ι. 소리 내지 않지만 형태(주로 여격)를 구별하는 데 중요합니다.'],
 [';  ·','문장 부호','헬라어 ;는 물음표, 위쪽 점 ·는 쌍점·쌍반점에 해당합니다.']
];
let alphabetData=null,lang='he',quiz=null;
const pron=(t,he)=>pronunciationFor(t,he);
const verseLink=ref=>`./?q=${encodeURIComponent(ref)}`;
function exampleHTML(x,he){
 if(!x)return '';const p=pron(x.form,he);
 return `<a class="lx-ex" href="${verseLink(x.ref)}"><span lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${esc(x.form)}</span><small>${esc(p.korean)} · ${esc(x.gloss)}</small><small class="lx-ref">${esc(x.ref)} ↗</small></a>`;
}
function hebrewHTML(d){
 return `<section class="lx-section"><h2>읽기 전에</h2><ul class="lx-points"><li><b>오른쪽에서 왼쪽으로</b> 읽습니다.</li><li>글자 22자는 모두 <b>자음</b>입니다. 모음은 글자 아래·위의 <b>점과 선</b>(니쿠드)으로 표시합니다.</li><li>대문자·소문자 구별은 없고, 다섯 글자만 <b>단어 끝에서 모양</b>이 바뀝니다.</li><li>성경 본문의 작은 기호 중 모음 외의 것(악센트 부호)은 낭송·강세 표시라서 처음에는 무시해도 됩니다.</li></ul></section>`
 +`<section class="lx-section"><h2>자음 22자</h2><p class="lx-sub">예시는 성경에서 그 글자로 시작하는 단어 중 가장 자주 나오는 형태입니다. 누르면 처음 나오는 구절로 이동합니다.</p><div class="lx-grid">${HE_LETTERS.map(([l,n,en,r,k,note])=>`<article class="lx-card"><div class="lx-glyph" lang="he">${l}</div><h3>${n} <span>${en}</span></h3><p class="lx-sound"><b>${esc(r)}</b> ${esc(k)}</p>${note?`<p class="lx-note">${mixed(note)}</p>`:''}${exampleHTML(d.he.letters[l],true)}</article>`).join('')}</div></section>`
 +`<section class="lx-section"><h2>단어 끝 글자 5개</h2><div class="lx-finals">${HE_FINALS.map(([a,b])=>`<article class="lx-card lx-final"><div class="lx-pair" lang="he"><span>${a}</span><i>→</i><span>${b}</span></div>${exampleHTML(d.he.finals[b],true)}</article>`).join('')}</div></section>`
 +`<section class="lx-section"><h2>헷갈리는 글자</h2><div class="lx-confuse">${HE_CONFUSE.map(x=>`<div><span lang="he">${x.slice(0,-1).join(' ')}</span><p>${mixed(x[x.length-1])}</p></div>`).join('')}</div></section>`
 +`<section class="lx-section"><h2>모음 부호</h2><p class="lx-sub">모음은 자음 <b>뒤에</b> 읽습니다. 아래 표는 ב(베트) 위에 모음을 붙인 모습입니다(후음 아래에 주로 오는 하테프 모음은 ח·א로 표시).</p><div class="lx-vowels">${HE_VOWELS.map(([s,k,n,r,ko,note])=>`<article class="lx-vrow"><div class="lx-vglyph" lang="he">${s}</div><div class="lx-vbody"><h3>${n} <b>${esc(r)}</b> <span>${esc(ko)}</span></h3>${note?`<p class="lx-note">${mixed(note)}</p>`:''}</div>${exampleHTML(d.he.vowels[k],true)}</article>`).join('')}</div>`
 +`<div class="lx-box"><h3>다게쉬: 글자 안의 점</h3><p>בּ כּ פּ처럼 글자 가운데 점이 있으면 b·k·p의 단단한 소리로 읽습니다. 다른 글자 안의 점은 대개 자음을 두 번 읽으라는 표시입니다(예: עַמִּי am-mi, 이 사이트의 전사에서는 겹자음을 한 번만 적습니다). ו 가운데 점은 다게쉬가 아니라 모음 u(슈렉)입니다.</p></div></section>`;
}
function greekHTML(d){
 return `<section class="lx-section"><h2>읽기 전에</h2><ul class="lx-points"><li>한국어처럼 <b>왼쪽에서 오른쪽으로</b> 읽습니다.</li><li>글자는 <b>24자</b>, 모음과 자음이 모두 글자로 적힙니다. 영어 알파벳과 닮은 글자가 많지만 <b>η(에), ν(n), ρ(r), χ(kh), ω(오)</b>는 생김새와 소리가 다릅니다.</li><li>성경 본문은 소문자로 적고, 고유명사와 문단 첫 글자만 대문자로 씁니다.</li><li>이 사이트는 학습용으로 널리 쓰는 <b>에라스뮈스식 발음</b>을 씁니다. 현대 그리스어 발음과는 다릅니다.</li></ul></section>`
 +`<section class="lx-section"><h2>글자 24자</h2><p class="lx-sub">예시는 신약에서 그 글자로 시작하는 단어 중 가장 자주 나오는 형태입니다. 누르면 처음 나오는 구절로 이동합니다.</p><div class="lx-grid">${GR_LETTERS.map(([u,l,n,en,r,k,note])=>`<article class="lx-card"><div class="lx-glyph" lang="el">${u} <span>${l}</span></div><h3>${n} <span>${en}</span></h3><p class="lx-sound"><b>${esc(r)}</b> ${esc(k)}</p>${note?`<p class="lx-note">${mixed(note)}</p>`:''}${exampleHTML(d.gr.letters[l[0]],false)}</article>`).join('')}</div></section>`
 +`<section class="lx-section"><h2>이중모음</h2><p class="lx-sub">두 모음이 한 소리로 읽힙니다.</p><div class="lx-diph">${GR_DIPHTHONGS.map(([g,r,k])=>`<div><span lang="el">${g}</span><b>${r}</b><small>${k}</small></div>`).join('')}</div></section>`
 +`<section class="lx-section"><h2>숨표·악센트·부호</h2><div class="lx-vowels">${GR_MARKS.map(([g,n,t])=>`<article class="lx-vrow"><div class="lx-vglyph" lang="el">${g}</div><div class="lx-vbody"><h3>${n}</h3><p class="lx-note">${mixed(t)}</p></div></article>`).join('')}</div></section>`;
}
function practiceHTML(d,he){
 const list=d.practice[he?'he':'gr'];
 return `<section class="lx-section"><h2>읽기 연습</h2><p class="lx-sub">성경에서 가장 자주 나오는 단어들입니다. 먼저 소리 내어 읽어 본 뒤 눌러서 확인하세요.</p><div class="lx-practice">${list.map((x,i)=>{const p=pron(x.form,he);return `<button class="lx-pcard" data-reveal="${i}" aria-expanded="false"><span class="lx-pword" lang="${he?'he':'el'}" dir="${he?'rtl':'ltr'}">${esc(x.form)}</span><span class="lx-panswer"><b>${esc(p.korean)}</b> ${esc(p.roman)}<small>${esc(x.gloss)} · 성경에 ${x.count.toLocaleString()}회</small></span><span class="lx-phint">눌러서 확인</span></button>`;}).join('')}</div><p class="lx-sub">발음은 사이트의 자동 전사 기준이며 한글은 근사 표기입니다.</p></section>`;
}
function quizItems(he){return he?HE_LETTERS.map(([l,n,,r])=>({q:l,a:`${n} · ${r}`})).concat(HE_FINALS.map(([a,b])=>({q:b,a:`${HE_LETTERS.find(x=>x[0]===a)[1]} (끝 글자) · ${HE_LETTERS.find(x=>x[0]===a)[3]}`}))):GR_LETTERS.map(([,l,n,,r])=>({q:l.split(' / ')[0],a:`${n} · ${r}`}));}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function newQuestion(){
 const items=quizItems(lang==='he'),pick=items[Math.floor(Math.random()*items.length)];
 const others=shuffle(items.filter(x=>x.a!==pick.a)).slice(0,3);
 quiz={...quiz,item:pick,options:shuffle([pick,...others]),answered:false};renderQuiz();
}
function renderQuiz(){
 const he=lang==='he',{item,options,answered,score,total}=quiz;
 $('quiz').innerHTML=`<div class="lx-qhead"><span>${total?`${total}문제 중 ${score}개 정답`:'글자를 보고 이름과 소리를 고르세요'}</span><button class="small-btn" id="quizReset">처음부터</button></div><div class="lx-qglyph" lang="${he?'he':'el'}">${esc(item.q)}</div><div class="lx-qopts">${options.map((o,i)=>`<button class="lx-qopt${answered?(o===item?' correct':o===answered?' wrong':''):''}" data-opt="${i}" ${answered?'disabled':''}>${esc(o.a)}</button>`).join('')}</div>${answered?`<p class="lx-qresult" role="status">${answered===item?'정답입니다.':`정답은 <b>${esc(item.a)}</b>입니다.`}</p><button class="lx-next" id="quizNext">다음 글자 →</button>`:''}`;
 document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{const o=quiz.options[+b.dataset.opt];quiz.answered=o;quiz.total++;if(o===quiz.item)quiz.score++;renderQuiz();});
 if($('quizNext'))$('quizNext').onclick=newQuestion;
 $('quizReset').onclick=()=>{quiz={score:0,total:0};newQuestion();};
}
function render(){
 const d=alphabetData,he=lang==='he';
 document.querySelectorAll('[data-lang]').forEach(b=>{const on=b.dataset.lang===lang;b.classList.toggle('active',on);b.setAttribute?.('aria-pressed',String(on));});
 $('learnBody').innerHTML=(he?hebrewHTML(d):greekHTML(d))+practiceHTML(d,he)+`<section class="lx-section"><h2>글자 퀴즈</h2><div class="lx-quiz" id="quiz"></div></section>`;
 document.querySelectorAll('[data-reveal]').forEach(b=>b.onclick=()=>{const open=b.classList.toggle('open');b.setAttribute?.('aria-expanded',String(open));});
 quiz={score:0,total:0};newQuestion();
}
function setLang(next){lang=next==='gr'?'gr':'he';try{history.replaceState(null,'',`#${lang}`);}catch{}render();}
async function initLearn(){
 lang=location.hash==='#gr'?'gr':'he';
 document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
 try{const r=await fetch('data/alphabet.json');if(!r.ok)throw Error();alphabetData=await r.json();render();}
 catch{$('learnBody').innerHTML='<p class="notice">입문 자료를 불러오지 못했습니다. 페이지를 새로고침해주세요.</p>';}
}
