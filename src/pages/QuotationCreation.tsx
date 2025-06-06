import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Calculator,
  Truck,
  Users,
  MapPin,
  Clock,
  IndianRupee,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType } from '../types/equipment';
import { Quotation, QuotationInputs } from '../types/quotation';
import { getDealById } from '../services/dealService';
import { getEquipment } from '../services/firestore/equipmentService';
import { createQuotation } from '../services/quotationService';
import { getResourceRatesConfig, getAdditionalParamsConfig } from '../services/configService';
import { formatCurrency } from '../utils/formatters';

const ORDER_TYPE_OPTIONS = [
  { value: 'micro', label: 'Micro (1-10 days)' },
  { value: 'small', label: 'Small (11-25 days)' },
  { value: 'monthly', label: 'Monthly (26-365 days)' },
  { value: 'yearly', label: 'Yearly (366+ days)' },
];

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const DAY_NIGHT_OPTIONS = [
  { value: 'day', label: 'Day Shift' },
  { value: 'night', label: 'Night Shift' },
];

const USAGE_OPTIONS = [
  { value: 'normal', label: 'Normal Usage' },
  { value: 'heavy', label: 'Heavy Usage' },
];

const RISK_FACTOR_OPTIONS = [
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
];

export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const [formData, setFormData] = useState<QuotationInputs>({
    orderType: 'micro',
    numberOfDays: 1,
    workingHours: 8,
    selectedEquipment: {
      id: '',
      equipmentId: '',
      name: '',
      baseRates: {
        micro: 0,
        small: 0,
        monthly: 0,
        yearly: 0,
      }
    },
    foodResources: 0,
    accomResources: 0,
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    extraCharge: 0,
    incidentalCharges: 0,
    otherFactorsCharge: 0,
    billing: 'gst',
    baseRate: 0,
    includeGst: true,
    shift: 'single',
    dayNight: 'day',
    mobDemob: 0,
    mobRelaxation: 0,
    runningCostPerKm: 0,
  });

  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    if (!dealId) {
      navigate('/quotations');
      return;
    }
    fetchData();
  }, [dealId]);

  useEffect(() => {
    calculateTotal();
  }, [formData]);

  const fetchData = async () => {
    try {
      const [dealData, equipmentData] = await Promise.all([
        getDealById(dealId!),
        getEquipment()
      ]);

      if (!dealData) {
        showToast('Deal not found', 'error');
        navigate('/quotations');
        return;
      }

      setDeal(dealData);
      setEquipment(equipmentData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = async () => {
    try {
      if (!formData.numberOfDays || !formData.baseRate) {
        setCalculatedTotal(0);
        return;
      }

      const days = Number(formData.numberOfDays);
      const isMonthly = days > 25;
      const effectiveDays = isMonthly ? 26 : days;
      const workingHours = Number(formData.workingHours || 8);
      const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
      
      // Calculate working cost
      let workingCost;
      if (isMonthly) {
        const hourlyRate = (formData.baseRate / 26) / workingHours;
        workingCost = hourlyRate * workingHours * effectiveDays * shiftMultiplier;
      } else {
        workingCost = formData.baseRate * workingHours * effectiveDays * shiftMultiplier;
      }

      // Get configuration for calculations
      const [resourceConfig, additionalConfig] = await Promise.all([
        getResourceRatesConfig(),
        getAdditionalParamsConfig()
      ]);

      // Calculate usage load factor
      const usagePercentage = formData.usage === 'heavy' ? 
        additionalConfig.usageRates.heavy / 100 : 
        additionalConfig.usageRates.light / 100;
      const usageLoadFactor = formData.baseRate * usagePercentage;

      // Calculate elongation cost
      const elongationCost = workingCost * 0.15;
      
      // Calculate food and accommodation cost
      const foodDailyRate = resourceConfig.foodRatePerMonth / 26;
      const accomDailyRate = resourceConfig.accommodationRatePerMonth / 26;
      const foodAccomCost = isMonthly
        ? (Number(formData.foodResources || 0) * resourceConfig.foodRatePerMonth) + 
          (Number(formData.accomResources || 0) * resourceConfig.accommodationRatePerMonth)
        : ((Number(formData.foodResources || 0) * foodDailyRate) + 
           (Number(formData.accomResources || 0) * accomDailyRate)) * effectiveDays;

      // Calculate mob-demob cost
      const distance = Number(formData.siteDistance || 0);
      const trailerCost = Number(formData.mobDemob || 0);
      const mobRelaxationPercent = Number(formData.mobRelaxation || 0);
      const runningCostPerKm = formData.runningCostPerKm || 0;
      
      const distToSiteCost = distance * runningCostPerKm * 2;
      const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
      const mobDemobCost = (distToSiteCost - mobRelaxationAmount) + trailerCost;

      // Calculate risk adjustment
      let riskAdjustment = 0;
      switch (formData.riskFactor) {
        case 'high': 
          riskAdjustment = formData.baseRate * (additionalConfig.riskFactors.high / 100); 
          break;
        case 'medium': 
          riskAdjustment = formData.baseRate * (additionalConfig.riskFactors.medium / 100); 
          break;
        case 'low': 
          riskAdjustment = formData.baseRate * (additionalConfig.riskFactors.low / 100); 
          break;
      }

      // Calculate extra charges
      const extraCharges = 
        Number(formData.extraCharge || 0) +
        Number(formData.incidentalCharges || 0) +
        Number(formData.otherFactorsCharge || 0);

      // Calculate subtotal
      const subtotal = 
        workingCost +
        elongationCost +
        foodAccomCost +
        mobDemobCost +
        riskAdjustment +
        usageLoadFactor +
        extraCharges;

      // Add GST if applicable
      const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
      
      setCalculatedTotal(subtotal + gstAmount);
    } catch (error) {
      console.error('Error calculating total:', error);
      setCalculatedTotal(0);
    }
  };

  const handleEquipmentChange = (equipmentId: string) => {
    const selectedEquipment = equipment.find(eq => eq.id === equipmentId);
    if (selectedEquipment) {
      const baseRate = selectedEquipment.baseRates[formData.orderType] || 0;
      setFormData(prev => ({
        ...prev,
        selectedEquipment: {
          id: selectedEquipment.id,
          equipmentId: selectedEquipment.equipmentId,
          name: selectedEquipment.name,
          baseRates: selectedEquipment.baseRates
        },
        baseRate,
        runningCostPerKm: selectedEquipment.runningCostPerKm
      }));
    }
  };

  const handleOrderTypeChange = (orderType: OrderType) => {
    const baseRate = formData.selectedEquipment.baseRates[orderType] || 0;
    setFormData(prev => ({
      ...prev,
      orderType,
      baseRate
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deal) {
      showToast('Deal information not found', 'error');
      return;
    }

    if (!formData.selectedEquipment.id) {
      showToast('Please select equipment', 'error');
      return;
    }

    if (formData.numberOfDays <= 0) {
      showToast('Please enter valid number of days', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        leadId: deal.leadId,
        customerId: deal.customerId,
        customerName: deal.customer.name,
        customerContact: {
          name: deal.customer.name,
          email: deal.customer.email,
          phone: deal.customer.phone,
          company: deal.customer.company,
          address: deal.customer.address,
          designation: deal.customer.designation || 'N/A'
        },
        totalRent: calculatedTotal,
        version: 1,
        createdBy: user?.id || '',
        status: 'draft'
      };

      await createQuotation(quotationData);
      
      showToast('Quotation created successfully', 'success');
      navigate('/quotations');
    } catch (error) {
      console.error('Error creating quotation:', error);
      showToast('Error creating quotation', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (
    title: string,
    variant: 'success' | 'error' | 'warning' = 'success',
    description?: string
  ) => {
    setToast({ show: true, title, variant, description });
    setTimeout(() => setToast({ show: false, title: '' }), 3000);
  };

  if (!user || (user.role !== 'sales_agent' && user.role !== 'admin')) {
    return (
      <div className="p-4 text-center text-gray-500">
        You don't have permission to access this page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading quotation form...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4 text-center text-gray-500">
        Deal not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/quotations')}
            leftIcon={<ArrowLeft size={16} />}
          >
            Back to Quotations
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Quotation</h1>
            <p className="text-gray-600">For {deal.customer.name} - {deal.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Estimated Total</div>
          <div className="text-2xl font-bold text-primary-600">
            {formatCurrency(calculatedTotal)}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer Name</label>
                <p className="text-gray-900 mt-1">{deal.customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Company</label>
                <p className="text-gray-900 mt-1">{deal.customer.company}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{deal.customer.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-gray-900 mt-1">{deal.customer.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Equipment & Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Select Equipment"
                options={[
                  { value: '', label: 'Choose equipment...' },
                  ...equipment.map(eq => ({
                    value: eq.id,
                    label: `${eq.name} (${eq.equipmentId})`
                  }))
                ]}
                value={formData.selectedEquipment.id}
                onChange={handleEquipmentChange}
                required
              />

              <Select
                label="Order Type"
                options={ORDER_TYPE_OPTIONS}
                value={formData.orderType}
                onChange={(value) => handleOrderTypeChange(value as OrderType)}
                required
              />

              <Input
                type="number"
                label="Number of Days"
                value={formData.numberOfDays}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfDays: Number(e.target.value) }))}
                min="1"
                required
              />

              <Input
                type="number"
                label="Working Hours per Day"
                value={formData.workingHours}
                onChange={(e) => setFormData(prev => ({ ...prev, workingHours: Number(e.target.value) }))}
                min="1"
                max="24"
                required
              />

              <Select
                label="Shift Type"
                options={SHIFT_OPTIONS}
                value={formData.shift}
                onChange={(value) => setFormData(prev => ({ ...prev, shift: value as 'single' | 'double' }))}
              />

              <Select
                label="Day/Night Shift"
                options={DAY_NIGHT_OPTIONS}
                value={formData.dayNight}
                onChange={(value) => setFormData(prev => ({ ...prev, dayNight: value as 'day' | 'night' }))}
              />
            </div>

            {formData.selectedEquipment.id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Selected Equipment Rates</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Micro:</span>
                    <p className="font-medium">{formatCurrency(formData.selectedEquipment.baseRates.micro)}/hr</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Small:</span>
                    <p className="font-medium">{formatCurrency(formData.selectedEquipment.baseRates.small)}/hr</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Monthly:</span>
                    <p className="font-medium">{formatCurrency(formData.selectedEquipment.baseRates.monthly)}/month</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Yearly:</span>
                    <p className="font-medium">{formatCurrency(formData.selectedEquipment.baseRates.yearly)}/month</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="text-blue-700">Current Rate:</span>
                  <span className="font-bold text-blue-900 ml-2">
                    {formatCurrency(formData.baseRate)}
                    {formData.orderType === 'monthly' || formData.orderType === 'yearly' ? '/month' : '/hour'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Site & Logistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Site & Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Site Distance (km)"
                value={formData.siteDistance}
                onChange={(e) => setFormData(prev => ({ ...prev, siteDistance: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Running Cost per KM (₹)"
                value={formData.runningCostPerKm}
                onChange={(e) => setFormData(prev => ({ ...prev, runningCostPerKm: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Mob/Demob Cost (₹)"
                value={formData.mobDemob}
                onChange={(e) => setFormData(prev => ({ ...prev, mobDemob: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Mob Relaxation (%)"
                value={formData.mobRelaxation}
                onChange={(e) => setFormData(prev => ({ ...prev, mobRelaxation: Number(e.target.value) }))}
                min="0"
                max="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Resources & Risk */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Resources & Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Food Resources (persons)"
                value={formData.foodResources}
                onChange={(e) => setFormData(prev => ({ ...prev, foodResources: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Accommodation Resources (persons)"
                value={formData.accomResources}
                onChange={(e) => setFormData(prev => ({ ...prev, accomResources: Number(e.target.value) }))}
                min="0"
              />

              <Select
                label="Usage Type"
                options={USAGE_OPTIONS}
                value={formData.usage}
                onChange={(value) => setFormData(prev => ({ ...prev, usage: value as 'normal' | 'heavy' }))}
              />

              <Select
                label="Risk Factor"
                options={RISK_FACTOR_OPTIONS}
                value={formData.riskFactor}
                onChange={(value) => setFormData(prev => ({ ...prev, riskFactor: value as 'low' | 'medium' | 'high' }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Additional Charges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                label="Extra Charges (₹)"
                value={formData.extraCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, extraCharge: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Incidental Charges (₹)"
                value={formData.incidentalCharges}
                onChange={(e) => setFormData(prev => ({ ...prev, incidentalCharges: Number(e.target.value) }))}
                min="0"
              />

              <Input
                type="number"
                label="Other Factors Charge (₹)"
                value={formData.otherFactorsCharge}
                onChange={(e) => setFormData(prev => ({ ...prev, otherFactorsCharge: Number(e.target.value) }))}
                min="0"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeGst"
                checked={formData.includeGst}
                onChange={(e) => setFormData(prev => ({ ...prev, includeGst: e.target.checked }))}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="includeGst" className="text-sm text-gray-700">
                Include GST (18%)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Total Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Quotation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Total Quotation Amount</h3>
                  <p className="text-sm text-gray-600">
                    {formData.includeGst ? 'Including GST (18%)' : 'Excluding GST'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatCurrency(calculatedTotal)}
                  </div>
                  <p className="text-sm text-gray-500">
                    For {formData.numberOfDays} days
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/quotations')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !formData.selectedEquipment.id}
            leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
          >
            {isSaving ? 'Creating Quotation...' : 'Create Quotation'}
          </Button>
        </div>
      </form>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, title: '' })}
        />
      )}
    </div>
  );
}