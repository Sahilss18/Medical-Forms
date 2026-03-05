import React from 'react';
import { Application, ApplicationStatus } from '@/types';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { formatDate } from '@/utils/helpers';
import { FileText, Calendar, MapPin } from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
  onClick?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onClick,
}) => {
  return (
    <Card hoverable onClick={onClick} className="cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Form {application.formId}
              </h3>
              <p className="text-sm text-gray-500">ID: {application.id}</p>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              Submitted: {application.submittedAt ? formatDate(application.submittedAt) : 'Draft'}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Updated: {formatDate(application.updatedAt)}</span>
          </div>
          {application.remarks && (
            <div className="mt-3 p-3 bg-yellow-50 rounded-md">
              <p className="text-sm text-gray-700">{application.remarks}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
