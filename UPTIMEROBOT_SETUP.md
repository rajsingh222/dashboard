# UptimeRobot Setup (Backend Keep-Alive)

Use this to keep the backend service active by pinging a lightweight endpoint.

## 1) Backend endpoint to monitor

Use this URL in UptimeRobot:

- `https://YOUR_BACKEND_DOMAIN/uptime`

Example:

- `https://dashboard-sppl-backend.onrender.com/uptime`

## 2) UptimeRobot monitor settings

- Monitor Type: `HTTP(s)`
- Friendly Name: `Dashboard SPPL Backend`
- URL (or IP): `https://YOUR_BACKEND_DOMAIN/uptime`
- Monitoring Interval: `5 minutes`
- Timeout: `30 seconds`
- HTTP Method: `GET`

## 3) Verify

Open the endpoint in browser/postman and confirm response:

```json
{
  "success": true,
  "message": "OK",
  "timestamp": "..."
}
```

## 4) Notes

- Keep this endpoint lightweight (no DB query) to reduce cold-start cost.
- If your hosting provider sleeps for free-tier inactivity, periodic pings help reduce sleep but behavior still depends on provider limits.
- Existing health endpoint is still available at `/health` for richer diagnostics.
