'use strict';
// Local A4 raster PDF. No external conversion service or patient storage.
async function makePatientPdf(meta,records,sections,val,valid){
 const enc=new TextEncoder(), chunks=[], offsets=[0];let length=0,next=3;const pageIds=[];
 const add=x=>{const b=typeof x==='string'?enc.encode(x):x;chunks.push(b);length+=b.length};
 const obj=(id,body)=>{offsets[id]=length;add(id+' 0 obj\n');add(body);add('\nendobj\n')};
 const stream=(id,dict,bytes)=>{offsets[id]=length;add(id+' 0 obj\n<< '+dict+' /Length '+bytes.length+' >>\nstream\n');add(bytes);add('\nendstream\nendobj\n')};
 add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
 const canvas=document.createElement('canvas');canvas.width=2480;canvas.height=3508;const c=canvas.getContext('2d');const W=2480,H=3508,M=95,B=3370;
 function wrap(text,width,font){c.font=font;const lines=[];for(const paragraph of String(text).split(/\r?\n/)){let line='';for(const word of paragraph.split(/\s+/)){if(line&&c.measureText(line+' '+word).width>width){lines.push(line);line=''}if(c.measureText(word).width>width){if(line){lines.push(line);line=''}for(const ch of word){if(c.measureText(line+ch).width>width){lines.push(line);line=''}line+=ch}}else line+=(line?' ':'')+word;}lines.push(line)}return lines}
 for(const r of records){let page=0;
 const groups=sections(r).map(([name,fields])=>({name,entries:Object.entries(fields).filter(([k,v])=>val(v)!=='')})).filter(g=>g.entries.length);
 const full=W-2*M,gap=65,col=(full-gap)/2;
 function layout(size){const font=size+'px Arial',line=Math.ceil(size*1.16),pad=6;
 const make=(g,width)=>[{heading:true,text:g.name,h:line+12},...g.entries.flatMap(([k,v])=>wrap(k+' : '+val(v),width-18,font).map((text,i)=>({text,h:line+(i===0?pad:0)})))];
 const identity=groups.filter(g=>g.name==='Identité et administration').flatMap(g=>make(g,full));
 const rest=groups.filter(g=>g.name!=='Identité et administration').flatMap(g=>make(g,col));
 return {font,line,identity,rest};}
 const sum=arr=>arr.reduce((n,x)=>n+x.h,0);
 const metaLines=wrap(meta.action_date+' · '+meta.location+' · IPP '+r.p.ipp,full,'40px Arial');
 const top=190+metaLines.length*48;
 let L=layout(52);for(const size of [52,49,46,43,40,37,34]){L=layout(size);if(sum(L.identity)+Math.ceil(sum(L.rest)/2)+100<=B-top)break;}
 function start(){page++;c.fillStyle='#fff';c.fillRect(0,0,W,H);c.fillStyle='#176b9b';c.fillRect(M,65,full,12);c.font='bold 45px Arial';c.fillText('AREMEDIA · CeGIDD Saint-Antoine',M,130);c.fillStyle='#182b3b';c.font='40px Arial';let y=185;for(const l of metaLines){c.fillText(l,M,y);y+=48;}return top;}
 function draw(item,x,y,width){if(item.heading){c.fillStyle='#e7f0f5';c.fillRect(x,y,width,item.h-3);c.fillStyle='#176b9b';c.font='bold '+L.font;c.fillText(item.text,x+8,y+L.line-5);}else{c.fillStyle='#182b3b';c.font=L.font;c.fillText(item.text,x+8,y+L.line-5);}return y+item.h;}
 async function finish(){if(!valid())throw Error('Session ou action changée');c.fillStyle='#536b75';c.font='36px Arial';c.fillText('CONFIDENTIEL — SECRET PROFESSIONNEL · Fiche page '+page,M,3450);const jpeg=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF indisponible')),'image/jpeg',0.93));const bytes=new Uint8Array(await jpeg.arrayBuffer());const pid=next++,img=next++,content=next++;pageIds.push(pid);obj(pid,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${img} 0 R >> >> /Contents ${content} 0 R >>`);stream(img,`/Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,bytes);stream(content,'',enc.encode('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q'));}

 let y=start();for(const item of L.identity){if(y+item.h>B){await finish();y=start();}y=draw(item,M,y,full);}y+=18;
 let i=0;while(i<L.rest.length){const base=y;const available=B-base;const remaining=sum(L.rest.slice(i));const target=remaining<=2*available?Math.min(available,Math.ceil(remaining/2)+L.line):available;
 for(let j=0;j<2&&i<L.rest.length;j++){let yy=base,x=M+j*(col+gap),limit=j===0?base+target:B;while(i<L.rest.length){const item=L.rest[i];const need=item.h+(item.heading&&L.rest[i+1]?L.rest[i+1].h:0);if(yy+need>limit)break;yy=draw(item,x,yy,col);i++;}}
 if(i<L.rest.length){await finish();y=start();}else break;}
 await finish();}
 canvas.width=1;canvas.height=1;obj(2,'<< /Type /Pages /Count '+pageIds.length+' /Kids ['+pageIds.map(i=>i+' 0 R').join(' ')+'] >>');const xref=length;add('xref\n0 '+next+'\n0000000000 65535 f \n');for(let i=1;i<next;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+next+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(chunks,{type:'application/pdf'});
}
