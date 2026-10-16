const assert=require('assert'),fs=require('fs'),vm=require('vm');
const books=JSON.parse(fs.readFileSync('data/books.json','utf8')),pm=JSON.parse(fs.readFileSync('data/psalm-verses.json','utf8')),mg=JSON.parse(fs.readFileSync('data/morph-gr.json','utf8'));
const rev={};for(const [src,v] of Object.entries(pm))rev[v.key]=src;
const cache={},book=c=>cache[c]??=JSON.parse(fs.readFileSync(`data/${c}.json`,'utf8'));
const store={},nodes={},el=()=>({innerHTML:'',textContent:'',classList:{toggle(){}},dataset:{}});
const context={document:{getElementById:id=>nodes[id]??=el(),querySelectorAll:()=>[]},location:{hash:'#he'},history:{replaceState(){}},localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;}},fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))})};
vm.createContext(context);for(const f of ['morph.js','quiz.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
(async()=>{
 for(const lang of ['he','gr']){
  const d=JSON.parse(fs.readFileSync(`data/quiz-${lang}.json`,'utf8'));assert.ok(d.items.length>1000);
  await vm.runInContext(`setLang('${lang}')`,context);
  for(const it of d.items){
   // 문제 구절이 사이트 장절로 열리고, 표시 위치의 단어가 그 표제어·형태 코드인지
   const k=it.r.lastIndexOf(' '),b=books.find(b=>b.name===it.r.slice(0,k)),key=it.r.slice(k+1),v=book(b.code)[b.code==='Ps'?(rev[key]||key):key];assert.ok(v,it.r);
   if(lang==='he'){const w=v.words[it.i];assert.equal(w.m,it.m,it.r);assert.equal('H'+w.s.split('/').map(x=>x.replace(/[a-z\s]/g,'')).filter(x=>/^\d+$/.test(x)).pop(),it.id,it.r);assert.equal(d.verses[it.r].split(' ').length,v.words.length);}
   else{assert.equal(mg[v.p[it.i]],it.m,it.r);assert.equal(String(v.l[it.i]),it.id,it.r);assert.equal(d.verses[it.r].split(' ').length,v.text.split(/\s+/).length);}
   context.it=it;const s=vm.runInContext('stepsFor(it)',context);assert.ok(s.steps.length>=2,'steps for '+it.m);
   for(const [key,q,a] of s.steps){assert.ok(a&&!/undefined/.test(a),`answer for ${key} in ${it.m}`);context.k=key;context.a=a;const o=vm.runInContext('optionsFor(k,a)',context);assert.ok(o.includes(a)&&new Set(o).size===o.length&&o.length>=2&&o.length<=4,`options ${key}`);}
  }
 }
 // 동사 예시: 와이크톨 / 헬라어 부정과거 직설법
 context.it={m:'HC/Vqw3ms'};await vm.runInContext("setLang('he')",context);assert.deepEqual(vm.runInContext('stepsFor(it).steps.map(s=>s[2])',context),['칼(Qal)','연속 미완료(와이크톨)','3인칭 남성 단수']);
 await vm.runInContext("setLang('gr')",context);context.it={m:'V-3AAI-S--'};assert.deepEqual(vm.runInContext('stepsFor(it).steps.map(s=>s[2])',context),['부정과거(아오리스트)','능동태','직설법','3인칭 단수']);
 context.it={m:'V--PAPNSM-'};assert.deepEqual(vm.runInContext('stepsFor(it).steps.map(s=>s[1])',context),['시제','태','법','격·수']);
 // 흐름: 필터 → 한 라운드에서 정답·오답 → 통계 저장
 vm.runInContext("filters.pos='verb';render()",context);assert.ok(vm.runInContext("pool.every(it=>stepsFor(it).pos==='동사')",context));
 vm.runInContext('newRound()',context);const steps=vm.runInContext('stepsFor(round.items[0]).steps',context);
 vm.runInContext(`answer(${JSON.stringify(steps[0][2])})`,context);vm.runInContext("answer('틀린 답')",context);
 const st=JSON.parse(store['quiz:gr']);assert.deepEqual([st[steps[0][0]].r,st[steps[0][0]].t],[1,1]);assert.equal(st[steps[1][0]].r,0);
 assert.ok(nodes.quizArea.innerHTML.includes('class="ok"')&&nodes.quizArea.innerHTML.includes('class="no"'));
 assert.equal(vm.runInContext("topic('시제')+topic('법')",context),'시제는법은');
 console.log('PASS: quiz items match their verses and parsing, options, steps, flow and stats');
})().catch(e=>{console.error(e);process.exit(1);});
