# Temporal AI Observability Enhancements - Setup Guide

This guide walks through importing the dashboard and alerts into OpenObserve.

## Prerequisites

-   Local OpenObserve running: `just temporal-ai-observe-start`
-   OpenObserve credentials configured in `.secrets.env.sops`

## 1. Import Dashboard

### Via UI (Recommended)

1. Open OpenObserve: `http://localhost:5080`
2. Navigate to **Settings** → **Dashboards**
3. Click **Import**
4. Upload `ops/openobserve/dashboards/temporal-ai-patterns.json`
5. Click **Save**

### Via API

```bash
# Get credentials
OPENOBSERVE_USER=$(sops -d .secrets.env.sops | grep OPENOBSERVE_USER | cut -d= -f2)
OPENOBSERVE_TOKEN=$(sops -d .secrets.env.sops | grep OPENOBSERVE_TOKEN | cut -d= -f2)

# Import dashboard
curl -X POST http://localhost:5080/api/default/dashboards \
  -H "Authorization: Basic $(echo -n $OPENOBSERVE_USER:$OPENOBSERVE_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  -d @ops/openobserve/dashboards/temporal-ai-patterns.json
```

## 2. Configure Email Destination

### Set Alert Email

```bash
export ALERT_EMAIL=your-team@example.com
```

### Import Destination

```bash
curl -X POST http://localhost:5080/api/default/destinations \
  -H "Authorization: Basic $(echo -n $OPENOBSERVE_USER:$OPENOBSERVE_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  -d @ops/openobserve/alerts/destinations.json
```

### Configure SMTP (if not already done)

In OpenObserve UI:

1. Go to **Settings** → **SMTP Configuration**
2. Enter your SMTP server details
3. Test the configuration

## 3. Import Alerts

```bash
# Import all three alerts
for alert in ops/openobserve/alerts/temporal-ai-*.json; do
  echo "Importing $(basename $alert)..."
  curl -X POST http://localhost:5080/api/default/alerts \
    -H "Authorization: Basic $(echo -n $OPENOBSERVE_USER:$OPENOBSERVE_TOKEN | base64)" \
    -H "Content-Type: application/json" \
    -d @"$alert"
done
```

## 4. Verify Setup

### Check Dashboard

```bash
open http://localhost:5080/dashboards/temporal-ai-patterns
```

### Refresh Metrics

```bash
just temporal-ai-refresh-metrics DAYS=7
```

### Query Patterns

```bash
just temporal-ai-query "test pattern" TOP=5
```

The output should include success rates:

```
1. [Score: 0.892] Similarity: 94.2% | Recency: 85.0% | Usage: 12x | Success: 96.5%
```

### Test Alert (Optional)

Manually trigger an alert by inserting low success rate data:

```bash
# This would require actual telemetry data
# For testing, you can lower the threshold temporarily in the alert JSON
```

## Troubleshooting

**Dashboard not appearing**:

-   Check import was successful: look for success message
-   Verify dashboard exists: Settings → Dashboards
-   Check browser console for errors

**Alerts not triggering**:

-   Verify alerts are enabled in OpenObserve UI
-   Check email destination is configured correctly
-   Test SMTP settings
-   Review alert logs in OpenObserve

**No data in dashboard**:

-   Ensure Vector is running: `just observe-start`
-   Check Vector is sending to OpenObserve: `tail -f tmp/vector-traces.log`
-   Verify `temporal_ai_recommendations` stream exists
-   Run metrics refresh: `just temporal-ai-refresh-metrics DAYS=7`

## Next Steps

1. Set up automated metrics refresh (cron job)
2. Configure production SMTP settings
3. Customize alert thresholds if needed
4. Add dashboard to team documentation
