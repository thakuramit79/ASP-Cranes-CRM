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
  Settings,
  Calendar,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Toast } from '../components/common/Toast';
import { useAuthStore } from '../store/authStore';
import { Deal } from '../types/deal';
import { Equipment, OrderType, CraneCategory, BaseRates as EquipmentBaseRates } from '../types/equipment';
import { Quotation, QuotationInputs } from '../types/quotation';
import { getDealById } from '../services/dealService';
import { getEquipment, getEquipmentByCategory } from '../services/firestore/equipmentService';
import { createQuotation } from '../services/quotationService';
import { getResourceRatesConfig, getAdditionalParamsConfig } from '../services/configService';
import { formatCurrency } from '../utils/formatters';

const ORDER_TYPES = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const MACHINE_TYPES = [
  { value: '', label: 'Select machine type...' },
  { value: 'mobile_crane', label: 'Mobile Crane' },
  { value: 'tower_crane', label: 'Tower Crane' },
  { value: 'crawler_crane', label: 'Crawler Crane' },
  { value: 'pick_and_carry_crane', label: 'Pick & Carry Crane' },
] satisfies { value: string; label: string }[];

const SHIFT_OPTIONS = [
  { value: 'single', label: 'Single Shift' },
  { value: 'double', label: 'Double Shift' },
];

const TIME_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
];

const USAGE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'heavy', label: 'Heavy' },
];

const DEAL_TYPES = [
  { value: 'no_advance', label: 'No Advance' },
  { value: 'credit', label: 'Credit' },
  { value: 'long_credit', label: 'Long Credit' },
];

const RISK_LEVELS = [
  { value: 'high', label: 'High Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'low', label: 'Low Risk' },
];

const OTHER_FACTORS = [
  { value: 'area', label: 'Area' },
  { value: 'condition', label: 'Condition' },
  { value: 'customer_reputation', label: 'Customer Reputation' },
  { value: 'rigger', label: 'Rigger' },
  { value: 'helper', label: 'Helper' },
];

const INCIDENTAL_OPTIONS = [
  { value: 'incident1', label: 'Incident 1 - ₹5,000', amount: 5000 },
  { value: 'incident2', label: 'Incident 2 - ₹10,000', amount: 10000 },
  { value: 'incident3', label: 'Incident 3 - ₹15,000', amount: 15000 },
];

const RIGGER_AMOUNT = 40000;
const HELPER_AMOUNT = 12000;

interface QuotationFormState {
  machineType: string;
  selectedEquipment: string;
  orderType: OrderType;
  numberOfDays: number;
  workingHours: number;
  foodResources: number;
  accomResources: number;
  siteDistance: number;
  usage: 'normal' | 'heavy';
  riskFactor: 'low' | 'medium' | 'high';
  extraCharge: number;
  incidentalCharges: string[];
  otherFactorsCharge: number;
  billing: 'gst' | 'non_gst';
  baseRate: number;
  includeGst: boolean;
  shift: 'single' | 'double';
  dayNight: 'day' | 'night';
  mobDemob: number;
  mobRelaxation: number;
  runningCostPerKm: number;
  version: number;
  createdBy: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  otherFactors: string[];
  dealType?: string;
  sundayWorking?: 'yes' | 'no';
}

export function QuotationCreation() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dealId = searchParams.get('dealId');

  const [deal, setDeal] = useState<Deal | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEquipmentBaseRate, setSelectedEquipmentBaseRate] = useState<number>(0);
  const [resourceRates, setResourceRates] = useState({
    foodRatePerMonth: 0,
    accommodationRatePerMonth: 0
  });

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    duration: true,
    orderType: true,
    machineSelection: true,
    workingHours: true,
    accommodation: true,
    mobDemob: true,
    additional: true
  });

  const [toast, setToast] = useState<{
    show: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'warning';
  }>({ show: false, title: '' });

  const initialFormData: QuotationFormState = {
    machineType: '',
    selectedEquipment: '',
    orderType: 'micro',
    numberOfDays: 0,
    workingHours: 8,
    foodResources: 0,
    accomResources: 0,
    siteDistance: 0,
    usage: 'normal',
    riskFactor: 'low',
    extraCharge: 0,
    incidentalCharges: [],
    otherFactorsCharge: 0,
    billing: 'gst',
    baseRate: 0,
    includeGst: true,
    shift: 'single',
    dayNight: 'day',
    mobDemob: 0,
    mobRelaxation: 0,
    runningCostPerKm: 0,
    version: 1,
    createdBy: user?.id || '',
    status: 'draft',
    otherFactors: [],
    dealType: 'no_advance',
    sundayWorking: 'no'
  };

  const [formData, setFormData] = useState<QuotationFormState>(initialFormData);

  const [calculations, setCalculations] = useState({
    baseRate: 0,
    totalHours: 0,
    workingCost: 0,
    mobDemobCost: 0,
    foodAccomCost: 0,
    usageLoadFactor: 0,
    extraCharges: 0,
    riskAdjustment: 0,
    gstAmount: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (!dealId) {
      navigate('/quotations');
      return;
    }
    fetchData();
  }, [dealId]);

  useEffect(() => {
    calculateQuotation();
  }, [formData, selectedEquipmentBaseRate]);

  useEffect(() => {
    if (formData.machineType) {
      const fetchEquipment = async () => {
        try {
          const equipment = await getEquipmentByCategory(formData.machineType as CraneCategory);
          setAvailableEquipment(equipment);
        } catch (error) {
          console.error('Error fetching equipment:', error);
        }
      };
      fetchEquipment();
    } else {
      setAvailableEquipment([]);
    }
  }, [formData.machineType]);

  useEffect(() => {
    if (formData.selectedEquipment && typeof formData.selectedEquipment === 'string') {
      const selected = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
      if (selected?.baseRates) {
        const baseRate = selected.baseRates[formData.orderType];
        setSelectedEquipmentBaseRate(baseRate);
        setFormData(prev => ({
          ...prev,
          baseRate,
          runningCostPerKm: selected.runningCostPerKm || 0
        }));
      }
    }
  }, [formData.orderType, formData.selectedEquipment, availableEquipment]);

  const fetchData = async () => {
    try {
      const [dealData, equipmentData, resourceConfig] = await Promise.all([
        getDealById(dealId!),
        getEquipment(),
        getResourceRatesConfig()
      ]);

      if (!dealData) {
        showToast('Deal not found', 'error');
        navigate('/quotations');
        return;
      }

      setDeal(dealData);
      setEquipment(equipmentData);
      setResourceRates({
        foodRatePerMonth: resourceConfig.foodRatePerMonth,
        accommodationRatePerMonth: resourceConfig.accommodationRatePerMonth
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const determineOrderType = (days: number): OrderType => {
    if (days > 25) {
      return 'monthly';
    } else if (days > 10) {
      return 'small';
    }
    return 'micro';
  };

  const calculateQuotation = () => {
    if (!formData.numberOfDays || !selectedEquipmentBaseRate) {
      setCalculations({
        baseRate: 0,
        totalHours: 0,
        workingCost: 0,
        mobDemobCost: 0,
        foodAccomCost: 0,
        usageLoadFactor: 0,
        extraCharges: 0,
        riskAdjustment: 0,
        gstAmount: 0,
        totalAmount: 0,
      });
      return;
    }

    const days = Number(formData.numberOfDays);
    const isMonthly = days > 25;
    const effectiveDays = isMonthly ? 26 : days;
    const workingHours = calculateWorkingHours(effectiveDays);
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    
    let workingCost;
    if (isMonthly) {
      const actualHours = parseFloat(formData.workingHours.toString()) || 8;
      const hourlyRate = (selectedEquipmentBaseRate / 26) / actualHours;
      workingCost = hourlyRate * actualHours * effectiveDays * shiftMultiplier;
    } else {
      workingCost = selectedEquipmentBaseRate * workingHours * shiftMultiplier;
    }

    const usagePercentage = formData.usage === 'heavy' ? 0.10 : 0.05;
    const usageLoadFactor = selectedEquipmentBaseRate * usagePercentage;
    
    let foodAccomCost;
    if (isMonthly) {
      foodAccomCost = (
        (Number(formData.foodResources) * resourceRates.foodRatePerMonth) +
        (Number(formData.accomResources) * resourceRates.accommodationRatePerMonth)
      );
    } else {
      const foodDailyRate = resourceRates.foodRatePerMonth / 26;
      const accomDailyRate = resourceRates.accommodationRatePerMonth / 26;
      foodAccomCost = (
        (Number(formData.foodResources) * foodDailyRate +
        Number(formData.accomResources) * accomDailyRate) *
        effectiveDays
      );
    }

    const mobDemobCost = calculateMobDemobCost();
    
    let riskAdjustment = 0;
    switch (formData.riskFactor) {
      case 'high': riskAdjustment = selectedEquipmentBaseRate * 0.15; break;
      case 'medium': riskAdjustment = selectedEquipmentBaseRate * 0.10; break;
      case 'low': riskAdjustment = selectedEquipmentBaseRate * 0.05; break;
    }

    const incidentalChargesTotal = formData.incidentalCharges.reduce((sum, val) => {
      const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
      return sum + (found ? found.amount : 0);
    }, 0);
    
    let otherFactorsTotal = 0;
    if (formData.otherFactors.includes('rigger')) otherFactorsTotal += RIGGER_AMOUNT;
    if (formData.otherFactors.includes('helper')) otherFactorsTotal += HELPER_AMOUNT;
    
    const extraCharges = (
      Number(formData.extraCharge) +
      incidentalChargesTotal +
      otherFactorsTotal
    );
    
    const subtotal = (
      workingCost +
      foodAccomCost +
      mobDemobCost +
      riskAdjustment +
      usageLoadFactor +
      extraCharges
    );
    
    const gstAmount = formData.includeGst ? subtotal * 0.18 : 0;
    const totalAmount = subtotal + gstAmount;
    
    setCalculations({
      baseRate: selectedEquipmentBaseRate,
      totalHours: isMonthly ? 0 : workingHours,
      workingCost,
      mobDemobCost,
      foodAccomCost,
      usageLoadFactor,
      extraCharges,
      riskAdjustment,
      gstAmount,
      totalAmount,
    });
  };

  const calculateWorkingHours = (days: number): number => {
    const baseHours = formData.shift === 'single' ? 8 : Number(formData.workingHours);
    const shiftMultiplier = formData.shift === 'double' ? 2 : 1;
    return baseHours * days * shiftMultiplier;
  };

  const calculateMobDemobCost = (): number => {
    const distance = Number(formData.siteDistance);
    const trailerCost = Number(formData.mobDemob) || 0;
    const mobRelaxationPercent = Number(formData.mobRelaxation) || 0;
    const selectedEquip = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
    const runningCostPerKm = selectedEquip?.runningCostPerKm || 0;
    
    const distToSiteCost = distance * runningCostPerKm * 2;
    const mobRelaxationAmount = (distToSiteCost * mobRelaxationPercent) / 100;
    const finalMobDemobCost = (distToSiteCost - mobRelaxationAmount) + trailerCost;
    
    return finalMobDemobCost;
  };

  const toggleCard = (cardName: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardName]: !prev[cardName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deal) {
      showToast('Deal information not found', 'error');
      return;
    }

    if (!formData.selectedEquipment) {
      showToast('Please select equipment', 'error');
      return;
    }

    if (formData.numberOfDays <= 0) {
      showToast('Please enter valid number of days', 'error');
      return;
    }

    try {
      setIsSaving(true);

      const selectedEquipment = availableEquipment.find(eq => eq.id === formData.selectedEquipment);
      if (!selectedEquipment) {
        showToast('Selected equipment not found', 'error');
        return;
      }

      const quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> = {
        orderType: formData.orderType,
        numberOfDays: formData.numberOfDays,
        workingHours: formData.workingHours,
        selectedEquipment: {
          id: selectedEquipment.id,
          equipmentId: selectedEquipment.equipmentId,
          name: selectedEquipment.name,
          baseRates: selectedEquipment.baseRates
        },
        foodResources: formData.foodResources,
        accomResources: formData.accomResources,
        siteDistance: formData.siteDistance,
        usage: formData.usage,
        riskFactor: formData.riskFactor,
        extraCharge: formData.extraCharge,
        incidentalCharges: formData.incidentalCharges.reduce((sum, val) => {
          const found = INCIDENTAL_OPTIONS.find(opt => opt.value === val);
          return sum + (found ? found.amount : 0);
        }, 0),
        otherFactorsCharge: (formData.otherFactors.includes('rigger') ? RIGGER_AMOUNT : 0) +
          (formData.otherFactors.includes('helper') ? HELPER_AMOUNT : 0),
        billing: formData.billing,
        baseRate: formData.baseRate,
        includeGst: formData.includeGst,
        shift: formData.shift,
        dayNight: formData.dayNight,
        mobDemob: formData.mobDemob,
        mobRelaxation: formData.mobRelaxation,
        runningCostPerKm: formData.runningCostPerKm,
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
        totalRent: calculations.totalAmount,
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
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Customer Information Card */}
        <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <CardTitle className="text-lg font-medium">Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Customer Name</div>
                <div className="font-medium">{deal.customer.name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Company</div>
                <div className="font-medium">{deal.customer.company}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Designation</div>
                <div className="font-medium">{deal.customer.designation || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{deal.customer.email}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{deal.customer.phone}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">Address</div>
                <div className="font-medium">{deal.customer.address}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-6">
              {/* Duration Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('duration')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Duration</CardTitle>
                    </div>
                    {expandedCards.duration ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.duration && (
                  <CardContent className="pt-4 space-y-4">
                    <Input
                      type="number"
                      label="Number of Days"
                      value={formData.numberOfDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const days = Number(e.target.value);
                        const newOrderType = determineOrderType(days);
                        setFormData(prev => ({
                          ...prev,
                          numberOfDays: days,
                          orderType: newOrderType
                        }));
                      }}
                      required
                      min="1"
                      placeholder="Enter number of days"
                    />
                    {formData.numberOfDays && selectedEquipmentBaseRate > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.orderType !== 'monthly' ? (
                          <div className="text-sm text-gray-600">
                            Daily Rate: {formatCurrency(selectedEquipmentBaseRate * (formData.shift === 'single' ? 8 : Number(formData.workingHours)))}/day
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            Monthly Rate: {formatCurrency(selectedEquipmentBaseRate)}/month
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary-600">
                          {Number(formData.numberOfDays) > 25 ? 'Monthly rate' :
                           Number(formData.numberOfDays) > 10 ? 'Small order rate' :
                           'Micro order rate'}
                        </div>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Order Type Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('orderType')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Order Type</CardTitle>
                    </div>
                    {expandedCards.orderType ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.orderType && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Order Type"
                      options={ORDER_TYPES}
                      value={formData.orderType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        orderType: value as OrderType
                      }))}
                      disabled={Number(formData.numberOfDays) > 0}
                    />
                    {Number(formData.numberOfDays) > 0 && (
                      <div className="mt-2 text-sm text-amber-600">
                        {Number(formData.numberOfDays) > 25 ? 'Order type is set to Monthly as duration exceeds 25 days' :
                         Number(formData.numberOfDays) > 10 ? 'Order type is set to Small as duration is between 11-25 days' :
                         'Order type is set to Micro as duration is 10 days or less'}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Machine Selection Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('machineSelection')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Machine Selection</CardTitle>
                    </div>
                    {expandedCards.machineSelection ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.machineSelection && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Machine Type"
                      options={MACHINE_TYPES}
                      value={formData.machineType}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          machineType: value,
                          selectedEquipment: '',
                        }));
                        setSelectedEquipmentBaseRate(0);
                      }}
                      required
                    />

                    {formData.machineType && (
                      <Select
                        label="Select Equipment"
                        options={[
                          { value: '', label: 'Select equipment...' },
                          ...availableEquipment.map(eq => ({
                            value: eq.id,
                            label: `${eq.equipmentId} - ${eq.name} (${formatCurrency(eq.baseRates[formData.orderType])}${formData.orderType === 'monthly' ? '/month' : '/hr'})`,
                          }))
                        ]}
                        value={formData.selectedEquipment}
                        onChange={(value) => {
                          const selected = availableEquipment.find(eq => eq.id === value);
                          setFormData(prev => ({
                            ...prev,
                            selectedEquipment: value,
                          }));
                          if (selected?.baseRates) {
                            const baseRates = selected.baseRates as EquipmentBaseRates;
                            const newBaseRate = baseRates[formData.orderType];
                            setSelectedEquipmentBaseRate(newBaseRate);
                          } else {
                            setSelectedEquipmentBaseRate(0);
                          }
                        }}
                        required
                      />
                    )}
                    
                    {!availableEquipment.length && formData.machineType && (
                      <div className="text-sm text-amber-600">
                        No available equipment found for this machine type
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>

              {/* Working Hours Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('workingHours')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Working Hours</CardTitle>
                    </div>
                    {expandedCards.workingHours ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.workingHours && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Shift"
                      options={SHIFT_OPTIONS}
                      value={formData.shift}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          shift: value as 'single' | 'double'
                        }));
                      }}
                    />
                    <div>
                      <Input
                        type="number"
                        label="Number of Hours"
                        value={formData.workingHours}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            const numValue = parseFloat(value);
                            if (!value || (numValue >= 1 && numValue <= 24)) {
                              setFormData(prev => ({ ...prev, workingHours: numValue || 8 }));
                            }
                          }
                        }}
                        required
                        placeholder="Enter hours (e.g. 7.5, 8, 8.5)"
                      />
                      <div className="flex items-center mt-1.5 text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-1.5" />
                        <span>Standard single shift duration is 8 hours</span>
                      </div>
                    </div>
                    <Select
                      label="Day/Night"
                      options={TIME_OPTIONS}
                      value={formData.dayNight}
                      onChange={(value) => setFormData(prev => ({ ...prev, dayNight: value as 'day' | 'night' }))}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="sundayWorking"
                        checked={formData.sundayWorking === 'yes'}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          sundayWorking: e.target.checked ? 'yes' : 'no' 
                        }))}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="sundayWorking" className="text-sm">
                        Sunday Working
                      </label>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Accommodation Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('accommodation')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Accommodation</CardTitle>
                    </div>
                    {expandedCards.accommodation ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.accommodation && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Input
                        type="number"
                        label="Number of Resources (Food)"
                        value={formData.foodResources}
                        onChange={(e) => setFormData(prev => ({ ...prev, foodResources: Number(e.target.value) }))}
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹{resourceRates.foodRatePerMonth}/month per person
                      </div>
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Number of Resources (Accommodation)"
                        value={formData.accomResources}
                        onChange={(e) => setFormData(prev => ({ ...prev, accomResources: Number(e.target.value) }))}
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Rate: ₹{resourceRates.accommodationRatePerMonth}/month per person
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Mob - Demob Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('mobDemob')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Truck className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Mob - Demob</CardTitle>
                    </div>
                    {expandedCards.mobDemob ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.mobDemob && (
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <Input
                        type="number"
                        label="Distance to Site (km)"
                        value={formData.siteDistance}
                        onChange={(e) => setFormData(prev => ({ ...prev, siteDistance: Number(e.target.value) }))}
                        placeholder="Enter distance in kilometers"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Trailer Cost"
                        value={formData.mobDemob}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobDemob: Number(e.target.value) }))}
                        placeholder="Enter additional trailer charges"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Mob Relaxation"
                        value={formData.mobRelaxation}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobRelaxation: Number(e.target.value) }))}
                        placeholder="Enter relaxation value (X%)"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        Enter percentage value for discount on distance cost
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Additional Parameters Card */}
              <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors duration-200" onClick={() => toggleCard('additional')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-500" />
                      <CardTitle className="text-lg font-medium">Additional Parameters</CardTitle>
                    </div>
                    {expandedCards.additional ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </CardHeader>
                {expandedCards.additional && (
                  <CardContent className="pt-4 space-y-4">
                    <Select
                      label="Usage"
                      options={USAGE_OPTIONS}
                      value={formData.usage}
                      onChange={(value) => setFormData(prev => ({ ...prev, usage: value as 'normal' | 'heavy' }))}
                    />
                    <div className="flex items-center mt-1.5 text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      <span>Usage rates: Normal - 5% of base rate | Heavy - 10% of base rate</span>
                    </div>
                    
                    <Select
                      label="Deal Type"
                      options={DEAL_TYPES}
                      value={formData.dealType}
                      onChange={(value) => setFormData(prev => ({ ...prev, dealType: value }))}
                    />
                    
                    <Input
                      type="number"
                      label="Extra Commercial Charges"
                      value={formData.extraCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, extraCharge: Number(e.target.value) }))}
                    />
                    
                    <Select
                      label="Risk Factor"
                      options={RISK_LEVELS}
                      value={formData.riskFactor}
                      onChange={(value) => setFormData(prev => ({ ...prev, riskFactor: value as 'low' | 'medium' | 'high' }))}
                    />
                    
                    <div className="flex items-center mt-1.5 text-sm text-gray-600">
                      <AlertTriangle className="w-4 h-4 mr-1.5" />
                      <span>Risk rates: Low - 5% | Medium - 10% | High - 15% of base rate</span>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Incidental Charges</label>
                      <div className="space-y-2">
                        {INCIDENTAL_OPTIONS.map(opt => (
                          <label key={opt.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.incidentalCharges.includes(opt.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  incidentalCharges: e.target.checked
                                    ? [...prev.incidentalCharges, opt.value]
                                    : prev.incidentalCharges.filter(val => val !== opt.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Other Factors</label>
                      <div className="space-y-2">
                        {OTHER_FACTORS.map((factor) => (
                          <label key={factor.value} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors duration-200">
                            <input
                              type="checkbox"
                              checked={formData.otherFactors.includes(factor.value)}
                              onChange={e => {
                                setFormData(prev => ({
                                  ...prev,
                                  otherFactors: e.target.checked
                                    ? [...prev.otherFactors, factor.value]
                                    : prev.otherFactors.filter(f => f !== factor.value)
                                }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700">
                              {factor.label}
                              {factor.value === 'rigger' && ' (₹40,000)'}
                              {factor.value === 'helper' && ' (₹12,000)'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="col-span-5 space-y-6 sticky top-6">
              <Card className="shadow-lg border-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <CardHeader className="border-b border-gray-100 pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary-500" />
                    Quotation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEquipmentBaseRate > 0 && (
                    <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100">
                      <div className="text-sm font-medium text-primary-900 mb-2">Equipment Details</div>
                      <div className="text-2xl font-bold text-primary-700">
                        ₹{formatCurrency(selectedEquipmentBaseRate).replace('₹', '')}
                        <span className="text-base font-medium text-primary-600 ml-1">
                          {formData.orderType === 'monthly' ? '/month' : '/hr'}
                        </span>
                      </div>
                      <div className="text-sm text-primary-600 mt-1">
                        {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)} Rate
                      </div>
                      {formData.orderType === 'monthly' && (
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <span>Hourly Rate: </span>
                            <span className="font-medium ml-1">
                              ₹{formatCurrency((selectedEquipmentBaseRate / 26) / (parseFloat(formData.workingHours.toString()) || 8)).replace('₹', '')}/hr
                            </span>
                          </div>
                        </div>
                      )}
                      {formData.numberOfDays && (
                        <div className="mt-3 text-sm text-gray-600">
                          <div className="flex justify-between items-center mb-1">
                            <span>Total Days:</span>
                            <span className="font-medium">
                              {Number(formData.numberOfDays) > 25 ? '26 (Monthly)' : formData.numberOfDays}
                            </span>
                          </div>
                          {formData.orderType !== 'monthly' && (
                            <div className="flex justify-between items-center mb-1">
                              <span>Hours per Day:</span>
                              <span className="font-medium">
                                {formData.shift === 'single' ? '8' : formData.workingHours}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span>Order Type:</span>
                            <span className="font-medium">
                              {formData.orderType.charAt(0).toUpperCase() + formData.orderType.slice(1)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-500" />
                            <span className="text-sm font-medium">Working Cost</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.workingCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.workingCost / calculations.totalAmount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-success-500" />
                            <span className="text-sm font-medium">Food & Accommodation</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.foodAccomCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.foodAccomCost / calculations.totalAmount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-warning-500" />
                            <span className="text-sm font-medium">Mob/Demob Cost</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.mobDemobCost)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-warning-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.mobDemobCost / calculations.totalAmount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-error-500" />
                            <span className="text-sm font-medium">Risk & Usage</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.riskAdjustment + calculations.usageLoadFactor)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-error-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? ((calculations.riskAdjustment + calculations.usageLoadFactor) / calculations.totalAmount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium">Extra Charges</span>
                          </div>
                          <span className="font-semibold">{formatCurrency(calculations.extraCharges)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${calculations.totalAmount > 0 ? (calculations.extraCharges / calculations.totalAmount) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatCurrency(calculations.totalAmount - calculations.gstAmount)}</span>
                        </div>
                        
                        {formData.includeGst && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>GST (18%)</span>
                            <span className="font-medium">{formatCurrency(calculations.gstAmount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-lg font-semibold">Total Amount</span>
                          <span className="text-2xl font-bold text-primary-600">
                            {formatCurrency(calculations.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={formData.includeGst}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            includeGst: e.target.checked 
                          }))}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Include GST</div>
                          <div className="text-sm text-gray-500">
                            GST will be calculated at 18% of the total amount
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/quotations')}
                  className="flex-1 py-2.5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving || !formData.selectedEquipment}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700"
                  leftIcon={isSaving ? <Clock className="animate-spin" /> : <Save />}
                >
                  {isSaving ? 'Creating...' : 'Create Quotation'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

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