import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Application } from '@/types';
import { applicationService } from '@/services/applicationService';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { Button } from '@/components/ui/Button';
import { Download, FileText } from 'lucide-react';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const ApplicationTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchApplication(id);
    }
  }, [id]);

  const fetchApplication = async (appId: string) => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplicationById(appId);
      if (response.success && response.data) {
        setApplication(response.data);
      }
    } catch (error) {
      toast.error('Failed to load application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!id) return;
    try {
      const blob = await applicationService.downloadCertificate(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${id}.pdf`;
      link.click();
      toast.success('Certificate downloaded');
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <LoadingSkeleton count={3} height="h-32" className="mb-4" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Application Details</h1>
          <p className="mt-1 text-gray-600">ID: {application.id}</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Application Information</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Form Type</dt>
              <dd className="mt-1 text-sm text-gray-900">Form {application.formId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <StatusBadge status={application.status} />
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Submitted On</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {application.submittedAt ? formatDate(application.submittedAt) : 'Not submitted'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(application.updatedAt)}</dd>
            </div>
          </dl>

          {application.remarks && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800">Officer Remarks</h3>
              <p className="mt-1 text-sm text-yellow-700">{application.remarks}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Documents */}
      {application.documents.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Documents</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">Uploaded: {formatDate(doc.uploadedAt)}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Application Timeline</h2>
        </CardHeader>
        <CardBody>
          <Timeline events={application.timeline} />
        </CardBody>
      </Card>

      {/* Certificate Download */}
      {application.status === 'approved' && application.certificateUrl && (
        <Card>
          <CardBody>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-600 mb-4">
                Your application has been approved!
              </h3>
              <Button onClick={handleDownloadCertificate}>
                <Download className="h-5 w-5 mr-2" />
                Download Certificate
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ApplicationTracking;
