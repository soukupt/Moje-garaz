// Kontakt na servis / technika v detailu vozidla
vehicles.forEach(v=>{
  if(v.serviceProviderName===undefined) v.serviceProviderName='';
  if(v.serviceTechnician===undefined) v.serviceTechnician='';
  if(v.servicePhone===undefined) v.servicePhone='';
  if(v.serviceAddress===undefined) v.serviceAddress='';
});
save();

function servicePhoneHref(phone){
  return 'tel:'+String(phone||'').replace(/[^+\d]/g,'');
}
function serviceMapHref(address){
  return 'https://maps.apple.com/?q='+encodeURIComponent(String(address||'').trim());
}

const renderVehicleDetailBeforeServiceContact=renderVehicleDetail;
renderVehicleDetail=function(id){
  renderVehicleDetailBeforeServiceContact(id);
  const v=vehicles.find(x=>x.id===id); if(!v) return;
  const cards=main.querySelectorAll('.page-card'); if(!cards.length) return;

  const card=document.createElement('section');
  card.className='page-card';
  card.id='serviceContactCard';
  const hasData=v.serviceProviderName||v.serviceTechnician||v.servicePhone||v.serviceAddress;
  card.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
      <div><div class="eyebrow">KONTAKT NA SERVIS</div><h3 style="margin:4px 0 0">O tohle auto se mi stará:</h3></div>
      <button id="editServiceContactBtn" type="button" aria-label="Upravit kontakt na servis" style="border:1px solid #dbe2ea;background:white;border-radius:12px;width:42px;height:42px;font-size:18px">✏️</button>
    </div>
    <div id="serviceContactView" style="margin-top:14px">
      ${hasData?`
        ${v.serviceProviderName?`<div class="term"><div><strong>🔧 ${esc(v.serviceProviderName)}</strong><div class="meta">Servis</div></div></div>`:''}
        ${v.serviceTechnician?`<div class="term"><div><strong>👨‍🔧 ${esc(v.serviceTechnician)}</strong><div class="meta">Technik</div></div></div>`:''}
        ${v.servicePhone?`<a href="${servicePhoneHref(v.servicePhone)}" class="term" style="text-decoration:none;color:inherit"><div><strong>📞 ${esc(v.servicePhone)}</strong><div class="meta">Klepnutím zavolat</div></div><span style="font-size:20px">›</span></a>`:''}
        ${v.serviceAddress?`<a href="${serviceMapHref(v.serviceAddress)}" target="_blank" rel="noopener" class="term" style="text-decoration:none;color:inherit"><div><strong>📍 ${esc(v.serviceAddress)}</strong><div class="meta">Klepnutím otevřít navigaci</div></div><span style="font-size:20px">›</span></a>`:''}
      `:'<div class="empty">Zatím není vyplněný servis ani technik.</div>'}
    </div>`;

  // Kontakt dáváme do detailu před servisní historií, pokud ji najdeme, jinak na konec.
  const historyHeading=[...main.querySelectorAll('h3')].find(h=>/historie servisu/i.test(h.textContent||''));
  const historyCard=historyHeading?.closest('.page-card');
  if(historyCard) historyCard.insertAdjacentElement('beforebegin',card);
  else main.appendChild(card);

  document.querySelector('#editServiceContactBtn')?.addEventListener('click',()=>{
    const view=document.querySelector('#serviceContactView'); if(!view) return;
    view.innerHTML=`
      <form id="serviceContactForm" style="display:grid;gap:10px">
        <label>Název servisu<input name="serviceProviderName" value="${esc(v.serviceProviderName||'')}" placeholder="např. Ford Auto Palace" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"></label>
        <label>Technik<input name="serviceTechnician" value="${esc(v.serviceTechnician||'')}" placeholder="Jméno technika" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"></label>
        <label>Telefon<input name="servicePhone" type="tel" value="${esc(v.servicePhone||'')}" placeholder="+420 123 456 789" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"></label>
        <label>Adresa<input name="serviceAddress" value="${esc(v.serviceAddress||'')}" placeholder="Ulice, město" style="width:100%;box-sizing:border-box;padding:12px;border:1px solid #dbe2ea;border-radius:12px;font-size:16px"></label>
        <button class="primary" type="submit">Uložit kontakt</button>
      </form>`;
    document.querySelector('#serviceContactForm')?.addEventListener('submit',e=>{
      e.preventDefault();
      const f=new FormData(e.currentTarget);
      v.serviceProviderName=String(f.get('serviceProviderName')||'').trim();
      v.serviceTechnician=String(f.get('serviceTechnician')||'').trim();
      v.servicePhone=String(f.get('servicePhone')||'').trim();
      v.serviceAddress=String(f.get('serviceAddress')||'').trim();
      save();
      renderVehicleDetail(id);
    });
  });
};

render();