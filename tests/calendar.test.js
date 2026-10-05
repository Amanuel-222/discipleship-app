import test from 'node:test';
import assert from 'node:assert/strict';
import {monthCells,shiftMonth,eventTime,sortEvents} from '../frontend/src/calendar.js';
test('Month grids keep date-only days through leap years and DST changes',()=>{
 for(const month of ['2024-02-01','2026-03-01','2026-11-01']){
  const cells=monthCells(month);assert.equal(cells.length,42);assert.equal(new Date(cells[0]+'T12:00:00Z').getUTCDay(),0);
  assert.equal(new Set(cells).size,42);assert.ok(cells.includes(month));
 }
 assert.ok(monthCells('2024-02-01').includes('2024-02-29'));assert.equal(shiftMonth('2026-12-01',1),'2027-01-01');
});
test('Calendar sorts all-day and timed events and formats noon and midnight',()=>{
 assert.equal(eventTime({}),'All day');assert.equal(eventTime({start_time:'12:00:00',end_time:'13:30:00'}),'12:00 PM – 1:30 PM');assert.equal(eventTime({start_time:'00:00'}),'12:00 AM');
 const events=[{title:'Evening',date:'2026-10-02',start_time:'18:00'},{title:'Next day',date:'2026-10-03'},{title:'All day',date:'2026-10-02'}];
 assert.deepEqual(sortEvents(events).map(e=>e.title),['All day','Evening','Next day']);assert.equal(events[0].title,'Evening');
});
