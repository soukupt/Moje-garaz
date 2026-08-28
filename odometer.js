// Rozšíření detailu vozidla: historie tachometru + olej přímo navázaný na km
vehicles.forEach(v=>{
  if(!Array.isArray(v.odometerHistory)) v.odometerHistory=[];
  if(v.oilIntervalKm===undefined) v.oilIntervalKm='15000';
  if(v.lastOilKm===undefined) v.lastOilKm='';
});
save();

function todayIso(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function oilMileageState(v){
  const current=Number(v.km||0), last=Number(v.lastOilKm||0), interval=Number(v.oilIntervalKm||0);
  if(!current||!last||!interval) return null;
  const target=last+interval;
  const remaining=target-current;
  return {current,last,interval,target,remaining,over:remaining<0};
}
function oilMileageText(v){
  const s=oilMileageState(v);
  if(!s) return 'Nastav stav tachometru, poslední výměnu oleje a interval';
  if(s.over) return `PO LIMITU ${Math.abs(s.remaining).toLocaleString('cs-CZ')} km · aktuálně ${s.current.toLocaleString('cs-CZ')} km · limit ${s.target.toLocaleString('cs-CZ')} km`;
  return `zbývá ${s.remaining.toLocaleString('cs-CZ')} km · aktuálně ${s.current.toLocaleString('cs-CZ')} km · další výměna při ${s.target.toLocaleString('cs-CZ')} km`;
}
function oilDetailText(v){
  const parts=[];
  if(v.oilDate) parts.push(`naposledy ${formatDate(v.oilDate)}`);
  if(v.lastOilKm) parts.push(`při ${Number(v.lastOilKm).toLocaleString('cs-CZ')} km`);
  const state=oilMileageState(v);
  if(state) parts.push(state.over?`PO LIMITU ${Math.abs(state.remaining).toLocaleString('cs-CZ')} km`:`zbývá ${state.remaining.toLocaleString('cs-CZ')} km`);
  return parts.length?parts.join(' · '):'Nenastaveno';
}
function recordOilChange(v,km,date){
  const cleanKm=String(km||'').replace(/\D/g,'');
  if(!cleanKm) return;
  v.lastOilKm=cleanKm;
  v.oilDate=date||todayIso();
  if(!v.oilIntervalKm) v.oilIntervalKm='15000';
  v.serviceHistory=v.serviceHistory||[];
  const duplicate=v.serviceHistory.some(h=>/olej/i.test(h.title||'')&&String(h.km||'')===cleanKm&&h.date===v.oilDate);
  if(!duplicate){
    v.serviceHistory.push({id:crypto.randomUUID(),title:'Výměna oleje',date:v.oilDate,km:cleanKm,price:'',note:'',fileName:''});
  }
}

const originalRenderGarage=renderGarage;
renderGarage=function(){
  originalRenderGarage();
  vehicles.forEach(v=>{
    const state=oilMileageState(v);
    const btn=document.querySelector(`.service-btn[data-id="${v.id}"][data-kind="oil"]`);
    if(!btn) return;
    const span=btn.querySelector('span');
    if(state&&span) span.textContent=oilMileageText(v);
    if(state&&state.over){
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
  const termCard=cards[1];
  const odo=[...v.odometerHistory].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const state=oilMileageState(v);

  // Původní řádek „Výměna oleje“ v Aktuálních termínech nyní ukazuje i návaznost na tachometr.
  if(termCard){
    const terms=termCard.querySelectorAll('.term');
    const oilMeta=terms[1]?.querySelector('.meta');
    if(oilMeta) oilMeta.textContent=oilDetailText(v);
  }

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
      <h3 style="margin-top:0">Výměna oleje</h3>
      <div class="term" ${state&&state.over?'style="border:2px solid #ef4444;background:#fff1f2;border-radius:12px;padding:12px"':''}>
        <div><strong>${state&&state.over?'🔴 Olej po limitu':'🛢️ Olej'}</strong><div class="meta">${oilMileageText(v)}</div></div>
      </div>
      <div class="meta" style="margin-top:10px">Poslední výměna: ${v.lastOilKm?Number(v.lastOilKm).toLocaleString('cs-CZ')+' km':'nenastavena'}${v.oilDate?' · '+formatDate(v.oilDate):''}</div>
      <form id="oilMileageForm" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">
        <input name="lastOilKm" inputmode="numeric" placeholder="Poslední výměna při km" value="${esc(v.lastOilKm||'')}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <input name="interval" inputmode="numeric" placeholder="Interval km" value="${esc(v.oilIntervalKm||'15000')}" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px">
        <button class="primary" type="submit" style="grid-column:1/-1">Uložit nastavení oleje</button>
      </form>
      ${v.km?`<button id="oilNowBtn" type="button" style="width:100%;margin-top:9px;border:1px solid #dbe2ea;background:white;border-radius:12px;padding:11px;font-weight:700">✓ Olej právě vyměněn při ${Number(v.km).toLocaleString('cs-CZ')} km</button>`:''}
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
    const lastOilKm=String(f.get('lastOilKm')||'').replace(/\D/g,'');
    const interval=String(f.get('interval')||'').replace(/\D/g,'')||'15000';
    if(lastOilKm&&v.km&&Number(lastOilKm)>Number(v.km)){
      alert('Stav km při poslední výměně oleje nemůže být vyšší než aktuální stav tachometru.');
      return;
    }
    v.lastOilKm=lastOilKm;
    v.oilIntervalKm=interval;
    save();
    renderVehicleDetail(id);
  });

  document.querySelector('#oilNowBtn')?.addEventListener('click',()=>{
    if(!v.km) return;
    recordOilChange(v,v.km,todayIso());
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
    const enteredKm=String(f.get('km')||'').replace(/\D/g,'');
    const date=parseCzechDate(f.get('date'));
    if(/olej/i.test(title)){
      const oilKm=enteredKm||String(v.km||'');
      if(oilKm){
        v.lastOilKm=oilKm;
        if(date) v.oilDate=date;
        if(!v.oilIntervalKm) v.oilIntervalKm='15000';
        save();
      }
    }
  },true);
};

// znovu vykreslit, aby se na hlavní kartě ukázal stav oleje podle km
render();