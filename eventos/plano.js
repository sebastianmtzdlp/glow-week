/* Mapa "Plano claro": base vectorial de OpenFreeMap (sin clave) recoloreada con la marca, dentro de Leaflet. */
(function(){
  const TEMAS={
    claro:{tierra:"#FFFFFF",agua:"#DCE4F5",parque:"#EEF3EC",edificio:"#F4F5F9",calle:"#ECEDF4",via:"#E0E2EE",borde:"#E6E8F0",texto:"#8A8EA8",titulo:"#262A4A",halo:"#FFFFFF"},
    papel:{tierra:"#FBF6EE",agua:"#E2E6E6",parque:"#F1EFE2",edificio:"#F5EFE5",calle:"#F0E8DC",via:"#E8DCCB",borde:"#EDE3D5",texto:"#A08C7C",titulo:"#5A3A2A",halo:"#FBF6EE"}};
  function tinta(map,t){
    for(const l of map.getStyle().layers){
      const id=l.id, set=(k,v)=>{try{map.setPaintProperty(id,k,v)}catch(_){}};
      if(/poi|aeroway|rail|transit|housenumber|boundary/.test(id)){map.setLayoutProperty(id,"visibility","none");continue}
      if(l.type==="background") set("background-color",t.tierra);
      else if(l.type==="fill"){
        if(/water/.test(id)) set("fill-color",t.agua);
        else if(/park|wood|grass|landcover|green/.test(id)) set("fill-color",t.parque);
        else if(/building/.test(id)){set("fill-color",t.edificio);set("fill-outline-color",t.edificio)}
        else set("fill-color",t.tierra);
      }
      else if(l.type==="line"){
        if(/water/.test(id)) set("line-color",t.agua);
        else if(/casing/.test(id)) set("line-color",t.borde);
        else if(/motorway|trunk|major|primary/.test(id)) set("line-color",t.via);
        else set("line-color",t.calle);
      }
      else if(l.type==="symbol"){
        set("text-color",/place_(city|town)/.test(id)?t.titulo:t.texto);set("text-halo-color",t.halo);set("text-halo-width",1.4);
        try{map.setLayoutProperty(id,"text-font",["Noto Sans Regular"])}catch(_){}
      }
    }
  }
  window.planoClaro=function(mapa,tema){
    const t=TEMAS[tema]||TEMAS.claro;
    mapa.getContainer().style.background=t.tierra;
    if(!L.maplibreGL){ // si la librería vectorial no carga, queda OpenStreetMap en gris
      return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap",className:"osm-gris"}).addTo(mapa); }
    const capa=L.maplibreGL({style:"https://tiles.openfreemap.org/styles/positron",
      attribution:'<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(mapa);
    const gl=capa.getMaplibreMap(); gl.on("style.load",()=>tinta(gl,t));
    return capa;
  };
})();
