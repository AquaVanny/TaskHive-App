import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { profileSetupSchema, ProfileSetupInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileSetupInput>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      timezone: 'UTC',
      notificationEmail: true,
      notificationPush: true,
    },
  });

  const onSubmit = async (data: ProfileSetupInput) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          timezone: data.timezone,
          notification_email: data.notificationEmail,
          notification_push: data.notificationPush,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been set up successfully.',
      });
      navigate('/onboarding/workspace');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Set up your profile</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us a bit about yourself
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              placeholder="How should we call you?"
              {...register('displayName')}
              disabled={isLoading}
            />
            {errors.displayName && (
              <p className="text-sm text-destructive">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              defaultValue="UTC"
              onValueChange={(value) => setValue('timezone', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Notification Preferences</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Notifications</span>
              <Switch
                checked={watch('notificationEmail')}
                onCheckedChange={(checked) => setValue('notificationEmail', checked)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Push Notifications</span>
              <Switch
                checked={watch('notificationPush')}
                onCheckedChange={(checked) => setValue('notificationPush', checked)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-muted"></div>
            <span className="ml-2">Step 2 of 3</span>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
