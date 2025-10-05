import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (loading) => set({ loading }),
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
  
  initialize: async () => {
    set({ loading: true });
    
    // Set up auth state listener
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
    
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, loading: false });
  },
}));
