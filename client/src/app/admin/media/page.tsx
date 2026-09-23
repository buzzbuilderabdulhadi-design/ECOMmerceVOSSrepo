'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '@/services/admin';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';

interface MediaItem {
  id: string;
  url: string;
  altText: string;
  fileName: string;
  folder: string;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({ altText: '', folder: '' });
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(async () => {
    try {
      const data = await adminApi.getMedia(folder || undefined);
      setMedia(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const openUpload = () => {
    setFile(null);
    setUploadForm({ altText: '', folder: '' });
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choose a file to upload');
      return;
    }
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('altText', uploadForm.altText || file.name);
      if (uploadForm.folder) payload.append('folder', uploadForm.folder);
      await adminApi.uploadMedia(payload);
      toast.success('File uploaded');
      setShowUpload(false);
      setFile(null);
      setUploadForm({ altText: '', folder: '' });
      loadMedia();
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
        || (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteMedia(id);
      toast.success('File deleted');
      setMedia(prev => prev.filter(m => m.id !== id));
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete file');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Media Library</h1>
          <p className="text-sm text-slate mt-1">{media.length} files</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={folder} onChange={e => setFolder(e.target.value)} className="rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none">
            <option value="">All Folders</option>
            <option value="products">Products</option>
            <option value="banners">Banners</option>
            <option value="avatars">Avatars</option>
          </select>
          <button onClick={openUpload} className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
            Upload
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="rounded-xl border border-sage-light/30 bg-white p-12 text-center">
          <p className="text-slate">No media files yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {media.map(item => (
            <div key={item.id} className="group relative rounded-xl border border-sage-light/30 bg-white overflow-hidden">
              <div className="aspect-square bg-sage-light/10 flex items-center justify-center">
                {item.mimeType?.startsWith('image/') ? (
                  <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="h-10 w-10 text-slate/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-navy truncate">{item.altText || item.fileName || 'Untitled'}</p>
                <p className="text-[10px] text-slate truncate">{item.folder || 'Unsorted'}</p>
              </div>
              <button onClick={() => setDeleteId(item.id)}
                aria-label={`Delete ${item.altText || item.fileName}`}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <Modal open={showUpload} title="Upload Media" onClose={() => setShowUpload(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            {file && (
              <p className="mt-1 text-xs text-slate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Alt Text</label>
            <input type="text" value={uploadForm.altText} onChange={e => setUploadForm(f => ({ ...f, altText: e.target.value }))}
              className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Folder</label>
            <input type="text" value={uploadForm.folder} onChange={e => setUploadForm(f => ({ ...f, folder: e.target.value }))}
              className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" placeholder="e.g. products" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowUpload(false)} className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10">Cancel</button>
            <button onClick={handleUpload} disabled={uploading}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete File"
        message="Are you sure you want to delete this file from the media library?"
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}