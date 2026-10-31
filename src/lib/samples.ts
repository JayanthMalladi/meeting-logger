/**
 * Sample dictated recaps (contract — SPEC §4). Used by the "Try a sample" chips
 * in dictate mode and by scripts/eval.mjs. Written the way people talk after a meeting.
 */
export type SampleRecap = { id: string; label: string; kind: string; title: string; text: string };

export const SAMPLE_RECAPS: SampleRecap[] = [
  {
    id: "standup",
    label: "Team standup",
    kind: "standup",
    title: "Payments standup",
    text:
      "Quick recap of today's payments standup. We decided to ship the new checkout on Friday behind a feature flag. " +
      "Priya is finishing the refund API and says it'll be done by Wednesday. I'll write the release notes tomorrow. " +
      "Someone needs to update the on-call runbook, but nobody picked it up. " +
      "We still don't know if Stripe's new rate limits apply to our account. " +
      "Arjun is blocked on the design review, which slipped for the second week in a row.",
  },
  {
    id: "planning",
    label: "Sprint planning",
    kind: "planning",
    title: "Sprint 14 planning",
    text:
      "Sprint fourteen planning. We agreed to drop the dark mode epic and focus on onboarding. " +
      "Meera owns the new signup flow and will have a prototype by next Tuesday. " +
      "Rahul is going to look into why activation dropped last week. " +
      "We're going with Postgres instead of Mongo for the events table. " +
      "Open question: do we need legal sign off before we email inactive users? " +
      "The analytics migration has no owner and it's already a week late.",
  },
  {
    id: "customer",
    label: "Customer call",
    kind: "customer call",
    title: "Acme renewal call",
    text:
      "Call with Acme about their renewal. They're happy overall but want SSO before they sign. " +
      "We decided to offer a three month discount if they renew this quarter. " +
      "I'll send them the revised quote by Thursday. Karthik will check with engineering whether SSO can ship in November. " +
      "They asked if we support data residency in India, and none of us knew.",
  },
];
