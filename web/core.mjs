/** Demonstration flight data only: never represent this output as bookable inventory. */
export const MOCK_ROUTES = Object.freeze([
  { id:'balanced', from:'GZP', to:'MOW', airport:'VKO', depart:'11:30', arrive:'18:50', minutes:440, stops:1, connection:'Одна пересадка по одному билету', protected:true, fareAdult:22500, fareChild:19000, fareInfant:2500, luggagePerBag:2100, confidence:'synthetic', note:'Хороший баланс времени, цены и понятной пересадки.', tag:'Лучший баланс', tagClass:'' },
  { id:'cheapest', from:'GZP', to:'MOW', airport:'SVO', depart:'07:15', arrive:'21:20', minutes:845, stops:1, connection:'Самостоятельная пересадка — два билета', protected:false, fareAdult:16200, fareChild:14200, fareInfant:1500, luggagePerBag:3500, confidence:'synthetic', note:'Экономия за счёт отдельного билета. При задержке второй рейс может пропасть.', tag:'Самая низкая цена', tagClass:'saver' },
  { id:'fastest', from:'GZP', to:'MOW', airport:'VKO', depart:'13:05', arrive:'17:50', minutes:285, stops:0, connection:'Без пересадок', protected:true, fareAdult:31400, fareChild:25500, fareInfant:3500, luggagePerBag:1800, confidence:'synthetic', note:'Самое короткое время в пути, без необходимости менять рейс.', tag:'Самый быстрый', tagClass:'fast' },
  { id:'ayt-balanced', from:'AYT', to:'MOW', airport:'VKO', depart:'10:25', arrive:'15:25', minutes:300, stops:0, connection:'Без пересадок', protected:true, fareAdult:25100, fareChild:19300, fareInfant:2500, luggagePerBag:2100, confidence:'synthetic', note:'Условный прямой вариант из Антальи.', tag:'Лучший баланс', tagClass:'' },
  { id:'ayt-cheapest', from:'AYT', to:'MOW', airport:'DME', depart:'06:30', arrive:'17:40', minutes:670, stops:1, connection:'Самостоятельная пересадка — два билета', protected:false, fareAdult:17800, fareChild:15100, fareInfant:2000, luggagePerBag:2900, confidence:'synthetic', note:'Ниже цена, но выше риск при пересадке.', tag:'Самая низкая цена', tagClass:'saver' },
  { id:'ayt-fastest', from:'AYT', to:'MOW', airport:'SVO', depart:'12:30', arrive:'17:10', minutes:280, stops:0, connection:'Без пересадок', protected:true, fareAdult:31900, fareChild:25900, fareInfant:3000, luggagePerBag:1800, confidence:'synthetic', note:'Быстрый прямой перелёт в демонстрации.', tag:'Самый быстрый', tagClass:'fast' },
]);
export const AIRPORT_NAMES = { GZP:'Газипаша', AYT:'Анталья', MOW:'Москва', VKO:'Внуково', SVO:'Шереметьево', DME:'Домодедово', IST:'Стамбул' };
export const normalizeAirport = value => String(value||'').trim().toUpperCase();
export function totalMinor(offer, passengers, bags) {
  if (!offer || !passengers) throw Error('Missing fare or passengers');
  const adults = Number(passengers.adults), children = Number(passengers.children), infants = Number(passengers.infants), checkedBags = Number(bags);
  if (![adults,children,infants,checkedBags].every(Number.isInteger) || adults < 1 || children < 0 || infants < 0 || checkedBags < 0 || adults + children + infants > 9 || infants > adults) throw Error('Invalid passenger or baggage group');
  return adults * offer.fareAdult + children * offer.fareChild + infants * offer.fareInfant + checkedBags * offer.luggagePerBag;
}
export function availableDemoOffers(origin, destination, trip='one-way') {
  if (trip!=='one-way') return [];
  const start=normalizeAirport(origin), end=normalizeAirport(destination);
  return MOCK_ROUTES.filter(offer=>offer.from===start && (end===offer.to || end===offer.airport));
}
export function sortOffers(offers, criterion, passengers, bags) {
  return [...offers].sort((a,b)=>{
    if (criterion==='cheapest') return totalMinor(a,passengers,bags)-totalMinor(b,passengers,bags) || a.minutes-b.minutes;
    if (criterion==='fastest') return a.minutes-b.minutes || totalMinor(a,passengers,bags)-totalMinor(b,passengers,bags);
    const score=o => totalMinor(o,passengers,bags)/100 + o.minutes*.55 + (o.protected?0:450);
    return score(a)-score(b) || a.id.localeCompare(b.id);
  });
}
export const formatEur = (minor, language='ru') =>
  new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'ru-RU',
    {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(minor/100);
export const formatMinutes = (minutes, language='ru') =>
  language === 'en'
    ? Math.floor(minutes/60) + 'h ' + minutes%60 + 'm'
    : Math.floor(minutes/60) + ' ч ' + minutes%60 + ' мин';
