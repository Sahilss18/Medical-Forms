import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { ApplicationListItem } from '@/types';
import { applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { formatDate } from '@/utils/helpers';

const OfficerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplications();
      if (response.data) {
        setApplications(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pending = response.data.filter(app => 
          ['submitted', 'under_scrutiny', 'inspection_assigned', 'decision_pending'].includes(app.status)
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

  const filterApplications = () => {
    let filtered = [...applications];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (app) =>
          app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.formType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  };

  const columns = [
    {
      key: 'id',
      header: 'Application ID',
      render: (row: ApplicationListItem) => (
        <span className="font-mono text-sm">{row.id.slice(0, 8).toUpperCase()}</span>
      ),
    },
    {
      key: 'institutionName',
      header: 'Institution',
      render: (row: ApplicationListItem) => row.institutionName,
    },
    {
      key: 'applicantName',
      header: 'Applicant',
      render: (row: ApplicationListItem) => row.applicantName,
    },
    {
      key: 'formType',
      header: 'Form Type',
      render: (row: ApplicationListItem) => row.formType,
    },
    {
      key: 'district',
      header: 'District',
      render: (row: ApplicationListItem) => row.district,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: ApplicationListItem) => <StatusBadge status={row.status} />,
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      render: (row: ApplicationListItem) =>
        row.submittedAt ? formatDate(row.submittedAt) : 'N/A',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: ApplicationListItem) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/officer/applications/${row.id}`)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Licensing Officer Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Review and manage application submissions
        </p>
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
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
        </CardHeader>
        <CardBody>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by ID, Institution, Applicant, or Form Type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Submitted', value: 'submitted' },
                  { label: 'Under Scrutiny', value: 'under_scrutiny' },
                  { label: 'Clarification Requested', value: 'clarification_requested' },
                  { label: 'Inspection Assigned', value: 'inspection_assigned' },
                  { label: 'Inspection Completed', value: 'inspection_completed' },
                  { label: 'Decision Pending', value: 'decision_pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No applications have been submitted yet'}
              </p>
            </div>
          ) : (
            <DataTable
              data={filteredApplications}
              columns={columns}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => navigate(`/officer/applications/${row.id}`)}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default OfficerDashboard;
