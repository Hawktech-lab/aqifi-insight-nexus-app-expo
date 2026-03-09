import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import ViralloopsService from '../services/ViralloopsService';

interface ViralloopsWidgetProps {
  widgetType?: 'form' | 'milestone' | 'referral';
  mode?: 'popup' | 'embed';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const ViralloopsWidget: React.FC<ViralloopsWidgetProps> = ({
  widgetType = 'form',
  mode = 'embed',
  onLoad,
  onError,
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadWidget = async () => {
      try {
        const viralloopsService = ViralloopsService.getInstance();
        const initialized = await viralloopsService.initialize();
        
        // Check if initialized successfully
        if (!initialized) {
          console.warn('Viralloops Campaign ID not configured. Widget cannot be displayed.');
          setLoading(false);
          onError?.(new Error('Campaign ID not configured'));
          return;
        }
        
        const campaignId = await viralloopsService.getCampaignId();

        // Double-check campaign ID is available
        if (!campaignId) {
          console.warn('Viralloops Campaign ID not available. Widget cannot be displayed.');
          setLoading(false);
          onError?.(new Error('Campaign ID not available'));
          return;
        }

        // Generate HTML with Viralloops widget
        // Using data-campaign-id on script tag as recommended by Viral Loops for web
        // This matches the web implementation: https://pages.viral-loops.com/acua-waitlist-2cpq46nz
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="text/javascript" 
          src="${viralloopsService.getWidgetScriptUrl()}" 
          data-campaign-id="${campaignId}" 
          id="viral-loops-loader">
  </script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .vl-container {
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div class="vl-container">
    ${widgetType === 'form' 
      ? `<form-widget ucid="${campaignId}" mode="${mode}"></form-widget>`
      : widgetType === 'milestone'
      ? `<milestone-widget ucid="${campaignId}"></milestone-widget>`
      : `<referral-widget ucid="${campaignId}"></referral-widget>`
    }
  </div>
  <script>
    // Listen for widget load events
    window.addEventListener('load', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'widgetLoaded' }));
      }
    });

    // Listen for form submission
    document.addEventListener('vl:participant:created', function(event) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'participantCreated',
          data: event.detail
        }));
      }
    });

    // Listen for referral events
    document.addEventListener('vl:referral:created', function(event) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'referralCreated',
          data: event.detail
        }));
      }
    });
  </script>
</body>
</html>
        `;

        setHtmlContent(html);
        setLoading(false);
        onLoad?.();
      } catch (error) {
        console.error('Error loading Viralloops widget:', error);
        setLoading(false);
        onError?.(error instanceof Error ? error : new Error('Failed to load widget'));
      }
    };

    loadWidget();
  }, [widgetType, mode, onLoad, onError]);

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'widgetLoaded':
          console.log('Viralloops widget loaded');
          break;
        case 'participantCreated':
          console.log('Participant created:', message.data);
          break;
        case 'referralCreated':
          console.log('Referral created:', message.data);
          break;
      }
    } catch (error) {
      console.error('Error parsing widget message:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ html: htmlContent }}
      style={styles.webView}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      renderLoading={() => (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

