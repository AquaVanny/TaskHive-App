import { supabase } from '@/integrations/supabase/client';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category?: string;
  reminder_time?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  notes?: string;
}

export const habitService = {
  async getHabits() {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Habit[];
  },

  async getHabitById(id: string) {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async updateHabit(id: string, updates: Partial<Habit>) {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Habit;
  },

  async deleteHabit(id: string) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCompletions(habitId?: string) {
    let query = supabase
      .from('habit_completions')
      .select('*')
      .order('completed_at', { ascending: false });

    if (habitId) {
      query = query.eq('habit_id', habitId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as HabitCompletion[];
  },

  async completeHabit(habitId: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data as HabitCompletion;
  },

  subscribeToChanges(callback: (habit: Habit) => void) {
    const channel = supabase
      .channel('habits-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits' },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Habit);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToCompletions(callback: (completion: HabitCompletion) => void) {
    const channel = supabase
      .channel('completions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        (payload) => {
          if (payload.new) {
            callback(payload.new as HabitCompletion);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
