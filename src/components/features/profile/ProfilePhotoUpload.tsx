'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Camera,
  Upload,
  ImageIcon,
  Loader2,
  Trash2,
  PenLine,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import ApiManager from '@/services/api/api.service';
import { toast } from 'sonner';

interface Photo {
  id: string;
  photoType: 'profile' | 'cover' | 'gallery' | 'signature';
  url: string;
  caption?: string;
  uploadedAt: string;
  isVerified: boolean;
}

interface PhotoConstraints {
  profile: {
    maxSize: number;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    aspectRatioRange: { min: number; max: number };
    allowedFormats: string[];
    description: string;
  };
  cover: typeof PhotoConstraints.profile;
  gallery: typeof PhotoConstraints.profile & { maxCount: number };
  signature: typeof PhotoConstraints.profile;
}

interface ProfilePhotoUploadProps {
  profileId?: string;
  onPhotoUpdate?: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ profileId, onPhotoUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{
    profilePhoto?: Photo;
    coverPhoto?: Photo;
    galleryPhotos: Photo[];
    signature?: Photo;
  }>({ galleryPhotos: [] });
  const [constraints, setConstraints] = useState<PhotoConstraints | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPhotoTypeRef = useRef<'profile' | 'cover' | 'gallery' | 'signature'>('profile');

  React.useEffect(() => {
    fetchPhotos();
    fetchConstraints();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await ApiManager.getProfilePhotos();
      if (response.success && response.data) {
        setPhotos(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConstraints = async () => {
    try {
      const response = await ApiManager.getPhotoConstraints();
      if (response.success && response.data) {
        setConstraints(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch constraints:', error);
    }
  };

  const triggerUpload = (type: 'profile' | 'cover' | 'gallery' | 'signature') => {
    selectedPhotoTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const photoType = selectedPhotoTypeRef.current;

    if (file.type && !file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, or WEBP)');
      return;
    }

    await uploadPhoto(file, photoType);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const uploadPhoto = async (file: File, photoType: 'profile' | 'cover' | 'gallery' | 'signature') => {
    const typeLabels = { profile: 'Profile photo', cover: 'Cover photo', signature: 'Signature', gallery: 'Photo' };

    try {
      setUploading(true);
      setUploadingType(photoType);

      const response = await ApiManager.uploadProfilePhoto(file, photoType);

      if (response.success) {
        toast.success(`${typeLabels[photoType]} uploaded`);
        await fetchPhotos();
        onPhotoUpdate?.();
      } else {
        toast.error(response.message || `Failed to upload ${typeLabels[photoType].toLowerCase()}`);
      }
    } catch (error: any) {
      const msg = error?.message || error?.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadingType(null);
    }
  };

  const handleDeletePhoto = async (photoType: 'profile' | 'cover' | 'gallery' | 'signature', photoId?: string) => {
    if (!confirm('Delete this photo?')) return;

    try {
      setLoading(true);
      const response = await ApiManager.deleteProfilePhoto(photoType, photoId);

      if (response.success) {
        toast.success('Photo deleted');
        await fetchPhotos();
        onPhotoUpdate?.();
      } else {
        toast.error(response.message || 'Failed to delete photo');
      }
    } catch (error: any) {
      const msg = error?.message || error?.response?.data?.message || 'Delete failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isUploadingThis = (type: string) => uploading && uploadingType === type;

  // Reusable action buttons — visible on mobile, hover-only on desktop
  const PhotoActions = ({ onReplace, onDelete }: { onReplace: () => void; onDelete: () => void }) => (
    <>
      {/* Desktop: hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl transition-all duration-200 items-center justify-center gap-2 opacity-0 group-hover:opacity-100 hidden sm:flex">
        <button
          onClick={onReplace}
          disabled={uploading}
          className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={onDelete}
          disabled={uploading}
          className="p-2 bg-white/90 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </button>
      </div>
      {/* Mobile: buttons below the image */}
      <div className="flex sm:hidden gap-2 mt-2 justify-center">
        <button
          onClick={onReplace}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Replace
        </button>
        <button
          onClick={onDelete}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Remove
        </button>
      </div>
    </>
  );

  return (
    <div className="space-y-8">
      {/* Profile & Cover — Side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Photo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Profile Photo</h3>
            <span className="text-xs text-gray-400">Square crop</span>
          </div>
          <div className="relative group">
            <div className="relative w-full aspect-square max-w-[200px] sm:max-w-[240px] mx-auto">
              {loading ? (
                <div className="w-full h-full rounded-2xl bg-gray-100 animate-pulse" />
              ) : photos.profilePhoto ? (
                <>
                  <div className="relative w-full h-full">
                    <Image
                      src={photos.profilePhoto.url}
                      alt="Profile"
                      fill
                      className="rounded-2xl object-cover"
                      sizes="240px"
                    />
                    {isUploadingThis('profile') && (
                      <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                    <PhotoActions
                      onReplace={() => triggerUpload('profile')}
                      onDelete={() => handleDeletePhoto('profile')}
                    />
                  </div>
                </>
              ) : (
                <button
                  onClick={() => triggerUpload('profile')}
                  disabled={uploading}
                  className="w-full h-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#1e5f79]/40 bg-gray-50 hover:bg-[#eff8ff]/50 flex flex-col items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
                >
                  {isUploadingThis('profile') ? (
                    <Loader2 className="h-8 w-8 text-[#1e5f79] animate-spin" />
                  ) : (
                    <>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Upload Photo</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WEBP</p>
                      </div>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Cover Photo</h3>
            <span className="text-xs text-gray-400">Landscape, 3:1</span>
          </div>
          <div className="relative group">
            <div className="relative w-full aspect-[3/1]">
              {loading ? (
                <div className="w-full h-full rounded-xl bg-gray-100 animate-pulse" />
              ) : photos.coverPhoto ? (
                <>
                  <div className="relative w-full h-full">
                    <Image
                      src={photos.coverPhoto.url}
                      alt="Cover"
                      fill
                      className="rounded-xl object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    {isUploadingThis('cover') && (
                      <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    <PhotoActions
                      onReplace={() => triggerUpload('cover')}
                      onDelete={() => handleDeletePhoto('cover')}
                    />
                  </div>
                </>
              ) : (
                <button
                  onClick={() => triggerUpload('cover')}
                  disabled={uploading}
                  className="w-full h-full rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1e5f79]/40 bg-gray-50 hover:bg-[#eff8ff]/50 flex flex-col items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
                >
                  {isUploadingThis('cover') ? (
                    <Loader2 className="h-6 w-6 text-[#1e5f79] animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Upload Cover</p>
                        <p className="text-xs text-gray-400 mt-0.5">Wide landscape image</p>
                      </div>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Digital Signature</h3>
          <span className="text-xs text-gray-400">For prescriptions & reports</span>
        </div>
        <div className="relative group max-w-md">
          <div className="relative w-full aspect-[4/1]">
            {loading ? (
              <div className="w-full h-full rounded-lg bg-gray-100 animate-pulse" />
            ) : photos.signature ? (
              <>
                <div className="relative w-full h-full">
                  <Image
                    src={photos.signature.url}
                    alt="Signature"
                    fill
                    className="rounded-lg object-contain bg-white border border-gray-100"
                    sizes="400px"
                  />
                  {isUploadingThis('signature') && (
                    <div className="absolute inset-0 rounded-lg bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                  <PhotoActions
                    onReplace={() => triggerUpload('signature')}
                    onDelete={() => handleDeletePhoto('signature')}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => triggerUpload('signature')}
                disabled={uploading}
                className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 hover:border-[#1e5f79]/40 bg-gray-50 hover:bg-[#eff8ff]/50 flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
              >
                {isUploadingThis('signature') ? (
                  <Loader2 className="h-5 w-5 text-[#1e5f79] animate-spin" />
                ) : (
                  <>
                    <PenLine className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-600">Upload Signature</p>
                      <p className="text-xs text-gray-400">Wide format image</p>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Gallery</h3>
          <span className="text-xs text-gray-400">
            {photos.galleryPhotos.length} / {constraints?.gallery?.maxCount || 10} photos
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
          {photos.galleryPhotos.map((photo, index) => (
            <div key={photo.id} className="relative aspect-square group rounded-xl overflow-hidden">
              <Image
                src={photo.url}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              {/* Desktop: hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 items-center justify-center opacity-0 group-hover:opacity-100 hidden sm:flex">
                <button
                  onClick={() => handleDeletePhoto('gallery', photo.id)}
                  disabled={uploading}
                  className="p-2 bg-white/90 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
              {/* Mobile: persistent delete button */}
              <button
                onClick={() => handleDeletePhoto('gallery', photo.id)}
                disabled={uploading}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full sm:hidden"
              >
                <Trash2 className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}

          {(!constraints || photos.galleryPhotos.length < (constraints.gallery?.maxCount || 10)) && (
            <button
              onClick={() => triggerUpload('gallery')}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-[#1e5f79]/40 bg-gray-50 hover:bg-[#eff8ff]/50 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 disabled:opacity-50"
            >
              {isUploadingThis('gallery') ? (
                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-[#1e5f79] animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <span className="text-[10px] sm:text-xs text-gray-400">Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default ProfilePhotoUpload;
