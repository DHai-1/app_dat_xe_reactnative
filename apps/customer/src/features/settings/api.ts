import { translate as i18nT } from '@datxe/shared';
import { request } from '@/lib/api';
type Suggestion={id:string;name:string;address:string;provider?:string;coordinate?:{lat:number;lng:number}|null};
export const searchSavedPlaces=async(text:string,signal?:AbortSignal)=>(await request<{places:Suggestion[]}>('/location/places/search?'+new URLSearchParams({query:text}),{signal}))!.places;
export async function geocodeCustomerAddress(address:string){const places=await searchSavedPlaces(address);const place=places[0];if(!place)return null;if(place.coordinate)return place.coordinate;return (await request<Suggestion>('/location/places/detail?'+new URLSearchParams({id:place.id})))?.coordinate??null;}
export async function resolveSavedPlace(place:Suggestion){const coordinate=place.coordinate??(await request<Suggestion>('/location/places/detail?'+new URLSearchParams({id:place.id})))?.coordinate;if(!coordinate)throw new Error(i18nT("Chưa xác định được tọa độ."));return {...coordinate,address:place.address,name:place.name};}
