const map = L.map("map", { zoomControl: true }).setView([6.8833, 116.8333], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const marker = L.marker([6.8833, 116.8333], {draggable:true}).addTo(map);

const el = id => document.getElementById(id);
let current = {lat: 6.8833, lon: 116.8333, place: "Kudat, Malaysia"};

function fmtCoord(v, pos, neg){
  return `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
}

function hashValue(lat, lon, min, max, salt=0){
  const x = Math.sin((lat*12.9898 + lon*78.233 + salt*37.719) * 43758.5453);
  const n = x - Math.floor(x);
  return min + n*(max-min);
}

function estimateField(lat, lon){
  // Prototype estimates: values intentionally vary by location.
  const absLat = Math.abs(lat);
  const tropical = Math.max(0, 1 - absLat/35);
  const rainfall = Math.round(350 + tropical*2600 + hashValue(lat,lon,-220,220,1));
  const temp = Math.max(-8, 31 - absLat*0.38 + hashValue(lat,lon,-3,3,2));
  const waterStress = rainfall < 700 ? "High" : rainfall < 1200 ? "Moderate" : "Low";
  const heatRisk = temp > 29 ? "High" : temp > 23 ? "Moderate" : "Low";
  const vegetation = rainfall > 1500 && temp > 15 ? "Healthy" : rainfall > 800 ? "Watch" : "Stressed";
  let score = 78;
  score += rainfall > 1000 ? 7 : -8;
  score += temp < 30 ? 4 : -6;
  score += vegetation === "Healthy" ? 7 : vegetation === "Stressed" ? -10 : 0;
  score += hashValue(lat,lon,-5,5,3);
  score = Math.max(35, Math.min(96, Math.round(score)));
  return {rainfall, temp, waterStress, heatRisk, vegetation, score};
}

function render(lat, lon, place){
  current = {lat, lon, place};
  const d = estimateField(lat, lon);
  el("placeName").textContent = place || "Selected location";
  el("coords").textContent = `${fmtCoord(lat,"N","S")} · ${fmtCoord(lon,"E","W")}`;
  el("rainfall").textContent = `${d.rainfall.toLocaleString()} mm`;
  el("temperature").textContent = `${d.temp.toFixed(1)}°C`;
  el("waterStress").textContent = d.waterStress;
  el("heatRisk").textContent = d.heatRisk;
  el("vegetation").textContent = d.vegetation;
  el("healthScore").textContent = d.score;
  el("healthRingText").textContent = d.score;
  el("healthRing").style.borderColor = d.score >= 75 ? "#54d4d0" : d.score >= 55 ? "#f5c542" : "#e97a55";
  el("whyText").textContent =
    `${place || "This location"} shows ${d.rainfall.toLocaleString()} mm estimated annual rainfall and an average temperature near ${d.temp.toFixed(1)}°C. The prototype classifies water stress as ${d.waterStress.toLowerCase()}, heat risk as ${d.heatRisk.toLowerCase()}, and vegetation as ${d.vegetation.toLowerCase()}.`;
  el("dataStatus").textContent = "Location-based prototype analysis updated";
}

async function reverseGeocode(lat, lon){
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    const j = await r.json();
    const a = j.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || "Selected location";
    const country = a.country || "";
    return country ? `${city}, ${country}` : city;
  }catch(e){
    return "Selected location";
  }
}

async function selectLocation(lat, lon, zoom=7){
  marker.setLatLng([lat,lon]);
  map.setView([lat,lon], zoom);
  el("dataStatus").textContent = "Finding location…";
  const place = await reverseGeocode(lat,lon);
  render(lat,lon,place);
}

map.on("click", e => selectLocation(e.latlng.lat, e.latlng.lng, Math.max(map.getZoom(), 6)));
marker.on("dragend", e => {
  const p = e.target.getLatLng();
  selectLocation(p.lat,p.lng,Math.max(map.getZoom(),6));
});

el("runAnalysis").addEventListener("click", () => render(current.lat,current.lon,current.place));

el("centerButton").addEventListener("click", () => {
  const c = map.getCenter();
  selectLocation(c.lat,c.lng,Math.max(map.getZoom(),6));
});

async function searchPlace(){
  const q = el("locationSearch").value.trim();
  if(!q) return;
  el("dataStatus").textContent = "Searching…";
  try{
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`);
    const results = await r.json();
    if(!results.length){
      el("dataStatus").textContent = "Location not found";
      return;
    }
    await selectLocation(Number(results[0].lat), Number(results[0].lon), 10);
  }catch(e){
    el("dataStatus").textContent = "Search unavailable — click the map instead";
  }
}
el("searchButton").addEventListener("click", searchPlace);
el("locationSearch").addEventListener("keydown", e => { if(e.key === "Enter") searchPlace(); });

render(current.lat,current.lon,current.place);
