import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];

interface OrganizationsState {
  organizations: Organization[];
  members: OrganizationMember[];
  loading: boolean;
  fetchOrganizations: () => Promise<void>;
  fetchMembers: (organizationId: string) => Promise<void>;
  createOrganization: (org: Omit<OrganizationInsert, 'owner_id'>) => Promise<Organization | null>;
  joinOrganization: (inviteCode: string) => Promise<boolean>;
  leaveOrganization: (organizationId: string) => Promise<void>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
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
        .select('*')
        .eq('organization_id', organizationId);

      if (error) throw error;
      set({ members: data || [] });
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  },

  createOrganization: async (org) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...org,
          owner_id: session.session.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase.from('organization_members').insert({
        organization_id: data.id,
        user_id: session.session.user.id,
        role: 'admin',
      });

      set({ organizations: [data, ...get().organizations] });
      return data;
    } catch (error) {
      console.error('Error creating organization:', error);
      return null;
    }
  },

  joinOrganization: async (inviteCode: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error('Not authenticated');

      // Find organization by invite code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (orgError) throw orgError;
      if (!org) return false;

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
}));
