import { useState, useEffect } from 'react';

// Safe errorLogger import - wrap in try-catch to prevent crashes
let errorLogger: any = null;
try {
  const errorLoggerModule = require('../utils/errorLogger');
  errorLogger = errorLoggerModule?.errorLogger || {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
} catch (e) {
  // Fallback logger if import fails
  errorLogger = {
    logInfo: () => {},
    logError: () => {},
    logWarning: () => {},
  };
}

export interface WaitlistError {
  type: 'invalid_campaign' | 'expired_campaign' | 'missing_campaign' | 'api_error' | null;
  message?: string;
}

/**
 * Hook to check if waitlist feature is enabled
 * This hook is designed to NEVER crash, even if services fail to initialize
 * Returns { enabled: false, loading: false } by default to prevent crashes
 */
export const useWaitlistEnabled = () => {
  // Start with disabled and loading=false - this hook should NEVER crash
  // Hooks must be called unconditionally - cannot wrap in try-catch
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<WaitlistError | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Hook initialized', { timestamp: new Date().toISOString() });
    } catch (e) {
      // Ignore logging errors
    }
    
    const checkEnabled = async () => {
      // Wrap everything in try-catch to ensure we never crash
      if (!isMounted) {
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Component unmounted, skipping');
        } catch (e) {}
        return;
      }
      
      try {
        errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Starting check', { timestamp: new Date().toISOString() });
      } catch (e) {}
      
      // Use a safe wrapper function that never throws
      const safeSetState = (updater: () => void) => {
        if (!isMounted) return;
        try {
          updater();
        } catch (e) {
          try {
            errorLogger?.logError('[WAITLIST HOOK] safeSetState: setState error', e);
          } catch (logErr) {}
        }
      };
      
      safeSetState(() => setLoading(true));
      try {
        errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Set loading=true');
      } catch (e) {}
      
      try {
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 1 - Starting dynamic import of WaitlistService');
        } catch (e) {}
        
        // Use dynamic import with additional error handling
        // Wrap in try-catch to handle module loading failures
        let WaitlistServiceModule: any = null;
        try {
          WaitlistServiceModule = await Promise.race([
            import('../services/WaitlistService').catch((importError) => {
              // If import fails, log and return null
              try {
                errorLogger?.logError('[WAITLIST HOOK] checkEnabled: Dynamic import failed', importError, {
                  step: 'dynamic import',
                  timestamp: new Date().toISOString()
                });
              } catch (e) {}
              throw importError; // Re-throw to be caught by outer catch
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Import timeout')), 10000)
            )
          ]) as { default: any };
        } catch (importError) {
          // If import completely fails, disable waitlist
          throw new Error(`Failed to import WaitlistService: ${importError}`);
        }
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 2 - WaitlistService imported successfully');
        } catch (e) {}
        
        const WaitlistService = WaitlistServiceModule?.default;
        if (!WaitlistService) {
          throw new Error('WaitlistService not found in module');
        }
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 3 - Getting WaitlistService instance');
        } catch (e) {}
        
        // Get service instance safely
        const waitlistService = WaitlistService.getInstance();
        if (!waitlistService) {
          throw new Error('Failed to get WaitlistService instance');
        }
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 4 - Calling isEnabled()');
        } catch (e) {}
        
        // Call isEnabled with very short timeout - fail fast on errors (1 second max)
        let isEnabledResult: boolean;
        try {
          isEnabledResult = await Promise.race([
            waitlistService.isEnabled(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Waitlist check timeout - service not responding')), 1000)
            )
          ]);
        } catch (enableError: any) {
          // Check if error indicates invalid/expired campaign
          const errorMessage = enableError?.message || String(enableError);
          let errorType: WaitlistError['type'] = 'api_error';
          
          if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
            errorType = 'invalid_campaign';
          } else if (errorMessage.includes('expired') || errorMessage.includes('Expired')) {
            errorType = 'expired_campaign';
          } else if (errorMessage.includes('not configured') || errorMessage.includes('missing') || errorMessage.includes('timeout')) {
            errorType = 'missing_campaign';
          }
          
          safeSetState(() => {
            setEnabled(false);
            setLoading(false);
            setError({ type: errorType, message: errorMessage });
          });
          return;
        }
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 5 - isEnabled() completed', { result: isEnabledResult });
        } catch (e) {}
        
        // If waitlist is disabled, set error immediately - don't do slow validation
        // Skip additional validation to fail fast - errors will be caught when user tries to use waitlist
        if (!isEnabledResult) {
          safeSetState(() => {
            setEnabled(false);
            setLoading(false);
            setError({ type: 'missing_campaign', message: 'Waitlist is not enabled or campaign ID is missing' });
          });
          return;
        }
        
        safeSetState(() => {
          setEnabled(!!isEnabledResult);
          setLoading(false);
          setError(isEnabledResult ? null : null); // Clear error if enabled
        });
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] checkEnabled: Step 6 - State updated successfully', { enabled: !!isEnabledResult });
        } catch (e) {}
      } catch (error: any) {
        // Any error means waitlist is disabled - this is safe default
        try {
          errorLogger?.logError('[WAITLIST HOOK] checkEnabled: Error checking waitlist status', error, {
            step: 'checkEnabled',
            timestamp: new Date().toISOString()
          });
        } catch (logErr) {}
        
        // Determine error type from error message
        const errorMessage = error?.message || String(error);
        let errorType: WaitlistError['type'] = 'api_error';
        
        if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
          errorType = 'invalid_campaign';
        } else if (errorMessage.includes('expired') || errorMessage.includes('Expired')) {
          errorType = 'expired_campaign';
        } else if (errorMessage.includes('not configured') || errorMessage.includes('missing') || errorMessage.includes('Campaign ID')) {
          errorType = 'missing_campaign';
        }
        
        safeSetState(() => {
          setEnabled(false);
          setLoading(false);
          setError({ type: errorType, message: errorMessage });
        });
      }
    };

    // Start check immediately - no delay needed, fail fast on errors
    // Wrap in try-catch to ensure this never throws
      try {
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Starting checkEnabled immediately');
        } catch (e) {}
        
        // Start immediately, but wrap in setTimeout(0) to ensure it runs after render
        timeoutId = setTimeout(() => {
          try {
            errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Timeout callback executed', { isMounted });
          } catch (e) {}
          
          if (isMounted) {
            // Wrap in try-catch to catch any synchronous errors
            try {
              try {
                errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Calling checkEnabled()');
              } catch (e) {}
              
              checkEnabled().catch((error) => {
                // Final safety net - if checkEnabled itself throws, just disable
                try {
                  errorLogger?.logError('[WAITLIST HOOK] useEffect: Fatal error in checkEnabled promise', error, {
                    step: 'checkEnabled promise rejection',
                    timestamp: new Date().toISOString()
                  });
                } catch (e) {}
                
                if (isMounted) {
                  try {
                    setEnabled(false);
                    setLoading(false);
                  } catch (e) {
                    // Ignore setState errors
                  }
                }
              });
            } catch (syncError) {
              // Catch any synchronous errors in checkEnabled call
              try {
                errorLogger?.logError('[WAITLIST HOOK] useEffect: Synchronous error calling checkEnabled', syncError, {
                  step: 'checkEnabled synchronous call',
                  timestamp: new Date().toISOString()
                });
              } catch (e) {}
              
              if (isMounted) {
                try {
                  setEnabled(false);
                  setLoading(false);
                } catch (e) {
                  // Ignore setState errors
                }
              }
            }
          } else {
            try {
              errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Component unmounted, skipping checkEnabled');
            } catch (e) {}
          }
        }, 0); // No delay - start immediately, fail fast on errors
        
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Timeout set successfully');
        } catch (e) {}
      } catch (timeoutError) {
        // If setTimeout itself fails (shouldn't happen), just disable
        try {
          errorLogger?.logError('[WAITLIST HOOK] useEffect: Failed to set timeout', timeoutError, {
            step: 'setTimeout',
            timestamp: new Date().toISOString()
          });
        } catch (e) {}
      
      if (isMounted) {
        try {
          setEnabled(false);
          setLoading(false);
        } catch (e) {
          // Ignore setState errors
        }
      }
    }

    return () => {
      try {
        errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Cleanup function called');
      } catch (e) {}
      
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
        try {
          errorLogger?.logInfo('[WAITLIST HOOK] useEffect: Timeout cleared');
        } catch (e) {}
      }
    };
  }, []);

  // Always return safe defaults - this should NEVER throw
  const result = { 
    enabled: enabled || false, 
    loading: loading || false,
    error: error || null
  };
  
  // Log result safely - don't let logging errors crash the hook
  try {
    errorLogger?.logInfo('[WAITLIST HOOK] Render: Returning result', result);
  } catch (logError) {
    // Silently ignore logging errors - don't crash the hook
  }
  
  return result;
};

