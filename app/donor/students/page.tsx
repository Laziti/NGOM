'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import FileList from '@/app/components/common/FileList';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  school: string;
}

interface DatabaseResponse {
  student: Student;
}

export default function DonorStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    loadSponsoredStudents();
  }, []);

  const loadSponsoredStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sponsorships')
        .select(`
          student:student_id (
            id,
            first_name,
            last_name,
            grade,
            school
          )
        `)
        .eq('donor_id', user.id)
        .eq('status', 'active') as { data: DatabaseResponse[] | null; error: unknown };

      if (error) throw error;
      if (!data) return;

      const studentData = data.map(item => item.student);
      setStudents(studentData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Sponsored Students</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Students</h2>
          <div className="space-y-2">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left p-4 rounded-lg transition-colors ${
                  selectedStudent?.id === student.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <h3 className="font-medium">
                  {student.first_name} {student.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Grade {student.grade} • {student.school}
                </p>
              </button>
            ))}
            {students.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No sponsored students found
              </p>
            )}
          </div>
        </div>

        {/* Student Documents */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Academic Reports</h2>
                <FileList
                  studentId={selectedStudent.id}
                  type="report"
                  canDelete={false}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Receipts</h2>
                <FileList
                  studentId={selectedStudent.id}
                  type="receipt"
                  canDelete={false}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Volunteer Letters</h2>
                <FileList
                  studentId={selectedStudent.id}
                  type="volunteer_letter"
                  canDelete={false}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a student to view their documents
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 