import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
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

const defaultValue: UserRoleData = {
  role: null,
  orgId: null,
  mustChangePassword: false,
  memberId: null,
  isOwner: false,
  isAdmin: false,
  isEmployee: false,
  canEdit: false,
  canManageTeam: false,
  canViewPartners: false,
  canViewReports: false,
  canViewLogs: false,
  loading: true,
  refetch: async () => {},
};

const UserRoleContext = createContext<UserRoleData>(defaultValue);

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchRole = useCallback(async () => {
    // Only flip loading=true on the very first fetch. Background refetches
    // (e.g. after force-password-change) must not unmount consumers.
    if (!hasLoadedOnce.current) setLoading(true);

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
        console.error('[UserRoleProvider] Error fetching role:', error);
        setRole('owner');
        setOrgId(null);
        setMustChangePassword(false);
        setMemberId(null);
      } else if (data) {
        setRole(data.role as AppRole);
        setOrgId(data.org_id);
        setMustChangePassword(data.must_change_password);
        setMemberId(data.id);
      } else {
        setRole('owner');
        setOrgId(null);
        setMustChangePassword(false);
        setMemberId(null);
      }
    } catch (err) {
      console.error('[UserRoleProvider] Unexpected error:', err);
      setRole('owner');
      setOrgId(null);
      setMustChangePassword(false);
      setMemberId(null);
    } finally {
      hasLoadedOnce.current = true;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  const value: UserRoleData = {
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

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRoleContext = () => useContext(UserRoleContext);
