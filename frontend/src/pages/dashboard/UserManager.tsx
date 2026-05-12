import React, { useState } from 'react';
import { Plus, Search, MoreVertical } from 'lucide-react';

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
}

const demoUsers: UserItem[] = [
  { id: 1, name: 'Super Admin', email: 'admin@filamerian.com', role: 'Super Admin', status: 'Active', lastLogin: '2024-03-20' },
  { id: 2, name: 'Dr. Julian Santos', email: 'j.santos@filamer.edu.ph', role: 'Editor', status: 'Active', lastLogin: '2024-03-19' },
  { id: 3, name: 'Prof. Maria Reyes', email: 'm.reyes@filamer.edu.ph', role: 'Editor', status: 'Active', lastLogin: '2024-03-18' },
  { id: 4, name: 'Dr. Ana Villanueva', email: 'a.villanueva@filamer.edu.ph', role: 'Author', status: 'Active', lastLogin: '2024-03-15' },
  { id: 5, name: 'Prof. Carlo Tan', email: 'c.tan@filamer.edu.ph', role: 'Author', status: 'Inactive', lastLogin: '2024-02-01' },
  { id: 6, name: 'Dr. Elena Bautista', email: 'e.bautista@filamer.edu.ph', role: 'Reviewer', status: 'Active', lastLogin: '2024-03-17' },
];

const roleColor: Record<string, string> = {
  'Super Admin': 'text-rose-600 bg-rose-50',
  Editor: 'text-blue-600 bg-blue-50',
  Author: 'text-emerald-600 bg-emerald-50',
  Reviewer: 'text-violet-600 bg-violet-50',
};

const UserManager: React.FC = () => {
  const [filter, setFilter] = useState('');
  const filtered = demoUsers.filter((u) =>
    u.name.toLowerCase().includes(filter.toLowerCase()) ||
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl uppercase tracking-wider">User Manager</h1>
          <p className="text-[13px] text-muted mt-1">Manage portal accounts and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors shrink-0">
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted/40" />
        <input type="text" placeholder="Search users..." value={filter} onChange={(e) => setFilter(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-[13px] focus:outline-none focus:border-primary transition-colors" />
      </div>

      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wider text-left">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Last Login</th>
              <th className="px-5 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-background transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-primary">{user.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-[12px] text-muted">{user.email}</td>
                <td className="px-5 py-4">
                  <span className={`text-[11px] font-semibold px-2 py-1 ${roleColor[user.role] || 'text-muted bg-gray-50'}`}>{user.role}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[12px] font-medium ${user.status === 'Active' ? 'text-emerald-600' : 'text-muted'}`}>{user.status}</span>
                </td>
                <td className="px-5 py-4 text-[12px] text-muted">{user.lastLogin}</td>
                <td className="px-5 py-4">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted/40 hover:text-primary">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;
