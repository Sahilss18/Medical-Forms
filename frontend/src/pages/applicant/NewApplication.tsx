import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationService } from '@/services/applicationService';
import { institutionService } from '@/services/institutionService';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { StepFormRenderer } from '@/components/forms/StepFormRenderer';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { DynamicForm } from '@/types';
import { Building2, MapPin, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { getFormByCode, DocumentRequirement } from '@/constants/forms';
import PaymentModal from '@/components/payment/PaymentModal';
import toast from 'react-hot-toast';

interface InstitutionProfile {
  institutionName: string;
  registrationNumber: string;
  institutionType: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPerson: string;
  email: string;
  phone: string;
  establishedYear: string;
  licenseNumber?: string;
}

const NewApplication: React.FC = () => {
  const { formCode } = useParams<{ formCode?: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [institutionProfile, setInstitutionProfile] = useState<InstitutionProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<Record<string, File[]>>({});

  const formCodeToUse = formCode || '3F';
  const noPaymentFormCodes = ['24B', '24C', '3F', 'BSC'];
  const requiresPayment = !noPaymentFormCodes.includes(formCodeToUse.toUpperCase());
  const formMetadata = getFormByCode(formCodeToUse);
  const documentRequirements = formMetadata?.documentRequirements || [];
  const getAllowedMimeTypes = (document: DocumentRequirement): string[] => {
    return document.format.map((format) => {
      const upper = format.toUpperCase();
      if (upper === 'PDF') return 'application/pdf';
      if (upper === 'JPG' || upper === 'JPEG') return 'image/jpeg';
      if (upper === 'PNG') return 'image/png';
      if (upper === 'DOC') return 'application/msword';
      if (upper === 'DOCX') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      if (upper === 'XLS') return 'application/vnd.ms-excel';
      if (upper === 'XLSX') {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      return 'application/octet-stream';
    });
  };
  // Parse fees (remove ₹ and commas, convert to number)
  const feeAmount = formMetadata?.fees
    ? parseFloat(formMetadata.fees.replace(/[₹,]/g, ''))
    : 5000;

  useEffect(() => {
    fetchData();
  }, [formCode]);

  useEffect(() => {
    setDocumentFiles({});
  }, [formCodeToUse]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch institution profile from API
      const institutionResponse = await institutionService.getMyInstitution();
      if (institutionResponse.success && institutionResponse.data) {
        setInstitutionProfile({
          institutionName: institutionResponse.data.institutionName,
          registrationNumber: institutionResponse.data.registrationNumber,
          institutionType: institutionResponse.data.institutionType,
          addressLine1: institutionResponse.data.addressLine1,
          addressLine2: institutionResponse.data.addressLine2,
          city: institutionResponse.data.city,
          state: institutionResponse.data.state,
          pincode: institutionResponse.data.pincode,
          contactPerson: institutionResponse.data.contactPerson,
          email: institutionResponse.data.email,
          phone: institutionResponse.data.phone,
          establishedYear: institutionResponse.data.establishedYear,
          licenseNumber: institutionResponse.data.licenseNumber,
        });
      }

      // Fetch form - use formCode from URL param or default to '3F'
      const formCodeToUse = formCode || '3F';
      const response = await applicationService.getForm(formCodeToUse);
      if (response.success && response.data) {
        setForm(response.data);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        toast.error('Please complete Institution Profile first');
      } else {
        toast.error('Failed to load form');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      
      // Separate files from other form data
      const files: { field: string; file: File }[] = [];
      const formDataWithoutFiles: Record<string, any> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          files.push({ field: key, file: value });
        } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          // Handle multiple files
          value.forEach((file: File) => {
            files.push({ field: key, file });
          });
        } else {
          formDataWithoutFiles[key] = value;
        }
      });

      const requiredDocuments = documentRequirements.filter((doc) => doc.mandatory);
      const missingRequiredDocuments = requiredDocuments.filter(
        (doc) => !(documentFiles[doc.id]?.length > 0),
      );

      if (missingRequiredDocuments.length > 0) {
        toast.error(
          `Please upload required documents: ${missingRequiredDocuments.map((doc) => doc.name).join(', ')}`,
        );
        setIsSubmitting(false);
        return;
      }

      const checklistUploads = documentRequirements
        .flatMap((doc) =>
          (documentFiles[doc.id] || []).slice(0, 1).map((file) => ({
            file,
            documentType: doc.name,
          })),
        );

          console.log(
            '📤 Submitting application with',
            Object.keys(formDataWithoutFiles).length,
            'fields and',
            files.length + checklistUploads.length,
            'files',
          );
      
      // First, create a draft application
      const response = await applicationService.createApplication({
        formId: formCodeToUse,
        formData: formDataWithoutFiles,
        status: 'draft',
      });

      if (!response.success || !response.data) {
        toast.error('Failed to create application. Please try again.');
        return;
      }

      const applicationId = response.data.id;
      console.log('✅ Application created:', applicationId);
      
      // Upload files if any
      const allUploads = [
        ...files.map(({ field, file }) => ({ file, documentType: field })),
        ...checklistUploads,
      ];

      if (allUploads.length > 0) {
        console.log('📎 Uploading', allUploads.length, 'documents...');
        toast.loading(`Uploading ${allUploads.length} document(s)...`, { id: 'upload-progress' });
        
        let uploadedCount = 0;
        for (const { file, documentType } of allUploads) {
          try {
            await applicationService.uploadDocument(applicationId, file, documentType);
            uploadedCount++;
            console.log('✅ Uploaded:', file.name);
            toast.loading(`Uploaded ${uploadedCount}/${allUploads.length} documents...`, { id: 'upload-progress' });
          } catch (error) {
            console.error('❌ Failed to upload', file.name, error);
            toast.error(`Failed to upload ${file.name}`);
          }
        }
        
        toast.success(`All documents uploaded successfully!`, { id: 'upload-progress' });
        
        // Wait a moment for user to see the success message
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        toast.success('Application created successfully!');
      }
      
      // Store the draft ID
      setDraftApplicationId(applicationId);

      if (requiresPayment) {
        // Show payment modal after documents are uploaded
        setShowPaymentModal(true);
      } else {
        const submitResponse = await applicationService.submitApplication(applicationId);
        if (submitResponse.success) {
          toast.success('Application submitted successfully.');
          navigate('/applicant/applications');
        } else {
          toast.error('Failed to submit application. Please try again.');
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (_paymentId: string, applicationId?: string) => {
    try {
      // Submit the application after successful payment
      const appIdToSubmit = applicationId || draftApplicationId;
      
      if (appIdToSubmit) {
        const submitResponse = await applicationService.submitApplication(appIdToSubmit);
        if (submitResponse.success) {
          toast.success('Payment successful! Application submitted.');
          navigate('/applicant/applications');
        }
      }
    } catch (error: any) {
      toast.error('Payment successful but failed to submit application. Please contact support.');
    }
  };

  const handleSaveDraft = async (data: Record<string, any>) => {
    try {
      const formCodeToUse = formCode || '3F';
      
      // Separate files from other form data
      const files: { field: string; file: File }[] = [];
      const formDataWithoutFiles: Record<string, any> = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          files.push({ field: key, file: value });
        } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
          value.forEach((file: File) => {
            files.push({ field: key, file });
          });
        } else {
          formDataWithoutFiles[key] = value;
        }
      });

      const checklistUploads = documentRequirements
        .flatMap((doc) =>
          (documentFiles[doc.id] || []).slice(0, 1).map((file) => ({
            file,
            documentType: doc.name,
          })),
        );
      
      const response = await applicationService.createApplication({
        formId: formCodeToUse,
        formData: formDataWithoutFiles,
        status: 'draft',
      });

      if (response.success && response.data) {
        const applicationId = response.data.id;
        
        // Upload files if any
        const allUploads = [
          ...files.map(({ field, file }) => ({ file, documentType: field })),
          ...checklistUploads,
        ];

        if (allUploads.length > 0) {
          for (const { file, documentType } of allUploads) {
            try {
              await applicationService.uploadDocument(applicationId, file, documentType);
            } catch (error) {
              console.error('Failed to upload', file.name, error);
            }
          }
        }
        
        toast.success('Draft saved successfully!');
        navigate('/applicant/applications');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save draft');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Institution Profile Reference - Read Only */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 mr-3 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Institution Profile</h2>
                <p className="text-sm text-gray-600">This information will be automatically included in your application</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <LoadingSkeleton count={3} height="h-8" className="mb-3" />
          ) : institutionProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Institution Name</p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.institutionName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Registration Number</p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.institutionType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Address
                  </p>
                  <p className="text-base text-gray-900 mt-1">
                    {institutionProfile.addressLine1}
                    {institutionProfile.addressLine2 && `, ${institutionProfile.addressLine2}`}
                    <br />
                    {institutionProfile.city}, {institutionProfile.state} - {institutionProfile.pincode}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Contact Person</p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.contactPerson}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Phone
                  </p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Established Year
                  </p>
                  <p className="text-base text-gray-900 mt-1">{institutionProfile.establishedYear}</p>
                </div>
                {institutionProfile.licenseNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Existing License
                    </p>
                    <p className="text-base text-gray-900 mt-1">{institutionProfile.licenseNumber}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Please complete your institution profile first</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Application Form - Practitioner Details & Documents */}
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gray-900">
            {form ? `New Application - ${form.name}` : 'New Application'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Provide required details and upload documents
          </p>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <LoadingSkeleton count={5} height="h-12" className="mb-4" />
          ) : form ? (
            ['19', '19A', '19B', '19C', '20', '21', '24', '24A', '24B', '24C', '24F', '27', '27A', '27B', '27C', '27D', '27DA', '27F', '30', '31', '31A', '36', '3F', 'BSC', '14A', '44'].includes(form?.code || formCodeToUse) ? (
              <StepFormRenderer
                form={form}
                onSubmit={handleSubmit}
                onSaveDraft={handleSaveDraft}
                isLoading={isSubmitting}
                submitButtonText={requiresPayment ? 'Proceed to Payment' : 'Submit Application'}
                showDraftButton
                documentRequirements={documentRequirements}
                documentFiles={documentFiles}
                onDocumentFilesChange={(documentId, files) =>
                  setDocumentFiles((previous) => ({
                    ...previous,
                    [documentId]: files,
                  }))
                }
                getAllowedMimeTypes={getAllowedMimeTypes}
              />
            ) : (
              <FormRenderer
                form={form}
                onSubmit={handleSubmit}
                onSaveDraft={handleSaveDraft}
                isLoading={isSubmitting}
                submitButtonText="Proceed to Payment"
                showDraftButton
                documentRequirements={documentRequirements}
                documentFiles={documentFiles}
                onDocumentFilesChange={(documentId, files) =>
                  setDocumentFiles((previous) => ({
                    ...previous,
                    [documentId]: files,
                  }))
                }
                getAllowedMimeTypes={getAllowedMimeTypes}
              />
            )
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Form not available</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setIsSubmitting(false);
        }}
        formCode={formCodeToUse}
        amount={feeAmount * 100} // Convert to paise for Razorpay
        applicationId={draftApplicationId || undefined}
        onSuccess={handlePaymentSuccess}
        userDetails={{
          name: institutionProfile?.contactPerson,
          email: institutionProfile?.email,
          phone: institutionProfile?.phone,
        }}
      />
    </div>
  );
};

export default NewApplication;
