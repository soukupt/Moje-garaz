// Dokumenty seskupené podle vozidla + dokumenty přímo v detailu auta.
vehicles.forEach(v=>{
  if(!Array.isArray(v.documents)) v.documents=[];
  // Zachováme stávající zelenou kartu z původního pole doc.
  if(v.doc && !v.documents.some(d=>d.kind==='green-card')){
    v.documents.unshift({id:crypto.randomUUID(),kind:'green-card',title:'Zelená karta',fileName:v.doc.fileName||'',validTo:v.doc.validTo||'',createdAt:new Date().toISOString()});
  }
});
save();

function vehicleDocumentItems(v){
  const items=[...(v.documents||[])];
  (v.serviceHistory||[]).forEach(h=>{
    if(h.fileName) items.push({id:`service-${h.id}`,kind:'service',title:`Faktura / doklad · ${h.title}`,fileName:h.fileName,date:h.date||'',serviceId:h.id});
  });
  return items;
}
function documentKindIcon(kind){return kind==='green-card'?'🟢':kind==='registration'?'🪪':kind==='service'?'🧾':'📄'}
function documentMeta(d){
  const bits=[];
  if(d.fileName) bits.push(d.fileName);
  if(d.validTo) bits.push(`platnost do ${formatDate(d.validTo)}`);
  if(d.date) bits.push(formatDate(d.date));
  return bits.join(' · ')||'Dokument';
}
function addVehicleDocument(v,kind,title,file){
  if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    v.documents=v.documents||[];
    if(kind==='green-card') v.documents=v.documents.filter(d=>d.kind!=='green-card');
    v.documents.push({id:crypto.randomUUID(),kind,title,fileName:file.name,fileData:String(reader.result||''),createdAt:new Date().toISOString()});
    if(kind==='green-card') v.doc={...(v.doc||{}),fileName:file.name,fileData:String(reader.result||'')};
    save();renderVehicleDetail(v.id);
  };
  reader.readAsDataURL(file);
}
function openStoredDocument(d){
  if(d.fileData){window.open(d.fileData,'_blank');return;}
  alert('U tohoto staršího záznamu je zatím uložený jen název souboru. Nahraj dokument znovu a půjde i otevřít.');
}

const docsDetailBefore=renderVehicleDetail;
renderVehicleDetail=function(id){
  docsDetailBefore(id);
  const v=vehicles.find(x=>x.id===id);if(!v)return;
  const docs=vehicleDocumentItems(v);
  const section=document.createElement('section');section.className='page-card';section.id='vehicleDocumentsCard';
  section.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h3 style="margin:0">📄 Dokumenty</h3><div class="meta">Zelená karta, techničák a servisní faktury</div></div><span class="pill">${docs.length}</span></div>
    <div style="margin-top:12px">${docs.length?docs.map(d=>`<button type="button" class="vehicle-document-row" data-docid="${esc(d.id)}" style="width:100%;display:flex;align-items:center;gap:11px;text-align:left;border:0;border-top:1px solid #eef2f7;background:white;padding:12px 0"><span style="font-size:22px">${documentKindIcon(d.kind)}</span><span style="min-width:0;flex:1"><strong style="display:block">${esc(d.title)}</strong><span class="meta" style="display:block;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(documentMeta(d))}</span></span><span style="color:#94a3b8">›</span></button>`).join(''):'<div class="meta">Zatím tu nejsou žádné dokumenty.</div>'}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"><label style="border:1px solid #dbe2ea;border-radius:12px;padding:11px;text-align:center;font-weight:700;font-size:13px;cursor:pointer">＋ Zelená karta<input class="vehicle-doc-upload" data-kind="green-card" data-title="Zelená karta" type="file" accept="image/*,.pdf" style="display:none"></label><label style="border:1px solid #dbe2ea;border-radius:12px;padding:11px;text-align:center;font-weight:700;font-size:13px;cursor:pointer">＋ Techničák<input class="vehicle-doc-upload" data-kind="registration" data-title="Technický průkaz" type="file" accept="image/*,.pdf" style="display:none"></label></div>`;
  const terms=[...main.querySelectorAll('.page-card')].find(c=>c.querySelector('h3')?.textContent?.includes('Aktuální termíny'));
  if(terms) terms.insertAdjacentElement('afterend',section); else main.appendChild(section);
  section.querySelectorAll('.vehicle-doc-upload').forEach(inp=>inp.addEventListener('change',()=>addVehicleDocument(v,inp.dataset.kind,inp.dataset.title,inp.files?.[0])));
  section.querySelectorAll('.vehicle-document-row').forEach(btn=>btn.addEventListener('click',()=>{
    const d=docs.find(x=>String(x.id)===btn.dataset.docid);if(d)openStoredDocument(d);
  }));
};

// Spodní Dokumenty zůstávají, ale první úroveň je vždy seznam vozidel.
renderDocs=function(){
  activeVehicleId=null;
  main.innerHTML=`<div class="page-card"><h2>Dokumenty</h2><p class="lead">Dokumenty jsou přehledně rozdělené podle vozidel.</p></div>${vehicles.length?vehicles.map(v=>{const count=vehicleDocumentItems(v).length;return `<button class="page-card docs-vehicle-open" data-id="${v.id}" style="width:100%;border:0;text-align:left;display:flex;align-items:center;gap:13px"><div class="vehicle-avatar" style="width:48px;height:48px;font-size:24px">${icon(v.type)}</div><div style="flex:1;min-width:0"><strong style="font-size:16px">${esc(v.name)}</strong><div class="meta">${esc(v.plate)} · ${count} ${count===1?'dokument':'dokumentů'}</div></div><span style="font-size:22px;color:#94a3b8">›</span></button>`}).join(''):'<div class="empty">Zatím nemáš žádné vozidlo.</div>'}`;
  document.querySelectorAll('.docs-vehicle-open').forEach(b=>b.onclick=()=>renderVehicleDetail(b.dataset.id));
};

render();