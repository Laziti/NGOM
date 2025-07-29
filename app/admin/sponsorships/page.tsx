'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import DataTable, { Column } from '@/app/components/tables/DataTable';
import { getStudentsWithDetails, getUsers, assignStudentToDonor } from '@/app/services/users';

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Student {
  id: string;
  university: string;
  user: User;
  assigned_donor_id: string | null;
}

interface Donor {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminSponsorships() {
  const [students, setStudents] = useState<Student[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningStudent, setAssigningStudent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, donorsData] = await Promise.all([
        getStudentsWithDetails(),
        getUsers('donor'),
      ]);
      setStudents(studentsData as Student[]);
      setDonors(donorsData as Donor[]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDonor = async (studentId: string, donorId: string) => {
    try {
      await assignStudentToDonor(studentId, donorId);
      setAssigningStudent(null);
      loadData();
    } catch (error) {
      console.error('Error assigning donor:', error);
    }
  };

  const studentColumns: Column<Student>[] = [
    { 
      header: 'Student Name',
      accessor: (student) => student.user.full_name
    },
    { 
      header: 'Email',
      accessor: (student) => student.user.email
    },
    { 
      header: 'University',
      accessor: (student) => student.university
    },
    {
      header: 'Donor',
      accessor: (student) => {
        if (assigningStudent === student.id) {
          return (
            <select
              className="border rounded px-2 py-1"
              onChange={(e) => handleAssignDonor(student.id, e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>
                Select donor
              </option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.id}>
                  {donor.full_name}
                </option>
              ))}
            </select>
          );
        }
        const assignedDonor = donors.find((d) => d.id === student.assigned_donor_id);
        return assignedDonor ? assignedDonor.full_name : 'Not assigned';
      },
    },
  ];

  const donorColumns: Column<Donor>[] = [
    { 
      header: 'Name',
      accessor: (donor) => donor.full_name
    },
    { 
      header: 'Email',
      accessor: (donor) => donor.email
    },
    {
      header: 'Assigned Students',
      accessor: (donor) =>
        students.filter((s) => s.assigned_donor_id === donor.id).length.toString(),
    },
  ];

  const actions = (student: Student) => (
    <button
      onClick={() => setAssigningStudent(student.id)}
      className="text-indigo-600 hover:text-indigo-900"
    >
      {student.assigned_donor_id ? 'Change Donor' : 'Assign Donor'}
    </button>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Sponsorships</h1>

      <DashboardCard title="Student Assignments">
        <DataTable<Student>
          columns={studentColumns}
          data={students}
          actions={actions}
        />
      </DashboardCard>

      <DashboardCard title="Available Donors">
        <DataTable<Donor>
          columns={donorColumns}
          data={donors}
        />
      </DashboardCard>
    </div>
  );
} 