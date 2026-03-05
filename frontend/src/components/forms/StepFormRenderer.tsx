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
}

export const StepFormRenderer: React.FC<StepFormRendererProps> = ({
  form,
  initialData = {},
  onSubmit,
  onSaveDraft,
  isLoading = false,
  submitButtonText = 'Submit Application',
  showDraftButton = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Group fields into steps based on order_index ranges for Form 19
  const createSteps = (): FormStep[] => {
    const allFields = form?.sections?.flatMap((section) => section.fields) || [];
    
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

      schemaFields[field.name] = fieldSchema;
    });

    return z.object(schemaFields);
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
    const isValid = await trigger(currentStepFields);
    
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
          {currentStepData.fields.length > 0 ? (
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
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Step 1: Applicant Details - Completed
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Step 2: Premises Details - Completed
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Step 3: Drug Sale Details - Completed
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Step 4: Qualified Person Details - Completed
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Step 5: Document Uploads - Completed
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ All information has been submitted. Click "Proceed to Payment" to complete your application.
                </p>
              </div>
            </div>
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
