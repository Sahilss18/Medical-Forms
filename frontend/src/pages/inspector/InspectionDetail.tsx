import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate } from '@/utils/helpers';
import { inspectionService } from '@/services/inspectionService';
import toast from 'react-hot-toast';
import { FileText, Download, AlertCircle, MapPin, Phone, User } from 'lucide-react';

type DocumentToVerify = {
  id: string;
  name: string;
  url: string;
  type: string;
  needsVerification?: boolean;
};

type InspectionItem = {
  id: string;
  applicationId: string;
  institutionName?: string;
  district?: string;
  scheduledDate: string;
  status: 'assigned' | 'in_progress' | 'completed';
  contactPerson?: string;
  contactPhone?: string;
  specialInstructions?: string;
  documentsToVerify?: DocumentToVerify[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const InspectionDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [inspection, setInspection] = useState<InspectionItem | null>(null);

  useEffect(() => {
    const loadInspection = async () => {
      if (!id) {
        return;
      }

      try {
        const response = await inspectionService.getInspectionById(id);
        if (response.success && response.data) {
          const payload = response.data as any;
          setInspection({
            ...payload,
            specialInstructions: payload.specialInstructions ?? payload.special_instructions,
            documentsToVerify: Array.isArray(payload.documentsToVerify)
              ? payload.documentsToVerify
              : Array.isArray(payload.documents_to_verify)
              ? payload.documents_to_verify
              : [],
          } as InspectionItem);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load inspection details');
      }
    };

    loadInspection();
  }, [id]);

  const handleDownload = (documentUrl: string, documentName: string) => {
    const fullUrl = documentUrl.startsWith('http') ? documentUrl : `${API_BASE_URL}${documentUrl}`;
    console.log('📥 Downloading document:', fullUrl);
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = documentName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Document download started');
  };

  const handleStartInspection = async () => {
    if (!id) return;
    
    try {
      const response = await inspectionService.startInspection(id);
      if (response.success) {
        toast.success('Inspection started');
        setInspection((prev) => prev ? { ...prev, status: 'in_progress' } : null);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to start inspection');
    }
  };

  if (!inspection) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Inspection Detail</h1>
        <p className="text-gray-600">Loading inspection details...</p>
      </div>
    );
  }

  const documentsToVerify = inspection.documentsToVerify || [];
  const hasDocuments = documentsToVerify.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspection Detail</h1>
          <p className="mt-2 text-gray-600">Review inspection information and proceed to report submission.</p>
        </div>
        <div className="flex gap-2">
          {inspection.status === 'assigned' && (
            <Button variant="outline" onClick={handleStartInspection}>
              Start Inspection
            </Button>
          )}
          <Button onClick={() => navigate(`/inspector/inspections/${inspection.id}/report`)}>
            {inspection.status === 'completed' ? 'View Report' : 'Submit Report'}
          </Button>
        </div>
      </div>

      {/* Special Instructions */}
      {inspection.specialInstructions && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h2 className="text-xl font-semibold text-gray-900">Special Instructions from Officer</h2>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{inspection.specialInstructions}</p>
          </CardBody>
        </Card>
      )}

      {/* Documents for Pre-Inspection Review */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Documents for Pre-Inspection Review</h2>
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              {documentsToVerify.length} document{documentsToVerify.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {hasDocuments ? (
            <div className="space-y-3">
              {documentsToVerify.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.type}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc.url, doc.name)}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              No documents were attached by the officer/applicant for this assignment.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Institution & Contact Information */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Institution & Contact Information</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Institution Name</p>
                <p className="font-medium text-gray-900">{inspection.institutionName || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">District</p>
                <p className="font-medium text-gray-900">{inspection.district || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Contact Person</p>
                <p className="font-medium text-gray-900">{inspection.contactPerson || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-gray-500">Contact Phone</p>
                <p className="font-medium text-gray-900">{inspection.contactPhone || 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Inspection Details */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Inspection Details</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Inspection ID</p>
              <p className="font-medium text-gray-900">{inspection.id}</p>
            </div>
            <div>
              <p className="text-gray-500">Application ID</p>
              <p className="font-medium text-gray-900">{inspection.applicationId}</p>
            </div>
            <div>
              <p className="text-gray-500">Scheduled Date</p>
              <p className="font-medium text-gray-900">{formatDate(inspection.scheduledDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <StatusBadge status={inspection.status === 'assigned' ? 'inspection_assigned' : inspection.status === 'in_progress' ? 'under_scrutiny' : 'inspection_completed'} />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Inspection Guidelines */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Inspection Guidelines</h2>
        </CardHeader>
        <CardBody>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>Verify all documents marked for review</li>
            <li>Conduct physical inspection of storage facilities</li>
            <li>Interview qualified practitioners and verify credentials</li>
            <li>Check compliance with NDPS Act regulations</li>
            <li>Document observations with photos if possible</li>
            <li>Submit comprehensive report with recommendations</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
};

export default InspectionDetail;
