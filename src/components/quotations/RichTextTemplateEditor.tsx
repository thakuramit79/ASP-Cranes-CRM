import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TextArea } from '../common/TextArea';
import { Template } from '../../types/template';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Toast } from '../common/Toast';
import { getAvailablePlaceholders, validateTemplate } from '../../utils/templateMerger';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
  Type,
  Palette,
  Plus
} from 'lucide-react';

interface RichTextTemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function RichTextTemplateEditor({ template, onSave, onCancel }: RichTextTemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<Template>({
    ...template,
    content: template.content || getDefaultTemplateContent()
  });
  const [showPreview, setShowPreview] = useState(false);
  const [showPlaceholders, setShowPlaceholders] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Validate template content whenever it changes
    const result = validateTemplate(editedTemplate.content);
    setValidationResult(result);
  }, [editedTemplate.content]);

  const showToast = (title: string, variant: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, title, variant });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  const getDefaultTemplateContent = () => {
    return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px;">
    <h1 style="color: #0284c7; margin: 0;">{{company_name}}</h1>
    <h2 style="color: #64748b; margin: 10px 0 0 0;">QUOTATION</h2>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
    <div>
      <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">From:</h3>
      <p><strong>{{company_name}}</strong><br>
      {{company_address}}<br>
      Phone: {{company_phone}}<br>
      Email: {{company_email}}<br>
      GST: {{company_gst}}</p>
    </div>
    
    <div>
      <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">To:</h3>
      <p><strong>{{customer_name}}</strong><br>
      {{customer_designation}}<br>
      {{customer_company}}<br>
      {{customer_address}}<br>
      Phone: {{customer_phone}}<br>
      Email: {{customer_email}}</p>
    </div>
  </div>

  <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div><strong>Quotation ID:</strong> {{quotation_number}}</div>
      <div><strong>Date:</strong> {{quotation_date}}</div>
      <div><strong>Valid Until:</strong> {{valid_until}}</div>
      <div><strong>Order Type:</strong> {{order_type}}</div>
    </div>
  </div>

  <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Equipment & Project Details</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <tr style="background: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Equipment</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">{{equipment_name}}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Duration</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">{{project_duration}}</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Working Hours</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">{{working_hours}}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Shift Type</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">{{shift_type}}</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Base Rate</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">{{base_rate}}</td>
    </tr>
  </table>

  <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Pricing Summary</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Subtotal</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">{{subtotal}}</td>
    </tr>
    <tr style="background: #f8fafc;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;">GST (18%)</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">{{gst_amount}}</td>
    </tr>
    <tr style="background: #0284c7; color: white;">
      <td style="padding: 12px; border: 1px solid #0284c7; font-weight: bold;">Total Amount</td>
      <td style="padding: 12px; border: 1px solid #0284c7; text-align: right; font-weight: bold;">{{total_amount}}</td>
    </tr>
  </table>

  <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Terms & Conditions</h3>
  <ol style="line-height: 1.6; color: #4b5563;">
    <li>Payment Terms: {{payment_terms}}</li>
    <li>GST @18% will be charged extra as applicable</li>
    <li>Mobilization charges will be billed extra based on distance</li>
    <li>Working hours: Standard 8-hour shift. Additional hours will be charged extra</li>
    <li>Operator & fuel will be provided by ASP Cranes</li>
    <li>Client to provide necessary permissions & clearances</li>
    <li>Rate validity: {{validity_period}}</li>
    <li>Insurance coverage as per standard terms</li>
  </ol>

  <div style="margin-top: 40px; text-align: center; color: #6b7280;">
    <p><strong>Thank you for your business!</strong></p>
    <p>For any queries, please contact us at {{company_phone}} or email at {{company_email}}</p>
  </div>
</div>`;
  };

  const handleSave = () => {
    if (!editedTemplate.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }

    if (!editedTemplate.content.trim()) {
      showToast('Please enter template content', 'error');
      return;
    }

    if (!validationResult.isValid) {
      showToast('Please fix template errors before saving', 'error');
      return;
    }

    const updatedTemplate = {
      ...editedTemplate,
      updatedAt: new Date()
    };

    onSave(updatedTemplate);
    showToast('Template saved successfully!', 'success');
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setEditedTemplate(prev => ({
        ...prev,
        content: editorRef.current!.innerHTML
      }));
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const placeholderSpan = document.createElement('span');
      placeholderSpan.style.backgroundColor = '#dbeafe';
      placeholderSpan.style.color = '#1e40af';
      placeholderSpan.style.padding = '2px 4px';
      placeholderSpan.style.borderRadius = '4px';
      placeholderSpan.style.fontFamily = 'monospace';
      placeholderSpan.textContent = `{{${placeholder}}}`;
      
      range.deleteContents();
      range.insertNode(placeholderSpan);
      
      // Move cursor after the placeholder
      range.setStartAfter(placeholderSpan);
      range.setEndAfter(placeholderSpan);
      selection.removeAllRanges();
      selection.addRange(range);
      
      updateContent();
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const placeholders = getAvailablePlaceholders();
  const placeholdersByCategory = placeholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) {
      acc[placeholder.category] = [];
    }
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, typeof placeholders>);

  return (
    <div className="space-y-6">
      {/* Template Details */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Template Name"
            value={editedTemplate.name}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
            disabled={editedTemplate.isDefault}
            placeholder="Enter template name"
          />
          
          <Input
            label="Description"
            value={editedTemplate.description}
            onChange={(e) => setEditedTemplate(prev => ({ ...prev, description: e.target.value }))}
            disabled={editedTemplate.isDefault}
            placeholder="Enter template description"
          />
        </CardContent>
      </Card>

      {/* Validation Status */}
      {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Template Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-700 mb-2">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Placeholders Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Available Placeholders</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlaceholders(!showPlaceholders)}
                >
                  {showPlaceholders ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showPlaceholders && (
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {Object.entries(placeholdersByCategory).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
                      <div className="space-y-1">
                        {items.map((placeholder) => (
                          <button
                            key={placeholder.key}
                            className="w-full text-left text-xs font-mono bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                            onClick={() => insertPlaceholder(placeholder.key)}
                            title={placeholder.description}
                          >
                            {`{{${placeholder.key}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Click any placeholder to insert it at cursor position.
                </p>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Editor Panel */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Template Editor
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Toolbar */}
              <div className="border border-gray-200 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('bold')}
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('italic')}
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('underline')}
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyLeft')}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyCenter')}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('justifyRight')}
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('insertUnorderedList')}
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => execCommand('insertOrderedList')}
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-1" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertLink}
                  title="Insert Link"
                >
                  <Link className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={insertImage}
                  title="Insert Image"
                >
                  <Image className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-gray-300 mx-1" />
                
                <select
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  onChange={(e) => execCommand('formatBlock', e.target.value)}
                  defaultValue=""
                >
                  <option value="">Format</option>
                  <option value="h1">Heading 1</option>
                  <option value="h2">Heading 2</option>
                  <option value="h3">Heading 3</option>
                  <option value="p">Paragraph</option>
                </select>
                
                <select
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  onChange={(e) => execCommand('fontName', e.target.value)}
                  defaultValue=""
                >
                  <option value="">Font</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                className="border border-gray-200 border-t-0 rounded-b-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: editedTemplate.content }}
                onInput={updateContent}
                onBlur={updateContent}
              />

              {/* Preview */}
              {showPreview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: editedTemplate.content }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={editedTemplate.isDefault || !validationResult.isValid}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Template
        </Button>
      </div>

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