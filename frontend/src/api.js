import {sampleData} from './sample.js';
import {supabase,configured} from './supabase.js';
export const demoDefault=import.meta.env.VITE_DEMO==='true';
export function isDemo(){return demoDefault&&!configured;}
const key='tvm-demo-v1';
export function readDemo(){try{const x=JSON.parse(localStorage.getItem(key));if(x?.students&&x?.attendance&&x?.assignments&&x?.notes)return x;}catch{}const x=sampleData();localStorage.setItem(key,JSON.stringify(x));return x;}
const configs={
 students:{table:'students',select:'id,name,email,notes,created_at'},
 attendance:{table:'sessions',select:'id,date,created_at,records:attendance_records(student:student_id,status)'},
 assignments:{table:'assignments',select:'id,title,description,due_date,created_at,records:assignment_submissions(student:student_id,submitted)'},
 notes:{table:'progress_notes',select:'id,student:student_id,text,created_at'}
};
function normalize(row){const {id,created_at,due_date,...rest}=row;return {...rest,_id:id,createdAt:created_at,...(due_date!==undefined?{dueDate:due_date||''}:{})};}
function checked(result,resource){if(result.error){const err=result.error;if(err.code==='23505'&&resource==='attendance')throw new Error('A session already exists on that date.');if(err.code==='42501')throw new Error('Your account does not have permission to change this class.');if(err.code==='PGRST116')throw new Error('This record no longer exists or you do not have access.');throw new Error(err.message||'Could not save. Please try again.');}return result.data;}
export async function request(resource,method='GET',body){
 if(isDemo())return demoRequest(resource,method,body);
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const [collection,rowId]=resource.slice(1).split('/');const c=configs[collection];if(!c)throw new Error('Unknown resource.');
 if(method==='GET'){const rows=checked(await supabase.from(c.table).select(c.select),collection);return rows.map(normalize);}
 if(method==='POST'){
  let values;if(collection==='students')values={name:body.name.trim(),email:body.email?.trim()||'',notes:body.notes||''};
  if(collection==='attendance')values={date:body.date};
  if(collection==='assignments')values={title:body.title.trim(),description:body.description||'',due_date:body.dueDate||null};
  if(collection==='notes')values={student_id:body.student,text:body.text.trim()};
  return normalize(checked(await supabase.from(c.table).insert(values).select(c.select).single(),collection));
 }
 if(method==='PATCH'){
  if(collection==='attendance'){checked(await supabase.from('attendance_records').update({status:body.status}).eq('session_id',rowId).eq('student_id',body.student).select('session_id').single(),collection);return null;}
  if(collection==='assignments'){checked(await supabase.from('assignment_submissions').update({submitted:body.submitted}).eq('assignment_id',rowId).eq('student_id',body.student).select('assignment_id').single(),collection);return null;}
  return normalize(checked(await supabase.from(c.table).update({name:body.name.trim(),email:body.email?.trim()||'',notes:body.notes||''}).eq('id',rowId).select(c.select).single(),collection));
 }
 if(method==='DELETE'){checked(await supabase.from(c.table).delete().eq('id',rowId).select('id').single(),collection);return null;}
 throw new Error('Unsupported operation.');
}
function demoRequest(resource,method,body){const [collection,rowId]=resource.slice(1).split('/');const db=readDemo();if(!db[collection])throw new Error('Unknown collection.');if(method==='GET')return db[collection];
if(method==='POST'){const row={...body,_id:crypto.randomUUID(),createdAt:new Date().toISOString()};if(collection==='attendance'){if(db.attendance.some(s=>s.date===body.date))throw new Error('A session already exists on that date.');row.records=db.students.map(s=>({student:s._id,status:null}));}if(collection==='assignments')row.records=db.students.map(s=>({student:s._id,submitted:false}));db[collection].unshift(row);localStorage.setItem(key,JSON.stringify(db));return row;}
const row=db[collection].find(s=>s._id===rowId);if(!row)throw new Error('Record not found.');
if(method==='PATCH'){if(['attendance','assignments'].includes(collection)){const record=row.records.find(r=>r.student===body.student);if(!record)throw new Error('Student is not on this roster.');if(collection==='attendance')record.status=body.status;else record.submitted=body.submitted;}else Object.assign(row,body);}
if(method==='DELETE'){db[collection]=db[collection].filter(r=>r._id!==rowId);if(collection==='students'){for(const c of ['attendance','assignments'])for(const item of db[c])item.records=item.records.filter(r=>r.student!==rowId);db.notes=db.notes.filter(n=>n.student!==rowId);}}
localStorage.setItem(key,JSON.stringify(db));return row;}
export function resetDemo(){localStorage.setItem(key,JSON.stringify(sampleData()));}
