import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// The browser uses a publishable key. Database RLS, not a hidden frontend key,
// determines who can access the class. Never use a service_role or secret key here.
export const configured=!!url&&!!key;
// Capture the link type before the SDK consumes the authentication URL fragment.
const authHash=new URLSearchParams(location.hash.slice(1));
export const passwordSetupLink=['invite','recovery'].includes(authHash.get('type'))||new URLSearchParams(location.search).get('auth')==='setup';
export const authLinkError=authHash.has('error')||new URLSearchParams(location.search).has('error');
export const supabase=configured?createClient(url,key):null;
export function clearAuthLink(){
 const clean=new URL(location.href);
 for(const name of ['auth','error','error_code','error_description'])clean.searchParams.delete(name);
 clean.hash='';
 history.replaceState(null,'',clean.pathname+clean.search);
}
export async function requestPasswordReset(email){
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/?auth=setup'});
 if(error)throw new Error(error.message);
}
export async function savePassword(password){
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const {data,error:sessionError}=await supabase.auth.getSession();
 if(sessionError||!data.session)throw new Error('This link has expired. Request a new invitation or password-reset email.');
 const {error}=await supabase.auth.updateUser({password});
 if(error)throw new Error(error.message);
 // Return to normal sign-in, which verifies class membership separately.
 await signOut();
 clearAuthLink();
}
export async function requireTeamAccess(){
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const {data,error}=await supabase.rpc('is_tvm_member');
 if(error)throw new Error('Could not verify team access. Check the database setup.');
 if(!data)throw new Error('Your account has not been approved for this TVM class. Contact your class leader.');
}
export async function signIn(email,password){
 if(!supabase)throw new Error('Supabase is not configured for this site yet.');
 const {error}=await supabase.auth.signInWithPassword({email,password});
 if(error)throw new Error(error.message);
 try{await requireTeamAccess();}catch(e){await supabase.auth.signOut({scope:'local'});throw e;}
}
export async function signOut(){if(supabase){const {error}=await supabase.auth.signOut({scope:'local'});if(error)throw error;}}
