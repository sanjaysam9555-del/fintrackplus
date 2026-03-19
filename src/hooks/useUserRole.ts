import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'owner' | 'admin' | 'employee';

interface UserRoleData {
  role: AppRole | null;
  orgId: string | null;
  mustChangePassword: boolean;
  memberId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  canEdit: boolean;
  canManageTeam: boolean;
  canViewPartners: boolean;
  canViewReports: boolean;
  canViewLogs: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setOrgId(null);
      setMustChangePassword(false);
      setMemberId(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('org_members')
        .select('id, org_id, role, must_change_password')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('[useUserRole] Error fetching role:', error);
        // Fallback: treat as owner for backward compatibility
        setRole('owner');
        setMustChangePassword(false);
      } else if (data) {
        setRole(data.role as AppRole);
        setOrgId(data.org_id);
        setMustChangePassword(data.must_change_password);
        setMemberId(data.id);
      } else {
        // No org_member record found - this shouldn't happen after migration
        // but handle gracefully
        setRole('owner');
        setMustChangePassword(false);
      }
    } catch (err) {
      console.error('[useUserRole] Unexpected error:', err);
      setRole('owner');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  return {
    role,
    orgId,
    mustChangePassword,
    memberId,
    isOwner,
    isAdmin,
    isEmployee,
    canEdit: isOwner || isAdmin,
    canManageTeam: isOwner,
    canViewPartners: isOwner,
    canViewReports: isOwner || isAdmin,
    canViewLogs: isOwner,
    loading,
    refetch: fetchRole,
  };
};
