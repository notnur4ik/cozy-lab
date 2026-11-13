import { redirect } from 'next/navigation';
import { getAuthenticatedStaff } from '@/lib/auth/session';
import { AdminShell } from '@/components/crm/AdminShell';

export const dynamic = 'force-dynamic';

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    redirect('/admin/login');
  }

  return <AdminShell staff={staff}>{children}</AdminShell>;
}
