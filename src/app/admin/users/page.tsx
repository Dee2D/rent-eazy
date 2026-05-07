import { getAllUsers } from '@/lib/supabase/admin';
import UsersClient from './UsersClient';

export const metadata = { title: 'Users — Admin' };

export default async function AdminUsersPage() {
  const users = await getAllUsers();
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Users</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">{users.length} registered accounts</p>
      </div>
      <UsersClient users={users} />
    </div>
  );
}
