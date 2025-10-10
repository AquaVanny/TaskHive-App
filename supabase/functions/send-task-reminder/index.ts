import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaskReminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_scheduled_at: string;
  tasks: {
    id: string;
    title: string;
    description: string;
    due_date: string;
    status: string;
  };
  profiles: {
    email: string;
    full_name: string;
    notification_email: boolean;
    notification_push: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current time and 30 minutes window
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    
    console.log("Checking for reminders between:", now.toISOString(), "and", thirtyMinutesFromNow.toISOString());

    // Fetch pending reminders within the next 30 minutes
    const { data: reminders, error: fetchError } = await supabase
      .from("task_reminders")
      .select(`
        *,
        tasks(id, title, description, due_date, status),
        profiles:user_id(email, full_name, notification_email, notification_push)
      `)
      .eq("reminder_sent", false)
      .lte("reminder_scheduled_at", thirtyMinutesFromNow.toISOString())
      .gte("reminder_scheduled_at", now.toISOString());

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    const results = [];
    
    for (const reminder of (reminders as unknown as TaskReminder[]) || []) {
      try {
        const task = reminder.tasks;
        const profile = reminder.profiles;

        // Skip if task is already completed
        if (task.status === 'completed') {
          console.log(`Task ${task.id} already completed, skipping reminder`);
          await supabase
            .from("task_reminders")
            .delete()
            .eq("id", reminder.id);
          continue;
        }

        // Send email if user has email notifications enabled
        if (profile.notification_email) {
          const dueDate = new Date(task.due_date);
          const formattedDate = dueDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          await resend.emails.send({
            from: "TaskHive <onboarding@resend.dev>",
            to: [profile.email],
            subject: `⏰ Reminder: "${task.title}" is due soon!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #F59E0B;">Task Deadline Reminder</h2>
                <p>Hi ${profile.full_name || 'there'},</p>
                <p>This is a friendly reminder that your task is due in <strong>30 minutes</strong>!</p>
                
                <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #1F2937;">${task.title}</h3>
                  ${task.description ? `<p style="color: #6B7280;">${task.description}</p>` : ''}
                  <p style="color: #374151;"><strong>Due:</strong> ${formattedDate}</p>
                </div>

                <p style="color: #6B7280; font-style: italic;">
                  ⏰ You're 30 minutes away from your TaskHive deadline — time to wrap it up!
                </p>

                <a href="https://zljgjxiwoedzwbmgeivd.supabase.co/tasks/${task.id}" 
                   style="display: inline-block; background-color: #F59E0B; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; margin-top: 20px;">
                  Open Task
                </a>

                <p style="color: #9CA3AF; font-size: 12px; margin-top: 30px;">
                  TaskHive - Your Productivity Companion
                </p>
              </div>
            `,
          });
          console.log(`Email sent to ${profile.email} for task ${task.id}`);
        }

        // Create browser notification entry
        if (profile.notification_push) {
          await supabase.from("notifications").insert({
            user_id: reminder.user_id,
            message: `⏰ Reminder: "${task.title}" is due in 30 minutes!`,
            type: "task_reminder",
            task_id: task.id,
          });
          console.log(`Push notification created for task ${task.id}`);
        }

        // Mark reminder as sent
        await supabase
          .from("task_reminders")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);

        results.push({ task_id: task.id, status: "sent" });
      } catch (error: any) {
        console.error(`Error processing reminder ${reminder.id}:`, error);
        results.push({ task_id: reminder.task_id, status: "failed", error: error?.message || 'Unknown error' });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-task-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});