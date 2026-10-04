import React,{useEffect,useState} from 'react';
import {readTeamDirectory} from './api.js';

export default function TeamDirectory({email}){
 const [members,setMembers]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let active=true;
  async function load(){
   setLoading(true);setError('');
   try{const rows=await readTeamDirectory();if(active)setMembers(rows);}
   catch(e){if(active){setMembers([]);setError(e.message);}}
   finally{if(active)setLoading(false);}
  }
  load();
  addEventListener('focus',load);
  return()=>{active=false;removeEventListener('focus',load);};
 },[refresh]);
 return <section className="panel spaced" aria-labelledby="team-directory-title">
  <div className="section-head"><h2 id="team-directory-title">Team members <span className="count-pill">{members.length}</span></h2><button className="text-button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div>
  <div className="team-directory">
   <p className="muted">Everyone approved to access this shared TVM class.</p>
   {loading?<p role="status" className="team-directory-status">Loading team members…</p>:error?<p role="alert" className="form-error">{error}</p>:members.length?<ul>{members.map(member=><li key={member.user_id}>
    <span className="avatar small" aria-hidden="true">{(member.email||'?')[0].toUpperCase()}</span>
    <div className="team-member-detail"><strong>{member.email||'Email unavailable'}</strong><small>Access approved {new Date(member.approved_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</small></div>
    {member.email?.toLowerCase()===email?.toLowerCase()&&<span className="badge green">You</span>}
   </li>)}</ul>:<p className="team-directory-status">No approved team members found.</p>}
  </div>
 </section>;
}
