import {MOCK_ROUTES, normalizeAirport, totalMinor, availableDemoOffers, sortOffers, formatEur, formatMinutes} from './core.mjs';
import {language, useLanguage, initialLanguage, localizeStaticDocument, translate, airportLabel, offerCopy} from './i18n.mjs';
const el=id=>document.getElementById(id);
const languageStorageKey='liminal-flights-language-v1';
let storedLanguage=null;
try {storedLanguage=localStorage.getItem(languageStorageKey);} catch { /* Storage is optional. */ }
useLanguage(initialLanguage(storedLanguage, navigator.language));
const localizePage=localizeStaticDocument(document);
localizePage(language());
const form=el('flight-form'), results=el('results-list'), announcement=el('announcement');
let sort='balanced';
const party={adults:2,children:2,infants:0};
const storageKey='liminal-flights-saved-v1';
const saved=new Map();
try { const stored=JSON.parse(localStorage.getItem(storageKey)||'[]'); if(Array.isArray(stored)) for(const record of stored.slice(0,30)){ if(record && typeof record.key==='string' && typeof record.route==='string' && typeof record.date==='string') saved.set(record.key,record); } }catch { /* Private mode/storage unavailable: interface still works. */ }
function announce(message){announcement.textContent=message;}
function validYMD(date){return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T12:00:00`).getTime())}
function localDate(offset=0){const d=new Date(); d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
const dep=el('departure'), returnDate=el('return-date');
dep.min=localDate();dep.value=localDate(7);returnDate.min=dep.value;returnDate.value=localDate(14);
dep.addEventListener('change',()=>{returnDate.min=dep.value;if(returnDate.value<dep.value)returnDate.value=dep.value;});
function selectedTrip(){return form.querySelector('input[name="trip"]:checked').value;}
for(const input of form.querySelectorAll('input[name="trip"]'))input.addEventListener('change',()=>{const isReturn=selectedTrip()==='round-trip';el('return-field').hidden=!isReturn;returnDate.required=isReturn;});
el('swap').addEventListener('click',()=>{const from=el('origin');const to=el('destination');[from.value,to.value]=[to.value,from.value];from.focus();announce(translate('swapped'));});
function partySummary(){
  return [translate('summaryAdults',party.adults),translate('summaryChildren',party.children)]
    .concat(party.infants?[translate('summaryInfants',party.infants)]:[]).join(' · ');
}
function updateParty(){el('traveler-summary').textContent=partySummary();for(const key of Object.keys(party)){el(`${key}-count`).textContent=party[key]; const min=key==='adults'?1:0;for(const btn of document.querySelectorAll(`[data-person="${key}"]`)){const next=party[key]+Number(btn.dataset.step);btn.disabled=next<min || next>9 || party.adults+party.children+party.infants+Number(btn.dataset.step)>9 || (key==='adults' && next<party.infants) || (key==='infants' && next>party.adults);}}}
const trigger=el('traveler-trigger'),travPanel=el('traveler-panel');
function setPanel(open,restore=false){travPanel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));if(restore)trigger.focus();}
trigger.addEventListener('click',()=>setPanel(travPanel.hidden));el('traveler-done').addEventListener('click',()=>setPanel(false,true));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!travPanel.hidden)setPanel(false,true);});
document.addEventListener('pointerdown',event=>{if(!travPanel.hidden&&!el('traveler-panel').contains(event.target)&&!trigger.contains(event.target))setPanel(false);});
travPanel.addEventListener('click',event=>{const btn=event.target.closest('[data-person]');if(!btn||btn.disabled)return;const kind=btn.dataset.person,step=Number(btn.dataset.step),next=party[kind]+step,groupTotal=party.adults+party.children+party.infants+step;if(next<(kind==='adults'?1:0)||next>9||groupTotal>9||(kind==='infants'&&next>party.adults)||(kind==='adults'&&next<party.infants))return;party[kind]=next;updateParty();});
updateParty();
function currentQuery(){return{origin:normalizeAirport(el('origin').value),destination:normalizeAirport(el('destination').value),date:dep.value,returnDate:returnDate.value,trip:selectedTrip(),bags:Number(el('bags').value),party:{...party}};}
function validateQuery(q){
  if(!/^[A-Z]{3}$/.test(q.origin)||!/^[A-Z]{3}$/.test(q.destination)) return translate('invalidAirports');
  if(q.origin===q.destination) return translate('sameAirport');
  if(!validYMD(q.date)||q.date<localDate()) return translate('invalidDeparture');
  if(q.trip==='round-trip'&&(!validYMD(q.returnDate)||q.returnDate<q.date)) return translate('invalidReturn');
  return '';
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
let lastQuery=currentQuery();
function storageWrite(){try{localStorage.setItem(storageKey,JSON.stringify([...saved.values()]));return true;}catch{return false;}}
function saveKey(offer,q){return [offer.id,q.date,q.origin,q.destination,q.party.adults,q.party.children,q.party.infants,q.bags].join(':');}
function renderSaved(){
  el('saved-count').textContent=saved.size;
  const list=el('saved-list');
  list.replaceChildren();
  if(!saved.size){
    const p=document.createElement('p');
    p.className='empty-saved';
    p.textContent=translate('savedEmpty');
    list.append(p);
    return;
  }
  for(const item of [...saved.values()].reverse()){
    const node=document.createElement('div');
    node.className='saved-item';
    const info=document.createElement('div');
    const title=document.createElement('strong');
    title.textContent=item.route;
    const desc=document.createElement('small');
    desc.textContent=translate('savedDescription',item.date);
    info.append(title,desc);
    const btn=document.createElement('button');
    btn.type='button';
    btn.textContent=translate('remove');
    btn.setAttribute('aria-label',translate('removeAria',item.route));
    btn.addEventListener('click',()=>{
      saved.delete(item.key);
      storageWrite();
      renderSaved();
      renderResults();
      announce(translate('removed'));
    });
    node.append(info,btn);
    list.append(node);
  }
}
function cardHTML(offer,q){
  const cost=totalMinor(offer,q.party,q.bags);
  const key=saveKey(offer,q),isSaved=saved.has(key);
  const type=offer.protected?translate('protected'):translate('selfTransfer');
  const copy=offerCopy(offer),safe=escapeHTML;
  const tag= '<span class="flight-tag '+safe(offer.tagClass)+'">'+safe(copy.tag)+'</span>';
  const first='<div class="flight-time"><strong>'+safe(offer.depart)+'</strong><small>'+safe(offer.from)+'</small></div>';
  const middle='<div class="journey-line"><span>'+safe(formatMinutes(offer.minutes,language()))+
    '</span><div class="line"></div><small>'+safe(offer.stops===0?translate('nonstop'):translate('oneStop'))+'</small></div>';
  const last='<div class="flight-time"><strong>'+safe(offer.arrive)+'</strong><small>'+safe(offer.airport)+'</small></div>';
  return '<article class="flight-card '+(offer.id.includes('balanced')?'featured':'')+
    '" data-offer="'+safe(offer.id)+'">'+
    '<div class="flight-card-head">'+tag+'<span class="flight-type">'+safe(translate('mockFare'))+'</span></div>'+
    '<div class="flight-times">'+first+middle+last+'</div>'+
    '<div class="flight-attributes"><span class="'+(offer.protected?'':'warning')+'">'+safe(type)+'</span>'+
    '<span>'+safe(translate('bagCount',q.bags))+'</span></div>'+
    '<div class="flight-reason"><strong>'+safe(translate('why'))+'</strong> '+safe(copy.note)+'</div>'+
    '<div class="flight-price-area"><div><small>'+safe(translate('partyTotal'))+'</small>'+
    '<span class="flight-price">'+safe(formatEur(cost,language()))+'</span></div>'+
    '<button type="button" class="save-button" data-save="'+safe(offer.id)+'" aria-pressed="'+isSaved+'">'+
    safe(isSaved?translate('saved'):translate('save'))+'</button></div>'+
    '<p class="card-caption">'+safe(translate('mockCardCaption'))+'</p></article>';
}
function renderResults(){
  const q=lastQuery,err=validateQuery(q);
  results.replaceChildren();
  el('results-summary').textContent=airportLabel(q.origin)+' → '+airportLabel(q.destination)+' · '+
    (q.date||translate('missingDate'))+' · '+partyText(q.party);
  if(err){showEmpty(translate('checkParams'),err);announce(err);return;}
  if(q.trip==='round-trip'){
    showEmpty(translate('roundTripTitle'),translate('roundTripBody'));
    announce(translate('roundTripNotice'));return;
  }
  const offers=sortOffers(availableDemoOffers(q.origin,q.destination,q.trip),sort,q.party,q.bags);
  if(!offers.length){
    showEmpty(translate('noDemoTitle'),translate('noDemoBody'));
    announce(translate('noDemoNotice'));return;
  }
  results.innerHTML=offers.map(offer=>cardHTML(offer,q)).join('');
  announce(translate('found',offers.length));
}
function partyText(p){return translate('countPassengers',p.adults+p.children+p.infants);}
function showEmpty(title,message){
  const box=document.createElement('div');box.className='no-results';
  const h=document.createElement('h3');h.textContent=title;
  const p=document.createElement('p');p.textContent=message;
  box.append(h,p);results.append(box);
}
results.addEventListener('click',event=>{
  const btn=event.target.closest('[data-save]');
  if(!btn)return;
  const offer=MOCK_ROUTES.find(item=>item.id===btn.dataset.save);
  if(!offer)return;
  const key=saveKey(offer,lastQuery);
  let notice;
  if(saved.has(key)){saved.delete(key);notice=translate('unsaved');}
  else{
    saved.set(key,{key,route:offer.from+' → '+offer.airport,date:lastQuery.date});
    notice=translate('saveNotice');
  }
  if(!storageWrite())notice=translate('storageDenied');
  renderSaved();renderResults();announce(notice);
});
form.addEventListener('submit',event=>{event.preventDefault();setPanel(false);lastQuery=currentQuery();renderResults();el('results').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
for(const btn of document.querySelectorAll('.sort-btn'))btn.addEventListener('click',()=>{sort=btn.dataset.sort;for(const item of document.querySelectorAll('.sort-btn')){const active=item===btn;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));}renderResults();});

function updateLanguageButtons(){
  for(const btn of document.querySelectorAll('[data-language]')){
    const active=btn.dataset.language===language();
    btn.classList.toggle('is-active',active);
    btn.setAttribute('aria-pressed',String(active));
  }
}
function switchLanguage(next){
  if(next===language())return;
  useLanguage(next);
  try {localStorage.setItem(languageStorageKey,language());}catch { /* Browser storage not required. */ }
  localizePage(language());
  updateLanguageButtons();
  updateParty();
  renderSaved();
  renderResults();
  announce(translate('langChanged'));
}
for(const btn of document.querySelectorAll('[data-language]')){
  btn.addEventListener('click',()=>switchLanguage(btn.dataset.language));
}

updateLanguageButtons();
renderSaved();renderResults();
