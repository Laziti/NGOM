import { supabase } from '../lib/supabase';

export type FileObject = {
  name: string;
  size: number;
  type: string;
  url: string;
  created_at: string;
};

export const uploadStudentDocument = async (
  studentId: string,
  file: File,
  type: 'report' | 'receipt' | 'volunteer_letter'
): Promise<FileObject | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${type}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('student_documents')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = await supabase.storage
      .from('student_documents')
      .createSignedUrl(fileName, 60 * 60); // 1 hour expiry

    if (!urlData?.signedUrl) throw new Error('Could not get signed URL');

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.signedUrl,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

export const getStudentDocuments = async (
  studentId: string,
  type?: 'report' | 'receipt' | 'volunteer_letter'
): Promise<FileObject[]> => {
  try {
    const path = type ? `${studentId}/${type}` : studentId;
    
    const { data, error } = await supabase.storage
      .from('student_documents')
      .list(path);

    if (error) throw error;

    const files = await Promise.all(
      data.map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from('student_documents')
          .createSignedUrl(`${path}/${file.name}`, 60 * 60); // 1 hour expiry

        return {
          name: file.name,
          size: file.metadata.size,
          type: file.metadata.mimetype,
          url: urlData?.signedUrl || '',
          created_at: file.created_at,
        };
      })
    );

    return files;
  } catch (error) {
    console.error('Error getting files:', error);
    return [];
  }
};

export const deleteStudentDocument = async (
  studentId: string,
  fileName: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('student_documents')
      .remove([`${studentId}/${fileName}`]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}; 