import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';

type FormRow = {
  id: string;
  code: string;
  title: string;
  version: string;
  active: boolean;
};

const FormsManagement: React.FC = () => {
  const [forms, setForms] = useState<FormRow[]>([]);

  const loadForms = async () => {
    try {
      const response = await adminService.getForms();
      if (response.success && response.data) {
        setForms(
          (response.data as any[]).map((form) => ({
            id: form.id,
            code: form.code,
            title: form.title,
            version: `v${form.fieldCount || 1}`,
            active: Boolean(form.active),
          })),
        );
      }
    } catch (error) {
      toast.error('Failed to load forms');
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  const toggleFormStatus = async (id: string) => {
    try {
      await adminService.toggleFormActive(id);
      toast.success('Form status updated');
      await loadForms();
    } catch {
      toast.error('Failed to update form status');
    }
  };

  const addField = async (formId: string) => {
    const label = window.prompt('Field label');
    if (!label) return;
    const fieldName = window.prompt('Field name (snake_case)');
    if (!fieldName) return;
    const fieldType = window.prompt('Field type (text|number|date|file|select)', 'text') || 'text';

    try {
      await adminService.addFormField(formId, {
        label,
        fieldName,
        fieldType,
        required: false,
        validationRules: {},
      });
      toast.success('Field added');
      await loadForms();
    } catch {
      toast.error('Failed to add field');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
          <p className="mt-2 text-gray-600">Control form versions and activation state.</p>
        </div>
        <Button onClick={() => toast.success('Create form flow will be added with API integration')}>
          Create New Form
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Available Forms</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Version</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {forms.map((form) => (
                  <tr key={form.id} className="text-sm text-gray-900">
                    <td className="py-3 pr-4 font-medium">{form.code}</td>
                    <td className="py-3 pr-4">{form.title}</td>
                    <td className="py-3 pr-4">{form.version}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${form.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {form.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addField(form.id)}
                        >
                          Add Field
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleFormStatus(form.id)}
                        >
                          Toggle Active
                        </Button>
                      </div>
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

export default FormsManagement;
