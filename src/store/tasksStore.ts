import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { notificationService } from '@/services/notificationService';
import { reminderService } from '@/services/reminderService';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface TasksState {
  tasks: Task[];
  loading: boolean;
  channel: any;
  fetchTasks: () => Promise<void>;
  setupRealtimeSubscription: () => void;
  cleanupRealtimeSubscription: () => void;
  createTask: (task: TaskInsert) => Promise<Task | null>;
  updateTask: (id: string, updates: TaskUpdate) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string, currentStatus: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  channel: null,

  setupRealtimeSubscription: async () => {
    // Clean up existing subscription first
    get().cleanupRealtimeSubscription();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('Cannot setup real-time subscription: No authenticated user');
      return;
    }
    
    // Subscribe with user-specific filter (note: RLS still applies server-side)
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks',
          // RLS will filter on server, but we log for debugging
        },
        (payload) => {
          console.log('Real-time event:', payload.eventType, payload);
          
          // Additional client-side validation
          const taskData = payload.new || payload.old;
          if (taskData) {
            const task = taskData as Task;
            // Only process if user is creator, assignee, or it's an org task
            const isRelevant = task.user_id === user.id || 
                              task.assigned_to === user.id ||
                              task.organization_id !== null;
            
            if (!isRelevant) {
              console.warn('Received task event for irrelevant task:', task.id);
              return;
            }
          }
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newTask = payload.new as Task;
            // Check if task already exists to avoid duplicates
            const exists = get().tasks.some(t => t.id === newTask.id);
            if (!exists) {
              set((state) => ({
                tasks: [newTask, ...state.tasks]
              }));
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            set((state) => ({
              tasks: state.tasks.map(t => 
                t.id === (payload.new as Task).id ? payload.new as Task : t
              )
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            set((state) => ({
              tasks: state.tasks.filter(t => t.id !== (payload.old as Task).id)
            }));
          }
        }
      )
      .subscribe();
    
    set({ channel });
  },

  cleanupRealtimeSubscription: () => {
    const { channel } = get();
    if (channel) {
      supabase.removeChannel(channel);
      set({ channel: null });
    }
  },

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ tasks: [], loading: false });
        return;
      }

      // Fetch user's organization memberships first
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);
      
      const userOrgIds = new Set(memberships?.map(m => m.organization_id) || []);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Client-side filter to block unauthorized tasks
      const filteredTasks = data?.filter(task => {
        // Allow if user created it
        if (task.user_id === user.id) return true;
        
        // Allow if it's a personal task assigned to user
        if (task.assigned_to === user.id && !task.organization_id) return true;
        
        // For org tasks, only allow if user is still a member
        if (task.organization_id) {
          const isMember = userOrgIds.has(task.organization_id);
          if (!isMember) {
            console.warn('Blocking unauthorized org task:', task.id, task.title);
            return false; // Block this task
          }
        }
        
        return true;
      }) || [];
      
      console.log(`Fetched ${data?.length || 0} tasks, showing ${filteredTasks.length} after filtering`);
      set({ tasks: filteredTasks });
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      set({ loading: false });
    }
  },

  createTask: async (task: TaskInsert) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...task,
          user_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Task insert error:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Task created but no data returned');
        throw new Error('Task creation failed - no data returned');
      }
      
      console.log('Task successfully inserted to DB:', data.id);
      set((state) => ({ tasks: [data, ...state.tasks] }));
      
      // Send notifications (don't let notification errors block task creation)
      try {
        // Send in-app notifications
        if (data.organization_id) {
          const { data: members } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', data.organization_id);

          if (members) {
            for (const member of members) {
              if (member.user_id !== session.session.user.id) {
                try {
                  await notificationService.createNotification({
                    user_id: member.user_id,
                    message: `New task created: ${data.title}`,
                    type: 'task_created',
                    organization_id: data.organization_id,
                    task_id: data.id,
                  });
                } catch (notifError) {
                  console.error('Error creating notification:', notifError);
                }
              }
            }
          }
        }

        if (data.assigned_to && data.assigned_to !== session.session.user.id) {
          try {
            await notificationService.createNotification({
              user_id: data.assigned_to,
              message: `You have been assigned a task: ${data.title}`,
              type: 'task_assigned',
              organization_id: data.organization_id,
              task_id: data.id,
            });
          } catch (notifError) {
            console.error('Error creating assignment notification:', notifError);
          }
        }
        
        // Browser notification
        await notificationService.notifyTaskCreated(data.title);
        
        // Schedule reminder (30 minutes before due date)
        if (data.due_date) {
          console.log('Scheduling reminder for task:', data.id, 'due:', data.due_date);
          const reminder = await reminderService.scheduleReminder(data.id, session.session.user.id, new Date(data.due_date));
          console.log('Reminder scheduled:', reminder);
        } else {
          console.log('No due date set, skipping reminder');
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't throw - task was created successfully
      }
      
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (id: string, updates: TaskUpdate) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set({
        tasks: get().tasks.map((task) =>
          task.id === id ? data : task
        ),
      });

      // Send notifications (don't let notification errors block task update)
      try {
        // Cancel reminder if task is completed
        if (updates.status === 'completed') {
          await reminderService.cancelReminder(id);
          
          if (data.user_id !== session.session.user.id) {
            try {
              await notificationService.createNotification({
                user_id: data.user_id,
                message: `Task completed: ${data.title}`,
                type: 'task_completed',
                organization_id: data.organization_id,
                task_id: data.id,
              });
            } catch (notifError) {
              console.error('Error creating completion notification:', notifError);
            }
          }
        }

        // Reschedule reminder if due date is updated
        if (updates.due_date && updates.status !== 'completed') {
          await reminderService.scheduleReminder(id, data.user_id, new Date(updates.due_date));
        }

        // Send notification if task is assigned
        if (updates.assigned_to && updates.assigned_to !== data.user_id) {
          try {
            await notificationService.createNotification({
              user_id: updates.assigned_to,
              message: `You have been assigned a task: ${data.title}`,
              type: 'task_assigned',
              organization_id: data.organization_id,
              task_id: data.id,
            });
          } catch (notifError) {
            console.error('Error creating assignment notification:', notifError);
          }
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't throw - task was updated successfully
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      // Optimistically remove from state (real-time will confirm)
      set({ tasks: get().tasks.filter((task) => task.id !== id) });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  toggleTaskStatus: async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await get().updateTask(id, { status: newStatus });
      
      // Send notification when task is completed
      if (newStatus === 'completed') {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          await notificationService.notifyTaskCompleted(task.title);
        }
      }
    } catch (error) {
      console.error('Error toggling task status:', error);
      throw error;
    }
  },
}));
