const CURRENCY = "BRL";
const DEFAULT_VALUE = 9.9;
const CONTENT_ID = "mega-tarot-reading";
const CONTENT_NAME = "Leitura personalizada MegaTarot";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track?: (...args: unknown[]) => void;
    };
  }
}

type ReadingEvent = {
  readingId: string;
  readingName?: string;
};

type OrderEvent = ReadingEvent & {
  orderId: string;
  offerName?: string;
  amount?: number;
};

function metaPayload(input: ReadingEvent & { offerName?: string; amount?: number }) {
  return {
    content_ids: [`${CONTENT_ID}:${input.readingId}`],
    content_name: input.offerName || input.readingName || CONTENT_NAME,
    content_type: "product",
    value: input.amount ?? DEFAULT_VALUE,
    currency: CURRENCY,
  };
}

function tiktokPayload(input: ReadingEvent & { offerName?: string; amount?: number }) {
  const value = input.amount ?? DEFAULT_VALUE;
  const name = input.offerName || input.readingName || CONTENT_NAME;

  return {
    contents: [
      {
        content_id: `${CONTENT_ID}:${input.readingId}`,
        content_name: name,
        content_type: "product",
        quantity: 1,
        price: value,
      },
    ],
    content_type: "product",
    description: name,
    value,
    currency: CURRENCY,
  };
}

function sendOnce(platform: "meta" | "tiktok", event: string, eventId: string, send: () => void) {
  if (typeof window === "undefined") return;

  const storageKey = `mega-tarot-pixel:${platform}:${event}:${eventId}`;

  try {
    if (window.localStorage.getItem(storageKey)) return;
  } catch {
    // Tracking must remain best-effort when browser storage is unavailable.
  }

  try {
    send();
  } catch {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // A storage failure must never interrupt checkout or result access.
  }
}

export function trackReadingViewed(input: ReadingEvent) {
  if (typeof window === "undefined") return;

  try {
    window.fbq?.("track", "ViewContent", metaPayload(input));
  } catch {
    // Advertising tracking must never interfere with the reading flow.
  }

  try {
    window.ttq?.track?.("ViewContent", tiktokPayload(input));
  } catch {
    // Advertising tracking must never interfere with the reading flow.
  }
}

export function trackFormCompleted(input: OrderEvent) {
  const eventId = `form:${input.orderId}`;

  if (window.fbq) {
    sendOnce("meta", "Lead", eventId, () => {
      window.fbq?.("track", "Lead", metaPayload(input), { eventID: eventId });
    });
  }

  if (window.ttq?.track) {
    sendOnce("tiktok", "SubmitForm", eventId, () => {
      window.ttq?.track?.("SubmitForm", tiktokPayload(input), { event_id: eventId });
    });
  }
}

export function trackCheckoutStarted(input: OrderEvent) {
  const eventId = `checkout:${input.orderId}`;

  if (window.fbq) {
    sendOnce("meta", "InitiateCheckout", eventId, () => {
      window.fbq?.("track", "InitiateCheckout", metaPayload(input), { eventID: eventId });
    });
  }

  if (window.ttq?.track) {
    sendOnce("tiktok", "InitiateCheckout", eventId, () => {
      window.ttq?.track?.("InitiateCheckout", tiktokPayload(input), { event_id: eventId });
    });
  }
}

export function trackPurchaseCompleted(input: OrderEvent) {
  const eventId = input.orderId;

  if (window.fbq) {
    sendOnce("meta", "Purchase", eventId, () => {
      window.fbq?.("track", "Purchase", metaPayload(input), { eventID: eventId });
    });
  }

  if (window.ttq?.track) {
    sendOnce("tiktok", "CompletePayment", eventId, () => {
      window.ttq?.track?.("CompletePayment", tiktokPayload(input), { event_id: eventId });
    });
  }
}
