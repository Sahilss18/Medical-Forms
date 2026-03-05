import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Save, Edit2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { institutionService } from '@/services/institutionService';
import toast from 'react-hot-toast';

const institutionSchema = z.object({
  institutionName: z.string().min(3, 'Institution name must be at least 3 characters'),
  registrationNumber: z.string().min(5, 'Registration number is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  contactPerson: z.string().min(3, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  institutionType: z.enum(['hospital', 'clinic', 'pharmacy', 'research_lab', 'other']),
  establishedYear: z.string().regex(/^\d{4}$/, 'Invalid year'),
  licenseNumber: z.string().optional(),
});

type InstitutionFormData = z.infer<typeof institutionSchema>;

const InstitutionProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      institutionName: '',
      registrationNumber: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      contactPerson: '',
      email: '',
      phone: '',
      institutionType: 'hospital',
      establishedYear: '',
      licenseNumber: '',
    },
  });

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        setIsLoading(true);
        const response = await institutionService.getMyInstitution();
        if (response.success && response.data) {
          reset({
            institutionName: response.data.institutionName || '',
            registrationNumber: response.data.registrationNumber || '',
            addressLine1: response.data.addressLine1 || '',
            addressLine2: response.data.addressLine2 || '',
            city: response.data.city || '',
            state: response.data.state || '',
            pincode: response.data.pincode || '',
            contactPerson: response.data.contactPerson || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            institutionType: (response.data.institutionType || 'hospital') as InstitutionFormData['institutionType'],
            establishedYear: response.data.establishedYear || '',
            licenseNumber: response.data.licenseNumber || '',
          });
        }
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          toast.error('Failed to load institution profile');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstitution();
  }, [reset]);

  const onSubmit = async (data: InstitutionFormData) => {
    try {
      setIsSaving(true);
      await institutionService.updateMyInstitution(data);
      toast.success('Institution profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const institutionTypes = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'research_lab', label: 'Research Laboratory' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-primary-600" />
            Institution Profile
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your medical institution information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Institution Details</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading institution profile...</div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register('institutionName')}
                  label="Institution Name"
                  placeholder="Enter institution name"
                  error={errors.institutionName?.message}
                  disabled={!isEditing}
                  required
                />
                <Input
                  {...register('registrationNumber')}
                  label="Registration Number"
                  placeholder="Enter registration number"
                  error={errors.registrationNumber?.message}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  {...register('institutionType')}
                  label="Institution Type"
                  options={institutionTypes}
                  error={errors.institutionType?.message}
                  disabled={!isEditing}
                  required
                />
                <Input
                  {...register('establishedYear')}
                  label="Established Year"
                  placeholder="YYYY"
                  error={errors.establishedYear?.message}
                  disabled={!isEditing}
                  required
                />
              </div>

              <Input
                {...register('licenseNumber')}
                label="Existing License Number (if any)"
                placeholder="Enter license number"
                error={errors.licenseNumber?.message}
                disabled={!isEditing}
              />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Address Information
              </h3>
              <Input
                {...register('addressLine1')}
                label="Address Line 1"
                placeholder="Street address"
                error={errors.addressLine1?.message}
                disabled={!isEditing}
                required
              />
              <Input
                {...register('addressLine2')}
                label="Address Line 2"
                placeholder="Apartment, suite, etc. (optional)"
                error={errors.addressLine2?.message}
                disabled={!isEditing}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  {...register('city')}
                  label="City"
                  placeholder="Enter city"
                  error={errors.city?.message}
                  disabled={!isEditing}
                  required
                />
                <Input
                  {...register('state')}
                  label="State"
                  placeholder="Enter state"
                  error={errors.state?.message}
                  disabled={!isEditing}
                  required
                />
                <Input
                  {...register('pincode')}
                  label="Pincode"
                  placeholder="6-digit pincode"
                  error={errors.pincode?.message}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Contact Information
              </h3>
              <Input
                {...register('contactPerson')}
                label="Contact Person"
                placeholder="Full name"
                error={errors.contactPerson?.message}
                disabled={!isEditing}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="contact@institution.com"
                  error={errors.email?.message}
                  disabled={!isEditing}
                  required
                />
                <Input
                  {...register('phone')}
                  label="Phone Number"
                  placeholder="10-digit number"
                  error={errors.phone?.message}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center space-x-4 pt-4 border-t">
                <Button type="submit" isLoading={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default InstitutionProfile;
