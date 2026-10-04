import test from 'node:test';import assert from 'node:assert/strict';import {studentMetrics} from '../frontend/src/metrics.js';
test('Late attendance counts as attended and late submitted work counts as completed',()=>{
 const data={attendance:['Present','Late','Absent',null].map(status=>({records:[{student:'s1',status}]})),assignments:[{records:[{student:'s1',submitted:true,late:true},{student:'s1',submitted:false,late:false}]}]};
 assert.equal(studentMetrics({_id:'s1'},data).attendance,67);
 assert.equal(studentMetrics({_id:'s1'},data).completion,50);
});
test('unmarked sessions and rosters predating enrollment are excluded from attendance',()=>{const data={attendance:[{records:[{student:'s1',status:'Present'}]},{records:[{student:'s1',status:'Absent'}]},{records:[{student:'s1',status:null}]},{records:[{student:'s2',status:'Absent'}]}],assignments:[{records:[{student:'s1',submitted:true}]},{records:[{student:'s1',submitted:false}]},{records:[{student:'s2',submitted:false}]}]};assert.deepEqual(studentMetrics({_id:'s1'},data),{attendance:50,completion:50,present:1,sessions:2,submitted:1,total:2});assert.equal(studentMetrics({_id:'s3'},data).attendance,null);});
