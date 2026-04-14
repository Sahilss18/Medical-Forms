import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, DynamicForm } from '@/types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { FileUpload } from '../ui/FileUpload';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { DocumentUploadsChecklist } from './DocumentUploadsChecklist';
import { DocumentRequirement } from '@/constants/forms';

interface FormStep {
  title: string;
  description: string;
  fields: FormField[];
  stepNumber: number;
}

interface StepFormRendererProps {
  form: DynamicForm;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onSaveDraft?: (data: Record<string, any>) => void | Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  showDraftButton?: boolean;
  documentRequirements?: DocumentRequirement[];
  documentFiles?: Record<string, File[]>;
  onDocumentFilesChange?: (documentId: string, files: File[]) => void;
  getAllowedMimeTypes?: (document: DocumentRequirement) => string[];
}

export const StepFormRenderer: React.FC<StepFormRendererProps> = ({
  form,
  initialData = {},
  onSubmit,
  onSaveDraft,
  isLoading = false,
  submitButtonText = 'Submit Application',
  showDraftButton = true,
  documentRequirements = [],
  documentFiles = {},
  onDocumentFilesChange,
  getAllowedMimeTypes = () => [],
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Group fields into steps based on order_index ranges for Form 19
  const createSteps = (): FormStep[] => {
    const allFields = form?.sections?.flatMap((section) => section.fields) || [];
    const formCode = form?.code?.toUpperCase();

    if (formCode === '19A') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Applicant Details',
          description: 'Enter applicant and contact information',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 4),
        },
        {
          stepNumber: 2,
          title: 'Drug Types & Area',
          description: 'Provide drug type and area of operation details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 5 && f.order_index <= 8),
        },
        {
          stepNumber: 3,
          title: 'Premises & Storage',
          description: 'Enter premises, vendor and storage details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 9 && f.order_index <= 12),
        },
        {
          stepNumber: 4,
          title: 'Supplier Details',
          description: 'Provide supplier and itinerant vendor information',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 13 && f.order_index <= 16),
        },
        {
          stepNumber: 5,
          title: 'Document Uploads',
          description: 'Upload all required documents and certificates',
          fields: [],
        },
        {
          stepNumber: 6,
          title: 'Declaration & Signature',
          description: 'Confirm declaration and digital signature',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 17 && f.order_index <= 18),
        },
        {
          stepNumber: 7,
          title: 'Review & Payment',
          description: 'Review your application and proceed to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 5 || step.stepNumber === 7);
    }

    if (formCode === '19B') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Licence Type',
          description: 'Select the applicable licence type',
          fields: allFields.filter((f) => f.order_index === 1),
        },
        {
          stepNumber: 2,
          title: 'Applicant Details',
          description: 'Enter applicant contact and identification details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 2 && f.order_index <= 5),
        },
        {
          stepNumber: 3,
          title: 'Premises Details',
          description: 'Provide the premises and storage details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 6 && f.order_index <= 9),
        },
        {
          stepNumber: 4,
          title: 'Competent Person Details',
          description: 'Required only if the selected licence type is Retail',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 10 && f.order_index <= 12),
        },
        {
          stepNumber: 5,
          title: 'Document Uploads',
          description: 'Upload the form-specific mandatory documents',
          fields: [],
        },
        {
          stepNumber: 6,
          title: 'Declaration & Signature',
          description: 'Confirm declaration and digital signature',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 13 && f.order_index <= 15),
        },
        {
          stepNumber: 7,
          title: 'Review & Payment',
          description: 'Review the completed application before proceeding to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 5 || step.stepNumber === 7);
    }

    if (formCode === '19C') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Licence Type',
          description: 'Select the applicable licence type',
          fields: allFields.filter((f) => f.order_index === 1),
        },
        {
          stepNumber: 2,
          title: 'Applicant Details',
          description: 'Enter applicant details and contact information',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 2 && f.order_index <= 5),
        },
        {
          stepNumber: 3,
          title: 'Pharmacy Premises',
          description: 'Provide pharmacy and premises address details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 6 && f.order_index <= 8),
        },
        {
          stepNumber: 4,
          title: 'Qualified Person Details',
          description: 'Required only if licence type is Retail',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 9 && f.order_index <= 11),
        },
        {
          stepNumber: 5,
          title: 'Schedule X Drug Details',
          description: 'Enter details of Schedule X drugs proposed for sale',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 12 && f.order_index <= 14),
        },
        {
          stepNumber: 6,
          title: 'Storage Details',
          description: 'Provide special storage details if required',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 15 && f.order_index <= 17),
        },
        {
          stepNumber: 7,
          title: 'Document Uploads',
          description: 'Upload all mandatory supporting documents',
          fields: [],
        },
        {
          stepNumber: 8,
          title: 'Declaration & Submit',
          description: 'Confirm details and declaration before submission',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 18 && f.order_index <= 20),
        },
        {
          stepNumber: 9,
          title: 'Review & Payment',
          description: 'Review application and proceed to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 7 || step.stepNumber === 9);
    }

    if (formCode === '24') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Applicant Details',
          description: 'Enter applicant name, address and contact details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 4),
        },
        {
          stepNumber: 2,
          title: 'Manufacturing Premises',
          description: 'Provide manufacturing premises address, area and layout details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 5 && f.order_index <= 8),
        },
        {
          stepNumber: 3,
          title: 'Drug Details',
          description: 'Enter drug details and categories as per Schedule M',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 9 && f.order_index <= 12),
        },
        {
          stepNumber: 4,
          title: 'Technical Staff Details',
          description: 'Provide technical staff name, qualification and experience details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 13 && f.order_index <= 16),
        },
        {
          stepNumber: 5,
          title: 'Document Uploads',
          description: 'Upload premises plan and all supporting documents',
          fields: [],
        },
        {
          stepNumber: 6,
          title: 'Declaration & Submit',
          description: 'Confirm details and declaration before submission',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 17 && f.order_index <= 19),
        },
        {
          stepNumber: 7,
          title: 'Review & Payment',
          description: 'Review application and proceed to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 5 || step.stepNumber === 7);
    }

    if (formCode === '24A') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Loan Licensee Information',
          description: 'Enter loan licensee name, address and contact details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 4),
        },
        {
          stepNumber: 2,
          title: 'Manufacturing Concern Details',
          description: 'Provide the manufacturing concern unit name, address and existing licence number',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 5 && f.order_index <= 7),
        },
        {
          stepNumber: 3,
          title: 'Drugs to be Manufactured',
          description: 'Enter details of drugs, categories, dosage forms and manufacturing capacity',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 8 && f.order_index <= 11),
        },
        {
          stepNumber: 4,
          title: 'Expert Staff Qualifications',
          description: 'Provide expert staff name, qualification, experience and registration details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 12 && f.order_index <= 15),
        },
        {
          stepNumber: 5,
          title: 'Document Uploads',
          description: 'Upload manufacturing concern licence, agreement letter, consent letter, GMP certificate, labels and expert staff qualifications',
          fields: [],
        },
        {
          stepNumber: 6,
          title: 'Declaration & Confirmation',
          description: 'Confirm declaration and provide digital signature',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 16 && f.order_index <= 18),
        },
        {
          stepNumber: 7,
          title: 'Review & Payment',
          description: 'Review the loan manufacturing licence application and proceed to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 5 || step.stepNumber === 7);
    }

    if (formCode === '24B') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Drug & Premises Details',
          description: 'Enter repacking drug details and premises information',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 10),
        },
        {
          stepNumber: 2,
          title: 'Document Uploads',
          description: 'Upload repacking facility and supporting documents',
          fields: [],
        },
        {
          stepNumber: 3,
          title: 'Declaration & Submit',
          description: 'Confirm details and declaration before submission',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 11 && f.order_index <= 13),
        },
        {
          stepNumber: 4,
          title: 'Review & Submit',
          description: 'Review application and submit for validation, inspection and review',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 2 || step.stepNumber === 4);
    }

    if (formCode === '24C') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Product & Staff Details',
          description: 'Enter homoeopathic product details and expert staff details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 10),
        },
        {
          stepNumber: 2,
          title: 'Document Uploads',
          description: 'Upload homoeopathic manufacturing supporting documents',
          fields: [],
        },
        {
          stepNumber: 3,
          title: 'Declaration & Submit',
          description: 'Confirm details and declaration before submission',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 11 && f.order_index <= 13),
        },
        {
          stepNumber: 4,
          title: 'Review & Submit',
          description: 'Review application and submit for validation, inspection and review',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 2 || step.stepNumber === 4);
    }

    if (formCode === '24F') {
      const steps: FormStep[] = [
        {
          stepNumber: 1,
          title: 'Drug & Premises Details',
          description: 'Enter Schedule X drug manufacturing and premises details',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 12),
        },
        {
          stepNumber: 2,
          title: 'Document Uploads',
          description: 'Upload Schedule X compliance and security documents',
          fields: [],
        },
        {
          stepNumber: 3,
          title: 'Declaration & Submit',
          description: 'Confirm details and declaration before submission',
          fields: allFields.filter((f) => f.order_index !== undefined && f.order_index >= 13 && f.order_index <= 15),
        },
        {
          stepNumber: 4,
          title: 'Review & Payment',
          description: 'Review application and proceed to payment',
          fields: [],
        },
      ];

      return steps.filter((step) => step.fields.length > 0 || step.stepNumber === 2 || step.stepNumber === 4);
    }
    
    // Define step ranges
    const steps: FormStep[] = [
      {
        stepNumber: 1,
        title: 'Applicant Details',
        description: 'Enter your personal and business information',
        fields: allFields.filter(f => f.order_index !== undefined && f.order_index >= 1 && f.order_index <= 5),
      },
      {
        stepNumber: 2,
        title: 'Premises Details',
        description: 'Provide information about your business premises',
        fields: allFields.filter(f => f.order_index !== undefined && f.order_index >= 6 && f.order_index <= 9),
      },
      {
        stepNumber: 3,
        title: 'Drug Sale Details',
        description: 'Specify the type of drugs and license details',
        fields: allFields.filter(f => f.order_index !== undefined && f.order_index >= 10 && f.order_index <= 12),
      },
      {
        stepNumber: 4,
        title: 'Qualified Person Details',
        description: 'Provide pharmacist/qualified person information',
        fields: allFields.filter(f => f.order_index !== undefined && f.order_index >= 13 && f.order_index <= 17),
      },
      {
        stepNumber: 5,
        title: 'Document Uploads',
        description: 'Upload all required documents and certificates',
        fields: allFields.filter(f => f.order_index !== undefined && f.order_index >= 18 && f.order_index <= 27),
      },
      {
        stepNumber: 6,
        title: 'Review & Payment',
        description: 'Review your application and proceed to payment',
        fields: [], // No form fields, just review and payment
      },
    ];

    return steps.filter(step => step.fields.length > 0 || step.stepNumber === 6);
  };

  const steps = createSteps();

  // Build Zod schema dynamically
  const buildSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, any> = {};

    fields.forEach((field) => {
      let fieldSchema: any;

      switch (field.type) {
        case 'email':
          fieldSchema = z.string().email('Invalid email address');
          break;
        case 'number':
          fieldSchema = z.coerce.number();
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min);
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max);
          }
          break;
        case 'tel':
          fieldSchema = z.string().regex(/^[0-9]{10}$/, 'Invalid phone number');
          break;
        case 'file':
          fieldSchema = z.any();
          break;
        case 'date':
          fieldSchema = z.string();
          break;
        case 'select':
          fieldSchema = z.string();
          break;
        default:
          fieldSchema = z.string();
          if (field.validation?.minLength) {
            fieldSchema = fieldSchema.min(field.validation.minLength);
          }
          if (field.validation?.maxLength) {
            fieldSchema = fieldSchema.max(field.validation.maxLength);
          }
          if (field.validation?.pattern) {
            fieldSchema = fieldSchema.regex(
              new RegExp(field.validation.pattern),
              'Invalid format'
            );
          }
      }

      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      } else {
        // For required fields, ensure they have a value (not empty string)
        if (field.type === 'select' || field.type === 'text' || field.type === 'date') {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        }
      }

      if (field.conditional) {
        fieldSchema = fieldSchema.optional();
      }

      schemaFields[field.name] = fieldSchema;
    });

    const conditionalFields = fields.filter((field) => field.conditional);
    return z.object(schemaFields).superRefine((data, ctx) => {
      conditionalFields.forEach((field) => {
        const conditionValue = data[field.conditional!.field];
        if (conditionValue === field.conditional!.value) {
          const fieldValue = data[field.name];
          const isEmpty =
            fieldValue === undefined ||
            fieldValue === null ||
            fieldValue === '' ||
            (Array.isArray(fieldValue) && fieldValue.length === 0);

          if (isEmpty) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [field.name],
              message: `${field.label} is required`,
            });
          }
        }
      });
    });
  };

  const allFields = form?.sections?.flatMap((section) => section.fields) || [];
  const validationSchema = buildSchema(allFields);

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialData,
    mode: 'onChange',
  });

  const watchedValues = watch();

  if (!form || !form.sections || form.sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No form fields available</p>
      </div>
    );
  }

  const handleNext = async () => {
    // Validate current step fields
    const currentStepFields = steps[currentStep].fields.map(f => f.name);
    const isValid = currentStepFields.length === 0 ? true : await trigger(currentStepFields);
    
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDraftSave = async () => {
    const data = watchedValues;
    if (onSaveDraft) {
      await onSaveDraft(data);
    }
  };

  const shouldShowField = (field: FormField): boolean => {
    if (!field.conditional) return true;

    const conditionValue = watchedValues[field.conditional.field];
    return conditionValue === field.conditional.value;
  };

  const renderField = (field: FormField) => {
    if (!shouldShowField(field)) return null;

    const error = errors[field.name]?.message as string | undefined;

    switch (field.type) {
      case 'textarea':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Textarea
                {...formField}
                value={formField.value ?? ''}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                error={error}
                helpText={field.helpText}
              />
            )}
          />
        );

      case 'select':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Select
                {...formField}
                value={formField.value ?? ''}
                onChange={(e) => {
                  formField.onChange(e);
                  // Trigger validation after selection
                  setTimeout(() => trigger(field.name), 0);
                }}
                label={field.label}
                options={field.options || []}
                placeholder={field.placeholder || 'Select an option'}
                required={field.required}
                error={error}
                helpText={field.helpText}
              />
            )}
          />
        );

      case 'file':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <FileUpload
                label={field.label}
                required={field.required}
                error={error}
                helpText={field.helpText}
                value={formField.value || []}
                onChange={formField.onChange}
              />
            )}
          />
        );

      case 'date':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                type="date"
                value={formField.value ?? ''}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                error={error}
                helpText={field.helpText}
              />
            )}
          />
        );

      default:
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <Input
                {...formField}
                type={field.type}
                value={formField.value ?? ''}
                label={field.label}
                placeholder={field.placeholder}
                required={field.required}
                error={error}
                helpText={field.helpText}
              />
            )}
          />
        );
    }
  };

  const currentStepData = steps[currentStep];
  const visibleCurrentStepFields = currentStepData.fields.filter((field) => shouldShowField(field));
  const isReviewStep = /review/i.test(currentStepData.title);
  const isFeePaymentStep = /fee payment/i.test(currentStepData.title);

  // Safety check - if no steps are available, show error
  if (!steps || steps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No form fields available for this application</p>
      </div>
    );
  }

  // Safety check - if current step data is not available
  if (!currentStepData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invalid step. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Progress Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="relative flex items-center w-full">
                {index > 0 && (
                  <div
                    className={`flex-1 h-1 transition-colors ${
                      index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index < currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : index === currentStep
                      ? 'bg-white border-blue-600 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.stepNumber}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 transition-colors ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-xs font-medium ${
                    index === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Step {currentStepData.stepNumber}: {currentStepData.title}
          </h2>
          <p className="text-gray-600 mt-2">{currentStepData.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStepData.title === 'Document Uploads' && documentRequirements.length > 0 ? (
            <DocumentUploadsChecklist
              documentRequirements={documentRequirements}
              documentFiles={documentFiles}
              onFilesChange={(documentId, files) => onDocumentFilesChange?.(documentId, files)}
              getAllowedMimeTypes={getAllowedMimeTypes}
            />
          ) : visibleCurrentStepFields.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentStepData.fields.map((field) => (
                <div
                  key={field.id}
                  className={field.type === 'textarea' || field.type === 'file' ? 'md:col-span-2' : ''}
                >
                  {renderField(field)}
                </div>
              ))}
            </div>
          ) : (
            isReviewStep ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Review Your Application</h3>
                  <p className="text-blue-700 mb-4">
                    Please review all the information you've provided before proceeding to payment.
                    You can go back to any previous step to make changes if needed.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {steps
                        .filter((step) => step.stepNumber !== currentStepData.stepNumber)
                        .map((step) => (
                          <li key={step.stepNumber} className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Step {step.stepNumber}: {step.title} - Completed
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    ✓ All information has been submitted. Click "Proceed to Payment" to complete your application.
                  </p>
                </div>
              </div>
            ) : isFeePaymentStep ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Fee Payment</h3>
                <p className="text-sm text-amber-800">
                  Review the fee details and continue. The payment modal will open when you complete the final submission step.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
                No additional details are required for the selected licence type. Click Next to continue.
              </div>
            )
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              {showDraftButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDraftSave}
                  disabled={isLoading}
                >
                  Save Draft
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {submitButtonText}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
