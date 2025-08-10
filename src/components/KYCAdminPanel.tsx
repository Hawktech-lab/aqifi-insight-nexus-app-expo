import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Camera,
  MapPin,
  X,
} from 'lucide-react-native';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface KYCSubmission {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  address: string;
  phone_number: string;
  city: string;
  country: string;
  postal_code: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  profiles: {
    kyc_status: string;
  };
  kyc_documents: Array<{
    id: string;
    document_type: string;
    file_url: string;
  }>;
}

// Custom Badge Component
const Badge = ({ 
  children, 
  variant = 'default',
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive';
  className?: string;
}) => {
  const variantStyles = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <View className={`px-2 py-1 rounded-full ${variantStyles[variant]} ${className}`}>
      <Text className="text-xs font-medium">{children}</Text>
    </View>
  );
};

// Custom Card Component
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <View className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {children}
  </View>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <View className="p-4 border-b border-gray-100">{children}</View>
);

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <View className="p-4">{children}</View>
);

// Custom Button Component
const Button = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'default' | 'sm';
  disabled?: boolean;
  className?: string;
}) => {
  const variantStyles = {
    default: 'bg-blue-500 text-white',
    destructive: 'bg-red-500 text-white',
    outline: 'bg-transparent border border-gray-300 text-gray-700',
  };

  const sizeStyles = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`
        rounded-lg items-center justify-center
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
      activeOpacity={0.7}
    >
      <Text className={`font-medium text-sm ${
        variant === 'outline' ? 'text-gray-700' : 'text-white'
      }`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

export function KYCAdminPanel() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const showToast = (title: string, message: string, isError = false) => {
    Alert.alert(title, message);
  };

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles and documents separately for each submission
      const submissionsWithData = await Promise.all(
        (data || []).map(async (submission: any) => {
          // Fetch profile KYC status
          const { data: profile } = await supabase
            .from('profiles')
            .select('kyc_status')
            .eq('user_id', submission.user_id)
            .maybeSingle();

          // Fetch associated documents
          const { data: documents } = await supabase
            .from('kyc_documents')
            .select('*')
            .eq('user_id', submission.user_id);
          
          return {
            ...submission,
            profiles: { kyc_status: profile?.kyc_status || 'pending' },
            kyc_documents: documents || []
          };
        })
      );

      setSubmissions(submissionsWithData as any);
    } catch (error: any) {
      console.error('KYC fetch error:', error);
      showToast("Error", `Failed to fetch KYC submissions: ${error.message}`, true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();

    // Listen for real-time updates
    const channel = supabase
      .channel('kyc-admin-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'kyc_status=neq.null'
        },
        () => {
          fetchSubmissions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kyc_submissions'
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (submissionId: string, userId: string) => {
    setActionLoading(true);
    try {
      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'verified' })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update submission
      const { error: submissionError } = await supabase
        .from('kyc_submissions')
        .update({
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: null
        })
        .eq('id', submissionId);

      if (submissionError) throw submissionError;

      showToast("KYC Approved", "User verification has been approved successfully.");
      fetchSubmissions();
    } catch (error: any) {
      showToast("Error", error.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast("Error", "Please provide a rejection reason", true);
      return;
    }

    if (!selectedSubmission) return;

    setActionLoading(true);
    try {
      // Update profile KYC status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ kyc_status: 'rejected' })
        .eq('user_id', selectedSubmission.user_id);

      if (profileError) throw profileError;

      // Update submission
      const { error: submissionError } = await supabase
        .from('kyc_submissions')
        .update({
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', selectedSubmission.id);

      if (submissionError) throw submissionError;

      showToast("KYC Rejected", "User verification has been rejected.");
      
      setRejectionReason('');
      setSelectedSubmission(null);
      setShowRejectModal(false);
      fetchSubmissions();
    } catch (error: any) {
      showToast("Error", error.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      verified: { label: 'Verified', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <View className="flex-row items-center">
        <Badge variant={config.variant}>
          <View className="flex-row items-center gap-1">
            <Icon size={12} color={config.variant === 'default' ? '#1e40af' : config.variant === 'destructive' ? '#dc2626' : '#6b7280'} />
            <Text className="text-xs font-medium">{config.label}</Text>
          </View>
        </Badge>
      </View>
    );
  };

  const viewDocument = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('kyc-documents')
        .createSignedUrl(filePath, 3600);
      
      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl);
      }
    } catch (error) {
      showToast("Error", "Failed to open document", true);
    }
  };

  const getDocumentIcon = (type: string) => {
    if (type.includes('selfie')) return Camera;
    if (type.includes('address')) return MapPin;
    return FileText;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSubmissions();
  };

  const pendingSubmissions = submissions.filter(s => s.profiles.kyc_status === 'pending');
  const verifiedSubmissions = submissions.filter(s => s.profiles.kyc_status === 'verified');
  const rejectedSubmissions = submissions.filter(s => s.profiles.kyc_status === 'rejected');

  const getFilteredSubmissions = () => {
    switch (selectedTab) {
      case 'pending': return pendingSubmissions;
      case 'verified': return verifiedSubmissions;
      case 'rejected': return rejectedSubmissions;
      default: return pendingSubmissions;
    }
  };

  const renderSubmissionCard = (submission: KYCSubmission) => (
    <Card key={submission.id} className="mb-4">
      <CardHeader>
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {submission.first_name} {submission.last_name}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {selectedTab === 'pending' 
                ? `Submitted: ${new Date(submission.created_at).toLocaleDateString()}`
                : selectedTab === 'verified'
                ? `Verified: ${submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString() : 'N/A'}`
                : `Rejected: ${submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString() : 'N/A'}`
              }
            </Text>
          </View>
          {getStatusBadge(submission.profiles.kyc_status)}
        </View>
      </CardHeader>
      
      <CardContent>
        {/* User Details */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <View className="flex-1 mr-4">
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">Phone:</Text> {submission.phone_number}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                <Text className="font-medium">DOB:</Text> {new Date(submission.date_of_birth).toLocaleDateString()}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                <Text className="font-medium">Country:</Text> {submission.country}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-medium">City:</Text> {submission.city}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">
                <Text className="font-medium">Postal:</Text> {submission.postal_code}
              </Text>
              {selectedTab === 'verified' && (
                <Text className="text-sm text-gray-600 mt-1">
                  <Text className="font-medium">User ID:</Text> {submission.user_id}
                </Text>
              )}
            </View>
          </View>
          
          <Text className="text-sm text-gray-600">
            <Text className="font-medium">Address:</Text> {submission.address}
          </Text>
        </View>

        {/* Documents */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Documents:</Text>
          <View className="flex-row flex-wrap gap-2">
            {submission.kyc_documents.map((doc) => {
              const Icon = getDocumentIcon(doc.document_type);
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => viewDocument(doc.file_url)}
                  className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                  activeOpacity={0.7}
                >
                  <Icon size={14} color="#6b7280" />
                  <Text className="text-xs text-gray-700 ml-1">
                    {doc.document_type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Rejection Reason for Rejected Submissions */}
        {selectedTab === 'rejected' && submission.rejection_reason && (
          <View className="bg-red-50 p-3 rounded-lg mb-4">
            <Text className="text-sm text-red-800">
              <Text className="font-medium">Rejection Reason:</Text> {submission.rejection_reason}
            </Text>
          </View>
        )}

        {/* Action Buttons for Pending */}
        {selectedTab === 'pending' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleApprove(submission.id, submission.user_id)}
              disabled={actionLoading}
              className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <CheckCircle size={16} color="white" />
              <Text className="text-white font-medium ml-2">Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => {
                setSelectedSubmission(submission);
                setShowRejectModal(true);
              }}
              className="flex-1 bg-red-500 py-3 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.7}
            >
              <XCircle size={16} color="white" />
              <Text className="text-white font-medium ml-2">Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-2">Loading KYC submissions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-gray-900">KYC Management</Text>
        </View>
        
        <View className="flex-row gap-2">
          <Badge variant="secondary">{pendingSubmissions.length} Pending</Badge>
          <Badge variant="default">{verifiedSubmissions.length} Verified</Badge>
          <Badge variant="destructive">{rejectedSubmissions.length} Rejected</Badge>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          {(['pending', 'verified', 'rejected'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab)}
              className={`flex-1 py-3 items-center border-b-2 ${
                selectedTab === tab ? 'border-blue-500 bg-blue-50' : 'border-transparent'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`font-medium capitalize ${
                selectedTab === tab ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {tab} ({
                  tab === 'pending' ? pendingSubmissions.length :
                  tab === 'verified' ? verifiedSubmissions.length :
                  rejectedSubmissions.length
                })
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {getFilteredSubmissions().map(renderSubmissionCard)}
        
        {getFilteredSubmissions().length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 text-center">
              No {selectedTab} submissions found
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">Reject KYC Submission</Text>
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                className="p-2 rounded-full bg-gray-100"
                activeOpacity={0.7}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-gray-600 mb-4">
              Please provide a reason for rejecting this submission.
            </Text>
            
            <Text className="text-sm font-medium text-gray-700 mb-2">Rejection Reason</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Explain why this submission is being rejected..."
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-lg p-3 text-sm mb-4 min-h-[100px]"
              textAlignVertical="top"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg items-center"
                activeOpacity={0.7}
              >
                <Text className="text-gray-800 font-medium">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className={`flex-1 py-3 rounded-lg items-center ${
                  actionLoading || !rejectionReason.trim() 
                    ? 'bg-gray-300' 
                    : 'bg-red-500'
                }`}
                activeOpacity={0.7}
              >
                <Text className="text-white font-medium">
                  {actionLoading ? "Rejecting..." : "Reject Submission"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default KYCAdminPanel;
