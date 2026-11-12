// Customer-facing conversion actions remain explicitly in demo mode.
import {MOCK_ROUTES,normalizeAirport} from './core.mjs';

const words=Object.freeze({
  ru:{
    choose:'Выбрать пример',chosen:'Выбрано',panelTitle:'Ваш пример путешествия',
    selected:'Вы выбрали этот демонстрационный вариант',total:'Условная сумма для всей группы',
    caveat:'Это не бронирование. Цены и рейсы вымышлены; перейти к покупке пока нельзя.',
    map:'Рассмотреть маршрут',share:'Поделиться примером',shared:'Ссылка на демо скопирована',
    shareFailed:'Не удалось скопировать автоматически. Скопируйте ссылку ниже.',
    shareIntro:'Пример маршрута в Liminal Flights (не настоящий билет)',
    debugTitle:'Локальные события воронки',debugHint:'Только эта вкладка браузера. Сайт пока не собирает общую аналитику и не получает данные о заказах.',
    debugExport:'Скачать события JSON',debugSearch:'Поисков',debugImpressions:'Показов карточек',
    debugSelected:'Выборов',debugPartner:'Реальных переходов к партнёру',debugOrders:'Подтверждённых заказов',
    debugUnavailable:'Не подключены'
  },
  en:{
    choose:'Choose sample',chosen:'Selected',panelTitle:'Your sample journey',
    selected:'You selected this fictional flight option',total:'Illustrative total for your group',
    caveat:'This is not a booking. Flights and prices are fictional; checkout is not available.',
    map:'Explore the route',share:'Share this demo',shared:'Demo link copied',
    shareFailed:'Automatic copy failed. Copy the link shown below.',
    shareIntro:'Liminal Flights route preview (not a real ticket)',
    debugTitle:'Local funnel events',debugHint:'Only this browser tab. Site-wide analytics and partner order data are not connected.',
    debugExport:'Download JSON events',debugSearch:'Searches',debugImpressions:'Card impressions',
    debugSelected:'Selections',debugPartner:'Verified partner outbound clicks',debugOrders:'Confirmed orders',
    debugUnavailable:'Not connected'
  },
  tr:{
    choose:'Örneği seç',chosen:'Seçildi',panelTitle:'Örnek yolculuğunuz',
    selected:'Bu kurgusal uçuş seçeneğini seçtiniz',total:'Grubunuzun örnek toplam ücreti',
    caveat:'Bu bir rezervasyon değildir. Uçuşlar ve fiyatlar kurgusaldır; bilet satın alınamaz.',
    map:'Rotayı incele',share:'Demo örneğini paylaş',shared:'Demo bağlantısı kopyalandı',
    shareFailed:'Bağlantı otomatik kopyalanamadı. Aşağıdaki bağlantıyı kopyalayın.',
    shareIntro:'Liminal Flights rota önizlemesi (gerçek bilet değildir)',
    debugTitle:'Yerel dönüşüm olayları',debugHint:'Yalnızca bu tarayıcı sekmesi. Site genelinde analitik veya iş ortağı sipariş verisi bağlı değil.',
    debugExport:'JSON olaylarını indir',debugSearch:'Aramalar',debugImpressions:'Kart gösterimleri',
    debugSelected:'Seçimler',debugPartner:'Doğrulanmış iş ortağı tıklamaları',debugOrders:'Onaylı siparişler',
    debugUnavailable:'Bağlı değil'
  }
});
export const conversionText=(lang,key)=>(words[lang]||words.ru)[key]||key;
const airports=/^[A-Z]{3}$/;
const dates=/^\d{4}-\d{2}-\d{2}$/;
const approvedOffer=id=>MOCK_ROUTES.find(x=>x.id===id);
export function buildDemoShareUrl(base,offer,query){
  if(!approvedOffer(offer?.id)||!airports.test(query?.origin)||!airports.test(query?.destination))
    throw Error('Invalid fictional offer to share');
  const url=new URL(base);
  // Remove UTM and untrusted query parameters from a publicly shared link.
  url.search='';
  url.searchParams.set('demo_offer',offer.id);
  url.searchParams.set('demo_from',query.origin);
  url.searchParams.set('demo_to',query.destination);
  if(dates.test(query.date))url.searchParams.set('demo_date',query.date);
  const counts=query.party||{};
  for(const key of ['adults','children','infants']){
    const count=Number(counts[key]);
    if(Number.isInteger(count)&&count>=0&&count<=9)url.searchParams.set(key,count);
  }
  if([0,1,2,3].includes(Number(query.bags)))url.searchParams.set('bags',query.bags);
  url.hash='results';
  return url.toString();
}
export function parseDemoShare(search){
  const q=new URLSearchParams(String(search||'').replace(/^\?/,''));
  const id=q.get('demo_offer'),origin=normalizeAirport(q.get('demo_from')),
    destination=normalizeAirport(q.get('demo_to'));
  const offer=approvedOffer(id);
  if(!offer||!airports.test(origin)||!airports.test(destination)||
    origin!==offer.from||![offer.to,offer.airport].includes(destination))return null;
  const value={id,origin,destination};
  const date=q.get('demo_date');
  if(date&&dates.test(date))value.date=date;
  const p={};
  for(const key of ['adults','children','infants']){
    const raw=q.get(key);
    if(raw===null)continue;
    if(!/^\d$/.test(raw))return null;
    p[key]=Number(raw);
  }
  if(Object.keys(p).length===3&&p.adults>=1&&p.adults+p.children+p.infants<=9&&p.infants<=p.adults)
    value.party=p;
  const bags=q.get('bags');
  if(bags!==null&&/^[0-3]$/.test(bags))value.bags=Number(bags);
  return value;
}
