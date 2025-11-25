import React, { useState, useCallback, DragEvent } from 'react';
import { useTranslations } from '../contexts/i18n';

interface ImageUploaderProps {
  value: string;
  onChange: (base64: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value, onChange }) => {
  const { t } = useTranslations();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
        return;
    }

    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;
    const QUALITY = 0.7;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Resize the image if it's too large, maintaining aspect ratio
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                // If context is not available, fallback to the original image
                onChange(e.target?.result as string);
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            
            // Check the original file type. If it's a PNG, export as PNG to preserve transparency.
            // Otherwise, convert to JPEG for efficient compression.
            const outputMimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const compressedBase64 = canvas.toDataURL(outputMimeType, QUALITY);
            onChange(compressedBase64);
        };
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleRemoveImage = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onChange('');
  }, [onChange]);

  if (value) {
    return (
      <div className="relative w-full h-48 rounded-lg overflow-hidden">
        <img src={value} alt="Preview" className="w-full h-full object-cover" />
        <button
          onClick={handleRemoveImage}
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label={t.imageUploader.remove}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
        isDragging ? 'border-viniela-gold bg-viniela-silver' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center text-viniela-gray">
            <i className="fa-solid fa-cloud-arrow-up fa-2x w-8 h-8 mb-4" aria-hidden="true"></i>
            <p className="mb-2 text-sm"><span className="font-semibold">{t.imageUploader.uploadCTA}</span> {t.imageUploader.dragAndDrop}</p>
            <p className="text-xs">{t.imageUploader.fileTypes}</p>
        </div>
      <input type="file" onChange={handleFileChange} accept="image/*" className="hidden" />
    </label>
  );
};

export default ImageUploader;