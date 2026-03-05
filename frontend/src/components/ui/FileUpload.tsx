import React, { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn, formatFileSize, validateFile } from '@/utils/helpers';
import { Button } from './Button';

interface FileUploadProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  value?: File[];
  onChange: (files: File[]) => void;
  onRemove?: (index: number) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  helpText,
  required = false,
  maxSize = 5 * 1024 * 1024,
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  multiple = false,
  value = [],
  onChange,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setUploadError('');
    const validFiles: File[] = [];

    for (const file of files) {
      const validation = validateFile(file, maxSize, allowedTypes);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        setUploadError(validation.error || 'Invalid file');
        return;
      }
    }

    if (multiple) {
      onChange([...value, ...validFiles]);
    } else {
      onChange(validFiles.slice(0, 1));
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
    if (onRemove) onRemove(index);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400',
          (error || uploadError) && 'border-red-500'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Select File{multiple && 's'}
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            or drag and drop file{multiple && 's'} here
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleChange}
        />
      </div>

      {helpText && !error && !uploadError && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      {(error || uploadError) && (
        <p className="mt-1 text-sm text-red-600">{error || uploadError}</p>
      )}

      {value.length > 0 && (
        <div className="mt-4 space-y-2">
          {value.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-4 text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
