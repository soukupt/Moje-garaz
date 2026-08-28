// Editace základních údajů vozidla
const renderVehicleDetailBeforeEdit=renderVehicleDetail;
renderVehicleDetail=function(id){
  renderVehicleDetailBeforeEdit(id);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  const firstCard=main.querySelector('.page-card'); if(!firstCard) return;
  const editBtn=document.createElement('button');
  editBtn.type='button'; editBtn.id='editVehicleBtn';
  editBtn.textContent='✏️ Upravit údaje vozidla';
  editBtn.style.cssText='width:100%;margin-top:14px;border:1px solid #dbe2ea;background:white;border-radius:12px;padding:11px;font-weight:700';
  firstCard.appendChild(editBtn);
  editBtn.onclick=()=>{
    const form=document.createElement('form');
    form.style.cssText='display:grid;gap:10px;margin-top:14px';
    form.innerHTML=`<input name="name" required value="${esc(v.name||'')}" placeholder="Název vozidla" style="padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"><input name="plate" required value="${esc(v.plate||'')}" placeholder="SPZ" autocapitalize="characters" style="padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px;text-transform:uppercase"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><input name="year" inputmode="numeric" value="${esc(v.year||'')}" placeholder="Rok" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"><input name="vin" value="${esc(v.vin||'')}" placeholder="VIN" autocapitalize="characters" style="min-width:0;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px;text-transform:uppercase"></div><button class="primary" type="submit">Uložit změny</button>`;
    editBtn.replaceWith(form);
    form.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(form);v.name=String(f.get('name')||'').trim();v.plate=String(f.get('plate')||'').trim().toUpperCase();v.year=String(f.get('year')||'').replace(/\D/g,'');v.vin=String(f.get('vin')||'').trim().toUpperCase();save();renderVehicleDetail(id)});
  };
};
render();