import React,{useState} from 'react';
import {configured,signIn,requestPasswordReset,savePassword} from './supabase.js';

function Field({label,...props}){
 return <label className="field">{label}<input {...props}/></label>;
}
function AuthCard({title,description,children}){
 return <div className="login-page"><section className="login-card"><span className="eyebrow">TRUE VINE MINISTRY</span><h1>{title}</h1><p>{description}</p>{children}<small className="login-foot">Rooted in truth. Growing together.</small></section></div>;
}
export function Login({onLogin,initialError='',notice=''}){
 const [reset,setReset]=useState(false);
 const [error,setError]=useState(initialError);
 const [message,setMessage]=useState(notice);
 const [busy,setBusy]=useState(false);
 function changeMode(value){setReset(value);setError('');setMessage('');}
 async function submit(event){
  event.preventDefault();
  const {email,password}=Object.fromEntries(new FormData(event.currentTarget));
  setBusy(true);setError('');setMessage('');
  try{
   if(reset){
    await requestPasswordReset(email.trim());
    setMessage('If this email has an account, a password-reset link will be sent. Check your inbox and spam folder.');
   }else{await signIn(email.trim(),password);onLogin();}
  }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <AuthCard title={reset?'Reset your password.':'Growing together.'} description={reset?'Enter the email you use for your TVM class.':'Sign in to your TVM discipleship class.'}>
  {configured?<>
   <form onSubmit={submit}>
    <Field label="Email" name="email" type="email" autoComplete="username" required autoFocus/>
    {!reset&&<Field label="Password" name="password" type="password" autoComplete="current-password" required/>}
    {error&&<p className="form-error" role="alert">{error}</p>}
    {message&&<p className="auth-message" role="status">{message}</p>}
    <button className="primary" disabled={busy}>{busy?(reset?'Sending…':'Signing in…'):reset?'Send reset link':'Sign in'}</button>
   </form>
   <button className="text-button auth-switch" disabled={busy} onClick={()=>changeMode(!reset)}>{reset?'Back to sign in':'Forgot password?'}</button>
   <p className="form-hint">Use your approved TVM email. Need access? Ask your class leader for an invitation.</p>
  </>:<div className="setup-tip"><strong>The live connection is not configured yet.</strong><p>Your class leader needs to connect this site to Supabase before anyone can sign in.</p></div>}
 </AuthCard>;
}
export function PasswordSetup({session,invalidLink,onDone}){
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [saved,setSaved]=useState(false);
 const valid=!!session&&!invalidLink;
 async function submit(event){
  event.preventDefault();
  const {password,confirmPassword}=Object.fromEntries(new FormData(event.currentTarget));
  if(password!==confirmPassword){setError('Your passwords do not match.');return;}
  setBusy(true);setError('');
  try{await savePassword(password);setSaved(true);await onDone(true);}
  catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <AuthCard title="Choose your password." description={valid?`Set a password for ${session.email}.`:'Use the link from your invitation or password-reset email.'}>
  {valid?<form onSubmit={submit}>
   <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus/>
   <Field label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required/>
   <p className="form-hint">Use at least 8 characters. Your class leader does not need to know your password.</p>
   {error&&<p className="form-error" role="alert">{error}</p>}
   <button className="primary" disabled={busy}>{busy?'Saving…':'Save password'}</button>
  </form>:<p className="form-error" role="alert">{saved?'Password saved. Return to sign in.':'This link is invalid or has expired. Ask your class leader for a new invitation, or request a password-reset link from the sign-in page.'}</p>}
  <button className="text-button auth-switch" disabled={busy} onClick={()=>onDone(saved)}>Back to sign in</button>
 </AuthCard>;
}
