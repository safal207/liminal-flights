/**
 * Offline illustrative route geometry for the Liminal Flights demo.
 *
 * IMPORTANT: These fictional itineraries are not supplier flight plans.
 * Great-circle paths are only geodesic approximations: real airways,
 * airspace restrictions, weather, ATC, diversions and turns are unknown.
 * No actual aircraft positions or schedule/delay data is supplied.
 */
export const AIRPORT_COORDS = Object.freeze({
  GZP: Object.freeze({lat:36.2993, lon:32.3014}),
  AYT: Object.freeze({lat:36.8987, lon:30.8005}),
  IST: Object.freeze({lat:41.2753, lon:28.7519}),
  VKO: Object.freeze({lat:55.5915, lon:37.2615}),
  SVO: Object.freeze({lat:55.9726, lon:37.4146}),
  DME: Object.freeze({lat:55.4088, lon:37.9063}),
});

// Transit points are part of the fictional fixture, NEVER a claim about an
// airline's published connection. Never infer real stops from a stop count.
export const MOCK_FLIGHT_PATHS = Object.freeze({
  balanced: Object.freeze(['GZP','IST','VKO']),
  cheapest: Object.freeze(['GZP','IST','SVO']),
  fastest: Object.freeze(['GZP','VKO']),
  'ayt-balanced': Object.freeze(['AYT','VKO']),
  'ayt-cheapest': Object.freeze(['AYT','IST','DME']),
  'ayt-fastest': Object.freeze(['AYT','SVO'])
});

const radians = deg => deg*Math.PI/180;
const degrees = rad => rad*180/Math.PI;
const unitVector = point => {
  const latitude=radians(point.lat),longitude=radians(point.lon);
  return [Math.cos(latitude)*Math.cos(longitude),Math.cos(latitude)*Math.sin(longitude),Math.sin(latitude)];
};
function interpolateGreatCircle(start,end,t){
  if(!Number.isFinite(t)||t<0||t>1) throw Error('Invalid segment interpolation');
  const a=unitVector(start),b=unitVector(end);
  const dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  const delta=Math.acos(dot);
  if(delta<1e-9)return [start.lat,start.lon];
  if(Math.abs(Math.PI-delta)<1e-6) throw Error('Antipodal segment requires a specified waypoint');
  const f=Math.sin((1-t)*delta)/Math.sin(delta);
  const g=Math.sin(t*delta)/Math.sin(delta);
  const x=f*a[0]+g*b[0],y=f*a[1]+g*b[1],z=f*a[2]+g*b[2];
  return [degrees(Math.atan2(z,Math.hypot(x,y))),degrees(Math.atan2(y,x))];
}
export function greatCircle(start,end,steps=24){
  if(!Number.isInteger(steps)||steps<1||steps>512)throw Error('Invalid sample count');
  for(const p of [start,end]) {
    if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lon)
      ||Math.abs(p.lat)>90||Math.abs(p.lon)>180)throw Error('Invalid airport coordinates');
  }
  return Array.from({length:steps+1},(_,i)=>interpolateGreatCircle(start,end,i/steps));
}
export function flightPlan(offer){
  const path=MOCK_FLIGHT_PATHS[offer?.id];
  if(!path||path[0]!==offer.from||path[path.length-1]!==offer.airport
    ||path.length-2!==offer.stops) return null;
  const airports=path.map(code=>({code,...AIRPORT_COORDS[code]}));
  if(airports.some(point=>!Number.isFinite(point.lat)||!Number.isFinite(point.lon)))return null;
  const legs=airports.slice(1).map((point,i)=>greatCircle(airports[i],point));
  return {
    source:'synthetic',
    live:false,
    flightStatus:'unavailable',
    livePosition:null,
    actualTrack:null,
    airports,
    legs,
    independentTickets:!offer.protected,
    // This flag is preserved for all provider-free demo routes.
    approximate:true
  };
}
export function planBounds(plan){
  if(!plan||!plan.legs?.length)throw Error('Route has no geometry');
  const coords=plan.legs.flat();
  return [
    [Math.min(...coords.map(p=>p[0])),Math.min(...coords.map(p=>p[1]))],
    [Math.max(...coords.map(p=>p[0])),Math.max(...coords.map(p=>p[1]))]
  ];
}
export function pathDistanceKm(leg){
  let meters=0;
  for(let i=1;i<leg.length;i++){
    const [a,b]=[leg[i-1],leg[i]];
    const latitude=radians(b[0]-a[0]),longitude=radians(b[1]-a[1]);
    const x=Math.sin(latitude/2)**2+Math.cos(radians(a[0]))*Math.cos(radians(b[0]))*Math.sin(longitude/2)**2;
    meters+=2*6371*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)));
  }
  return meters;
}
export function approximateDistanceKm(plan) {
  return Math.round(plan.legs.reduce((total,leg)=>total+pathDistanceKm(leg),0));
}
