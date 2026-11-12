/**
 * Privacy-first client-side product funnel.
 * This is a *local session diary*, not a site-wide analytics backend.
 * No network requests, cookies, stable visitor IDs, passenger names or
 * full URLs are collected here. Booking and commission events are server-only.
 */
export const CLIENT_EVENTS=Object.freeze([
  'landing_view','priority_selected','search_submitted','search_invalid',
  'offer_impression','offer_selected','map_opened','offer_saved','offer_shared'
]);
export const SERVER_EVENTS=Object.freeze(['partner_outbound','booking_confirmed','commission_confirmed','booking_refunded']);
const ALLOWED_FIELDS=Object.freeze({
  landing_view:[],
  priority_selected:['priority'],
  search_submitted:['origin','destination','trip','priority','passengers','bags'],
  search_invalid:['reason'],
  offer_impression:['offer_id','rank','origin','destination','priority','search_index'],
  offer_selected:['offer_id','rank','origin','destination','priority','search_index'],
  map_opened:['offer_id','rank','search_index'],
  offer_saved:['offer_id','search_index'],
  offer_shared:['offer_id','search_index']
});
const KEY='lf_funnel_session_v1';
const maxEvents=180;
const permitted=/^[a-zA-Z0-9_.:-]{1,80}$/;
const normalizeField=(value)=>{
  if(typeof value==='number')return Number.isFinite(value)&&value>=0&&value<100000?value:null;
  if(typeof value==='string')return permitted.test(value)?value:null;
  return null;
};
export function utmFromQuery(search=''){
  const q=new URLSearchParams(String(search||'').replace(/^\?/,''));
  const result={};
  for(const field of ['utm_source','utm_medium','utm_campaign','utm_content']){
    const value=q.get(field);
    const safe=normalizeField(value);
    if(safe!==null)result[field]=safe;
  }
  return result;
}
export function validateEvent(type,payload={}){
  if(!CLIENT_EVENTS.includes(type))throw Error('Disallowed client event: '+type);
  if(!payload||Array.isArray(payload)||typeof payload!=='object')throw Error('Invalid funnel payload');
  const allowed=ALLOWED_FIELDS[type];
  const fields={};
  for(const key of allowed){
    if(!Object.hasOwn(payload,key))continue;
    const safe=normalizeField(payload[key]);
    if(safe!==null)fields[key]=safe;
  }
  return fields;
}
export function createLocalFunnel({storage=null,search='',now=()=>new Date()}={}){
  const attribution=utmFromQuery(search);
  let events=[];
  try{
    const stored=JSON.parse(storage?.getItem(KEY)||'[]');
    if(Array.isArray(stored)){
      events=stored.slice(-maxEvents).filter(x=>x&&CLIENT_EVENTS.includes(x.type)&&
        typeof x.timestamp==='string'&&x.fields&&typeof x.fields==='object')
        .map(x=>({type:x.type,timestamp:x.timestamp,fields:validateEvent(x.type,x.fields),attribution:utmFromQuery(
          Object.entries(x.attribution||{}).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&'))}));
    }
  }catch{/* Browsers may prohibit session storage; in-memory mode still works. */}
  function record(type,payload={}){
    const fields=validateEvent(type,payload);
    const event={type,timestamp:now().toISOString(),fields,attribution};
    events=[...events,event].slice(-maxEvents);
    try{storage?.setItem(KEY,JSON.stringify(events));}catch{/* Optional local persistence. */}
    return event;
  }
  return {
    record,
    events:()=>events.map(e=>({...e,fields:{...e.fields},attribution:{...e.attribution}})),
    summary:()=>summarizeFunnel(events),
    attribution:()=>({...attribution})
  };
}
export function summarizeFunnel(events){
  const result={landing_view:0,search_submitted:0,offer_impression:0,offer_selected:0,map_opened:0,offer_saved:0,offer_shared:0};
  const placements={};
  for(const event of events){
    if(Object.hasOwn(result,event.type))result[event.type]++;
    if(['offer_impression','offer_selected'].includes(event.type)){
      const {offer_id,rank}=event.fields||{};
      if(!offer_id||!Number.isInteger(rank)||rank<1)continue;
      const key=offer_id+'@'+rank;
      const placement=placements[key]||{offer_id,rank,impressions:0,selections:0};
      if(event.type==='offer_impression')placement.impressions++;
      else placement.selections++;
      placements[key]=placement;
    }
  }
  return {events:result,placements:Object.values(placements),real_bookings:null,confirmed_commissions_eur:null};
}
