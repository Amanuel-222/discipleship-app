// Public OAuth client ID only. Google tokens remain in component memory.
export const classroomClientId=import.meta.env?.VITE_GOOGLE_CLASSROOM_CLIENT_ID||'194391894031-jfnsqjppgk3qher312o8n8lol67e6722.apps.googleusercontent.com';
export const classroomScopes=['courses.readonly','rosters.readonly','profile.emails','coursework.students.readonly','topics.readonly'].map(scope=>'https://www.googleapis.com/auth/classroom.'+scope);
let sdkPromise;
export function loadGoogle(){
 if(window.google?.accounts?.oauth2)return Promise.resolve(window.google.accounts.oauth2);
 if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;
  const timer=setTimeout(()=>{script.remove();sdkPromise=null;reject(new Error('Google did not load. Check your connection and try again.'));},15000);
  script.onload=()=>{clearTimeout(timer);resolve(window.google.accounts.oauth2);};
  script.onerror=()=>{clearTimeout(timer);sdkPromise=null;script.remove();reject(new Error('Could not load Google. Check your connection and try again.'));};
  document.head.appendChild(script);
 });
 return sdkPromise;
}
export async function listClassroom(token,path,key,params={}){
 const rows=[];let pageToken;
 do{
  const url=new URL('https://classroom.googleapis.com/v1/'+path);
  for(const [key,value] of Object.entries({...params,pageSize:100,...(pageToken?{pageToken}:{})}))url.searchParams.set(key,value);
  const response=await fetch(url,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  if(!response.ok){
   if(response.status===401)throw new Error('Google access expired. Connect Google Classroom again.');
   if(response.status===403){
    const detail=await response.json().catch(()=>({}));
    const resource=path.includes('/studentSubmissions')?'student submissions':path.includes('/courseWork')?'assignments':path.includes('/students')?'student roster':path.includes('/topics')?'topics':'course list';
    throw new Error(`Google denied access to the ${resource}. ${detail.error?.message||'Use a teacher account and approve the requested Classroom permissions.'} No changes were saved.`);
   }
   throw new Error('Classroom could not load. No changes were saved. Try again.');
  }
  const data=await response.json();rows.push(...(data[key]||[]));pageToken=data.nextPageToken;
 }while(pageToken);
 return rows;
}
export function wasSubmitted(submission){
 if(submission.state==='TURNED_IN')return true;
 // Teachers can return unsubmitted work. Require a prior turn-in event.
 const previous=(submission.submissionHistory||[]).map(event=>event.stateHistory).filter(event=>event&&event.state!=='RETURNED').sort((a,b)=>(b.stateTimestamp||'').localeCompare(a.stateTimestamp||''))[0];
 return submission.state==='RETURNED'&&previous?.state==='TURNED_IN';
}
export async function fetchClassroomSnapshot(token,course){
 const path='courses/'+encodeURIComponent(course.id);
 const [students,topics,works]=await Promise.all([
  listClassroom(token,path+'/students','students'),listClassroom(token,path+'/topics','topic'),
  listClassroom(token,path+'/courseWork','courseWork',{'courseWorkStates':'PUBLISHED'})
 ]);
 const assignments=[];
 // Limit concurrency and finish all Google reads before saving anything.
 for(let i=0;i<works.length;i+=3){
  const batch=await Promise.all(works.slice(i,i+3).map(async work=>{
   const submissions=await listClassroom(token,path+'/courseWork/'+encodeURIComponent(work.id)+'/studentSubmissions','studentSubmissions');
   const due=work.dueDate;
   return {id:work.id,title:work.title,description:work.description||'',topic:topics.find(t=>t.topicId===work.topicId)?.name||'General',url:work.alternateLink,
    dueDate:due?`${due.year}-${String(due.month).padStart(2,'0')}-${String(due.day).padStart(2,'0')}`:'',
    submissions:submissions.map(s=>({userId:s.userId,submitted:wasSubmitted(s)}))};
  }));assignments.push(...batch);
 }
 return {courseId:course.id,courseName:course.name,students:students.map(s=>({id:s.userId,name:s.profile?.name?.fullName||'Classroom student',email:s.profile?.emailAddress||''})),assignments};
}
