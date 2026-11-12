import test from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_ROUTES,totalMinor} from '../core.mjs';
import {selectedJourney,legSelection} from '../journey-view.mjs';
import {mapText} from '../flight-map-ui.mjs';

const party={adults:2,children:2,infants:0};
const q={date:'2026-11-20',party,origin:'GZP',destination:'MOW',bags:2,trip:'one-way'};

test('selected personal journey preserves search context without creating a real flight occurrence',()=>{
  for(const offer of MOCK_ROUTES){
    const journey=selectedJourney(offer,q);
    assert.ok(journey,offer.id);
    assert.equal(journey.offerId,offer.id);
    assert.equal(journey.searchDate,'2026-11-20');
    assert.equal(journey.passengers,4);
    assert.equal(journey.evidence.kind,'synthetic');
    assert.equal(journey.evidence.live,false);
    assert.equal(journey.evidence.scheduleConfirmed,false);
    assert.equal(journey.evidence.flightOccurrenceId,null);
    assert.equal(journey.evidence.currentAircraftPosition,null);
    assert.equal(journey.evidence.lastUpdatedAt,null);
    assert.equal(journey.evidence.delayMinutes,null);
    assert.equal(journey.evidence.delayStatus,null);
    assert.equal(journey.evidence.positionObservedAt,null);
    assert.ok(journey.approximateDistanceKm>0);
  }
});

test('entire journey and individual legs have coherent route, bounds, distances',()=>{
  const journey=selectedJourney(MOCK_ROUTES[0],q);
  const all=legSelection(journey.plan);
  assert.deepEqual(all.codes,['GZP','IST','VKO']);
  assert.equal(all.legs.length,2);
  const first=legSelection(journey.plan,0),second=legSelection(journey.plan,1);
  assert.deepEqual(first.codes,['GZP','IST']);
  assert.deepEqual(second.codes,['IST','VKO']);
  assert.ok(first.distanceKm>0);
  assert.ok(second.distanceKm>0);
  assert.ok(Math.abs(first.distanceKm+second.distanceKm-all.distanceKm)<=1);
  assert.deepEqual(all.bounds[0].length,2);
  assert.deepEqual(first.bounds[1].length,2);
  assert.notDeepEqual(first.bounds,all.bounds);
  assert.throws(()=>legSelection(journey.plan,2));
  assert.throws(()=>legSelection(journey.plan,-2));
  assert.throws(()=>legSelection(journey.plan,0.5));
  assert.throws(()=>legSelection(null,0));
});

test('no search metadata or corrupt data is represented as confirmed tracking',()=>{
  assert.equal(selectedJourney({id:'non-existent',from:'GZP',airport:'VKO',stops:1}),null);
  const journey=selectedJourney(MOCK_ROUTES[2]);
  assert.equal(journey.searchDate,null);
  assert.equal(journey.passengers,null);
  assert.equal(journey.evidence.lastUpdatedAt,null);
  const malformed=selectedJourney(MOCK_ROUTES[2],{date:'20/11/2026',party:{adults:0,children:0,infants:0}});
  assert.equal(malformed.searchDate,null);
  assert.equal(malformed.passengers,null);
});

test('all three locales explain missing status, delay and last update',()=>{
  for(const locale of ['ru','en','tr']){
    for(const key of ['chosen','legs','allLegs','legHelp','trackingTitle','unverified','lastUpdate','noUpdate','delay','delayUnknown','statusNote']){
      assert.notEqual(mapText(locale,key),key,locale+': '+key);
    }
  }
  assert.equal(mapText('ru','noUpdate'),'Нет данных');
  assert.equal(mapText('en','delayUnknown'),'Unknown');
  assert.equal(mapText('tr','unverified'),'Uçuş verisi alınmadı');
});

test('journey map is not used to adjust passenger totals or ranking',()=>{
  const offer=MOCK_ROUTES[0];
  const cost=totalMinor(offer,party,2);
  const j=selectedJourney(offer,q);
  legSelection(j.plan,0);
  legSelection(j.plan,-1);
  assert.equal(totalMinor(offer,party,2),cost);
  assert.equal(offer.fareAdult,22500);
});
