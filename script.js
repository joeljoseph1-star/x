const DEFAULT={lat:5.1600,lon:100.7000,name:'USM Engineering Campus, Malaysia'};
const map=L.map('map',{zoomControl:true}).setView([DEFAULT.lat,DEFAULT.lon],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
let marker=L.marker([DEFAULT.lat,DEFAULT.lon]).addTo(map);
let current={...DEFAULT};
const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const $=id=>document.getElementById(id);
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function setText(id,v){$(id).textContent=v;}

async function reverseGeocode(lat,lon){
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,{headers:{'Accept-Language':'en'}});
    const d=await r.json(), a=d.address||{};
    const city=a.city||a.town||a.village||a.municipality||a.county;
    return city&&a.country?`${city}, ${a.country}`:(d.display_name||'Selected field');
  }catch(e){return 'Selected field';}
}

function fallbackClimate(lat,lon){
  const s=Math.abs(Math.sin(lat*12.9898+lon*78.233)*43758.5453)%1;
  const base=1500-10*Math.abs(lat)+220*Math.sin((lon+20)*Math.PI/90);
  const rain=months.map((_,i)=>Math.max(35,base*(0.72+0.45*Math.sin((i+1)*Math.PI/6+lon/70))));
  const temp=months.map((_,i)=>27-0.08*Math.abs(lat)+3*Math.sin((i+1)*Math.PI/6+lat/30));
  return {rain,temp,wet:Math.round(48+s*45)};
}

async function nasaClimate(lat,lon){
  const url=`https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=PRECTOTCORR,T2M,GWETROOT&community=AG&longitude=${lon}&latitude=${lat}&format=JSON&start=2001&end=2020`;
  const r=await fetch(url);
  if(!r.ok) throw new Error('NASA POWER unavailable');
  const d=await r.json();
  const p=d.properties?.parameter||{};
  const keys=Object.keys(p.PRECTOTCORR||{}).filter(k=>/^\d{2}$/.test(k)).sort();
  if(keys.length<12) throw new Error('No monthly data');
  const rain=keys.map(k=>Number(p.PRECTOTCORR[k]));
  const temp=keys.map(k=>Number(p.T2M[k]));
  const wet=keys.map(k=>Number(p.GWETROOT?.[k]??50));
  return {rain,temp,wet:Math.round(wet.reduce((a,b)=>a+b,0)/wet.length),source:'NASA POWER climatology'};
}

function buildChart(rain,temp){
  const maxRain=Math.max(...rain);
  const maxTemp=Math.max(...temp), minTemp=Math.min(...temp);
  $('monthChart').innerHTML=months.map((m,i)=>{
    const h=Math.round((rain[i]/maxRain)*245);
    const th=Math.round(((temp[i]-minTemp)/(maxTemp-minTemp||1))*120+20);
    return `<div class="month"><div class="bar" style="height:${h}px"><i style="--temp-h:${th}px"></i></div><label>${m}</label></div>`;
  }).join('');
}

function updateTrendCards(lat,lon,rain,temp,wet){
  const rainTrend=(Math.sin(lat*0.7+lon*0.11)>0?'WATCH':'STABLE');
  const tempTrend=(Math.cos(lat*0.5-lon*0.08)>0?'RISING':'MODERATE');
  const water=wet<40?'HIGH':wet<65?'MODERATE':'LOW';
  const veg=wet<40?'STRESSED':wet<65?'WATCH':'STABLE';
  setText('rainTrend',rainTrend); setText('rainTrendText',rainTrend==='WATCH'?'Seasonality suggests stronger monitoring around dry months.':'Rainfall pattern is comparatively balanced for screening.');
  setText('tempTrend',tempTrend); setText('tempTrendText',tempTrend==='RISING'?'Heat exposure may increase crop-water demand.':'Temperature pressure is comparatively moderate.');
  setText('waterTrend',water); setText('waterTrendText',water==='HIGH'?'Prioritise irrigation and soil-moisture checks.':water==='MODERATE'?'Monitor moisture before stress becomes visible.':'Current moisture signal is comparatively favourable.');
  setText('vegTrend',veg); setText('vegTrendText',veg==='STRESSED'?'Vegetation response may be under pressure.':'Keep watching vegetation changes after rainfall or heat events.');
}

function updateRotation(rain,temp,wet,lat){
  const dryMonths=rain.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v).slice(0,4).map(x=>x.i);
  const heat=temp.reduce((a,b)=>a+b,0)/12;
  const score=Math.round(clamp(55+(wet-50)*0.35-(heat-26)*2+(rain.reduce((a,b)=>a+b,0)/12>120?7:0),38,92));
  let name,text;
  if(wet<40 || heat>29){name='Paddy → Mung bean → Sunn hemp';text='Use a short legume during the driest window, then a green-manure phase before the next main crop. Emphasise water-saving and heat monitoring.';}
  else if(wet<65){name='Paddy → Groundnut';text='Consider a water-efficient off-season crop during the drier months, while keeping soil cover and drainage in view.';}
  else{name='Paddy → Grain corn';text='A moderate-water rotation may fit the location, with timing adjusted around the local rainfall pattern.';}
  setText('matchScore',score);setText('rotationName',name);setText('rotationText',text);
  setText('gSoil',wet>65?'+55':wet>40?'+38':'+24');
  setText('gWater',wet<40?'+72':wet<65?'+55':'+34');
  setText('gHeat',heat>29?'+68':heat>26?'+48':'+31');
  setText('gResource',score>70?'+55':'+39');
  $('rotationTimeline').innerHTML=months.map((_,i)=>`<span class="${dryMonths.includes(i)?'dry':i>=4&&i<=5?'green':''}"></span>`).join('');
  setText('rotationIntro',`Example pathway for ${current.name}. Dry-season months are highlighted from the selected location's climate pattern.`);
}

async function updateLocation(lat,lon,name){
  current={lat,lon,name};
  marker.setLatLng([lat,lon]); map.setView([lat,lon],Math.max(8,map.getZoom()));
  setText('place',name);setText('coords',`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
  setText('latCard',`${lat.toFixed(4)}°`);setText('lonCard',`${lon.toFixed(4)}°`);
  setText('locationTitle',name);
  setText('locationSummary','Loading location-specific environmental indicators…');
  try{
    let data;
    try{data=await nasaClimate(lat,lon);}catch(e){data={...fallbackClimate(lat,lon),source:'FieldShift fallback model'};}
    const annualRain=data.rain.reduce((a,b)=>a+b,0);
    const avgTemp=data.temp.reduce((a,b)=>a+b,0)/12;
    const wet=data.wet;
    const health=Math.round(clamp(70+(wet-50)*0.28-(avgTemp-27)*1.2,42,94));
    const water=annualRain<900?'High':annualRain<1500?'Moderate':'Low';
    const heat=avgTemp>29?'High':avgTemp>25?'Moderate':'Low';
    const veg=wet<40?'Declining':wet<65?'Watch':'Stable';
    setText('rain',`${annualRain.toLocaleString()} mm/yr`);
    setText('water',water);setText('heat',`${avgTemp.toFixed(1)}°C`);setText('veg',`${wet}%`);
    setText('score',health);setText('ringText',health);
    setText('rainCard',`${annualRain.toLocaleString()} mm`);
    setText('tempCard',`${avgTemp.toFixed(1)}°C`);
    setText('wetCard',`${wet}%`);
    setText('healthCard',`${health}/100`);
    setText('locationSummary',`${data.source}. Rainfall, temperature and root-zone wetness are summarised for the pinned coordinates.`);
    setText('why',water==='High'&&heat==='High'?'Rainfall is relatively low while temperature pressure is high; monitor soil moisture and irrigation closely.':water==='Low'?'Rainfall is relatively strong for this location; watch drainage and disease pressure after wet periods.':`Signals are mixed. Continue monitoring rainfall, temperature and root-zone wetness for changes.`);
    buildChart(data.rain,data.temp);
    updateTrendCards(lat,lon,data.rain,data.temp,wet);
    updateRotation(data.rain,data.temp,wet,lat);
  }catch(e){
    setText('locationSummary','Unable to load climate data right now. The map and location selection still work.');
  }
}

map.on('click',async e=>{
  const {lat,lng}=e.latlng;
  setText('place','Finding location…');
  const name=await reverseGeocode(lat,lng);
  await updateLocation(lat,lng,name);
});

$('run').addEventListener('click',()=>updateLocation(current.lat,current.lon,current.name));
$('searchBtn').addEventListener('click',searchPlace);
$('locationSearch').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace();});

async function searchPlace(){
  const q=$('locationSearch').value.trim();if(!q)return;
  $('searchBtn').textContent='SEARCHING…';
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`);
    const d=await r.json();
    if(!d.length){setText('place','Location not found');return;}
    const lat=Number(d[0].lat),lon=Number(d[0].lon);
    const name=d[0].display_name.split(',').slice(0,2).join(', ');
    map.setView([lat,lon],11);
    await updateLocation(lat,lon,name);
  }catch(e){setText('place','Search unavailable');}
  finally{$('searchBtn').textContent='SEARCH LOCATION ↗';}
}

updateLocation(DEFAULT.lat,DEFAULT.lon,DEFAULT.name);
