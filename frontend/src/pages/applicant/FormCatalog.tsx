import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FORM_CATEGORIES, ALL_FORMS, getFormsByCategory, FormType } from '@/constants/forms';
import { Search, ArrowRight, Clock, IndianRupee, FileCheck } from 'lucide-react';

const FormCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredForms = ALL_FORMS.filter((form) => {
    const matchesSearch =
      searchTerm === '' ||
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !selectedCategory || form.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleFormSelect = (formId: string) => {
    navigate(`/applicant/forms/${formId}/requirements`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for License/Approval</h1>
        <p className="text-gray-600">
          Choose the appropriate form for your application. Review document requirements before
          proceeding.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by form name, code, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Forms ({ALL_FORMS.length})
        </button>
        {FORM_CATEGORIES.map((category) => {
          const count = getFormsByCategory(category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Forms Grid */}
      {selectedCategory ? (
        // Category View - Show selected category
        <div className="mb-8">
          {FORM_CATEGORIES.filter((cat) => cat.id === selectedCategory).map((category) => (
            <div key={category.id}>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">{category.icon}</span>
                  {category.name}
                </h2>
                <p className="text-gray-600 mt-1">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFormsByCategory(category.id)
                  .filter((form) => {
                    if (searchTerm === '') return true;
                    return (
                      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      form.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      form.code.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                  })
                  .map((form) => (
                    <FormCard key={form.id} form={form} onSelect={handleFormSelect} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // All Forms View - Show by categories
        <>
          {searchTerm ? (
            // Search Results
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Search Results ({filteredForms.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredForms.map((form) => (
                  <FormCard key={form.id} form={form} onSelect={handleFormSelect} />
                ))}
              </div>
            </div>
          ) : (
            // Grouped by Category
            <div className="space-y-12">
              {FORM_CATEGORIES.map((category) => {
                const categoryForms = getFormsByCategory(category.id);
                return (
                  <div key={category.id}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-3xl">{category.icon}</span>
                        {category.name}
                      </h2>
                      <p className="text-gray-600 mt-1">{category.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryForms.map((form) => (
                        <FormCard key={form.id} form={form} onSelect={handleFormSelect} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {filteredForms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No forms found matching your search.</p>
          <Button onClick={() => setSearchTerm('')} className="mt-4">
            Clear Search
          </Button>
        </div>
      )}
    </div>
  );
};

// Form Card Component
const FormCard: React.FC<{ form: FormType; onSelect: (id: string) => void }> = ({
  form,
  onSelect,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(form.id)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-600 mb-1">Form {form.code}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{form.title}</h3>
            <p className="text-sm text-gray-600">{form.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{form.estimatedTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <IndianRupee className="w-4 h-4" />
            <span>Fees: {form.fees}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileCheck className="w-4 h-4" />
            <span>{form.documentRequirements.length} documents required</span>
          </div>
          {form.requiresInspection && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>Requires Inspection</span>
            </div>
          )}
        </div>
        <Button className="w-full mt-4 flex items-center justify-center gap-2">
          View Requirements
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardBody>
    </Card>
  );
};

export default FormCatalog;
