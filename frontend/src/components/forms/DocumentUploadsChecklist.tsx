import React from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { FileUpload } from '@/components/ui/FileUpload';
import { DocumentRequirement } from '@/constants/forms';

interface DocumentUploadsChecklistProps {
  documentRequirements: DocumentRequirement[];
  documentFiles: Record<string, File[]>;
  onFilesChange: (documentId: string, files: File[]) => void;
  getAllowedMimeTypes: (document: DocumentRequirement) => string[];
}

export const DocumentUploadsChecklist: React.FC<DocumentUploadsChecklistProps> = ({
  documentRequirements,
  documentFiles,
  onFilesChange,
  getAllowedMimeTypes,
}) => {
  if (documentRequirements.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-900">Document Checklist & Uploads</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload all requested documents for this form. Additional documents can be added per form.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {documentRequirements.map((document) => (
          <div key={document.id} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {document.name}
                  {document.mandatory && <span className="ml-1 text-red-500">*</span>}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{document.description}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Format: {document.format.join(', ')}</div>
                <div>Max: {document.maxSize}</div>
              </div>
            </div>

            <FileUpload
              label={document.mandatory ? 'Upload Required Document' : 'Upload Optional Document'}
              required={document.mandatory}
              value={documentFiles[document.id] || []}
              allowedTypes={getAllowedMimeTypes(document)}
              onChange={(files) => onFilesChange(document.id, files.slice(0, 1))}
              helpText={document.mandatory ? 'This document is mandatory.' : 'Optional, but recommended if applicable.'}
            />
          </div>
        ))}
      </CardBody>
    </Card>
  );
};