import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Eye, Plus, Calendar, Edit, Trash2, Undo2 } from 'lucide-react';
import { ApplicationListItem } from '@/types';
import { applicationService } from '@/services/applicationService';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const ApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [searchTerm, statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplications();
      if (response.data) {
        setApplications(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = [...applications];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.formType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    setFilteredApplications(filtered);
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
    const formCode = formType.match(/Form (\w+)/)?.[1] || '3F';
    navigate(`/applicant/application/new/${formCode}?draft=${applicationId}`);
  };

  const withdrawableStatuses = new Set([
    'submitted',
    'under_scrutiny',
    'clarification_requested',
    'inspection_assigned',
    'inspection_completed',
    'decision_pending',
  ]);

  const handleWithdraw = async (applicationId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!window.confirm('Are you sure you want to withdraw this submitted application?')) {
      return;
    }

    try {
      await applicationService.withdrawApplication(applicationId);
      toast.success('Application withdrawn successfully');
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to withdraw application');
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_scrutiny', label: 'Under Scrutiny' },
    { value: 'clarification_requested', label: 'Clarification Requested' },
    { value: 'inspection_assigned', label: 'Inspection Assigned' },
    { value: 'inspection_completed', label: 'Inspection Completed' },
    { value: 'decision_pending', label: 'Decision Pending' },
    { value: 'withdrawn', label: 'Withdrawn' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const columns = [
    {
      key: 'id',
      header: 'Application ID',
      render: (app: ApplicationListItem) => (
        <span className="font-mono text-sm">{app.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'formId',
      header: 'Form Type',
      render: (app: ApplicationListItem) => (
        <span className="font-medium">{app.formType}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: ApplicationListItem) => <StatusBadge status={app.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Submitted On',
      render: (app: ApplicationListItem) => (
        <span className="text-sm text-gray-600">
          {app.submittedAt ? formatDate(app.submittedAt) : 'Not submitted'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (app: ApplicationListItem) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-1" />
          {formatDate(app.updatedAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app: ApplicationListItem) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/applicant/applications/${app.id}`);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {withdrawableStatuses.has(app.status) && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleWithdraw(app.id, e)}
              className="text-orange-600 hover:text-orange-700 hover:border-orange-600"
            >
              <Undo2 className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          )}
          {app.status === 'draft' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleEdit(app.id, app.formType, e)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => handleDelete(app.id, e)}
                className="text-red-600 hover:text-red-700 hover:border-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="mt-2 text-gray-600">
            View and manage all your applications
          </p>
        </div>
        <Button onClick={() => navigate('/applicant/application/new')}>
          <Plus className="h-5 w-5 mr-2" />
          New Application
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Application ID or Form Type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                placeholder="Filter by status"
              />
            </div>

            <Button variant="outline" onClick={fetchApplications}>
              <Filter className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Applications</h2>
            <span className="text-sm text-gray-500">
              {filteredApplications.length} of {applications.length} applications
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="h-12 w-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No applications found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new application'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="mt-6">
                  <Button onClick={() => navigate('/applicant/application/new')}>
                    <Plus className="h-5 w-5 mr-2" />
                    New Application
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredApplications}
              keyExtractor={(app) => app.id}
              onRowClick={(app) => navigate(`/applicant/applications/${app.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default ApplicationsList;
