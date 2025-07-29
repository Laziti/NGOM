'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import SessionForm from '@/app/components/sessions/SessionForm';
import {
  getAssignedStudents,
  createSession,
  updateSession,
  deleteSession,
  validateReport,
  AssignedStudent,
  MentorSession,
  StudentReport,
} from '@/app/services/mentors';

interface DashboardCardProps {
  title: ReactNode;
  children: ReactNode;
}

export default function MentorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<MentorSession | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<StudentReport | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    if (!user?.id) return;
    try {
      const data = await getAssignedStudents(user.id);
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (data: { date: string; notes: string }) => {
    if (!user?.id || !selectedStudent) return;
    await createSession(user.id, selectedStudent, data.date, data.notes);
    setShowSessionForm(false);
    loadStudents();
  };

  const handleUpdateSession = async (data: { date: string; notes: string }) => {
    if (!user?.id || !editingSession) return;
    await updateSession(editingSession.id, user.id, {
      ...editingSession,
      ...data,
    });
    setEditingSession(null);
    loadStudents();
  };

  const handleDeleteSession = async (session: MentorSession) => {
    if (!user?.id) return;
    if (confirm('Are you sure you want to delete this session?')) {
      await deleteSession(session.id, user.id);
      loadStudents();
    }
  };

  const handleValidateReport = async (status: 'approved' | 'rejected') => {
    if (!selectedReport) return;
    await validateReport(selectedReport.id, status, feedback);
    setShowFeedbackForm(false);
    setSelectedReport(null);
    setFeedback('');
    loadStudents();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const selectedStudentData = selectedStudent
    ? students.find((s) => s.id === selectedStudent)
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Mentor Dashboard</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <DashboardCard title="My Students">
            <div className="space-y-4">
              {students.length > 0 ? (
                students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedStudent === student.id
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    } border`}
                  >
                    <h3 className="font-medium text-gray-900">{student.user.full_name}</h3>
                    <p className="text-sm text-gray-500">{student.university}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No students assigned yet</p>
              )}
            </div>
          </DashboardCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedStudentData ? (
            <>
              <DashboardCard title="Student Details">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedStudentData.user.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">University:</span>
                    <span className="ml-2 text-gray-900">
                      {selectedStudentData.university}
                    </span>
                  </div>
                  {selectedStudentData.about && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">About:</span>
                      <p className="mt-1 text-gray-900">{selectedStudentData.about}</p>
                    </div>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard
                title={
                  <div className="flex justify-between items-center">
                    <span>Meeting Sessions</span>
                    <button
                      onClick={() => setShowSessionForm(true)}
                      className="px-3 py-1 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >
                      Add Session
                    </button>
                  </div>
                }
              >
                {showSessionForm && (
                  <div className="mb-6">
                    <SessionForm
                      studentId={selectedStudentData.id}
                      onSubmit={handleCreateSession}
                      onCancel={() => setShowSessionForm(false)}
                    />
                  </div>
                )}

                {editingSession && (
                  <div className="mb-6">
                    <SessionForm
                      studentId={selectedStudentData.id}
                      initialData={editingSession}
                      onSubmit={handleUpdateSession}
                      onCancel={() => setEditingSession(null)}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  {selectedStudentData.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          Session on {formatDate(session.date)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{session.notes}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSession(session)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardCard>

              <DashboardCard title="Reports to Review">
                <div className="space-y-4">
                  {selectedStudentData.reports
                    .filter((report) => report.status === 'pending')
                    .map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {report.type === 'academic' ? 'Academic' : 'Weekly'} Report
                          </p>
                          <p className="text-sm text-gray-500">
                            Submitted on {formatDate(report.submitted_at)}
                          </p>
                          <a
                            href={report.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            View Report
                          </a>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowFeedbackForm(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </DashboardCard>
            </>
          ) : (
            <div className="text-center text-gray-500">
              Select a student to view details and manage sessions
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackForm && selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Review Report
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Feedback
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter feedback for the student..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowFeedbackForm(false);
                    setSelectedReport(null);
                    setFeedback('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleValidateReport('rejected')}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleValidateReport('approved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 