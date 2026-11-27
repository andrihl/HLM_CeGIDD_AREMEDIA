'use strict';
$('journal18').onclick=()=>logisticsRun(async()=>{
 if(offlineMode)throw Error('Journal disponible uniquement en ligne');
 const el=startPanel(), title=document.createElement('h2');title.textContent='Journal d’activité';el.append(title);
 const list=document.createElement('div');el.append(list);let cursor=null;
 const labels={insert:'Création',update:'Modification',delete:'Suppression',read:'Consultation',patients:'Fiche administrative',medical_records:'Fiche médicale',tracking:'Suivi ORBIS / DIAM',actions:'Action',profiles:'Habilitations',v174_sites:'Lieu',journal:'Journal'};
 const more=panelButton(el,'Afficher les événements précédents',()=>logisticsRun(load));
 async function load(){const entries=err(await db.rpc('v18_journal',{before_id:cursor}));if(!el.contains(list)||!$('profileDialog').open)return;for(const e of entries){const card=document.createElement('section');const h=document.createElement('strong');h.textContent=(labels[e.event]||e.event)+' · '+(labels[e.object_type]||e.object_type);card.append(h);const p=document.createElement('p');p.textContent=(e.actor_name||'Compte non identifié')+' · '+new Date(e.at).toLocaleString('fr-FR');card.append(p);const small=document.createElement('small');small.textContent=[e.action_id?'Action '+e.action_id:'',e.object_id?'Référence '+e.object_id:'','Serveur'].filter(Boolean).join(' · ');card.append(small);list.append(card);}if(entries.length)cursor=entries.at(-1).id;more.hidden=entries.length<100;}
 await load();
});
