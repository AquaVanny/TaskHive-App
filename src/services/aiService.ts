import { supabase } from '@/integrations/supabase/client';

export interface TaskSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface HabitRecommendation {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: string;
  benefit: string;
}

export interface ProductivityInsights {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

export const aiService = {
  async getTaskSuggestions(userContext?: string, existingTasks?: any[]): Promise<TaskSuggestion[]> {
    const { data, error } = await supabase.functions.invoke('ai-task-suggestions', {
      body: { userContext, existingTasks }
    });

    if (error) throw error;
    return data.suggestions || [];
  },

  async getHabitRecommendations(
    userGoals?: string,
    existingHabits?: any[],
    completionData?: any
  ): Promise<HabitRecommendation[]> {
    const { data, error } = await supabase.functions.invoke('ai-habit-recommendations', {
      body: { userGoals, existingHabits, completionData }
    });

    if (error) throw error;
    return data.recommendations || [];
  },

  async getProductivityInsights(
    tasksData: any,
    habitsData: any,
    timeframe?: string
  ): Promise<ProductivityInsights> {
    const { data, error } = await supabase.functions.invoke('ai-productivity-insights', {
      body: { tasksData, habitsData, timeframe }
    });

    if (error) throw error;
    return data;
  }
};
