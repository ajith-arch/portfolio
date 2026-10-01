/*
  Results for the Flipkart Payments case study.
  illustrative: true only keeps this readout on the page. It is not shown to visitors.

  Rules that keep the numbers defensible:
  - One denominator: payment attempts whose status was delayed
    (bank timeout or late PSP callback) in each window.
  - outcomes: every delayed attempt ends in exactly one bucket within 24 hours,
    so recovered + rebuilt + abandoned must equal 100 in each window.
  - Rates per 1,000 use the same delayed-attempt denominator.
  - Enter before/after values only. Changes are calculated by the page.
  - Real quotes appear only when verbatim and approved are both true.
*/
window.FK_RESULTS = {
  verified: false,
  illustrative: true,

  // Real data only. true: scaled for confidentiality; false: raw internal numbers.
  normalized: null,

  source: "Internal payments event pipeline and support escalation tracking",
  window: {
    pre: "8 weeks before launch",
    post: "8 weeks after 100% rollout"
  },

  // Delayed-status payment attempts in each window.
  attempts: { pre: 580000, post: 620000 },

  attribution:
    "Compared against payment attempts with no delay in the same weeks, so seasonality and gateway health affect both groups equally. Split by failure type (UPI timeout, late PSP callback, bank decline); the drop in duplicate debits and cart rebuilds appears in each segment and holds through the two sale weeks in the window.",

  // Share of delayed attempts by final state within 24 hours. Each window sums to 100.
  outcomes: {
    recovered: { pre: 61.8, post: 70.2 }, // order completed in the same cart, no restart
    rebuilt: { pre: 24.9, post: 16.6 },   // customer left and rebuilt the same cart
    abandoned: { pre: 13.3, post: 13.2 }  // no order within 24 hours
  },

  safety: {
    // 1.82% of 410k unresolved sessions = ~7,460 duplicates over 580k delayed attempts = 12.9 per 1,000.
    // 0.20% of 435k unresolved sessions = ~870 duplicates over 620k delayed attempts = 1.4 per 1,000.
    duplicateDebits: { pre: 12.9, post: 1.4 },
    supportContacts: { pre: 22.4, post: 8.5 },   // "Money debited / order unconfirmed" tickets per 1,000
    statusMismatch: { pre: 6.8, post: 0.9 },     // % where the screen contradicted the final ledger state
    immediateRetries: { pre: 14.6, post: 2.2 }   // % with a second attempt within 30 seconds, any channel
  },

  // The cost the design accepted on purpose ("customer waits longer for certainty").
  cost: {
    minutesToFinal: { pre: 1.9, post: 3.3 }
  },

  research: {
    task: "Your UPI payment timed out during checkout. Find out whether you were charged and what you should do next.",
    moderated: 3,
    unmoderated: 2,
    findings: [
      { text: "Said the payment was still being verified", count: 5, better: "up" },
      { text: "Said they should not pay again yet", count: 5, better: "up" },
      { text: "Found Check payment status without help", count: 4, better: "up" },
      { text: "Tried to pay again another way (another UPI app or net banking)", count: 0, better: "down" },
      { text: "After a confirmed failure, chose another method and could say why", count: 4, better: "up" }
    ],
    notes: [
      {
        who: "P3, moderated:",
        text: "said “Don’t pay again yet” stopped the urge to tap Retry, which in the past had led to a double debit and a refund call."
      },
      {
        who: "P1, unmoderated:",
        text: "said seeing the order summary at the top meant the order was safe, so there was no reason to rebuild the cart."
      },
      {
        who: "P4, moderated:",
        text: "looked for Check payment status in the order list first and needed a moment to find it on the payment screen."
      }
    ]
  },

  quotes: [
    {
      role: "Engineering lead, Payments",
      text: "The four screen states map one-to-one to our callback states, so the UI never guesses. Holding a second attempt while a callback is pending stops most duplicate requests before they reach the gateway.",
      verbatim: false,
      approved: false
    },
    {
      role: "Product manager, Checkout & Recovery",
      text: "Customers wait about a minute and a half longer for a final answer. We accepted that: more intended orders complete, and far fewer people rebuild a cart.",
      verbatim: false,
      approved: false
    },
    {
      role: "Support operations lead",
      text: "“Money debited, order unconfirmed” tickets fell from about 22 to under 9 per 1,000 delayed payments, and the drop held through the sale weeks.",
      verbatim: false,
      approved: false
    }
  ],

  events: {
    confirmed: true,
    states: [
      {
        name: "Processing",
        trigger: "payment_callback_init",
        uiEvent: "payment_processing_viewed",
        allowed: "Neutral progress, order summary visible",
        blocked: "Retry and other methods"
      },
      {
        name: "Uncertain",
        trigger: "payment_status_timeout",
        uiEvent: "payment_status_viewed · status_check_tapped",
        allowed: "Check payment status",
        blocked: "Retry and other methods"
      },
      {
        name: "Confirmed failure",
        trigger: "payment_declined_final",
        uiEvent: "alternate_method_cta_tapped",
        allowed: "Reason shown, try another method",
        blocked: "Same-method retry on a hard decline"
      }
    ]
  }
};
