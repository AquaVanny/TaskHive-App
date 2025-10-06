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
  fetchOrganizations: () => Promise<void>;
  fetchMembers: (organizationId: string) => Promise<void>;
  createOrganization: (org: Omit<OrganizationInsert, 'owner_id'>) => Promise<Organization | null>;
  joinOrganization: (inviteCode: string) => Promise<boolean>;
  leaveOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  updateMemberRole: (organizationId: string, userId: string, role: string) => Promise<void>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  organizations: [],
  members: [],
  loading: false,

  fetchOrganizations: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ organizations: data || [] });
      
      // Set up real-time subscription
      const channel = supabase
        .channel('organizations-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'organizations' },
          (payload) => {
            if (payload.eventType === 'INSERT' && payload.new) {
              set((state) => ({
                organizations: [payload.new as Organization, ...state.organizations]
              }));
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              set((state) => ({
                organizations: state.organizations.map(o => 
                  o.id === (payload.new as Organization).id ? payload.new as Organization : o
                )
              }));
            } else if (payload.eventType === 'DELETE' && payload.old) {
              set((state) => ({
                organizations: state.organizations.filter(o => o.id !== (payload.old as Organization).id)
              }));
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error fetching organizations:', error);
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
        console.error('Not authenticated');
        throw new Error('Not authenticated');
      }

      console.log('Creating organization:', org, 'for user:', session.session.user.id);

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...org,
          owner_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting organization:', error);
        throw error;
      }

      console.log('Organization created:', data);

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
        // Don't throw error here, org is already created
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

      // Trim and normalize the invite code
      const normalizedCode = inviteCode.trim().toLowerCase();

      // Find organization by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .ilike('invite_code', normalizedCode)
        .single();

      if (orgError || !org) {
        console.error('Organization not found:', orgError);
        return false;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', org.id)
        .eq('user_id', session.session.user.id)
        .maybeSingle();

      if (existingMember) {
        return false; // Already a member
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

      // Send notification to organization owner
      await notificationService.createNotification({
        user_id: org.owner_id,
        message: `A new member joined ${org.name}`,
        type: 'member_added',
        organization_id: org.id,
      });

      set({ organizations: [org, ...get().organizations] });
      return true;
    } catch (error) {
      console.error('Error joining organization:', error);
      return false;
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
