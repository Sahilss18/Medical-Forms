import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Filter } from 'lucide-react';
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

const OfficerApplicationsList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, districtFilter, dateFilter]);

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

    // District filter
    if (districtFilter !== 'all') {
      filtered = filtered.filter((app) => app.district === districtFilter);
    }

    // Date filter
    if (dateFilter !== 'all' && filtered.length > 0) {
      const now = new Date();
      filtered = filtered.filter((app) => {
        if (!app.submittedAt) return false;
        const submittedDate = new Date(app.submittedAt);
        const diffDays = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'quarter':
            return diffDays <= 90;
          default:
            return true;
        }
      });
    }

    setFilteredApplications(filtered);
  };

  const getUniqueDistricts = () => {
    const districts = new Set(applications.map(app => app.district));
    return Array.from(districts).filter(Boolean).sort();
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
      key: 'updatedAt',
      header: 'Last Updated',
      render: (row: ApplicationListItem) => formatDate(row.updatedAt),
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
        <h1 className="text-3xl font-bold text-gray-900">All Applications</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive list of all application submissions
        </p>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications ({filteredApplications.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchApplications}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2">
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
            <div>
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
            <div>
              <Select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                options={[
                  { label: 'All Districts', value: 'all' },
                  ...getUniqueDistricts().map(district => ({
                    label: district,
                    value: district,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'today'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateFilter('quarter')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  dateFilter === 'quarter'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 90 Days
              </button>
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
                {searchTerm || statusFilter !== 'all' || districtFilter !== 'all' || dateFilter !== 'all'
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

export default OfficerApplicationsList;
