import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Habit = Database['public']['Tables']['habits']['Row'];
type HabitInsert = Database['public']['Tables']['habits']['Insert'];
type HabitUpdate = Database['public']['Tables']['habits']['Update'];
type HabitCompletion = Database['public']['Tables']['habit_completions']['Row'];

interface HabitsState {
  habits: Habit[];
  completions: HabitCompletion[];
  loading: boolean;
  fetchHabits: () => Promise<void>;
  fetchCompletions: () => Promise<void>;
  createHabit: (habit: HabitInsert) => Promise<Habit | null>;
  updateHabit: (id: string, updates: HabitUpdate) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (habitId: string, notes?: string) => Promise<void>;
  getHabitStreak: (habitId: string) => number;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  completions: [],
  loading: false,

  fetchHabits: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ habits: data || [] });
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchCompletions: async () => {
    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      set({ completions: data || [] });
    } catch (error) {
      console.error('Error fetching completions:', error);
    }
  },

  createHabit: async (habit: HabitInsert) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert(habit)
        .select()
        .single();

      if (error) throw error;

      set({ habits: [data, ...get().habits] });
      return data;
    } catch (error) {
      console.error('Error creating habit:', error);
      return null;
    }
  },

  updateHabit: async (id: string, updates: HabitUpdate) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set({
        habits: get().habits.map((habit) =>
          habit.id === id ? { ...habit, ...updates } : habit
        ),
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  deleteHabit: async (id: string) => {
    try {
      const { error } = await supabase.from('habits').delete().eq('id', id);

      if (error) throw error;

      set({ habits: get().habits.filter((habit) => habit.id !== id) });
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },

  completeHabit: async (habitId: string, notes?: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: session.session.user.id,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      set({ completions: [data, ...get().completions] });
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  },

  getHabitStreak: (habitId: string) => {
    const completions = get()
      .completions.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
      );

    if (completions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const completion of completions) {
      const completionDate = new Date(completion.completed_at);
      completionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);

      if (completionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },
}));
