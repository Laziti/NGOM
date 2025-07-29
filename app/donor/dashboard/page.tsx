'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import StudentCard from '@/app/components/students/StudentCard';
import { getAvailableStudents, createSponsorshipRequest, StudentProfile } from '@/app/services/sponsorships';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await getAvailableStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsor = async (studentId: string) => {
    if (!user?.id) return;
    await createSponsorshipRequest(studentId, user.id);
    // Reload students to update the list
    await loadStudents();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Available Students</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {students.length > 0 ? (
          students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onSponsor={handleSponsor}
              showSponsorButton={true}
            />
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500">
            No students available for sponsorship at the moment.
          </div>
        )}
      </div>
    </div>
  );
} 