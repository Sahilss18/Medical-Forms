import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { ApplicationListItem } from '@/types';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';

const ApplicantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplications();
      if (response.data) {
        setApplications(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pending = response.data.filter(app => 
          ['submitted', 'under_scrutiny', 'inspection_assigned'].includes(app.status)
        ).length;
        const approved = response.data.filter(app => app.status === 'approved').length;
        const rejected = response.data.filter(app => app.status === 'rejected').length;
        
        setStats({ total, pending, approved, rejected });
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (applicationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this draft application? This action cannot be undone.')) {
      return;
    }

    try {
      await applicationService.deleteApplication(applicationId);
      toast.success('Application deleted successfully');
      fetchApplications(); // Refresh the list
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete application');
    }
  };

  const handleEdit = (applicationId: string, formType: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // Extract form code from formType (e.g., "Form 19" -> "19")
    const formCode =  formType.match(/Form (\w+)/)?.[1] || '3F';
    navigate(`/applicant/application/new/${formCode}?draft=${applicationId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's your application overview
          </p>
        </div>
        <Button onClick={() => navigate('/applicant/forms')}>
          <Plus className="h-5 w-5 mr-2" />
          New Application
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-12 w-12 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-12 w-12 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Recent Applications</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new application
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/applicant/application/new')}>
                  <Plus className="h-5 w-5 mr-2" />
                  New Application
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.slice(0, 5).map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4 flex-1 cursor-pointer" onClick={() => navigate(`/applicant/applications/${app.id}`)}>
                    <FileText className="h-8 w-8 text-primary-600" />
                    <div>
                      <p className="font-medium text-gray-900">{app.formType}</p>
                      <p className="text-sm text-gray-500">
                        Updated: {new Date(app.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    {app.status === 'draft' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleEdit(app.id, app.formType, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleDelete(app.id, e)}
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ApplicantDashboard;
