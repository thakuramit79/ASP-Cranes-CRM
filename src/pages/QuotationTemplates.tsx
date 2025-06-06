import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Modal } from '../components/common/Modal';
import { Template } from '../types/template';
import { Plus, FileText, Edit2, Trash2, Copy, Eye, Code, Type } from 'lucide-react';
import { RichTextTemplateEditor } from '../components/quotations/RichTextTemplateEditor';
import { TemplatePreview } from '../components/quotations/TemplatePreview';
import { Toast } from '../components/common/Toast';
import { validateTemplate } from '../utils/templateMerger';

const defaultTemplate: Template = {
  id: 'default',
  name: 'Default Quotation Template',
  description: 'Standard quotation template with company branding and placeholders',
  content: '', // Will be set by RichTextTemplateEditor's default
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function QuotationTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editMode, setEditMode] = useState<'rich' | 'html'>('rich');
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
    setEditMode('rich');
    setIsEditOpen(true);
  };

  const handleEditTemplate = (template: Template, mode: 'rich' | 'html' = 'rich') => {
    setSelectedTemplate(template);
    setEditMode(mode);
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
    // Validate template before saving
    const validation = validateTemplate(updatedTemplate.content);
    if (!validation.isValid) {
      showToast('Template contains errors. Please fix them before saving.', 'error');
      return;
    }

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

  const getTemplatePreview = (content: string) => {
    // Strip HTML tags for preview
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    return textContent.substring(0, 200) + (textContent.length > 200 ? '...' : '');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotation Templates</h1>
          <p className="text-gray-500 mt-1">Create and manage quotation templates with rich text editing and dynamic placeholders</p>
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
        {templates.map(template => {
          const validation = validateTemplate(template.content);
          
          return (
            <Card key={template.id} className="h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-4 p-4 flex items-start justify-start overflow-hidden relative">
                    {template.content ? (
                      <div className="w-full h-full">
                        <div 
                          className="text-[8px] leading-[10px] text-gray-600 overflow-hidden"
                          dangerouslySetInnerHTML={{ 
                            __html: template.content.substring(0, 500) + (template.content.length > 500 ? '...' : '') 
                          }}
                        />
                      </div>
                    ) : (
                      <div className="text-[8px] leading-[10px] text-gray-400">Empty template</div>
                    )}
                    
                    {/* Validation indicator */}
                    <div className="absolute top-2 right-2">
                      {validation.isValid ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full\" title="Template is valid" />
                      ) : (
                        <div className="w-3 h-3 bg-red-500 rounded-full\" title={`Template has ${validation.errors.length} errors`} />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    
                    <div className="flex items-center gap-2">
                      {template.isDefault && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Default Template
                        </span>
                      )}
                      
                      {!validation.isValid && (
                        <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          {validation.errors.length} Error{validation.errors.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      
                      {validation.warnings.length > 0 && (
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          {validation.warnings.length} Warning{validation.warnings.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
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
                    onClick={() => handleEditTemplate(template, 'rich')}
                    leftIcon={<Type className="w-3 h-3" />}
                  >
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditTemplate(template, 'html')}
                    leftIcon={<Code className="w-3 h-3" />}
                    title="Edit HTML Source"
                  >
                    HTML
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
          );
        })}
      </div>

      {/* Rich Text Editor Modal */}
      <Modal
        isOpen={isEditOpen && editMode === 'rich'}
        onClose={() => setIsEditOpen(false)}
        title={selectedTemplate?.isDefault ? 'View Template' : 'Edit Template'}
        size="full"
      >
        {selectedTemplate && (
          <RichTextTemplateEditor
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setIsEditOpen(false)}
          />
        )}
      </Modal>

      {/* HTML Source Editor Modal */}
      <Modal
        isOpen={isEditOpen && editMode === 'html'}
        onClose={() => setIsEditOpen(false)}
        title="Edit HTML Source"
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>HTML Mode:</strong> You're editing the raw HTML source. Be careful with syntax and ensure all tags are properly closed.
              </p>
            </div>
            
            <textarea
              className="w-full h-96 font-mono text-sm border border-gray-300 rounded-lg p-4"
              value={selectedTemplate.content}
              onChange={(e) => setSelectedTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
              placeholder="Enter HTML content with {{placeholders}}"
            />
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedTemplate && handleSaveTemplate(selectedTemplate)}
              >
                Save Template
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview: ${selectedTemplate?.name}`}
        size="xl"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Preview Mode:</strong> This shows how the template will look with sample data. Placeholders are highlighted for reference.
              </p>
            </div>
            
            <div className="bg-white border rounded-lg p-6 shadow-sm max-h-96 overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.6'
                }}
              />
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