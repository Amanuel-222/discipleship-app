import {sampleData} from './sample.js';
import {supabase,configured} from './supabase.js';
export const demoDefault=import.meta.env.VITE_DEMO==='true';
export function isDemo(){return demoDefault&&!configured;}
const demoKey=ministry=>!ministry||ministry==='demo-discipleship'?'tvm-demo-v1':'tvm-demo-v1-'+ministry;
export function readDemo(ministry){const key=demoKey(ministry);try{const x=JSON.parse(localStorage.getItem(key));if(x?.students&&x?.attendance&&x?.assignments&&x?.notes)return {...x,meetings:x.meetings||[]};}catch{}const x=!ministry||ministry==='demo-discipleship'?sampleData():{students:[],attendance:[],assignments:[],notes:[],meetings:[]};localStorage.setItem(key,JSON.stringify(x));return x;}
const configs={
 students:{table:'students',select:'id,name,email,notes,created_at'},
 attendance:{table:'sessions',select:'id,date,created_at,records:attendance_records(student:student_id,status)'},
 assignments:{table:'assignments',select:'id,title,description,topic,due_date,created_at,classroom_work_id,classroom_url,records:assignment_submissions(student:student_id,submitted,late)'},
 notes:{table:'progress_notes',select:'id,student:student_id,text,created_at'},
 meetings:{table:'team_meetings',select:'id,title,date,notes,created_at'}
};
function normalize(row){const {id,created_at,due_date,...rest}=row;return {...rest,_id:id,createdAt:created_at,...(due_date!==undefined?{dueDate:due_date||''}:{})};}
function checked(result,resource){if(result.error){const err=result.error;if(err.code==='23505'&&resource==='attendance')throw new Error('A session already exists on that date.');if(err.code==='42501')throw new Error('Your account does not have permission to change this class.');if(err.code==='PGRST116')throw new Error('This record no longer exists or you do not have access.');throw new Error(err.message||'Could not save. Please try again.');}return result.data;}
export async function request(resource,method='GET',body,ministry){
 if(isDemo())return demoRequest(resource,method,body,ministry);
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 if(!ministry)throw new Error('Choose a class first.');
 const [collection,rowId]=resource.slice(1).split('/');const c=configs[collection];if(!c)throw new Error('Unknown resource.');
 if(method==='GET'){const rows=checked(await supabase.from(c.table).select(c.select).eq('ministry_id',ministry),collection);return rows.map(normalize);}
 if(method==='POST'){
  let values;if(collection==='students')values={name:body.name.trim(),email:body.email?.trim()||'',notes:body.notes||''};
  if(collection==='attendance')values={date:body.date};
  if(collection==='assignments')values={title:body.title.trim(),description:body.description||'',due_date:body.dueDate||null,topic:body.topic?.trim()||'General'};
  if(collection==='meetings')values={title:body.title.trim(),date:body.date,notes:body.notes.trim()};
  if(collection==='notes')values={student_id:body.student,text:body.text.trim()};
  return normalize(checked(await supabase.from(c.table).insert({...values,ministry_id:ministry}).select(c.select).single(),collection));
 }
 if(method==='PATCH'){
  if(collection==='attendance'){checked(await supabase.from('attendance_records').update({status:body.status}).eq('ministry_id',ministry).eq('session_id',rowId).eq('student_id',body.student).select('session_id').single(),collection);return null;}
  if(collection==='assignments'&&body.student){checked(await supabase.from('assignment_submissions').update({submitted:body.submitted,late:!!body.submitted&&!!body.late}).eq('ministry_id',ministry).eq('assignment_id',rowId).eq('student_id',body.student).select('assignment_id').single(),collection);return null;}
  if(collection==='assignments')return normalize(checked(await supabase.from(c.table).update({title:body.title.trim(),description:body.description||'',due_date:body.dueDate||null,topic:body.topic?.trim()||'General'}).eq('ministry_id',ministry).eq('id',rowId).select(c.select).single(),collection));
  if(collection==='meetings')return normalize(checked(await supabase.from(c.table).update({title:body.title.trim(),date:body.date,notes:body.notes.trim()}).eq('ministry_id',ministry).eq('id',rowId).select(c.select).single(),collection));
  return normalize(checked(await supabase.from(c.table).update({name:body.name.trim(),email:body.email?.trim()||'',notes:body.notes||''}).eq('ministry_id',ministry).eq('id',rowId).select(c.select).single(),collection));
 }
 if(method==='DELETE'){checked(await supabase.from(c.table).delete().eq('ministry_id',ministry).eq('id',rowId).select('id').single(),collection);return null;}
 throw new Error('Unsupported operation.');
}
function demoRequest(resource,method,body,ministry){const key=demoKey(ministry);const [collection,rowId]=resource.slice(1).split('/');const db=readDemo(ministry);if(!db[collection])throw new Error('Unknown collection.');if(method==='GET')return db[collection];
if(method==='POST'){const row={...body,_id:crypto.randomUUID(),createdAt:new Date().toISOString()};if(collection==='attendance'){if(db.attendance.some(s=>s.date===body.date))throw new Error('A session already exists on that date.');row.records=db.students.map(s=>({student:s._id,status:null}));}if(collection==='assignments')row.records=db.students.map(s=>({student:s._id,submitted:false}));db[collection].unshift(row);localStorage.setItem(key,JSON.stringify(db));return row;}
const row=db[collection].find(s=>s._id===rowId);if(!row)throw new Error('Record not found.');
if(method==='PATCH'){if(['attendance','assignments'].includes(collection)&&body.student){const record=row.records.find(r=>r.student===body.student);if(!record)throw new Error('Student is not on this roster.');if(collection==='attendance')record.status=body.status;else {record.submitted=body.submitted;record.late=!!body.submitted&&!!body.late;}}else Object.assign(row,body);}
if(method==='DELETE'){db[collection]=db[collection].filter(r=>r._id!==rowId);if(collection==='students'){for(const c of ['attendance','assignments'])for(const item of db[c])item.records=item.records.filter(r=>r.student!==rowId);db.notes=db.notes.filter(n=>n.student!==rowId);}}
localStorage.setItem(key,JSON.stringify(db));return row;}
export function resetDemo(ministry){localStorage.removeItem(demoKey(ministry));readDemo(ministry);}

// A guarded RPC returns approved teammates, without exposing auth.users to clients.
export async function readTeamDirectory(ministry){
 if(isDemo())return [
  {user_id:'demo-leader',email:'leader@example.com',approved_at:'2026-09-01T12:00:00Z'},
  {user_id:'demo-helper',email:'helper@example.com',approved_at:'2026-09-08T12:00:00Z'}
 ];
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const {data,error}=await supabase.rpc('class_team_directory',{ministry});
 if(error)throw new Error(error.code==='42501'?'Only approved TVM teammates can view this directory.':'Could not load team members. Try Refresh.');
 return data||[];
}

export async function readMinistries(){
 if(isDemo())return [{id:'demo-discipleship',name:'Discipleship',slug:'discipleship',role:'admin'},{id:'demo-foundations',name:'Foundations',slug:'foundations',role:'admin'},{id:'demo-empowerment',name:'Ministry Empowerment',slug:'ministry-empowerment',role:'admin'}];
 const {data,error}=await supabase.rpc('my_ministries');
 if(error)throw new Error('Could not load your classes. Please try again.');
 return data||[];
}
export async function manageClassMember(ministry,email,role,remove=false){
 if(isDemo())throw new Error('Team access is managed in the live app.');
 const {error}=await supabase.rpc('manage_class_member',{ministry,member_email:email.trim(),member_role:role,remove_member:remove});
 if(error)throw new Error(error.message);
}
