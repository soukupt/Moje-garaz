// Dočasná cloudová synchronizace pro testovací verzi Moje garáž.
// Data se stále ukládají i lokálně, ale hlavní kopie je navíc v Supabase.
const CLOUD_URL='https://uxgppcfxaenbnevwhqzx.supabase.co';
const CLOUD_KEY='sb_publishable_I-pbE6AJMdyjgaZHBDNlgQ_nTSIYQKR';
const CLOUD_GARAGE_ID='tomas-test-garage-v1';
const CLOUD_TABLE='garage_data';

let cloudReady=false;
let cloudSaveTimer=null;
let cloudSaving=false;
let cloudSaveQueued=false;

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
  if(cloudSaving){cloudSaveQueued=true;return}
  cloudSaving=true;
  try{
    const payload={
      garage_id:CLOUD_GARAGE_ID,
      data:{version:1,vehicles},
      updated_at:new Date().toISOString()
    };
    const response=await fetch(`${CLOUD_URL}/rest/v1/${CLOUD_TABLE}?on_conflict=garage_id`,{
      method:'POST',
      headers:cloudHeaders({Prefer:'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(payload)
    });
    if(!response.ok)throw new Error(`Cloud save ${response.status}: ${await response.text()}`);
  }catch(err){
    console.error('Cloud sync: zápis selhal',err);
  }finally{
    cloudSaving=false;
    if(cloudSaveQueued){cloudSaveQueued=false;cloudWrite()}
  }
}

function scheduleCloudSave(){
  if(!cloudReady)return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(cloudWrite,350);
}

// Zachová okamžité lokální ukládání a přidá cloud na pozadí.
save=function(){
  localSaveOnly();
  scheduleCloudSave();
};

async function initCloudSync(){
  try{
    const row=await cloudLoad();
    if(row?.data?.vehicles && Array.isArray(row.data.vehicles)){
      vehicles=row.data.vehicles;
      vehicles.forEach(v=>{if(!Array.isArray(v.serviceHistory))v.serviceHistory=[]});
      localSaveOnly();
      cloudReady=true;
      render();
      console.info('Cloud sync: data načtena ze Supabase');
    }else{
      cloudReady=true;
      await cloudWrite();
      console.info('Cloud sync: vytvořena první cloudová kopie');
    }
  }catch(err){
    // Aplikace zůstane plně funkční s lokálními daty i při výpadku internetu.
    console.error('Cloud sync: načtení selhalo, používám lokální data',err);
    cloudReady=true;
  }
}

initCloudSync();
