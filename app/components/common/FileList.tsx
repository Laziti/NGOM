'use client';

import { useState, useEffect } from 'react';
import { getStudentDocuments, deleteStudentDocument, type FileObject } from '@/app/services/storage';
import { toast } from 'react-hot-toast';

interface FileListProps {
  studentId: string;
  type?: 'report' | 'receipt' | 'volunteer_letter';
  canDelete?: boolean;
  onFileDeleted?: () => void;
}

export default function FileList({
  studentId,
  type,
  canDelete = false,
  onFileDeleted
}: FileListProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [studentId, type]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const documents = await getStudentDocuments(studentId, type);
      setFiles(documents);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    try {
      const success = await deleteStudentDocument(studentId, fileName);
      if (success) {
        toast.success('File deleted successfully');
        onFileDeleted?.();
        await loadFiles();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.name}
          className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
        >
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-gray-100 rounded">
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
              <p className="text-xs text-gray-500">
                {new Date(file.created_at).toLocaleDateString()} • {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
            >
              View
            </a>
            {canDelete && (
              <button
                onClick={() => handleDelete(file.name)}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 