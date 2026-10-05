// Date-only values stay on their calendar day across browser time zones and DST.
export const calendarToday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const monthKey=date=>date.slice(0,7)+'-01';
const key=d=>d.toISOString().slice(0,10);
export function shiftMonth(month,offset){const d=new Date(month+'T12:00:00Z');return key(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+offset,1,12)));}
export function monthCells(month){const d=new Date(month+'T12:00:00Z');d.setUTCDate(1-d.getUTCDay());return Array.from({length:42},()=>{const value=key(d);d.setUTCDate(d.getUTCDate()+1);return value;});}
export function eventTime(event){if(!event.start_time)return 'All day';const format=value=>{const [h,m]=value.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;};return format(event.start_time)+(event.end_time?' – '+format(event.end_time):'');}
export const eventKind=event=>event.kind==='fellowship'?'Fellowship':'Team meeting';
export const sortEvents=events=>[...events].sort((a,b)=>a.date.localeCompare(b.date)||(a.start_time||'').localeCompare(b.start_time||'')||a.title.localeCompare(b.title));
