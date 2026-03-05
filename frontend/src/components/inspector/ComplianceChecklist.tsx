import React from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

export type ChecklistItemStatus = 'compliant' | 'non_compliant' | 'not_applicable';

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  remarks?: string;
};

type ComplianceChecklistProps = {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
};

const PREDEFINED_CHECKLIST_ITEMS = [
  {
    category: 'Storage Compliance',
    items: [
      { id: 'storage_1', label: 'Narcotic/psychotropic storage facility present and secure' },
      { id: 'storage_2', label: 'Safe storage cabinets with double locks installed' },
      { id: 'storage_3', label: 'Access control measures in place (restricted entry)' },
      { id: 'storage_4', label: 'Temperature and humidity controls maintained' },
    ],
  },
  {
    category: 'Practitioner Verification',
    items: [
      { id: 'practitioner_1', label: 'Qualified practitioners present on premises' },
      { id: 'practitioner_2', label: 'Valid medical licenses and certifications verified' },
      { id: 'practitioner_3', label: 'Training certificates for controlled substances handling' },
      { id: 'practitioner_4', label: 'Practitioner qualifications match application details' },
    ],
  },
  {
    category: 'Security & Documentation',
    items: [
      { id: 'security_1', label: 'Prescription records maintained and up-to-date' },
      { id: 'security_2', label: 'Drug inventory logs current and accurate' },
      { id: 'security_3', label: 'NDPS Act compliance measures implemented' },
      { id: 'security_4', label: 'Emergency procedures and protocols documented' },
    ],
  },
  {
    category: 'Physical Infrastructure',
    items: [
      { id: 'infrastructure_1', label: 'Premises matches address provided in application' },
      { id: 'infrastructure_2', label: 'Adequate space for safe storage and handling' },
      { id: 'infrastructure_3', label: 'Fire safety and security systems functional' },
      { id: 'infrastructure_4', label: 'Sanitation and hygiene standards met' },
    ],
  },
];

const ComplianceChecklist: React.FC<ComplianceChecklistProps> = ({
  items,
  onChange,
  readOnly = false,
}) => {
  // Initialize items if empty
  React.useEffect(() => {
    if (items.length === 0 && !readOnly) {
      const initialItems = PREDEFINED_CHECKLIST_ITEMS.flatMap((category) =>
        category.items.map((item) => ({
          ...item,
          status: 'not_applicable' as ChecklistItemStatus,
          remarks: '',
        }))
      );
      onChange(initialItems);
    }
  }, [items.length, onChange, readOnly]);

  const handleStatusChange = (itemId: string, status: ChecklistItemStatus) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, status } : item
    );
    onChange(updatedItems);
  };

  const handleRemarksChange = (itemId: string, remarks: string) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, remarks } : item
    );
    onChange(updatedItems);
  };

  const getStatusIcon = (status: ChecklistItemStatus) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'non_compliant':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'not_applicable':
        return <MinusCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ChecklistItemStatus) => {
    switch (status) {
      case 'compliant':
        return 'border-green-500 bg-green-50';
      case 'non_compliant':
        return 'border-red-500 bg-red-50';
      case 'not_applicable':
        return 'border-gray-300 bg-gray-50';
    }
  };

  // Calculate compliance summary
  const summary = items.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<ChecklistItemStatus, number>
  );

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {items.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardBody>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">
                    {summary.compliant || 0} Compliant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">
                    {summary.non_compliant || 0} Non-Compliant
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MinusCircle className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-600">
                    {summary.not_applicable || 0} Not Applicable
                  </span>
                </div>
              </div>
              <span className="text-gray-600">
                Total: {items.length} items
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Checklist Items by Category */}
      {PREDEFINED_CHECKLIST_ITEMS.map((category) => {
        const categoryItems = items.filter((item) =>
          category.items.some((predefinedItem) => predefinedItem.id === item.id)
        );

        if (categoryItems.length === 0 && readOnly) return null;

        return (
          <Card key={category.category}>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                {category.category}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {category.items.map((predefinedItem) => {
                  const item = items.find((i) => i.id === predefinedItem.id);
                  if (!item && readOnly) return null;

                  const currentStatus = item?.status || 'not_applicable';
                  const currentRemarks = item?.remarks || '';

                  return (
                    <div
                      key={predefinedItem.id}
                      className={`p-4 border-2 rounded-lg transition-colors ${
                        readOnly ? '' : 'hover:shadow-sm'
                      } ${getStatusColor(currentStatus)}`}
                    >
                      <div className="flex items-start gap-3">
                        {readOnly && getStatusIcon(currentStatus)}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-3">
                            {predefinedItem.label}
                          </p>

                          {!readOnly && (
                            <>
                              {/* Status Selection */}
                              <div className="flex gap-2 mb-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(predefinedItem.id, 'compliant')
                                  }
                                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentStatus === 'compliant'
                                      ? 'bg-green-500 text-white'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Compliant
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      predefinedItem.id,
                                      'non_compliant'
                                    )
                                  }
                                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentStatus === 'non_compliant'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-red-50'
                                  }`}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Non-Compliant
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      predefinedItem.id,
                                      'not_applicable'
                                    )
                                  }
                                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    currentStatus === 'not_applicable'
                                      ? 'bg-gray-400 text-white'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <MinusCircle className="w-4 h-4" />
                                  Not Applicable
                                </button>
                              </div>

                              {/* Remarks Textarea */}
                              <textarea
                                value={currentRemarks}
                                onChange={(e) =>
                                  handleRemarksChange(predefinedItem.id, e.target.value)
                                }
                                placeholder="Add remarks or observations (optional)"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={2}
                              />
                            </>
                          )}

                          {/* Display remarks in read-only mode */}
                          {readOnly && currentRemarks && (
                            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Remarks: </span>
                                {currentRemarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};

export default ComplianceChecklist;
