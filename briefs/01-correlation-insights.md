# Feature Request: Correlation Insights Engine

```
From:    Priya Mehta <priya.mehta@contoso.com>
To:      Pulse Engineering <pulse-eng@contoso.com>
Date:    Mon, 5 May 2026 09:42 AM
Subject: [Feature] Correlation Insights — making Pulse actually useful
```

---

Hi team,

Users are logging data daily but they aren't getting any value back from the app. Right now, Pulse is basically a fancy diary — people put data in but nothing comes out.

I want us to change that. Build an **insights engine** that finds correlations between tags and mood/energy levels. For example:

- "You're 35% more energetic on days you exercise before noon"
- "Your mood drops by 1.2 points on days with 3+ meetings"
- "Caffeine + deep-work days are your highest-energy combination"

These should show up as **insight cards** on the dashboard — visually distinct, maybe with an icon and a confidence indicator.

A few things I'm unsure about and would love the team to think through:

- How many data points do we need before we can surface a meaningful correlation? We don't want to say "exercise = good mood" after 2 entries.
- How do we avoid implying causation? "Days with exercise correlate with higher mood" is different from "exercise causes better mood."
- What about negative or sensitive insights? Like "your mood drops when you work with Team X" — is that something we should surface?
- Should insights be dismissible? Snooze-able?

I think this is the feature that makes Pulse actually *useful* instead of just a logging tool. Let's scope it out.

Thanks,
Priya Mehta
Product Lead, Pulse · Contoso
