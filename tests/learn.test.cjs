const assert=require('assert'),fs=require('fs'),vm=require('vm');
const nodes={},el=()=>({innerHTML:'',classList:{toggle(){return true}},dataset:{}});
const context={document:{getElementById:id=>nodes[id]??=el(),querySelectorAll:()=>[]},location:{hash:'#he'},history:{replaceState(){}},fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))})};
vm.createContext(context);for(const f of ['pronunciation.js','learn.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
const data=JSON.parse(fs.readFileSync('data/alphabet.json','utf8')),books=JSON.parse(fs.readFileSync('data/books.json','utf8'));
// 예시 단어가 연결된 구절 본문에 실제로 있는지(악센트 부호 제외 비교)
const strip=s=>s.normalize('NFD').replace(/[֑-ֽֿ֯׀׃-׆־]/g,'').normalize('NFC');
const stripGr=s=>s.normalize('NFC');
const check=x=>{const i=x.ref.lastIndexOf(' '),b=books.find(b=>b.name===x.ref.slice(0,i));assert.ok(b,x.ref);const v=JSON.parse(fs.readFileSync(`data/${b.code}.json`,'utf8'))[x.ref.slice(i+1)];assert.ok(v,x.ref);
 const he=b.testament==='ot';assert.ok(he?v.words.some(w=>strip(w.t)===x.form):v.text.split(/\s+/).some(t=>stripGr(t).replace(/[^\p{L}\p{M}]/gu,'')===x.form),`${x.form} in ${x.ref}`);};
const he=vm.runInContext('HE_LETTERS',context),gr=vm.runInContext('GR_LETTERS',context),vowels=vm.runInContext('HE_VOWELS',context),finals=vm.runInContext('HE_FINALS',context);
assert.equal(he.length,22);assert.equal(gr.length,24);
for(const [l] of he){assert.ok(data.he.letters[l],'example for '+l);check(data.he.letters[l]);}
for(const [,f] of finals){assert.ok(data.he.finals[f],'example for '+f);check(data.he.finals[f]);}
for(const v of vowels){assert.ok(data.he.vowels[v[1]],'example for vowel '+v[2]);check(data.he.vowels[v[1]]);}
for(const g of gr){const l=g[1][0];assert.ok(data.gr.letters[l],'example for '+l);check(data.gr.letters[l]);}
for(const x of [...data.practice.he,...data.practice.gr])check(x);
assert.ok(!Object.values(data.he.vowels).some(x=>x.form==='כָּל'),'qamets hatuf word is not used as a qamets example');
const p=(t,h)=>vm.runInContext(`pronunciationFor(${JSON.stringify(t)},${h})`,context).korean;
assert.equal(p('אֲדֹנָי',true),'아도나이');assert.equal(p('אִישׁ',true),'이쉬');assert.equal(p('ῥήματα',false),'레마타');assert.equal(p('ἁμαρτία',false),'하말티아');
(async()=>{await vm.runInContext('initLearn()',context);assert.ok(nodes.learnBody.innerHTML.includes('자음 22자'));assert.ok(nodes.learnBody.innerHTML.includes('<bdi lang="he">'));assert.ok(nodes.quiz.innerHTML.includes('data-opt="3"'));
 vm.runInContext("setLang('gr')",context);assert.ok(nodes.learnBody.innerHTML.includes('글자 24자'));assert.ok(nodes.learnBody.innerHTML.includes('이중모음'));
 console.log('PASS: learn page letters, vowel examples found in their verses, pronunciation fixes, rendering');})().catch(e=>{console.error(e);process.exit(1);});
