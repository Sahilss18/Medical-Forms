import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

const JurisdictionsManagement: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const response = await adminService.getInspectorJurisdictions();
      if (response.success && response.data) {
        setRows(response.data);
        const nextDrafts: Record<string, string> = {};
        response.data.forEach((r: any) => {
          nextDrafts[r.inspectorId] = (r.jurisdictions || []).map((j: any) => j.district).join(', ');
        });
        setDrafts(nextDrafts);
      }
    } catch {
      toast.error('Failed to load jurisdictions');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (inspectorId: string) => {
    const districts = (drafts[inspectorId] || '')
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    try {
      await adminService.updateInspectorJurisdictions(
        inspectorId,
        districts.map((district) => ({ state: 'Tamil Nadu', district, taluk: '' })),
      );
      toast.success('Jurisdictions updated');
      await load();
    } catch {
      toast.error('Failed to update jurisdictions');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Jurisdiction Management</h1>
        <p className="mt-2 text-gray-600">Assign districts to inspectors for routing and inspection allocation.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Inspector Jurisdictions</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.inspectorId} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{row.inspectorName}</p>
                    <p className="text-xs text-gray-500">{row.employeeCode}</p>
                  </div>
                  <Button size="sm" onClick={() => save(row.inspectorId)}>Save</Button>
                </div>
                <Input
                  label="Districts (comma separated)"
                  value={drafts[row.inspectorId] || ''}
                  onChange={(e) => setDrafts({ ...drafts, [row.inspectorId]: e.target.value })}
                  placeholder="Chennai, Chengalpattu, Vellore"
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default JurisdictionsManagement;
