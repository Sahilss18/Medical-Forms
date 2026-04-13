import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField, FormSection, DynamicForm } from '@/types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { FileUpload } from '../ui/FileUpload';
import { Button } from '../ui/Button';

interface FormRendererProps {
  form: DynamicForm;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onSaveDraft?: (data: Record<string, any>) => void | Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  showDraftButton?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
  form,
  initialData = {},
  onSubmit,
  onSaveDraft,
  isLoading = false,
  submitButtonText = 'Submit',
  showDraftButton = true,
}) => {
  // Build Zod schema dynamically
  const buildSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, any> = {};
    const conditionalFields = fields.filter((field) => field.conditional);

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

  // Get all fields, with safety check
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
  });

  const watchedValues = watch();

  // Early return after hooks
  if (!form || !form.sections || form.sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No form fields available</p>
      </div>
    );
  }

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

      case 'radio':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="space-y-2">
                  {field.options?.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        value={option.value}
                        name={formField.name}
                        checked={formField.value === option.value}
                        onChange={() => formField.onChange(option.value)}
                        onBlur={formField.onBlur}
                        ref={formField.ref}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
            )}
          />
        );

      case 'checkbox':
        return (
          <Controller
            key={field.id}
            name={field.name}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={Boolean(formField.value)}
                  onChange={(event) => formField.onChange(event.target.checked)}
                  onBlur={formField.onBlur}
                  name={formField.name}
                  ref={formField.ref}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {error && <p className="ml-6 mt-1 text-sm text-red-600">{error}</p>}
              </div>
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
                value={formField.value ?? ''}
                type={field.type}
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {form.sections.map((section: FormSection) => (
        <div key={section.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
            {section.description && (
              <p className="mt-1 text-sm text-gray-500">{section.description}</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.fields.map(renderField)}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end space-x-4">
        {showDraftButton && onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSaveDraft(watchedValues)}
            disabled={isLoading}
          >
            Save as Draft
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
};
