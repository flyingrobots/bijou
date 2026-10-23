import { readFileSync, writeFileSync } from 'node:fs';
import { createTestContext } from '../../../packages/bijou/src/adapters/test/index.ts';
import { tableSurface, tv, colorHex } from '../../../packages/bijou/src/index.ts';
const records = JSON.parse(readFileSync(new URL('../table-data.json', import.meta.url), 'utf8'));
if (!Array.isArray(records)) throw new Error('Table data must be an array');
for (const record of records) {
 if (typeof record.id !== 'string' || !Array.isArray(record.headers) || !record.headers.every(value => typeof value === 'string') || !Array.isArray(record.rows) || !record.rows.every(row => Array.isArray(row) && row.length === record.headers.length && row.every(value => typeof value === 'string'))) throw new Error('Invalid table data record');
}
const destination = process.argv[2];
if (!destination) throw new Error('Pass an owned output JSON path');
const frames = [];
const clean = (text) => text.replace(/✅/gu,'[pass]').replace(/❌/gu,'[fail]').replace(/⚠️?/gu,'[warning]').replace(/🔴/gu,'[RED]').replace(/🟢/gu,'[GREEN]').replace(/🟡/gu,'[pending]').replace(/🚧/gu,'[in progress]').replace(/🎯/gu,'[goal]').replace(/💡/gu,'[idea]').replace(/🧪/gu,'[test]').replace(/📦/gu,'[package]').replace(/ⓘ/gu,'[info]').replace(/🏆/gu,'[award]').replace(/🚀/gu,'[launch]').replace(/🎉/gu,'[celebration]').replace(/\r?\n/gu,' ');
for (const record of records) {
 const groups=record.headers.length>=7?Array.from({length:Math.ceil((record.headers.length-1)/3)},(_,group)=>[0,...Array.from({length:3},(_,offset)=>1+group*3+offset).filter(index=>index<record.headers.length)]):[record.headers.map((_,index)=>index)];
 for(const [groupIndex,indices] of groups.entries()){
 const headers=indices.map(index=>record.headers[index]);
 const sourceRows=record.rows.map(row=>indices.map(index=>row[index]??''));
 const columns = headers.map((header, index) => {
  const values = [header, ...sourceRows.map(row=>row[index]??'')].map(clean);
  const longest = Math.max(...values.flatMap(value=>value.split(/\s+/u).map(word=>word.length)));
  return {header:clean(header), minWidth:Math.min(16,Math.max(6,longest)), weight:index===0?1.25:1};
 });
 const width = columns.length>=7?94:86;
 const ctx = createTestContext({mode:'interactive',runtime:{columns:width,rows:60}});
 const options = {columns, width, wrap:'word', overflow:'wrap', ctx,
   headerToken:tv('#83312c',['bold']), borderToken:tv('#83312c'), headerBgToken:{hex:'#83312c',bg:'#ffedeb'}};
 const rows=sourceRows.map(row=>row.map(clean));
 const pages=[]; let batch=[], start=0;
 for (const row of rows) {
  const candidate=tableSurface({...options,rows:[...batch,row]});
  if(candidate.height>54 && batch.length){pages.push({rows:batch,start});start+=batch.length;batch=[row];}
  else batch.push(row);
 }
 if(batch.length || !pages.length)pages.push({rows:batch,start});
 for (const [part,page] of pages.entries()) {
  const frame=tableSurface({...options,rows:page.rows});
  if(frame.height>60)throw new Error(`Row too tall in ${record.id}: ${frame.height}`);
  const cells=[];
  for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++){
   const cell=frame.get(x,y);
   cells.push({x,y,char:cell.char??' ',fg:cell.fgRGB?`#${cell.fgRGB.map(n=>n.toString(16).padStart(2,'0')).join('')}`:colorHex(cell.fg),bg:cell.bgRGB?`#${cell.bgRGB.map(n=>n.toString(16).padStart(2,'0')).join('')}`:colorHex(cell.bg),modifiers:cell.modifiers,empty:cell.empty});
  }
  frames.push({id:`${record.id}-g${groupIndex+1}-${part+1}`,table:record.id,column_indices:indices,column_group:groupIndex+1,column_groups:groups.length,title:`${record.source}, table ${record.ordinal+1}`,part:part+1,parts:pages.length,row_start:page.start,row_count:page.rows.length,width:frame.width,height:frame.height,cells});
 }
 }
}
writeFileSync(destination,JSON.stringify(frames));
console.log(JSON.stringify({tables:records.length,panels:frames.length,maxHeight:Math.max(...frames.map(f=>f.height)),maxWidth:Math.max(...frames.map(f=>f.width))}));
