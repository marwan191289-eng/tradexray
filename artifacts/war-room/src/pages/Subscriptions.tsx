import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, AlertCircle, CreditCard, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingPeriod: string;
  features: string[];
  apiAccess?: boolean;
  advancedAnalytics?: boolean;
  prioritySupport?: boolean;
}

interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  paidAt: string;
}

const Subscriptions = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Mock data
    setPlans([
      {
        id: "free",
        name: "Free",
        description: "Get started with basic trading signals",
        price: 0,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Up to 10 signals per month",
          "Basic analytics",
          "Email notifications",
        ],
      },
      {
        id: "pro",
        name: "Professional",
        description: "For serious traders",
        price: 29.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Unlimited signals",
          "Advanced analytics",
          "API access",
          "Custom alerts",
          "Priority support",
        ],
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
      },
      {
        id: "elite",
        name: "Elite",
        description: "For professional traders and institutions",
        price: 99.99,
        currency: "USD",
        billingPeriod: "monthly",
        features: [
          "Everything in Pro",
          "Dedicated account manager",
          "Custom integrations",
          "Advanced reporting",
          "White-label options",
        ],
        apiAccess: true,
        advancedAnalytics: true,
        prioritySupport: true,
      },
    ]);

    setCurrentSubscription({
      id: "sub_123",
      planId: "pro",
      status: "active",
      currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
    });

    setPayments([
      {
        id: "pay_123",
        amount: 29.99,
        currency: "USD",
        status: "completed",
        description: "Professional Plan - Monthly",
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "pay_122",
        amount: 29.99,
        currency: "USD",
        status: "completed",
        description: "Professional Plan - Monthly",
        paidAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);

    setLoading(false);
  }, []);

  const currentPlan = plans.find((p) => p.id === currentSubscription?.planId);

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Subscription Plans</h1>
          <p className="text-slate-400">Manage your subscription and billing</p>
        </div>

        {/* Current Subscription */}
        {currentSubscription && (
          <Card className="bg-slate-800/50 border-emerald-500/50">
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Plan</p>
                  <p className="text-2xl font-bold text-white">{currentPlan?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <Badge className="bg-emerald-600 mt-1">{currentSubscription.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Renews on</p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Auto-renew</p>
                  <Badge variant={currentSubscription.autoRenew ? "default" : "secondary"} className="mt-1">
                    {currentSubscription.autoRenew ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`bg-slate-800/50 border-slate-700 transition-all ${
                    currentSubscription?.planId === plan.id
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "hover:border-slate-600"
                  }`}
                >
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-3xl font-bold text-white">${plan.price}</span>
                      <span className="text-slate-400 ml-2">/{plan.billingPeriod}</span>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {currentSubscription?.planId === plan.id ? (
                      <Button disabled className="w-full bg-emerald-600">
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.price === 0 ? "Downgrade" : "Upgrade"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-white">{payment.description}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(payment.paidAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">
                          ${payment.amount.toFixed(2)} {payment.currency}
                        </p>
                        <Badge
                          variant={payment.status === "completed" ? "default" : "secondary"}
                          className="mt-1"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Download your invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                    >
                      <div>
                        <p className="font-semibold text-white">INV-2024-{String(i).padStart(3, "0")}</p>
                        <p className="text-sm text-slate-400">
                          {new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="border-slate-600">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Your current usage and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">Signals Used</span>
                    <span className="text-sm font-semibold text-white">45 / 100</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">API Calls</span>
                    <span className="text-sm font-semibold text-white">1,250 / 10,000</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "12.5%" }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-300">Storage</span>
                    <span className="text-sm font-semibold text-white">250 MB / 1 GB</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>

                <Alert className="bg-blue-900/20 border-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Usage limits reset on {new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Subscriptions;
