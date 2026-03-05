import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, ClipboardList, Clock3, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/utils/helpers';
import { inspectionService } from '@/services/inspectionService';
import toast from 'react-hot-toast';

type InspectionItem = {
  id: string;
  applicationId: string;
  institutionName?: string;
  district?: string;
  scheduledDate: string;
  status: 'assigned' | 'in_progress' | 'completed';
};

const InspectorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [availabilityResponse, inspectionsResponse] = await Promise.all([
          inspectionService.getMyAvailability(),
          inspectionService.getAssignedInspections(),
        ]);

        if (availabilityResponse.success && availabilityResponse.data) {
          setIsAvailable(availabilityResponse.data.available);
        }

        if (inspectionsResponse.success && inspectionsResponse.data) {
          setInspections(inspectionsResponse.data as InspectionItem[]);
        }
      } catch (error: any) {
        setIsAvailable(true);
        toast.error(error?.response?.data?.message || 'Failed to load inspector dashboard');
      }
    };

    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    if (isAvailable === null) return;

    const nextAvailability = !isAvailable;

    try {
      setIsUpdatingAvailability(true);
      const response = await inspectionService.updateMyAvailability(nextAvailability);
      if (response.success && response.data) {
        setIsAvailable(response.data.available);
        toast.success(
          response.data.available
            ? 'You are now available for new form assignments'
            : 'You are now unavailable for new form assignments'
        );
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update availability');
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  const stats = useMemo(() => {
    const assigned = inspections.filter((item) => item.status === 'assigned').length;
    const inProgress = inspections.filter((item) => item.status === 'in_progress').length;
    const completed = inspections.filter((item) => item.status === 'completed').length;
    return {
      total: inspections.length,
      assigned,
      inProgress,
      completed,
    };
  }, [inspections]);

  const upcoming = inspections
    .filter((item) => item.status !== 'completed')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inspector Dashboard</h1>
        <p className="mt-2 text-gray-600">Track assigned inspections and submit reports.</p>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Assignment Availability</p>
              <p className={`text-lg font-semibold ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                {isAvailable === null
                  ? 'Loading...'
                  : isAvailable
                    ? 'Available to take new forms'
                    : 'Unavailable to take new forms'}
              </p>
            </div>
            <Button
              variant={isAvailable ? 'danger' : 'primary'}
              onClick={handleToggleAvailability}
              isLoading={isUpdatingAvailability}
              disabled={isAvailable === null}
            >
              {isAvailable ? 'Mark Unavailable' : 'Mark Available'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Assigned</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <CalendarCheck className="h-10 w-10 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Clock3 className="h-10 w-10 text-amber-600" />
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Upcoming Inspections</h2>
        </CardHeader>
        <CardBody>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming inspections.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="py-2 pr-4">Inspection ID</th>
                    <th className="py-2 pr-4">Institution</th>
                    <th className="py-2 pr-4">District</th>
                    <th className="py-2 pr-4">Scheduled Date</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {upcoming.map((item) => (
                    <tr key={item.id} className="text-sm text-gray-900">
                      <td className="py-3 pr-4 font-medium">{item.id}</td>
                      <td className="py-3 pr-4">{item.institutionName || 'N/A'}</td>
                      <td className="py-3 pr-4">{item.district || 'N/A'}</td>
                      <td className="py-3 pr-4">{formatDate(item.scheduledDate)}</td>
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

export default InspectorDashboard;
