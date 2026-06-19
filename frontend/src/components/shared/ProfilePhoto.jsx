import React, { useRef, useState } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../api/axios';

const API_BASE = 'http://localhost:5000';

/**
 * Reusable profile photo component for all roles.
 * Props:
 *   currentPhoto  – path string or null
 *   onUpdate      – (newPhotoPath | null) => void
 *   endpoint      – API endpoint for upload (default /users/profile/photo)
 *   deleteEndpoint– API endpoint for delete (default /users/profile/photo)
 *   size          – 'sm' | 'md' | 'lg'
 */
export default function ProfilePhoto({
  currentPhoto,
  onUpdate,
  endpoint       = '/users/profile/photo',
  deleteEndpoint = '/users/profile/photo',
  size           = 'lg',
}) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSize = { sm: 20, md: 28, lg: 36 }[size];

  const photoUrl = preview
    ? preview
    : currentPhoto
    ? `${API_BASE}/${currentPhoto}`
    : null;

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload
    const form = new FormData();
    form.append('photo', file);
    setUploading(true);
    try {
      const { data } = await API.post(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const path = data.profilePhoto || data.pandit?.profilePhoto || data.user?.profilePhoto;
      setPreview(null);
      onUpdate && onUpdate(path);
      toast.success('Profile photo updated!');
    } catch (err) {
      setPreview(null);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    setUploading(true);
    try {
      await API.delete(deleteEndpoint);
      setPreview(null);
      onUpdate && onUpdate(null);
      toast.success('Photo removed');
    } catch {
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Photo circle */}
      <div className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-4 border-saffron-200 bg-saffron-50`}>
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={iconSize} className="text-saffron-300" />
          </div>
        )}

        {/* Camera overlay */}
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full"
        >
          <Camera size={iconSize / 2} className="text-white" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs bg-saffron-500 text-white px-3 py-1.5 rounded-lg hover:bg-saffron-600 transition-colors disabled:opacity-50"
        >
          <Camera size={12} />
          {uploading ? 'Uploading...' : currentPhoto ? 'Change Photo' : 'Upload Photo'}
        </button>

        {(currentPhoto || preview) && (
          <button
            onClick={handleRemove}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
            Remove
          </button>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
