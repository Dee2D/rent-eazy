'use client';

import { useRef, useState, useMemo, useEffect } from 'react';
import { MIN_IMAGES } from '@/lib/constants';
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '@/lib/security';

interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string | null;
}

export default function ImageUploader({ files, onChange, error }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => { previewUrls.forEach(URL.revokeObjectURL); }, [previewUrls]);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const errors: string[] = [];
    const valid: File[] = [];
    for (const f of Array.from(incoming)) {
      const err = validateImageFile(f);
      if (err) {
        errors.push(err);
      } else {
        valid.push(f);
      }
    }
    setSizeError(errors.length > 0 ? errors[0] : null);
    const merged = [...files, ...valid].slice(0, 20);
    onChange(merged);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-orange-400 bg-orange-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
        }`}
      >
        <p className="text-3xl mb-2">📷</p>
        <p className="text-sm font-medium text-stone-700">Click or drag images here</p>
        <p className="text-xs text-stone-400 mt-1">
          {files.length}/{MIN_IMAGES} minimum · up to 20 images · JPG, PNG, WebP · max 5 MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Validation indicator */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: MIN_IMAGES }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < files.length ? 'bg-green-500' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${files.length >= MIN_IMAGES ? 'text-green-600' : 'text-stone-400'}`}>
          {files.length >= MIN_IMAGES
            ? `✓ ${files.length} images ready`
            : `${MIN_IMAGES - files.length} more image${MIN_IMAGES - files.length === 1 ? '' : 's'} needed`}
        </span>
      </div>

      {sizeError && (
        <p className="text-xs text-amber-600">{sizeError}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Thumbnail grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-square group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
