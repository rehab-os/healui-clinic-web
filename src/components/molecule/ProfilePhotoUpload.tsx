'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { 
  Camera, 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2,
  ImageIcon,
  Loader2,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import ApiManager from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface Photo {
  id: string;
  photoType: 'profile' | 'cover' | 'gallery';
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
}

interface ProfilePhotoUploadProps {
  profileId?: string;
  onPhotoUpdate?: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ profileId, onPhotoUpdate }) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{
    profilePhoto?: Photo;
    coverPhoto?: Photo;
    galleryPhotos: Photo[];
  }>({ galleryPhotos: [] });
  const [constraints, setConstraints] = useState<PhotoConstraints | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPhotoType, setSelectedPhotoType] = useState<'profile' | 'cover' | 'gallery'>('profile');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch photos and constraints on mount
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

  // Validate file before upload
  const validateFile = (file: File, photoType: 'profile' | 'cover' | 'gallery'): string | null => {
    // Basic safety checks - always keep these
    if (file.type && !file.type.startsWith('image/')) {
      return 'Please select an image file (JPEG, PNG, or WEBP).';
    }
    
    // TODO: UNCOMMENT IN PRODUCTION - Client-side validation for better UX
    /*
    if (!constraints) return 'Constraints not loaded';
    
    const constraint = constraints[photoType];
    
    // Check file size
    if (file.size > constraint.maxSize) {
      return `File size exceeds ${(constraint.maxSize / (1024 * 1024)).toFixed(1)}MB limit. Please compress your image or reduce its quality.`;
    }
    
    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !constraint.allowedFormats.includes(fileExt)) {
      return `File type not allowed. Please use: ${constraint.allowedFormats.join(', ').toUpperCase()} format`;
    }
    
    // Additional checks for common issues
    if (file.size < 50 * 1024) { // Less than 50KB
      return 'Image file seems too small. Please use a higher quality image.';
    }
    */
    
    return null;
  };

  // Auto-dismiss alerts after a delay
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Clear error after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 4000); // Clear success after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setError(null);
    setSuccess(null);
    
    // Validate file
    const validationError = validateFile(file, selectedPhotoType);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Create preview and check dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        // TODO: UNCOMMENT IN PRODUCTION - Client-side validation for better UX
        // Check image dimensions
        /*
        if (constraints) {
          const constraint = constraints[selectedPhotoType];
          if (img.width < constraint.minWidth || img.height < constraint.minHeight) {
            setError(`Image too small. Minimum size: ${constraint.minWidth}×${constraint.minHeight}px. Your image: ${img.width}×${img.height}px`);
            return;
          }
          
          // Check aspect ratio
          const aspectRatio = img.width / img.height;
          if (aspectRatio < constraint.aspectRatioRange.min || aspectRatio > constraint.aspectRatioRange.max) {
            setError(`Invalid aspect ratio. Expected between ${constraint.aspectRatioRange.min}:1 and ${constraint.aspectRatioRange.max}:1. Your image ratio: ${aspectRatio.toFixed(2)}:1`);
            return;
          }
        }
        */
        
        setPreviewImage(e.target?.result as string);
        // Upload file (backend validation will still catch issues)
        uploadPhoto(file, selectedPhotoType);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [selectedPhotoType, constraints]);

  // Upload photo
  const uploadPhoto = async (file: File, photoType: 'profile' | 'cover' | 'gallery') => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await ApiManager.uploadProfilePhoto(file, photoType);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (response.success) {
        setSuccess(`${photoType === 'profile' ? 'Profile' : photoType === 'cover' ? 'Cover' : 'Gallery'} photo uploaded successfully`);
        await fetchPhotos(); // Refresh photos
        onPhotoUpdate?.(); // Notify parent component
        
        // Clear preview after successful upload
        setTimeout(() => {
          setPreviewImage(null);
          setUploadProgress(0);
          setSuccess(null); // Clear success message after 3 seconds
        }, 3000);
      } else {
        // Display backend validation errors
        setError(response.message || 'Failed to upload photo');
        setPreviewImage(null); // Clear preview on error
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to upload photo';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      setPreviewImage(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete photo
  const handleDeletePhoto = async (photoType: 'profile' | 'cover' | 'gallery', photoId?: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      setLoading(true);
      const response = await ApiManager.deleteProfilePhoto(photoType, photoId);
      
      if (response.success) {
        setSuccess('Photo deleted successfully');
        await fetchPhotos();
        onPhotoUpdate?.();
      } else {
        setError(response.message || 'Failed to delete photo');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Handle different types of delete errors
      let errorMessage = 'Failed to delete photo';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Development Mode:</strong> Client-side validation is disabled for testing. 
            Backend validation is still active and will show errors after upload.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <div className="flex-1">
            <AlertDescription className="text-red-800 font-medium mb-2">
              {error}
            </AlertDescription>
            {/* Show helpful hints based on error type */}
            {error.includes('aspect ratio') && (
              <div className="text-red-700 text-sm">
                <p className="font-medium mb-1">💡 Helpful tips:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {selectedPhotoType === 'profile' && (
                    <>
                      <li>Profile photos should be nearly square (like 400×400px or 500×400px)</li>
                      <li>Try cropping your image to be more square-shaped</li>
                    </>
                  )}
                  {selectedPhotoType === 'cover' && (
                    <>
                      <li>Cover photos should be landscape (wide), like 1200×400px or 800×300px</li>
                      <li>Try using a wider image or crop it to be more rectangular</li>
                    </>
                  )}
                </ul>
              </div>
            )}
            {error.includes('too small') && (
              <div className="text-red-700 text-sm">
                <p className="font-medium mb-1">💡 Image too small:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use a higher resolution image</li>
                  <li>Minimum size: {selectedPhotoType === 'profile' ? '400×400px' : selectedPhotoType === 'cover' ? '800×300px' : '400×300px'}</li>
                </ul>
              </div>
            )}
            {error.includes('too large') && (
              <div className="text-red-700 text-sm">
                <p className="font-medium mb-1">💡 File size too large:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Compress your image or reduce its quality</li>
                  <li>Maximum size: {constraints && formatFileSize(constraints[selectedPhotoType]?.maxSize || 5242880)}</li>
                </ul>
              </div>
            )}
            {(error.includes('format') || error.includes('type')) && (
              <div className="text-red-700 text-sm">
                <p className="font-medium mb-1">💡 Invalid file format:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Use JPEG, PNG, or WEBP format</li>
                  <li>Avoid using GIF, BMP, or other formats</li>
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-600 hover:text-red-800 transition-colors self-start"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div className="flex items-center justify-between">
            <AlertDescription className="text-green-800 font-medium">
              {success}
            </AlertDescription>
            <button
              onClick={() => setSuccess(null)}
              className="ml-2 text-green-600 hover:text-green-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Alert>
      )}

      {/* Profile & Cover Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-48 h-48 mx-auto">
              {loading ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : photos.profilePhoto ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={photos.profilePhoto.url}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button
                    onClick={() => handleDeletePhoto('profile')}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity"
                    disabled={uploading}
                  >
                    <Trash2 className="h-6 w-6 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {constraints?.profile.description}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Max size: {constraints && formatFileSize(constraints.profile.maxSize)}</p>
                <p>Min size: {constraints?.profile.minWidth}×{constraints?.profile.minHeight}px</p>
                <p>Aspect ratio: {constraints?.profile.aspectRatioRange.min}:1 to {constraints?.profile.aspectRatioRange.max}:1 (nearly square)</p>
                <p>Formats: {constraints?.profile.allowedFormats.join(', ').toUpperCase()}</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedPhotoType('profile');
                  fileInputRef.current?.click();
                }}
                disabled={uploading || loading}
                size="sm"
                variant={photos.profilePhoto ? 'outline' : 'default'}
              >
                {uploading && selectedPhotoType === 'profile' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {photos.profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cover Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Cover Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative w-full h-32">
              {loading ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : photos.coverPhoto ? (
                <div className="relative w-full h-full group">
                  <Image
                    src={photos.coverPhoto.url}
                    alt="Cover"
                    fill
                    className="rounded-lg object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <button
                    onClick={() => handleDeletePhoto('cover')}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity"
                    disabled={uploading}
                  >
                    <Trash2 className="h-6 w-6 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                {constraints?.cover.description}
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <p>Max size: {constraints && formatFileSize(constraints.cover.maxSize)}</p>
                <p>Min size: {constraints?.cover.minWidth}×{constraints?.cover.minHeight}px</p>
                <p>Aspect ratio: {constraints?.cover.aspectRatioRange.min}:1 to {constraints?.cover.aspectRatioRange.max}:1 (landscape)</p>
                <p>Formats: {constraints?.cover.allowedFormats.join(', ').toUpperCase()}</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedPhotoType('cover');
                  fileInputRef.current?.click();
                }}
                disabled={uploading || loading}
                size="sm"
                variant={photos.coverPhoto ? 'outline' : 'default'}
              >
                {uploading && selectedPhotoType === 'cover' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {photos.coverPhoto ? 'Change Cover' : 'Upload Cover'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gallery Photos
            </span>
            <span className="text-sm font-normal text-gray-600">
              {photos.galleryPhotos.length} / {constraints?.gallery.maxCount || 10}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Existing gallery photos */}
            {photos.galleryPhotos.map((photo, index) => (
              <div key={photo.id} className="relative aspect-square group">
                <Image
                  src={photo.url}
                  alt={`Gallery ${index + 1}`}
                  fill
                  className="rounded-lg object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
                <button
                  onClick={() => handleDeletePhoto('gallery', photo.id)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity"
                  disabled={uploading}
                >
                  <Trash2 className="h-5 w-5 text-white" />
                </button>
              </div>
            ))}
            
            {/* Add new photo button */}
            {(!constraints || photos.galleryPhotos.length < constraints.gallery.maxCount) && (
              <button
                onClick={() => {
                  setSelectedPhotoType('gallery');
                  fileInputRef.current?.click();
                }}
                disabled={uploading || loading}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                {uploading && selectedPhotoType === 'gallery' ? (
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Add Photo</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              {constraints?.gallery.description}
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Max size per photo: {constraints && formatFileSize(constraints.gallery.maxSize)}</p>
              <p>Min size: {constraints?.gallery.minWidth}×{constraints?.gallery.minHeight}px</p>
              <p>Aspect ratio: {constraints?.gallery.aspectRatioRange.min}:1 to {constraints?.gallery.aspectRatioRange.max}:1 (flexible)</p>
              <p>Formats: {constraints?.gallery.allowedFormats.join(', ').toUpperCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      {uploading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uploading photo...</span>
            <span className="text-sm text-gray-600">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={!!previewImage && !uploading} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="relative w-full h-96">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePhotoUpload;