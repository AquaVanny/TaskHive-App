import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationsStore } from '@/store/organizationsStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Trash2, Shield, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/Loading';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const OrganizationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { organizations, members, fetchMembers, updateMemberRole, removeMember } = useOrganizationsStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [memberTasks, setMemberTasks] = useState<Record<string, any[]>>({});

  const organization = organizations.find((org) => org.id === id);
  const isOwner = organization?.owner_id === user?.id;

  useEffect(() => {
    if (id) {
      fetchMembers(id).finally(() => setLoading(false));
    }
  }, [id, fetchMembers]);

  useEffect(() => {
    if (id && members.length > 0) {
      // Fetch tasks for all members
      const fetchMemberTasks = async () => {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', id);

        if (error) {
          console.error('Error fetching tasks:', error);
          return;
        }

        // Group tasks by assigned_to
        const tasksByMember: Record<string, any[]> = {};
        data.forEach((task) => {
          if (task.assigned_to) {
            if (!tasksByMember[task.assigned_to]) {
              tasksByMember[task.assigned_to] = [];
            }
            tasksByMember[task.assigned_to].push(task);
          }
        });

        setMemberTasks(tasksByMember);
      };

      fetchMemberTasks();
    }
  }, [id, members]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!id) return;
    try {
      await updateMemberRole(id, userId, newRole);
      toast({ title: 'Member role updated successfully' });
    } catch (error) {
      toast({ title: 'Error updating member role', variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeMember(id, userId);
      toast({ title: 'Member removed successfully' });
    } catch (error) {
      toast({ title: 'Error removing member', variant: 'destructive' });
    }
  };

  if (loading) return <Loading />;
  if (!organization) {
    return (
      <div className="container py-6">
        <p>Organization not found</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate('/organizations')} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Teams
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {organization.name}
          </CardTitle>
          {organization.description && (
            <CardDescription>{organization.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>Manage your team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const profile = member.profiles;
              const isCurrentUser = member.user_id === user?.id;
              const isMemberOwner = member.user_id === organization.owner_id;
              const assignedTasks = memberTasks[member.user_id] || [];

              return (
                <Accordion key={member.id} type="single" collapsible className="border rounded-lg">
                  <AccordionItem value={member.id} className="border-none">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile?.full_name?.[0] || profile?.email?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <p className="font-medium flex items-center gap-2">
                              {profile?.full_name || profile?.email?.split('@')[0] || 'Unknown User'}
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                              {isMemberOwner && (
                                <Badge variant="default" className="text-xs">
                                  Owner
                                </Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{profile?.email || 'No email'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs">
                            {assignedTasks.length} {assignedTasks.length === 1 ? 'Task' : 'Tasks'}
                          </Badge>
                          {isOwner && !isMemberOwner && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={member.role || 'member'}
                                onValueChange={(value) => handleRoleChange(member.user_id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="owner">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3" />
                                      Owner
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3" />
                                      Admin
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveMember(member.user_id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                          {!isOwner && (
                            <Badge variant="secondary">{member.role || 'member'}</Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          Assigned Tasks ({assignedTasks.length})
                        </h4>
                        {assignedTasks.length > 0 ? (
                          <div className="space-y-2">
                            {assignedTasks.map((task) => (
                              <div
                                key={task.id}
                                className="p-3 border rounded-lg bg-muted/30"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    {task.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {task.priority}
                                      </Badge>
                                      <Badge
                                        variant={
                                          task.status === 'completed'
                                            ? 'default'
                                            : 'secondary'
                                        }
                                        className="text-xs"
                                      >
                                        {task.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            No tasks assigned yet
                          </p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDetails;
