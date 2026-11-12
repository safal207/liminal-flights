/**
 * Flight route map: honest synthetic preview first, real tiles on explicit user
 * action only. Never animate/label a guessed aircraft as a live position.
 */
import {planBounds} from './flight-map.mjs';
import {selectedJourney,legSelection} from './journey-view.mjs';

const copy={
  ru:{
    open:'На карте ↗',title:'Маршрут на карте',sub:'Наглядная схема выбранного варианта',
    mock:'Примерный маршрут · ДЕМО',notLive:'Не в реальном времени',
    warning:'Это географическая иллюстрация, а не опубликованный план полёта. Реальный маршрут может отличаться.',
    separate:'Самостоятельная пересадка: отдельные билеты. Защита пересадки не подтверждена.',
    connection:'Примерная пересадка (демоданные)',distance:'По дуге большого круга ≈ ',
    kilometers:' км',status:'Статус и задержки',statusNone:'Нет данных о реальном рейсе',
    location:'Где самолёт сейчас?',locationNone:'GPS-положение не подключено',
    source:'Источник: демонстрационный маршрут; данных авиакомпании нет',
    plane:'Значок самолёта показывает схему, а не положение в небе.',
    close:'Закрыть карту',mapIssue:'Сообщить об ошибке карты',
    tiles:'Базовая карта загрузится при доступности интернет-соединения.',
    airport:'Аэропорт',from:'Откуда',to:'Куда',via:'Через',
    fallback:'Схема маршрута (без онлайн-карты)',
    chosen:'Ваш выбранный вариант',searchDate:'Дата поиска · демо',passengers:'Пассажиров',
    legs:'Участки маршрута',allLegs:'Весь маршрут',legHelp:'Выберите участок, чтобы рассмотреть его на карте.',
    trackingTitle:'Что известно о рейсе',unverified:'Данные о рейсе не поступали',
    lastUpdate:'Последнее обновление',noUpdate:'Нет данных',delay:'Задержка',delayUnknown:'Неизвестна',
    statusNote:'Ни статус рейса, ни его положение не проверялись: источник ещё не подключён.',
    chosenLeg:'Выбранный участок'
  },
  en:{
    open:'View map ↗',title:'Route on the map',sub:'A visual preview of this flight option',
    mock:'Approximate route · DEMO',notLive:'Not live tracking',
    warning:'A geographic illustration, not an airline flight plan. The actual flight path may differ.',
    separate:'Self-transfer: separate tickets. Connection protection is not confirmed.',
    connection:'Illustrative connection (mock data)',distance:'Great-circle distance ≈ ',
    kilometers:' km',status:'Status and delays',statusNone:'No real flight status available',
    location:'Where is the aircraft now?',locationNone:'Live GPS position not connected',
    source:'Source: synthetic itinerary; no airline feed',
    plane:'The plane icon is illustrative, not a live aircraft position.',
    close:'Close map',mapIssue:'Report a map problem',
    tiles:'Online basemap appears when an internet connection is available.',
    airport:'Airport',from:'From',to:'To',via:'Via',
    fallback:'Route sketch (offline mode)',
    chosen:'Your selected journey',searchDate:'Search date · demo',passengers:'Travellers',
    legs:'Journey segments',allLegs:'Entire route',legHelp:'Select a segment to focus the map on it.',
    trackingTitle:'What we know about this flight',unverified:'No flight data received',
    lastUpdate:'Last updated',noUpdate:'No data',delay:'Delay',delayUnknown:'Unknown',
    statusNote:'Neither flight status nor aircraft location has been checked: no provider is connected.',
    chosenLeg:'Selected segment'
  },
  tr:{
    open:'Haritada gör ↗',title:'Uçuş rotası haritası',sub:'Seçtiğiniz uçuşun görsel önizlemesi',
    mock:'Yaklaşık rota · DEMO',notLive:'Canlı takip değil',
    warning:'Bu, havayolunun resmi uçuş planı değil; coğrafi bir gösterimdir. Gerçek rota değişebilir.',
    separate:'Kendiniz aktarma yapacaksınız: ayrı biletler. Bağlantı koruması doğrulanmadı.',
    connection:'Örnek aktarma (demo verisi)',distance:'Büyük daire mesafesi ≈ ',
    kilometers:' km',status:'Durum ve gecikmeler',statusNone:'Gerçek uçuş durumu verisi yok',
    location:'Uçak şu anda nerede?',locationNone:'Canlı GPS konumu bağlı değil',
    source:'Kaynak: kurgusal rota; havayolu verisi yok',
    plane:'Uçak simgesi yalnızca gösterimdir; canlı konum değildir.',
    close:'Haritayı kapat',mapIssue:'Harita hatası bildir',
    tiles:'İnternet bağlantısı varsa harita altlığı yüklenir.',
    airport:'Havalimanı',from:'Nereden',to:'Nereye',via:'Aktarma',
    fallback:'Rota çizimi (çevrimdışı)',
    chosen:'Seçtiğiniz yolculuk',searchDate:'Arama tarihi · demo',passengers:'Yolcu sayısı',
    legs:'Yolculuk etapları',allLegs:'Tüm rota',legHelp:'Haritada odaklanmak için bir etap seçin.',
    trackingTitle:'Bu uçuş hakkında bildiklerimiz',unverified:'Uçuş verisi alınmadı',
    lastUpdate:'Son güncelleme',noUpdate:'Veri yok',delay:'Gecikme',delayUnknown:'Bilinmiyor',
    statusNote:'Veri kaynağı bağlı değil; uçuş durumu ve uçak konumu doğrulanmadı.',
    chosenLeg:'Seçili etap'
  }
};
export const mapText=(language,key)=>(copy[language]||copy.ru)[key]||key;

function svgFallback(plan,lang,focus=-1){
  const bounds=planBounds(plan),low=bounds[0],high=bounds[1];
  const pad=46,width=760,height=365;
  const lonScale=Math.max(1,high[1]-low[1]),latScale=Math.max(1,high[0]-low[0]);
  const x=lon=>pad+(lon-low[1])/lonScale*(width-pad*2);
  const y=lat=>height-pad-(lat-low[0])/latScale*(height-pad*2);
  const path=leg=>leg.map((p,i)=>(i?'L':'M')+x(p[1]).toFixed(1)+','+y(p[0]).toFixed(1)).join(' ');
  const grid=Array.from({length:6},(_,i)=>{
    const yy=pad+i*(height-pad*2)/5,xx=pad+i*(width-pad*2)/5;
    return '<path d="M'+xx.toFixed(1)+' '+pad+'V'+(height-pad)+' M'+pad+' '+yy.toFixed(1)+'H'+(width-pad)+'" stroke="#ffffff" stroke-opacity=".48"/>';
  }).join('');
  const legs=plan.legs.map((leg,i)=>'<path d="'+path(leg)+'" stroke="'+(focus>=0&&focus!==i?'#96b6ad':'#2f6b65')+'" stroke-width="'+(focus===i?'6':'4')+'" stroke-dasharray="8 7" fill="none" stroke-linecap="round" opacity="'+(focus>=0&&focus!==i?'.35':'1')+'"/>').join('');
  const pins=plan.airports.map((point,i)=>{
    const px=x(point.lon).toFixed(1),py=y(point.lat).toFixed(1);
    const dy=i===0?23:-17;
    return '<circle cx="'+px+'" cy="'+py+'" r="9" fill="#fffdf7" stroke="#20554e" stroke-width="4"/>'+
      '<text x="'+px+'" y="'+(Number(py)+dy)+'" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="800" fill="#204b47">'+point.code+'</text>';
  }).join('');
  return '<svg class="route-map-svg" viewBox="0 0 760 365" role="img" aria-label="'+mapText(lang,'fallback')+'">'+
    '<defs><linearGradient id="routeSea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9e9e2"/><stop offset="1" stop-color="#f7ecd7"/></linearGradient></defs>'+
    '<rect width="760" height="365" rx="18" fill="url(#routeSea)"/>'+grid+legs+pins+
    '<text x="22" y="345" font-family="system-ui,sans-serif" font-size="12" fill="#486c65">'+mapText(lang,'fallback')+'</text></svg>';
}

let leafletPromise;
function loadLeaflet(){
  if(window.L?.map)return Promise.resolve(window.L);
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    if(!document.querySelector('link[data-leaflet]')){
      const css=document.createElement('link');
      css.rel='stylesheet';css.dataset.leaflet='';
      css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      css.crossOrigin='anonymous';
      document.head.append(css);
    }
    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin='anonymous';
    script.onload=()=>window.L?.map?resolve(window.L):reject(Error('Missing map library'));
    script.onerror=()=>reject(Error('Map library unavailable'));
    document.head.append(script);
  }).catch(error=>{leafletPromise=null;throw error;});
  return leafletPromise;
}
let dialog=null,activeMap=null,activeId=null,requestId=0,lastFocus=null;
let activePlan=null,activeLang='ru',activeLeg=-1,activeLines=[];
function clearMap(){
  requestId++;
  if(activeMap){activeMap.remove();activeMap=null;}
  activeId=null;activeLines=[];activePlan=null;activeLeg=-1;
}
function buildDialog(){
  if(dialog)return dialog;
  dialog=document.createElement('dialog');
  dialog.id='route-map-dialog';
  dialog.className='route-map-dialog';
  dialog.setAttribute('aria-labelledby','route-map-title');
  document.body.append(dialog);
  dialog.addEventListener('close',()=>{clearMap();if(lastFocus?.isConnected)lastFocus.focus();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  return dialog;
}
function renderDialog(journey,lang){
  const {plan}=journey,d=buildDialog();
  const t=key=>mapText(lang,key);
  const route=plan.airports.map(point=>point.code).join(' · ');
  const stops=plan.airports.map((p,i)=>
    '<span class="route-map-stop"><strong>'+p.code+'</strong><small>'+
    (i===0?t('from'):i===plan.airports.length-1?t('to'):t('via'))+
    '</small></span>').join('<span aria-hidden="true" class="route-stop-arrow">→</span>');
  const tripMeta=(journey.searchDate?
    '<span><small>'+t('searchDate')+'</small><strong>'+journey.searchDate+'</strong></span>':'')+
    (journey.passengers!==null?
    '<span><small>'+t('passengers')+'</small><strong>'+journey.passengers+'</strong></span>':'');
  const buttons=[
    '<button type="button" class="route-leg-button is-active" data-route-leg="-1" aria-pressed="true">'+t('allLegs')+'</button>',
    ...plan.legs.map((leg,i)=>'<button type="button" class="route-leg-button" data-route-leg="'+i+
      '" aria-pressed="false">'+plan.airports[i].code+' → '+plan.airports[i+1].code+'</button>')
  ].join('');
  d.innerHTML='<div class="route-map-shell">'+
    '<div class="route-map-header"><div><p class="route-map-eyebrow">'+t('mock')+'</p>'+
    '<h2 id="route-map-title">'+t('chosen')+'</h2><p class="route-map-sub">'+t('sub')+'</p></div>'+
    '<button class="route-map-close" type="button" data-close-map aria-label="'+t('close')+'">×</button></div>'+
    '<div class="route-map-chips"><span class="route-chip">✈ '+route+'</span><span class="route-chip muted">'+t('notLive')+'</span></div>'+
    (tripMeta?'<div class="journey-context">'+tripMeta+'</div>':'')+
    '<div class="route-map-stage"><div class="route-map-fallback">'+svgFallback(plan,lang)+'</div>'+
    '<div id="leaflet-flight-map" class="route-map-leaflet"></div></div>'+
    '<div class="route-map-leg-control"><div class="route-map-leg-header"><strong>'+t('legs')+'</strong>'+
    '<span>'+t('legHelp')+'</span></div>'+
    '<div class="route-map-leg-buttons" role="group" aria-label="'+t('legs')+'">'+buttons+'</div></div>'+
    '<div class="route-map-stops">'+stops+'</div>'+
    '<p class="route-map-clarification">'+t('warning')+' '+t('plane')+'</p>'+
    (plan.independentTickets?'<p class="route-map-risk">'+t('separate')+'</p>':'')+
    '<section class="journey-evidence" aria-labelledby="journey-evidence-title">'+
    '<div class="journey-evidence-heading"><div><h3 id="journey-evidence-title">'+t('trackingTitle')+'</h3>'+
    '<p>'+t('statusNote')+'</p></div><span class="journey-evidence-chip">'+t('unverified')+'</span></div>'+
    '<div class="route-map-detail-grid"><div><small>'+t('distance')+'</small>'+
    '<strong id="route-map-distance">'+journey.approximateDistanceKm+t('kilometers')+'</strong></div>'+
    '<div><small>'+t('status')+'</small><strong>'+t('statusNone')+'</strong></div>'+
    '<div><small>'+t('delay')+'</small><strong>'+t('delayUnknown')+'</strong></div>'+
    '<div><small>'+t('location')+'</small><strong>'+t('locationNone')+'</strong></div>'+
    '<div><small>'+t('lastUpdate')+'</small><strong>'+t('noUpdate')+'</strong></div></div></section>'+
    '<div class="route-map-footer"><span>'+t('source')+'</span>'+
    '<a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">'+t('mapIssue')+'</a></div>'+
    '</div>';
  d.querySelector('[data-close-map]').addEventListener('click',()=>d.close());
  for(const button of d.querySelectorAll('[data-route-leg]')){
    button.addEventListener('click',()=>focusLeg(Number(button.dataset.routeLeg)));
  }
}

function focusLeg(index){
  if(!activePlan||!dialog?.open)return;
  const selection=legSelection(activePlan,index);
  activeLeg=index;
  const sketch=dialog.querySelector('.route-map-fallback');
  if(sketch)sketch.innerHTML=svgFallback(activePlan,activeLang,index);
  const distance=dialog.querySelector('#route-map-distance');
  if(distance)distance.textContent=selection.distanceKm+mapText(activeLang,'kilometers');
  for(const btn of dialog.querySelectorAll('[data-route-leg]')){
    const selected=Number(btn.dataset.routeLeg)===index;
    btn.classList.toggle('is-active',selected);
    btn.setAttribute('aria-pressed',String(selected));
  }
  if(activeMap){
    activeLines.forEach((line,i)=>line.setStyle({
      color:index>=0&&index!==i?'#a0bdb3':'#28655c',
      weight:index===i?6:4,
      opacity:index>=0&&index!==i?.3:.92
    }));
    activeMap.fitBounds(selection.bounds,{padding:[34,42],maxZoom:7});
  }
}

async function mountLeaflet(plan,lang,id){
  try{
    const L=await loadLeaflet();
    if(!dialog?.open||id!==requestId)return;
    const mapElement=dialog.querySelector('#leaflet-flight-map');
    const map=L.map(mapElement,{scrollWheelZoom:false,zoomControl:true,preferCanvas:true});
    activeMap=map;activeId=id;
    const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      minZoom:2,maxZoom:9,noWrap:true
    }).addTo(map);
    let hasTiles=false;
    tiles.on('tileload',()=>{
      if(hasTiles||id!==requestId||!dialog?.open)return;
      hasTiles=true;
      mapElement.classList.add('is-loaded');
    });
    activeLines=plan.legs.map(leg=>L.polyline(leg,{color:'#28655c',weight:4,dashArray:'8,9',opacity:.92}).addTo(map));
    plan.airports.forEach((p,i)=>{
      L.circleMarker([p.lat,p.lon],{
        radius:8,weight:3,color:'#22544e',fillColor:i===1&&plan.airports.length===3?'#f2ad7d':'#fffdf4',fillOpacity:1
      }).addTo(map).bindTooltip(p.code,{direction:'top',permanent:true,className:'route-airport-tooltip'});
    });
    // No live plane marker. Without actual tracking data, showing a position
    // would be misleading; a route line is sufficient and clearly schematic.
    map.fitBounds(legSelection(plan,activeLeg).bounds,{padding:[34,42],maxZoom:6});
    requestAnimationFrame(()=>{if(id===requestId&&dialog?.open)map.invalidateSize();});
  }catch{
    // The lightweight SVG fallback remains usable if the CDN or tile service
    // is blocked; do not claim successful tile loading.
  }
}
export function openRouteMap(offer,lang='ru',sourceButton=null,query=null){
  const journey=selectedJourney(offer,query);
  if(!journey)return false;
  const d=buildDialog();
  clearMap();lastFocus=sourceButton||document.activeElement;
  activePlan=journey.plan;activeLang=lang;activeLeg=-1;
  renderDialog(journey,lang);
  if(!d.open)d.showModal();
  const id=++requestId;
  mountLeaflet(journey.plan,lang,id);
  return true;
}
