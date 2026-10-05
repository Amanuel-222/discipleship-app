import React,{useEffect,useState} from 'react';
import {supabase} from './supabase.js';

export default function ClassroomSyncStatus({ministryId,demo,refreshKey}){
 const [status,setStatus]=useState({loading:true});
 useEffect(()=>{
  let active=true;
  setStatus({loading:true});
  if(demo){setStatus({demo:true});return;}
  supabase.from('classroom_links').select('last_synced_at').eq('ministry_id',ministryId).maybeSingle()
   .then(({data,error})=>{if(active)setStatus(error?{error:true}:{date:data?.last_synced_at});})
   .catch(()=>{if(active)setStatus({error:true});});
  return()=>{active=false;};
 },[ministryId,demo,refreshKey]);
 return <p className="classroom-sync-status" role="status">{status.loading?'Checking Classroom sync…':status.demo?'Classroom sync is available in the live app.':status.error?'Classroom sync time unavailable.':status.date?<>Classroom last synced <time dateTime={status.date}>{new Date(status.date).toLocaleString()}</time>.</>:'Classroom has not been synced for this class yet.'}</p>;
}
