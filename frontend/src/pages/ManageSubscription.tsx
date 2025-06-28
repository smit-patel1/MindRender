import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Edit3, 
  Trash2,
  Crown,
  Shield,
  Zap,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice_url?: string;
  description: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    price: 0,
    interval: 'month',
    features: [
      '8,000 tokens per month',
      'Basic simulations',
      'Email support',
      'Standard processing speed'
    ],
    current: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    popular: true,
    features: [
      'Unlimited tokens',
      'Advanced simulations',
      'Priority support',
      'Faster processing',
      'Export capabilities',
      'Custom themes'
    ]
  },
  {
    id: 'premium-yearly',
    name: 'Premium Annual',
    price: 199.99,
    interval: 'year',
    features: [
      'Unlimited tokens',
      'Advanced simulations',
      'Priority support',
      'Fastest processing',
      'Export capabilities',
      'Custom themes',
      '2 months free'
    ]
  }
];

const MOCK_BILLING_HISTORY: BillingHistory[] = [
  {
    id: '1',
    date: '2024-12-01',
    amount: 0,
    status: 'paid',
    description: 'Standard Plan - December 2024'
  },
  {
    id: '2',
    date: '2024-11-01',
    amount: 0,
    status: 'paid',
    description: 'Standard Plan - November 2024'
  },
  {
    id: '3',
    date: '2024-10-01',
    amount: 0,
    status: 'paid',
    description: 'Standard Plan - October 2024'
  }
];

export default function ManageSubscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingHistory] = useState<BillingHistory[]>(MOCK_BILLING_HISTORY);

  const isJudgeAccount = user?.email === 'judgeacc90@gmail.com';
  const currentPlan = isJudgeAccount ? 'Premium' : 'Standard';
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleCancelSubscription = () => {
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowCancelModal(false);
    // Show success message or redirect
  };

  const confirmUpgrade = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setShowUpgradeModal(false);
    // Show success message or redirect
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
      case 'premium annual':
        return Crown;
      default:
        return Shield;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-500';
      case 'pending':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white">
      {/* Header */}
      <div className="pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-6">
              <Link 
                to="/profile" 
                className="flex items-center text-gray-300 hover:text-white transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Profile
              </Link>
            </div>
            <h1 className="text-4xl font-bold mb-2">Manage Subscription</h1>
            <p className="text-gray-300">Manage your MindRender subscription and billing</p>
          </div>
        </div>
      </div>

      {/* Current Subscription Status */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Current Subscription</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {React.createElement(getPlanIcon(currentPlan), { className: "w-6 h-6 text-yellow-500 mr-2" })}
                    <h3 className="text-lg font-semibold">{currentPlan} Plan</h3>
                  </div>
                  <p className="text-gray-300">
                    {isJudgeAccount ? 'Unlimited access' : '8,000 tokens per month'}
                  </p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-6 h-6 text-blue-500 mr-2" />
                    <h3 className="text-lg font-semibold">Next Billing</h3>
                  </div>
                  <p className="text-gray-300">
                    {isJudgeAccount ? 'No billing required' : nextBillingDate.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                    <h3 className="text-lg font-semibold">Status</h3>
                  </div>
                  <p className="text-green-400">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Plans */}
      {!isJudgeAccount && (
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Available Plans</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gray-800 rounded-xl p-6 relative ${
                      plan.popular ? 'ring-2 ring-yellow-500' : ''
                    } ${plan.current ? 'ring-2 ring-green-500' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    {plan.current && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          Current Plan
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-6">
                      {React.createElement(getPlanIcon(plan.name), { className: "w-12 h-12 text-yellow-500 mx-auto mb-4" })}
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold mb-1">
                        ${plan.price}
                        <span className="text-lg text-gray-400">/{plan.interval}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {!plan.current && (
                      <button
                        onClick={() => handleUpgrade(plan)}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-lg font-semibold transition-colors"
                      >
                        {plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payment Method & Billing */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Payment Method */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                {isJudgeAccount ? (
                  <div className="text-center py-8">
                    <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-300">No payment method required for Premium account</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CreditCard className="w-6 h-6 text-blue-500 mr-3" />
                          <div>
                            <p className="font-semibold">No payment method</p>
                            <p className="text-sm text-gray-400">Add a payment method to upgrade</p>
                          </div>
                        </div>
                        <button className="text-yellow-500 hover:text-yellow-400 transition-colors">
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold transition-colors">
                      Add Payment Method
                    </button>
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
                <div className="space-y-4">
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
                    <Download className="w-5 h-5 mr-2" />
                    Download Invoice
                  </button>
                  <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Update Billing Info
                  </button>
                  {!isJudgeAccount && (
                    <button 
                      onClick={handleCancelSubscription}
                      className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Billing History */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6">Billing History</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Description</th>
                      <th className="text-left py-3 px-4">Amount</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700">
                        <td className="py-3 px-4 text-gray-300">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="py-3 px-4 font-semibold">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`capitalize ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-blue-500 hover:text-blue-400 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold mb-4">
              {selectedPlan.price === 0 ? 'Downgrade' : 'Upgrade'} to {selectedPlan.name}
            </h3>
            <p className="text-gray-300 mb-6">
              {selectedPlan.price === 0 
                ? 'Are you sure you want to downgrade to the Standard plan? You will lose access to premium features.'
                : `Upgrade to ${selectedPlan.name} for $${selectedPlan.price}/${selectedPlan.interval} and unlock premium features.`
              }
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={loading}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="text-center mb-6">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Cancel Subscription</h3>
              <p className="text-gray-300">
                Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={confirmCancellation}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}