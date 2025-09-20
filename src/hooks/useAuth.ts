import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
  full_name?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile with role
          setTimeout(async () => {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', session.user.id)
                .maybeSingle();

              if (!error && profile) {
                const authUser: AuthUser = {
                  ...session.user,
                  role: profile.role as UserRole,
                  full_name: profile.full_name
                };
                setUser(authUser);
              } else {
                // If no profile exists, create one with customer role
                if (error?.code === 'PGRST116') {
                  const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                      id: session.user.id,
                      email: session.user.email,
                      full_name: session.user.user_metadata?.full_name,
                      role: 'customer'
                    });

                  if (!insertError) {
                    const authUser: AuthUser = {
                      ...session.user,
                      role: 'customer' as UserRole,
                      full_name: session.user.user_metadata?.full_name
                    };
                    setUser(authUser);
                  }
                }
              }
            } catch (error) {
              setUser(session.user as AuthUser);
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Trigger the auth state change handler
        supabase.auth.onAuthStateChange.call(null, 'SIGNED_IN', session);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
    }
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!session,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer'
  };
};