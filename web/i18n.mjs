// RU/EN/TR copy for a static, offline-only flight demo.
// Russian static text is the initial DOM source. No external translation service.
import { AIRPORT_NAMES } from './core.mjs';
import { staticTr, messagesTr, airportNamesTr, offerCopyTr } from './i18n-tr.mjs';

export const LANGUAGES = Object.freeze(['ru', 'en', 'tr']);
export const normalizeLanguage = value => LANGUAGES.includes(value) ? value : 'ru';

const staticEn = Object.freeze({
  'Перейти к поиску': 'Skip to search',
  'Liminal Flights — на главную': 'Liminal Flights — home',
  'умный путь домой и дальше': 'thoughtful routes, calmer journeys',
  'Как это работает': 'How it works',
  'Основное меню': 'Main navigation',
  'Сохранённое': 'Saved',
  'Демо · без живых цен': 'Demo · no live fares',
  'Уютный способ планировать путешествие': 'A calmer way to plan a journey',
  'Не просто билет.': 'More than a ticket.',
  'Ваш лучший маршрут.': 'Your better way there.',
  'Сравнивайте не только цены. Смотрите на пересадки, багаж и время в пути — чтобы выбирать спокойно.': 'Compare more than prices. Understand connections, baggage and journey times before you choose.',
  '✓ Цена за всех': '✓ Total group price',
  '✓ Понятные пересадки': '✓ Clear connections',
  '✓ Без сюрпризов*': '✓ No hidden assumptions*',
  'Вместе лететь легче': 'Better journeys together',
  'НАЧНИТЕ С МАРШРУТА': 'START WITH YOUR ROUTE',
  'Куда полетим?': 'Where shall we go?',
  'Всё важное — в одном месте': 'Everything that matters, together',
  'Тип поездки': 'Trip type',
  'В одну сторону': 'One way',
  'Туда-обратно': 'Round trip',
  'Откуда': 'From',
  'Куда': 'To',
  'Поменять местами': 'Swap airports',
  'Поменять аэропорты местами': 'Swap departure and arrival airports',
  'Аэропорт вылета': 'Departure airport',
  'Город или аэропорт': 'City or airport',
  'Вылет': 'Departure',
  'Обратно': 'Return',
  'Пассажиры': 'Travellers',
  '2 взрослых · 2 детей': '2 adults · 2 children',
  'Взрослые': 'Adults',
  'От 12 лет': 'Ages 12+',
  'Дети': 'Children',
  'От 2 до 11 лет': 'Ages 2–11',
  'Младенцы': 'Infants',
  'До 2 лет': 'Under 2',
  'Уменьшить число взрослых': 'Remove one adult',
  'Увеличить число взрослых': 'Add one adult',
  'Уменьшить число детей': 'Remove one child',
  'Увеличить число детей': 'Add one child',
  'Уменьшить число младенцев': 'Remove one infant',
  'Увеличить число младенцев': 'Add one infant',
  'В демо тарифы рассчитываются условно. Реальные возрастные правила определяет авиакомпания.': 'Demo fares are estimates. Each airline sets its own age rules.',
  'Готово': 'Done',
  'Газипаша': 'Gazipaşa',
  'Анталья': 'Antalya',
  'Москва — все аэропорты': 'Moscow — all airports',
  'Внуково': 'Vnukovo',
  'Стамбул': 'Istanbul',
  'Шереметьево': 'Sheremetyevo',
  'Домодедово': 'Domodedovo',
  'Введите трёхбуквенный IATA-код города или аэропорта.': 'Enter a three-letter city or airport IATA code.',
  'Багаж': 'Checked baggage',
  'Количество единиц регистрируемого багажа': 'Number of checked bags',
  'Без багажа': 'No checked bags',
  '1 место': '1 bag',
  '2 места': '2 bags',
  '3 места': '3 bags',
  'Найти подходящие рейсы': 'Find matching flights',
  'СРАВНИВАЙТЕ БЕЗ СПЕШКИ': 'COMPARE WITH CONFIDENCE',
  'Варианты для вас': 'Your flight options',
  'Учебные предложения для маршрута Газипаша → Москва': 'Sample offers for Gazipaşa → Moscow',
  'ⓘ Все цены и рейсы вымышлены': 'ⓘ All fares and flights are fictional',
  'Сортировка предложений': 'Sort flight offers',
  '✳ Лучший баланс': '✳ Best overall',
  '↓ Дешевле': '↓ Cheapest',
  '↗ Быстрее': '↗ Fastest',
  'ВЕРНЁМСЯ К ЭТОМУ': 'KEEP FOR LATER',
  'Ваши сохранённые варианты': 'Your saved options',
  'Сохраняются только в этом браузере. Уведомления о реальных ценах пока не подключены.': 'Saved only in this browser. Live fare notifications are not available yet.',
  'Здесь появятся маршруты, которые вам понравились.': 'Routes you save will appear here.',
  'КАК МЫ ДУМАЕМ': 'OUR APPROACH',
  'Спокойный поиск.': 'Search calmly.',
  'Осознанный выбор.': 'Choose with confidence.',
  'Считаем всё вместе': 'The price for everyone',
  'Показываем сумму за всю группу, а не красивую цену за одного.': 'We show the total for your group, not an appealing one-person headline price.',
  'Объясняем разницу': 'Explain the differences',
  'Вы видите, почему вариант быстрее, дешевле или удобнее.': 'See why one option is faster, cheaper or easier.',
  'Не скрываем риски': 'Risks are not hidden',
  'Самостоятельная пересадка не маскируется под защищённую.': 'A self-transfer is never presented as a protected connection.',
  '* Пока это интерфейс с синтетическими предложениями, не поисковик доступных к покупке билетов.': '* This is a UI demo with synthetic offers, not a search engine for bookable tickets.',
  'Открытый код ↗': 'Open source ↗',
  'Быстрая навигация': 'Quick navigation',
  'Поиск': 'Search',
  'Рейсы': 'Flights',
  'Сохранено': 'Saved',
  'Язык сайта': 'Website language',
  'Русский язык': 'Russian',
  'Английский язык': 'English',
  'Турецкий язык': 'Turkish',
  'Liminal Flights — путь, который вам подходит': 'Liminal Flights — your route, your choice',
  'Liminal Flights — удобный поиск маршрутов и понятные причины выбора. Пока работает на демонстрационных данных.': 'Liminal Flights — a calmer way to compare routes and understand trade-offs. Demo fares only.'
});

const messages = Object.freeze({
  ru: {
    swapped: 'Аэропорты поменяны местами.',
    summaryAdults: n => n + ' взросл.',
    summaryChildren: n => n + ' детей',
    summaryInfants: n => n + ' млад.',
    countPassengers: n => n + ' пассажира',
    missingDate: 'дата не выбрана',
    invalidAirports: 'Укажите аэропорты трёхбуквенными кодами — например GZP и MOW.',
    sameAirport: 'Аэропорт вылета и назначения должны отличаться.',
    invalidDeparture: 'Выберите дату вылета не раньше сегодняшней.',
    invalidReturn: 'Выберите обратную дату не раньше даты вылета.',
    savedEmpty: 'Здесь появятся маршруты, которые вам понравились.',
    savedDescription: date => date + ' · Сохранённый демо-маршрут · без отслеживания цены',
    remove: 'Убрать',
    removeAria: route => 'Удалить ' + route + ' из сохранённых',
    removed: 'Маршрут удалён из сохранённых.',
    protected: 'Без самостоятельной пересадки',
    selfTransfer: 'Отдельные билеты',
    mockFare: 'МАКЕТ ТАРИФА',
    nonstop: 'Прямой',
    oneStop: '1 пересадка',
    bagCount: n => 'Багаж: ' + n + ' мест',
    why: 'Почему этот вариант:',
    partyTotal: 'Условная сумма за всех',
    saved: '♥ Сохранено',
    save: '♡ Сохранить',
    mockCardCaption: 'Демонстрация · цена и рейс не существуют в системе бронирования',
    checkParams: 'Проверьте параметры',
    roundTripTitle: 'Туда-обратно — следующий этап',
    roundTripBody: 'Пока демонстрация показывает только перелёты в одну сторону. Мы не создаём вымышленные обратные билеты.',
    roundTripNotice: 'Демо поиска туда-обратно пока недоступно.',
    noDemoTitle: 'Пока нет демонстрационных маршрутов',
    noDemoBody: 'В первой версии мы подготовили пример для GZP → MOW и AYT → MOW. Вы можете выбрать любые аэропорты, но реальные результаты появятся только после подключения авиационных API.',
    noDemoNotice: 'Нет демонстрационных маршрутов для выбранного направления.',
    found: n => 'Найдено ' + n + ' демонстрационных варианта. Цены не являются реальными.',
    unsaved: 'Маршрут убран из сохранённых.',
    saveNotice: 'Демо-маршрут сохранён в этом браузере.',
    storageDenied: 'Браузер запретил сохранение. Изменение действует только до перезагрузки.',
    langChanged: 'Язык интерфейса изменён на русский.'
  },
  en: {
    swapped: 'Departure and arrival airports swapped.',
    summaryAdults: n => n + (n===1?' adult':' adults'),
    summaryChildren: n => n + (n===1?' child':' children'),
    summaryInfants: n => n + (n===1?' infant':' infants'),
    countPassengers: n => n + (n===1?' traveller':' travellers'),
    missingDate: 'date not selected',
    invalidAirports: 'Enter three-letter airport codes, such as GZP and MOW.',
    sameAirport: 'Departure and arrival airports must be different.',
    invalidDeparture: 'Choose a departure date that is not in the past.',
    invalidReturn: 'Choose a return date on or after departure.',
    savedEmpty: 'Routes you save will appear here.',
    savedDescription: date => date + ' · Saved demo itinerary · no live price tracking',
    remove: 'Remove',
    removeAria: route => 'Remove ' + route + ' from saved routes',
    removed: 'Route removed from your saved options.',
    protected: 'No self-transfer',
    selfTransfer: 'Separate tickets',
    mockFare: 'SAMPLE FARE',
    nonstop: 'Nonstop',
    oneStop: '1 stop',
    bagCount: n => 'Checked bags: ' + n,
    why: 'Why this option:',
    partyTotal: 'Illustrative total for everyone',
    saved: '♥ Saved',
    save: '♡ Save',
    mockCardCaption: 'Demo only · not a real fare or bookable flight',
    checkParams: 'Check your search',
    roundTripTitle: 'Round trips are coming later',
    roundTripBody: 'This demo only includes one-way sample flights. We do not invent return itineraries.',
    roundTripNotice: 'Round-trip demo search is not available yet.',
    noDemoTitle: 'No demo routes for this search',
    noDemoBody: 'This version includes fictional routes for GZP → MOW and AYT → MOW. You can enter other airports, but real results require authorized airline APIs.',
    noDemoNotice: 'No sample routes for this search.',
    found: n => n + ' fictional flight options found. No live prices are shown.',
    unsaved: 'Route removed from saved options.',
    saveNotice: 'Demo route saved in this browser.',
    storageDenied: 'Browser storage is unavailable. Your selection will be lost after reloading.',
    langChanged: 'Interface language changed to English.'
  },
  tr: messagesTr
});
const airportNamesEn = Object.freeze({
  GZP:'Gazipaşa', AYT:'Antalya', MOW:'Moscow', VKO:'Vnukovo',
  SVO:'Sheremetyevo', DME:'Domodedovo', IST:'Istanbul'
});
const offerCopyEn = Object.freeze({
  balanced: {tag:'Best overall', note:'A good balance of flight time, cost and a clear single-ticket connection.'},
  cheapest: {tag:'Lowest price', note:'Separate tickets lower the fare. A delay could cause you to miss the next flight.'},
  fastest: {tag:'Fastest', note:'Shortest journey time, with no connecting flight required.'},
  'ayt-balanced': {tag:'Best overall', note:'Illustrative nonstop route from Antalya.'},
  'ayt-cheapest': {tag:'Lowest price', note:'A lower total but greater connection risk.'},
  'ayt-fastest': {tag:'Fastest', note:'A quick nonstop flight in this fictional demo.'}
});

let currentLanguage = 'ru';
export const language = () => currentLanguage;
export function useLanguage(lang) {
  currentLanguage = normalizeLanguage(lang);
  return currentLanguage;
}
export function translate(key, ...args) {
  const value = messages[currentLanguage][key];
  if (value === undefined) throw new Error('Missing localized message: ' + key);
  return typeof value === 'function' ? value(...args) : value;
}
export function airportLabel(code) {
  if (currentLanguage === 'tr') return airportNamesTr[code] || code;
  return currentLanguage === 'en' ? airportNamesEn[code] || code : AIRPORT_NAMES[code] || code;
}
export function offerCopy(offer) {
  if (currentLanguage === 'tr') return offerCopyTr[offer.id] || {tag:offer.tag,note:offer.note};
  return currentLanguage === 'en' ? offerCopyEn[offer.id] || {tag:offer.tag,note:offer.note}
    : {tag:offer.tag,note:offer.note};
}
export function staticTranslation(source, lang) {
  const target = normalizeLanguage(lang);
  if (target === 'tr') return staticTr[source] || source;
  return target === 'en' ? staticEn[source] || source : source;
}
export function initialLanguage(saved, navigatorLanguage) {
  if (LANGUAGES.includes(saved)) return saved;
  const browserLanguage = String(navigatorLanguage || '');
  if (/^tr(?:[-_]|$)/i.test(browserLanguage)) return 'tr';
  return /^en(?:[-_]|$)/i.test(browserLanguage) ? 'en' : 'ru';
}
export function localizeStaticDocument(doc) {
  // Capture original static nodes once, before results rendering replaces placeholders.
  const root = doc.documentElement;
  const entries = [];
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  let node;
  while ((node = walker.nextNode())) {
    const original = node.nodeValue;
    const trimmed = original.trim();
    if (staticEn[trimmed] || staticTr[trimmed]) entries.push({node,original,trimmed});
  }
  const attrs = [];
  for (const element of root.querySelectorAll('[aria-label],[title],meta[name=description]')) {
    for (const attr of ['aria-label','title','content']) {
      const original = element.getAttribute(attr);
      if (original && (staticEn[original] || staticTr[original])) attrs.push({element,attr,original});
    }
  }
  return lang => {
    const target = normalizeLanguage(lang);
    doc.documentElement.lang = target;
    for (const entry of entries) {
      const replacement = staticTranslation(entry.trimmed,target);
      entry.node.nodeValue = entry.original.replace(entry.trimmed,replacement);
    }
    for (const entry of attrs) entry.element.setAttribute(entry.attr,staticTranslation(entry.original,target));
    return target;
  };
}
