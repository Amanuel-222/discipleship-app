import React,{useEffect,useState} from 'react';
import {readTeamDirectory,manageClassMember} from './api.js';

export default function TeamDirectory({email,ministry}){
 const [members,setMembers]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);const [memberError,setMemberError]=useState('');
 const canManage=['admin','leader'].includes(ministry.role);
 async function updateMember(memberEmail,role,remove=false){setSaving(true);setMemberError('');try{await manageClassMember(ministry.id,memberEmail,role,remove);setRefresh(n=>n+1);return true;}catch(e){setMemberError(e.message);return false;}finally{setSaving(false);}}
 const [refresh,setRefresh]=useState(0);
 useEffect(()=>{
  let active=true;
  async function load(){
   setLoading(true);setError('');
   try{const rows=await readTeamDirectory(ministry.id);if(active)setMembers(rows);}
   catch(e){if(active){setMembers([]);setError(e.message);}}
   finally{if(active)setLoading(false);}
  }
  load();
  addEventListener('focus',load);
  return()=>{active=false;removeEventListener('focus',load);};
 },[refresh,ministry.id]);
 return <section className="panel spaced" aria-labelledby="team-directory-title">
  <div className="section-head"><h2 id="team-directory-title">Team members <span className="count-pill">{members.length}</span></h2><button className="text-button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}>Refresh</button></div>
  <div className="team-directory">
   <p className="muted">{ministry.name} team. Church administrators can access every class.</p>
   {loading?<p role="status" className="team-directory-status">Loading team members…</p>:error?<p role="alert" className="form-error">{error}</p>:members.length?<ul>{members.map(member=><li key={member.user_id}>
    <span className="avatar small" aria-hidden="true">{(member.email||'?')[0].toUpperCase()}</span>
    <div className="team-member-detail"><strong>{member.email||'Email unavailable'}</strong><small>{member.role==='admin'?'Church administrator':member.role==='leader'?'Class leader':'Team member'} · Access approved {new Date(member.approved_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</small></div>
    {member.email?.toLowerCase()===email?.toLowerCase()&&<span className="badge green">You</span>}
    {canManage&&member.role!=='admin'&&(ministry.role==='admin'||member.role!=='leader')&&<button className="danger-link" disabled={saving} onClick={()=>{if(confirm('Remove '+member.email+' from '+ministry.name+'? Their account and class records will remain.'))updateMember(member.email,member.role||'member',true);}}>Remove access</button>}
   </li>)}</ul>:<p className="team-directory-status">No approved team members found.</p>}
   {canManage&&<form className="team-access-form" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const values=Object.fromEntries(new FormData(form));if(await updateMember(values.email,values.role||'member'))form.reset();}}>
    <h3>Add a teammate</h3><p className="form-hint">Invite them in Supabase first, then give them access to {ministry.name} here.</p>
    <label className="field">Teammate email<input name="email" type="email" required maxLength={254} placeholder="teammate@example.com"/></label>
    {ministry.role==='admin'&&<label className="field">Class role<select name="role"><option value="member">Team member</option><option value="leader">Class leader</option></select></label>}
    <button className="secondary" disabled={saving}>{saving?'Saving…':'Save class access'}</button>
   </form>}
   {memberError&&<p className="form-error" role="alert">{memberError}</p>}
  </div>
 </section>;
}
