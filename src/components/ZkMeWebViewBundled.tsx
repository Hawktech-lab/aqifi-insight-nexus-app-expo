import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

interface ZkMeWebViewProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
  userAccount?: string;
  programNo?: string;
  dappName?: string;
  chainId?: string;
}

export const ZkMeWebViewBundled: React.FC<ZkMeWebViewProps> = ({
  visible,
  onClose,
  onComplete,
  userAccount,
  programNo,
  dappName = 'Aqifi Insight Nexus',
  chainId = '1'
}) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const webViewRef = useRef<WebView>(null);
  const tokenFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const zkmeMchNo: string =
    (process.env.EXPO_PUBLIC_ZKME_MCH_NO as string) || (Constants.expoConfig?.extra as any)?.zkmeMchNo || '';
  const zkmeApiKey: string =
    (process.env.EXPO_PUBLIC_ZKME_API_KEY as string) || (Constants.expoConfig?.extra as any)?.zkmeApiKey || '';

  // Fetch access token using zkMe API with timeout and cleanup
  const getToken = useCallback(async () => {
    if (!visible) return;
    
    setLoading(true);
    setLoadError(null);
    setAccessToken(null);
    
    try {
      if (!zkmeMchNo || !zkmeApiKey) {
        throw new Error('Missing zkMe configuration (mchNo or apiKey)');
      }
      
      // Clear any existing timeout
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
      }
      
      // Set a timeout for the entire token fetch operation (abort instead of throwing)
      const controller = new AbortController();
      tokenFetchTimeoutRef.current = setTimeout(() => {
        try {
          controller.abort();
          setLoadError('Request timed out. Please check your internet connection.');
        } catch (_) {}
      }, 15000);
      
      const res = await fetch('https://nest-api.zk.me/api/token/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: zkmeApiKey,
          appId: zkmeMchNo,
          apiModePermission: 0,
          lv: 1,
        }),
        signal: controller.signal,
      });
      
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
        tokenFetchTimeoutRef.current = null;
      }
      
      const json = await res.json();
      
      if (json?.code !== 80000000 || !json?.data?.accessToken) {
        throw new Error(json?.msg || 'Failed to obtain access token');
      }
      
      setAccessToken(json.data.accessToken as string);
    } catch (e: any) {
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
        tokenFetchTimeoutRef.current = null;
      }
      
      if (e.name === 'AbortError' || e.message?.includes('timed out')) {
        setLoadError('Request timed out. Please check your internet connection.');
      } else {
        setLoadError(e?.message || 'Failed to obtain access token');
      }
    } finally {
      setLoading(false);
    }
  }, [visible, zkmeMchNo, zkmeApiKey]);

  useEffect(() => {
    if (visible) {
      getToken();
    } else {
      // Cleanup when modal closes
      setAccessToken(null);
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
        tokenFetchTimeoutRef.current = null;
      }
    }
  }, [visible, getToken]);

  // Initialize widget when access token is ready
  useEffect(() => {
    if (accessToken && visible) {
      setLoading(false);
    }
  }, [accessToken, visible]);

  // Initialize widget when access token is ready
  useEffect(() => {
    if (accessToken && visible) {
      setLoading(false);
    }
  }, [accessToken, visible]);

  // Simple HTML for WebView
  const webViewHtml = useCallback(() => {
    if (!accessToken) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Loading KYC...</title>
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: system-ui; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                background: #f9fafb;
              }
              .loading { color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="loading">Loading verification...</div>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>zkMe KYC</title>
          <style>
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
              background: #fff;
              font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Helvetica, Arial;
              overflow: hidden;
            }
            #root {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .loading {
              text-align: center;
              color: #666;
              font-size: 16px;
            }
            .error {
              text-align: center;
              color: #ef4444;
              padding: 20px;
              font-size: 14px;
              line-height: 1.5;
            }
            .status {
              text-align: center;
              color: #374151;
              padding: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="loading">Loading verification...</div>
          </div>
          
          <script>
            (function() {
              const config = {
                appId: '${zkmeMchNo}',
                accessToken: '${accessToken}',
                programNo: '${programNo || ''}',
                userAccount: '${(userAccount || '').toLowerCase()}',
                dappName: '${dappName}',
                chainId: '${chainId}'
              };
              
              let widget = null;
              let initTimeout = null;
              
              // Safe error handler
              function handleError(error) {
                try {
                  cleanup();
                  
                  let errorMessage = 'Unknown error occurred';
                  
                  if (typeof error === 'string') {
                    errorMessage = error;
                  } else if (error && typeof error === 'object') {
                    if (error.message) {
                      errorMessage = error.message;
                    } else if (error.toString && error.toString() !== '[object Object]') {
                      errorMessage = error.toString();
                    } else if (error.name) {
                      errorMessage = error.name;
                    }
                  }
                  
                  const root = document.getElementById('root');
                  if (root) {
                    root.innerHTML = '<div class="error">Error: ' + errorMessage.replace(/[<>]/g, '') + '</div>';
                  }
                  
                  try {
                    if (window.ReactNativeWebView) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: "zkme-verification-error",
                        message: errorMessage
                      }));
                    }
                  } catch (e) {
                    // Ignore message sending errors
                  }
                } catch (e) {
                  const root = document.getElementById('root');
                  if (root) {
                    root.innerHTML = '<div class="error">Verification failed. Please try again.</div>';
                  }
                }
              }
              
              // Cleanup function
              function cleanup() {
                try {
                  if (initTimeout) {
                    clearTimeout(initTimeout);
                    initTimeout = null;
                  }
                  if (widget && typeof widget.destroy === 'function') {
                    widget.destroy();
                  }
                } catch (e) {
                  // Ignore cleanup errors
                }
              }
              
              // Success handler
              function handleSuccess(result) {
                try {
                  cleanup();
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: "zkme-verification-complete",
                      result: result || {}
                    }));
                  }
                } catch (e) {
                  handleError('Failed to send success message');
                }
              }
              
              // Close handler
              function handleClose() {
                try {
                  cleanup();
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: "zkme-widget-closed"
                    }));
                  }
                } catch (e) {
                  // Ignore close errors
                }
              }
              
              // Validate config
              try {
                if (!config || !config.appId || !config.accessToken) {
                  handleError('Missing required configuration');
                  return;
                }
              } catch (e) {
                handleError('Configuration validation failed');
                return;
              }
              
              // Set timeout
              try {
                initTimeout = setTimeout(() => {
                  handleError('Widget initialization timed out');
                }, 30000);
              } catch (e) {
                handleError('Failed to set timeout');
                return;
              }
              
              // Load React and ReactDOM first
              function loadReact() {
                return new Promise((resolve, reject) => {
                  if (window.React && window.ReactDOM) {
                    resolve();
                    return;
                  }
                  
                  const script = document.createElement('script');
                  script.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
                  script.async = true;
                  script.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                    script2.async = true;
                    script2.onload = () => {
                      if (typeof React !== 'undefined') {
                        window.React = React;
                      }
                      if (typeof ReactDOM !== 'undefined') {
                        window.ReactDOM = ReactDOM;
                      }
                      resolve();
                    };
                    script2.onerror = (event) => {
                      reject(new Error('Failed to load ReactDOM: ' + (event.target?.src || 'unknown')));
                    };
                    document.head.appendChild(script2);
                  };
                  script.onerror = (event) => {
                    reject(new Error('Failed to load React: ' + (event.target?.src || 'unknown')));
                  };
                  document.head.appendChild(script);
                });
              }
              
              // Load zkMe widget from CDN
              function loadZkMeWidget() {
                return new Promise((resolve, reject) => {
                  const cdnUrls = [
                    'https://unpkg.com/@zkmelabs/widget@0.3.6/dist/index.umd.js',
                    'https://widget.zk.me/dist/index.global.js'
                  ];
                  
                  let currentIndex = 0;
                  
                  function tryNextCDN() {
                    if (currentIndex >= cdnUrls.length) {
                      reject(new Error('Failed to load zkMe widget from all CDN sources. Please check your internet connection.'));
                      return;
                    }
                    
                    const url = cdnUrls[currentIndex];
                    console.log('Trying CDN ' + (currentIndex + 1) + ': ' + url);
                    
                    const script = document.createElement('script');
                    script.src = url;
                    script.async = true;
                    script.onload = () => {
                      console.log('Successfully loaded from: ' + url);
                      resolve();
                    };
                    script.onerror = (event) => {
                      console.log('Failed to load from: ' + url);
                      currentIndex++;
                      tryNextCDN();
                    };
                    document.head.appendChild(script);
                  }
                  
                  tryNextCDN();
                });
              }
              
              // Initialize widget
              function initWidget() {
                try {
                  const root = document.getElementById('root');
                  if (root) {
                    root.innerHTML = '<div class="status">Initializing widget...</div>';
                  }
                  
                  // Check if React is available
                  if (!window.React || !window.ReactDOM) {
                    handleError('React not loaded');
                    return;
                  }
                  
                  // Check if zkMe widget is available
                  let ZkMeWidget = null;
                  if (window.ZkMeWidget) {
                    ZkMeWidget = window.ZkMeWidget;
                  } else if (window.zkMeWidget) {
                    ZkMeWidget = window.zkMeWidget;
                  } else if (window.zkmelabs && window.zkmelabs.ZkMeWidget) {
                    ZkMeWidget = window.zkmelabs.ZkMeWidget;
                  } else if (window["@zkmelabs/widget"] && window["@zkmelabs/widget"].ZkMeWidget) {
                    ZkMeWidget = window["@zkmelabs/widget"].ZkMeWidget;
                  }
                  
                  if (!ZkMeWidget) {
                    handleError('ZkMe widget not found');
                    return;
                  }
                  
                  // Create provider
                  class ZkMeProvider {
                    async getAccessToken() {
                      return config.accessToken;
                    }
                    async getUserAccounts() {
                      return config.userAccount ? [config.userAccount] : [];
                    }
                  }
                  
                  const provider = new ZkMeProvider();
                  
                  // Create widget instance
                  widget = new ZkMeWidget(
                    config.appId,
                    config.dappName,
                    config.chainId,
                    provider,
                    Object.assign({ lv: "zkKYC" }, config.programNo ? { programNo: config.programNo } : {})
                  );
                  
                  // Set up event handlers
                  widget.on("kycFinished", handleSuccess);
                  widget.on("close", handleClose);
                  
                  // Clear loading and mount
                  if (root) {
                    root.innerHTML = '';
                    widget.mount("#root");
                  }
                  
                  // Clear timeout
                  if (initTimeout) {
                    clearTimeout(initTimeout);
                    initTimeout = null;
                  }
                  
                } catch (error) {
                  handleError('Widget initialization failed: ' + error.message);
                }
              }
              
              // Global error handlers
              window.addEventListener('error', function(event) {
                handleError('JavaScript error: ' + (event.error ? event.error.message : event.message));
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                handleError('Promise rejection: ' + (event.reason ? event.reason.message : 'Unknown error'));
              });
              
              // Start loading process
              loadReact()
                .then(loadZkMeWidget)
                .then(initWidget)
                .catch(handleError);
              
              // Cleanup on page unload
              window.addEventListener('beforeunload', cleanup);
            })();
          </script>
        </body>
      </html>
    `;
  }, [accessToken, zkmeMchNo, programNo, userAccount, dappName, chainId]);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'console-log') {
        // Forward console logs from WebView to React Native console
        if (data.level === 'error') {
          console.error('[WebView]', data.message);
        } else if (data.level === 'warn') {
          console.warn('[WebView]', data.message);
        } else {
          console.log('[WebView]', data.message);
        }
      } else if (data.type === 'zkme-verification-complete') {
        console.log('WebView message received:', data);
        onComplete?.(data.result);
        onClose();
      } else if (data.type === 'zkme-verification-error') {
        console.log('WebView error received:', data);
        setLoadError(data.message);
      } else {
        console.log('WebView message received:', data);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onComplete, onClose]);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLoadError(null);
      setLoading(true);
      getToken();
    }
  }, [retryCount, maxRetries, getToken]);

  const handleWebViewLoad = useCallback(() => {
    console.log('WebView loaded, injecting bundled widget...');
    // Inject the bundled widget after a short delay to ensure WebView is ready
    setTimeout(() => {
      injectBundledWidget();
    }, 500);
  }, [injectBundledWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Identity Verification</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#6b7280', fontWeight: '600' }}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Loading verification...</Text>
            </View>
          )}
          {loadError && (
            <View style={[styles.loadingContainer, { backgroundColor: '#fff' }]}>
              <Text style={[styles.loadingText, { color: '#ef4444' }]}>{loadError}</Text>
              {retryCount < maxRetries && (
                <TouchableOpacity onPress={handleRetry} style={styles.retryButton} activeOpacity={0.7}>
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Retry ({retryCount + 1}/{maxRetries})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}


          <WebView
            ref={webViewRef}
            source={{ html: webViewHtml() }}
            style={styles.webView}
            onLoad={handleWebViewLoad}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            // Optimized WebView settings
            allowsBackForwardNavigationGestures={false}
            allowsLinkPreview={false}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            incognito={false}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            mixedContentMode="compatibility"
            allowsFullscreenVideo={false}
            // Performance optimizations
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            injectedJavaScript={`
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.log = function(...args) {
                originalLog.apply(console, args);
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'console-log',
                  level: 'log',
                  message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
                }));
              };
              
              console.error = function(...args) {
                originalError.apply(console, args);
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'console-log',
                  level: 'error',
                  message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
                }));
              };
              
              console.warn = function(...args) {
                originalWarn.apply(console, args);
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'console-log',
                  level: 'warn',
                  message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')
                }));
              };
              
              true;
            `}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginLeft: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative' as const,
  },
  webView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  widgetContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 2,
  },
  widgetText: {
    fontSize: 16,
    color: '#374151',
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
};

export default ZkMeWebViewBundled;
