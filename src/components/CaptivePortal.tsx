import React, { useState, useEffect } from 'react';
import { Wifi, Phone, CreditCard, Clock, Database, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  dataLimit: number;
  timeLimit: number;
  description: string;
}

interface Transaction {
  _id: string;
  status: string;
  amount: number;
  mpesaCode?: string;
}

interface Voucher {
  code: string;
  expiresAt: string;
}

const CaptivePortal: React.FC = () => {
  const [step, setStep] = useState<'login' | 'plans' | 'payment' | 'success'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/plans');
      setPlans(response.data);
    } catch (err) {
      setError('Failed to load plans. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post('/api/auth/login', { phoneNumber });
      setStep('plans');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/payments/mpesa/stkpush', {
        phoneNumber,
        planId: selectedPlan._id,
        amount: selectedPlan.price
      });

      setTransactionId(response.data.transactionId);
      
      // Start polling for payment status
      pollPaymentStatus(response.data.transactionId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment initiation failed');
      setLoading(false);
    }
  };

  const pollPaymentStatus = (txnId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/status/${txnId}`);
        const { transaction, voucher: voucherData } = response.data;

        if (transaction.status === 'completed') {
          setVoucher(voucherData);
          setStep('success');
          setLoading(false);
          clearInterval(interval);
        } else if (transaction.status === 'failed') {
          setError('Payment failed. Please try again.');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (loading) {
        setError('Payment timeout. Please contact support if money was deducted.');
        setLoading(false);
      }
    }, 300000);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    return `${Math.floor(minutes / 60)} hours`;
  };

  const formatData = (mb: number) => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <Wifi className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">HotSpot WiFi</h1>
          <p className="text-gray-600">Get connected in seconds</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Login Step */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Plans Step */}
        {step === 'plans' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Plan</h2>
            {plans.map((plan) => (
              <div
                key={plan._id}
                onClick={() => handlePlanSelect(plan)}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Database className="w-4 h-4 mr-1" />
                        {formatData(plan.dataLimit)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(plan.timeLimit)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      {plan.currency} {plan.price}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Step */}
        {step === 'payment' && selectedPlan && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Confirm Payment</h2>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedPlan.name}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Data:</span>
                  <span>{formatData(selectedPlan.dataLimit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{formatTime(selectedPlan.timeLimit)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
                  <span>Total:</span>
                  <span>{selectedPlan.currency} {selectedPlan.price}</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                You will receive an M-Pesa prompt on <strong>{phoneNumber}</strong>
              </p>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay with M-Pesa
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && voucher && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
              <p className="text-gray-600">Your internet access is ready</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Your Access Code</h3>
              <div className="text-2xl font-mono font-bold text-blue-600 mb-2">
                {voucher.code}
              </div>
              <p className="text-sm text-gray-600">
                Expires: {new Date(voucher.expiresAt).toLocaleString()}
              </p>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Username:</strong> {voucher.code}</p>
              <p><strong>Password:</strong> {voucher.code}</p>
              <p className="text-xs">Use these credentials to connect to WiFi</p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              Get Another Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaptivePortal;