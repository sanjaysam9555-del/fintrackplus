import { useUserRoleContext } from './UserRoleProvider';

export type { AppRole } from './UserRoleProvider';

export const useUserRole = () => useUserRoleContext();
