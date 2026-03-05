import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type PhotoMetadata = {
  file: File;
  preview: string;
  description?: string;
};

type PhotoUploadProps = {
  photos: PhotoMetadata[];
  onChange: (photos: PhotoMetadata[]) => void;
  maxPhotos?: number;
  maxSizeMB?: number;
  readOnly?: boolean;
};

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onChange,
  maxPhotos = 10,
  maxSizeMB = 5,
  readOnly = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|heic|webp)$/)) {
      return 'Only image files (JPEG, PNG, HEIC, WebP) are allowed';
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    if (file.size > maxSize) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    // Check if we're at the limit
    if (photos.length >= maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    const newPhotos: PhotoMetadata[] = [];

    for (let i = 0; i < fileList.length; i++) {
      if (photos.length + newPhotos.length >= maxPhotos) {
        setError(`Maximum ${maxPhotos} photos allowed`);
        break;
      }

      const file = fileList[i];
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview, description: '' });
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (readOnly) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    // Revoke the object URL to free memory
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    onChange(newPhotos);
    setError(null);
  };

  const updateDescription = (index: number, description: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], description };
    onChange(newPhotos);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Inspection Photos (Optional)
            </h3>
          </div>
          <span className="text-sm text-gray-600">
            {photos.length} / {maxPhotos} photos
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Upload Area */}
          {!readOnly && photos.length < maxPhotos && (
            <div
              onDrop={handleDrop}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/heic,image/webp"
                onChange={handleFileInputChange}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <Upload className="w-12 h-12 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, HEIC, WebP (max {maxSizeMB}MB each)
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Choose Files
                </Button>
              </label>
            </div>
          )}

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white"
                >
                  {/* Photo Preview */}
                  <div className="relative aspect-video bg-gray-100">
                    <img
                      src={photo.preview}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Photo Info */}
                  <div className="p-3">
                    <p className="text-xs text-gray-500 mb-2">
                      {photo.file.name} ({(photo.file.size / 1024).toFixed(0)} KB)
                    </p>
                    {!readOnly ? (
                      <textarea
                        value={photo.description || ''}
                        onChange={(e) => updateDescription(index, e.target.value)}
                        placeholder="Add description (e.g., storage facility view, practitioner ID verification)"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                    ) : (
                      photo.description && (
                        <p className="text-sm text-gray-700">{photo.description}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Helper Text */}
          {photos.length === 0 && !readOnly && (
            <p className="text-sm text-gray-500 text-center">
              Upload photos as evidence of your physical inspection (optional but recommended)
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default PhotoUpload;
