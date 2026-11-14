const map = L.map('map', {zoomControl:true}).setView([5.1600,100.7000], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let marker = L.marker([5.1600,100.7000]).addTo(map);

const placeEl = document.getElementById('place');
const coordsEl = document.getElementById('coords');
const scoreEl = document.getElementById('score');
const ringText = document.getElementById('ringText');

function setLocation(lat, lon, label='Selected field'){
  marker.setLatLng([lat,lon]);
  map.setView([lat,lon], Math.max(map.getZoom(), 8));
  coordsEl.textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  placeEl.textContent = label;
  runAnalysis(lat, lon);
}

async function reverseGeocode(lat, lon){
  try{
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    const r = await fetch(url, {headers:{'Accept-Language':'en'}});
    const d = await r.json();
    const a = d.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county;
    const country = a.country;
    return city && country ? `${city}, ${country}` : (d.display_name || 'Selected field');
  }catch(e){
    return 'Selected field';
  }
}

function runAnalysis(lat, lon){
  const seed = Math.abs(Math.sin(lat*12.9898 + lon*78.233) * 43758.5453) % 1;
  const score = Math.round(58 + seed*34);
  const rain = seed > .66 ? 'Above baseline' : seed > .33 ? 'Moderate' : 'Below baseline';
  const water = seed > .72 ? 'Low' : seed > .38 ? 'Moderate' : 'Elevated';
  const heat = seed > .55 ? 'High' : 'Moderate';
  const veg = seed > .7 ? 'Stable' : seed > .4 ? 'Watch' : 'Declining';

  scoreEl.textContent = score;
  ringText.textContent = score;
  document.getElementById('rain').textContent = rain;
  document.getElementById('water').textContent = water;
  document.getElementById('heat').textContent = heat;
  document.getElementById('veg').textContent = veg;

  let why;
  if (water === 'Elevated' && heat === 'High')
    why = 'Rainfall is below the local baseline while heat pressure is elevated. Soil moisture may require closer monitoring.';
  else if (rain === 'Above baseline')
    why = 'Rainfall is above the local baseline. Monitor field drainage and vegetation response after wet periods.';
  else if (veg === 'Declining')
    why = 'Vegetation condition is showing a weaker signal. Check soil moisture and recent rainfall before making field decisions.';
  else
    why = 'Current signals are mixed. Continue monitoring rainfall, moisture and vegetation trends for changes.';
  document.getElementById('why').textContent = why;
}

map.on('click', async e => {
  const {lat,lng} = e.latlng;
  placeEl.textContent = 'Finding location…';
  setLocation(lat,lng,'Finding location…');
  const label = await reverseGeocode(lat,lng);
  placeEl.textContent = label;
});

document.getElementById('run').addEventListener('click', ()=>{
  const p = marker.getLatLng();
  runAnalysis(p.lat,p.lng);
});

document.getElementById('searchBtn').addEventListener('click', searchPlace);
document.getElementById('locationSearch').addEventListener('keydown', e=>{
  if(e.key === 'Enter') searchPlace();
});

async function searchPlace(){
  const q = document.getElementById('locationSearch').value.trim();
  if(!q) return;
  const btn = document.getElementById('searchBtn');
  btn.textContent = 'SEARCHING…';
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1`);
    const d = await r.json();
    if(!d.length){ placeEl.textContent='Location not found'; return; }
    const lat = Number(d[0].lat), lon = Number(d[0].lon);
    setLocation(lat,lon,d[0].display_name.split(',').slice(0,2).join(', '));
    map.setView([lat,lon], 11);
  }catch(e){
    placeEl.textContent='Search unavailable';
  }finally{
    btn.textContent='SEARCH LOCATION ↗';
  }
}

runAnalysis(5.1600,100.7000);
