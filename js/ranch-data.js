/* ============================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO UPDATE THE SITE.

   It controls three things:
     1. The beef availability notice
     2. The hay price list
     3. The "last updated" date shown to customers

   How to edit:
     - Change only the text between the "quote marks".
     - Keep every comma and curly brace exactly where it is.
     - Save the file. Refresh the website. Done.

   If something breaks, the page falls back to a neutral
   "call us for current availability" message. Nothing disappears.
   ============================================================ */

window.RANCH = {

  /* Shown at the bottom of the availability sections so customers
     know how fresh this is. Update it every time you change anything. */
  lastUpdated: "August 7, 2026",

  /* Where the order and hay request forms send to.

     "/api/contact" is the ranch's own mail service. It emails the request
     to the ranch and sends the customer a copy straight away.

     If you ever put "" (two quote marks, nothing between) here instead,
     the form falls back to opening the customer's own email app with
     everything filled in. That needs no setup, but the customer has to
     press send themselves. */
  formEndpoint: "/api/contact",

  /* Where order requests go when formEndpoint is empty. */
  orderEmail: "silvaranchbeef@gmail.com",

  /* ---------- BEEF ---------- */
  beef: {

    /* Pick ONE. Type it exactly as shown, including the quote marks.
         "open"     -> green dot, "Taking orders now"
         "waitlist" -> amber dot, "Waitlist only"
         "closed"   -> grey dot,  "Not taking orders"                */
    status: "open",

    /* The short headline next to the dot. */
    headline: "Taking orders for the Fall 2026 harvest",

    /* One or two plain sentences underneath. */
    detail: "Whole, half and quarter shares are available. Orders are filled in the order they come in, so the earlier you send your request the more choice you have over harvest date.",

    /* The one line about price that shows on the Beef page.
       PLACEHOLDER — replace with Rosie's real wording and figure.
       Example: "Currently $4.25 per pound of hanging weight, plus the
       butcher's cut and wrap fee paid directly to the shop."
       Put "" (two quote marks, nothing between) to hide this line. */
    pricing: "Ask us for the current price per pound of hanging weight. Butcher cut and wrap is billed separately by the shop.",

    /* The date you stop taking orders for this harvest.
       Put "" (two quote marks, nothing between) to hide this line. */
    deadline: "Order requests close September 30, 2026"
  },

  /* ---------- HAY ---------- */
  hay: {

    /* One plain sentence above the price list. */
    note: "Prices move with the hay market and are not set until the hay is baled. Call Mike to confirm before you drive out.",

    /* Each line in the price list is one block between { and }.
       To add a line, copy a whole block and change the words.
       To remove a line, delete the whole block including its comma.

       status: "available"  -> normal row
               "coming"     -> normal row, use the "when" field
               "sold-out"   -> row is greyed out                     */
    items: [
      {
        name: "2025 Alfalfa",
        price: "$15.00 per bale",
        when: "By the stack of 88 only",
        status: "available"
      },
      {
        name: "2026 Alfalfa",
        price: "Price set at baling",
        when: "Available May 2026",
        status: "coming"
      },
      {
        name: "2026 Alfalfa / Orchard Grass mix",
        price: "Price set at baling",
        when: "Available late June 2026",
        status: "coming"
      },
      {
        name: "Orchard grass, first cutting",
        price: "Price set at baling",
        when: "Available late May 2026",
        status: "coming"
      },
      {
        name: "2026 Pasture grass hay",
        price: "Price set at baling",
        when: "Available late May 2026",
        status: "coming"
      },
      {
        name: "2025 Wheat",
        price: "—",
        when: "Sold out",
        status: "sold-out"
      }
    ]
  }
};
