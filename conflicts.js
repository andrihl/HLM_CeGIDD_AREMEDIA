'use strict';
// Never update existing records. Explicitly attach a missing medical record only.
const conflictPanel=$('conflictPanel8');
const canonical8=v=>Array.isArray(v)?v.map(canonical8):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical8(v[k])])):v;
const equal8=(a,b)=>JSON.stringify(canonical8(a??null))===JSON.stringify(canonical8(b??null));
async function verify8(){if(!profile||offlineMode||!networkReady||remaining()<=0)throw Error('Session connectée requise');const u=err(await db.auth.getUser()).user;const f=err(await db.from('profiles').select('id,active,roles').eq('id',u.id).single());if(!f.active||u.id!==profile.id||u.id!==vault?.owner||err(await db.auth.mfa.getAuthenticatorAssuranceLevel()).currentLevel!=='aal2')throw Error('Habilitation non valide');return f;}
function el8(tag,text,parent){const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;}
async function remove8(q){const prev=vault.queue;vault.queue=prev.filter(x=>x.id!==q.id);try{await persist6()}catch(e){vault.queue=prev;throw e}}
async function inspect8(q,f){if(!f.roles.some(r=>['aremedia','medecin'].includes(r))||q.m&&!f.roles.includes('medecin'))throw Error('Droits insuffisants pour cette fiche');const a=err(await db.from('actions').select('id,status,location,action_date').eq('id',q.action).single());const p=err(await db.from('patients').select(['id',...Object.keys(q.p)].join(',')).eq('action_id',q.action).eq('ipp',q.ipp).maybeSingle());const m=p&&q.m?err(await db.from('medical_records').select(['id',...Object.keys(q.m)].join(',')).eq('patient_id',p.id).maybeSingle()):null;return {a,p,m};}
function sameFields8(local,remote){return !!remote&&Object.keys(local).every(k=>equal8(local[k],remote[k]));}
function differences8(local,remote,parent){const table=document.createElement('table');parent.append(table);const h=table.insertRow();for(const x of ['Champ','Serveur','Local'])el8('th',x,h);function walk(a,b,path){if(equal8(a,b))return;if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))walk(a[k],b[k],path+' / '+k);return}const r=table.insertRow();for(const x of [path,JSON.stringify(b??null),JSON.stringify(a??null)])el8('td',x,r);}for(const k of Object.keys(local))walk(local[k],remote?.[k],k);if(table.rows.length===1)el8('p','Aucune différence sur les champs comparés.',parent);}
async function render8(){conflictPanel.replaceChildren();el8('h2','Fiches locales en attente',conflictPanel);const f=await verify8();if(!vault.queue.length)el8('p','Aucune fiche en attente.',conflictPanel);for(const q of vault.queue){const box=el8('section','',conflictPanel);el8('h3','IPP '+q.ipp,box);try{const {a,p,m}=await inspect8(q,f);el8('p',`${a.action_date} · ${a.location} · ${a.status==='open'?'Ouverte':'Non ouverte'}`,box);el8('p',p?'IPP déjà présent sur le serveur':'IPP absent du serveur',box);if(p){const d=el8('details','',box);el8('summary','Comparer les différences',d);el8('h4','Inscription',d);differences8(q.p,p,d);if(q.m){el8('h4','Questionnaire médical',d);if(m)differences8(q.m,m,d);else el8('p','Questionnaire absent du serveur.',d);}}
const identical=p&&sameFields8(q.p,p)&&(!q.m||sameFields8(q.m,m));const attach=p&&q.m&&!m&&sameFields8(q.p,p)&&a.status==='open';
function action(label,fn){const b=el8('button',label,box);b.type='button';b.onclick=async()=>{if(busy)return;busy=true;try{const fresh=await verify8();const now=await inspect8(q,fresh);await fn(now);await render8()}catch(e){$('actionmsg').textContent='Gestion locale : '+e.message;conflictPanel.replaceChildren();}finally{busy=false}};}
if(identical)action('Valider la fiche identique',async n=>{if(!sameFields8(q.p,n.p)||q.m&&!sameFields8(q.m,n.m))throw Error('Dossier modifié, comparer de nouveau');await remove8(q)});
if(attach)action('Compléter le questionnaire médical manquant',async n=>{if(n.a.status!=='open'||!n.p||n.m||!sameFields8(q.p,n.p))throw Error('Dossier modifié, comparer de nouveau');if(!confirm('Confirmer le rattachement du questionnaire à cet IPP ?'))return;err(await db.from('medical_records').insert({...q.m,id:q.mid,patient_id:n.p.id}));await remove8(q)});
if(p&&!identical&&!attach)el8('p','Différences à résoudre dans le dossier serveur par un professionnel habilité. Aucun écrasement automatique.',box);
if(p&&p.id!==q.id&&a.status==='open')action('Modifier l’IPP',async n=>{
 if(n.a.status!=='open'||!n.p||n.p.id===q.id)throw Error('Conflit modifié : actualiser la liste');
 const old=q.ipp;const input=prompt('IPP correct du même patient (10 chiffres). Vérifier son identité avant toute correction.',old);if(input===null)return;
 const next=input.trim();if(!/^\d{10}$/.test(next)||next===old)throw Error('Saisir un nouvel IPP de 10 chiffres');
 if(vault.queue.some(x=>x.id!==q.id&&x.action===q.action&&x.ipp===next))throw Error('IPP déjà présent dans les fiches locales de cette action');
 const own=err(await db.from('patients').select('id').eq('id',q.id).maybeSingle());if(own)throw Error('Fiche déjà partiellement transférée : correction manuelle requise');
 const duplicate=err(await db.from('patients').select('id').eq('action_id',q.action).eq('ipp',next).maybeSingle());if(duplicate)throw Error('Nouvel IPP déjà présent sur le serveur');
 if(!confirm('Confirmer après vérification de l’identité : '+old+' → '+next+' ? Toutes les données locales seront conservées.'))return;
 await verify8();const previous=structuredClone(vault.queue);q.ipp=next;delete q.attempted;
 try{await persist6()}catch(e){vault.queue=previous;throw e}
 $('actionmsg').textContent='IPP corrigé localement. Cliquer sur Synchroniser les fiches locales.';
});
action('Supprimer la copie locale',async()=>{if(confirm('Supprimer définitivement cette fiche locale, même si des données ne sont pas sur le serveur ?'))await remove8(q)});
}catch(e){el8('p',e.message,box)}}}
$('manage8').onclick=async()=>{if(busy||offlineMode)return;busy=true;try{if(!vault)await unlock6();await render8();$('dialog8').showModal()}catch(e){$('actionmsg').textContent=e.message;conflictPanel.replaceChildren()}finally{busy=false}};
$('close8').onclick=()=>{$('dialog8').close();conflictPanel.replaceChildren()};
$('dialog8').addEventListener('close',()=>conflictPanel.replaceChildren());
const wipe8=wipe;wipe=function(){$('dialog8').close();conflictPanel.replaceChildren();wipe8()};
const logistics8=logisticsButtons;logisticsButtons=function(){logistics8();$('manage8').hidden=offlineMode};
