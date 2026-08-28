const defaultVehicles=[
{id:crypto.randomUUID(),name:'Ford Mustang Mach‑E',plate:'7AC 1234',type:'Osobní automobil',year:'2021',km:'60000',vin:'',doc:null},
{id:crypto.randomUUID(),name:'Volkswagen Touareg',plate:'6BC 5678',type:'Osobní automobil',year:'2004',km:'',vin:'',doc:null},
{id:crypto.randomUUID(),name:'Pongratz LPA 206 U',plate:'5E9 9012',type:'Přívěsný vozík',year:'',km:'',vin:'',doc:null}
];
let vehicles=JSON.parse(localStorage.getItem('garageVehicles')||'null')||defaultVehicles;
let activeView='garage';
const premiumUnlocked=true;
const main=document.querySelector('#main');
const vehicleDialog=document.querySelector('#vehicleDialog');
const vehicleForm=document.querySelector('#vehicleForm');
const docDialog=document.querySelector('#docDialog');
const docForm=document.querySelector('#docForm');
const premiumDialog=document.querySelector('#premiumDialog');
function save(){localStorage.setItem('garageVehicles',JSON.stringify(vehicles));}
function icon(type){if(type.includes('Přívěs'))return '🛻';if(type.includes('Mot'))return '🏍️';if(type.includes('Dod'))return '🚐';return '🚙'}
function renderGarage(){
 main.innerHTML=`<button class="primary add-btn" id="addVehicle">＋ Přidat vozidlo</button><div class="section-title"><h3>Vozidla</h3><span class="count">${vehicles.length} položky</span></div><div id="vehicleList"></div><section class="premium-banner"><div class="eyebrow gold">♛ PREMIUM</div><h3>Už nikdy na nic nezapomeň</h3><p>STK, výměny oleje, pneumatiky a další termíny s upozorněním.</p><button class="premium-cta" id="showPremium">Premium odemčeno ✓</button></section>`;
 const list=document.querySelector('#vehicleList');
 if(!vehicles.length)list.innerHTML='<div class="empty">Zatím tu nic není. Přidej první auto nebo vozík.</div>';
 vehicles.forEach(v=>{const c=document.createElement('article');c.className='vehicle-card';c.innerHTML=`<div class="vehicle-top"><div class="vehicle-avatar">${icon(v.type)}</div><div class="vehicle-title"><h3>${esc(v.name)}</h3><span class="plate">🇨🇿 ${esc(v.plate)}</span><div class="meta">${esc(v.type)}${v.year?' · '+esc(v.year):''}${v.km?' · '+Number(v.km).toLocaleString('cs-CZ')+' km':''}</div></div></div><div class="quick-row"><button class="quick free doc-btn" data-id="${v.id}"><strong>🟢 Zelená karta</strong><span>${v.doc?('uložena'+(v.doc.validTo?' · do '+formatDate(v.doc.validTo):'')):'přidat dokument'}</span></button><button class="quick premium service-btn" data-id="${v.id}" data-kind="stk"><strong>🟡 STK</strong><span>${v.stkDate?'do '+formatDate(v.stkDate):'nastavit termín'}</span></button><button class="quick premium service-btn" data-id="${v.id}" data-kind="oil"><strong>🛢️ Výměna oleje</strong><span>${v.oilDate?'do '+formatDate(v.oilDate):'nastavit termín'}</span></button><button class="quick locked service-btn" data-id="${v.id}" data-kind="reminder"><strong>🔔 Upozornění</strong><span>${v.reminderDate?'na '+formatDate(v.reminderDate):'nastavit'}</span></button></div>`;list.appendChild(c)});
 document.querySelector('#addVehicle').onclick=()=>vehicleDialog.showModal();document.querySelector('#showPremium').onclick=()=>{activeView='terms';render()};document.querySelectorAll('.service-btn').forEach(b=>b.onclick=()=>setService(b.dataset.id,b.dataset.kind));document.querySelectorAll('.doc-btn').forEach(b=>b.onclick=()=>openDoc(b.dataset.id));
}
function renderTerms(){
 const rows=[];
 vehicles.forEach(v=>{
  if(v.stkDate) rows.push(`<div class="term"><div><strong>${esc(v.name)} · STK</strong><div class="meta">Platnost do ${formatDate(v.stkDate)}</div></div><span class="pill premium">AKTIVNÍ</span></div>`);
  if(v.oilDate) rows.push(`<div class="term"><div><strong>${esc(v.name)} · Olej</strong><div class="meta">Termín ${formatDate(v.oilDate)}</div></div><span class="pill premium">AKTIVNÍ</span></div>`);
  if(v.reminderDate) rows.push(`<div class="term"><div><strong>${esc(v.name)} · Připomínka</strong><div class="meta">${formatDate(v.reminderDate)}</div></div><span class="pill premium">AKTIVNÍ</span></div>`);
 });
 main.innerHTML=`<div class="page-card"><h2>Termíny</h2><p class="lead">Premium je pro testování odemčené ✓</p></div><div class="page-card">${rows.length?rows.join(''):'<div class="empty">Termíny nastavíš přímo u jednotlivých vozidel v Garáži.</div>'}</div>`;
}
function renderDocs(){const docs=vehicles.filter(v=>v.doc);main.innerHTML=`<div class="page-card"><h2>Dokumenty</h2><p class="lead">Zelené karty máš zdarma.</p></div>${docs.length?docs.map(v=>`<div class="page-card"><strong>${esc(v.name)}</strong><div class="meta">${esc(v.plate)} · ${esc(v.doc.fileName||'Zelená karta')}${v.doc.validTo?' · platnost do '+formatDate(v.doc.validTo):''}</div></div>`).join(''):'<div class="empty">Zatím nemáš uloženou žádnou zelenou kartu.</div>'}`}
function renderMore(){main.innerHTML=`<div class="page-card"><h2>Více</h2><div class="term"><div><strong>Účet a synchronizace</strong><div class="meta">Připravíme pro ostrou verzi</div></div><span class="pill">BRZY</span></div><div class="term"><div><strong>Export dat</strong><div class="meta">Záloha vozidel a dokumentů</div></div><span class="pill">BRZY</span></div><div class="term"><div><strong>Premium</strong><div class="meta">STK, olej, notifikace a servis</div></div><span class="pill premium">PREMIUM</span></div></div>`}
function render(){document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===activeView));({garage:renderGarage,terms:renderTerms,docs:renderDocs,more:renderMore})[activeView]()}
function openDoc(id){docForm.reset();docForm.vehicleId.value=id;document.querySelector('#docFileName').textContent='';docDialog.showModal()}
vehicleForm.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(vehicleForm);vehicles.unshift({id:crypto.randomUUID(),name:f.get('name'),plate:f.get('plate'),type:f.get('type'),year:f.get('year'),km:f.get('km'),vin:f.get('vin'),doc:null});save();vehicleDialog.close();vehicleForm.reset();render()});
docForm.file.addEventListener('change',()=>document.querySelector('#docFileName').textContent=docForm.file.files[0]?.name||'');docForm.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(docForm),v=vehicles.find(x=>x.id===f.get('vehicleId'));if(v){v.doc={validTo:f.get('validTo'),fileName:docForm.file.files[0]?.name||'Zelená karta'};save()}docDialog.close();render()});
document.querySelectorAll('.nav-item').forEach(b=>b.onclick=()=>{activeView=b.dataset.view;render()});document.querySelector('#notifBtn').onclick=()=>{activeView='terms';render()};
function setService(id,kind){const v=vehicles.find(x=>x.id===id);if(!v)return;const labels={stk:'Datum platnosti STK (RRRR-MM-DD)',oil:'Datum příští výměny oleje (RRRR-MM-DD)',reminder:'Datum připomínky (RRRR-MM-DD)'};const keys={stk:'stkDate',oil:'oilDate',reminder:'reminderDate'};const val=prompt(labels[kind],v[keys[kind]]||'');if(val!==null){v[keys[kind]]=val.trim();save();render();}}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}function formatDate(d){if(!d)return'';return new Date(d+'T12:00:00').toLocaleDateString('cs-CZ')}
save();render();
