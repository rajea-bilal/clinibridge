"use client";
import { config } from "@root/config";
// import { useNavigate } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import {
  CheckCircle2,
  ExternalLink,
  Gift,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/ui/hyper-text";
import * as PricingCard from "@/components/ui/pricing-card";
import { authClient } from "@/lib/auth-client";
import {
  CHECKOUT_URLS,
  getNegotiatedPrice,
  NegotiateButton,
  PriceNegotiator,
} from "./price-negotiator";

// Set to false to re-enable the Buy Now button
const IS_LAUNCHING_SOON = false;

export function Pricing() {
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNegotiator, setShowNegotiator] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState<{
    price: number;
    checkoutUrl: string;
  } | null>(null);
  // const navigate = useNavigate();

  const getAvailablePlans = useAction(api.payments.getAvailablePlans);
  const [productsData, setProductsData] = useState<any>(null);
  // const createCheckoutSession = useAction(api.payments.createCheckoutSession);

  // Only check purchase status if tracking in Convex
  const purchaseStatus = useQuery(
    api.payments.hasActivePurchase,
    config.payments.trackInConvex && isAuthenticated ? {} : "skip"
  );

  // Check for negotiated price on mount and when negotiator closes
  const refreshNegotiatedPrice = useCallback(() => {
    const negotiated = getNegotiatedPrice();
    setNegotiatedPrice(negotiated);
  }, []);

  useEffect(() => {
    refreshNegotiatedPrice();
  }, [refreshNegotiatedPrice]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setIsAuthenticated(!!session?.user?.id);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Always fetch products from Polar API
    const fetchProducts = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error("Request timeout - Polar API may not be configured")
              ),
            10_000
          )
        );

        const data = (await Promise.race([
          getAvailablePlans(),
          timeoutPromise,
        ])) as any;

        setProductsData(data);
      } catch (error: any) {
        console.error("Failed to fetch products:", error);
        const errorMsg = error?.message || "Failed to load pricing";
        if (errorMsg.includes("POLAR") || errorMsg.includes("not configured")) {
          toast.error(
            "Polar API not configured. Please set POLAR_ACCESS_TOKEN and POLAR_ORGANIZATION_ID in your Convex environment."
          );
        } else {
          toast.error(errorMsg);
        }
        setIsLoading(false);
        // Set empty product data so the component can render
        setProductsData({ items: [] });
      }
    };
    fetchProducts();
  }, [getAvailablePlans]);

  useEffect(() => {
    if (productsData) {
      const products = productsData?.items || [];
      if (products.length > 0) {
        // Find the $199 product (full price) - STRICTLY by price (19900 cents)
        const fullPriceProduct =
          products.find((p: any) => p.prices?.[0]?.amount === 19_900) ||
          // Fallback: find highest priced product
          products.reduce((highest: any, p: any) => {
            const price = p.prices?.[0]?.amount || 0;
            const highestPrice = highest?.prices?.[0]?.amount || 0;
            return price > highestPrice ? p : highest;
          }, products[0]);

        if (fullPriceProduct?.prices?.length > 0) {
          setProduct(fullPriceProduct);
        } else {
          console.warn("No valid product found in Polar API response");
        }
      } else {
        console.warn("No products found in Polar API response");
      }
      setIsLoading(false);
    }
  }, [productsData]);

  const handleBuyNow = () => {
    setIsNavigatingToCheckout(true);
    // Use requestAnimationFrame to ensure React renders the loading state before navigation
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Use negotiated price checkout URL if available, otherwise default to $199
        let checkoutUrl = CHECKOUT_URLS[199]; // Default to full price
        if (negotiatedPrice) {
          // Use negotiated checkout URL, but skip placeholders
          checkoutUrl =
            negotiatedPrice.checkoutUrl &&
            !negotiatedPrice.checkoutUrl.includes("REPLACE")
              ? negotiatedPrice.checkoutUrl
              : CHECKOUT_URLS[negotiatedPrice.price] || CHECKOUT_URLS[199];
        }
        window.location.href = checkoutUrl;
      }, 100);
    });
  };

  const handleNegotiatorClose = () => {
    setShowNegotiator(false);
    // Refresh negotiated price when modal closes
    refreshNegotiatedPrice();
  };

  const features = [
    "Save 40+ hours of setup and configuration",
    "Production-grade Type-Safe codebase with crystal-clear documentation",
    "All integrations pre-wired: Auth, Payments, Email, Storage",
    "Updated weekly. Build unlimited projects",
  ];

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  // Use negotiated price if available, otherwise use product price
  const displayPrice = negotiatedPrice
    ? `$${negotiatedPrice.price}.00`
    : product?.prices?.[0]?.amount
      ? formatPrice(
          product.prices[0].amount,
          product.prices[0].currency || "usd"
        )
      : null;

  const discountPercent = negotiatedPrice
    ? Math.round(((199 - negotiatedPrice.price) / 199) * 100)
    : null;

  return (
    <section className="bg-black py-12 sm:py-16 md:py-32" id="pricing">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <HyperText
            as="h2"
            className="px-4 text-center font-mono font-semibold text-2xl text-white sm:px-0 sm:text-3xl md:text-4xl lg:text-5xl"
            duration={1000}
            startOnView
          >
            Lifetime Access
          </HyperText>
          <p className="px-4 font-mono text-sm text-white/60 sm:px-0 sm:text-base">
            Build unlimited products
          </p>
        </div>

        <div className="mt-8 flex justify-center md:mt-16">
          <PricingCard.Card className="relative w-full max-w-lg">
            <PricingCard.Header>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  <Users aria-hidden="true" />
                  <span className="text-white/60">
                    {product?.name || "Individual license"}
                  </span>
                </PricingCard.PlanName>
                <PricingCard.Badge>
                  {product?.isRecurring ? "Recurring" : "One-time purchase"}
                </PricingCard.Badge>
              </PricingCard.Plan>
              <PricingCard.Price className="flex-col items-start">
                {isLoading ? (
                  <PricingCard.MainPrice>
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </PricingCard.MainPrice>
                ) : displayPrice ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      {negotiatedPrice && negotiatedPrice.price < 199 && (
                        <PricingCard.OriginalPrice>
                          $199.00
                        </PricingCard.OriginalPrice>
                      )}
                      <PricingCard.MainPrice>
                        {displayPrice}
                      </PricingCard.MainPrice>
                      {discountPercent && discountPercent > 0 && (
                        <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono font-semibold text-green-400 text-xs">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    {negotiatedPrice && negotiatedPrice.price < 199 && (
                      <div className="mt-1 flex items-center gap-1 font-mono text-green-400 text-xs">
                        <Sparkles size={12} className="h-3 w-3" />
                        You negotiated this discount!
                      </div>
                    )}
                    <PricingCard.Period>
                      {product?.isRecurring
                        ? `/${product.prices?.[0]?.interval || "month"}`
                        : ""}
                    </PricingCard.Period>
                  </>
                ) : (
                  <PricingCard.MainPrice className="text-red-400">
                    Price unavailable
                  </PricingCard.MainPrice>
                )}
              </PricingCard.Price>
              <Button
                className="w-full bg-white/20 font-mono font-semibold text-white shadow-none hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  IS_LAUNCHING_SOON ||
                  isLoading ||
                  isNavigatingToCheckout ||
                  !product ||
                  (config.payments.trackInConvex && purchaseStatus?.hasPurchase)
                }
                onClick={handleBuyNow}
              >
                {isNavigatingToCheckout ? (
                  <>
                    <Loader2 size={16} className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : IS_LAUNCHING_SOON ? (
                  "Launching Soon"
                ) : config.payments.trackInConvex &&
                  purchaseStatus?.hasPurchase ? (
                  "Already purchased"
                ) : (
                  "Buy Now"
                )}
              </Button>
              <div className="mt-3 flex justify-center">
                <NegotiateButton onClick={() => setShowNegotiator(true)} />
              </div>
            </PricingCard.Header>

            <PricingCard.Body>
              <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <div className="flex items-start gap-3">
                  <Gift size={20} className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <h4 className="font-bold font-mono text-amber-400 text-sm">
                      Limited Time Bonus
                    </h4>
                    <p className="mt-1 font-mono text-amber-200/80 text-xs leading-relaxed">
                      Get{" "}
                      <span className="font-bold text-amber-100">
                        1 Year Free Access
                      </span>{" "}
                      to our{" "}
                      <a
                        className="inline-flex items-center gap-1 font-bold text-amber-100 underline decoration-2 decoration-amber-100 transition-colors hover:text-amber-200"
                        href="https://accelerator.codeandcreed.tech"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Accelerator
                        <ExternalLink
                          size={12}
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0"
                        />
                      </a>
                      . Simply purchase & DM me for your 100% OFF CODE.
                    </p>
                  </div>
                </div>
              </div>
              <PricingCard.List>
                {features.map((item, idx) => (
                  <PricingCard.ListItem key={idx}>
                    <span className="mt-0.5">
                      <CheckCircle2
                        size={16}
                        aria-hidden="true"
                        className="h-4 w-4 text-green-400"
                      />
                    </span>
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        </div>
      </div>

      {/* Price Chat Modal */}
      {showNegotiator && <PriceNegotiator onClose={handleNegotiatorClose} />}
    </section>
  );
}
