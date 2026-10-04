import React,{useEffect,useRef,useState} from 'react';
import {supabase} from './supabase.js';
import {classroomClientId,classroomScopes,loadGoogle,listClassroom,fetchClassroomSnapshot} from './classroom.js';
export default function ClassroomSync({ministry,demo,onSynced,onBusy}){
 const [link,setLink]=useState(null),[courses,setCourses]=useState([]),[courseId,setCourseId]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const token=useRef(null),client=useRef(null),alive=useRef(true);
 const canSync=['admin','leader'].includes(ministry.role);
 function working(value){if(alive.current){setBusy(value);onBusy?.(value);}}
 useEffect(()=>{
  alive.current=true;
  if(!demo)supabase.from('classroom_links').select('course_id,course_name,last_synced_at').eq('ministry_id',ministry.id).maybeSingle().then(({data,error})=>{if(alive.current){if(error)setError('Could not load the Classroom link. Refresh this page.');else{setLink(data);setCourseId(data?.course_id||'');}}});
  if(canSync&&!demo)loadGoogle().then(google=>{
   if(!alive.current)return;
   client.current=google.initTokenClient({client_id:classroomClientId,scope:classroomScopes.join(' '),
    callback:async response=>{
     if(!alive.current)return;
     if(response.error||!response.access_token){setError('Google authorization was not completed. Try connecting again.');working(false);return;}
     // Google enforces permissions on each API request. Do not reject a
     // usable token solely because its returned scope names differ.
     token.current=response.access_token;
     try{const rows=await listClassroom(token.current,'courses','courses',{teacherId:'me',courseStates:'ACTIVE'});if(alive.current){setCourses(rows);setMessage(rows.length?'Choose the course for '+ministry.name+'.':'No active classes found. Use an account listed as a teacher in Classroom.');}}
     catch(e){if(alive.current)setError(e.message);}finally{working(false);}
    },error_callback:()=>{if(alive.current)setError('Google’s window closed or was blocked. Allow popups and try again.');working(false);}
   });setReady(true);
  }).catch(e=>alive.current&&setError(e.message));
  return()=>{alive.current=false;token.current=null;client.current=null;onBusy?.(false);};
 },[ministry.id,demo,canSync]);
 function connect(){setError('');setMessage('');working(true);client.current.requestAccessToken({prompt:'consent select_account'});}
 async function sync(){
  const course=courses.find(c=>c.id===courseId);if(!course||!token.current)return;
  if(!link&&!window.confirm(`Link ${ministry.name} to “${course.name}” and import its students and published assignments? Existing students with matching emails will be linked.`))return;
  working(true);setError('');setMessage('Reading Classroom…');
  try{
   const payload=await fetchClassroomSnapshot(token.current,course);
   if(!alive.current)return;
   const {data,error}=await supabase.rpc('sync_classroom',{ministry:ministry.id,payload});if(error)throw new Error(error.message);
   if(!alive.current)return;
   setLink({course_id:course.id,course_name:course.name,last_synced_at:new Date().toISOString()});
   setMessage(`Synced ${data.students} students and ${data.assignments} assignments.`);await onSynced();
  }catch(e){if(alive.current){setMessage('');setError(e.message);}}finally{working(false);}
 }
 return <section className="panel spaced"><div className="section-head"><h2>Google Classroom</h2>{link&&<span className="badge green">Linked</span>}</div><div className="settings-body">
  <p>{link?<>Linked to <strong>{link.course_name}</strong>.</>:'Import students, assignments, topics, and submission statuses from Classroom.'}</p>
  {link?.last_synced_at&&<p className="muted">Last synced {new Date(link.last_synced_at).toLocaleString()}.</p>}
  {demo?<p className="muted">Classroom sync is available in the live app.</p>:canSync?<>
   <p className="muted">Continue posting and submitting work in Classroom. Sync here whenever you want an updated overview.</p>
   <button className="secondary" disabled={!ready||busy} onClick={connect}>{busy?'Working…':courses.length?'Choose Google account':'Connect Google Classroom'}</button>
   {!!courses.length&&<div className="classroom-controls"><label className="field">Classroom course<select aria-label="Classroom course" value={courseId} disabled={busy||!!link} onChange={e=>setCourseId(e.target.value)}><option value="">Choose a course</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}{c.section?' · '+c.section:''}</option>)}</select></label><button className="primary" disabled={busy||!courses.some(c=>c.id===courseId)} onClick={sync}>Sync Classroom</button>{link&&!courses.some(c=>c.id===link.course_id)&&<p role="alert">This Google account does not teach the linked course. Choose its teacher account.</p>}</div>}
  </>:<p className="muted">Your class leader syncs Classroom. Imported results are shared with your team.</p>}
  {message&&<p role="status">{message}</p>}{error&&<p className="classroom-error" role="alert">{error}</p>}
 </div></section>;
}
