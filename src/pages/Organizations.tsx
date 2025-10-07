import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Copy, UserPlus, LogOut, Settings, ArrowRight } from 'lucide-react';
import { useOrganizationsStore } from '@/store/organizationsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/EmptyState';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Loading } from '@/components/Loading';
import { useAuthStore } from '@/store/authStore';

const Organizations = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    organizations,
    loading,
    fetchOrganizations,
    createOrganization,
    joinOrganization,
    leaveOrganization,
  } = useOrganizationsStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [actionType, setActionType] = useState<'create' | 'join'>('create');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const onSubmitCreate = async (data: any) => {
    try {
      console.log('Form submitted with data:', data);
      const org = await createOrganization(data);
      if (org) {
        toast({ title: 'Organization created successfully' });
        setIsDialogOpen(false);
        reset();
        // Refresh organizations
        await fetchOrganizations();
      } else {
        toast({ 
          title: 'Error creating organization', 
          description: 'Please try again',
          variant: 'destructive' 
        });
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({ 
        title: 'Error creating organization', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    }
  };

  const onSubmitJoin = async (data: any) => {
    try {
      await joinOrganization(data.invite_code);
      toast({
        title: 'Success',
        description: 'You have successfully joined the team',
      });
      setIsDialogOpen(false);
      reset();
      await fetchOrganizations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join team',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Invite code copied to clipboard' });
  };

  const handleLeave = async (orgId: string) => {
    if (confirm('Are you sure you want to leave this organization?')) {
      try {
        await leaveOrganization(orgId);
        toast({ title: 'Left organization successfully' });
      } catch (error) {
        toast({ title: 'Error leaving organization', variant: 'destructive' });
      }
    }
  };

  const openCreateDialog = () => {
    setActionType('create');
    reset();
    setIsDialogOpen(true);
  };

  const openJoinDialog = () => {
    setActionType('join');
    reset();
    setIsDialogOpen(true);
  };

  if (loading && organizations.length === 0) {
    return <Loading />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">Collaborate with your team members</p>
        </div>
        <Button onClick={openJoinDialog} variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Join Team
        </Button>
      </div>

      {organizations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => {
            const isOwner = org.owner_id === user?.id;
            
            return (
              <Card key={org.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {org.name}
                        {isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            Owner
                          </Badge>
                        )}
                      </CardTitle>
                      {org.description && (
                        <CardDescription className="mt-2">
                          {org.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Invite Code</p>
                      <code className="text-sm font-mono font-semibold">
                        {org.invite_code}
                      </code>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyInviteCode(org.invite_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/organizations/${org.id}`)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    {!isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLeave(org.id)}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No teams yet"
          description="Create a team to collaborate with others or join an existing one"
          actionLabel="Create Team"
          onAction={openCreateDialog}
        />
      )}

      <FloatingActionButton onClick={openCreateDialog} label="Create Team" />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'create' ? 'Create New Team' : 'Join Team'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'create'
                ? 'Create a new team and invite members to collaborate'
                : 'Enter an invite code to join an existing team'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={actionType} onValueChange={(v) => setActionType(v as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="join">Join</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: true })}
                    placeholder="Enter team name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="What's this team about?"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Team</Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="join">
              <form onSubmit={handleSubmit(onSubmitJoin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite_code">Invite Code *</Label>
                  <Input
                    id="invite_code"
                    {...register('invite_code', { required: true })}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your team admin for the invite code
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Join Team</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Organizations;
