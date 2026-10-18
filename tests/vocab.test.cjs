const assert=require('assert'),fs=require('fs'),vm=require('vm');
const books=JSON.parse(fs.readFileSync('data/books.json','utf8')),pm=JSON.parse(fs.readFileSync('data/psalm-verses.json','utf8'));
const rev={};for(const [src,v] of Object.entries(pm))rev[v.key]=src;
const cache={},book=c=>cache[c]??=JSON.parse(fs.readFileSync(`data/${c}.json`,'utf8'));
for(const lang of ['he','gr']){
 const d=JSON.parse(fs.readFileSync(`data/vocab-${lang}.json`,'utf8')),ids=new Set();
 assert.ok(d.words.length>1000,'enough words');
 d.words.forEach((w,i)=>{
  assert.ok(!ids.has(w.id),'unique '+w.id);ids.add(w.id);assert.ok(w.c>=10&&w.g&&w.w,'fields '+w.id);
  if(i)assert.ok(d.words[i-1].c>=w.c,'frequency order at '+i);
  // 예문 구절이 사이트 장절 번호로 열리고, 표시한 위치의 단어가 그 표제어인지 확인
  const k=w.r.lastIndexOf(' '),b=books.find(b=>b.name===w.r.slice(0,k));assert.ok(b,w.r);
  const key=w.r.slice(k+1),v=book(b.code)[b.code==='Ps'?(rev[key]||key):key];assert.ok(v,'verse '+w.r);
  if(lang==='he'){const s=v.words[w.i].s.split('/').map(x=>x.replace(/[a-z\s]/g,'')).filter(x=>/^\d+$/.test(x)).pop();assert.equal('H'+s,w.id,`${w.w} at ${w.r}`);assert.equal(w.x.split(' ').length,v.words.length);}
  else{assert.equal(String(v.l[w.i]),w.id,`${w.w} at ${w.r}`);assert.equal(w.x.split(' ').length,v.text.split(/\s+/).length);assert.ok(!/[⸀-⸏]/.test(w.x),'no editorial marks');}
 });
}
// 학습 흐름: 새 카드 → 알아요/모름 → 상자·복습일·비율 갱신, 기록 저장
const store={},nodes={},el=()=>({innerHTML:'',textContent:'',classList:{toggle(){}},dataset:{}});
const context={document:{getElementById:id=>nodes[id]??=el(),querySelectorAll:()=>[]},location:{hash:'#gr'},history:{replaceState(){}},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},navigator:{},fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))})};
vm.createContext(context);for(const f of ['pronunciation.js','vocab.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
(async()=>{
 await vm.runInContext('initVocab()',context);
 assert.ok(nodes.vocabTop.innerHTML.includes('학습 시작 · 10장'));assert.ok(nodes.vocabList.innerHTML.includes('1–50위'));
 vm.runInContext('session=buildSession();renderStudy()',context);assert.ok(nodes.vocabStudy.innerHTML.includes('새 단어 · 1위'));
 vm.runInContext('session.revealed=true;renderStudy()',context);assert.ok(nodes.vocabStudy.innerHTML.includes('검토 전'));vm.runInContext("reviewed={'0':'ok'};renderStudy()",context);assert.ok(nodes.vocabStudy.innerHTML.includes('검토한 기본 뜻'),'reviewed gloss badge');assert.ok(nodes.vocabStudy.innerHTML.includes('<mark>'));
 vm.runInContext('grade(2)',context);vm.runInContext('grade(0)',context);
 const st=JSON.parse(store['vocab:gr']),t=vm.runInContext('today()',context);
 assert.deepEqual(st.cards['0'],{b:1,d:t+1});assert.deepEqual(st.cards['1'],{b:0,d:t});assert.equal(st.newToday,2);
 assert.equal(vm.runInContext('session.queue[session.queue.length-1].id',context),'1','"모름" card comes back in the same session');
 const cov=vm.runInContext('coverage()',context),d=JSON.parse(fs.readFileSync('data/vocab-gr.json','utf8'));assert.ok(Math.abs(cov-d.words[0].c/d.total)<1e-9,'coverage counts known words only');
 vm.runInContext("setLang('he')",context);
 console.log('PASS: vocab data (order, examples point at the lemma in the right verse), study flow and progress');
})().catch(e=>{console.error(e);process.exit(1);});
