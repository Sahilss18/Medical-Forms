import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  MessageSquare,
  UserCheck,
  Building2,
  AlertCircle,
  Check,
  Eye,
} from 'lucide-react';
import { Application, DynamicForm, FormField } from '@/types';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { Textarea } from '@/components/ui/Textarea';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { AssignInspectorModal } from '@/components/officer/AssignInspectorModal';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface DocumentReview {
  [documentId: string]: 'verified' | 'needs_review' | 'pending';
}

const ApplicationReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<Application | null>(null);
  const [formDefinition, setFormDefinition] = useState<DynamicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [documentReviews, setDocumentReviews] = useState<DocumentReview>({});
  const [showReportPhotos, setShowReportPhotos] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await applicationService.getApplicationById(id);
      if (response.data) {
        setApplication(response.data);
        
        // Fetch form definition to get field labels
        if (response.data.formId) {
          try {
            const formResponse = await applicationService.getForm(response.data.formId);
            if (formResponse.data) {
              setFormDefinition(formResponse.data);
            }
          } catch (error) {
            console.error('Failed to fetch form definition:', error);
          }
        }
        
        // Initialize document reviews as pending
        const reviews: DocumentReview = {};
        response.data.documents.forEach(doc => {
          reviews[doc.id] = 'pending';
        });
        setDocumentReviews(reviews);
      }
    } catch (error) {
      toast.error('Failed to fetch application details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignInspector = async (
    inspectorId: string, 
    scheduledDate: string, 
    notes?: string,
    documentsToVerify?: Array<{ id: string; name: string; url: string; type: string }>
  ) => {
    if (!id) return;
    
    try {
      console.log('📋 Assigning inspector with:', {
        inspectorId,
        scheduledDate,
        notes,
        documentsCount: documentsToVerify?.length || 0,
      });

      await applicationService.assignInspector(
        id, 
        inspectorId, 
        scheduledDate,
        notes,
        documentsToVerify
      );
      
      toast.success('Inspector assigned successfully with document details');
      await fetchApplication();
    } catch (error) {
      throw error;
    }
  };

  const handleRequestClarification = async () => {
    if (!id || !remarks.trim()) {
      toast.error('Please enter clarification remarks');
      return;
    }

    try {
      setIsProcessing(true);
      await applicationService.requestClarification(id, remarks);
      toast.success('Clarification requested successfully');
      setRemarks('');
      await fetchApplication();
    } catch (error) {
      toast.error('Failed to request clarification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    
    if (!window.confirm('Are you sure you want to approve this application?')) {
      return;
    }

    try {
      setIsProcessing(true);
      await applicationService.makeDecision(id, 'approved', remarks);
      toast.success('Application approved successfully');
      navigate('/officer/dashboard');
    } catch (error) {
      toast.error('Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id || !remarks.trim()) {
      toast.error('Please enter rejection reason');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this application?')) {
      return;
    }

    try {
      setIsProcessing(true);
      await applicationService.makeDecision(id, 'rejected', remarks);
      toast.success('Application rejected');
      navigate('/officer/dashboard');
    } catch (error) {
      toast.error('Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocument = async (documentUrl: string) => {
    try {
      if (documentUrl) {
        // Construct full URL with API base URL
        const fullUrl = documentUrl.startsWith('http') 
          ? documentUrl 
          : `${API_BASE_URL}${documentUrl}`;
        window.open(fullUrl, '_blank');
      } else {
        toast.error('Document URL not available');
      }
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDocumentReview = (documentId: string, status: 'verified' | 'needs_review') => {
    setDocumentReviews(prev => ({
      ...prev,
      [documentId]: status,
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Application not found
        </h3>
        <div className="mt-6">
          <Button onClick={() => navigate('/officer/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/officer/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Application Review
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              ID: {application.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institution Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-primary-600" />
                <h2 className="text-xl font-semibold">Institution Information</h2>
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Institution ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {application.institutionId.slice(0, 8).toUpperCase()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Form Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{application.formId}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Submitted Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {application.submittedAt
                      ? formatDate(application.submittedAt)
                      : 'Not submitted'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(application.updatedAt)}
                  </dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Form Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary-600" />
                <h2 className="text-xl font-semibold">Application Details</h2>
              </div>
            </CardHeader>
            <CardBody>
              {Object.keys(application.formData).length === 0 ? (
                <p className="text-sm text-gray-500">No form data available</p>
              ) : (
                <div className="space-y-6">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(application.formData).map(([fieldName, value]) => {
                      // Find the field definition to get the label
                      const formFields = formDefinition?.sections?.flatMap((section) => section.fields) || [];
                      const fieldDef = formFields.find(
                        (f: FormField) => f.name === fieldName || f.id === fieldName,
                      );
                      const label = fieldDef?.label || 
                        fieldName.replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
                      
                      // Format value based on type
                      let displayValue = value;
                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Yes' : 'No';
                      } else if (value === null || value === undefined || value === '') {
                        displayValue = 'Not provided';
                      } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value, null, 2);
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <div key={fieldName} className="border-b border-gray-100 pb-3">
                          <dt className="text-sm font-semibold text-gray-700 mb-1">
                            {label}
                            {fieldDef?.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {typeof value === 'object' && value !== null ? (
                              <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                {displayValue}
                              </pre>
                            ) : (
                              <span className={`${
                                displayValue === 'Not provided' ? 'text-gray-400 italic' : ''
                              }`}>
                                {displayValue}
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Submitted Documents</h2>
                <span className="text-sm text-gray-500">
                  {application.documents.length} document(s)
                </span>
              </div>
            </CardHeader>
            <CardBody>
              {application.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No documents uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Application can be approved without document verification
                  </p>
                </div>
              ) : (
                <>
                  {/* Review Summary Bar */}
                  <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                    <div className="flex space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">
                          <strong>{application.documents.filter(d => documentReviews[d.id] === 'verified').length}</strong> Verified
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-gray-700">
                          <strong>{application.documents.filter(d => documentReviews[d.id] === 'needs_review').length}</strong> Need Review
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-gray-700">
                          <strong>{application.documents.filter(d => !documentReviews[d.id] || documentReviews[d.id] === 'pending').length}</strong> Pending
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {application.documents.map((doc) => {
                      const reviewStatus = documentReviews[doc.id] || 'pending';
                      return (
                        <div
                          key={doc.id}
                          className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                            reviewStatus === 'verified'
                              ? 'border-green-200 bg-green-50'
                              : reviewStatus === 'needs_review'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <FileText className={`h-8 w-8 ${
                              reviewStatus === 'verified'
                                ? 'text-green-600'
                                : reviewStatus === 'needs_review'
                                ? 'text-yellow-600'
                                : 'text-gray-400'
                            }`} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024).toFixed(2)} KB • {doc.type} • 
                                Uploaded on {formatDate(doc.uploadedAt)}
                              </p>
                              {reviewStatus === 'verified' && (
                                <p className="text-xs text-green-600 font-medium mt-1 flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </p>
                              )}
                              {reviewStatus === 'needs_review' && (
                                <p className="text-xs text-yellow-600 font-medium mt-1 flex items-center">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Needs Verification
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDocument(doc.url)}
                              title="View/Download"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {reviewStatus !== 'verified' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleDocumentReview(doc.id, 'verified')}
                                title="Mark as Verified"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {reviewStatus !== 'needs_review' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                onClick={() => handleDocumentReview(doc.id, 'needs_review')}
                                title="Mark for Inspection"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Application Timeline</h2>
            </CardHeader>
            <CardBody>
              <Timeline events={application.timeline} />
            </CardBody>
          </Card>

          {/* Inspector Report */}
          {application.inspection && (
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-primary-600" />
                  <h2 className="text-xl font-semibold">Inspection Report</h2>
                </div>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Inspector</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {application.inspection.inspector?.name || 'Not assigned'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Employee Code</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {application.inspection.inspector?.employeeCode || 'N/A'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Inspection Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {String(application.inspection.status || 'N/A').replace(/_/g, ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Report Submitted</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {application.inspection.report?.submittedAt
                        ? formatDate(application.inspection.report.submittedAt)
                        : 'Not submitted yet'}
                    </dd>
                  </div>
                </dl>

                {application.inspection.report ? (
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Inspector Recommendation</h3>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        {(application.inspection.report.recommendation || 'clarification').replace(/_/g, ' ')}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">Observations</h3>
                      <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                        {application.inspection.report.observations || 'No observations provided.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">Checklist Items</h3>
                        <p className="mt-1 text-sm text-gray-700">
                          {application.inspection.report.checklistItems?.length || 0}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">Photos Uploaded</h3>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-sm text-gray-700">
                            {application.inspection.report.photos?.length || 0}
                          </p>
                          {(application.inspection.report.photos?.length || 0) > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowReportPhotos((prev) => !prev)}
                            >
                              {showReportPhotos ? 'Hide' : 'View'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {showReportPhotos && (application.inspection.report.photos?.length || 0) > 0 && (
                      <div className="rounded-md border border-gray-200 bg-white p-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Submitted Photos</h4>
                        <div className="space-y-2">
                          {application.inspection.report.photos?.map((photo, index) => {
                            const photoUrl = photo.url?.startsWith('http')
                              ? photo.url
                              : `${API_BASE_URL}${photo.url}`;

                            return (
                              <div key={photo.id || `${photo.name}-${index}`} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700 truncate pr-4">{photo.name || `Photo ${index + 1}`}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(photoUrl, '_blank')}
                                >
                                  Open
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Inspector assigned, but report is not submitted yet.
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Actions</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              {(() => {
                // Normalize status for comparison (handle both uppercase and lowercase)
                const normalizedStatus = application.status?.toLowerCase();
                const isInitialReview = ['draft', 'submitted', 'under_scrutiny', 'scrutiny'].includes(normalizedStatus);
                const isInspectionStage = ['inspection_assigned'].includes(normalizedStatus);
                const isPostInspection = ['inspection_completed', 'decision_pending'].includes(normalizedStatus);
                
                if (isInitialReview || isInspectionStage) {
                  // Initial review or inspection assigned - allow actions
                  const docsNeedingReview = application.documents.filter(
                    doc => documentReviews[doc.id] === 'needs_review'
                  ).length;
                  const hasDocuments = application.documents.length > 0;
                  const mustInspect = docsNeedingReview > 0;

                  return (
                    <>
                      {mustInspect ? (
                        // If documents need verification, must assign inspector
                        <>
                          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-3">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-amber-900 mb-1">
                                  Inspection Required
                                </p>
                                <p className="text-xs text-amber-800">
                                  {docsNeedingReview} document(s) marked for verification. 
                                  This application must be assigned to an inspector for site visit.
                                </p>
                              </div>
                            </div>
                          </div>
                          <Button
                            className="w-full"
                            onClick={() => setShowAssignModal(true)}
                          >
                            <UserCheck className="h-5 w-5 mr-2" />
                            {isInspectionStage ? 'Re-assign Inspector' : 'Assign Inspector for Verification'}
                          </Button>
                        </>
                      ) : (
                        // All documents verified or no documents - officer can choose
                        <>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                            <p className="text-xs text-blue-800 font-medium mb-2">
                              {hasDocuments ? (
                                <span className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                  All documents verified. Choose action:
                                </span>
                              ) : (
                                'Choose action:'
                              )}
                            </p>
                            <div className="space-y-2">
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700"
                                onClick={handleApprove}
                                isLoading={isProcessing}
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Approve Directly
                              </Button>
                              <p className="text-xs text-gray-600 text-center">or</p>
                              <Button
                                className="w-full"
                                onClick={() => setShowAssignModal(true)}
                              >
                                <UserCheck className="h-5 w-5 mr-2" />
                                {isInspectionStage ? 'Re-assign Inspector' : 'Assign for Inspection'}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleRequestClarification}
                        isLoading={isProcessing}
                      >
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Request Clarification
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        isLoading={isProcessing}
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Application
                      </Button>
                    </>
                  );
                } else if (isPostInspection) {
                  // After inspection - final decision
                  return (
                    <>
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={handleApprove}
                        isLoading={isProcessing}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Approve Application
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleReject}
                        isLoading={isProcessing}
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Application
                      </Button>
                    </>
                  );
                } else {
                  // For approved/rejected/clarification statuses
                  return (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        No actions available for this status
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Status: {application.status}
                      </p>
                    </div>
                  );
                }
              })()}
            </CardBody>
          </Card>

          {/* Remarks */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Remarks</h2>
            </CardHeader>
            <CardBody>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your remarks here..."
                rows={6}
              />
              <p className="mt-2 text-xs text-gray-500">
                Required for rejection and clarification requests
              </p>
            </CardBody>
          </Card>

          {/* Current Remarks */}
          {application.remarks && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Current Remarks</h2>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {application.remarks}
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Inspector Modal */}
      <AssignInspectorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        applicationId={application.id}
        onAssign={handleAssignInspector}
        documentReviews={documentReviews}
        documents={application.documents}
      />
    </div>
  );
};

export default ApplicationReview;
