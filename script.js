const members = [
  {name:"Joel Joseph Lester Sellep", role:"TEAM LEADER", photo:"images/joel.jpg"},
  {name:"Rafael Dean Richard", role:"TEAM MEMBER", photo:"images/rafael.jpg"},
  {name:"Lim Wei Jiun", role:"TEAM MEMBER", photo:"images/lim-wei-jiun.jpg"},
  {name:"Rajiv Akhiilendra A/L Supramaniam", role:"TEAM MEMBER", photo:"images/rajiv.jpg"},
  {name:"Ahmad Quisyri Azim Bin Ahmad Zafir", role:"TEAM MEMBER", photo:"images/ahmad-quisyri.jpg"}
];

const modal=document.getElementById("teamModal");
document.querySelectorAll(".member-card").forEach(card=>{
  card.addEventListener("click",()=>{
    const m=members[Number(card.dataset.member)];
    document.getElementById("modalPhoto").src=m.photo;
    document.getElementById("modalPhoto").alt=m.name;
    document.getElementById("modalRole").textContent=m.role;
    document.getElementById("modalName").textContent=m.name;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  });
});
function closeModal(){modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}
document.querySelector(".modal-close").addEventListener("click",closeModal);
document.querySelector(".modal-backdrop").addEventListener("click",closeModal);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

// Demo field data. The UI is designed to be replaced with live NASA API values later.
const fields={
  Sabah:{lat:6.8871,lon:116.8529,rain:2656,water:1649,temp:27.4,wet:83,elev:13,slope:1.8,health:72,veg:"0.72"},
  Seoul:{lat:37.5665,lon:126.9780,rain:1371,water:1160,temp:13.5,wet:61,elev:38,slope:3.1,health:64,veg:"0.58"},
  Penang:{lat:5.4141,lon:100.3288,rain:2400,water:1580,temp:28.0,wet:76,elev:12,slope:2.2,health:70,veg:"0.69"},
  Kedah:{lat:6.118,lon:100.368,rain:2200,water:1550,temp:28.4,wet:67,elev:18,slope:1.9,health:67,veg:"0.63"}
};

const map=L.map("map",{zoomControl:true}).setView([6.8871,116.8529],7);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(map);
let marker=L.marker([6.8871,116.8529]).addTo(map).bindPopup("<b>Sabah, Malaysia</b><br>Selected field").openPopup();

function setField(name,lat,lon,data){
  document.getElementById("locationName").textContent=name;
  document.getElementById("coords").textContent=`${lat.toFixed(4)}° N · ${lon.toFixed(4)}° E`;
  document.getElementById("rain").textContent=data.rain.toLocaleString()+" mm";
  document.getElementById("water").textContent=data.water.toLocaleString()+" mm";
  document.getElementById("temp").textContent=data.temp.toFixed(1)+" °C";
  document.getElementById("wetness").textContent=data.wet+"%";
  document.getElementById("elevation").textContent=data.elev+" m";
  document.getElementById("slope").textContent=data.slope+"%";
  document.getElementById("health").textContent=data.health;
  document.getElementById("healthBar").style.width=data.health+"%";
  document.getElementById("rainSignal").textContent=data.rain.toLocaleString()+" mm";
  document.getElementById("soilSignal").textContent=data.wet+"%";
  document.getElementById("tempSignal").textContent=data.temp.toFixed(1)+"°C";
  document.getElementById("vegSignal").textContent=data.veg;
  const status=data.health>=75?"HEALTHY":data.health>=60?"MODERATELY HEALTHY":"NEEDS ATTENTION";
  document.getElementById("healthStatus").textContent=status;
  document.getElementById("healthText").textContent =
    data.health>=75 ? "Conditions are relatively favorable. Continue monitoring rainfall, heat and soil moisture."
    : data.health>=60 ? "Overall conditions are moderately healthy. Monitor rainfall and soil moisture."
    : "Several environmental signals suggest closer monitoring may be useful.";
  document.getElementById("alertText").textContent =
    data.temp>30 ? "Surface temperature is elevated for this demo location. Combined with soil moisture and rainfall signals, this can indicate increased heat and water stress risk."
    : data.wet<60 ? "Root-zone wetness is relatively low in this demo. Watch rainfall and irrigation needs while checking field conditions locally."
    : "Rainfall, soil moisture and surface temperature are combined to make the field condition easier to understand. These signals suggest a moderate need for monitoring.";
}

async function reverseName(lat,lon){
  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,{headers:{"Accept":"application/json"}});
    if(!res.ok) throw new Error("reverse geocode failed");
    const d=await res.json(), a=d.address||{};
    const place=a.city||a.town||a.municipality||a.village||a.county||a.state||"Selected Field";
    const country=a.country||"";
    return country ? `${place}, ${country}` : place;
  }catch(e){return `Selected field · ${lat.toFixed(3)}°, ${lon.toFixed(3)}°`}
}

map.on("click",async e=>{
  if(marker) map.removeLayer(marker);
  marker=L.marker(e.latlng).addTo(map);
  marker.bindPopup("<b>Selected field</b><br>Loading location…").openPopup();
  const name=await reverseName(e.latlng.lat,e.latlng.lng);
  marker.setPopupContent(`<b>${name}</b><br>${e.latlng.lat.toFixed(4)}°, ${e.latlng.lng.toFixed(4)}°`);
  const base=fields.Sabah;
  const variation=Math.max(-12,Math.min(12,Math.round((e.latlng.lat-6)*1.8)));
  const demo={...base,health:Math.max(48,Math.min(88,base.health+variation)),temp:base.temp+(Math.abs(e.latlng.lat-6.8)*0.35),wet:Math.max(42,Math.min(88,base.wet-variation/2)),veg:(Math.max(.42,Math.min(.82,Number(base.veg)+variation/100))).toFixed(2)};
  setField(name,e.latlng.lat,e.latlng.lng,demo);
});

document.getElementById("runAnalysis").addEventListener("click",()=>{
  const el=document.querySelector(".dashboard-card");
  el.animate([{transform:"scale(.995)",opacity:.7},{transform:"scale(1)",opacity:1}],{duration:450});
});

// Year-at-a-glance demo chart follows the visual pattern in the supplied prototype screenshots.
const rainfall=[320,170,150,120,170,190,205,195,230,285,270,320];
const chart=document.getElementById("yearChart");
rainfall.forEach(v=>{
  const bar=document.createElement("div");
  bar.className="bar";
  bar.style.height=(v/340*100)+"%";
  chart.appendChild(bar);
});
