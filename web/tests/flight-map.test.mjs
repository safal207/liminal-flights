import test from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_ROUTES} from '../core.mjs';
import {AIRPORT_COORDS,MOCK_FLIGHT_PATHS,flightPlan,greatCircle,
  planBounds,pathDistanceKm,approximateDistanceKm} from '../flight-map.mjs';
import {mapText} from '../flight-map-ui.mjs';

test('every fictional fare has a consistent illustration with no live claims',()=>{
  for(const offer of MOCK_ROUTES){
    const plan=flightPlan(offer);
    assert.ok(plan,offer.id+' requires map data');
    assert.equal(plan.source,'synthetic');
    assert.equal(plan.live,false);
    assert.equal(plan.flightStatus,'unavailable');
    assert.equal(plan.livePosition,null);
    assert.equal(plan.actualTrack,null);
    assert.equal(plan.approximate,true);
    assert.equal(plan.independentTickets,!offer.protected);
    assert.equal(plan.airports[0].code,offer.from);
    assert.equal(plan.airports.at(-1).code,offer.airport);
    assert.equal(plan.airports.length-2,offer.stops);
    assert.equal(plan.legs.length,offer.stops+1);
    assert.equal(plan.legs.flat().length,(offer.stops+1)*25);
    assert.ok(approximateDistanceKm(plan)>100);
  }
  assert.equal(Object.keys(MOCK_FLIGHT_PATHS).length,MOCK_ROUTES.length);
});

test('great-circle interpolation starts and ends exactly at airport positions',()=>{
  const start=AIRPORT_COORDS.GZP,end=AIRPORT_COORDS.VKO;
  const line=greatCircle(start,end,24);
  assert.equal(line.length,25);
  assert.ok(Math.abs(line[0][0]-start.lat)<1e-9);
  assert.ok(Math.abs(line[0][1]-start.lon)<1e-9);
  assert.ok(Math.abs(line.at(-1)[0]-end.lat)<1e-9);
  assert.ok(Math.abs(line.at(-1)[1]-end.lon)<1e-9);
  assert.ok(line.every(([lat,lon])=>lat>0 && lat<90 && lon>0 && lon<180));
  const distance=pathDistanceKm(line);
  assert.ok(distance>1700 && distance<2600,'Route must have plausible geographical scale');
  const bounds=planBounds(flightPlan(MOCK_ROUTES[0]));
  assert.ok(bounds[0][0]<37 && bounds[1][0]>55);
  assert.throws(()=>greatCircle(start,end,0));
  assert.throws(()=>greatCircle(start,{lat:999,lon:20}));
});

test('unknown or inconsistent offers never appear as real mapped routes',()=>{
  assert.equal(flightPlan({id:'unknown',from:'GZP',airport:'VKO',stops:0}),null);
  assert.equal(flightPlan({...MOCK_ROUTES[0],stops:0}),null);
  assert.equal(flightPlan({...MOCK_ROUTES[0],airport:'SVO'}),null);
  assert.equal(flightPlan({...MOCK_ROUTES[1],from:'AYT'}),null);
});

test('route map disclosures and labels are supplied in RU, EN and TR',()=>{
  for(const lang of ['ru','en','tr']){
    for(const key of ['open','title','notLive','warning','statusNone','locationNone','plane','close','connection','separate']){
      assert.notEqual(mapText(lang,key),key,lang+': '+key);
    }
  }
  assert.equal(mapText('en','open'),'View map ↗');
  assert.equal(mapText('tr','notLive'),'Canlı takip değil');
  assert.match(mapText('ru','warning'),/не опубликованный план/);
  assert.match(mapText('en','locationNone'),/not connected/);
});
