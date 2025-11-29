import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import AppConfigurationService, { ConfigurationError } from '../services/AppConfigurationService';
import { ConfigurationErrorScreen } from './ConfigurationErrorScreen';
// Note: ZkMeWidget is loaded inside the WebView via CDN script in HTML

interface ZkMeWebViewProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
  userAccount?: string;
  programNo?: string;
  dappName?: string;
  chainId?: string;
}

export const ZkMeWebViewOptimized: React.FC<ZkMeWebViewProps> = ({
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
  const [isWebViewReady, setIsWebViewReady] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0); // Key to force WebView remount on each open
  const [zkmeMchNo, setZkmeMchNo] = useState<string>('');
  const [zkmeApiKey, setZkmeApiKey] = useState<string>('');
  const [configError, setConfigError] = useState<string | null>(null);
  const maxRetries = 3;
  const webViewRef = useRef<WebView>(null);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tokenFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load ZkMe configuration from database on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configService = AppConfigurationService.getInstance();
        const config = await configService.getZkMeConfig();
        setZkmeMchNo(config.mchNo);
        setZkmeApiKey(config.apiKey);
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

  // Optimized token fetching with proper cleanup
  const getToken = useCallback(async () => {
    if (!visible) return;
    
    setLoading(true);
    setLoadError(null);
    setAccessToken(null);
    setIsWebViewReady(false);
    
    try {
      if (!zkmeMchNo || !zkmeApiKey) {
        throw new ConfigurationError('ZkMe configuration not loaded. Please try again.');
      }
      
      // Clear any existing timeout
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
      }
      
      // Set a timeout for the entire token fetch operation
      tokenFetchTimeoutRef.current = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        throw new Error('Token fetch timed out');
      }, 15000);
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
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
      abortControllerRef.current = null;
    } catch (e: any) {
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
        tokenFetchTimeoutRef.current = null;
      }
      abortControllerRef.current = null;
      
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
      // Reset state and generate new key for fresh WebView instance
      setWebViewKey(prev => prev + 1);
      setRetryCount(0);
      setLoadError(null);
      setIsWebViewReady(false);
      getToken();
    } else {
      // Cleanup when modal closes - reset all state
      setAccessToken(null);
      setIsWebViewReady(false);
      setLoading(true);
      setLoadError(null);
      setRetryCount(0);
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
        initializationTimeoutRef.current = null;
      }
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
        tokenFetchTimeoutRef.current = null;
      }
      // Abort any in-flight fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Clear WebView cache and reset ref
      if (webViewRef.current) {
        try {
          // Clear WebView cache if method is available
          webViewRef.current.clearCache?.(true);
        } catch (e) {
          console.warn('Could not clear WebView cache:', e);
        }
      }
      // WebView will be unmounted automatically when Modal visible becomes false
    }
  }, [visible, getToken]);

  // Generate URL for loading widget from server
  const generateWidgetUrl = useCallback(() => {
    try {
      // Validate required configuration
      if (!zkmeMchNo) {
        throw new Error('Missing ZkMe configuration');
      }
      
      if (!accessToken) {
        throw new Error('Missing access token');
      }
      
      const configuredChainId = chainId || '1';
      const configuredDappName = dappName || 'Aqifi Insight Nexus';
      const configuredProgramNo = programNo || '';
      const userAccountAddr = userAccount || '';

      // Build query parameters
      const params = new URLSearchParams({
        accessToken: accessToken,
        appId: zkmeMchNo,
        chainId: configuredChainId,
        dappName: configuredDappName,
      });

      if (configuredProgramNo) {
        params.append('programNo', configuredProgramNo);
      }

      if (userAccountAddr) {
        params.append('userAccount', userAccountAddr);
      }

      return `https://zk.hawkrel.com/widget?${params.toString()}`;
    } catch (error: any) {
      console.error('Error generating widget URL:', error);
      setLoadError(error?.message || 'Failed to generate widget URL');
      return null;
    }
  }, [zkmeMchNo, chainId, dappName, programNo, accessToken, userAccount]);

  const handleWebViewLoad = useCallback(() => {
    setIsWebViewReady(true);
    setLoading(false);
    setLoadError(null);
  }, []);

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data);
      
      // Handle console logs from WebView
      if (data.type === 'console-log') {
        const logLevel = data.level || 'log';
        const message = data.message || '';
        console.log(`[WebView ${logLevel.toUpperCase()}]`, message);
        return;
      }
      
      if (
        data.type === 'zkme-verification-complete' ||
        data.type === 'verificationComplete' ||
        data.event === 'zkme-verification-complete'
      ) {
        // Alert.alert(
        //   'Verification Complete',
        //   'Your identity has been verified successfully!',
        //   [
        //     {
        //       text: 'OK',
        //       onPress: () => {
        //         // Call onComplete first, then cleanup and close
        //         const result = data.result || data.payload || data;
        //         onComplete?.(result);
        //         // Cleanup WebView before closing
        //         if (webViewRef.current) {
        //           try {
        //             webViewRef.current.clearCache?.(true);
        //           } catch (e) {
        //             console.warn('Could not clear WebView cache on complete:', e);
        //           }
        //         }
        //         // Close after a brief delay to ensure cleanup completes
        //         setTimeout(() => {
        //           onClose();
        //         }, 100);
        //       }
        //     }
        //   ]
        // );
        // Call onComplete first, then cleanup and close
        const result = data.result || data.payload || data;
        onComplete?.(result);
        // Cleanup WebView before closing
        if (webViewRef.current) {
          try {
            webViewRef.current.clearCache?.(true);
          } catch (e) {
            console.warn('Could not clear WebView cache on complete:', e);
          }
        }
        // Close after a brief delay to ensure cleanup completes
        setTimeout(() => {
          onClose();
        }, 100);
      } else if (
        data.type === 'zkme-verification-error' ||
        data.type === 'verificationError' ||
        data.event === 'zkme-verification-error'
      ) {
        const errorMessage = data.message || 'There was an error during verification.';
        console.error('ZkMe verification error:', errorMessage);
        
        if (errorMessage.includes('timeout') && retryCount < maxRetries) {
          // Alert.alert(
          //   'Verification Timeout',
          //   `Verification timed out. Would you like to retry? (${retryCount + 1}/${maxRetries})`,
          //   [
          //     {
          //       text: 'Retry',
          //       onPress: () => {
          //         setRetryCount(prev => prev + 1);
          //         setLoadError(null);
          //         setLoading(true);
          //         getToken();
          //       }
          //     },
          //     {
          //       text: 'Cancel',
          //       onPress: () => onClose()
          //     }
          //   ]
          // );
          // Auto-retry on timeout
          setRetryCount(prev => prev + 1);
          setLoadError(null);
          setLoading(true);
          getToken();
        } else {
          // Alert.alert(
          //   'Verification Error',
          //   errorMessage,
          //   [{ text: 'OK' }]
          // );
        }
      } else if (data.type === 'zkme-widget-closed') {
        onClose();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  }, [onComplete, onClose, retryCount, maxRetries, getToken]);

  const handleHttpError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoadError(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Failed to load widget'}`);
  }, []);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setLoadError(nativeEvent?.description || 'Failed to load widget');
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLoadError(null);
      setLoading(true);
      getToken();
    }
  }, [retryCount, maxRetries, getToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      if (tokenFetchTimeoutRef.current) {
        clearTimeout(tokenFetchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Show configuration error screen if config failed to load
  if (configError) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ConfigurationErrorScreen
          error={configError}
          onRetry={async () => {
            setConfigError(null);
            try {
              const configService = AppConfigurationService.getInstance();
              const config = await configService.getZkMeConfig();
              setZkmeMchNo(config.mchNo);
              setZkmeApiKey(config.apiKey);
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

          {/* Only render WebView when we have access token and no errors */}
          {!loading && !loadError && accessToken && (() => {
            try {
              const widgetUrl = generateWidgetUrl();
              if (!widgetUrl) {
                return (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: '#ef4444' }]}>
                      Failed to generate verification page. Please try again.
                    </Text>
                  </View>
                );
              }
              return (
                <WebView
                  ref={webViewRef}
                  key={`zkme-webview-${webViewKey}-${retryCount}-${Date.now()}`}
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
            // Optimized WebView settings
            allowsBackForwardNavigationGestures={false}
            allowsLinkPreview={false}
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
            incognito={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            mixedContentMode="compatibility"
            allowsFullscreenVideo={false}
            // Performance optimizations
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}
            // Debugging
            onLoadStart={() => console.log('WebView load started')}
            onLoadEnd={() => console.log('WebView load ended')}
            onNavigationStateChange={(navState) => {
              console.log('WebView navigation state changed:', navState);
            }}
            // Enable console logging from WebView
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
              );
            } catch (error: any) {
              console.error('Error rendering WebView:', error);
              return (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { color: '#ef4444' }]}>
                    Failed to load verification. Please try again.
                  </Text>
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

export default ZkMeWebViewOptimized;
