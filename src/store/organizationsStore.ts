import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { notificationService } from '@/services/notificationService';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];

interface MemberWithProfile extends OrganizationMember {
  profiles?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

interface OrganizationsState {
  organizations: Organization[];
  members: MemberWithProfile[];
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  fetchMembers: (organizationId: string) => Promise<void>;
  createOrganization: (org: Omit<OrganizationInsert, 'owner_id'>) => Promise<Organization | null>;
  joinOrganization: (inviteCode: string) => Promise<boolean>;
  leaveOrganization: (organizationId: string) => Promise<void>;
  deleteOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  updateMemberRole: (organizationId: string, userId: string, role: string) => Promise<void>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  organizations: [],
  members: [],
  loading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ loading: true, error: null });
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Not authenticated');
      }

      // Fetch organizations where user is a member
      const { data: memberOrgs, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', session.session.user.id);

      if (memberError) throw memberError;

      const orgIds = memberOrgs?.map(m => m.organization_id) || [];

      if (orgIds.length === 0) {
        set({ organizations: [], loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ organizations: data || [], error: null });
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      set({ error: error.message, organizations: [] });
    } finally {
      set({ loading: false });
    }
  },

  fetchMembers: async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*, profiles!organization_members_user_id_fkey(full_name, email, avatar_url)')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
      
      console.log('Fetched members:', data);
      set({ members: data || [] });
    } catch (error) {
      console.error('Error fetching members:', error);
      set({ members: [] });
    }
  },

  createOrganization: async (org) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) {
        throw new Error('Not authenticated');
      }

      // Generate unique invite code
      let inviteCode = '';
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        // Generate a random 8-character code
        inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Check if code exists
        const { data: existing } = await supabase
          .from('organizations')
          .select('id')
          .eq('invite_code', inviteCode)
          .maybeSingle();
        
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique invite code. Please try again.');
      }

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...org,
          owner_id: session.session.user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.id,
          user_id: session.session.user.id,
          role: 'owner',
        });

      if (memberError) {
        console.error('Error adding member:', memberError);
      }

      set({ organizations: [data, ...get().organizations] });
      return data;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      throw error;
    }
  },

  joinOrganization: async (inviteCode: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const normalizedCode = inviteCode.trim().toUpperCase();

      // Find organization by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('invite_code', normalizedCode)
        .maybeSingle();

      if (orgError || !org) {
        throw new Error('Invalid invite code. Please check and try again.');
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error('You are already a member of this team.');
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: session.session.user.id,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Send notification to organization owner (non-blocking)
      try {
        await notificationService.createNotification({
          user_id: org.owner_id,
          message: `A new member joined ${org.name}`,
          type: 'member_added',
          organization_id: org.id,
        });
      } catch (notifyError) {
        console.warn('Notification not sent due to RLS or other error:', notifyError);
        // Do not block the join flow on notification errors
      }

      // Refresh organizations list
      await get().fetchOrganizations();
      return true;
    } catch (error: any) {
      console.error('Error joining organization:', error);
      throw error;
    }
  },

  leaveOrganization: async (organizationId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', session.session.user.id);

      if (error) throw error;

      set({
        organizations: get().organizations.filter((org) => org.id !== organizationId),
      });
    } catch (error) {
      console.error('Error leaving organization:', error);
      throw error;
    }
  },

  deleteOrganization: async (organizationId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      // Verify user is the owner
      const org = get().organizations.find(o => o.id === organizationId);
      if (!org || org.owner_id !== session.session.user.id) {
        throw new Error('Only the owner can delete this organization');
      }

      // Delete the organization (cascading deletes should handle members)
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;

      set({
        organizations: get().organizations.filter((org) => org.id !== organizationId),
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  },

  updateOrganization: async (id: string, updates: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set({
        organizations: get().organizations.map((org) =>
          org.id === id ? { ...org, ...updates } : org
        ),
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },

  updateMemberRole: async (organizationId: string, userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      await get().fetchMembers(organizationId);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  removeMember: async (organizationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', organizationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Send notification to removed member
      await notificationService.createNotification({
        user_id: userId,
        message: 'You have been removed from an organization',
        type: 'member_removed',
        organization_id: organizationId,
      });

      // Refresh members
      await get().fetchMembers(organizationId);
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },
}));
