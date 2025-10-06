import { supabase } from '@/integrations/supabase/client';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export const organizationService = {
  async getOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Organization[];
  },

  async getOrganizationById(id: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async createOrganization(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at' | 'invite_code'>) {
    const { data, error } = await supabase
      .from('organizations')
      .insert(organization)
      .select()
      .single();

    if (error) throw error;

    // Add creator as owner member
    await this.addMember(data.id, organization.owner_id, 'owner');

    return data as Organization;
  },

  async updateOrganization(id: string, updates: Partial<Organization>) {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Organization;
  },

  async deleteOrganization(id: string) {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async joinOrganization(inviteCode: string, userId: string) {
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (orgError) throw orgError;

    await this.addMember(org.id, userId, 'member');
    return org;
  },

  async getMembers(organizationId: string) {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data as OrganizationMember[];
  },

  async addMember(organizationId: string, userId: string, role: OrganizationMember['role']) {
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) throw error;
    return data as OrganizationMember;
  },

  async removeMember(organizationId: string, userId: string) {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  subscribeToChanges(callback: (organization: Organization) => void) {
    const channel = supabase
      .channel('organizations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        (payload) => {
          if (payload.new) {
            callback(payload.new as Organization);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToMemberChanges(organizationId: string, callback: (member: OrganizationMember) => void) {
    const channel = supabase
      .channel(`org-members-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.new) {
            callback(payload.new as OrganizationMember);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
