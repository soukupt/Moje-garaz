// Vzhled vozidla: ikona, barva a vlastní fotografie
vehicles.forEach(v=>{
  if(v.vehicleIcon===undefined) v.vehicleIcon='';
  if(v.vehicleColor===undefined) v.vehicleColor='#e2e8f0';
  if(v.vehiclePhoto===undefined) v.vehiclePhoto='';
});
save();

function chosenVehicleIcon(v){
  return v.vehicleIcon || icon(v.type);
}

function vehicleVisualHtml(v,large=false){
  const size=large?72:48;
  if(v.vehiclePhoto){
    return `<div class="vehicle-avatar" style="width:${size}px;height:${size}px;padding:0;overflow:hidden;background:#e2e8f0"><img src="${v.vehiclePhoto}" alt="${esc(v.name)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`;
  }
  return `<div class="vehicle-avatar" style="width:${size}px;height:${size}px;background:${esc(v.vehicleColor||'#e2e8f0')};font-size:${large?34:24}px">${chosenVehicleIcon(v)}</div>`;
}

const appearanceRenderGarage=renderGarage;
renderGarage=function(){
  appearanceRenderGarage();
  vehicles.forEach(v=>{
    const opener=document.querySelector(`.vehicle-open[data-id="${v.id}"]`);
    if(!opener) return;
    const old=opener.querySelector('.vehicle-avatar');
    if(old) old.outerHTML=vehicleVisualHtml(v,false);
  });
};

const appearanceRenderVehicleDetail=renderVehicleDetail;
renderVehicleDetail=function(id){
  appearanceRenderVehicleDetail(id);
  const v=vehicles.find(x=>x.id===id);
  if(!v) return;

  const headerCard=main.querySelector('.page-card');
  if(headerCard){
    const old=headerCard.querySelector('.vehicle-avatar');
    if(old) old.outerHTML=vehicleVisualHtml(v,true);
  }

  const appearanceCard=document.createElement('section');
  appearanceCard.className='page-card';
  appearanceCard.id='vehicleAppearanceCard';
  appearanceCard.innerHTML=`
    <h3 style="margin-top:0">Vzhled vozidla</h3>
    <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">
      ${vehicleVisualHtml(v,true)}
      <div><strong>${esc(v.name)}</strong><div class="meta">Vyber ikonu, barvu nebo vlastní fotografii</div></div>
    </div>
    <form id="vehicleAppearanceForm" style="display:grid;gap:14px">
      <div>
        <div style="font-size:14px;font-weight:700;margin-bottom:8px">Ikona</div>
        <div id="vehicleIconChoices" style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px">
          ${['🚗','🚙','🏎️','🚐','🛻','🏍️','🚚','🚘','🚖','🚕','🚛','🚜'].map(i=>`<button type="button" class="vehicle-icon-choice" data-icon="${i}" style="min-height:46px;border:${chosenVehicleIcon(v)===i?'2px solid #2563eb':'1px solid #dbe2ea'};background:white;border-radius:12px;font-size:24px">${i}</button>`).join('')}
        </div>
      </div>
      <label style="font-size:14px;font-weight:700">Barva ikony
        <input id="vehicleColorInput" type="color" value="${esc(v.vehicleColor||'#e2e8f0')}" style="display:block;width:100%;height:46px;margin-top:7px;border:1px solid #dbe2ea;border-radius:12px;background:white;padding:3px">
      </label>
      <label style="font-size:14px;font-weight:700">Vlastní fotografie
        <input id="vehiclePhotoInput" type="file" accept="image/*" style="display:block;width:100%;margin-top:7px;font-size:15px">
      </label>
      ${v.vehiclePhoto?'<button id="removeVehiclePhoto" type="button" style="border:1px solid #dbe2ea;background:white;border-radius:12px;padding:11px;font-weight:700">Odstranit fotografii</button>':''}
      <div class="meta">Prototyp ukládá fotografii jen do tohoto prohlížeče. Pro ostrou aplikaci použijeme cloudové úložiště.</div>
    </form>`;

  if(headerCard) headerCard.insertAdjacentElement('afterend',appearanceCard);

  document.querySelectorAll('.vehicle-icon-choice').forEach(b=>b.addEventListener('click',()=>{
    v.vehicleIcon=b.dataset.icon;
    v.vehiclePhoto='';
    save();
    renderVehicleDetail(id);
  }));

  document.querySelector('#vehicleColorInput')?.addEventListener('change',e=>{
    v.vehicleColor=e.target.value;
    v.vehiclePhoto='';
    save();
    renderVehicleDetail(id);
  });

  document.querySelector('#vehiclePhotoInput')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){alert('Vyber obrázek nebo fotografii.');return;}
    if(file.size>1500000){alert('Fotografie je pro prototyp příliš velká. Vyber obrázek do 1,5 MB.');return;}
    const reader=new FileReader();
    reader.onload=()=>{
      v.vehiclePhoto=String(reader.result||'');
      save();
      renderVehicleDetail(id);
    };
    reader.readAsDataURL(file);
  });

  document.querySelector('#removeVehiclePhoto')?.addEventListener('click',()=>{
    v.vehiclePhoto='';
    save();
    renderVehicleDetail(id);
  });
};

render();
