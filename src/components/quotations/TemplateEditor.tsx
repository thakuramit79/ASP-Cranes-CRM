import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Template } from '../../types/template';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { QuotationTemplate } from './QuotationTemplate';

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = React.useState<Template>({ ...template });

  const handleChange = (field: keyof Template, value: any) => {
    setEditedTemplate((prev: Template) => ({
      ...prev,
      [field]: value,
      updatedAt: new Date()
    }));
  };

  const handleQuotationDataChange = (field: string, value: any) => {
    setEditedTemplate((prev: Template) => ({
      ...prev,
      quotationData: {
        ...prev.quotationData,
        [field]: value
      },
      updatedAt: new Date()
    }));
  };

  const handleSave = () => {
    onSave(editedTemplate);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Template Name</Label>
              <Input
                id="name"
                value={editedTemplate.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                disabled={editedTemplate.isDefault}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                id="description"
                value={editedTemplate.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
                disabled={editedTemplate.isDefault}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Customer Name</Label>
                    <Input
                      id="customerName"
                      value={editedTemplate.quotationData.customerName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('customerName', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        id="contactName"
                        value={editedTemplate.quotationData.customerContact.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('customerContact', {
                          ...editedTemplate.quotationData.customerContact,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label>Designation</Label>
                      <Input
                        id="designation"
                        value={editedTemplate.quotationData.customerContact.designation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('customerContact', {
                          ...editedTemplate.quotationData.customerContact,
                          designation: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Equipment Details</h3>
                <div className="grid gap-4">
                  <div>
                    <Label>Equipment Name</Label>
                    <Input
                      id="equipmentName"
                      value={editedTemplate.quotationData.selectedEquipment.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('selectedEquipment', {
                        ...editedTemplate.quotationData.selectedEquipment,
                        name: e.target.value
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Base Rate</Label>
                      <Input
                        id="baseRate"
                        type="number"
                        value={editedTemplate.quotationData.baseRate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('baseRate', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Order Type</Label>
                      <select
                        id="orderType"
                        className="w-full px-3 py-2 border rounded-md"
                        value={editedTemplate.quotationData.orderType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleQuotationDataChange('orderType', e.target.value)}
                      >
                        <option value="micro">Micro</option>
                        <option value="small">Small</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Additional Charges</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mobilization & Demobilization</Label>
                      <Input
                        id="mobDemob"
                        type="number"
                        value={editedTemplate.quotationData.mobDemob}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('mobDemob', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label>Extra Charges</Label>
                      <Input
                        id="extraCharge"
                        type="number"
                        value={editedTemplate.quotationData.extraCharge}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleQuotationDataChange('extraCharge', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="border rounded-lg p-4">
          <div className="bg-white">
            <QuotationTemplate quotation={editedTemplate.quotationData} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={editedTemplate.isDefault}>
          Save Changes
        </Button>
      </div>
    </div>
  );
} 