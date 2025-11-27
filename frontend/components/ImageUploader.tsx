import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

const API_BASE = 'http://localhost:4000';

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);

      const res = await fetch(`${API_BASE}/api/team/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.error || `Gagal upload gambar (status ${res.status})`;
        throw new Error(msg);
      }

      const data = await res.json();
      // kita pakai field url dari response
      if (data.url) {
        onChange(data.url);
      } else if (data.path) {
        // fallback kalau cuma path
        onChange(`${API_BASE}${data.path}`);
      }
    } catch (err) {
      console.error('Upload gambar gagal:', err);
      alert(err instanceof Error ? err.message : 'Gagal upload gambar');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <img
          src={value}
          alt="Foto anggota tim"
          className="w-20 h-20 rounded-full object-cover border border-gray-200"
        />
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="btn-secondary text-sm"
      >
        {isUploading ? 'Mengunggah...' : value ? 'Ganti Foto' : 'Unggah Foto'}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ImageUploader;
