import { Check } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annually?: number;
  };
  features: PricingFeature[];
  buttonText: string;
  recommended?: boolean;
  isCurrentPlan?: boolean;
  checkoutLink?: {
    monthly?: string;
    annually?: string;
  };
  polarCheckout?: {
    monthly?: boolean;
    annually?: boolean;
  };
}

export interface PricingCardProps {
  plan: PricingPlan;
  billingInterval: 'monthly' | 'annually';
  onSelectPlan?: (planId: string) => void;
}

export function PricingCard({ plan, billingInterval, onSelectPlan }: PricingCardProps) {
  const price = billingInterval === 'annually' && plan.price.annually 
    ? plan.price.annually 
    : plan.price.monthly;

  const checkoutLink = billingInterval === 'annually' 
    ? plan.checkoutLink?.annually 
    : plan.checkoutLink?.monthly;

  const usePolarCheckout = billingInterval === 'annually'
    ? plan.polarCheckout?.annually
    : plan.polarCheckout?.monthly;

  return (
    <div className={cn(
      "relative rounded-xl border p-6 shadow-sm flex flex-col h-full w-[400px]", 
      plan.recommended ? "border-primary ring-1 ring-primary" : "border-border"
    )}>
      {plan.recommended && (
        <div className="absolute -top-3 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
          Recommended
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>

        <div className="mt-4 flex items-baseline">
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-sm text-muted-foreground ml-1">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
        </div>
      </div>

      <div className="mt-6 space-y-3 flex-grow">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check 
              className={cn(
                "h-5 w-5 flex-shrink-0", 
                feature.included ? "text-primary" : "text-muted-foreground/50"
              )} 
            />
            <span 
              className={cn(
                "text-sm", 
                !feature.included && "text-muted-foreground/70 line-through"
              )}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {usePolarCheckout && checkoutLink ? (
        <a
          href={checkoutLink}
          data-polar-checkout
          data-polar-checkout-theme="dark"
          className={cn(
            "mt-6 w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            plan.recommended ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            "h-10 px-4 py-2"
          )}
        >
          {plan.buttonText}
        </a>
      ) : (
        <Button 
          onClick={() => onSelectPlan?.(plan.id)} 
          className="mt-6 w-full" 
          variant={plan.recommended ? "default" : "outline"}
          disabled={plan.isCurrentPlan}
        >
          {plan.isCurrentPlan ? 'Current Plan' : plan.buttonText}
        </Button>
      )}
    </div>
  );
}