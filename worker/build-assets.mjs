import {readFile,mkdir,writeFile,rm} from 'node:fs/promises';
const root=new URL('../',import.meta.url),dest=new URL('../.worker-data/',import.meta.url);
await rm(dest,{recursive:true,force:true});await mkdir(dest,{recursive:true});
const books=JSON.parse(await readFile(new URL('data/books.json',root),'utf8'));
const mapping=JSON.parse(await readFile(new URL('data/psalm-verses.json',root),'utf8'));
let chapters=0;
for(const b of books){const raw=JSON.parse(await readFile(new URL(`data/${b.code}.json`,root),'utf8'));const data={};for(const [sourceKey,v] of Object.entries(raw)){const key=b.code==='Ps'?(mapping[sourceKey]?.key||sourceKey):sourceKey;const {l,p,...verse}=v;data[key]={...verse,sourceKey};}const grouped={};for(const [key,v] of Object.entries(data)){const c=key.split(':')[0];(grouped[c]??={})[key]=v;}b.chapters=Object.keys(grouped).map(Number);await mkdir(new URL(`${b.code}/`,dest),{recursive:true});for(const [c,v] of Object.entries(grouped)){await writeFile(new URL(`${b.code}/${c}.json`,dest),JSON.stringify(v));chapters++;}}
await writeFile(new URL('books.json',dest),JSON.stringify(books));console.log(`Built ${books.length} books / ${chapters} chapter assets`);
