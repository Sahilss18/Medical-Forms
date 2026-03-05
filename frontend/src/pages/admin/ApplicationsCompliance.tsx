import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { formatDate } from '@/utils/helpers';
import toast from 'react-hot-toast';

const ApplicationsCompliance: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [issuingId, setIssuingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [overviewResp, appsResp] = await Promise.all([
        adminService.getComplianceOverview(),
        adminService.getApplicationsForAdmin(),
      ]);

      if (overviewResp.success) setOverview(overviewResp.data);
      if (appsResp.success) setApplications(appsResp.data || []);
    } catch {
      toast.error('Failed to load compliance data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApproveAndIssue = async (applicationId: string) => {
    try {
      setIssuingId(applicationId);
      await adminService.approveAndIssueCertificate(applicationId);
      toast.success('Application approved and certificate issued');
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applications & Compliance</h1>
        <p className="mt-2 text-gray-600">Monitor processing timelines and issue certificates for approved workflow completion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardBody><p className="text-xs text-gray-500">Total Applications</p><p className="text-2xl font-bold">{overview?.totalApplications || 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Pending Inspection</p><p className="text-2xl font-bold">{overview?.pendingInspection || 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Completed Inspection</p><p className="text-2xl font-bold">{overview?.completedInspection || 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Decision Pending</p><p className="text-2xl font-bold">{overview?.decisionPending || 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Approved</p><p className="text-2xl font-bold">{overview?.approvedApplications || 0}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-gray-500">Overdue Inspections</p><p className="text-2xl font-bold text-red-600">{overview?.overdueInspections || 0}</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">All Applications</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Application</th>
                  <th className="py-2 pr-4">Institution</th>
                  <th className="py-2 pr-4">Form</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Submitted</th>
                  <th className="py-2 pr-4">Certificate</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => (
                  <tr key={app.id} className="text-sm text-gray-900">
                    <td className="py-3 pr-4 font-medium">{app.applicationNumber}</td>
                    <td className="py-3 pr-4">{app.institutionName}</td>
                    <td className="py-3 pr-4">{app.formCode}</td>
                    <td className="py-3 pr-4">{app.status}</td>
                    <td className="py-3 pr-4">{formatDate(app.submittedAt)}</td>
                    <td className="py-3 pr-4">{app.certificateNumber || 'Not issued'}</td>
                    <td className="py-3">
                      <Button
                        size="sm"
                        onClick={() => handleApproveAndIssue(app.id)}
                        isLoading={issuingId === app.id}
                        disabled={!!app.hasCertificate}
                      >
                        {app.hasCertificate ? 'Issued' : 'Approve + Issue'}
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

export default ApplicationsCompliance;
