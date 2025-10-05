import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { workspaceSetupSchema, WorkspaceSetupInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const WorkspaceSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkspaceSetupInput>({
    resolver: zodResolver(workspaceSetupSchema),
    defaultValues: {
      action: 'skip',
    },
  });

  const selectedAction = watch('action');

  const onSubmit = async (data: WorkspaceSetupInput) => {
    if (!user || data.action === 'skip') {
      navigate('/dashboard');
      return;
    }

    try {
      setIsLoading(true);

      if (data.action === 'create' && data.organizationName) {
        const { error } = await supabase
          .from('organizations')
          .insert({
            name: data.organizationName,
            owner_id: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Organization created',
          description: 'Your team workspace is ready!',
        });
      } else if (data.action === 'join' && data.inviteCode) {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('invite_code', data.inviteCode)
          .single();

        if (orgError || !org) {
          toast({
            variant: 'destructive',
            title: 'Invalid invite code',
            description: 'The invite code you entered is not valid.',
          });
          return;
        }

        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: org.id,
            user_id: user.id,
          });

        if (memberError) throw memberError;

        toast({
          title: 'Joined organization',
          description: 'You are now part of the team!',
        });
      }

      navigate('/dashboard');
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
          <h1 className="text-3xl font-bold">Set up your workspace</h1>
          <p className="mt-2 text-muted-foreground">
            Create or join an organization
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <RadioGroup
            value={selectedAction}
            onValueChange={(value: any) => setValue('action', value)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="create" id="create" />
              <div className="flex-1">
                <Label htmlFor="create" className="font-semibold">
                  Create new organization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Start a new team workspace
                </p>
              </div>
            </div>

            {selectedAction === 'create' && (
              <div className="ml-7 space-y-2">
                <Input
                  placeholder="Organization name"
                  {...register('organizationName')}
                  disabled={isLoading}
                />
                {errors.organizationName && (
                  <p className="text-sm text-destructive">{errors.organizationName.message}</p>
                )}
              </div>
            )}

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="join" id="join" />
              <div className="flex-1">
                <Label htmlFor="join" className="font-semibold">
                  Join existing organization
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use an invite code to join
                </p>
              </div>
            </div>

            {selectedAction === 'join' && (
              <div className="ml-7 space-y-2">
                <Input
                  placeholder="Enter invite code"
                  {...register('inviteCode')}
                  disabled={isLoading}
                />
                {errors.inviteCode && (
                  <p className="text-sm text-destructive">{errors.inviteCode.message}</p>
                )}
              </div>
            )}

            <div className="flex items-start space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="skip" id="skip" />
              <div className="flex-1">
                <Label htmlFor="skip" className="font-semibold">
                  Skip for now
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use TaskHive for personal productivity
                </p>
              </div>
            </div>
          </RadioGroup>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span className="ml-2">Step 3 of 3</span>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedAction === 'skip' ? 'Complete Setup' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
