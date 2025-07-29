'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import DataTable, { Column } from '@/app/components/tables/DataTable';
import UserForm from '@/app/components/forms/UserForm';
import { getUsers, createUser, updateUser, deleteUser } from '@/app/services/users';
import { UserFormData } from '@/app/components/forms/UserForm';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  role: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      await createUser(userData);
      setShowForm(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const handleUpdateUser = async (userData: UserFormData) => {
    if (!editingUser?.id) return;
    try {
      await updateUser(editingUser.id, userData);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(user.id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const columns: Column<User>[] = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Gender', accessor: 'gender' },
  ];

  const usersByRole = {
    student: users.filter(u => u.role === 'student'),
    donor: users.filter(u => u.role === 'donor'),
    mentor: users.filter(u => u.role === 'mentor'),
    admin: users.filter(u => u.role === 'admin'),
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add User
        </button>
      </div>

      {(showForm || editingUser) && (
        <DashboardCard title={editingUser ? 'Edit User' : 'Add New User'}>
          <UserForm
            initialData={editingUser || undefined}
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            isEdit={!!editingUser}
          />
          <button
            onClick={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            className="mt-4 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </DashboardCard>
      )}

      <div className="grid grid-cols-1 gap-6">
        <DashboardCard title="Students">
          <DataTable<User>
            columns={columns}
            data={usersByRole.student}
            onEdit={(user) => setEditingUser(user as UserFormData)}
            onDelete={handleDeleteUser}
          />
        </DashboardCard>

        <DashboardCard title="Donors">
          <DataTable<User>
            columns={columns}
            data={usersByRole.donor}
            onEdit={(user) => setEditingUser(user as UserFormData)}
            onDelete={handleDeleteUser}
          />
        </DashboardCard>

        <DashboardCard title="Mentors">
          <DataTable<User>
            columns={columns}
            data={usersByRole.mentor}
            onEdit={(user) => setEditingUser(user as UserFormData)}
            onDelete={handleDeleteUser}
          />
        </DashboardCard>

        <DashboardCard title="Administrators">
          <DataTable<User>
            columns={columns}
            data={usersByRole.admin}
            onEdit={(user) => setEditingUser(user as UserFormData)}
            onDelete={handleDeleteUser}
          />
        </DashboardCard>
      </div>
    </div>
  );
} 