const map = L.map('map', {scrollWheelZoom:true}).setView([6.8871,116.8529], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker([6.8871,116.8529]).addTo(map);
let lastLat=6.8871,lastLon=116.8529;

const el = id => document.getElementById(id);
function pseudoData(lat,lon){
  // Interface/demo model: deterministic values change with location so the UI is interactive.
  const a=Math.abs(Math.sin(lat*0.41+lon*0.013));
  const b=Math.abs(Math.cos(lat*0.27-lon*0.017));
  return {
    rainfall: Math.round(900 + a*2100),
    water: Math.round(1050 + b*900),
    temp: (21 + a*8.5).toFixed(1),
    wet: Math.round(35 + b*52),
    elev: Math.max(5,Math.round(20 + Math.abs(Math.sin(lon))*260)),
    slope: (0.5 + Math.abs(Math.sin(lat+lon))*7.5).toFixed(1),
    health: Math.round(52 + a*35 - b*5)
  };
}
function updateDashboard(lat,lon,label){
  lastLat=lat;lastLon=lon;
  const d=pseudoData(lat,lon);
  el('placeName').textContent=label;
  el('coords').textContent=`${Math.abs(lat).toFixed(4)}° ${lat>=0?'N':'S'}, ${Math.abs(lon).toFixed(4)}° ${lon>=0?'E':'W'}`;
  el('rainfall').textContent=d.rainfall.toLocaleString()+' mm';
  el('waterUse').textContent=d.water.toLocaleString()+' mm';
  el('temp').textContent=d.temp+'°C';
  el('wetness').textContent=d.wet+'%';
  el('elevation').textContent=d.elev+' m';
  el('slope').textContent=d.slope+'%';
  el('healthScore').textContent=d.health;
  el('healthBar').style.width=d.health+'%';
  const heat = parseFloat(d.temp)>=28;
  const dry = d.rainfall < d.water;
  el('healthText').textContent = heat && dry ? 'Watch heat and water stress.' : dry ? 'Rainfall may not fully cover crop water demand.' : 'Water availability looks comparatively manageable.';
  el('insightTitle').textContent = heat ? (dry ? 'Heat + water stress deserve attention.' : 'Heat exposure deserves attention.') : (dry ? 'Water demand may exceed rainfall.' : 'Water availability looks manageable.');
  el('insightText').textContent = `FieldShift-style indicators for ${label}. Use this as a screening view, then verify local soil, crop, weather and farm conditions.`;
}

map.on('click', async e => {
  marker.setLatLng(e.latlng);
  map.panTo(e.latlng);
  updateDashboard(e.latlng.lat,e.latlng.lng,'Selected location');
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
    const j=await r.json();
    const a=j.address||{};
    const label=[a.city||a.town||a.village||a.county,a.state,a.country].filter(Boolean).join(', ');
    updateDashboard(e.latlng.lat,e.latlng.lng,label||'Selected location');
  }catch(_){}
});

async function searchPlace(){
  const q=el('placeSearch').value.trim();
  if(!q)return;
  el('searchBtn').textContent='...';
  try{
    const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
    const arr=await r.json();
    if(!arr.length){alert('Location not found. Try a city or country name.');return;}
    const p=arr[0],lat=+p.lat,lon=+p.lon;
    marker.setLatLng([lat,lon]);map.setView([lat,lon],8);
    updateDashboard(lat,lon,p.display_name.split(',').slice(0,3).join(','));
  }catch(e){alert('Search is unavailable right now. You can still click the map.');}
  finally{el('searchBtn').textContent='SEARCH';}
}
el('searchBtn').addEventListener('click',searchPlace);
el('placeSearch').addEventListener('keydown',e=>{if(e.key==='Enter')searchPlace()});
el('locateBtn').addEventListener('click',()=>updateDashboard(lastLat,lastLon,'Map center'));

const rain=[310,170,150,120,170,195,210,200,230,275,260,320];
const water=[110,120,145,160,155,135,145,150,135,130,115,105];
const heat=[29,29,30,31,32,31,31,31,31,30,30,29];
const max=340;
el('bars').innerHTML=rain.map((v,i)=>`<div class="barwrap"><div class="bar" style="height:${v/max*100}%"></div><div class="waterline" style="bottom:${water[i]/max*100}%"></div><div class="heatdot" style="bottom:${heat[i]/40*100}%"></div></div>`).join('');
el('months').innerHTML=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m=>`<div>${m}</div>`).join('');
updateDashboard(6.8871,116.8529,'Sabah, Malaysia');
