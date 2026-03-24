'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle, FileImage, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientDocumentService } from '@/services/api/patient-document.service';
import { toast } from 'sonner';
import type { PatientDocumentResponseDto } from '@/lib/types';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: (doc: PatientDocumentResponseDto) => void;
  patientId: string;
  conditionId: string;
  imagingOrderLabel: string;
}

type UploadStep = 'SELECT' | 'UPLOADING' | 'DONE';

export default function ImageUploadModal({
  open,
  onClose,
  onUploadComplete,
  patientId,
  conditionId,
  imagingOrderLabel,
}: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>('SELECT');

  const reset = useCallback(() => {
    setFile(null);
    setStep('SELECT');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFileChange = useCallback((f: File | null) => {
    if (f && f.size > 50 * 1024 * 1024) {
      toast.error('File too large', { description: 'Max 50 MB.' });
      return;
    }
    setFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setStep('UPLOADING');
    try {
      // Step 1: Get pre-signed URL
      const title = `${imagingOrderLabel} — ${file.name}`;
      const urlRes = await PatientDocumentService.getUploadUrl(patientId, {
        filename: file.name,
        mime_type: file.type,
        type: 'IMAGING_RESULT',
        title,
        condition_id: conditionId,
        imaging_order_label: imagingOrderLabel,
      });

      if (!urlRes.success) throw new Error(urlRes.message || 'Failed to get upload URL');

      const { upload_url, storage_key } = urlRes.data;

      // Step 2: Upload to R2
      const ok = await PatientDocumentService.uploadFileToR2(upload_url, file);
      if (!ok) throw new Error('Upload failed');

      // Step 3: Register document
      const createRes = await PatientDocumentService.create(patientId, {
        storage_key,
        type: 'IMAGING_RESULT',
        title,
        mime_type: file.type,
        file_size_bytes: file.size,
        condition_id: conditionId,
        imaging_order_label: imagingOrderLabel,
      });

      if (!createRes.success) throw new Error(createRes.message || 'Failed to register document');

      setStep('DONE');
      toast.success('Document uploaded');
      onUploadComplete(createRes.data);

      // Auto-close after brief success state
      setTimeout(handleClose, 600);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setStep('SELECT');
    }
  };

  if (!open) return null;

  const isPdf = file?.type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Upload Imaging Result</h2>
            <p className="text-xs text-gray-500 mt-0.5">{imagingOrderLabel}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {step === 'DONE' ? (
            <div className="text-center py-6">
              <CheckCircle className="w-10 h-10 text-teal-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Uploaded successfully</p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  file ? 'border-teal-300 bg-teal-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFileChange(e.dataTransfer.files[0] || null);
                }}
                onClick={() => document.getElementById('doc-file-input')?.click()}
              >
                <input
                  id="doc-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dicom"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    {isPdf ? (
                      <File className="w-8 h-8 text-teal-500" />
                    ) : (
                      <FileImage className="w-8 h-8 text-teal-500" />
                    )}
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[280px]">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Drop file or click to browse</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG up to 50 MB</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose} className="flex-1" disabled={step === 'UPLOADING'}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file || step === 'UPLOADING'}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                >
                  {step === 'UPLOADING' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
