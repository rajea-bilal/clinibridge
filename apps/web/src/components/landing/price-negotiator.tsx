"use client";

import { api } from "@yugen/backend/convex/_generated/api";
import { useAction } from "convex/react";
import {
  Loader2,
  MessageCircle,
  Send,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  action?: "scrollToCalculator" | "scrollToShouldYouUse" | null;
}

interface NegotiatorProps {
  onClose: () => void;
}

const STORAGE_KEY = "yugen-negotiator-session";

interface SavedSession {
  messages: Message[];
  currentPrice: number;
  canLower: boolean;
  checkoutUrl: string;
  timestamp: number;
}

// Checkout URLs for each price point (sandbox vs production)
const IS_PRODUCTION =
  typeof window !== "undefined" &&
  !window.location.hostname.includes("localhost") &&
  !window.location.hostname.includes("127.0.0.1");

const SANDBOX_CHECKOUT_URLS: Record<number, string> = {
  199: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_cO6LhGl3hOg6YBGBgaDw1fqVWjMNLT0p8anNT2068xg/redirect",
  149: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_y0ecHqfAA9TK1Y3AcH10C8wd4bb2PTa6xzmc53ZpFUD/redirect",
  129: "https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_y0ecHqfAA9TK1Y3AcH10C8wd4bb2PTa6xzmc53ZpFUD/redirect",
};

const PRODUCTION_CHECKOUT_URLS: Record<number, string> = {
  199: "https://buy.polar.sh/polar_cl_gb1xF1lHthbnUYhF4PQWScdekYVKwD5flqs7x3ddnZ8",
  149: "https://buy.polar.sh/polar_cl_1nxwIYTYZDXEVAlGCu7HUmJBIxACjFmo73Ykf36cWkT",
  129: "https://buy.polar.sh/polar_cl_CLZpK5zIzu1NFwRZmP8K3CVfC1K5djxBRXgju20QvHO",
};

export const CHECKOUT_URLS = IS_PRODUCTION
  ? PRODUCTION_CHECKOUT_URLS
  : SANDBOX_CHECKOUT_URLS;

// Session expires after 7 days
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function loadSession(): SavedSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const session = JSON.parse(saved) as SavedSession;

    // Check if session expired
    if (Date.now() - session.timestamp > SESSION_EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Validate session has required fields
    if (!session.messages || typeof session.currentPrice !== "number") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function saveSession(session: Omit<SavedSession, "timestamp">) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, timestamp: Date.now() })
    );
  } catch {
    // localStorage might be full or disabled
  }
}

// Export function to get negotiated price for use in Pricing component
export function getNegotiatedPrice(): {
  price: number;
  checkoutUrl: string;
} | null {
  try {
    const session = loadSession();
    if (session && session.currentPrice < 199) {
      return {
        price: session.currentPrice,
        checkoutUrl:
          session.checkoutUrl ||
          CHECKOUT_URLS[session.currentPrice] ||
          CHECKOUT_URLS[149],
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function PriceNegotiator({ onClose }: NegotiatorProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(199);
  const [canLower, setCanLower] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isNavigatingToCheckout, setIsNavigatingToCheckout] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const negotiate = useAction(api.priceNegotiator.negotiate);
  const getGreeting = useAction(api.priceNegotiator.getGreeting);

  // Extract price from message text as fallback
  const extractPriceFromText = useCallback((text: string): number | null => {
    // Look for price patterns like "$129", "$149", "$199"
    const priceMatch = text.match(/\$(\d{2,3})/g);
    if (priceMatch) {
      // Get all mentioned prices and find the lowest valid one
      const prices = priceMatch
        .map((p) => Number.parseInt(p.replace("$", ""), 10))
        .filter((p) => [129, 149, 199].includes(p));

      if (prices.length > 0) {
        // Return the lowest price mentioned (the offer)
        return Math.min(...prices);
      }
    }
    return null;
  }, []);

  // Split long messages and send them with delays
  const sendMessageChunks = useCallback(
    async (
      fullMessage: string,
      action?: "scrollToCalculator" | "scrollToShouldYouUse" | null,
      onComplete?: () => void
    ) => {
      // Split by double newlines first (paragraphs), then by sentences if still long
      let chunks: string[] = [];

      // Check if message has paragraph breaks
      if (fullMessage.includes("\n\n")) {
        chunks = fullMessage.split("\n\n").filter((c) => c.trim());
      } else if (fullMessage.length > 150) {
        // Split by sentences for long single-paragraph messages
        const sentences = fullMessage.match(/[^.!?]+[.!?]+/g) || [fullMessage];
        let currentChunk = "";

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > 120 && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      } else {
        // Short message, send as one
        chunks = [fullMessage];
      }

      // Send chunks one by one with delays
      for (let i = 0; i < chunks.length; i++) {
        if (i > 0) {
          // Show typing indicator between chunks
          setIsLoading(true);
          await new Promise((resolve) =>
            setTimeout(resolve, 800 + Math.random() * 700)
          );
        }

        const isLastChunk = i === chunks.length - 1;
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: chunks[i],
            // Only add action to last chunk
            action: isLastChunk ? action : null,
          },
        ]);
        setIsLoading(false);

        // Small delay before next chunk
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      onComplete?.();
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Save session whenever state changes
  useEffect(() => {
    if (messages.length > 0) {
      saveSession({ messages, currentPrice, canLower, checkoutUrl });
    }
  }, [messages, currentPrice, canLower, checkoutUrl]);

  // Initialize - check for saved session first
  useEffect(() => {
    if (isInitialized) return;

    const initChat = async () => {
      // Try to restore saved session
      const savedSession = loadSession();
      if (savedSession && savedSession.messages.length > 0) {
        setMessages(savedSession.messages);
        setCurrentPrice(savedSession.currentPrice);
        setCanLower(savedSession.canLower);
        setCheckoutUrl(savedSession.checkoutUrl);
        setIsInitialized(true);
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      // No saved session - get fresh greeting
      setIsLoading(true);

      try {
        const response = await getGreeting();
        setMessages([{ role: "assistant", content: response.message }]);
        setCurrentPrice(response.currentPrice);
        setCanLower(response.canLower);
        setCheckoutUrl(response.checkoutUrl);
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            role: "assistant",
            content:
              "Hey! 👋 Want to negotiate? Full price is $199, but let's chat. What's on your mind?",
          },
        ]);
      }
      setIsLoading(false);
      setIsInitialized(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    initChat();
  }, [getGreeting, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Strip action field from messages - backend validator only expects role and content
      const allMessages = [
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: "user" as const, content: userMessage },
      ];

      const response = await negotiate({
        messages: allMessages,
        currentPrice,
      });

      // Update price immediately from response OR extract from text
      let newPrice = response.currentPrice;
      const extractedPrice = extractPriceFromText(response.message);

      // Use extracted price if it's lower than what backend returned (AI might have offered a discount in text)
      if (extractedPrice && extractedPrice < newPrice) {
        newPrice = extractedPrice;
      }

      // Update price state immediately (before showing chunks)
      if (newPrice !== currentPrice) {
        setCurrentPrice(newPrice);
        setCanLower(newPrice > 129);
        setCheckoutUrl(CHECKOUT_URLS[newPrice] || CHECKOUT_URLS[149]);
      }

      setIsLoading(false);

      // Send message in chunks if long, include action if present
      await sendMessageChunks(response.message, response.action);
    } catch (error) {
      console.error("Negotiation error:", error);
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I hit a snag there. Let me try again - what were you saying?",
        },
      ]);
    }
  };

  const handleAcceptPrice = () => {
    setIsNavigatingToCheckout(true);
    // Use requestAnimationFrame to ensure React renders the loading state before navigation
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Use checkout URL from state, or fallback to CHECKOUT_URLS based on current price (default to $199)
        const url =
          checkoutUrl && !checkoutUrl.includes("REPLACE")
            ? checkoutUrl
            : CHECKOUT_URLS[currentPrice] || CHECKOUT_URLS[199];
        window.location.href = url;
      }, 100);
    });
  };

  const handleStartOver = async () => {
    // Clear saved session - this resets price everywhere
    localStorage.removeItem(STORAGE_KEY);

    // Reset to full price
    setMessages([]);
    setCurrentPrice(199);
    setCanLower(true);
    setCheckoutUrl(CHECKOUT_URLS[199]);
    setIsLoading(true);

    try {
      const response = await getGreeting();
      setMessages([{ role: "assistant", content: response.message }]);
      // Keep price at 199 - greeting shouldn't change price
    } catch {
      setMessages([
        {
          role: "assistant",
          content:
            "Hey! 👋 Want to negotiate? Full price is $199, but let's chat. What's on your mind?",
        },
      ]);
    }
    setIsLoading(false);
  };

  const getPriceLabel = () => {
    if (currentPrice === 199) return "Full Price";
    if (currentPrice === 149) return "Discounted";
    return "Best Offer";
  };

  const getDiscount = () => {
    if (currentPrice === 199) return null;
    const discount = Math.round(((199 - currentPrice) / 199) * 100);
    return `${discount}% OFF`;
  };

  const handleActionClick = (
    action: "scrollToCalculator" | "scrollToShouldYouUse"
  ) => {
    onClose(); // Close the modal first

    // Small delay to let modal close animation complete
    setTimeout(() => {
      const targetId =
        action === "scrollToCalculator" ? "calculator" : "calculator";
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[600px] w-full max-w-lg flex-col overflow-hidden border border-white/10 bg-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-white/10 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-white/60" />
            <span className="font-mono font-semibold text-white">
              Let's Talk Price
            </span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 1 && (
              <button
                className="font-mono text-white/40 text-xs transition-colors hover:text-white/60"
                onClick={() =>
                  currentPrice < 199
                    ? setShowResetConfirm(true)
                    : handleStartOver()
                }
                type="button"
              >
                Start over
              </button>
            )}
            <button
              className="text-white/60 transition-colors hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Price Display */}
        <div className="border-white/10 border-b bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {currentPrice < 199 && (
                  <span className="font-mono text-lg text-white/40 line-through">
                    $199
                  </span>
                )}
                <span className="font-bold font-mono text-2xl text-white">
                  ${currentPrice}
                </span>
                {getDiscount() && (
                  <span className="rounded bg-green-500/20 px-2 py-0.5 font-mono font-semibold text-green-400 text-xs">
                    {getDiscount()}
                  </span>
                )}
              </div>
              <span className="font-mono text-white/40 text-xs">
                {getPriceLabel()}
              </span>
            </div>
            <Button
              className="bg-white font-mono text-black hover:bg-white/90"
              disabled={isNavigatingToCheckout}
              onClick={handleAcceptPrice}
              size="sm"
            >
              {isNavigatingToCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Accept & Buy
                </>
              )}
            </Button>
          </div>
          {!canLower && (
            <div className="mt-2 flex items-center gap-1 font-mono text-amber-400 text-xs">
              <Sparkles className="h-3 w-3" />
              This is my best and final offer!
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={index}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 font-mono text-sm ${
                    message.role === "user"
                      ? "bg-white/10 text-white"
                      : "border border-white/10 bg-white/5 text-white/80"
                  }`}
                >
                  {message.content}
                  {message.action && (
                    <button
                      className="mt-2 flex w-full items-center justify-center gap-2 border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400 transition-colors hover:bg-yellow-500/20"
                      onClick={() => handleActionClick(message.action!)}
                      type="button"
                    >
                      {message.action === "scrollToCalculator"
                        ? "Check Pricing Calculator →"
                        : "See if it's right for you →"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-white/40" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form className="border-white/10 border-t p-4" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-white placeholder:text-white/40 focus:border-white/20 focus:outline-none"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              ref={inputRef}
              type="text"
              value={input}
            />
            <Button
              className="bg-white/10 text-white hover:bg-white/20"
              disabled={isLoading || !input.trim()}
              size="icon"
              type="submit"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm border border-white/10 bg-black p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-mono font-semibold text-lg text-white">
              Start over?
            </h3>
            <p className="mt-2 font-mono text-sm text-white/60">
              You'll lose any discounts you've received. Your current price is $
              {currentPrice}.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1 bg-white/10 font-mono text-white hover:bg-white/20"
                onClick={() => setShowResetConfirm(false)}
                size="sm"
              >
                Keep discount
              </Button>
              <Button
                className="flex-1 bg-red-500/20 font-mono text-red-400 hover:bg-red-500/30"
                onClick={() => {
                  setShowResetConfirm(false);
                  handleStartOver();
                }}
                size="sm"
              >
                Reset anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Button to open the negotiator
export function NegotiateButton({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={`group flex items-center gap-2 font-mono text-sm text-white/60 transition-colors hover:text-white ${className}`}
      onClick={onClick}
      type="button"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="underline-offset-2 group-hover:underline">
        Want to negotiate?
      </span>
    </button>
  );
}
