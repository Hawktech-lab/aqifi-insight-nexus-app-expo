import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { KycVerificationModal } from './KycVerificationModal';

interface KYCSubmission {
  id: string;
  rejection_reason?: string;
  reviewed_at?: string;
  created_at: string;
}

interface StatusConfig {
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  badgeClasses: string;
  iconColor: string;
  messageClasses?: string;
  messageTextClasses?: string;
}

export function KYCStatus() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubmission();
    }
  }, [user]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSubmission(data);
    } catch (error) {
      console.error('Error fetching KYC submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string): StatusConfig => {
    const configs: Record<string, StatusConfig> = {
      pending: {
        label: 'Pending Review',
        description: 'Your KYC submission is being reviewed by our team.',
        icon: Clock,
        badgeClasses: 'bg-yellow-100 border-yellow-300 px-3 py-1.5 rounded-full border',
        iconColor: '#d97706',
        messageClasses: 'bg-yellow-50 border-yellow-200 p-3 rounded-lg border',
        messageTextClasses: 'text-yellow-800 text-sm leading-5'
      },
      verified: {
        label: 'Verified',
        description: 'Your identity has been successfully verified.',
        icon: CheckCircle,
        badgeClasses: 'bg-green-100 border-green-300 px-3 py-1.5 rounded-full border',
        iconColor: '#059669',
        messageClasses: 'bg-green-50 border-green-200 p-3 rounded-lg border',
        messageTextClasses: 'text-green-800 text-sm leading-5'
      },
      rejected: {
        label: 'Rejected',
        description: 'Your KYC submission was rejected. Please review the feedback and resubmit.',
        icon: XCircle,
        badgeClasses: 'bg-red-100 border-red-300 px-3 py-1.5 rounded-full border',
        iconColor: '#dc2626',
        messageClasses: 'bg-red-50 border-red-200 p-3 rounded-lg border',
        messageTextClasses: 'text-red-800 text-sm leading-5'
      }
    };

    return configs[status] || {
      label: 'Not Started',
      description: 'Complete your KYC verification to unlock all features.',
      icon: AlertCircle,
      badgeClasses: 'bg-gray-100 border-gray-300 px-3 py-1.5 rounded-full border',
      iconColor: '#6b7280'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="mt-3 text-base text-gray-600">Loading KYC status...</Text>
      </View>
    );
  }

  const kycStatus = profile?.kyc_status || 'not_started';
  
  // Debug logging
  console.log('KYC Status Debug:', { 
    profileKycStatus: profile?.kyc_status, 
    kycStatus, 
    submission,
    profile 
  });

  const config = getStatusConfig(kycStatus);
  const Icon = config.icon;

  const getButtonText = () => {
    switch (kycStatus) {
      case 'not_started':
        return 'Start KYC Verification';
      case 'rejected':
        return 'Resubmit Application';
      default:
        return 'View Application';
    }
  };

  const getButtonClasses = () => {
    return kycStatus === 'not_started' 
      ? 'bg-blue-500 p-4 rounded-lg items-center mt-2'
      : 'bg-transparent border border-blue-500 p-4 rounded-lg items-center mt-2';
  };

  const getButtonTextClasses = () => {
    return kycStatus === 'not_started' 
      ? 'text-white text-base font-semibold'
      : 'text-blue-500 text-base font-semibold';
  };

  return (
    <>
      <View className="bg-white m-4 rounded-xl p-5 shadow-sm">
        <View className="mb-5">
          <View className="flex-row items-center gap-2 mb-2">
            <Icon size={20} color={config.iconColor} />
            <Text className="text-lg font-semibold text-gray-800">KYC Verification Status</Text>
          </View>
          <Text className="text-sm text-gray-600 leading-5">
            Know Your Customer verification ensures secure transactions
          </Text>
        </View>

        <View className="gap-4">
          <View className="flex-row items-center flex-wrap gap-2">
            <View className={config.badgeClasses}>
              <Text className={
                kycStatus === 'pending' ? 'text-yellow-800 text-xs font-medium' :
                kycStatus === 'verified' ? 'text-green-800 text-xs font-medium' :
                kycStatus === 'rejected' ? 'text-red-800 text-xs font-medium' :
                'text-gray-800 text-xs font-medium'
              }>
                {config.label}
              </Text>
            </View>
            
            {submission && submission.reviewed_at && kycStatus !== 'pending' && (
              <Text className="text-xs text-gray-600">
                {kycStatus === 'verified' ? 'Verified' : 'Reviewed'} on {formatDate(submission.reviewed_at)}
              </Text>
            )}
            
            {submission && !submission.reviewed_at && kycStatus === 'pending' && (
              <Text className="text-xs text-gray-600">
                Submitted on {formatDate(submission.created_at)}
              </Text>
            )}
          </View>

          <Text className="text-sm text-gray-600 leading-5">
            {config.description}
          </Text>

          {kycStatus === 'verified' && (
            <View className="bg-green-50 border-green-200 p-3 rounded-lg border">
              <Text className="text-sm text-green-800 leading-5">
                🎉 Congratulations! Your identity has been verified. You can now access all features.
              </Text>
            </View>
          )}

          {kycStatus === 'rejected' && submission?.rejection_reason && (
            <View className="bg-red-50 border-red-200 p-3 rounded-lg border">
              <Text className="text-sm text-red-800 leading-5">
                <Text className="font-semibold">Rejection Reason:</Text> {submission.rejection_reason}
              </Text>
            </View>
          )}

          {kycStatus === 'pending' && (
            <View className="bg-yellow-50 border-yellow-200 p-3 rounded-lg border">
              <Text className="text-sm text-yellow-800 leading-5">
                ⏳ Your KYC submission is currently under review. We'll notify you once the review is complete.
              </Text>
            </View>
          )}

          <TouchableOpacity 
            className={getButtonClasses()}
            onPress={() => setModalVisible(true)}
          >
            <Text className={getButtonTextClasses()}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KycVerificationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        userSubmission={submission ? { ...submission, kyc_status: kycStatus } : null}
        onSubmissionUpdate={() => fetchSubmission()}
      />
    </>
  );
}
