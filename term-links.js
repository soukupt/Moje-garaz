// Proklik termínů do konkrétní sekce detailu vozidla
function termRow(v,kind,label,date,prefix=''){
  const overdue=daysFromToday(date)<0;
  return `<div class="term term-link" data-id="${v.id}" data-kind="${kind}" role="button" tabindex="0" style="cursor:pointer"><div><strong>${esc(v.name)} · ${label}</strong><div class="meta">${deadlineText(date,prefix)}</div></div><div style="display:flex;align-items:center;gap:8px"><span class="pill premium">${overdue?'PO TERMÍNU':'AKTIVNÍ'}</span><span style="font-size:22px;color:#94a3b8">›</span></div></div>`;
}

renderTerms=function(){
  const rows=[];
  vehicles.forEach(v=>{
    if(v.stkDate) rows.push(termRow(v,'stk','STK',v.stkDate,'Platnost do '));
    if(v.oilDate) rows.push(termRow(v,'oil','Olej',v.oilDate,'Termín '));
    if(v.reminderDate) rows.push(termRow(v,'reminder','Připomínka',v.reminderDate,''));
  });
  main.innerHTML=`<div class="page-card"><h2>Termíny</h2><p class="lead">Klepnutím na termín otevřeš přímo příslušnou část detailu auta.</p></div><div class="page-card">${rows.length?rows.join(''):'<div class="empty">Termíny nastavíš přímo u jednotlivých vozidel v Garáži.</div>'}</div>`;
  const open=e=>{
    const row=e.currentTarget;
    activeView='garage';
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view==='garage'));
    renderVehicleDetail(row.dataset.id);
    setTimeout(()=>focusVehicleTerm(row.dataset.kind),30);
  };
  document.querySelectorAll('.term-link').forEach(row=>{
    row.addEventListener('click',open);
    row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open.call(row,{currentTarget:row})}});
  });
};

const termLinkDetailRender=renderVehicleDetail;
renderVehicleDetail=function(id){
  termLinkDetailRender(id);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  const currentCard=[...main.querySelectorAll('.page-card')].find(card=>card.querySelector('h3')?.textContent.trim()==='Aktuální termíny');
  if(currentCard && ![...currentCard.querySelectorAll('strong')].some(s=>s.textContent.trim()==='Upozornění')){
    const reminder=document.createElement('div');
    reminder.className='term';
    reminder.dataset.detailKind='reminder';
    reminder.innerHTML=`<div><strong>Upozornění</strong><div class="meta">${v.reminderDate?deadlineText(v.reminderDate,''):'Nenastaveno'}</div></div>`;
    currentCard.appendChild(reminder);
  }
  if(currentCard){
    [...currentCard.querySelectorAll('.term')].forEach(row=>{
      const title=row.querySelector('strong')?.textContent.trim();
      if(title==='STK') row.dataset.detailKind='stk';
      if(title==='Výměna oleje') row.dataset.detailKind='oil';
    });
  }
};

function focusVehicleTerm(kind){
  let target=main.querySelector(`[data-detail-kind="${kind}"]`);
  if(!target && kind==='oil') target=document.querySelector('#oilMileageCard');
  if(!target) return;
  target.scrollIntoView({behavior:'smooth',block:'center'});
  const oldTransition=target.style.transition;
  const oldBox=target.style.boxShadow;
  const oldRadius=target.style.borderRadius;
  target.style.transition='box-shadow .25s ease';
  target.style.boxShadow='0 0 0 3px #2563eb';
  target.style.borderRadius=target.style.borderRadius||'12px';
  setTimeout(()=>{target.style.boxShadow=oldBox;target.style.transition=oldTransition;target.style.borderRadius=oldRadius},1800);
}

render();