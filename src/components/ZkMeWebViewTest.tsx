import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

interface ZkMeWebViewTestProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: (result: any) => void;
  userAccount?: string;
  programNo?: string;
  dappName?: string;
  chainId?: string;
}

export const ZkMeWebViewTest: React.FC<ZkMeWebViewTestProps> = ({
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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const zkmeMchNo: string =
    (process.env.EXPO_PUBLIC_ZKME_MCH_NO as string) || (Constants.expoConfig?.extra as any)?.zkmeMchNo || '';
  const zkmeApiKey: string =
    (process.env.EXPO_PUBLIC_ZKME_API_KEY as string) || (Constants.expoConfig?.extra as any)?.zkmeApiKey || '';

  const addDebugLog = useCallback((message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[ZkMe Debug] ${message}`);
  }, []);

  // Simple test HTML
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ZkMe Test</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: system-ui; 
            background: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
          }
          .log {
            background: #f3f4f6;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            white-space: pre-wrap;
          }
          .error {
            background: #fef2f2;
            color: #dc2626;
            border: 1px solid #fecaca;
          }
          .success {
            background: #f0fdf4;
            color: #16a34a;
            border: 1px solid #bbf7d0;
          }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
          }
          button:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>ZkMe KYC Test</h2>
          <div id="status">Initializing...</div>
          <div id="logs"></div>
          <button onclick="testBasicFunctionality()">Test Basic Functionality</button>
          <button onclick="testWidgetLoading()">Test Widget Loading</button>
          <button onclick="clearLogs()">Clear Logs</button>
        </div>
        
        <script>
          const logs = document.getElementById('logs');
          const status = document.getElementById('status');
          
          function addLog(message, type = 'log') {
            const logDiv = document.createElement('div');
            logDiv.className = 'log ' + type;
            logDiv.textContent = new Date().toLocaleTimeString() + ': ' + message;
            logs.appendChild(logDiv);
            console.log(message);
            
            // Send to React Native
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug-log',
                message: message,
                level: type
              }));
            }
          }
          
          function updateStatus(message) {
            status.textContent = message;
            addLog('Status: ' + message);
          }
          
          function clearLogs() {
            logs.innerHTML = '';
          }
          
          function testBasicFunctionality() {
            addLog('Testing basic functionality...');
            try {
              // Test basic JavaScript
              addLog('✓ JavaScript is working');
              
              // Test React availability
              if (window.React) {
                addLog('✓ React is available');
              } else {
                addLog('✗ React is not available', 'error');
              }
              
              // Test ReactDOM availability
              if (window.ReactDOM) {
                addLog('✓ ReactDOM is available');
              } else {
                addLog('✗ ReactDOM is not available', 'error');
              }
              
              // Test zkMe widget availability
              if (window.ZkMeWidget) {
                addLog('✓ ZkMeWidget is available');
              } else if (window.zkMeWidget) {
                addLog('✓ zkMeWidget is available');
              } else if (window.zkmelabs && window.zkmelabs.ZkMeWidget) {
                addLog('✓ ZkMeWidget in zkmelabs namespace');
              } else {
                addLog('✗ ZkMeWidget not found', 'error');
              }
              
              updateStatus('Basic functionality test completed');
              
            } catch (error) {
              addLog('Error in basic functionality test: ' + error.message, 'error');
              updateStatus('Basic functionality test failed');
            }
          }
          
          function testWidgetLoading() {
            addLog('Testing widget loading...');
            updateStatus('Loading React...');
            
            // Load React first
            if (!window.React || !window.ReactDOM) {
              addLog('Loading React and ReactDOM...');
              const reactScript = document.createElement('script');
              reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
              reactScript.onload = () => {
                addLog('React loaded, loading ReactDOM...');
                const reactDOMScript = document.createElement('script');
                reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                reactDOMScript.onload = () => {
                  addLog('ReactDOM loaded, loading zkMe widget...');
                  loadZkMeWidget();
                };
                reactDOMScript.onerror = (e) => {
                  addLog('Failed to load ReactDOM: ' + e, 'error');
                };
                document.head.appendChild(reactDOMScript);
              };
              reactScript.onerror = (e) => {
                addLog('Failed to load React: ' + e, 'error');
              };
              document.head.appendChild(reactScript);
            } else {
              addLog('React already loaded, loading zkMe widget...');
              loadZkMeWidget();
            }
          }
          
          function loadZkMeWidget() {
            updateStatus('Loading zkMe widget...');
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@zkmelabs/widget@0.3.6/dist/index.umd.js';
            script.onload = () => {
              addLog('zkMe widget loaded successfully', 'success');
              updateStatus('Widget loaded successfully');
              
              // Test widget creation
              try {
                if (window.ZkMeWidget) {
                  addLog('ZkMeWidget constructor found');
                  
                  // Test provider creation
                  class TestProvider {
                    async getAccessToken() {
                      return 'test-token';
                    }
                    async getUserAccounts() {
                      return ['test@example.com'];
                    }
                  }
                  
                  const provider = new TestProvider();
                  addLog('Test provider created');
                  
                  // Test widget creation (without mounting)
                  const widget = new window.ZkMeWidget(
                    'test-app-id',
                    'Test App',
                    '1',
                    provider,
                    { lv: 'zkKYC' }
                  );
                  
                  addLog('Widget created successfully', 'success');
                  updateStatus('All tests passed!');
                  
                } else {
                  addLog('ZkMeWidget constructor not found after loading', 'error');
                  updateStatus('Widget loading failed');
                }
              } catch (error) {
                addLog('Error creating widget: ' + error.message, 'error');
                updateStatus('Widget creation failed');
              }
            };
            script.onerror = (e) => {
              addLog('Failed to load zkMe widget: ' + e, 'error');
              updateStatus('Widget loading failed');
            };
            document.head.appendChild(script);
          }
          
          // Global error handler
          window.addEventListener('error', (event) => {
            addLog('Global error: ' + event.error?.message || event.message, 'error');
          });
          
          window.addEventListener('unhandledrejection', (event) => {
            addLog('Unhandled promise rejection: ' + event.reason, 'error');
          });
          
          // Initial status
          updateStatus('Ready for testing');
          addLog('Test page loaded successfully');
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data);
      
      if (data.type === 'debug-log') {
        addDebugLog(`[${data.level.toUpperCase()}] ${data.message}`);
        return;
      }
      
      if (data.type === 'zkme-verification-complete') {
        Alert.alert('Test Complete', 'Widget test completed successfully!');
        onComplete?.(data.result);
      }
      
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      addDebugLog(`Error parsing message: ${error.message}`);
    }
  }, [addDebugLog, onComplete]);

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
            <Text style={styles.title}>ZkMe Debug Test</Text>
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
          <WebView
            source={{ html: testHtml }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            // Debug settings
            onLoadStart={() => addDebugLog('WebView load started')}
            onLoadEnd={() => addDebugLog('WebView load ended')}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              addDebugLog(`WebView error: ${nativeEvent.description || 'Unknown error'}`);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              addDebugLog(`HTTP error: ${nativeEvent.statusCode} - ${nativeEvent.description}`);
            }}
          />
        </View>

        {/* Debug logs panel */}
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Debug Logs:</Text>
          {debugLogs.map((log, index) => (
            <Text key={index} style={styles.debugLog}>{log}</Text>
          ))}
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
  debugPanel: {
    maxHeight: 200,
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#374151',
    marginBottom: 5,
  },
  debugLog: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
};

export default ZkMeWebViewTest;
