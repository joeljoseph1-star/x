const map=L.map('map').setView([6.8741,116.8996],5);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri, Maxar, Earthstar Geographics'}).addTo(map);
let marker=L.marker([6.8741,116.8996]).addTo(map), selected={lat:6.8741,lon:116.8996};
const $=id=>document.getElementById(id);
function calc(lat,lon){
 const rain=Math.max(5,Math.min(95,Math.round(50+30*Math.sin((lat+lon)*.18))));
 const soil=Math.max(5,Math.min(95,Math.round(50+32*Math.cos((lat-lon)*.13))));
 const heat=Math.max(5,Math.min(95,Math.round(50+35*Math.sin(lat*.31)*Math.cos(lon*.09))));
 const veg=Math.max(5,Math.min(95,Math.round(45+rain*.25+soil*.22-heat*.12)));
 const health=Math.max(0,Math.min(100,Math.round(.32*rain+.28*soil+.2*(100-heat)+.2*veg)));
 return {rain,soil,heat,veg,health};
}
async function placeName(lat,lon){
 try{
  const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`);
  const d=await r.json(),a=d.address||{}, city=a.city||a.town||a.municipality||a.village||a.county||'', country=a.country||'';
  $('place').textContent=[city,country].filter(Boolean).join(', ')||'Selected field';
 }catch(e){$('place').textContent='Selected field'}
}
function update(){
 const a=calc(selected.lat,selected.lon);
 $('score').textContent=a.health;$('ring').textContent=a.health;
 $('ring').style.borderColor=a.health>=70?'#56dce9':a.health>=45?'#f0c75e':'#ef7f7f';
 $('rain').textContent=a.rain<35?'Below baseline':a.rain>68?'Above baseline':'Near baseline';
 $('water').textContent=a.soil<35?'High':a.soil>68?'Low':'Moderate';
 $('heat').textContent=a.heat>68?'High':a.heat<35?'Low':'Moderate';
 $('veg').textContent=a.veg<35?'Declining':a.veg>68?'Healthy':'Watch';
 const why=[]; if(a.rain<45)why.push('rainfall is below baseline');if(a.soil<45)why.push('soil moisture is weakening');if(a.heat>65)why.push('surface temperature is elevated');if(a.veg<45)why.push('vegetation is showing stress');if(!why.length)why.push('the environmental signals are relatively balanced');
 $('why').textContent='The demonstration model flags this field because '+why.join(', ')+'.';
}
async function select(lat,lon){
 selected={lat,lon};marker.setLatLng([lat,lon]);
 $('coords').textContent=`${lat.toFixed(4)}° ${lat>=0?'N':'S'} · ${Math.abs(lon).toFixed(4)}° ${lon>=0?'E':'W'}`;
 $('place').textContent='Loading location…'; await placeName(lat,lon); update();
}
map.on('click',e=>select(e.latlng.lat,e.latlng.lng));$('run').onclick=update;select(selected.lat,selected.lon);