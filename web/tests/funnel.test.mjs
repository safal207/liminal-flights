import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocalFunnel,CLIENT_EVENTS,SERVER_EVENTS,validateEvent,utmFromQuery,summarizeFunnel} from '../funnel.mjs';
import {buildDemoShareUrl,parseDemoShare,conversionText} from '../conversion.mjs';
import {MOCK_ROUTES} from '../core.mjs';

const example={origin:'GZP',destination:'MOW',date:'2026-11-20',bags:2,party:{adults:2,children:2,infants:0}};
const storage=()=>{
  const m=new Map();
  return {getItem:key=>m.get(key)||null,setItem:(key,value)=>m.set(key,value)};
};

test('funnel accepts only client-side interactions and never fabricates bookings or commissions',()=>{
  const funnel=createLocalFunnel({storage:storage(),search:'?utm_source=newsletter&utm_campaign=family&email=private'});
  const e=funnel.record('search_submitted',{search_index:1,origin:'GZP',destination:'MOW',priority:'balanced',passengers:4,
    email:'someone@example.com',fareTotal:99999});
  assert.equal(e.fields.origin,'GZP');
  assert.equal(e.fields.passengers,4);
  assert.equal(e.fields.email,undefined);
  assert.equal(e.fields.fareTotal,undefined);
  assert.deepEqual(e.attribution,{utm_source:'newsletter',utm_campaign:'family'});
  assert.throws(()=>funnel.record('booking_confirmed',{order_id:'fake'}),/Disallowed client/);
  assert.throws(()=>funnel.record('commission_confirmed',{}),/Disallowed client/);
  assert.throws(()=>funnel.record('partner_outbound',{}),/Disallowed client/);
  assert.equal(funnel.summary().real_bookings,null);
  assert.equal(funnel.summary().confirmed_commissions_eur,null);
  assert.ok(CLIENT_EVENTS.includes('offer_selected'));
  assert.ok(SERVER_EVENTS.includes('booking_refunded'));
});

test('UTM allowlist strips invalid values and removes all other URL parameters',()=>{
  assert.deepEqual(utmFromQuery('?utm_source=organic&utm_medium=web&utm_campaign=family-2026&token=secret'),
    {utm_source:'organic',utm_medium:'web',utm_campaign:'family-2026'});
  assert.deepEqual(utmFromQuery('?utm_source=%3Cscript%3E&utm_medium=paid%20search&utm_term=unknown'),{});
  assert.deepEqual(validateEvent('offer_selected',{offer_id:'balanced',rank:1,origin:'GZP',extra:'private'}),
    {offer_id:'balanced',rank:1,origin:'GZP'});
});

test('local session impressions and selections are attributable to display rank',()=>{
  const db=storage();
  const f=createLocalFunnel({storage:db,now:()=>new Date('2026-11-12T12:00:00Z')});
  f.record('search_submitted',{search_index:1,origin:'GZP',destination:'MOW',priority:'balanced'});
  f.record('offer_impression',{offer_id:'balanced',rank:1,search_index:1});
  f.record('offer_impression',{offer_id:'fastest',rank:2,search_index:1});
  f.record('offer_selected',{offer_id:'fastest',rank:2,search_index:1});
  const result=f.summary();
  assert.equal(result.events.search_submitted,1);
  assert.equal(result.events.offer_impression,2);
  assert.equal(result.events.offer_selected,1);
  assert.deepEqual(result.placements.find(p=>p.rank===2),
    {offer_id:'fastest',rank:2,impressions:1,selections:1});
  const next=createLocalFunnel({storage:db});
  assert.equal(next.events().length,4);
  assert.equal(next.events()[0].timestamp,'2026-11-12T12:00:00.000Z');
  const safeCopy=next.events();safeCopy[0].fields.origin='CHANGED';
  assert.equal(next.events()[0].fields.origin,'GZP');
});

test('session logs stay bounded and do not require local storage',()=>{
  const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  const f=createLocalFunnel({storage:blocked});
  for(let i=0;i<260;i++)f.record('landing_view');
  assert.equal(f.events().length,180);
  assert.equal(summarizeFunnel(f.events()).events.landing_view,180);
});

test('shareable sample link removes UTM tokens and restores only approved offers',()=>{
  const url=buildDemoShareUrl('https://safal207.github.io/liminal-flights/?utm_source=newsletter&auth=secret#top',
    MOCK_ROUTES[0],example);
  assert.ok(url.includes('demo_offer=balanced'));
  assert.ok(!url.includes('auth='));
  assert.ok(!url.includes('utm_'));
  assert.ok(url.endsWith('#results'));
  assert.deepEqual(parseDemoShare(new URL(url).search),{
    id:'balanced',origin:'GZP',destination:'MOW',date:'2026-11-20',
    party:{adults:2,children:2,infants:0},bags:2
  });
  assert.equal(parseDemoShare('?demo_offer=fastest&demo_from=AYT&demo_to=MOW'),null);
  assert.equal(parseDemoShare('?demo_offer=unknown&demo_from=GZP&demo_to=MOW'),null);
  assert.throws(()=>buildDemoShareUrl('https://example.com',null,example));
});

test('selection and local-metrics disclaimers exist in RU/EN/TR',()=>{
  for(const locale of ['ru','en','tr']){
    for(const key of ['choose','panelTitle','caveat','share','debugHint','debugUnavailable']){
      assert.notEqual(conversionText(locale,key),key,locale+':'+key);
    }
  }
  assert.match(conversionText('ru','caveat'),/не бронирование/);
  assert.match(conversionText('en','debugHint'),/Only this browser tab/);
  assert.match(conversionText('tr','caveat'),/rezervasyon değildir/);
});
