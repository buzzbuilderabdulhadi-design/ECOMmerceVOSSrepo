'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import axiosInstance from '@/services/axios';
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
  const [uploadForm, setUploadForm] = useState({ url: '', altText: '', folder: '' });
  const [uploading, setUploading] = useState(false);

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

  const handleUpload = async () => {
    if (!uploadForm.url || !uploadForm.altText) {
      toast.error('URL and alt text are required');
      return;
    }
    setUploading(true);
    try {
      await axiosInstance.post('/admin/media/upload', uploadForm);
      toast.success('File uploaded');
      setShowUpload(false);
      setUploadForm({ url: '', altText: '', folder: '' });
      loadMedia();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await adminApi.deleteMedia(id);
      toast.success('File deleted');
      setMedia(prev => prev.filter(m => m.id !== id));
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
          <button onClick={() => setShowUpload(true)} className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
            Upload
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-6">
          <h3 className="text-lg font-semibold text-navy mb-4">Upload Media</h3>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">URL *</label>
              <input type="url" value={uploadForm.url} onChange={e => setUploadForm(f => ({ ...f, url: e.target.value }))}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Alt Text *</label>
              <input type="text" value={uploadForm.altText} onChange={e => setUploadForm(f => ({ ...f, altText: e.target.value }))}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Folder</label>
              <input type="text" value={uploadForm.folder} onChange={e => setUploadForm(f => ({ ...f, folder: e.target.value }))}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" placeholder="e.g. products" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpload} disabled={uploading}
                className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light disabled:opacity-50 transition-colors">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button onClick={() => setShowUpload(false)} className="rounded-full border border-sage-light/40 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-navy hover:bg-sage-light/10 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
