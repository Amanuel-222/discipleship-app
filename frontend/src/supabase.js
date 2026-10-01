import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// The browser uses a publishable key. Database RLS, not a hidden frontend key,
// determines who can access the class. Never use a service_role or secret key here.
export const configured=!!url&&!!key;
export const supabase=configured?createClient(url,key):null;
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
