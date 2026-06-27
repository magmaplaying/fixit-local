# Sprint tracking

`sprint_data.json` follows the **Scrum Master** skill schema. Analyse it with the bundled scripts:

```bash
python "C:\Users\aleks\.claude\skills\scrum-master\scripts\velocity_analyzer.py"      pm/sprint_data.json --format text
python "C:\Users\aleks\.claude\skills\scrum-master\scripts\sprint_health_scorer.py"   pm/sprint_data.json --format text
python "C:\Users\aleks\.claude\skills\scrum-master\scripts\retrospective_analyzer.py" pm/sprint_data.json --format text
```

## Gating (how much history each tool needs)

- **Velocity Monte Carlo forecast** — needs **≥3 sprints**; becomes meaningful from Sprint 3.
- **Health scorer** — needs **≥2 sprints** (works now).
- **Retrospective analyzer** — needs **≥3 retrospectives**.

## Workflow

At each sprint boundary: append the finished sprint (+ its retrospective) to `sprint_data.json`, then re-run the
scripts to refresh velocity, health, and improvement trends. Use the 70% confidence interval from the velocity
forecast as the commitment ceiling for the next sprint.
