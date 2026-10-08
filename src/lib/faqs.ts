import { EVENT } from "./event";

export const faqs = [
  {
    q: "How do I get my pass after paying?",
    a: "Instantly. Your pass with a QR code appears on screen the moment payment is confirmed and is emailed to you with a PDF attached. You can also retrieve it any time from “Find my booking”.",
  },
  {
    q: "Do I need to print anything?",
    a: "No. Show the QR on your phone at the gate. Printed PDFs work too. Each QR scans exactly once.",
  },
  {
    q: "Is there a dress code?",
    a: "Traditional wear is encouraged — chaniya choli, kediyu, kurta, anything with mirror-work. It's not mandatory, but Best Dressed prizes go every hour.",
  },
  {
    q: "Can I buy for friends?",
    a: "Yes. Pick a quantity, or choose the Couple or Squad pass. One QR covers everyone in that booking — enter together.",
  },
  {
    q: "What about kids?",
    a: EVENT.ageNote,
  },
  {
    q: "Are passes refundable or transferable?",
    a: "Passes are non-refundable and non-transferable. If the event is cancelled by the organiser, you get a full refund to the original payment method within 7 working days.",
  },
  {
    q: "What if it rains?",
    a: "Light rain: we dance. Heavy rain: the event shifts under the covered pavilion and timings may extend. We'll email and SMS every pass holder.",
  },
  {
    q: "I paid but didn't get an email.",
    a: `Check spam/promotions first. Then open “Find my booking” with your email and booking ID — the pass is always available there. Still stuck? Write to ${EVENT.contact.email}.`,
  },
];
