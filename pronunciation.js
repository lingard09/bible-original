'use strict';
// 학습용 문자 전사. 강세·음장·역사적 발음 차이를 완전히 재현하는 음성 표기는 아님.
const reviewedPronunciations={
'Prov.16:9':{roman:'Lēv ʾādām yeḥashshēv darkō; va-Adonai yākhīn tsaʿadō.',korean:'레브 아담 예하셰브 다르코, 바아도나이 야킨 차아도.'},
'John.3:16':{roman:'Houtōs gar ēgapēsen ho theos ton kosmon, hōste ton huion ton monogenē edōken, hina pas ho pisteuōn eis auton mē apolētai alla ekhē zōēn aiōnion.',korean:'후토스 가르 에가페센 호 테오스 톤 코스몬, 호스테 톤 휘온 톤 모노게네 에도켄, 히나 파스 호 피스테우온 에이스 아우톤 메 아폴레타이 알라 에케 조엔 아이오니온.'}
};
function hebrewRoman(text){
 const consonants={'א':'ʾ','ב':'v','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ḥ','ט':'ṭ','י':'y','כ':'kh','ך':'kh','ל':'l','מ':'m','ם':'m','נ':'n','ן':'n','ס':'s','ע':'ʿ','פ':'f','ף':'f','צ':'ts','ץ':'ts','ק':'q','ר':'r','ש':'sh','ת':'t'};
 const vowels={'\u05b0':'e','\u05b1':'ĕ','\u05b2':'ă','\u05b3':'ŏ','\u05b4':'i','\u05b5':'ē','\u05b6':'e','\u05b7':'a','\u05b8':'ā','\u05b9':'ō','\u05ba':'ō','\u05bb':'u','\u05c7':'o'};
 return text.normalize('NFD').replace(/[\u0591-\u05af\u05bd\u05bf\u05c4\u05c5]/g,'').split(/(\s+|־|׃|׀|[.,;:!?])/).map(word=>{
 if(!/[א-ת]/.test(word))return word.replace(/[׃׀]/g,'');
 const bare=word.replace(/[\u05b0-\u05c7]/g,'');
 if(bare==='יהוה')return 'Adonai';if(bare==='ויהוה')return 'va-Adonai';
 const parts=[...word.matchAll(/([א-ת])([\u05b0-\u05c7]*)/g)];let out='';
 for(let i=0;i<parts.length;i++){
 const [,letter,marks]=parts[i];let c=consonants[letter]||letter;const prev=parts[i-1];
 if(letter==='ש'&&marks.includes('\u05c2'))c='s';
 if(marks.includes('\u05bc')){if(letter==='ב')c='b';if(letter==='כ'||letter==='ך')c='k';if(letter==='פ'||letter==='ף')c='p';}
 if(letter==='ו'&&marks.includes('\u05bc')&&!/[\u05b0-\u05bb\u05c7]/.test(marks)){out+='ū';continue;}
 if(letter==='ו'&&/[\u05b9\u05ba]/.test(marks)){out+='ō';continue;}
 if(letter==='י'&&!/[\u05b0-\u05bb\u05c7]/.test(marks)&&prev&&/[\u05b4\u05b5]/.test(prev[2]))continue;
 if(letter==='ה'&&i===parts.length-1&&!marks.includes('\u05bc')&&!/[\u05b0-\u05bb\u05c7]/.test(marks))continue;
 let v=[...marks].map(m=>vowels[m]||'').join('');
 if(v==='e'&&marks.includes('\u05b0')&&(i===parts.length-1||(prev&&/[\u05b4\u05b6\u05b7\u05bb]/.test(prev[2]))))v='';
 if(i===parts.length-1&&/[חעה]/.test(letter)&&v==='a'){out+=v+c;continue;}
 out+=c+v;
 }return out;
 }).join('');
}
function greekRoman(text){
 const letters={'α':'a','β':'b','γ':'g','δ':'d','ε':'e','ζ':'z','η':'ē','θ':'th','ι':'i','κ':'k','λ':'l','μ':'m','ν':'n','ξ':'x','ο':'o','π':'p','ρ':'r','σ':'s','ς':'s','τ':'t','υ':'u','φ':'ph','χ':'kh','ψ':'ps','ω':'ō'};
 return text.split(/(\s+|[.,;:!?·])/).map(word=>{const groups=[...word.toLowerCase().normalize('NFD').matchAll(/([α-ω])([\u0300-\u036f]*)/g)];if(!groups.length)return word.replace(/[⸀⸁⸂⸃⸄⸅⸆⸇⸈⸉⸊⸋⸌⸍⸎⸏\[\]]/g,'');let out='';const rough=groups.slice(0,2).some(g=>g[2].includes('\u0314'));if(rough)out='h';for(let i=0;i<groups.length;i++){const l=groups[i][1];out+=l==='γ'&&/[γκχξ]/.test(groups[i+1]?.[1]||'')?'n':letters[l]||l;}return out+(word.match(/[.,;:!?·]$/)?.[0]||'');}).join('');
}
function koreanApprox(roman){
 const onsets={'':'ㅇ',b:'ㅂ',p:'ㅍ',d:'ㄷ',t:'ㅌ',g:'ㄱ',k:'ㅋ',q:'ㅋ',h:'ㅎ',kh:'ㅎ',th:'ㅌ',ph:'ㅍ',f:'ㅍ',v:'ㅂ',m:'ㅁ',n:'ㄴ',r:'ㄹ',l:'ㄹ',s:'ㅅ',sh:'ㅅ',z:'ㅈ',ts:'ㅊ',y:'ㅇ',w:'ㅇ'};
 const initials='ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';const medial={'a':0,'e':5,'i':20,'o':8,'u':13,'ya':2,'ye':7,'yo':12,'yu':17,'wa':9,'we':10,'wi':16,'wo':14};const codas={n:4,m:16,l:8,r:8};
 const compose=(c,v,final='')=>{const idx=initials.indexOf(onsets[c]||'ㅇ');return String.fromCharCode(0xac00+(idx*21+(medial[v]??18))*28+(codas[final]||0));};
 return roman.normalize('NFD').replace(/[\u0300-\u036fʾʿ]/g,'').toLowerCase().replace(/ḥ/g,'h').replace(/ṭ/g,'t').replace(/x/g,'ks').split(/(\s+|[-.,;:!?·])/).map(word=>{
 if(!/[a-z]/.test(word))return word;const units=word.match(/kh|th|ph|sh|ts|[a-z]/g)||[];let out='',i=0;
 while(i<units.length){let c='';if(!/[aeiou]/.test(units[i])){c=units[i++];if(i===units.length||!/[aeiou]/.test(units[i])){if((c==='y'||c==='w')&&i<units.length&&/[aeiou]/.test(units[i])){}else{out+=compose(c,'eu');continue;}}}
 let v=units[i++];if(c==='y'||c==='w'){const combined=c+v;if(medial[combined]!==undefined){v=combined;c='';}}
 if(c==='sh'&&['a','e','o','u'].includes(v)){v='y'+v;c='s';}
 if(v==='o'&&units[i]==='u'){v='u';i++;}
 let final=units[i]==='l'&&/[aeiou]/.test(units[i+1]||'')?'l':'';if(codas[units[i]]&&(!units[i+1]||!/[aeiou]/.test(units[i+1]))){final=units[i++];}
 out+=compose(c,v,final);
 }return out;
 }).join('');
}
function pronunciationFor(text,hebrew){const roman=hebrew?hebrewRoman(text):greekRoman(text);return {roman,korean:koreanApprox(roman)};}
function pronunciationHTML(text,hebrew,code,key){const reviewed=reviewedPronunciations[`${code}.${key}`];const p=reviewed||pronunciationFor(text,hebrew);return `<section class="pronunciation-panel"><h4>원문 발음 <span>${reviewed?'검토한 학습용 표기':'자동 전사 · 근사 발음'}</span></h4><dl><div><dt>한글</dt><dd>${esc(p.korean)}</dd></div><div><dt>로마자</dt><dd lang="en">${esc(p.roman)}</dd></div></dl><p>히브리어 모음 표기와 헬라어 학습용 전사 기준입니다. 한글은 근사 표기로, 강세·음장과 시대·전통별 발음 차이를 모두 표현하지 않습니다.${hebrew?' יהוה는 유대 전통의 대독어인 아도나이(Adonai)로 표시합니다.':''}</p></section>`;}
function termPronunciationHTML(text,lang){const p=pronunciationFor(text,lang==='he');return `<div class="term-pronunciation">${esc(p.korean)} <span>· ${esc(p.roman)}</span></div>`;}
