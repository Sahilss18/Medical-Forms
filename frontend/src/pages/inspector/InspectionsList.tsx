import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/helpers';
import { inspectionService } from '@/services/inspectionService';
import toast from 'react-hot-toast';

type InspectionStatus = 'assigned' | 'in_progress' | 'completed';

type InspectionItem = {
  id: string;
  applicationId: string;
  institutionName?: string;
  district?: string;
  scheduledDate: string;
  status: InspectionStatus;
};

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Assigned', value: 'assigned' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

const getStatusClassName = (status: InspectionStatus) => {
  if (status === 'assigned') return 'bg-purple-100 text-purple-800';
  if (status === 'in_progress') return 'bg-amber-100 text-amber-800';
  return 'bg-green-100 text-green-800';
};

const getStatusLabel = (status: InspectionStatus) => {
  if (status === 'assigned') return 'Assigned';
  if (status === 'in_progress') return 'In Progress';
  return 'Completed';
};

const InspectionsList: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    const loadInspections = async () => {
      try {
        const response = await inspectionService.getAssignedInspections();
        if (response.success && response.data) {
          setInspections(response.data as InspectionItem[]);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to load inspections');
      }
    };

    loadInspections();
  }, []);

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.institutionName || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = status === 'all' || item.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assigned Inspections</h1>
        <p className="mt-2 text-gray-600">View, track, and manage your inspection assignments.</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search"
              placeholder="Inspection ID / Application ID / Institution"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={statusOptions}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Inspection Queue</h2>
        </CardHeader>
        <CardBody>
          {filteredInspections.length === 0 ? (
            <p className="text-sm text-gray-500">No inspections found for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Inspection ID</th>
                    <th className="py-2 pr-4">Application ID</th>
                    <th className="py-2 pr-4">Institution</th>
                    <th className="py-2 pr-4">District</th>
                    <th className="py-2 pr-4">Scheduled</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInspections.map((item) => (
                    <tr key={item.id} className="text-sm text-gray-900">
                      <td className="py-3 pr-4 font-medium">{item.id}</td>
                      <td className="py-3 pr-4">{item.applicationId}</td>
                      <td className="py-3 pr-4">{item.institutionName || 'N/A'}</td>
                      <td className="py-3 pr-4">{item.district || 'N/A'}</td>
                      <td className="py-3 pr-4">{formatDate(item.scheduledDate)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusClassName(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/inspector/inspections/${item.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default InspectionsList;
