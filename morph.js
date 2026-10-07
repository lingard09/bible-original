'use strict';
// 형태 코드를 한국어로 풀이합니다. 히브리어는 OSHB 형태 코드, 헬라어는 MorphGNT 품사·분석 코드를 따릅니다.
// OSHB: https://hb.openscriptures.org/parsing/HebrewMorphologyCodes.html · MorphGNT: https://github.com/morphgnt/sblgnt
const HE_STEMS={q:'칼(Qal)',N:'니팔(Niphal)',p:'피엘(Piel)',P:'푸알(Pual)',h:'히필(Hiphil)',H:'호팔(Hophal)',t:'히트파엘(Hithpael)',o:'폴렐(Polel)',O:'폴랄(Polal)',r:'히트폴렐(Hithpolel)',m:'포엘(Poel)',M:'포알(Poal)',k:'팔렐(Palel)',K:'풀랄(Pulal)',Q:'칼 수동(Qal passive)',l:'필펠(Pilpel)',L:'폴팔(Polpal)',f:'히트팔펠(Hithpalpel)',D:'니트파엘(Nithpael)',j:'페알랄(Pealal)',i:'필렐(Pilel)',u:'호트파알(Hothpaal)',c:'티프일(Tiphil)',v:'히쉬타펠(Hishtaphel)',w:'니트팔렐(Nithpalel)',y:'니트포엘(Nithpoel)',z:'히트포엘(Hithpoel)'};
const AR_STEMS={q:'페알(Peal)',Q:'페일(Peil)',u:'히트페엘(Hithpeel)',p:'파엘(Pael)',P:'이트파알(Ithpaal)',M:'히트파알(Hithpaal)',a:'아펠(Aphel)',h:'하펠(Haphel)',s:'사펠(Saphel)',e:'샤펠(Shaphel)',H:'호팔(Hophal)',i:'이트페엘(Ithpeel)',t:'히쉬타펠(Hishtaphel)',v:'이쉬타펠(Ishtaphel)',w:'히트아펠(Hithaphel)',o:'폴렐(Polel)',z:'이트포엘(Ithpoel)',r:'히트폴렐(Hithpolel)',f:'히트팔펠(Hithpalpel)',b:'헤팔(Hephal)',c:'티펠(Tiphel)',m:'포엘(Poel)',l:'팔펠(Palpel)',L:'이트팔펠(Ithpalpel)',O:'이트폴렐(Ithpolel)',G:'잇타팔(Ittaphal)'};
// 히브리어 주요 일곱 어간의 대표 기능(문법서의 일반적인 요약이며 단어마다 예외가 있습니다).
const HE_STEM_NOTES={q:'기본 어간. 단순 능동의 뜻',N:'주로 칼의 수동·재귀',p:'강세·사역적 능동',P:'피엘의 수동',h:'주로 사역 능동(~하게 하다)',H:'히필의 수동',t:'주로 재귀·상호(스스로 ~하다)'};
const HE_CONJ={p:'완료(카탈)',q:'연속 완료(웨카탈)',i:'미완료(이크톨)',w:'연속 미완료(와이크톨)',h:'청유형',j:'지시형',v:'명령형',r:'능동 분사',s:'수동 분사',a:'부정사 절대형',c:'부정사 연계형'};
const HE_PERSON={1:'1인칭',2:'2인칭',3:'3인칭'},HE_GENDER={b:'양성',c:'공성',f:'여성',m:'남성'},HE_NUMBER={d:'쌍수',p:'복수',s:'단수'},HE_STATE={a:'절대형',c:'연계형',d:'한정형'};
const HE_POS={A:'형용사',C:'접속사',D:'부사',N:'명사',P:'대명사',R:'전치사',S:'접미어',T:'불변화사',V:'동사'};
const HE_TYPES={A:{a:'',c:'기수',g:'민족 형용사',o:'서수'},N:{c:'',g:'민족명',p:'고유명사'},P:{d:'지시대명사',f:'부정대명사',i:'의문대명사',p:'인칭대명사',r:'관계대명사'},R:{d:'전치사 + 정관사'},S:{d:'방향의 헤(ה)',h:'첨가 헤(ה)',n:'첨가 눈(נ)',p:'대명사 접미어'},T:{a:'긍정 불변화사',d:'정관사',e:'권유 불변화사',i:'의문 불변화사',j:'감탄사',m:'지시 불변화사',n:'부정어',o:'목적격 표지',r:'관계사'}};
const pick=(table,ch)=>ch&&ch!=='x'?table[ch]:undefined;
function hebrewSegment(code,aramaic){
 const pos=code[0],rest=code.slice(1),name=HE_POS[pos];if(!name)return null;
 if(pos==='V'){
  const stem=(aramaic?AR_STEMS:HE_STEMS)[rest[0]],conj=HE_CONJ[rest[1]],f=rest.slice(2);
  const feats=rest[1]==='r'||rest[1]==='s'?[pick(HE_GENDER,f[0]),pick(HE_NUMBER,f[1]),pick(HE_STATE,f[2])]:[pick(HE_PERSON,f[0]),pick(HE_GENDER,f[1]),pick(HE_NUMBER,f[2])];
  return {pos:name,feats:[stem,conj,...feats].filter(Boolean),note:aramaic?'':HE_STEM_NOTES[rest[0]]||''};
 }
 const type=HE_TYPES[pos]?.[rest[0]],f=rest.slice(1);
 const label=pos==='T'||pos==='S'||pos==='P'||pos==='R'?type||name:name;
 const extra=pos==='A'||pos==='N'?[type,pick(HE_GENDER,f[0]),pick(HE_NUMBER,f[1]),pick(HE_STATE,f[2])]:pos==='P'||pos==='S'?[pick(HE_PERSON,f[0]),pick(HE_GENDER,f[1]),pick(HE_NUMBER,f[2])]:[];
 return {pos:label,feats:extra.filter(Boolean),note:''};
}
function morphHebrew(m){
 if(!m||!/^[HA]/.test(m))return null;const aramaic=m[0]==='A';
 const segs=m.slice(1).split('/').map(c=>hebrewSegment(c,aramaic));
 return segs.every(Boolean)?{lang:aramaic?'아람어':'히브리어',segs}:null;
}
const GR_POS={'A-':'형용사','C-':'접속사','D-':'부사','I-':'감탄사','N-':'명사','P-':'전치사',RA:'정관사',RD:'지시대명사',RI:'의문·부정대명사',RP:'인칭대명사',RR:'관계대명사','V-':'동사','X-':'불변화사'};
const GR_TENSE={P:'현재',I:'미완료',F:'미래',A:'부정과거(아오리스트)',X:'완료',Y:'과거완료'},GR_VOICE={A:'능동태',M:'중간태',P:'수동태'},GR_MOOD={I:'직설법',D:'명령법',S:'가정법',O:'희구법',N:'부정사',P:'분사'};
const GR_CASE={N:'주격',G:'속격',D:'여격',A:'대격',V:'호격'},GR_NUMBER={S:'단수',P:'복수'},GR_GENDER={M:'남성',F:'여성',N:'중성'},GR_DEGREE={C:'비교급',S:'최상급'},GR_PERSON={1:'1인칭',2:'2인칭',3:'3인칭'};
function morphGreek(c){
 const pos=c&&GR_POS[c.slice(0,2)];if(!pos)return null;
 const [person,tense,voice,mood,cs,number,gender,degree]=c.slice(2);
 const feats=[GR_TENSE[tense],GR_VOICE[voice],GR_MOOD[mood],GR_PERSON[person],GR_CASE[cs],GR_NUMBER[number],GR_GENDER[gender],GR_DEGREE[degree]].filter(Boolean);
 return {lang:'헬라어',segs:[{pos,feats,note:''}]};
}
function morphHTML(r){
 if(!r)return '';
 const segs=r.segs.map((s,i)=>`<span class="mo-seg">${i?'<i class="mo-plus">+</i>':''}<b>${esc(s.pos)}</b>${s.feats.length?` ${esc(s.feats.join(' · '))}`:''}</span>`).join('');
 const notes=r.segs.filter(s=>s.note).map(s=>`<p class="mo-note">${esc(s.feats[0])}: ${esc(s.note)} <span>· 일반적인 기능이며 단어마다 다를 수 있습니다</span></p>`).join('');
 return `<div class="wd-morph"><span class="wd-label">형태${r.lang==='아람어'?' · 아람어':''}</span><div class="mo-segs">${segs}</div>${notes}</div>`;
}
