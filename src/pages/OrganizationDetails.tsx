import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationsStore } from '@/store/organizationsStore';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/Loading';

const OrganizationDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { organizations, members, fetchMembers, updateMemberRole, removeMember } = useOrganizationsStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const organization = organizations.find((org) => org.id === id);
  const isOwner = organization?.owner_id === user?.id;

  useEffect(() => {
    if (id) {
      fetchMembers(id).finally(() => setLoading(false));
    }
  }, [id, fetchMembers]);

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

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile?.full_name?.[0] || profile?.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
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
                    {isOwner && !isMemberOwner && (
                      <>
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
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    {!isOwner && (
                      <Badge variant="secondary">{member.role || 'member'}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationDetails;
