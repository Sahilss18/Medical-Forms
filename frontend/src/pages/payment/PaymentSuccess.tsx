import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, FileText, Download, Home } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const paymentId = searchParams.get('payment_id');
  const applicationId = searchParams.get('application_id');
  const amount = searchParams.get('amount');

  useEffect(() => {
    // You could fetch payment details here if needed
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardBody className="text-center py-12">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-green-100 p-6">
              <CheckCircle className="w-20 h-20 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your application has been submitted successfully
          </p>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-4">Transaction Details</h2>
            <div className="space-y-3">
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium text-gray-900">{paymentId}</span>
                </div>
              )}
              {applicationId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Application ID:</span>
                  <span className="font-medium text-gray-900">{applicationId}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-gray-900">₹{amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Payment receipt has been sent to your registered email</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Your application will be reviewed by licensing officers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>You will receive updates via email and notifications</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Track your application status in the dashboard</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => navigate('/applicant/dashboard')}
              className="flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Button>
            
            {applicationId && (
              <Button
                onClick={() => navigate(`/applicant/applications/${applicationId}`)}
                className="flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                View Application
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement download receipt
                alert('Receipt download functionality to be implemented');
              }}
              className="flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
