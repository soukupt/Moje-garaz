// Vlastní název upozornění (např. Přezutí) + volitelný čas
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

const setServiceBeforeReminderLabel=setService;
setService=function(id,kind){
  if(kind!=='reminder') return setServiceBeforeReminderLabel(id,kind);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  const label=prompt('Název upozornění – např. Přezutí',v.reminderLabel||'');
  if(label===null) return;
  const cleanLabel=String(label).trim();
  if(!cleanLabel){alert('Napiš, na co tě mám upozornit.');return;}
  const raw=prompt('Datum upozornění – např. 15102026 nebo 15.10.2026',v.reminderDate?compactDate(v.reminderDate):'');
  if(raw===null) return;
  const date=parseCzechDate(raw);
  if(!date){alert('Datum zadej jako 15102026 nebo 15.10.2026.');return;}
  const rawTime=prompt('Čas upozornění – např. 08:30 (volitelné)',v.reminderTime||'');
  if(rawTime===null) return;
  const time=normalizeReminderTime(rawTime);
  if(time===null){alert('Čas zadej jako 08:30 nebo 0830.');return;}
  v.reminderLabel=cleanLabel;
  v.reminderDate=date;
  v.reminderTime=time;
  save();
  render();
};

function reminderName(v){return String(v.reminderLabel||'Upozornění').trim()||'Upozornění';}

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