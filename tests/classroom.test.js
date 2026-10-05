import test from 'node:test';
import assert from 'node:assert/strict';
import {wasSubmitted,listClassroom} from '../frontend/src/classroom.js';
import {assignmentStatus} from '../frontend/src/metrics.js';
test('Assignments have two statuses regardless of Classroom lateness',()=>{
 assert.equal(assignmentStatus({submitted:true,late:true}),'Submitted');
 assert.equal(assignmentStatus({submitted:true,late:false}),'Submitted');
 assert.equal(assignmentStatus({submitted:false,late:true}),'Not submitted');
});

test('Classroom submission states include returned work only after its latest turn-in',()=>{
 assert.equal(wasSubmitted({state:'TURNED_IN'}),true);
 for(const state of ['NEW','CREATED','RECLAIMED_BY_STUDENT','RETURNED'])assert.equal(wasSubmitted({state}),false);
 const event=(state,date)=>({stateHistory:{state,stateTimestamp:date}});
 assert.equal(wasSubmitted({state:'RETURNED',submissionHistory:[event('RETURNED','2026-10-03'),event('TURNED_IN','2026-10-02')]}),true);
 assert.equal(wasSubmitted({state:'RETURNED',submissionHistory:[event('TURNED_IN','2026-10-01'),event('RECLAIMED_BY_STUDENT','2026-10-02'),event('RETURNED','2026-10-03')]}),false);
});

test('Classroom reads every page and rejects denied access',async()=>{
 const original=globalThis.fetch;const urls=[];
 try{
  globalThis.fetch=async url=>{urls.push(url);return {ok:true,json:async()=>urls.length===1?{students:[{userId:'1'}],nextPageToken:'next'}:{students:[{userId:'2'}]}};};
  assert.deepEqual(await listClassroom('test','courses/123/students','students'),[{userId:'1'},{userId:'2'}]);
  assert.equal(urls[1].searchParams.get('pageToken'),'next');
  globalThis.fetch=async()=>({ok:false,status:403,json:async()=>({error:{message:'Request had insufficient authentication scopes.'}})});
  await assert.rejects(listClassroom('test','courses/123/courseWork/456/studentSubmissions','studentSubmissions'),/Google denied access to the student submissions\. Request had insufficient authentication scopes\. No changes were saved\./);
 }finally{globalThis.fetch=original;}
});
