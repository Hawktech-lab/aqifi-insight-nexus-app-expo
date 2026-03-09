/**
 * Server endpoint example for serving zkme widget HTML
 * Deploy this to https://zk.hawkrel.com
 * 
 * This can be implemented using:
 * - Node.js/Express
 * - Next.js API route
 * - Supabase Edge Function
 * - Any serverless function
 */

// Example using Express.js
const express = require('express');
const app = express();

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve the zkme widget HTML
app.get('/widget', (req, res) => {
  try {
    // Get parameters from query string
    const {
      accessToken,
      appId,
      chainId = '1',
      dappName = 'Aqifi Insight Nexus',
      programNo = ''
    } = req.query;

    // Validate required parameters
    if (!accessToken || !appId) {
      return res.status(400).send(`
        <html>
          <body>
            <h1>Error: Missing required parameters</h1>
            <p>accessToken and appId are required</p>
          </body>
        </html>
      `);
    }

    // Generate HTML with injected parameters
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width" />
    <title>Hawkrel</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@zkmelabs/widget@0.3.6/dist/style.css">
</head>
<body>
<script type="module">
    import { ZkMeWidget } from 'https://cdn.jsdelivr.net/npm/@zkmelabs/widget@0.3.6/+esm';

    try {
        const NEST_API_URL = 'https://nest-api.zk.me';
        const chainId = ${JSON.stringify(chainId)};
        const appId = ${JSON.stringify(appId)};
        const dappName = ${JSON.stringify(dappName)};
        const programNo = ${JSON.stringify(programNo)} || '202510080002';
        const presetAccessToken = ${JSON.stringify(accessToken)};

        /**
         * Retrieve Access Token
         */
        async function getAccessToken () {
            // Use the preset access token provided via query parameter
            if (presetAccessToken) {
                return presetAccessToken;
            }
            // Fallback: This should not happen if accessToken is provided in query params
            throw new Error('Access token not provided');
        }

        // Define the provider object
        const provider = {
            getAccessToken,
            async getUserAccounts() {
                // Request user ID (UUID) from React Native component
                return new Promise((resolve) => {
                    // Set up a one-time message listener
                    const messageHandler = (event) => {
                        try {
                            // event.data is a JSON string, parse it
                            const data = typeof event.data === 'string' 
                                ? JSON.parse(event.data) 
                                : event.data;
                            
                            if (data && data.type === 'zkme-user-id-response') {
                                window.removeEventListener('message', messageHandler);
                                // Return the user ID (UUID) as an array
                                // zkMe expects an array of account identifiers
                                resolve(data.userId ? [data.userId] : []);
                            }
                        } catch (e) {
                            console.error('Error parsing user ID response:', e);
                            // Continue waiting or timeout will handle it
                        }
                    };
                    
                    // Listen for response from React Native via MessageEvent
                    window.addEventListener('message', messageHandler);
                    
                    // Request user ID from React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'zkme-request-user-id'
                        }));
                        
                        // Timeout after 5 seconds if no response
                        setTimeout(() => {
                            window.removeEventListener('message', messageHandler);
                            console.warn('Timeout waiting for user ID, returning empty array');
                            resolve([]);
                        }, 5000);
                    } else {
                        // Not in React Native WebView, return empty array
                        window.removeEventListener('message', messageHandler);
                        resolve([]);
                    }
                });
            }
        }

        // Create a ZkMeWidget instance
        const zkMeWidget = new ZkMeWidget(
            appId,
            dappName,
            chainId,
            provider,
            programNo ? { programNo } : undefined
        )

        // Listen for the KYC completion event
        zkMeWidget.on('kycFinished', (kycResults) => {
            try {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'zkme-verification-complete',
                result: kycResults
              }));
            } catch (_) {}
        })

        // Listen for widget close event
        try {
          zkMeWidget.on && zkMeWidget.on('close', () => {
            try {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'zkme-widget-closed'
              }));
            } catch (_) {}
          });
        } catch (_) {}

        // Launch the widget automatically
        zkMeWidget.launch()
    } catch (e) {
        try {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'zkme-verification-error',
            message: e && (e.message || e.toString())
          }));
        } catch (_) {}
    }
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating widget HTML:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error: Failed to generate widget</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 8989;
app.listen(PORT, () => {
  console.log(`zkme widget server running on port ${PORT}`);
});

module.exports = app;

