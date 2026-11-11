import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialLanguage, normalizeLanguage, staticTranslation, useLanguage,
  language, translate, airportLabel, offerCopy} from '../i18n.mjs';
import {MOCK_ROUTES, formatEur, formatMinutes} from '../core.mjs';

test('stored language takes precedence over browser language; fallback is Russian',()=>{
  assert.equal(initialLanguage('ru','en-US'),'ru');
  assert.equal(initialLanguage('en','ru-RU'),'en');
  assert.equal(initialLanguage(null,'en-GB'),'en');
  assert.equal(initialLanguage(null,'tr-TR'),'ru');
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

test('all visible original Russian static labels and accessibility strings have EN equivalents',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const withoutSVG=html.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g,'');
  const textNodes=withoutSVG.replace(/<[^>]+>/g,'|').split('|')
    .map(str=>str.trim()).filter(str=>/[А-Яа-яЁё]/.test(str));
  const attrs=[...html.matchAll(/(?:aria-label|title|content)="([^"]*[А-Яа-яЁё][^"]*)"/g)]
    .map(match=>match[1]);
  const untranslated=[...textNodes,...attrs].filter(str=>staticTranslation(str,'en')===str);
  assert.deepEqual(untranslated,[]);
  assert.equal(staticTranslation('Сохранённое','en'),'Saved');
  assert.equal(staticTranslation('Сохранённое','ru'),'Сохранённое');
});
