import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialLanguage, normalizeLanguage, staticTranslation, useLanguage,
  language, translate, airportLabel, offerCopy} from '../i18n.mjs';
import {MOCK_ROUTES, formatEur, formatMinutes} from '../core.mjs';
import * as flightCore from '../core.mjs';

test('stored language takes precedence over browser language; fallback is Russian',()=>{
  assert.equal(initialLanguage('ru','en-US'),'ru');
  assert.equal(initialLanguage('en','ru-RU'),'en');
  assert.equal(initialLanguage(null,'en-GB'),'en');
  assert.equal(initialLanguage(null,'tr-TR'),'tr');
  assert.equal(initialLanguage('tr','en-US'),'tr');
  assert.equal(initialLanguage(null,'tr'),'tr');
  assert.equal(initialLanguage('bad','en-GB'),'en');
  assert.equal(normalizeLanguage('bad'),'ru');
});

test('dynamic content, airport names and sample route copy switch both ways',()=>{
  useLanguage('en');
  assert.equal(language(),'en');
  assert.equal(translate('summaryAdults',1),'1 adult');
  assert.equal(translate('summaryAdults',2),'2 adults');
  assert.equal(translate('countPassengers',1),'1 traveller');
  assert.equal(translate('invalidAirports'),'Enter three-letter airport codes, such as GZP and MOW.');
  assert.equal(airportLabel('MOW'),'Moscow');
  assert.equal(offerCopy(MOCK_ROUTES[0]).tag,'Best overall');
  assert.match(offerCopy(MOCK_ROUTES[1]).note,/Separate tickets/);
  assert.equal(formatMinutes(285,language()),'4h 45m');
  assert.match(formatEur(46500,language()),/€465/);
  useLanguage('ru');
  assert.equal(airportLabel('MOW'),'Москва');
  assert.equal(offerCopy(MOCK_ROUTES[0]).tag,'Лучший баланс');
  assert.equal(formatMinutes(285,language()),'4 ч 45 мин');
  assert.equal(translate('summaryAdults',2),'2 взросл.');
});

test('all original Russian static labels and accessibility strings have EN and TR equivalents',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const withoutSVG=html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g,'');
  const textNodes=withoutSVG.replace(/<[^>]+>/g,'|').split('|')
    .map(str=>str.trim()).filter(str=>/[А-Яа-яЁё]/.test(str));
  const attrs=[...html.matchAll(/(?:aria-label|title|content)="([^"]*[А-Яа-яЁё][^"]*)"/g)]
    .map(match=>match[1]);
  for(const locale of ['en','tr']){
    const untranslated=[...textNodes,...attrs].filter(str=>staticTranslation(str,locale)===str);
    assert.deepEqual(untranslated,[],`Missing ${locale} translations`);
  }
  assert.match(html,/data-language="tr"/);
  assert.equal(staticTranslation('Сохранённое','en'),'Saved');
  assert.equal(staticTranslation('Сохранённое','ru'),'Сохранённое');
});

test('Turkish locale translates form, warnings, cards, airports and price formats',()=>{
  useLanguage('tr');
  assert.equal(language(),'tr');
  assert.equal(translate('summaryAdults',2),'2 yetişkin');
  assert.equal(translate('summaryChildren',2),'2 çocuk');
  assert.equal(translate('countPassengers',4),'4 yolcu');
  assert.equal(translate('invalidAirports'),'GZP ve MOW gibi üç harfli havalimanı kodları girin.');
  assert.equal(airportLabel('MOW'),'Moskova');
  assert.equal(airportLabel('IST'),'İstanbul');
  assert.equal(offerCopy(MOCK_ROUTES[0]).tag,'En uygun denge');
  assert.equal(offerCopy(MOCK_ROUTES[2]).tag,'En hızlı');
  assert.match(offerCopy(MOCK_ROUTES[1]).note,/Ayrı biletler/);
  assert.equal(translate('selfTransfer'),'Ayrı biletler');
  assert.equal(translate('roundTripTitle'),'Gidiş-dönüş seçeneği yakında');
  assert.equal(translate('save'),'♡ Kaydet');
  assert.equal(formatMinutes(285,language()),'4 sa 45 dk');
  assert.match(formatEur(46500,language()),/465/);
  assert.match(formatEur(46500,language()),/€/);
  assert.equal(staticTranslation('Найти подходящие рейсы','tr'),'Uygun uçuşları bul');
  assert.equal(staticTranslation('Турецкий язык','en'),'Turkish');
  useLanguage('ru');
  assert.equal(translate('save'),'♡ Сохранить');
});

test('TR locale does not affect fare calculations or sorting',()=>{
  const passengers={adults:2,children:2,infants:0};
  const {totalMinor,sortOffers,availableDemoOffers}=flightCore;
  const fares=availableDemoOffers('GZP','MOW');
  const before=totalMinor(fares[0],passengers,2);
  const ranking=sortOffers(fares,'cheapest',passengers,2).map(o=>o.id);
  useLanguage('tr');
  assert.equal(totalMinor(fares[0],passengers,2),before);
  assert.deepEqual(sortOffers(fares,'cheapest',passengers,2).map(o=>o.id),ranking);
  useLanguage('ru');
});
