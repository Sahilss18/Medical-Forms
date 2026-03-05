import React, { useEffect, useState } from 'react';
import { X, MapPin, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { applicationService } from '@/services/applicationService';

interface Inspector {
  id: string;
  name: string;
  district: string;
  workload: number;
}

interface AssignInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onAssign: (
    inspectorId: string, 
    scheduledDate: string, 
    notes?: string,
    documentsToVerify?: Array<{ id: string; name: string; url: string; type: string }>
  ) => Promise<void>;
  documentReviews?: { [documentId: string]: 'verified' | 'needs_review' | 'pending' };
  documents?: Array<{ id: string; name: string; url: string; type: string }>;
}

export const AssignInspectorModal: React.FC<AssignInspectorModalProps> = ({
  isOpen,
  onClose,
  applicationId: _applicationId,
  onAssign,
  documentReviews = {},
  documents = [],
}) => {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [selectedInspector, setSelectedInspector] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInspectors();
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const fetchInspectors = async () => {
    try {
      console.log('🔍 Fetching available inspectors...');
      const response = await applicationService.getAvailableInspectors();
      console.log('📊 API Response:', response);
      if (response.success && response.data) {
        console.log('✅ Inspectors data:', response.data);
        setInspectors(response.data);
      } else {
        console.warn('⚠️ No data in response:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching inspectors:', error);
      toast.error('Failed to fetch inspectors');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInspector) {
      toast.error('Please select an inspector');
      return;
    }

    if (!scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    try {
      setIsLoading(true);
      
      // Build notes including document review info
      let finalNotes = notes;
      const docsToReview = documents.filter(doc => documentReviews[doc.id] === 'needs_review');
      
      if (docsToReview.length > 0) {
        finalNotes += finalNotes ? '\n\n' : '';
        finalNotes += 'Documents requiring verification:\n' + 
          docsToReview.map(doc => `- ${doc.name}`).join('\n');
      }

      // Share all documents with inspector for pre-inspection preparation.
      // Mark only selected documents for focused verification during visit.
      const documentsToVerify = documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        url: doc.url,
        type: doc.type || 'application/pdf',
        needsVerification: documentReviews[doc.id] === 'needs_review',
      }));

      console.log('📤 Sending to inspector:', {
        notes: finalNotes,
        documentsToVerify,
      });
      
      await onAssign(selectedInspector, scheduledDate, finalNotes, documentsToVerify);
      toast.success('Inspector assigned successfully');
      onClose();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to assign inspector');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInspectorData = inspectors.find(i => i.id === selectedInspector);
  const docsNeedingReview = documents.filter(doc => documentReviews[doc.id] === 'needs_review').length;
  const verifiedDocs = documents.filter(doc => documentReviews[doc.id] === 'verified').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Inspector
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Document Review Summary */}
            {documents.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Document Review Summary:
                </p>
                <div className="flex justify-around text-xs mb-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>{verifiedDocs} Verified</span>
                  </div>
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span>{docsNeedingReview} Need Review</span>
                  </div>
                </div>
                {docsNeedingReview > 0 && (
                  <div className="mt-2 border-t border-gray-200 pt-2">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Documents flagged for focused verification:
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {documents
                        .filter(doc => documentReviews[doc.id] === 'needs_review')
                        .map((doc, idx) => (
                          <li key={doc.id} className="flex items-start">
                            <span className="text-yellow-600 mr-1">•</span>
                            <span className="flex-1">{doc.name}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Inspector
                <span className="ml-2 text-xs text-gray-500">
                  ({inspectors.length} available)
                </span>
              </label>
              <Select
                value={selectedInspector}
                onChange={(e) => setSelectedInspector(e.target.value)}
                options={inspectors.map((inspector) => ({
                  label: inspector.name,
                  value: inspector.id,
                }))}
                placeholder="Choose an inspector"
                required
              />
              {inspectors.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  No inspectors available. Please contact administrator.
                </p>
              )}
            </div>

            {/* Selected Inspector Details */}
            {selectedInspectorData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-semibold text-blue-900">
                  Inspector Details:
                </p>
                <div className="flex items-center text-sm text-blue-800">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>District: {selectedInspectorData.district || 'All districts'}</span>
                </div>
                <div className="flex items-center text-sm text-blue-800">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>Current Workload: {selectedInspectorData.workload} active assignments</span>
                </div>
              </div>
            )}

            <div>
              <Input
                type="date"
                label="Scheduled Inspection Date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Textarea
                label="Special Instructions (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any special instructions or areas to focus on..."
                rows={3}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> The inspector will be notified via email and system notification.
                {docsNeedingReview > 0 && (
                  <span className="block mt-1">
                    {docsNeedingReview} document(s) marked for special verification will be highlighted.
                  </span>
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Assign Inspector
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
