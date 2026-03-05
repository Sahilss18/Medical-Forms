import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

const roleOptions = [
  { label: 'Inspector', value: 'INSPECTOR' },
  { label: 'Officer', value: 'OFFICER' },
  { label: 'Authority', value: 'AUTHORITY' },
  { label: 'Admin', value: 'ADMIN' },
];

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'INSPECTOR',
    district: '',
    password: 'password123',
  });

  const loadUsers = async () => {
    try {
      const response = await adminService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        const drafts: Record<string, string> = {};
        response.data.forEach((u: any) => {
          drafts[u.id] = u.role;
        });
        setRoleDrafts(drafts);
      }
    } catch {
      toast.error('Failed to load users');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error('Name, email and phone are required');
      return;
    }

    try {
      const response = await adminService.createUser(form);
      if (response.success) {
        toast.success('User created successfully');
        setForm({
          name: '',
          email: '',
          phone: '',
          role: 'INSPECTOR',
          district: '',
          password: 'password123',
        });
        await loadUsers();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await adminService.setUserActiveStatus(id, !current);
      toast.success('User status updated');
      await loadUsers();
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const resetPassword = async (id: string) => {
    try {
      await adminService.resetUserPassword(id, 'password123');
      toast.success('Password reset to password123');
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const assignRole = async (id: string) => {
    const role = roleDrafts[id];
    if (!role) return;
    try {
      await adminService.assignUserRole(id, role);
      toast.success('Role updated');
      await loadUsers();
    } catch {
      toast.error('Failed to assign role');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Create users, deactivate accounts, reset passwords, and assign roles.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Create User</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={roleOptions} />
            <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="Initial Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="mt-4">
            <Button onClick={handleCreateUser}>Create User</Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">District</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="text-sm text-gray-900">
                    <td className="py-3 pr-4 font-medium">{user.name}</td>
                    <td className="py-3 pr-4">{user.email}</td>
                    <td className="py-3 pr-4">{user.role}</td>
                    <td className="py-3 pr-4">{user.district || '—'}</td>
                    <td className="py-3 pr-4">{user.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="py-3 space-x-2">
                      <Select
                        value={roleDrafts[user.id] || user.role}
                        onChange={(e) =>
                          setRoleDrafts({ ...roleDrafts, [user.id]: e.target.value })
                        }
                        options={roleOptions}
                      />
                      <Button size="sm" variant="outline" onClick={() => assignRole(user.id)}>
                        Assign Role
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(user.id, user.isActive)}>
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => resetPassword(user.id)}>
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default UsersManagement;
