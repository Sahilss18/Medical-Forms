import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

const officeTypeOptions = [
  { label: 'State Office', value: 'STATE' },
  { label: 'Regional Office', value: 'REGIONAL' },
  { label: 'District Office', value: 'DISTRICT' },
];

type Office = {
  id: string;
  name: string;
  district: string;
  contactNumber: string;
  officer: string;
};

const LicensingOffices: React.FC = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [officeName, setOfficeName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [officeType, setOfficeType] = useState<'STATE' | 'REGIONAL' | 'DISTRICT'>('DISTRICT');

  useEffect(() => {
    const loadOffices = async () => {
      try {
        const response = await adminService.getLicensingOffices();
        if (response.success && response.data) {
          setOffices(
            response.data.map((office) => ({
              id: office.id,
              name: office.name,
              district: office.district,
              contactNumber: office.contactNumber || 'N/A',
              officer: office.officerId || 'N/A',
            })),
          );
        }
      } catch (error) {
        toast.error('Failed to load licensing offices');
      }
    };

    loadOffices();
  }, []);

  const handleAddOffice = async () => {
    if (!officeName.trim() || !district.trim()) {
      toast.error('Office name and district are required');
      return;
    }

    try {
      const response = await adminService.createLicensingOffice({
        name: officeName,
        district,
        state,
        officeType,
      });

      if (response.success && response.data) {
        setOffices((prev) => [
          {
            id: response.data.id,
            name: response.data.name,
            district: response.data.district,
            contactNumber: response.data.contactNumber || 'N/A',
            officer: response.data.officerId || 'N/A',
          },
          ...prev,
        ]);
        toast.success('Office added successfully');
        setOfficeName('');
        setDistrict('');
        setState('Tamil Nadu');
        setOfficeType('DISTRICT');
      }
    } catch (error) {
      toast.error('Failed to add office');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Licensing Offices</h1>
        <p className="mt-2 text-gray-600">Manage office records and officer mapping.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Add Office</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              label="Office Name"
              value={officeName}
              onChange={(event) => setOfficeName(event.target.value)}
              placeholder="Enter office name"
            />
            <Input
              label="State"
              value={state}
              onChange={(event) => setState(event.target.value)}
              placeholder="Enter state"
            />
            <Input
              label="District"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              placeholder="Enter district"
            />
            <Select
              label="Office Type"
              value={officeType}
              onChange={(event) =>
                setOfficeType(event.target.value as 'STATE' | 'REGIONAL' | 'DISTRICT')
              }
              options={officeTypeOptions}
            />
            <div className="flex items-end">
              <Button onClick={handleAddOffice}>Add Office</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Office Directory</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Office Name</th>
                  <th className="py-2 pr-4">District</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Officer</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {offices.map((office) => (
                  <tr key={office.id} className="text-sm text-gray-900">
                    <td className="py-3 pr-4 font-medium">{office.name}</td>
                    <td className="py-3 pr-4">{office.district}</td>
                    <td className="py-3 pr-4">{office.contactNumber}</td>
                    <td className="py-3 pr-4">{office.officer}</td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" disabled>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default LicensingOffices;
