import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { inspectionService } from '@/services/inspectionService';
import ComplianceChecklist, {
  ChecklistItem,
} from '@/components/inspector/ComplianceChecklist';
import PhotoUpload, { PhotoMetadata } from '@/components/inspector/PhotoUpload';
import { Calendar, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

const recommendationOptions = [
  {
    value: 'approve',
    label: 'Recommend for Approval',
    description: 'All compliance requirements met',
    color: 'green',
  },
  {
    value: 'clarification',
    label: 'Minor Issues - Needs Clarification',
    description: 'Some areas need officer review or minor corrections',
    color: 'amber',
  },
  {
    value: 'reject',
    label: 'Major Non-Compliance - Recommend Rejection',
    description: 'Serious violations requiring rejection',
    color: 'red',
  },
];

const InspectionReport: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [observations, setObservations] = useState('');
  const [recommendation, setRecommendation] = useState<'approve' | 'reject' | 'clarification'>('approve');
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Load existing report if any
  useEffect(() => {
    const loadExistingReport = async () => {
      if (!id) return;
      
      try {
        const response = await inspectionService.getReport(id);
        if (response.success && response.data) {
          const report = response.data;
          setInspectionDate(
            report.submittedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          );
          setChecklistItems(report.checklistItems || []);
          setObservations(report.observations || '');
          setRecommendation(report.recommendation || 'approve');
          // Note: Photos from existing reports can't be re-uploaded
          console.log('📋 Loaded existing report data');
        }
      } catch (error) {
        // No existing report, starting fresh
        console.log('📝 Starting new report');
      }
    };

    loadExistingReport();
  }, [id]);

  const validateForm = (): string | null => {
    if (!inspectionDate) {
      return 'Please select inspection date';
    }

    if (checklistItems.length === 0) {
      return 'Please complete the compliance checklist';
    }

    const allItemsUnevaluated = checklistItems.every(
      (item) => item.status === 'not_applicable'
    );
    if (allItemsUnevaluated) {
      return 'Please evaluate at least one checklist item';
    }

    if (!observations.trim()) {
      return 'Please add your observations';
    }

    if (observations.trim().length < 50) {
      return 'Observations must be at least 50 characters';
    }

    return null;
  };

  const handlePreview = () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    if (!id) {
      toast.error('Invalid inspection ID');
      return;
    }

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📤 Submitting inspection report...');

      console.log(`📸 Uploading ${photos.length} photos`);

      await inspectionService.submitReport(id, {
        inspectionDate,
        checklistItems,
        observations,
        recommendation,
        photos: photos.map((photo) => photo.file),
      });
      
      toast.success('Inspection report submitted successfully! Officer will review your findings.');
      navigate('/inspector/dashboard');
    } catch (error: any) {
      console.error('❌ Report submission error:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit inspection report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRecommendation = recommendationOptions.find(
    (opt) => opt.value === recommendation
  );

  // Calculate compliance summary
  const complianceSummary = checklistItems.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Field Inspection Report</h1>
          <p className="mt-2 text-gray-600">Complete your inspection findings and recommendations</p>
          <p className="text-sm text-gray-500 mt-1">Inspection ID: {id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/inspector/inspections/${id}`)}>
            Back to Details
          </Button>
          {!showPreview && (
            <Button onClick={handlePreview}>
              Preview Report
            </Button>
          )}
        </div>
      </div>

      {/* Preview Mode */}
      {showPreview && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Report Preview</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Edit Report
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Inspection Date:</span>
                <span>{inspectionDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="font-medium">Checklist Items:</span>
                <span>{checklistItems.length} items evaluated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="font-medium">Compliant:</span>
                <span>{complianceSummary.compliant || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Photos:</span>
                <span>{photos.length} attached</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Recommendation:</span>
                <span
                  className={`px-2 py-1 rounded font-medium ${
                    recommendation === 'approve'
                      ? 'bg-green-100 text-green-700'
                      : recommendation === 'reject'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {selectedRecommendation?.label}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleSubmit} isLoading={isSubmitting} className="flex-1">
                🚀 Submit Final Report
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Form Sections */}
      {!showPreview && (
        <>
          {/* Inspection Date */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Inspection Date</h2>
              </div>
            </CardHeader>
            <CardBody>
              <Input
                type="date"
                label="Date of Physical Inspection"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </CardBody>
          </Card>

          {/* Compliance Checklist */}
          <ComplianceChecklist
            items={checklistItems}
            onChange={setChecklistItems}
          />

          {/* Observations */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Observations <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Provide comprehensive notes on your findings during the physical inspection
              </p>
            </CardHeader>
            <CardBody>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Example:&#10;&#10;During the physical inspection on [date], I observed the following:&#10;&#10;1. Storage Facilities: The narcotic storage area is equipped with double-lock safes as required. Access is restricted to authorized personnel only.&#10;&#10;2. Practitioner Verification: Dr. [Name] was present and provided valid medical license [number]. Qualifications verified against application details.&#10;&#10;3. Documentation: Prescription records are maintained digitally with proper backup systems. Drug inventory logs are current and accurate.&#10;&#10;4. Infrastructure: The premises matches the address provided. Adequate space for safe storage and handling of controlled substances.&#10;&#10;5. Compliance: Institution demonstrates understanding and implementation of NDPS Act requirements."
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[300px]"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                {observations.length} characters (minimum 50 required)
              </p>
            </CardBody>
          </Card>

          {/* Photo Upload */}
          <PhotoUpload photos={photos} onChange={setPhotos} />

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Inspector Recommendation <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Based on your findings, recommend an action to the reviewing officer
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {recommendationOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      recommendation === option.value
                        ? `border-${option.color}-500 bg-${option.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recommendation"
                      value={option.value}
                      checked={recommendation === option.value}
                      onChange={(e) =>
                        setRecommendation(
                          e.target.value as 'approve' | 'reject' | 'clarification'
                        )
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {recommendation === 'reject' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Rejection Recommendation
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Ensure your observations clearly document the major non-compliance
                    issues that justify rejection. The officer will make the final decision.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Submit Actions */}
          <Card className="border-2 border-gray-300">
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Ready to submit your report?</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Review all sections carefully before final submission
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/inspector/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handlePreview}>
                    Preview Report
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
};

export default InspectionReport;
