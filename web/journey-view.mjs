/**
 * Personalized map view model for a single selected (fictional) itinerary.
 * Never promote a search date to a confirmed flight occurrence.
 */
import {flightPlan,planBounds,approximateDistanceKm,pathDistanceKm} from './flight-map.mjs';

export function legSelection(plan,index=-1) {
  if(!plan||!Array.isArray(plan.legs)||!plan.legs.length)throw Error('Invalid journey');
  if(index!==-1&&(!Number.isInteger(index)||index<0||index>=plan.legs.length))throw Error('Invalid leg');
  const legs=index===-1?plan.legs:[plan.legs[index]];
  const codes=index===-1?plan.airports.map(p=>p.code):[plan.airports[index].code,plan.airports[index+1].code];
  const nodes=index===-1?plan.airports:[plan.airports[index],plan.airports[index+1]];
  return Object.freeze({
    index,legs,codes,nodes,bounds:planBounds({...plan,legs}),
    distanceKm:Math.round(legs.reduce((sum,leg)=>sum+pathDistanceKm(leg),0))
  });
}

export function selectedJourney(offer,query=null){
  const plan=flightPlan(offer);
  if(!plan)return null;
  const searchDate=typeof query?.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(query.date)?query.date:null;
  const adults=Number(query?.party?.adults),children=Number(query?.party?.children),infants=Number(query?.party?.infants);
  const passengers=Number.isInteger(adults)&&adults>=1&&Number.isInteger(children)&&children>=0
    &&Number.isInteger(infants)&&infants>=0&&adults+children+infants<=9
    &&infants<=adults?adults+children+infants:null;
  return Object.freeze({
    offerId:offer.id,
    plan,
    searchDate,
    passengers,
    approximateDistanceKm:approximateDistanceKm(plan),
    evidence:Object.freeze({
      kind:'synthetic',
      live:false,
      scheduleConfirmed:false,
      flightOccurrenceId:null,
      delayMinutes:null,
      delayStatus:null,
      currentAircraftPosition:null,
      positionObservedAt:null,
      statusObservedAt:null,
      // Null intentionally means never supplied; not "just checked".
      lastUpdatedAt:null,
      warnings:[] // No sourced warnings; do not invent safe/on-time status.
    })
  });
}
