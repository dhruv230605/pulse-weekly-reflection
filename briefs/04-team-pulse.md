# Feature Request: Team Pulse Mode (Anonymous)

```
From:    Priya Mehta <priya.mehta@contoso.com>
To:      Pulse Engineering <pulse-eng@contoso.com>
Cc:      Legal & Privacy <legal-privacy@contoso.com>
Date:    Thu, 1 May 2026 10:30 AM
Subject: [Feature] Team Pulse Mode — anonymous aggregation (SENSITIVE)
```

---

Hi team,

We've been getting requests from managers who want to understand their team's energy levels without being creepy about it. Direct quote from a skip-level: "I just want to know if my team is burning out before they tell me they're quitting."

I want us to build a **Team Pulse** mode:

- Team members **opt in** to share anonymized, aggregated mood/energy data with their team lead
- The lead sees: team average energy this week, distribution (how many people are in red/yellow/green zones), and trend over time
- **Individual entries are NEVER visible** to the lead. Only aggregates.
- A "Team Sentiment" view that could be useful in sprint retros — "The team's energy dipped mid-sprint, what happened?"

This is the most sensitive feature we've ever built. I need the team to really think through:

- **Privacy:** What does "anonymous" actually mean when a team has 4 people? If 3 people are happy and the aggregate shows 1 unhappy person... the manager can probably guess. What's our minimum team size for anonymity?
- **Consent:** Opt-in vs. opt-out? Can a person leave at any time? What happens to their historical data in the aggregate?
- **What data to aggregate:** Average mood? Distribution buckets? Trend lines? What's safe to show and what might expose individuals?
- **Comparison:** Can an individual see how they compare to the team average? Is that helpful or anxiety-inducing?
- **Gaming:** What if a manager pressures the team to opt in? How do we make the opt-in genuinely voluntary?
- **Time granularity:** Daily aggregates? Weekly? Real-time would be too revealing for small teams.

This has to be done RIGHT. If we mess up the privacy model, trust is gone forever. (Cc'ing Legal for awareness.)

Thanks,
Priya Mehta
Product Lead, Pulse · Contoso
