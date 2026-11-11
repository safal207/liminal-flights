import test from 'node:test';
import assert from 'node:assert/strict';
import {MOCK_ROUTES,normalizeAirport,totalMinor,availableDemoOffers,sortOffers,formatMinutes} from '../core.mjs';
const family={adults:2,children:2,infants:0};
test('mock routes are restricted to defined corridors and one-way trips',()=>{
  assert.equal(availableDemoOffers('gzp','mow').length,3);
  assert.equal(availableDemoOffers('AYT','MOW').length,3);
  assert.equal(availableDemoOffers('LHR','MOW').length,0);
  assert.equal(availableDemoOffers('GZP','MOW','round-trip').length,0);
  assert.equal(normalizeAirport(' gzp '),'GZP');
});
test('calculates complete family price and baggage rather than adult fare multiplied by count',()=>{
  const first=MOCK_ROUTES[0];
  assert.equal(totalMinor(first,family,2),2*22500+2*19000+2*2100);
  assert.equal(totalMinor(first,{adults:1,children:0,infants:0},0),22500);
  assert.throws(()=>totalMinor(first,{adults:0,children:2,infants:0},0));
  assert.throws(()=>totalMinor(first,{adults:1,children:0,infants:2},0));
});
test('cheapest / fastest sorts reflect intended tradeoff',()=>{
  const offers=availableDemoOffers('GZP','MOW');
  assert.equal(sortOffers(offers,'cheapest',family,2)[0].id,'cheapest');
  assert.equal(sortOffers(offers,'fastest',family,2)[0].id,'fastest');
  assert.equal(formatMinutes(285),'4 ч 45 мин');
});
