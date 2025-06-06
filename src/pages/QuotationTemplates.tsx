import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Template } from '../types/template';
import { Plus, FileText, Edit2, Trash2, Copy, Eye } from 'lucide-react';
import { TemplateEditor } from '../components/quotations/TemplateEditor';
import { Toast } from '../components/common/Toast';

const defaultTemplate: Template = {
  id: 'default',
  name: 'Default Quotation Template',
  description: 'Standard quotation template with company branding and placeholders',
  content: '', // Will be set by TemplateEditor's default
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function QuotationTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('quotation-templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        setTemplates(parsed);
      } catch (error) {
        console.error('Error loading templates:', error);
        setTemplates([defaultTemplate]);
      }
    } else {
      setTemplates([defaultTemplate]);
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('quotation-templates', JSON.stringify(templates));
    }
  }, [templates]);

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      description: 'Custom quotation template',
      content: '',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSelectedTemplate(newTemplate);
    setIsEditOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsEditOpen(true);
  };

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicateTemplate = (template: Template) => {
    const duplicatedTemplate: Template = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates([...templates, duplicatedTemplate]);
    showToast('Template duplicated successfully');
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      showToast('Cannot delete the default template', 'error');
      return;
    }
    setTemplates(templates.filter(t => t.id !== templateId));
    showToast('Template deleted successfully');
  };

  const handleSaveTemplate = (updatedTemplate: Template) => {
    const existingIndex = templates.findIndex(t => t.id === updatedTemplate.id);
    if (existingIndex >= 0) {
      const newTemplates = [...templates];
      newTemplates[existingIndex] = updatedTemplate;
      setTemplates(newTemplates);
    } else {
      setTemplates([...templates, updatedTemplate]);
    }
    setIsEditOpen(false);
    showToast('Template saved successfully');
  };

  // Mock data for preview
  const mockData = {
    customer_name: 'John Doe',
    customer_email: 'john.doe@abcconstruction.com',
    customer_phone: '+91 98765 43210',
    customer_company: 'ABC Construction Ltd.',
    customer_address: '456 Building Site, Construction Zone, Mumbai 400001',
    customer_designation: 'Project Manager',
    quotation_id: 'QT-2024-001',
    quotation_date: new Date().toLocaleDateString('en-IN'),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
    equipment_name: 'Hydraulic Crane XL2000',
    equipment_capacity: '50 tons',
    project_duration: '30 days',
    working_hours: '8 hours/day',
    total_amount: '₹1,50,000',
    base_rate: '₹2,500/hour',
    site_location: 'Mumbai Construction Site',
    company_name: 'ASP Cranes',
    company_address: '123 Industrial Area, Mumbai, Maharashtra 400001',
    company_phone: '+91 22 1234 5678',
    company_email: 'info@aspcranes.com',
    company_gst: '27AABCS1429B1ZB'
  };

  const replaceTemplatePlaceholders = (content: string): string => {
    let result = content;
    Object.entries(mockData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replaceAll(placeholder, value);
    });
    return result;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotation Templates</h1>
          <p className="text-gray-500 mt-1">Manage and customize your quotation templates with dynamic placeholders</p>
        </div>
        <Button 
          onClick={handleCreateTemplate}
          className="flex items-center gap-2"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <div className="flex-1">
                <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 p-4 flex items-start justify-start overflow-hidden">
                  <div className="w-full h-full">
                    <pre className="text-[8px] leading-[10px] text-gray-600 whitespace-pre-wrap overflow-hidden">
                      {template.content ? template.content.substring(0, 500) + (template.content.length > 500 ? '...' : '') : 'Empty template'}
                    </pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  {template.isDefault && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Default Template
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handlePreviewTemplate(template)}
                  leftIcon={<Eye className="w-3 h-3" />}
                >
                  Preview
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                  leftIcon={<Edit2 className="w-3 h-3" />}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                  leftIcon={<Copy className="w-3 h-3" />}
                >
                  Copy
                </Button>
                {!template.isDefault && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteTemplate(template.id)}
                    leftIcon={<Trash2 className="w-3 h-3" />}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedTemplate?.isDefault ? 'View Template' : 'Edit Template'}
        size="full"
      >
        {selectedTemplate && (
          <TemplateEditor
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setIsEditOpen(false)}
          />
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview: ${selectedTemplate?.name}`}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Preview Mode:</strong> Placeholders have been replaced with sample data for demonstration.
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6 shadow-sm max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {selectedTemplate.content 
                  ? replaceTemplatePlaceholders(selectedTemplate.content)
                  : 'No content available'
                }
              </pre>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}