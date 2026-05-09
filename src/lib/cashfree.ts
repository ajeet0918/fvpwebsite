type CashfreeCheckoutOptions = {
  paymentSessionId: string;
  redirectTarget?: "_self" | "_blank" | "_top" | "_parent";
};

type CashfreeInstance = {
  checkout: (options: CashfreeCheckoutOptions) => Promise<unknown> | unknown;
};

type CashfreeFactory = (config: { mode: "sandbox" | "production" }) => CashfreeInstance;

declare global {
  interface Window {
    Cashfree?: CashfreeFactory;
  }
}

const CASHFREE_SCRIPT_ID = "cashfree-sdk-v3";
const CASHFREE_SCRIPT_SRC = "https://sdk.cashfree.com/js/v3/cashfree.js";

function resolveMode(): "sandbox" | "production" {
  const explicitMode = (import.meta.env.VITE_CASHFREE_MODE as string | undefined)?.toLowerCase();
  if (explicitMode === "sandbox" || explicitMode === "production") {
    return explicitMode;
  }

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.toLowerCase() ?? "";
  if (apiBaseUrl.includes("sandbox") || apiBaseUrl.includes("staging")) {
    return "sandbox";
  }
  return "production";
}

async function loadCashfreeScript(): Promise<void> {
  if (window.Cashfree) {
    return;
  }

  const existingScript = document.getElementById(CASHFREE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await waitForCashfreeFactory();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = CASHFREE_SCRIPT_ID;
    script.src = CASHFREE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Cashfree checkout SDK"));
    document.head.appendChild(script);
  });

  await waitForCashfreeFactory();
}

function waitForCashfreeFactory(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const maxAttempts = 50;
    let attempts = 0;

    const timer = window.setInterval(() => {
      attempts += 1;
      if (window.Cashfree) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
        reject(new Error("Cashfree checkout SDK not available"));
      }
    }, 100);
  });
}

export async function openCashfreeCheckout(paymentSessionId: string): Promise<void> {
  if (!paymentSessionId) {
    throw new Error("Missing payment session id");
  }

  await loadCashfreeScript();
  if (!window.Cashfree) {
    throw new Error("Cashfree checkout SDK is unavailable");
  }

  const cashfree = window.Cashfree({ mode: resolveMode() });
  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: "_self"
  });
}

