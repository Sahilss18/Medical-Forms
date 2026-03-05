import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatDateTime } from '@/utils/helpers';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

type LogItem = {
  id: string;
  actor: string;
  module: 'applications' | 'forms' | 'inspectors' | 'offices' | 'auth';
  action: string;
  timestamp: string;
};

const SystemLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const response = await adminService.getSystemLogs(1, 100);
        setLogs(
          (response.data || []).map((item) => ({
            id: item.id,
            actor: item.userName || 'System',
            module: (item.module || 'auth') as LogItem['module'],
            action: item.action,
            timestamp: item.timestamp,
          })),
        );
      } catch (error) {
        toast.error('Failed to load system logs');
      }
    };

    loadLogs();
  }, []);

  const moduleOptions = useMemo(() => {
    const modules = Array.from(new Set(logs.map((item) => item.module))).sort();

    return [
      { label: 'All Modules', value: 'all' },
      ...modules.map((module) => ({
        label: module.charAt(0).toUpperCase() + module.slice(1),
        value: module,
      })),
    ];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchesSearch =
        item.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = moduleFilter === 'all' || item.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [searchTerm, moduleFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
        <p className="mt-2 text-gray-600">Audit trail of user and system actions.</p>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Actor or action"
            />
            <Select
              label="Module"
              value={moduleFilter}
              onChange={(event) => setModuleFilter(event.target.value)}
              options={moduleOptions}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Log Entries</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Timestamp</th>
                  <th className="py-2 pr-4">Actor</th>
                  <th className="py-2 pr-4">Module</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((item) => (
                  <tr key={item.id} className="text-sm text-gray-900">
                    <td className="py-3 pr-4">{formatDateTime(item.timestamp)}</td>
                    <td className="py-3 pr-4 font-medium">{item.actor}</td>
                    <td className="py-3 pr-4 capitalize">{item.module}</td>
                    <td className="py-3">{item.action}</td>
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

export default SystemLogs;
