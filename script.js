const $ = (id) => document.getElementById(id);

const rotationTemplates = {
  rice: [
    {name:"Paddy → Maize", score:88, reason:"Breaks continuous rice production while retaining a cereal-based system.", vals:[88,84,81,73,86]},
    {name:"Paddy → Soybean", score:84, reason:"Adds a legume phase and can reduce repeated water demand.", vals:[82,89,78,77,81]},
    {name:"Paddy → Vegetables", score:79, reason:"Diversifies income and creates a shorter-cycle option.", vals:[76,73,82,69,91]}
  ],
  dry: [
    {name:"Maize → Soybean", score:91, reason:"Strong diversification with a comparatively lower water-demand phase.", vals:[92,88,86,80,90]},
    {name:"Maize → Groundnut", score:86, reason:"A drought-tolerant rotation option with useful soil-cover benefits.", vals:[89,83,84,82,85]},
    {name:"Sorghum → Legume", score:82, reason:"More resilient under heat and variable rainfall conditions.", vals:[94,86,91,84,72]}
  ],
  wet: [
    {name:"Paddy → Soybean", score:90, reason:"Uses the wet-season advantage while adding a non-rice phase.", vals:[87,92,88,76,86]},
    {name:"Paddy → Maize", score:86, reason:"Keeps a familiar cereal sequence with greater crop diversity.", vals:[84,82,86,75,88]},
    {name:"Paddy → Vegetables", score:81, reason:"Adds a shorter-cycle crop and supports income diversification.", vals:[78,76,84,71,93]}
  ]
};

const fields = [
  {name:"Kudat, Sabah", lat:6.8741, lon:116.8996, type:"wet", health:72, rain:"Below baseline", rainVal:"84 mm · 30-day estimate", soil:"Moderate", soilVal:"61% · relative condition", temp:"High", tempVal:"29.4°C · surface estimate", veg:"Declining", vegVal:"0.72 · vegetation index", why:"Rainfall is below the recent baseline, soil moisture is moderate, and surface temperature is elevated.", rotation:"Paddy → Paddy", currentScore:32},
  {name:"Kota Kinabalu, Sabah", lat:5.9804, lon:116.0735, type:"wet", health:78, rain:"Near baseline", rainVal:"102 mm · 30-day estimate", soil:"Good", soilVal:"67% · relative condition", temp:"High", tempVal:"30.1°C · surface estimate", veg:"Stable", vegVal:"0.78 · vegetation index", why:"Moisture is relatively adequate, while heat remains the main condition to monitor.", rotation:"Paddy → Paddy", currentScore:41},
  {name:"Alor Setar, Kedah", lat:6.1184, lon:100.3685, type:"rice", health:74, rain:"Below baseline", rainVal:"76 mm · 30-day estimate", soil:"Moderate", soilVal:"58% · relative condition", temp:"High", tempVal:"31.8°C · surface estimate", veg:"Stable", vegVal:"0.75 · vegetation index", why:"Rainfall is below the recent baseline and heat is elevated, increasing water-stress sensitivity.", rotation:"Paddy → Paddy", currentScore:36},
  {name:"Penang, Malaysia", lat:5.4141, lon:100.3288, type:"wet", health:82, rain:"Near baseline", rainVal:"112 mm · 30-day estimate", soil:"Good", soilVal:"72% · relative condition", temp:"Moderate", tempVal:"29.8°C · surface estimate", veg:"Stable", vegVal:"0.81 · vegetation index", why:"Moisture conditions are favorable and vegetation is stable, with moderate heat risk.", rotation:"Paddy → Paddy", currentScore:49},
  {name:"Kuala Lumpur, Malaysia", lat:3.139, lon:101.6869, type:"wet", health:79, rain:"Above baseline", rainVal:"128 mm · 30-day estimate", soil:"Good", soilVal:"70% · relative condition", temp:"Moderate", tempVal:"29.1°C · surface estimate", veg:"Stable", vegVal:"0.79 · vegetation index", why:"Rainfall and soil moisture are favorable, but heavy-rain variability should be monitored.", rotation:"Paddy → Paddy", currentScore:45},
  {name:"Kuantan, Pahang", lat:3.8077, lon:103.326, type:"wet", health:76, rain:"Above baseline", rainVal:"136 mm · 30-day estimate", soil:"Good", soilVal:"68% · relative condition", temp:"Moderate", tempVal:"28.9°C · surface estimate", veg:"Stable", vegVal:"0.76 · vegetation index", why:"Moisture is favorable, with wetter conditions making drainage and crop timing important.", rotation:"Paddy → Paddy", currentScore:43}
];

let map, marker;
let selectedField = fields[0];

function renderRotations(field){
  const set = rotationTemplates[field.type] || rotationTemplates.wet;
  $("currentRotation").textContent = field.rotation;
  $("currentScore").textContent = field.currentScore;
  $("rotationReason").textContent = `Baseline comparison for ${field.name}. Options are recalculated for the selected location profile.`;
  $("rotationGrid").innerHTML = set.map((r,i)=>`
    <article class="rotation-card ${i===0 ? "best":""}">
      ${i===0 ? '<span class="tag">BEST FIT</span>' : ''}
      <h3>${r.name}</h3>
      <p>${r.reason}</p>
      <div class="scoreline"><span>Location match</span><strong>${r.score}</strong></div>
      <div class="bars">
        <div class="bar"><span>Water saving</span><div class="bar-track"><div class="bar-fill" style="width:${r.vals[0]}%"></div></div><b>${r.vals[0]}</b></div>
        <div class="bar"><span>Soil health</span><div class="bar-track"><div class="bar-fill" style="width:${r.vals[1]}%"></div></div><b>${r.vals[1]}</b></div>
        <div class="bar"><span>Climate resilience</span><div class="bar-track"><div class="bar-fill" style="width:${r.vals[2]}%"></div></div><b>${r.vals[2]}</b></div>
        <div class="bar"><span>Low cost</span><div class="bar-track"><div class="bar-fill" style="width:${r.vals[3]}%"></div></div><b>${r.vals[3]}</b></div>
        <div class="bar"><span>Income & market</span><div class="bar-track"><div class="bar-fill" style="width:${r.vals[4]}%"></div></div><b>${r.vals[4]}</b></div>
      </div>
    </article>
  `).join("");
}

function updateDashboard(field){
  selectedField = field;
  $("locationName").textContent = field.name;
  $("coords").textContent = `${field.lat.toFixed(3)}° N · ${field.lon.toFixed(3)}° E`;
  $("locationNote").textContent = "Prototype location profile · click map to change";
  $("healthScore").textContent = field.health;
  $("ringScore").textContent = field.health;
  $("healthRing").style.background = `conic-gradient(var(--lime) 0deg,var(--lime) ${field.health*3.6}deg,#17303a ${field.health*3.6}deg 360deg)`;
  $("rainfall").textContent = field.rain;
  $("rainfallValue").textContent = field.rainVal;
  $("soil").textContent = field.soil;
  $("soilValue").textContent = field.soilVal;
  $("temp").textContent = field.temp;
  $("tempValue").textContent = field.tempVal;
  $("vegetation").textContent = field.veg;
  $("vegValue").textContent = field.vegVal;
  $("whyText").textContent = field.why;
  renderRotations(field);
}

function nearestField(lat,lng){
  let best = fields[0], bestD = Infinity;
  for(const f of fields){
    const d = Math.pow(lat-f.lat,2)+Math.pow(lng-f.lon,2);
    if(d<bestD){bestD=d;best=f;}
  }
  return best;
}

function initMap(){
  const mapElement = $("map");
  if(!mapElement || typeof L === "undefined") return;

  map = L.map("map").setView([selectedField.lat, selectedField.lon], 7);

  const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19,
    attribution:"© OpenStreetMap contributors"
  });

  const satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom:19,
    attribution:"Tiles © Esri"
  });

  street.addTo(map);

  L.control.layers(
    {"Street map":street,"Satellite":satellite},
    {},
    {position:"topright"}
  ).addTo(map);

  marker = L.marker([selectedField.lat, selectedField.lon])
    .addTo(map)
    .bindPopup(`<b>${selectedField.name}</b><br>Selected farming area`)
    .openPopup();

  map.on("click", e=>{
    const nearest = nearestField(e.latlng.lat,e.latlng.lng);

    const clicked = {
      ...nearest,
      name:`Selected field · ${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}`,
      lat:e.latlng.lat,
      lon:e.latlng.lng
    };

    if(marker) map.removeLayer(marker);

    marker = L.marker([clicked.lat,clicked.lon])
      .addTo(map)
      .bindPopup(`<b>Selected field</b><br>${clicked.lat.toFixed(3)}°, ${clicked.lon.toFixed(3)}°`)
      .openPopup();

    updateDashboard(clicked);
  });

  setTimeout(()=>map.invalidateSize(),300);
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener("click",function(e){
      const target=document.querySelector(this.getAttribute("href"));
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:"smooth",block:"start"});
      }
    });
  });

  $("analyzeBtn").addEventListener("click",()=>{
    $("analyzeBtn").textContent="ANALYSIS UPDATED ✓";
    setTimeout(()=>$("analyzeBtn").textContent="RUN FIELD ANALYSIS ↗",1200);
    renderRotations(selectedField);
  });

  initMap();
  updateDashboard(selectedField);
});
