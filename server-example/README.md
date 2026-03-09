# zkme Widget Server

This directory contains an example server implementation for serving the zkme widget HTML from `https://zk.hawkrel.com`.

## Deployment Options

### Option 1: Node.js/Express (VPS/Server)
1. Install dependencies: `npm install express`
2. Deploy to your server
3. Configure nginx/reverse proxy to point `zk.hawkrel.com` to this server
4. Run: `node zkme-widget-server.js`

### Option 2: Next.js API Route
Create `pages/api/zkme/widget.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Similar logic to the Express example
  // Return HTML with proper headers
}
```

### Option 3: Supabase Edge Function
Deploy as a Supabase Edge Function and configure custom domain.

### Option 4: Vercel/Netlify Serverless Function
Deploy as a serverless function with custom domain configuration.

## API Endpoint

**GET** `https://zk.hawkrel.com/widget`

### Query Parameters:
- `accessToken` (required): The zkme access token
- `appId` (required): The zkme app ID
- `chainId` (optional): Chain ID, defaults to '1'
- `dappName` (optional): DApp name, defaults to 'Aqifi Insight Nexus'
- `programNo` (optional): Program number

### getUserAccounts Function:

The `getUserAccounts` function returns the logged-in user's UUID (user ID):
- Requests the user ID from the React Native component via WebView message passing
- Returns the user ID as an array: `[userId]` (zkMe expects an array format)
- If no user ID is available or request times out, returns empty array `[]`
- The user ID is used by zkMe to associate the KYC verification with the correct user account

### Example:
```
https://zk.hawkrel.com/widget?accessToken=xxx&appId=yyy&chainId=137&dappName=Hawkrel
```

## CORS

The server includes CORS headers to allow requests from the React Native app.

