import React, { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Customer } from '../../types/lead';
import { getCustomers, createCustomer } from '../../services/firestore/customerService';

type ModalMode = 'select' | 'create';

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  initialCustomerData?: {
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    address?: string;
    designation?: string;
  };
}

export function CustomerSelectionModal({
  isOpen,
  onClose,
  onSelect,
  initialCustomerData
}: CustomerSelectionModalProps) {
  const [mode, setMode] = useState<ModalMode>('select');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: initialCustomerData?.name || '',
    email: initialCustomerData?.email || '',
    phone: initialCustomerData?.phone || '',
    address: initialCustomerData?.address || '',
    companyName: initialCustomerData?.companyName || '',
    designation: initialCustomerData?.designation || ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleCreateCustomer = async () => {
    if (!formData.name.trim()) {
      alert('Customer Name is required');
      return;
    }
    try {
      const newCustomer = await createCustomer({
        ...formData,
        name: formData.name.trim(),
        companyName: formData.companyName.trim() || 'Korean.org',
        email: formData.email.trim(),
        phone: formData.phone.trim() || 'N/A',
        address: formData.address.trim() || 'N/A',
        designation: formData.designation.trim() || 'N/A'
      });
      onSelect(newCustomer);
      onClose();
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add New Customer' : 'Select or Create Customer'}
      size="md"
    >
      {mode === 'select' ? (
        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant="default"
              onClick={() => setMode('select')}
              className="flex-1"
            >
              Select Existing Customer
            </Button>
            <Button
              variant="outline"
              onClick={() => setMode('create')}
              className="flex-1"
            >
              Create New Customer
            </Button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search customers by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg divide-y">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">Loading customers...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No customers found</div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                    onClick={() => onSelect(customer)}
                  >
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.companyName && (
                        <div className="text-sm text-gray-600">{customer.companyName}</div>
                      )}
                      {customer.designation && (
                        <div className="text-sm text-gray-600">{customer.designation}</div>
                      )}
                      <div className="text-sm text-gray-500">{customer.email}</div>
                      <div className="text-sm text-gray-500">{customer.customerId}</div>
                    </div>
                    <Button variant="ghost" size="sm">Select</Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            label="Customer Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter customer name"
            required
          />
          <Input
            label="Company Name"
            value={formData.companyName}
            onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
            placeholder="Enter company name"
            required
          />
          <Input
            label="Designation"
            value={formData.designation}
            onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
            placeholder="Enter designation"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            required
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter phone number"
            required
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Enter address"
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCustomer}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Customer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
} 