import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getFormById, DocumentRequirement } from '@/constants/forms';
import {
  ArrowLeft,
  ArrowRight,
  FileCheck,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

const FormRequirements: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [checkedDocuments, setCheckedDocuments] = useState<Set<string>>(new Set());
  const [isConfirmed, setIsConfirmed] = useState(false);

  const form = formId ? getFormById(formId) : null;

  if (!form) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
              <p className="text-gray-600 mb-6">The requested form could not be found.</p>
              <Button onClick={() => navigate('/applicant/forms')}>Back to Form Catalog</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const mandatoryDocs = form.documentRequirements.filter((doc) => doc.mandatory);
  const optionalDocs = form.documentRequirements.filter((doc) => !doc.mandatory);
  const allMandatoryChecked = mandatoryDocs.every((doc) => checkedDocuments.has(doc.id));

  const toggleDocument = (docId: string) => {
    const newChecked = new Set(checkedDocuments);
    if (newChecked.has(docId)) {
      newChecked.delete(docId);
    } else {
      newChecked.add(docId);
    }
    setCheckedDocuments(newChecked);
  };

  const handleProceed = () => {
    if (!allMandatoryChecked) {
      toast.error('Please confirm you have all mandatory documents');
      return;
    }

    if (!isConfirmed) {
      toast.error('Please confirm that you have reviewed all requirements');
      return;
    }

    // Navigate to the actual form filling page
    navigate(`/applicant/forms/${form.code}/fill`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/applicant/forms')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Form Catalog
        </Button>

        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-blue-100 mb-2">Form {form.code}</div>
              <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
              <p className="text-blue-100 text-lg">{form.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Estimated Time</span>
              </div>
              <div className="text-xl font-bold">{form.estimatedTime}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="w-5 h-5" />
                <span className="text-sm font-medium">Application Fees</span>
              </div>
              <div className="text-xl font-bold">{form.fees}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-5 h-5" />
                <span className="text-sm font-medium">Documents</span>
              </div>
              <div className="text-xl font-bold">{form.documentRequirements.length} Required</div>
            </div>
          </div>

          {form.requiresInspection && (
            <div className="mt-4 bg-amber-500/20 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-200 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-100">Inspection Required</div>
                <div className="text-sm text-amber-100 mt-1">
                  This application requires a physical inspection of your premises. An inspector will
                  be assigned after initial document verification.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Important Information */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardBody>
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Before You Start</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Keep all required documents ready in digital format (PDF/JPG)</li>
                <li>Ensure all documents are clear and legible</li>
                <li>File sizes should not exceed the specified limits</li>
                <li>All information provided should be accurate and verifiable</li>
                <li>You can save your application as draft and complete it later</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Document Requirements */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-xl font-bold text-gray-900">Document Checklist</h2>
          <p className="text-gray-600 mt-1">
            Please ensure you have all the following documents before proceeding
          </p>
        </CardHeader>
        <CardBody>
          {/* Mandatory Documents */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-red-600">*</span>
              Mandatory Documents ({mandatoryDocs.length})
            </h3>
            <div className="space-y-3">
              {mandatoryDocs.map((doc) => (
                <DocumentChecklistItem
                  key={doc.id}
                  document={doc}
                  checked={checkedDocuments.has(doc.id)}
                  onToggle={() => toggleDocument(doc.id)}
                />
              ))}
            </div>
          </div>

          {/* Optional Documents */}
          {optionalDocs.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Optional Documents ({optionalDocs.length})
              </h3>
              <div className="space-y-3">
                {optionalDocs.map((doc) => (
                  <DocumentChecklistItem
                    key={doc.id}
                    document={doc}
                    checked={checkedDocuments.has(doc.id)}
                    onToggle={() => toggleDocument(doc.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Confirmation */}
      <Card className="mb-6">
        <CardBody>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                I confirm that I have reviewed all requirements
              </div>
              <div className="text-sm text-gray-600 mt-1">
                I understand that providing false information or incomplete documents may lead to
                rejection of my application. I have all the required documents ready to upload.
              </div>
            </div>
          </label>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" onClick={() => navigate('/applicant/forms')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              toast.success('Document checklist downloaded');
              // TODO: Implement actual download functionality
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Checklist
          </Button>

          <Button
            onClick={handleProceed}
            disabled={!allMandatoryChecked || !isConfirmed}
            className="flex items-center gap-2"
          >
            Proceed to Application Form
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!allMandatoryChecked && (
        <div className="mt-4 text-center text-sm text-amber-600">
          Please confirm you have all mandatory documents to proceed
        </div>
      )}
    </div>
  );
};

// Document Checklist Item Component
const DocumentChecklistItem: React.FC<{
  document: DocumentRequirement;
  checked: boolean;
  onToggle: () => void;
}> = ({ document, checked, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        checked
          ? 'border-green-500 bg-green-50'
          : document.mandatory
          ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {checked ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold text-gray-900">
              {document.name}
              {document.mandatory && <span className="text-red-600 ml-1">*</span>}
            </h4>
            {!document.mandatory && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Optional</span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{document.description}</p>

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span className="font-medium">Format:</span>
              <span>{document.format.join(', ')}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Max Size:</span>
              <span>{document.maxSize}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormRequirements;
