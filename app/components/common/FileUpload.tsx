'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { uploadStudentDocument, type FileObject } from '@/app/services/storage';

interface FileUploadProps {
  studentId: string;
  type: 'report' | 'receipt' | 'volunteer_letter';
  onUploadComplete?: (file: FileObject) => void;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

export default function FileUpload({
  studentId,
  type,
  onUploadComplete,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png']
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadedFile = await uploadStudentDocument(studentId, file, type);
      if (!uploadedFile) {
        throw new Error('Upload failed');
      }
      toast.success('File uploaded successfully');
      onUploadComplete?.(uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [studentId, type, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize,
    accept: acceptedTypes.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`
        p-6 border-2 border-dashed rounded-lg cursor-pointer
        transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          {isUploading ? (
            'Uploading...'
          ) : isDragActive ? (
            'Drop the file here'
          ) : (
            <>
              Drag and drop a file, or <span className="text-blue-500">browse</span>
              <br />
              <span className="text-xs text-gray-500">
                Accepted files: {acceptedTypes.join(', ')}
                <br />
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
} 