import React, { useEffect, useMemo, useState } from 'react';
import { Users, Building2, FileCheck2, ShieldAlert } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { adminService } from '@/services/adminService';
import { formatDateTime } from '@/utils/helpers';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [statsData, setStatsData] = useState({
    activeInspectors: 0,
    licensingOffices: 0,
    activeForms: 0,
    pendingAssignments: 0,
  });
  const [recentActivities, setRecentActivities] = useState<string[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsResponse, logsResponse] = await Promise.all([
          adminService.getDashboardStats(),
          adminService.getSystemLogs(1, 5),
        ]);

        if (statsResponse.success && statsResponse.data) {
          setStatsData({
            activeInspectors: statsResponse.data.activeInspectors || 0,
            licensingOffices: statsResponse.data.licensingOffices || 0,
            activeForms: statsResponse.data.activeForms || 0,
            pendingAssignments: statsResponse.data.pendingAssignments || 0,
          });
        }

        setRecentActivities(
          (logsResponse.data || []).map(
            (item) => `${item.action} • ${formatDateTime(item.timestamp)}`,
          ),
        );
      } catch (error) {
        toast.error('Failed to load admin dashboard');
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(
    () => [
      {
        label: 'Active Inspectors',
        value: statsData.activeInspectors,
        icon: Users,
        iconClass: 'text-blue-600',
      },
      {
        label: 'Licensing Offices',
        value: statsData.licensingOffices,
        icon: Building2,
        iconClass: 'text-purple-600',
      },
      {
        label: 'Active Forms',
        value: statsData.activeForms,
        icon: FileCheck2,
        iconClass: 'text-green-600',
      },
      {
        label: 'Pending Assignments',
        value: statsData.pendingAssignments,
        icon: ShieldAlert,
        iconClass: 'text-red-600',
      },
    ],
    [statsData],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">System overview and operational controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <Card key={item.label}>
            <CardBody>
              <div className="flex items-center gap-3">
                <item.icon className={`h-10 w-10 ${item.iconClass}`} />
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
        </CardHeader>
        <CardBody>
          <ul className="space-y-3 text-sm text-gray-700">
            {recentActivities.map((activity) => (
              <li key={activity} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                {activity}
              </li>
            ))}
            {recentActivities.length === 0 && (
              <li className="text-gray-500">No recent activities found.</li>
            )}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminDashboard;
