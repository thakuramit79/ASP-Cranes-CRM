import { Quotation } from './quotation';

export interface Template {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  quotationData: Quotation;
} 