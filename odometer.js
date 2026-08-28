// Rozšíření detailu vozidla: historie tachometru + olej podle km
vehicles.forEach(v=>{
  if(!Array.isArray(v.odometerHistory)) v.odometerHistory=[];
  if(v.oilIntervalKm===undefined) v.oilIntervalKm='15000';
  if(v.lastOilKm===undefined) v.lastOilKm='';
});
save();

function oilMileageState(v){
  const current=Number(v.km||0), last=Number(v.lastOilKm||0), interval=Number(v.oilIntervalKm||0);
  if(!current||!last||!interval) return null;
  const target=last+interval;
  const remaining=target-current;
  return {target,remaining,over:remaining<0};
}
function oilMileageText(v){
  const s=oilMileageState(v);
  if(!s) return 'Nastav poslední výměnu a interval';
  if(s.over) return `PO LIMITU ${Math.abs(s.remaining).toLocaleString('cs-CZ')} km · mělo být při ${s.target.toLocaleString('cs-CZ')} km`;
  return `zbývá ${s.remaining.toLocaleString('cs-CZ')} km · výměna při ${s.target.toLocaleString('cs-CZ')} km`;
}

const originalRenderGarage=renderGarage;
renderGarage=function(){
  originalRenderGarage();
  vehicles.forEach(v=>{
    const state=oilMileageState(v);
    if(!state) return;
    const btn=document.querySelector(`.service-btn[data-id="${v.id}"][data-kind="oil"]`);
    if(!btn) return;
    const span=btn.querySelector('span');
    if(span) span.textContent=oilMileageText(v);
    if(state.over){
      btn.style.border='2px solid #ef4444';
      btn.style.background='#fff1f2';
      const strong=btn.querySelector('strong');
      if(strong) strong.textContent='🔴 Výměna oleje';
    }
  });
};

const originalRenderVehicleDetail=renderVehicleDetail;
renderVehicleDetail=function(id){
  originalRenderVehicleDetail(id);
  const v=vehicles.find(x=>x.id===id);
  if(!v) return;
  if(!Array.isArray(v.odometerHistory)) v.odometerHistory=[];

  const cards=main.querySelectorAll('.page-card');
  if(!cards.length) return;
  const anchor=cards[0];
  const odo=[...v.odometerHistory].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const state=oilMileageState(v);

  const wrap=document.createElement('div');
  wrap.innerHTML=`
    <section class="page-card" id="odometerCard">
      <h3 style="margin-top:0">Stav tachometru</h3>
      <div style="font-size:32px;font-weight:800;margin-bottom:12px">${v.km?Number(v.km).toLocaleString('cs-CZ'):'—'} <span style="font-size:16px;color:#64748b">km</span></div>
      <form id="odometerForm" style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <input name="km" required inputmode="numeric" placeholder="Nový stav km" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <input name="date" required inputmode="numeric" placeholder="Datum 28082026" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <button class="primary" type="submit" style="grid-column:1/-1">Uložit stav tachometru</button>
      </form>
      <div style="margin-top:14px">
        ${odo.length?odo.slice(0,10).map(o=>`<div class="term"><div><strong>${Number(o.km).toLocaleString('cs-CZ')} km</strong><div class="meta">${formatDate(o.date)}</div></div><button class="delete-odo" data-oid="${o.id}" style="border:0;background:transparent;color:#94a3b8;font-size:18px">×</button></div>`).join(''):'<div class="empty">Zatím žádný záznam tachometru.</div>'}
      </div>
    </section>
    <section class="page-card" id="oilMileageCard">
      <h3 style="margin-top:0">Výměna oleje podle km</h3>
      <div class="term" ${state&&state.over?'style="border:2px solid #ef4444;background:#fff1f2;border-radius:12px;padding:12px"':''}>
        <div><strong>${state&&state.over?'🔴 Olej po limitu':'🛢️ Olej'}</strong><div class="meta">${oilMileageText(v)}</div></div>
      </div>
      <form id="oilMileageForm" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <input name="lastOilKm" inputmode="numeric" placeholder="Olej měněn při km" value="${esc(v.lastOilKm||'')}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <input name="interval" inputmode="numeric" placeholder="Interval km" value="${esc(v.oilIntervalKm||'15000')}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <button class="primary" type="submit" style="grid-column:1/-1">Uložit interval oleje</button>
      </form>
      ${v.km?`<button id="oilNowBtn" type="button" style="width:100%;margin-top:9px;border:1px solid #dbe2ea;background:white;border-radius:12px;padding:11px;font-weight:700">Olej právě vyměněn při ${Number(v.km).toLocaleString('cs-CZ')} km</button>`:''}
    </section>`;
  anchor.insertAdjacentElement('afterend',wrap.firstElementChild);
  const firstInserted=anchor.nextElementSibling;
  firstInserted.insertAdjacentElement('afterend',wrap.firstElementChild);

  document.querySelector('#odometerForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const km=Number(String(f.get('km')||'').replace(/\D/g,''));
    const date=parseCzechDate(f.get('date'));
    if(!km){alert('Zadej stav tachometru.');return;}
    if(!date){alert('Datum zadej jako 28082026 nebo 28.08.2026.');return;}
    v.odometerHistory.push({id:crypto.randomUUID(),km:String(km),date});
    const newest=[...v.odometerHistory].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
    if(newest) v.km=String(newest.km);
    save();
    renderVehicleDetail(id);
  });

  document.querySelector('#oilMileageForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    v.lastOilKm=String(f.get('lastOilKm')||'').replace(/\D/g,'');
    v.oilIntervalKm=String(f.get('interval')||'').replace(/\D/g,'')||'15000';
    save();
    renderVehicleDetail(id);
  });

  document.querySelector('#oilNowBtn')?.addEventListener('click',()=>{
    v.lastOilKm=String(v.km||'');
    if(!v.oilIntervalKm) v.oilIntervalKm='15000';
    save();
    renderVehicleDetail(id);
  });

  document.querySelectorAll('.delete-odo').forEach(b=>b.addEventListener('click',()=>{
    if(!confirm('Smazat tento záznam tachometru?')) return;
    v.odometerHistory=v.odometerHistory.filter(o=>o.id!==b.dataset.oid);
    const newest=[...v.odometerHistory].sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
    if(newest) v.km=String(newest.km);
    save();
    renderVehicleDetail(id);
  }));

  const serviceForm=document.querySelector('#serviceHistoryForm');
  serviceForm?.addEventListener('submit',e=>{
    const f=new FormData(e.currentTarget);
    const title=String(f.get('title')||'');
    const km=String(f.get('km')||'').replace(/\D/g,'');
    if(/olej/i.test(title)&&km){
      v.lastOilKm=km;
      if(!v.oilIntervalKm) v.oilIntervalKm='15000';
      save();
    }
  },true);
};

// znovu vykreslit, aby se na hlavní kartě ukázal stav oleje podle km
render();
