import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

type InspectorRow = {
  id: string;
  name: string;
  email: string;
  district: string;
  assignedCount: number;
  isActive: boolean;
};

const statusOptions = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const InspectorsManagement: React.FC = () => {
  const [inspectorsData, setInspectorsData] = useState<InspectorRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInspectors = async () => {
      try {
        setIsLoading(true);
        const response = await adminService.getInspectors();
        console.log('📊 Inspectors Response:', response);
        
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : [];
          setInspectorsData(data);
          console.log('✅ Loaded inspectors:', data.length);
        } else {
          console.error('❌ Invalid response format:', response);
          toast.error('Invalid data format from server');
        }
      } catch (error) {
        console.error('❌ Failed to load inspectors:', error);
        toast.error('Failed to load inspectors');
      } finally {
        setIsLoading(false);
      }
    };

    loadInspectors();
  }, []);

  const districtOptions = useMemo(() => {
    const districts = Array.from(
      new Set(
        inspectorsData
          .map((item) => item.district?.trim())
          .filter((d): d is string => Boolean(d))
      ),
    ).sort();

    return [
      { label: 'All Districts', value: 'all' },
      ...districts.map((district) => ({ label: district, value: district })),
    ];
  }, [inspectorsData]);

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      const response = await adminService.toggleInspectorStatus(id);

      if (response.success && response.data) {
        setInspectorsData((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isActive: Boolean((response.data as any).isActive) }
              : item,
          ),
        );
        toast.success(`Status updated for ${name}`);
      }
    } catch (error) {
      toast.error(`Failed to update status for ${name}`);
    }
  };

  const filteredInspectors = useMemo(() => {
    return inspectorsData.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDistrict = 
        districtFilter === 'all' || 
        item.district?.trim() === districtFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.isActive) ||
        (statusFilter === 'inactive' && !item.isActive);

      return matchesSearch && matchesDistrict && matchesStatus;
    });
  }, [inspectorsData, searchTerm, districtFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inspectors Management</h1>
        <p className="mt-2 text-gray-600">Manage inspector profiles and assignment load.</p>
      </div>

      {/* Summary Stats */}
      {!isLoading && inspectorsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Inspectors</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {inspectorsData.length}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {inspectorsData.filter(i => i.isActive).length}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">With Assignments</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {inspectorsData.filter(i => i.assignedCount > 0).length}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="text-sm text-gray-600">Total Assignments</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">
                {inspectorsData.reduce((sum, i) => sum + i.assignedCount, 0)}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search"
              placeholder="Name or email"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Select
              label="District"
              value={districtFilter}
              onChange={(event) => setDistrictFilter(event.target.value)}
              options={districtOptions}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusOptions}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Inspector Directory</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">District</th>
                  <th className="py-2 pr-4">Assigned</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Loading inspectors...
                    </td>
                  </tr>
                ) : filteredInspectors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      {inspectorsData.length === 0 
                        ? 'No inspectors found. Add inspectors through User Management.' 
                        : 'No inspectors match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredInspectors.map((item) => (
                    <tr key={item.id} className="text-sm text-gray-900">
                      <td className="py-3 pr-4 font-medium">{item.name}</td>
                      <td className="py-3 pr-4">{item.email}</td>
                      <td className="py-3 pr-4">{item.district}</td>
                      <td className="py-3 pr-4">{item.assignedCount}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(item.id, item.name)}
                        >
                          Toggle Status
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default InspectorsManagement;
