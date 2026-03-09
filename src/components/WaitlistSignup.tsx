import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ViralloopsService from '../services/ViralloopsService';
import WaitlistService from '../services/WaitlistService';
import { useAuth } from '../contexts/AuthContext';

interface WaitlistSignupProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  referralCode?: string;
  showReferralInput?: boolean;
}

export const WaitlistSignup: React.FC<WaitlistSignupProps> = ({
  onSuccess,
  onError,
  referralCode: initialReferralCode,
  showReferralInput = true,
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingReferralCode, setLoadingReferralCode] = useState(true);

  // Pre-fill email from auth user if available
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user?.email]);

  // Fetch user's referral code from Viral Loops/database
  useEffect(() => {
    const fetchUserReferralCode = async () => {
      if (!user?.id) {
        setLoadingReferralCode(false);
        return;
      }

      try {
        const waitlistService = WaitlistService.getInstance();
        const waitlistUser = await waitlistService.getWaitlistUser(user.id);
        
        if (waitlistUser?.referral_code) {
          setReferralCode(waitlistUser.referral_code);
        } else {
          // Try to get from Viral Loops API if available
          const viralloopsService = ViralloopsService.getInstance();
          const initialized = await viralloopsService.initialize();
          
          if (initialized && viralloopsService.hasApiKey() && user?.email) {
            const participant = await viralloopsService.getParticipant(user.email);
            if (participant?.referralCode) {
              setReferralCode(participant.referralCode);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching referral code:', error);
      } finally {
        setLoadingReferralCode(false);
      }
    };

    fetchUserReferralCode();
  }, [user?.id, user?.email]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Reset error
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate referral code is required
    if (!referralCode.trim()) {
      setError('Referral code is required');
      return;
    }

    setLoading(true);

    try {
      const viralloopsService = ViralloopsService.getInstance();
      const initialized = await viralloopsService.initialize();

      if (!initialized) {
        throw new Error('Waitlist service is not configured. Please contact support.');
      }

      // Check if API key is available
      if (!viralloopsService.hasApiKey()) {
        throw new Error('Waitlist API is not configured. Please contact support.');
      }

      // Create participant in Viral Loops for the referred person
      // The referralCode here is the current user's code (the referrer)
      const participant = await viralloopsService.createParticipant({
        email: email.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        referredByCode: referralCode.trim().toUpperCase() || undefined,
      });

      // Note: The referred person will join the waitlist when they sign up
      // This form is for the current user to refer others using their referral code

      setSubmitted(true);
      setLoading(false);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to join waitlist. Please try again.';
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Icon name="checkmark-circle" size={64} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>You're on the list!</Text>
          <Text style={styles.successMessage}>
            We've added you to the waitlist. You'll be notified when we launch!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Icon name="people-outline" size={48} color="#3b82f6" />
            <Text style={styles.title}>Refer to unlock and Enter the App</Text>
            <Text style={styles.subtitle}>
              Share your referral code to unlock access
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                placeholderTextColor="#9ca3af"
                value=""
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <Icon name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <Icon name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {showReferralInput && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code *</Text>
              <View style={styles.inputContainer}>
                <Icon name="gift-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                {loadingReferralCode ? (
                  <ActivityIndicator size="small" color="#3b82f6" style={{ flex: 1 }} />
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="Your referral code"
                    placeholderTextColor="#9ca3af"
                    value={referralCode}
                    onChangeText={(text) => setReferralCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    editable={false}
                  />
                )}
              </View>
              <Text style={styles.helperText}>
                This is your referral code from Viral Loops. Share it with others to refer them.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Icon name="share-outline" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Refer</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            By joining, you agree to receive updates about our launch.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 300,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
