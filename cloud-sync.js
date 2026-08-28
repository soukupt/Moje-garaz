// Dočasná cloudová synchronizace pro testovací verzi Moje garáž.
// Data se stále ukládají i lokálně, ale hlavní kopie je navíc v Supabase.
const CLOUD_URL='https://uxgppcfxaenbnevwhqzx.supabase.co';
const CLOUD_KEY='sb_publishable_I-pbE6AJMdyjgaZHBDNlgQ_nTSIYQKR';
const CLOUD_GARAGE_ID='tomas-test-garage-v1';
const CLOUD_TABLE='garage_data';

let cloudReady=false;
let cloudSaving=false;
let cloudSaveQueued=false;
let localChangedDuringCloudLoad=false;

const localSaveOnly=save;

function cloudHeaders(extra={}){
  return {
    apikey:CLOUD_KEY,
    Authorization:`Bearer ${CLOUD_KEY}`,
    'Content-Type':'application/json',
    ...extra
  };
}

async function cloudLoad(){
  const url=`${CLOUD_URL}/rest/v1/${CLOUD_TABLE}?garage_id=eq.${encodeURIComponent(CLOUD_GARAGE_ID)}&select=data,updated_at&limit=1`;
  const response=await fetch(url,{headers:cloudHeaders()});
  if(!response.ok)throw new Error(`Cloud load ${response.status}: ${await response.text()}`);
  const rows=await response.json();
  return rows[0]||null;
}

async function cloudWrite(){
  if(!cloudReady)return;
  if(cloudSaving){cloudSaveQueued=true;return}
  cloudSaving=true;
  try{
    const payload={
      garage_id:CLOUD_GARAGE_ID,
      data:{version:1,vehicles},
      updated_at:new Date().toISOString()
    };
    const body=JSON.stringify(payload);
    const response=await fetch(`${CLOUD_URL}/rest/v1/${CLOUD_TABLE}?on_conflict=garage_id`,{
      method:'POST',
      headers:cloudHeaders({Prefer:'resolution=merge-duplicates,return=minimal'}),
      body
    });
    if(!response.ok)throw new Error(`Cloud save ${response.status}: ${await response.text()}`);
  }catch(err){
    console.error('Cloud sync: zápis selhal',err);
  }finally{
    cloudSaving=false;
    if(cloudSaveQueued){cloudSaveQueued=false;cloudWrite()}
  }
}

// Každé potvrzené uložení jde ihned lokálně a bez prodlevy také do cloudu.
save=function(){
  localSaveOnly();
  if(!cloudReady){localChangedDuringCloudLoad=true;return;}
  cloudWrite();
};

function mergeLocalVehicleAppearance(cloudVehicles,localVehicles){
  let changed=false;
  const localById=new Map((localVehicles||[]).map(v=>[v.id,v]));
  const merged=cloudVehicles.map(cloudVehicle=>{
    const localVehicle=localById.get(cloudVehicle.id);
    if(!localVehicle)return cloudVehicle;
    const next={...cloudVehicle};
    if(localVehicle.vehiclePhoto && !cloudVehicle.vehiclePhoto){
      next.vehiclePhoto=localVehicle.vehiclePhoto;
      changed=true;
    }
    if(localVehicle.vehicleIcon && !cloudVehicle.vehicleIcon){
      next.vehicleIcon=localVehicle.vehicleIcon;
      changed=true;
    }
    if(localVehicle.vehicleColor && !cloudVehicle.vehicleColor){
      next.vehicleColor=localVehicle.vehicleColor;
      changed=true;
    }
    return next;
  });
  return {vehicles:merged,changed};
}

async function initCloudSync(){
  const localVehiclesBeforeCloud=vehicles;
  try{
    const row=await cloudLoad();
    // Pokud uživatel během načítání něco změnil, jeho novější lokální změnu nepřepíšeme cloudem.
    if(localChangedDuringCloudLoad){
      cloudReady=true;
      await cloudWrite();
      console.info('Cloud sync: zachována lokální změna provedená během načítání');
      return;
    }
    if(row?.data?.vehicles && Array.isArray(row.data.vehicles)){
      // Fotografie/ikonu/barvu uloženou lokálně nezahodíme jen proto,
      // že ve starší cloudové kopii ještě chybí. Tím se fotka po refreshi neztratí.
      const merged=mergeLocalVehicleAppearance(row.data.vehicles,localVehiclesBeforeCloud);
      vehicles=merged.vehicles;
      vehicles.forEach(v=>{if(!Array.isArray(v.serviceHistory))v.serviceHistory=[]});
      localSaveOnly();
      cloudReady=true;
      render();
      if(merged.changed) await cloudWrite();
      console.info('Cloud sync: data načtena ze Supabase');
    }else{
      cloudReady=true;
      await cloudWrite();
      console.info('Cloud sync: vytvořena první cloudová kopie');
    }
  }catch(err){
    console.error('Cloud sync: načtení selhalo, používám lokální data',err);
    cloudReady=true;
    if(localChangedDuringCloudLoad) cloudWrite();
  }
}

initCloudSync();
