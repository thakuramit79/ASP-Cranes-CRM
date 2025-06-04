import React, { useState } from 'react';
import { QuotationTemplate, TemplateElement } from '../../types/quotationTemplate';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Plus, Save, X, ArrowUp, ArrowDown, Trash2, Settings, Layout } from 'lucide-react';

interface TemplateEditorProps {
  template: QuotationTemplate;
  onSave: (template: QuotationTemplate) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<QuotationTemplate>({...template});
  const [selectedElementIndex, setSelectedElementIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<'settings' | 'elements'>('elements');

  const handleAddElement = () => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type: 'text',
      content: 'New Text Element'
    };
    setEditedTemplate({
      ...editedTemplate,
      elements: [...editedTemplate.elements, newElement]
    });
    setSelectedElementIndex(editedTemplate.elements.length);
  };

  const handleElementChange = (index: number, updates: Partial<TemplateElement>) => {
    const updatedElements = [...editedTemplate.elements];
    updatedElements[index] = { ...updatedElements[index], ...updates };
    setEditedTemplate({
      ...editedTemplate,
      elements: updatedElements
    });
  };

  const handleMoveElement = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === editedTemplate.elements.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedElements = [...editedTemplate.elements];
    [updatedElements[index], updatedElements[newIndex]] = 
    [updatedElements[newIndex], updatedElements[index]];

    setEditedTemplate({
      ...editedTemplate,
      elements: updatedElements
    });
    setSelectedElementIndex(newIndex);
  };

  const handleDeleteElement = (index: number) => {
    const updatedElements = editedTemplate.elements.filter((_, i) => i !== index);
    setEditedTemplate({
      ...editedTemplate,
      elements: updatedElements
    });
    setSelectedElementIndex(-1);
  };

  const handleSave = () => {
    onSave({
      ...editedTemplate,
      updatedAt: new Date()
    });
  };

  return (
    <Dialog
      open={true}
      onClose={onCancel}
      className="w-[95vw] max-w-7xl h-[95vh]"
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Edit Template</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              leftIcon={<X className="w-4 h-4" />}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* Left Sidebar - Template Structure */}
          <div className="w-80 border-r bg-white flex flex-col overflow-hidden">
            <div className="flex border-b">
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'elements' 
                    ? 'text-primary-600 border-b-2 border-primary-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('elements')}
              >
                <Layout className="w-4 h-4 inline-block mr-2" />
                Elements
              </button>
              <button
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'settings' 
                    ? 'text-primary-600 border-b-2 border-primary-500' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="w-4 h-4 inline-block mr-2" />
                Settings
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeTab === 'settings' ? (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name
                    </label>
                    <Input
                      value={editedTemplate.name}
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        name: e.target.value
                      })}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      value={editedTemplate.description}
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        description: e.target.value
                      })}
                      placeholder="Enter template description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Size
                    </label>
                    <Select
                      value={editedTemplate.layout.pageSize}
                      onChange={(value) => setEditedTemplate({
                        ...editedTemplate,
                        layout: {
                          ...editedTemplate.layout,
                          pageSize: value as 'A4' | 'Letter'
                        }
                      })}
                      options={[
                        { label: 'A4', value: 'A4' },
                        { label: 'Letter', value: 'Letter' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orientation
                    </label>
                    <Select
                      value={editedTemplate.layout.orientation}
                      onChange={(value) => setEditedTemplate({
                        ...editedTemplate,
                        layout: {
                          ...editedTemplate.layout,
                          orientation: value as 'portrait' | 'landscape'
                        }
                      })}
                      options={[
                        { label: 'Portrait', value: 'portrait' },
                        { label: 'Landscape', value: 'landscape' }
                      ]}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Template Elements</h3>
                    <Button
                      size="sm"
                      onClick={handleAddElement}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editedTemplate.elements.map((element, index) => (
                      <div
                        key={element.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedElementIndex === index 
                            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => setSelectedElementIndex(index)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate capitalize">
                              {element.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveElement(index, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveElement(index, 'down');
                              }}
                              disabled={index === editedTemplate.elements.length - 1}
                              className="p-1 hover:bg-gray-100"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteElement(index);
                              }}
                              className="p-1 hover:bg-error-50 text-error-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Element Properties */}
          <div className="flex-1 overflow-y-auto bg-white border-l">
            {selectedElementIndex !== -1 && (
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Element Properties</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Element Type
                    </label>
                    <Select
                      value={editedTemplate.elements[selectedElementIndex].type}
                      onChange={(value) => handleElementChange(selectedElementIndex, {
                        type: value as TemplateElement['type']
                      })}
                      options={[
                        { label: 'Text', value: 'text' },
                        { label: 'Table', value: 'table' },
                        { label: 'Image', value: 'image' },
                        { label: 'Heading', value: 'heading' },
                        { label: 'List', value: 'list' },
                        { label: 'Spacer', value: 'spacer' }
                      ]}
                    />
                  </div>

                  {editedTemplate.elements[selectedElementIndex].type !== 'spacer' && (
                    <div className="space-y-6">
                      {(editedTemplate.elements[selectedElementIndex].type === 'text' || 
                        editedTemplate.elements[selectedElementIndex].type === 'heading') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content
                          </label>
                          <Input
                            value={editedTemplate.elements[selectedElementIndex].content || ''}
                            onChange={(e) => handleElementChange(selectedElementIndex, {
                              content: e.target.value
                            })}
                            placeholder={`Enter ${editedTemplate.elements[selectedElementIndex].type} content`}
                          />
                        </div>
                      )}
                      {editedTemplate.elements[selectedElementIndex].type === 'image' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Image URL
                          </label>
                          <Input
                            value={editedTemplate.elements[selectedElementIndex].imageUrl || ''}
                            onChange={(e) => handleElementChange(selectedElementIndex, {
                              imageUrl: e.target.value
                            })}
                            placeholder="Enter image URL"
                          />
                        </div>
                      )}
                      {editedTemplate.elements[selectedElementIndex].type === 'table' && (
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dynamic Field
                            </label>
                            <Input
                              value={editedTemplate.elements[selectedElementIndex].dynamicField || ''}
                              onChange={(e) => handleElementChange(selectedElementIndex, {
                                dynamicField: e.target.value
                              })}
                              placeholder="Enter dynamic field name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Headers
                            </label>
                            <Input
                              value={editedTemplate.elements[selectedElementIndex].tableData?.headers?.join(', ') || ''}
                              onChange={(e) => handleElementChange(selectedElementIndex, {
                                tableData: {
                                  ...editedTemplate.elements[selectedElementIndex].tableData,
                                  headers: e.target.value.split(',').map(h => h.trim())
                                }
                              })}
                              placeholder="Enter column headers (comma-separated)"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
} 