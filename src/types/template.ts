export interface Template {
  id: string;
  name: string;
  description: string;
  content: string; // Template content with {{placeholders}}
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}