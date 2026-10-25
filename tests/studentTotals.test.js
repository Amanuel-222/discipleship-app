import test from 'node:test';
import assert from 'node:assert/strict';
import {studentTotals, filterStudentTotals} from '../frontend/src/studentTotals.js';

const students = [{_id:'a', name:'Abel', email:'abel@example.com'}, {_id:'b', name:'Belen'}, {_id:'c', name:'New student'}];
const attendance = [
  {records:[{student:'a',status:'Late'}, {student:'b',status:'Excused'}]},
  {records:[{student:'a',status:'Late'}, {student:'b',status:'Unexcused'}]},
  {records:[{student:'a',status:'Present'}, {student:'b',status:'Absent'}]},
  {records:[{student:'a',status:null}, {student:'removed',status:'Late'}]},
];
const assignments = [
  {records:[{student:'a',submitted:true,late:true}, {student:'b',submitted:false}]},
  {records:[{student:'a',submitted:false}]},
];
test('totals preserve excused/unexcused distinctions and count only existing roster records', () => {
  const [a,b,c] = studentTotals(students, attendance, assignments);
  assert.equal(a.late,2); assert.equal(a.attended,3); assert.equal(a.marked,3);
  assert.equal(b.excused,1); assert.equal(b.unexcused,1); assert.equal(b.unknown,1);
  assert.equal(a.submitted,1); assert.equal(a.missing,1); assert.equal(a.assigned,2);
  assert.equal(b.assigned,1); assert.equal(c.assigned,0); assert.equal(c.marked,0);
});
test('attendance ranks both directions, puts unrecorded students last, and does not mutate totals', () => {
  const rows = studentTotals(students, attendance, assignments);
  const ids = options => filterStudentTotals(rows,options).map(r=>r.student._id);
  assert.deepEqual(ids({sort:'late'}), ['a','b','c']);
  assert.deepEqual(ids({sort:'late',direction:'asc'}), ['b','a','c']);
  assert.deepEqual(ids({sort:'unexcused'}), ['b','a','c']);
  assert.deepEqual(ids({filter:'late'}), ['a']);
  assert.deepEqual(rows.map(r=>r.student._id), ['a','b','c']);
});
test('search, positive count filters, topic scope, and deterministic ties work together', () => {
  const rows = studentTotals(students,attendance,assignments);
  assert.deepEqual(filterStudentTotals(rows,{query:'ABEL@',filter:'missing',sort:'missing'}).map(r=>r.student._id), ['a']);
  assert.equal(filterStudentTotals(rows,{query:'nobody'}).length,0);
  assert.deepEqual(filterStudentTotals(rows,{sort:'missing'}).map(r=>r.student._id), ['a','b','c']);
  const scoped = studentTotals(students,[],[assignments[0]]);
  assert.deepEqual(filterStudentTotals(scoped,{sort:'missing'}).map(r=>r.student._id), ['b','a','c']);
  assert.equal(studentTotals(students,[],[])[0].missing,0);
});
