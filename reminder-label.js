// Vlastní upozornění v jednom okně: název + datum + čas + smazání
vehicles.forEach(v=>{
  if(v.reminderLabel===undefined)v.reminderLabel='';
  if(v.reminderTime===undefined)v.reminderTime='';
});
save();

function normalizeReminderTime(value){
  const s=String(value||'').trim();
  if(!s) return '';
  const m=s.match(/^(\d{1,2})(?::|\.)?(\d{2})$/);
  if(!m) return null;
  const h=Number(m[1]), min=Number(m[2]);
  if(h<0||h>23||min<0||min>59) return null;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function reminderTimeText(v){return v.reminderTime?` · ${esc(v.reminderTime)}`:'';}
function reminderName(v){return String(v.reminderLabel||'Upozornění').trim()||'Upozornění';}

function openReminderDialog(v){
  document.querySelector('#reminderDialog')?.remove();
  const dialog=document.createElement('dialog');
  dialog.id='reminderDialog';
  dialog.className='modal';
  const hasReminder=Boolean(v.reminderDate||v.reminderLabel||v.reminderTime);
  dialog.innerHTML=`
    <form id="reminderForm" class="modal-card">
      <div class="modal-head">
        <div><div class="eyebrow">UPOZORNĚNÍ</div><h2 style="margin-bottom:4px">Nastavit upozornění</h2><div class="meta">${esc(v.name)}</div></div>
        <button type="button" class="close-btn" id="closeReminderDialog">✕</button>
      </div>
      <label>Název upozornění<input name="label" required value="${esc(v.reminderLabel||'')}" placeholder="např. Přezutí"></label>
      <div class="grid2" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);width:100%">
        <label style="min-width:0">Datum<input name="date" required inputmode="numeric" value="${v.reminderDate?compactDate(v.reminderDate):''}" placeholder="15.10.2026" style="width:100%;min-width:0;max-width:100%;box-sizing:border-box"></label>
        <label style="min-width:0">Čas<input name="time" type="text" inputmode="numeric" value="${esc(v.reminderTime||'')}" placeholder="08:30" style="width:100%;min-width:0;max-width:100%;box-sizing:border-box"></label>
      </div>
      <div class="meta" style="margin-top:-4px">Čas je volitelný. Do kalendáře se zatím nic neposílá.</div>
      <button class="primary wide" type="submit">Uložit upozornění</button>
      ${hasReminder?'<button type="button" id="deleteReminderBtn" style="width:100%;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;border-radius:12px;padding:12px;font-weight:800">🗑️ Smazat upozornění</button>':''}
    </form>`;
  document.body.appendChild(dialog);
  dialog.showModal();
  dialog.querySelector('#closeReminderDialog')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>dialog.remove());
  dialog.querySelector('#deleteReminderBtn')?.addEventListener('click',()=>{
    if(!confirm(`Smazat upozornění „${reminderName(v)}“?`)) return;
    v.reminderLabel='';
    v.reminderDate='';
    v.reminderTime='';
    save();
    dialog.close();
    render();
  });
  dialog.querySelector('#reminderForm')?.addEventListener('submit',e=>{
    e.preventDefault();
    const f=new FormData(e.currentTarget);
    const label=String(f.get('label')||'').trim();
    const rawDate=String(f.get('date')||'').trim();
    const date=parseCzechDate(rawDate);
    const time=normalizeReminderTime(f.get('time'));
    if(!label){alert('Napiš, na co tě mám upozornit.');return;}
    if(!date){alert('Datum zadej jako 15102026 nebo 15.10.2026.');return;}
    if(time===null){alert('Čas zadej jako 08:30 nebo 0830.');return;}
    v.reminderLabel=label;
    v.reminderDate=date;
    v.reminderTime=time;
    save();
    dialog.close();
    render();
  });
}

const setServiceBeforeReminderLabel=setService;
setService=function(id,kind){
  if(kind!=='reminder') return setServiceBeforeReminderLabel(id,kind);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  openReminderDialog(v);
};

const renderGarageBeforeReminderLabel=renderGarage;
renderGarage=function(){
  renderGarageBeforeReminderLabel();
  vehicles.forEach(v=>{
    const btn=document.querySelector(`.service-btn[data-id="${v.id}"][data-kind="reminder"]`);
    if(!btn) return;
    const strong=btn.querySelector('strong');
    const span=btn.querySelector('span');
    if(strong) strong.textContent=`${v.reminderDate&&daysFromToday(v.reminderDate)<0?'🔴':'🔔'} ${reminderName(v)}`;
    if(span&&v.reminderDate) span.textContent=`${deadlineText(v.reminderDate,'na ')}${reminderTimeText(v)}`;
  });
};

const renderTermsBeforeReminderLabel=renderTerms;
renderTerms=function(){
  renderTermsBeforeReminderLabel();
  vehicles.forEach(v=>{
    if(!v.reminderDate) return;
    [...main.querySelectorAll('.term')].forEach(term=>{
      const strong=term.querySelector('strong');
      const meta=term.querySelector('.meta');
      const text=strong?.textContent||'';
      if(text.includes(v.name) && /Připomínka|Upozornění/.test(text)){
        strong.textContent=`${v.name} · ${reminderName(v)}`;
        if(meta) meta.textContent=`${deadlineText(v.reminderDate,'')}${reminderTimeText(v)}`;
      }
    });
  });
};

const renderVehicleDetailBeforeReminderLabel=renderVehicleDetail;
renderVehicleDetail=function(id){
  renderVehicleDetailBeforeReminderLabel(id);
  const v=vehicles.find(x=>x.id===id); if(!v||!v.reminderDate) return;
  const termCard=[...main.querySelectorAll('.page-card')].find(c=>c.querySelector('h3')?.textContent?.includes('Aktuální termíny'));
  if(!termCard) return;
  let existing=[...termCard.querySelectorAll('.term')].find(t=>/upozornění|připomínka/i.test(t.textContent||''));
  if(!existing){
    existing=document.createElement('div');
    existing.className='term';
    termCard.appendChild(existing);
  }
  existing.innerHTML=`<div><strong>🔔 ${esc(reminderName(v))}</strong><div class="meta">${deadlineText(v.reminderDate,'')}${reminderTimeText(v)}</div></div>`;
};

render();