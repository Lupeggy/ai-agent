"use client"

import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { trpc } from "@/trpc/client";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { authClient } from "@/lib/auth-client";
import { PricingCard, type PricingPlan } from "../components/pricing-card";
import { Button } from "@/components/ui/button";

export const UpgradeView = () => {
    const { data: usage } = trpc.premium.getFreeUsage.useQuery();
    const [billingInterval, setBillingInterval] = useState<'monthly' | 'annually'>('monthly');
    
    const hasSubscription = usage?.subscription !== null;
    
    // Detect current plan based on metadata if available
    const currentPlanId = hasSubscription ? (usage?.subscription?.metadata?.plan_id as string) : 'free';
    
    const pricingPlans: PricingPlan[] = [
        {
            id: 'free',
            name: 'Free',
            description: 'For individuals just getting started with AI agents',
            price: {
                monthly: 0,
                annually: 0
            },
            features: [
                { text: 'Up to 3 agents', included: true },
                { text: 'Up to 5 meetings', included: true },
                { text: 'Basic agent capabilities', included: true },
                { text: 'Community support', included: true },
                { text: 'Priority support', included: false },
                { text: 'Advanced agent capabilities', included: false },
                { text: 'Team collaboration', included: false },
            ],
            buttonText: 'Current Plan',
            isCurrentPlan: currentPlanId === 'free'
        },
        {
            id: 'pro',
            name: 'Professional',
            description: 'For power users who need more agents and meetings',
            price: {
                monthly: 19.99,
                annually: 16.99
            },
            features: [
                { text: 'Unlimited agents', included: true },
                { text: 'Up to 20 meetings', included: true },
                { text: 'Basic agent capabilities', included: true },
                { text: 'Advanced agent capabilities', included: true },
                { text: 'Priority support', included: true },
                { text: 'Team collaboration', included: false },
                { text: 'Custom integrations', included: false },
            ],
            buttonText: 'Upgrade to Pro',
            recommended: true,
            isCurrentPlan: currentPlanId === 'pro',
            checkoutLink: {
                monthly: 'https://buy.polar.sh/polar_cl_pcabD9rGIglfIrOtYRkMK7ds0Wip492JlcJQI0O4Fcb',
                annually: 'https://buy.polar.sh/polar_cl_XNWpbVg2GeHNUh9zzjCwsg2bXf5Nley77HB6k31jWjw'
            },
            polarCheckout: {
                monthly: true,
                annually: true
            }
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'For teams and businesses with advanced needs',
            price: {
                monthly: 49.99,
                annually: 41.99
            },
            features: [
                { text: 'Unlimited agents', included: true },
                { text: 'Unlimited meetings', included: true },
                { text: 'Basic agent capabilities', included: true },
                { text: 'Advanced agent capabilities', included: true },
                { text: 'Priority support', included: true },
                { text: 'Team collaboration', included: true },
                { text: 'Custom integrations', included: true },
            ],
            buttonText: 'Upgrade to Enterprise',
            isCurrentPlan: currentPlanId === 'enterprise',
            checkoutLink: {
                monthly: 'https://buy.polar.sh/polar_cl_xmKacTJLXjeQ5MVCRtbCkUfANrnTqPB1obfew0NEbio',
                annually: 'https://buy.polar.sh/polar_cl_fqlQBznECiwiUl1GtUYsCVIOoG2ipceWwFBPM26lsd8'
            },
            polarCheckout: {
                monthly: true,
                annually: true
            }
        },
    ];
    
    const handleSelectPlan = async (planId: string) => {
        // This function is now primarily for plans without a direct checkout link,
        // like a 'Free' plan or for navigating to a general customer portal.
        try {
            if (authClient) {
                await authClient.customer.portal({}); 
            } else {
                console.error('Auth client not available');
            }
        } catch (error) {
            console.error('Error handling plan selection:', error);
        }
    };

    return(
        <div>
            <div className="text-center">
                <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
                <p className="text-muted-foreground mt-2 mb-8">Choose the right plan to unlock more AI agent capabilities</p>
            </div>
            
            {/* Billing interval toggle */}
            <div className="flex items-center justify-center mb-10 w-full">
                <div className="flex items-center space-x-4 p-1 bg-secondary/30 rounded-full">
                    <button
                        onClick={() => setBillingInterval('monthly')}
                        className={`px-4 py-2 rounded-full text-sm ${billingInterval === 'monthly' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingInterval('annually')}
                        className={`px-4 py-2 rounded-full text-sm flex items-center ${billingInterval === 'annually' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                        Annually
                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Save 15%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing cards */}
            <div className="flex flex-wrap items-stretch justify-center gap-6">
                {pricingPlans.map((plan) => (
                    <PricingCard
                        key={plan.id}
                        plan={plan}
                        billingInterval={billingInterval}
                        onSelectPlan={handleSelectPlan}
                    />
                ))}
            </div>
            
            {/* Customer portal for existing subscribers */}
            {hasSubscription && (
                <div className="mt-12 text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Need to manage your subscription or billing information?
                    </p>
                    <Button variant="outline" onClick={() => authClient?.customer.portal({})}>
                        Manage Subscription
                    </Button>
                </div>
            )}
        </div>
    );
};

export const UpgradeViewLoading = () => {
    return(
        <LoadingState title="Loading Upgrade" description="Please wait while we load your upgrade."/>
    );
};

export const UpgradeViewError = () => {
    return(
        <ErrorState />
    );
};