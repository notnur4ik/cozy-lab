import { describe, expect, it } from 'vitest';
import {
  AuthorizationError,
  assertBranchAccess,
  assertPermission,
  hasPermission,
} from '@/lib/security/rbac';
import type { StaffProfile } from '@/types/domain';

const makeStaff = (role: StaffProfile['role'], branchIds: string[]): StaffProfile => ({
  id: 'u1',
  email: 'test@cozylab.kz',
  full_name: 'Test User',
  phone: null,
  role,
  is_active: true,
  mfa_enabled: false,
  preferred_locale: 'ru',
  branch_ids: branchIds,
});

describe('RBAC & Branch Isolation', () => {
  it('allows OWNER across all branches and full analytics', () => {
    const owner = makeStaff('OWNER', []);
    expect(hasPermission(owner.role, 'analytics.financial.full')).toBe(true);
    expect(() => assertBranchAccess(owner, 'any-branch-id')).not.toThrow();
  });

  it('denies cross-branch access for MANAGER and ADMINISTRATOR', () => {
    const manager = makeStaff('MANAGER', ['branch-1']);
    expect(() => assertBranchAccess(manager, 'branch-1')).not.toThrow();
    expect(() => assertBranchAccess(manager, 'branch-2')).toThrow(AuthorizationError);
  });

  it('restricts ADMINISTRATOR from full financial analytics and branch management', () => {
    const admin = makeStaff('ADMINISTRATOR', ['branch-1']);
    expect(() => assertPermission(admin, 'appointments.manage')).not.toThrow();
    expect(() => assertPermission(admin, 'analytics.financial.full')).toThrow(AuthorizationError);
    expect(() => assertPermission(admin, 'branches.manage')).toThrow(AuthorizationError);
  });

  it('restricts MASTER to own appointments only', () => {
    const master = makeStaff('MASTER', ['branch-1']);
    expect(hasPermission(master.role, 'appointments.own')).toBe(true);
    expect(hasPermission(master.role, 'appointments.manage')).toBe(false);
    expect(hasPermission(master.role, 'clients.manage')).toBe(false);
  });
});
