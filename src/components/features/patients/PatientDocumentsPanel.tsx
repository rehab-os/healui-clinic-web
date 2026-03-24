'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Eye, Trash2, Upload, Loader2, FileImage, File } from 'lucide-react';
import { PatientDocumentService } from '@/services/api/patient-document.service';
import { toast } from 'sonner';
import type { PatientDocumentResponseDto, DocumentType } from '@/lib/types';
import { format } from 'date-fns';

interface PatientDocumentsPanelProps {
  patientId: string;
}

const TYPE_LABELS: Record<DocumentType, string> = {
  IMAGING_RESULT: 'Imaging Results',
  REFERRAL_LETTER: 'Referral Letters',
  CLINICAL_REPORT: 'Clinical Reports',
  PRESCRIPTION: 'Prescriptions',
  INSURANCE: 'Insurance',
  PAST_RECORD: 'Past Records',
  OTHER: 'Other',
};

const TYPE_BADGE_CLASSES: Record<DocumentType, string> = {
  IMAGING_RESULT: 'bg-teal-100 text-teal-800 border-teal-200',
  REFERRAL_LETTER: 'bg-blue-100 text-blue-800 border-blue-200',
  CLINICAL_REPORT: 'bg-purple-100 text-purple-800 border-purple-200',
  PRESCRIPTION: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INSURANCE: 'bg-gray-100 text-gray-800 border-gray-200',
  PAST_RECORD: 'bg-gray-100 text-gray-800 border-gray-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

const TYPE_ORDER: DocumentType[] = [
  'IMAGING_RESULT', 'REFERRAL_LETTER', 'CLINICAL_REPORT',
  'PRESCRIPTION', 'INSURANCE', 'PAST_RECORD', 'OTHER',
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  return File;
}

export default function PatientDocumentsPanel({ patientId }: PatientDocumentsPanelProps) {
  const [documents, setDocuments] = useState<PatientDocumentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, [patientId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const res = await PatientDocumentService.list(patientId);
      setDocuments(res.data || res || []);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Step 1: Get upload URL
      const uploadRes = await PatientDocumentService.getUploadUrl(patientId, {
        filename: file.name,
        mime_type: file.type,
        type: 'OTHER',
        title: file.name,
      });
      const { upload_url, storage_key } = uploadRes.data || uploadRes;

      // Step 2: Upload to R2
      const ok = await PatientDocumentService.uploadFileToR2(upload_url, file);
      if (!ok) throw new Error('Upload to storage failed');

      // Step 3: Create document record
      const createRes = await PatientDocumentService.create(patientId, {
        storage_key,
        type: 'OTHER',
        title: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      });

      const newDoc = createRes.data || createRes;
      setDocuments(prev => [newDoc, ...prev]);
      toast.success('Document uploaded successfully');
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleView(doc: PatientDocumentResponseDto) {
    try {
      const res = await PatientDocumentService.getViewUrl(patientId, doc.id);
      const url = res.data?.url || (res as any).url;
      if (url) window.open(url, '_blank');
      else toast.error('Could not get document URL');
    } catch {
      toast.error('Failed to get document URL');
    }
  }

  async function handleDelete(doc: PatientDocumentResponseDto) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      setDeletingId(doc.id);
      await PatientDocumentService.delete(patientId, doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  }

  // Group documents by type
  const grouped = documents.reduce<Record<string, PatientDocumentResponseDto[]>>((acc, doc) => {
    const key = doc.type || 'OTHER';
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
          <span className="text-sm text-gray-500">({documents.length})</span>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No documents uploaded yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Click Upload to add patient documents
          </p>
        </div>
      )}

      {/* Grouped documents */}
      {TYPE_ORDER.filter(type => grouped[type]?.length).map(type => (
        <div key={type} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${TYPE_BADGE_CLASSES[type]}`}>
              {TYPE_LABELS[type]}
            </span>
            <span className="text-xs text-gray-400">{grouped[type].length}</span>
          </div>

          <div className="space-y-1">
            {grouped[type].map(doc => {
              const IconComponent = getFileIcon(doc.mime_type);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <IconComponent className="h-4 w-4 text-gray-400 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{format(new Date(doc.uploaded_at), 'MMM dd, yyyy')}</span>
                      {doc.condition_id && (
                        <span className="text-gray-400">(Linked to condition)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleView(doc)}
                      className="p-1.5 text-gray-400 hover:text-teal-600 rounded-md hover:bg-teal-50 transition-colors"
                      title="View document"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
