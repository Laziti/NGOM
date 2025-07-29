'use client';

import { useState } from 'react';
import { StudentProfile } from '@/app/services/sponsorships';

interface StudentCardProps {
  student: StudentProfile;
  onSponsor?: (studentId: string) => Promise<void>;
  showSponsorButton?: boolean;
  isAssigned?: boolean;
}

export default function StudentCard({
  student,
  onSponsor,
  showSponsorButton = false,
  isAssigned = false,
}: StudentCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSponsor = async () => {
    if (!onSponsor) return;
    setLoading(true);
    try {
      await onSponsor(student.id);
    } catch (error) {
      console.error('Error sponsoring student:', error);
      alert(error instanceof Error ? error.message : 'Failed to send sponsorship request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {student.user.full_name}
            </h3>
            <p className="text-sm text-gray-500">{student.university}</p>
          </div>
          {showSponsorButton && !isAssigned && (
            <button
              onClick={handleSponsor}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Sending...' : 'Sponsor'}
            </button>
          )}
          {isAssigned && (
            <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
              Assigned
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-500">Email:</span>
            <span className="ml-2 text-sm text-gray-900">{student.user.email}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Gender:</span>
            <span className="ml-2 text-sm text-gray-900">{student.user.gender}</span>
          </div>
          {student.about && (
            <div>
              <span className="text-sm font-medium text-gray-500">About:</span>
              <p className="mt-1 text-sm text-gray-900">{student.about}</p>
            </div>
          )}
          {student.extra_docs && student.extra_docs.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-500">Documents:</span>
              <div className="mt-1 space-y-1">
                {student.extra_docs.map((doc, index) => (
                  <a
                    key={index}
                    href={doc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Document {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 