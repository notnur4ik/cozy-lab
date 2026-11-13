import type { StaffProfile, UserRole } from '@/types/domain';

export type Permission =
  | 'branches.manage'
  | 'branches.view_all'
  | 'analytics.financial.full'
  | 'analytics.financial.branch'
  | 'payments.record'
  | 'appointments.manage'
  | 'appointments.own'
  | 'clients.manage'
  | 'employees.manage'
  | 'services.manage'
  | 'settings.manage'
  | 'audit.view';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  OWNER: [
    'branches.manage',
    'branches.view_all',
    'analytics.financial.full',
    'analytics.financial.branch',
    'payments.record',
    'appointments.manage',
    'appointments.own',
    'clients.manage',
    'employees.manage',
    'services.manage',
    'settings.manage',
    'audit.view',
  ],
  MANAGER: [
    'analytics.financial.branch',
    'payments.record',
    'appointments.manage',
    'appointments.own',
    'clients.manage',
    'employees.manage',
    'services.manage',
  ],
  ADMINISTRATOR: ['appointments.manage', 'clients.manage', 'payments.record'],
  MASTER: ['appointments.own'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasBranchAccess(profile: StaffProfile, branchId: string): boolean {
  if (!profile.is_active) return false;
  if (profile.role === 'OWNER') return true;
  return profile.branch_ids.includes(branchId);
}

export class AuthorizationError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 403, code = 'FORBIDDEN') {
    super(message);
    this.name = 'AuthorizationError';
    this.status = status;
    this.code = code;
  }
}

export function assertPermission(profile: StaffProfile | null, permission: Permission): StaffProfile {
  if (!profile || !profile.is_active) {
    throw new AuthorizationError('Authentication required.', 401, 'UNAUTHORIZED');
  }
  if (!hasPermission(profile.role, permission)) {
    throw new AuthorizationError(
      `Role ${profile.role} lacks required permission: ${permission}`,
      403,
      'FORBIDDEN'
    );
  }
  return profile;
}

export function assertBranchAccess(profile: StaffProfile | null, branchId: string): StaffProfile {
  if (!profile || !profile.is_active) {
    throw new AuthorizationError('Authentication required.', 401, 'UNAUTHORIZED');
  }
  if (!hasBranchAccess(profile, branchId)) {
    throw new AuthorizationError(
      'Cross-branch access denied: user is not assigned to this branch.',
      403,
      'BRANCH_ACCESS_DENIED'
    );
  }
  return profile;
}
