import React, { useEffect, useState } from 'react';
import { Download, Award, Calendar, CheckCircle, FileText, Eye } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { certificateService } from '@/services/certificateService';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Certificate {
  id: string;
  applicationId: string;
  certificateNumber: string;
  formType: string;
  institutionName: string;
  issuedDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'revoked';
  downloadUrl: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const CertificatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await certificateService.getMyCertificates();

      if (response.success && response.data) {
        setCertificates(response.data as Certificate[]);
      }
    } catch (error) {
      toast.error('Failed to fetch certificates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (certificateId: string, downloadUrl: string) => {
    try {
      setDownloadingId(certificateId);

      const url = downloadUrl.startsWith('http')
        ? downloadUrl
        : `${API_BASE_URL}${downloadUrl}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}.pdf`;
      link.target = '_blank';
      link.click();

      toast.success('Certificate downloaded successfully');
    } catch (error) {
      toast.error('Failed to download certificate');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'expired':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'revoked':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Award className="h-8 w-8 mr-3 text-primary-600" />
            My Certificates
          </h1>
          <p className="mt-2 text-gray-600">
            View and download your issued certificates
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="h-10 w-10 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Certificates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {certificates.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-10 w-10 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-900">
                  {certificates.filter(c => c.status === 'expired').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Certificates</p>
                <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Your Certificates</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12">
              <Award className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No certificates yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Certificates will appear here once your applications are approved
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/applicant/applications')}>
                  View My Applications
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Certificate Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Award className="h-6 w-6 text-primary-600" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cert.institutionName}
                          </h3>
                          <p className="text-sm text-gray-600">{cert.formType}</p>
                        </div>
                      </div>

                      {/* Certificate Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Certificate Number</p>
                          <p className="text-sm font-medium text-gray-900 font-mono">
                            {cert.certificateNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Issued Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(cert.issuedDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(cert.validUntil)}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="inline-flex items-center">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            cert.status
                          )}`}
                        >
                          {cert.status === 'active' && (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          {cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applicant/applications/${cert.applicationId}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Application
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(cert.id, cert.downloadUrl)}
                        isLoading={downloadingId === cert.id}
                        disabled={cert.status === 'revoked'}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download PDF
                      </Button>
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {cert.status === 'active' && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> This certificate is valid until{' '}
                        {formatDate(cert.validUntil)}. Please ensure renewal before expiry.
                      </p>
                    </div>
                  )}

                  {cert.status === 'expired' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <strong>Certificate Expired:</strong> This certificate expired on{' '}
                        {formatDate(cert.validUntil)}. Please apply for renewal.
                      </p>
                    </div>
                  )}

                  {cert.status === 'revoked' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <strong>Certificate Revoked:</strong> This certificate has been revoked
                        and is no longer valid.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default CertificatesPage;
