import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ExpoConstants from 'expo-constants';
import { errorLogger } from '../utils/errorLogger';
import AppConfigurationService, { ConfigurationError } from '../services/AppConfigurationService';
import { ConfigurationErrorScreen } from './ConfigurationErrorScreen';

// Safely get Constants with fallback
const Constants = ExpoConstants || { expoConfig: { extra: {} } };

interface ZkMeWebViewProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
  onError?: (error: Error | string) => void;
  userId?: string;
  programNo?: string;
  dappName?: string;
  chainId?: string;
}

export const ZkMeWebView: React.FC<ZkMeWebViewProps> = ({
  visible,
  onClose,
  onComplete,
  onError,
  userId,
  programNo,
  dappName = 'Aqifi Insight Nexus',
  chainId = '1'
}) => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [zkmeConfig, setZkmeConfig] = useState<{ mchNo: string; apiKey: string } | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Load ZkMe configuration from database on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configService = AppConfigurationService.getInstance();
        const config = await configService.getZkMeConfig();
        setZkmeConfig(config);
        setConfigError(null);
      } catch (error) {
        const errorMessage = error instanceof ConfigurationError 
          ? error.message 
          : error instanceof Error 
            ? error.message 
            : 'Failed to load ZkMe configuration from database';
        console.error('Error loading ZkMe config from database:', errorMessage);
        setConfigError(errorMessage);
        if (onError) {
          onError(new Error(errorMessage));
        }
      }
    };
    if (visible) {
      loadConfig();
    }
  }, [visible, onError]);

  // Debug: Component mount
  useEffect(() => {
    if (visible) {
      errorLogger.logDebug('Step 10: ZkMeWebView component mounted/visible', {
        visible,
        programNo,
        dappName,
        chainId
      }, false); // Don't show alert, just log
      //console.log('DEBUG: Step 10 - ZkMeWebView component mounted', {
        //visible,
        //userAccount,
        //programNo,
        //dappName,
        //chainId
      //});
    }
  }, [visible]);

  // Get configuration from database
  const getConfig = useCallback(() => {
    if (!zkmeConfig) {
      throw new ConfigurationError('ZkMe configuration not loaded');
    }
    return { zkmeMchNo: zkmeConfig.mchNo, zkmeApiKey: zkmeConfig.apiKey };
  }, [zkmeConfig]);

  // Fetch access token
  const getToken = useCallback(async () => {
    if (!visible) {
      errorLogger.logDebug('Step 11a - getToken called but visible is false', {}, false);
      //console.log('DEBUG: Step 11a - getToken called but visible is false');
      return;
    }
    
    errorLogger.logDebug('Step 11: getToken called - starting token fetch', {}, false);
    //console.log('DEBUG: Step 11 - getToken called');
    setLoading(true);
    setLoadError(null);
    setAccessToken(null);
    
    try {
      errorLogger.logDebug('Step 12: Getting config from getConfig()', {}, false);
      //console.log('DEBUG: Step 12 - Getting config');
      const { zkmeMchNo, zkmeApiKey } = getConfig();
      errorLogger.logDebug('Step 13: Config retrieved', { hasMchNo: !!zkmeMchNo, hasApiKey: !!zkmeApiKey }, false);
      //console.log('DEBUG: Step 13 - Config retrieved', { hasMchNo: !!zkmeMchNo, hasApiKey: !!zkmeApiKey });
      
      if (!zkmeMchNo || !zkmeApiKey) {
        const errorMsg = 'Missing zkMe configuration. Please check your environment variables.';
        const error = new Error(errorMsg);
        errorLogger.logError('Step 13a: Missing config', error, { zkmeMchNo: !!zkmeMchNo, zkmeApiKey: !!zkmeApiKey }, false);
        //console.error('DEBUG: Step 13a - Missing config', errorMsg, { zkmeMchNo: !!zkmeMchNo, zkmeApiKey: !!zkmeApiKey });
        setLoadError(errorMsg);
        setLoading(false);
        try {
          onError?.(error);
        } catch (callbackError) {
          console.error('Error in onError callback:', callbackError);
        }
        return;
      }
      
      errorLogger.logDebug('Step 14: Config valid, creating AbortController and starting fetch', {}, false);
      //console.log('DEBUG: Step 14 - Starting fetch request');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        errorLogger.logDebug('Step 15: About to call fetch API', {}, false);
        //console.log('DEBUG: Step 15 - Calling fetch API');
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
        
        clearTimeout(timeoutId);
        errorLogger.logDebug('Step 16: Fetch response received', { status: res.status, ok: res.ok }, false);
        //console.log('DEBUG: Step 16 - Fetch response received', { status: res.status, ok: res.ok });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        errorLogger.logDebug('Step 17: Parsing JSON response', {}, false);
        //console.log('DEBUG: Step 17 - Parsing JSON');
        const json = await res.json();
        errorLogger.logDebug('Step 18: JSON parsed', { code: json?.code, hasAccessToken: !!json?.data?.accessToken }, false);
        //console.log('DEBUG: Step 18 - JSON parsed', { code: json?.code, hasAccessToken: !!json?.data?.accessToken });
        
        if (json?.code !== 80000000 || !json?.data?.accessToken) {
          throw new Error(json?.msg || 'Failed to obtain access token');
        }
        
        errorLogger.logDebug('Step 19: Setting accessToken state', {}, false);
        //console.log('DEBUG: Step 19 - Setting accessToken');
        setAccessToken(json.data.accessToken as string);
        errorLogger.logDebug('Step 20: AccessToken set successfully', {}, false);
        //console.log('DEBUG: Step 20 - AccessToken set');
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        errorLogger.logError('Step 15a: Fetch error caught', fetchError, {}, false);
        //console.error('DEBUG: Step 15a - Fetch error', fetchError);
        throw fetchError;
      }
    } catch (e: any) {
      errorLogger.logError('Step 16a: Token fetch error caught', e, {}, false);
      //console.error('DEBUG: Step 16a - ZkMe token fetch error:', e);
      let errorMsg: string;
      let error: Error;
      
      if (e.name === 'AbortError' || e.message?.includes('timeout')) {
        errorMsg = 'Request timed out. Please check your internet connection.';
        error = new Error(errorMsg);
        setLoadError(errorMsg);
        errorLogger.logError('Token fetch timeout', e, {}, true); // Show alert for timeout
      } else if (e.message?.includes('Missing zkMe configuration')) {
        errorMsg = e.message;
        error = new Error(errorMsg);
        setLoadError(errorMsg);
        errorLogger.logError('Missing zkMe configuration', e, {}, true); // Show alert for config error
      } else {
        errorMsg = e?.message || 'Failed to obtain access token. Please try again later.';
        error = new Error(errorMsg);
        setLoadError(errorMsg);
        errorLogger.logError('Token fetch failed', e, {}, true); // Show alert for other errors
      }
      
      // Call onError callback
      try {
        onError?.(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    } finally {
      errorLogger.logDebug('Step 20a: getToken finally block - setting loading to false', {}, false);
      //console.log('DEBUG: Step 20a - getToken finally block');
      setLoading(false);
    }
  }, [visible, getConfig, onError]);

  // Generate URL for loading widget from server
  const generateWidgetUrl = useCallback(() => {
    try {
      errorLogger.logDebug('Step 21: generateWidgetUrl called', {}, false);
      const { zkmeMchNo } = getConfig();
      errorLogger.logDebug('Step 22: Config retrieved in generateWidgetUrl', {}, false);
      
      if (!zkmeMchNo) {
        errorLogger.logError('Step 22a: Missing config in generateWidgetUrl', new Error('Missing config'), { 
          hasMchNo: !!zkmeMchNo
        }, false);
        return null;
      }
      
      if (!accessToken) {
        errorLogger.logError('Step 22b: Missing accessToken in generateWidgetUrl', new Error('Missing accessToken'), {}, false);
        return null;
      }
      
      errorLogger.logDebug('Step 23: Building widget URL', {}, false);
    
      const configuredChainId = chainId || '1';
      const configuredDappName = dappName || 'Aqifi Insight Nexus';
      const configuredProgramNo = programNo || '';

      // Build query parameters
      // Note: Wallet addresses are not required for zkMe KYC, so we don't need to pass userId
      const params = new URLSearchParams({
        accessToken: accessToken,
        appId: zkmeMchNo,
        chainId: configuredChainId,
        dappName: configuredDappName,
      });

      if (configuredProgramNo) {
        params.append('programNo', configuredProgramNo);
      }

      const widgetUrl = `https://zk.hawkrel.com/widget?${params.toString()}`;
      errorLogger.logDebug('Step 24: Widget URL generated', { url: widgetUrl.replace(accessToken, '***') }, false);
      return widgetUrl;
    } catch (error: any) {
      console.error('Error generating widget URL:', error);
      const urlError = new Error('Failed to generate widget URL. Please try again later.');
      try {
        onError?.(urlError);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
      return null;
    }
  }, [getConfig, chainId, dappName, programNo, accessToken, onError]);

  // Initialize when modal opens
  useEffect(() => {
    if (visible) {
      errorLogger.logDebug('Step 10a: useEffect triggered for visible=true, setting timer for getToken', {}, false);
      //console.log('DEBUG: Step 10a - useEffect triggered, setting timer');
      // Add a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        try {
          errorLogger.logDebug('Step 10b: Timer fired, calling getToken', {}, false);
          //console.log('DEBUG: Step 10b - Timer fired, calling getToken');
          getToken();
        } catch (error: any) {
          errorLogger.logError('Step 10c: Error in getToken', error, {}, false);
          //console.error('DEBUG: Step 10c - Error initializing token fetch:', error);
          const errorMsg = 'Failed to initialize verification. Please try again.';
          const initError = new Error(errorMsg);
          setLoadError(errorMsg);
          setLoading(false);
          // Call onError callback
          try {
            onError?.(initError);
          } catch (callbackError) {
            console.error('Error in onError callback:', callbackError);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
      } else {
      // Cleanup when modal closes
      errorLogger.logDebug('Step 10d: visible=false, cleaning up', {}, false);
      //console.log('DEBUG: Step 10d - visible=false, cleaning up');
      // Cleanup WebView
      try {
        if (webViewRef.current) {
          webViewRef.current.stopLoading();
        }
      } catch (e) {
        console.warn('Error cleaning up WebView on close:', e);
      }
      setAccessToken(null);
      setLoadError(null);
      setLoading(true);
    }
  }, [visible, getToken, onError]);

  // Handle WebView messages
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      if (!event?.nativeEvent?.data) {
        console.warn('WebView message missing data');
        return;
      }
      
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data);
      
      // Handle request for user ID from zkMe widget
      if (data.type === 'zkme-request-user-id') {
        // Send user ID back to the WebView via injected JavaScript
        if (webViewRef.current) {
          const responseData = {
            type: 'zkme-user-id-response',
            userId: userId || null
          };
          // Inject JavaScript to dispatch a message event that the WebView can listen to
          // Stringify the responseData and pass it as a string literal in the injected code
          const responseJson = JSON.stringify(responseData);
          webViewRef.current.injectJavaScript(`
            (function() {
              try {
                // Dispatch a message event that window.addEventListener('message') can catch
                // Pass the JSON string directly as the data
                window.dispatchEvent(new MessageEvent('message', {
                  data: ${JSON.stringify(responseJson)}
                }));
              } catch (e) {
                console.error('Error dispatching message:', e);
              }
            })();
            true; // Required for injectJavaScript
          `);
        }
        return;
      }
      
      if (data.type === 'zkme-verification-complete') {
        // Alert.alert(
        //   'Verification Complete',
        //   'Your identity has been verified successfully!',
        //   [
        //     {
        //       text: 'OK',
        //       onPress: () => {
        //         try {
        //           onComplete?.(data.result || data);
        //         } catch (error) {
        //           console.error('Error in onComplete callback:', error);
        //         }
        //         onClose();
        //       }
        //     }
        //   ]
        // );
        try {
          onComplete?.(data.result || data);
        } catch (error) {
          console.error('Error in onComplete callback:', error);
        }
        onClose();
      } else if (data.type === 'zkme-verification-error') {
        const errorMessage = data.message || 'There was an error during verification.';
        const error = new Error(errorMessage);
        console.error('ZkMe verification error:', errorMessage);
        // Call onError callback before closing
        try {
          onError?.(error);
        } catch (callbackError) {
          console.error('Error in onError callback:', callbackError);
        }
        onClose();
      } else if (data.type === 'zkme-widget-closed') {
        // Widget closed from within, cleanup and close modal
        try {
          if (webViewRef.current) {
            webViewRef.current.stopLoading();
          }
        } catch (e) {
          console.warn('Error cleaning up WebView on widget close:', e);
        }
        // Use setTimeout to make close non-blocking
        setTimeout(() => {
          onClose();
        }, 0);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      // Don't crash the app, just log the error
      // If parsing fails, it might be a malformed error message
      try {
        const parseError = new Error('Failed to parse verification message');
        onError?.(parseError);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
  }, [onComplete, onClose, onError, userId]);

  // Handle WebView load
  const handleWebViewLoad = useCallback(() => {
    errorLogger.logDebug('Step 28: WebView onLoad event fired', {}, false);
    //console.log('DEBUG: Step 28 - WebView onLoad event fired');
    setLoading(false);
    setLoadError(null);
  }, []);

  // Handle errors
  const handleError = useCallback((syntheticEvent: any) => {
    try {
      const { nativeEvent } = syntheticEvent;
      const errorMsg = nativeEvent?.description || nativeEvent?.message || 'Failed to load widget';
      const error = new Error(errorMsg);
      errorLogger.logError('WebView error', error, { nativeEvent }, false);
      console.error('WebView error:', errorMsg, nativeEvent);
      setLoadError(errorMsg);
      setLoading(false);
      // Call onError callback
      try {
        onError?.(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    } catch (error: any) {
      errorLogger.logError('Error handling WebView error', error, {}, false);
      console.error('Error handling WebView error:', error);
      const fallbackError = new Error('An unexpected error occurred');
      setLoadError('An unexpected error occurred');
      setLoading(false);
      // Call onError callback
      try {
        onError?.(fallbackError);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
  }, [onError]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    try {
      const { nativeEvent } = syntheticEvent;
      const statusCode = nativeEvent?.statusCode || 'Unknown';
      const description = nativeEvent?.description || nativeEvent?.message || 'Failed to load widget';
      const error = new Error(`HTTP ${statusCode}: ${description}`);
      errorLogger.logError('WebView HTTP error', error, { statusCode, nativeEvent }, false);
      console.error('WebView HTTP error:', statusCode, description);
      setLoadError(`HTTP ${statusCode}: ${description}`);
      setLoading(false);
      // Call onError callback
      try {
        onError?.(error);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    } catch (error: any) {
      errorLogger.logError('Error handling WebView HTTP error', error, {}, false);
      console.error('Error handling WebView HTTP error:', error);
      const fallbackError = new Error('An unexpected error occurred');
      setLoadError('An unexpected error occurred');
      setLoading(false);
      // Call onError callback
      try {
        onError?.(fallbackError);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
  }, [onError]);

  // Debug: Component render
  if (visible) {
    //console.log('DEBUG: Step 9a - ZkMeWebView return statement (render)', {
     // visible,
      //loading,
      //loadError,
      //hasAccessToken: !!accessToken
    //});
  }

  // Show configuration error screen if config failed to load
  if (configError) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <ConfigurationErrorScreen
          error={configError}
          onRetry={async () => {
            setConfigError(null);
            try {
              const configService = AppConfigurationService.getInstance();
              const config = await configService.getZkMeConfig();
              setZkmeConfig(config);
            } catch (error) {
              const errorMessage = error instanceof ConfigurationError 
                ? error.message 
                : error instanceof Error 
                  ? error.message 
                  : 'Failed to load ZkMe configuration';
              setConfigError(errorMessage);
            }
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        // Cleanup WebView before closing
        try {
          if (webViewRef.current) {
            webViewRef.current.stopLoading();
          }
        } catch (e) {
          console.warn('Error cleaning up WebView on request close:', e);
        }
        // Use setTimeout to make close non-blocking
        setTimeout(() => {
          onClose();
        }, 0);
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Identity Verification</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Cleanup WebView before closing
              try {
                if (webViewRef.current) {
                  // Stop loading and clear WebView
                  webViewRef.current.stopLoading();
                }
              } catch (e) {
                console.warn('Error cleaning up WebView:', e);
              }
              // Use setTimeout to make close non-blocking
              setTimeout(() => {
                onClose();
              }, 0);
            }}
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
              <TouchableOpacity 
                onPress={() => {
                  setLoadError(null);
                  getToken();
                }} 
                style={styles.retryButton} 
                activeOpacity={0.7}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !loadError && accessToken && (() => {
            try {
              errorLogger.logDebug('Step 25: About to generate widget URL and render WebView', { loading, loadError, hasAccessToken: !!accessToken }, false);
              const widgetUrl = generateWidgetUrl();
              errorLogger.logDebug('Step 26: Widget URL generated', { hasUrl: !!widgetUrl }, false);
              if (!widgetUrl) {
                errorLogger.logError('Step 26a: Generated URL is empty', new Error('Empty URL'), {}, false);
                return (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: '#ef4444' }]}>
                      Failed to generate verification page. Please try again.
                    </Text>
                  </View>
                );
              }
              
              errorLogger.logDebug('Step 27: About to render WebView component with URL', {}, false);
              return (
                <WebView
                  ref={webViewRef}
                  source={{ uri: widgetUrl }}
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
                  onHttpError={handleHttpError}
                  onError={handleError}
                  allowsBackForwardNavigationGestures={false}
                  allowsLinkPreview={false}
                  cacheEnabled={false}
                  cacheMode="LOAD_NO_CACHE"
                  incognito={true}
                  thirdPartyCookiesEnabled={true}
                  sharedCookiesEnabled={true}
                  mixedContentMode="compatibility"
                  allowsFullscreenVideo={false}
                />
              );
            } catch (error: any) {
              errorLogger.logError('Step 27a: Error rendering WebView', error, {}, false);
              const renderError = new Error('Failed to load verification. Please try again.');
              // Call onError callback
              try {
                onError?.(renderError);
              } catch (callbackError) {
                console.error('Error in onError callback:', callbackError);
              }
              return (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: '#ef4444' }]}>
                    Failed to load verification. Please try again.
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setLoadError(null);
                      setAccessToken(null);
                      getToken();
                    }} 
                    style={styles.retryButton} 
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
                  </TouchableOpacity>
                </View>
              );
            }
          })()}
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

export default ZkMeWebView;
