import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Plus, FileText, Edit2, Trash2, Copy, Eye } from 'lucide-react';
import { QuotationTemplate } from '../types/quotationTemplate';
import { TemplateEditor } from '../components/quotations/TemplateEditor';
import { TemplatePreviewer } from '../components/quotations/TemplatePreviewer';

const defaultTemplate: QuotationTemplate = {
  id: 'default',
  name: 'Default Template',
  description: 'Standard quotation template with company branding',
  elements: [
    {
      id: 'header',
      type: 'image',
      imageUrl: '/logo.png',
      style: {
        alignment: 'center',
        marginBottom: '20px'
      }
    },
    {
      id: 'title',
      type: 'heading',
      content: 'Quotation',
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        alignment: 'center',
        marginBottom: '30px'
      }
    },
    {
      id: 'quotationDetails',
      type: 'table',
      tableData: {
        headers: ['Description', 'Quantity', 'Rate', 'Amount'],
        widths: ['40%', '20%', '20%', '20%']
      },
      dynamicField: 'items'
    }
  ],
  branding: {
    primaryColor: '#1a56db',
    secondaryColor: '#e2e8f0',
    fontFamily: 'Arial'
  },
  layout: {
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isDefault: true
};

export function QuotationTemplates() {
  const [templates, setTemplates] = useState<QuotationTemplate[]>([defaultTemplate]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuotationTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handleCreateTemplate = () => {
    const newTemplate: QuotationTemplate = {
      ...defaultTemplate,
      id: `template-${Date.now()}`,
      name: 'New Template',
      description: 'Custom quotation template',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates([...templates, newTemplate]);
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: QuotationTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  };

  const handlePreviewTemplate = (template: QuotationTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewing(true);
  };

  const handleDuplicateTemplate = (template: QuotationTemplate) => {
    const duplicatedTemplate: QuotationTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTemplates([...templates, duplicatedTemplate]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templates.find(t => t.id === templateId)?.isDefault) {
      alert('Cannot delete the default template');
      return;
    }
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleSaveTemplate = (updatedTemplate: QuotationTemplate) => {
    setTemplates(templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    ));
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotation Templates</h1>
          <p className="text-gray-500 mt-1">
            Manage and customize your quotation templates
          </p>
        </div>
        <Button
          onClick={handleCreateTemplate}
          leftIcon={<Plus className="w-4 h-4" />}
          variant="default"
          size="lg"
          className="bg-primary-600 text-white hover:bg-primary-700"
        >
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col hover:border-primary-500 transition-colors">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <span>Last updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreviewTemplate(template)}
                  leftIcon={<Eye className="w-4 h-4" />}
                  className="flex-1"
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditTemplate(template)}
                  leftIcon={<Edit2 className="w-4 h-4" />}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicateTemplate(template)}
                  leftIcon={<Copy className="w-4 h-4" />}
                  className="flex-1"
                >
                  Duplicate
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="flex-1 text-error-600 hover:bg-error-50 hover:border-error-300"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {isEditing && selectedTemplate && (
        <TemplateEditor
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {isPreviewing && selectedTemplate && (
        <TemplatePreviewer
          template={selectedTemplate}
          onClose={() => setIsPreviewing(false)}
        />
      )}
    </div>
  );
} 