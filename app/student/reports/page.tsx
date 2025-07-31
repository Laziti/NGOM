'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import FileUpload from '@/app/components/common/FileUpload';
import FileList from '@/app/components/common/FileList';
import { toast } from 'react-hot-toast';
import type { FileObject } from '@/app/services/storage';

export default function StudentReportsPage() {
  const [studentId, setStudentId] = useState<string | null>(null);


  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStudentId(user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  const handleUploadComplete = (file: FileObject) => {
    toast.success('Report uploaded successfully');
  };

  if (!studentId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Reports</h1>
      
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Report</h2>
          <FileUpload
            studentId={studentId}
            type="report"
            onUploadComplete={handleUploadComplete}
            maxSize={10 * 1024 * 1024} // 10MB
            acceptedTypes={['application/pdf']}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">My Uploaded Reports</h2>
          <FileList
            studentId={studentId}
            type="report"
            canDelete={true}
          />
        </div>
      </div>
    </div>
  );
} 