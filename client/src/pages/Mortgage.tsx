// src/pages/Mortgage.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/PageHeader";
import { CircleHelp, Calculator, Banknote, Home, PiggyBank } from "lucide-react"; // Removed unused icons
import { useCurrency } from "@/lib/formatters";
// Removed useToast as it was only used in the removed section
// Removed useQuery as it was only used for fetching rates
// Removed Table components as they were only used in the removed section

// --- Helper Component for Input with Slider (No changes needed) ---
interface SliderInputProps {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  currencySymbol?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label, value, setValue, min, max, step, unit = '', currencySymbol = '', formatOptions = {}
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <span className="text-sm text-primary-600 font-medium">
        {currencySymbol}{value.toLocaleString(undefined, formatOptions)}{unit}
      </span>
    </div>
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => setValue(Math.max(min, Math.min(max, Number(e.target.value))))}
      className="mb-2"
      aria-label={label}
    />
    <Slider
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(val) => setValue(val[0])}
    />
    <div className="flex justify-between text-xs text-slate-500 mt-1">
      <span>{currencySymbol}{min.toLocaleString()}{unit}</span>
      <span>{currencySymbol}{max.toLocaleString()}{unit}</span>
    </div>
  </div>
);

// --- Main Component ---
export default function Mortgage() {
  // --- State for Calculators ---
  const [loanAmount, setLoanAmount] = useState(300000);
  const [downPayment, setDownPayment] = useState(60000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [currency, setCurrency] = useState("EUR");

  const [income, setIncome] = useState(5000);
  const [expenses, setExpenses] = useState(1500);
  const [additionalDebt, setAdditionalDebt] = useState(300);
  const [interestRateAfford, setInterestRateAfford] = useState(3.5);
  const [loanTermAfford, setLoanTermAfford] = useState(30);
  const [affordableAmount, setAffordableAmount] = useState(0);

  // Removed state related to Compare Rates tab

  const { formatPrice: formatCurrencyPrice, currency: currentGlobalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
  // Removed toast initialization

  // Removed useQuery for fetching rates

  // --- Sync local currency state with global context (No changes needed) ---
  useEffect(() => {
    if (typeof setGlobalCurrency === 'function') {
      setGlobalCurrency(currency as 'EUR' | 'GBP' | 'USD');
    } else {
      console.error("useCurrency hook did not provide a setCurrency function.");
    }
  }, [currency, setGlobalCurrency]);

  // --- Calculate mortgage results (No changes needed) ---
  useEffect(() => {
    if (loanAmount > 0 && interestRate > 0 && loanTerm > 0) {
      const principal = Math.max(0, loanAmount - downPayment);
      const monthlyRate = interestRate / 100 / 12;
      const numberOfPayments = loanTerm * 12;

      if (principal > 0 && monthlyRate > 0) {
        const x = Math.pow(1 + monthlyRate, numberOfPayments);
        const monthly = (principal * x * monthlyRate) / (x - 1);
        setMonthlyPayment(monthly);
        setTotalPayments(monthly * numberOfPayments);
        setTotalInterest((monthly * numberOfPayments) - principal);
      } else {
        const payments = numberOfPayments > 0 ? numberOfPayments : 1;
        setMonthlyPayment(principal === 0 ? 0 : principal / payments);
        setTotalPayments(principal);
        setTotalInterest(0);
      }
    } else {
      setMonthlyPayment(0);
      setTotalPayments(0);
      setTotalInterest(0);
    }
  }, [loanAmount, downPayment, interestRate, loanTerm]);

  // --- Calculate affordability (No changes needed) ---
  useEffect(() => {
    if (income > 0 && interestRateAfford > 0 && loanTermAfford > 0) {
      const maxMonthlyDebt = income * 0.36;
      const availableForMortgage = Math.max(0, maxMonthlyDebt - additionalDebt - expenses);

      if (availableForMortgage > 0) {
        const monthlyRate = interestRateAfford / 100 / 12;
        const numberOfPayments = loanTermAfford * 12;

        if (monthlyRate > 0) {
          const x = Math.pow(1 + monthlyRate, numberOfPayments);
          const affordable = availableForMortgage * (x - 1) / (x * monthlyRate);
          setAffordableAmount(affordable);
        } else {
          const payments = numberOfPayments > 0 ? numberOfPayments : 1;
          setAffordableAmount(availableForMortgage * payments);
        }
      } else {
        setAffordableAmount(0);
      }
    } else {
      setAffordableAmount(0);
    }
  }, [income, expenses, additionalDebt, interestRateAfford, loanTermAfford]);

  // Removed handleApplyClick function

  // Extract currency symbol
  const currencySymbol = formatCurrencyPrice(0).replace(/[0-9.,\s]/g, '');

  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <PageHeader
        title="Mortgage Center"
        description="Plan your home financing with our suite of mortgage tools. Calculate payments and determine your budget." // Updated description
      />

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="calculator" className="mb-12">
          {/* Updated TabsList to reflect only two tabs */}
          <TabsList className="mb-8 w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:inline-flex">
            <TabsTrigger value="calculator" className="flex-1 md:flex-initial">
              <Calculator className="h-4 w-4 mr-2" />
              <span>Payment Calculator</span>
            </TabsTrigger>
            <TabsTrigger value="affordability" className="flex-1 md:flex-initial">
              <Home className="h-4 w-4 mr-2" />
              <span>Affordability</span>
            </TabsTrigger>
            {/* Removed Compare Rates TabTrigger */}
          </TabsList>

          {/* Payment Calculator Tab (No changes needed) */}
          <TabsContent value="calculator">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs Card */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Calculate Your Payment
                  </CardTitle>
                  <CardDescription>Adjust the values below to estimate your monthly mortgage payment.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Currency Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <SliderInput
                    label="Home Price"
                    value={loanAmount}
                    setValue={setLoanAmount}
                    min={50000} max={2000000} step={10000}
                    currencySymbol={currencySymbol}
                  />
                  <SliderInput
                    label="Down Payment"
                    value={downPayment}
                    setValue={setDownPayment}
                    min={0} max={loanAmount * 0.5} step={5000}
                    currencySymbol={currencySymbol}
                  />
                  <SliderInput
                    label="Interest Rate"
                    value={interestRate}
                    setValue={setInterestRate}
                    min={0.5} max={10} step={0.1}
                    unit="%"
                    formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  />
                  <SliderInput
                    label="Loan Term"
                    value={loanTerm}
                    setValue={setLoanTerm}
                    min={5} max={40} step={1}
                    unit=" years"
                  />
                </CardContent>
              </Card>

              {/* Results Card */}
              <Card className="bg-gradient-to-br from-primary to-primary-dark text-white lg:col-span-1 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Estimated Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-sm text-white/80 mb-1">Monthly Payment</div>
                    <div className="text-4xl font-bold">
                      {formatCurrencyPrice(monthlyPayment, { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/20 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Principal Loan</span>
                      <span>{formatCurrencyPrice(Math.max(0, loanAmount - downPayment))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80">Total Interest</span>
                      <span>{formatCurrencyPrice(totalInterest)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-white/90">Total Payments</span>
                      <span>{formatCurrencyPrice(totalPayments)}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button variant="secondary" className="w-full bg-white text-primary hover:bg-slate-100">
                      Apply for Pre-Approval
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Affordability Calculator Tab (No changes needed) */}
          <TabsContent value="affordability">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs Card */}
              <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Home className="h-5 w-5 text-primary" />
                     How Much Can You Afford?
                  </CardTitle>
                  <CardDescription>Estimate the maximum home price based on your finances.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <SliderInput
                    label="Gross Monthly Income"
                    value={income}
                    setValue={setIncome}
                    min={1000} max={20000} step={500}
                    currencySymbol={currencySymbol}
                  />
                  <SliderInput
                    label="Monthly Expenses (excl. housing)"
                    value={expenses}
                    setValue={setExpenses}
                    min={0} max={10000} step={100}
                    currencySymbol={currencySymbol}
                  />
                  <SliderInput
                    label="Other Monthly Debt Payments"
                    value={additionalDebt}
                    setValue={setAdditionalDebt}
                    min={0} max={5000} step={50}
                    currencySymbol={currencySymbol}
                  />
                  <SliderInput
                    label="Estimated Interest Rate"
                    value={interestRateAfford}
                    setValue={setInterestRateAfford}
                    min={0.5} max={10} step={0.1}
                    unit="%"
                    formatOptions={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                  />
                  <div className="md:col-span-2">
                     <SliderInput
                      label="Desired Loan Term"
                      value={loanTermAfford}
                      setValue={setLoanTermAfford}
                      min={5} max={40} step={1}
                      unit=" years"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Affordability Results Card */}
              <Card className="bg-gradient-to-br from-primary to-primary-dark text-white lg:col-span-1 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Affordability Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-sm text-white/80 mb-1">Estimated Affordable Loan</div>
                    <div className="text-4xl font-bold">
                      {formatCurrencyPrice(affordableAmount, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-white/70 mt-1">(Assuming 36% DTI)</p>
                  </div>

                  <div className="pt-4 border-t border-white/20 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/80">Available for Mortgage</span>
                      <span>{formatCurrencyPrice(Math.max(0, (income * 0.36) - expenses - additionalDebt))} / month</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-white/80">Recommended Down Payment (20%)</span>
                      <span>{formatCurrencyPrice(affordableAmount * 0.2)}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button variant="secondary" className="w-full bg-white text-primary hover:bg-slate-100">
                      Find Properties in Your Range
                    </Button>
                  </div>
                   <p className="text-xs text-white/70 text-center pt-2">
                      This is an estimate. Consult a financial advisor for personalized advice.
                    </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Removed Compare Rates TabsContent */}

        </Tabs>

        {/* FAQ Section (No changes needed) */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Mortgage FAQs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
             <Card className="shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                      <CircleHelp className="h-5 w-5 text-primary" /> What is a mortgage?
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-slate-600 text-sm">
                      A mortgage is a loan used to purchase property, where the property itself serves as collateral. Failure to make payments can lead to foreclosure.
                   </p>
                </CardContent>
             </Card>
             <Card className="shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                      <CircleHelp className="h-5 w-5 text-primary" /> How are rates determined?
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-slate-600 text-sm">
                      Rates depend on your credit score, loan amount vs. property value (LTV), loan term, property type, and current market conditions.
                   </p>
                </CardContent>
             </Card>
             <Card className="shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                      <CircleHelp className="h-5 w-5 text-primary" /> Fixed vs. Variable Rates?
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-slate-600 text-sm">
                      A fixed rate stays the same for the loan term, offering payment stability. A variable rate can change, potentially altering your payments.
                   </p>
                </CardContent>
             </Card>
             <Card className="shadow-sm">
                <CardHeader>
                   <CardTitle className="text-lg flex items-center gap-2">
                      <CircleHelp className="h-5 w-5 text-primary" /> How much down payment?
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-slate-600 text-sm">
                      Often 20% is recommended to avoid extra insurance (PMI/LMI), but many programs allow 3-5%. A larger down payment usually means lower monthly payments.
                   </p>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* CTA (No changes needed) */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl p-10 shadow-lg">
          <h2 className="text-3xl font-bold mb-4">Ready to Take the Next Step?</h2>
          <p className="max-w-2xl mx-auto text-white/90 mb-8">
            Connect with a mortgage advisor who can guide you through the process and help you find the best mortgage solution for your needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-slate-100">
              Get Pre-Approved Online
            </Button>
            <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" size="lg">
              Schedule a Consultation
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
