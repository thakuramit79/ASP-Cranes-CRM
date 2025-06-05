import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { QuotationTemplate } from '../components/quotations/QuotationTemplate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Quotation } from '../types/quotation';
import { Template } from '../types/template';
import { Plus, FileText, Edit2, Trash2, Copy } from 'lucide-react';
import { TemplateEditor } from '../components/quotations/TemplateEditor';

// Sample quotation data for preview
const sampleQuotation: Quotation = {
  id: 'SAMPLE001',
  leadId: 'LEAD001',
  customerId: 'CUST001',
  customerName: 'ABC Construction Ltd.',
  version: 1,
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'ADMIN001',
  customerContact: {
    name: 'John Doe',
    designation: 'Project Manager',
    company: 'ABC Construction Ltd.',
    address: '456 Building Site, Construction Zone, Mumbai 400001',
    phone: '+91 98765 43210',
    email: 'john.doe@abcconstruction.com'
  },
  selectedEquipment: {
    id: 'crane1',
    equipmentId: 'EQ001',
    name: 'Hydraulic Crane XL2000',
    baseRates: {
      micro: 1000,
      small: 1500,
      monthly: 25000,
      yearly: 250000
    }
  },
  numberOfDays: 30,
  workingHours: 8,
  shift: 'single',
  dayNight: 'day',
  baseRate: 2500,
  orderType: 'monthly',
  siteDistance: 50,
  runningCostPerKm: 100,
  mobRelaxation: 10,
  mobDemob: 9000,
  foodResources: 2,
  accomResources: 2,
  extraCharge: 5000,
  includeGst: true,
  totalRent: 150000,
  usage: 'normal',
  riskFactor: 'low',
  incidentalCharges: 0,
  otherFactorsCharge: 0,
  billing: 'gst'
};

const defaultTemplate: Template = {
  id: 'default',
  name: 'Default Template',
  description: 'Standard quotation template with company branding',
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  quotationData: sampleQuotation
};

export default function QuotationTemplates() {
  const [templates, setTemplates] = useState<Template[]>([defaultTemplate]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleCreateTemplate = () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      description: 'Custom quotation template',
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      quotationData: { ...sampleQuotation }
    };
    setTemplates([...templates, newTemplate]);
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
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (templates.find(t => t.id === templateId)?.isDefault) {
      alert('Cannot delete the default template');
      return;
    }
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const handleSaveTemplate = (updatedTemplate: Template) => {
    setTemplates(templates.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    ));
    setIsEditOpen(false);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotation Templates</h1>
          <p className="text-gray-500 mt-1">Manage and customize your quotation templates</p>
        </div>
        <Button 
          onClick={handleCreateTemplate}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 p-4 flex items-center justify-center">
                <div className="w-full h-full relative overflow-hidden">
                  <div className="transform scale-[0.4] origin-top-left absolute top-0 left-0">
                    <QuotationTemplate quotation={template.quotationData} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreviewTemplate(template)}
                  >
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  {!template.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview - {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh]">
            {selectedTemplate && (
              <QuotationTemplate quotation={selectedTemplate.quotationData} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.isDefault ? 'View Template' : 'Edit Template'}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateEditor
              template={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setIsEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 