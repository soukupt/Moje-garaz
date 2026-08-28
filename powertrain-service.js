// Pohon/palivo + pravidelná servisní kontrola
vehicles.forEach(v=>{
  if(v.fuelType===undefined) v.fuelType='';
  if(v.regularServiceDate===undefined) v.regularServiceDate='';
  if(v.regularServiceKm===undefined) v.regularServiceKm='';
});
save();

function isElectricVehicle(v){
  return v && v.fuelType==='electric';
}

function fuelLabel(value){
  return ({petrol:'Benzín',diesel:'Diesel',hybrid:'Hybrid',electric:'Elektroauto'})[value]||'Nenastaveno';
}

function regularServiceStatus(v){
  const parts=[];
  let overdue=false;
  if(v.regularServiceDate){
    const d=daysFromToday(v.regularServiceDate);
    if(d<0){parts.push(`PO TERMÍNU ${Math.abs(d)} dní`);overdue=true;}
    else if(d===0){parts.push('TERMÍN DNES');}
    else parts.push(`za ${d} dní`);
  }
  if(v.regularServiceKm){
    const current=Number(v.km||0), target=Number(v.regularServiceKm||0);
    if(current&&target){
      const left=target-current;
      if(left<0){parts.push(`PO LIMITU ${Math.abs(left).toLocaleString('cs-CZ')} km`);overdue=true;}
      else if(left===0){parts.push('LIMIT KM PRÁVĚ DOSAŽEN');}
      else parts.push(`zbývá ${left.toLocaleString('cs-CZ')} km`);
    }else if(target){
      parts.push(`při ${target.toLocaleString('cs-CZ')} km`);
    }
  }
  return {overdue,text:parts.length?parts.join(' · '):'Nenastaveno'};
}

const renderGarageBeforePowertrain=renderGarage;
renderGarage=function(){
  renderGarageBeforePowertrain();
  vehicles.forEach(v=>{
    if(!isElectricVehicle(v)) return;
    const oilBtn=document.querySelector(`.service-btn[data-id="${v.id}"][data-kind="oil"]`);
    if(!oilBtn) return;
    oilBtn.style.border='1px solid #dbe2ea';
    oilBtn.style.background='#f8fafc';
    oilBtn.onclick=e=>{e.preventDefault();e.stopPropagation();};
    const strong=oilBtn.querySelector('strong');
    const span=oilBtn.querySelector('span');
    if(strong) strong.textContent='⚡ Výměna oleje';
    if(span) span.textContent='Elektrika olej nemění 🙂';
  });
};

const renderVehicleDetailBeforePowertrain=renderVehicleDetail;
renderVehicleDetail=function(id){
  renderVehicleDetailBeforePowertrain(id);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  if(v.fuelType===undefined) v.fuelType='';
  if(v.regularServiceDate===undefined) v.regularServiceDate='';
  if(v.regularServiceKm===undefined) v.regularServiceKm='';

  const firstCard=main.querySelector('.page-card');
  if(!firstCard) return;

  const fuelCard=document.createElement('section');
  fuelCard.className='page-card';
  fuelCard.id='powertrainCard';
  fuelCard.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div>
        <div class="meta" style="margin-bottom:2px">Pohon / palivo</div>
        <strong style="font-size:17px">${fuelLabel(v.fuelType)}</strong>
      </div>
      <button id="editFuelBtn" type="button" aria-label="Upravit pohon" title="Upravit pohon" style="width:36px;height:36px;border:1px solid #dbe2ea;background:white;border-radius:10px;font-size:16px;display:grid;place-items:center;padding:0;flex:0 0 auto">✏️</button>
    </div>
    <form id="fuelTypeForm" style="display:none;gap:10px;margin-top:12px">
      <select name="fuelType" style="padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px;background:white">
        <option value="" ${!v.fuelType?'selected':''}>Vyber druh pohonu</option>
        <option value="petrol" ${v.fuelType==='petrol'?'selected':''}>Benzín</option>
        <option value="diesel" ${v.fuelType==='diesel'?'selected':''}>Diesel</option>
        <option value="hybrid" ${v.fuelType==='hybrid'?'selected':''}>Hybrid</option>
        <option value="electric" ${v.fuelType==='electric'?'selected':''}>Elektroauto</option>
      </select>
      <button class="primary" type="submit">Uložit</button>
    </form>`;
  firstCard.insertAdjacentElement('afterend',fuelCard);

  if(isElectricVehicle(v)){
    const oilCard=main.querySelector('#oilMileageCard');
    if(oilCard){
      oilCard.innerHTML=`<h3 style="margin-top:0">Výměna oleje</h3><div style="padding:18px;border-radius:14px;background:#f8fafc;text-align:center"><div style="font-size:34px">⚡🙂</div><strong style="display:block;margin-top:6px">Elektrika olej nemění</strong><div class="meta" style="margin-top:4px">Tady máš o jednu starost míň.</div></div>`;
    }
    [...main.querySelectorAll('.term')].forEach(term=>{
      const strong=term.querySelector('strong');
      if(strong && /výměna oleje|olej/i.test(strong.textContent||'')){
        const meta=term.querySelector('.meta');
        strong.textContent='⚡ Výměna oleje';
        if(meta) meta.textContent='Elektrika olej nemění 🙂';
      }
    });
  }

  const service=regularServiceStatus(v);
  const serviceCard=document.createElement('section');
  serviceCard.className='page-card';
  serviceCard.id='regularServiceCard';
  serviceCard.innerHTML=`
    <h3 style="margin-top:0">Pravidelná servisní kontrola</h3>
    <div class="term" ${service.overdue?'style="border:2px solid #ef4444;background:#fff1f2;border-radius:12px;padding:12px"':''}>
      <div><strong>${service.overdue?'🔴 Servis po termínu':'🔧 Pravidelný servis'}</strong><div class="meta">${service.text}</div></div>
    </div>
    <div class="meta" style="margin:10px 0 12px">Servis je potřeba při první dosažené podmínce — datum nebo stav km.</div>
    <form id="regularServiceForm" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <input name="date" inputmode="numeric" placeholder="Datum 28082027" value="${v.regularServiceDate?compactDate(v.regularServiceDate):''}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
      <input name="km" inputmode="numeric" placeholder="Servis při km" value="${esc(v.regularServiceKm||'')}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
      <button class="primary" type="submit" style="grid-column:1/-1">Uložit pravidelný servis</button>
    </form>`;

  const oilCard=main.querySelector('#oilMileageCard');
  if(oilCard) oilCard.insertAdjacentElement('afterend',serviceCard);
  else fuelCard.insertAdjacentElement('afterend',serviceCard);

  main.querySelector('#editFuelBtn')?.addEventListener('click',()=>{
    const form=main.querySelector('#fuelTypeForm');
    if(!form) return;
    const open=form.style.display!=='none';
    form.style.display=open?'none':'grid';
  });

  main.querySelector('#fuelTypeForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    v.fuelType=String(f.get('fuelType')||'');
    save();
    renderVehicleDetail(id);
  });

  main.querySelector('#regularServiceForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const rawDate=String(f.get('date')||'').trim();
    const date=rawDate?parseCzechDate(rawDate):'';
    if(rawDate && !date){alert('Datum zadej jako 28082027 nebo 28.08.2027.');return;}
    const km=String(f.get('km')||'').replace(/\D/g,'');
    if(!date && !km){alert('Zadej datum nebo počet kilometrů.');return;}
    v.regularServiceDate=date;
    v.regularServiceKm=km;
    save();
    renderVehicleDetail(id);
  });
};

render();