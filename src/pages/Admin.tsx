import { useState, useEffect, ReactNode } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, FlatList } from 'react-native';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AdminConfiguration from './AdminConfiguration';

// Enhanced toast implementation
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      Alert.alert(title, description || '', [
        { text: 'OK', style: variant === 'destructive' ? 'destructive' : 'default' }
      ]);
    }
  };
};

// Enhanced Card Components
interface CardProps {
  children: ReactNode;
  style?: any;
}

const Card = ({ children, style }: CardProps) => (
  <View style={[{
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  }, style]}>
    {children}
  </View>
);

// Enhanced Button component
interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'destructive' | 'secondary';
  size?: 'sm' | 'default';
  style?: any;
}

const Button = ({ children, onPress, disabled, variant = 'default', size = 'default', style }: ButtonProps) => {
  const baseStyle = {
    borderRadius: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    opacity: disabled ? 0.5 : 1,
  };

  const variantStyles = {
    default: { backgroundColor: '#007AFF' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
    destructive: { backgroundColor: '#FF3B30' },
    secondary: { backgroundColor: '#8E8E93' },
  };

  const sizeStyles = {
    default: { paddingHorizontal: 16, paddingVertical: 12 },
    sm: { paddingHorizontal: 12, paddingVertical: 8 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[baseStyle, variantStyles[variant], sizeStyles[size], style]}
    >
      {children}
    </TouchableOpacity>
  );
};

// Enhanced Input component
interface InputProps {
  value: string | number;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  secureTextEntry?: boolean;
  style?: any;
}

const Input = ({ value, onChangeText, ...props }: InputProps) => (
  <TextInput
    style={[{
      width: '100%',
      padding: 12,
      borderWidth: 1,
      borderColor: '#E5E5EA',
      borderRadius: 8,
      backgroundColor: '#fff',
      color: '#000',
      fontSize: 16,
    }, props.style]}
    value={String(value)}
    onChangeText={onChangeText}
    {...props}
  />
);

// Enhanced Badge component
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: any;
}

const Badge = ({ children, variant = 'default', style }: BadgeProps) => {
  const baseStyle = {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
  };

  const variantStyles = {
    default: { backgroundColor: '#007AFF' },
    secondary: { backgroundColor: '#8E8E93' },
    destructive: { backgroundColor: '#FF3B30' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
  };

  const textStyles = {
    default: { color: '#fff' },
    secondary: { color: '#fff' },
    destructive: { color: '#fff' },
    outline: { color: '#007AFF' },
  };

  return (
    <View style={[baseStyle, variantStyles[variant], style]}>
      <Text style={[{ fontSize: 12, fontWeight: '600' }, textStyles[variant]]}>
        {children}
      </Text>
    </View>
  );
};

interface Survey {
  id: string;
  title: string;
  description: string | null;
  typeform_id: string | null;
  reward_points: number | null;
  reward_amount: number | null;
  status: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  reward_points: number | null;
  reward_amount: number | null;
  status: string | null;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  kyc_status: string | null;
  total_earnings: number | null;
  created_at: string;
}

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

interface ReportData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalTasks: number;
  completedTasks: number;
  totalSurveys: number;
  completedSurveys: number;
  totalPointsAwarded: number;
  totalEarningsAwarded: number;
  topUsersByPoints: Array<{
    name: string;
    points: number;
    earnings: number;
  }>;
  kycStats: {
    pending: number;
    verified: number;
    rejected: number;
    not_started: number;
  };
  recentTransactions: Array<{
    user_name: string;
    type: string;
    amount: number;
    points: number;
    created_at: string;
  }>;
  earningsBreakdown: {
    totalTransactions: number;
    positiveTransactions: number;
    negativeTransactions: number;
    zeroTransactions: number;
    transactionTypes: Array<{
      type: string;
      count: number;
      totalPoints: number;
      avgPoints: number;
    }>;
    topTransactions: Array<{
      id: string;
      user_name: string;
      type: string;
      points: number;
      amount: number;
      created_at: string;
    }>;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kycSubmissions, setKycSubmissions] = useState<KYCSubmission[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');

  // Survey form state
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    description: '',
    typeform_id: '',
    reward_points: 0,
    reward_amount: 0
  });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    reward_points: 0,
    reward_amount: 0
  });

  // KYC form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedKYCSubmission, setSelectedKYCSubmission] = useState<KYCSubmission | null>(null);

  useEffect(() => {
    checkAdminRole();
    fetchSurveys();
    fetchTasks();
    fetchUsers();
    fetchKYCSubmissions();
    fetchReportData();
  }, [user]);

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchSurveys = async () => {
    try {
      const { data } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setSurveys(data);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchKYCSubmissions = async () => {
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

      setKycSubmissions(submissionsWithData as any);
    } catch (error: any) {
      console.error('KYC fetch error:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        usersData,
        tasksData,
        surveysData,
        userTasksData,
        userSurveysData,
        earningsData
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('surveys').select('*'),
        supabase.from('user_tasks').select('*'),
        supabase.from('user_surveys').select('*'),
        supabase.from('earnings_transactions').select('*')
      ]);

      const totalUsers = usersData.data?.length || 0;
      const newUsersThisMonth = usersData.data?.filter(u => {
        try {
          return u.created_at && new Date(u.created_at) >= firstDayOfMonth;
        } catch (error) {
          return false;
        }
      }).length || 0;

      const totalTasks = tasksData.data?.length || 0;
      const completedTasks = userTasksData.data?.filter(ut => ut.status === 'completed').length || 0;

      const totalSurveys = surveysData.data?.length || 0;
      const completedSurveys = userSurveysData.data?.filter(us => us.status === 'completed').length || 0;

      const totalPointsAwarded = earningsData.data?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      const totalEarningsAwarded = earningsData.data?.reduce((sum, t) => sum + parseFloat(String(t.amount) || '0'), 0) || 0;

      // Detailed earnings breakdown
      const earningsTransactions = earningsData.data || [];
      const totalTransactions = earningsTransactions.length;
      const positiveTransactions = earningsTransactions.filter(t => (t.points || 0) > 0).length;
      const negativeTransactions = earningsTransactions.filter(t => (t.points || 0) < 0).length;
      const zeroTransactions = earningsTransactions.filter(t => (t.points || 0) === 0).length;

      // Group by transaction type
      const transactionTypeMap = new Map<string, { count: number; totalPoints: number }>();
      earningsTransactions.forEach(t => {
        const type = t.transaction_type || 'unknown';
        const points = t.points || 0;
        const existing = transactionTypeMap.get(type) || { count: 0, totalPoints: 0 };
        transactionTypeMap.set(type, {
          count: existing.count + 1,
          totalPoints: existing.totalPoints + points
        });
      });

      const transactionTypes = Array.from(transactionTypeMap.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        totalPoints: data.totalPoints,
        avgPoints: data.count > 0 ? data.totalPoints / data.count : 0
      })).sort((a, b) => b.totalPoints - a.totalPoints);

      // Top transactions by points (both positive and negative)
      const topTransactions = earningsTransactions
        .sort((a, b) => Math.abs(b.points || 0) - Math.abs(a.points || 0))
        .slice(0, 10)
        .map(t => {
          const user = usersData.data?.find(u => u.user_id === t.user_id);
          return {
            id: t.id,
            user_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
            type: t.transaction_type,
            points: t.points || 0,
            amount: parseFloat(String(t.amount || '0')),
            created_at: t.created_at
          };
        });

      // Date range
      const dates = earningsTransactions.map(t => new Date(t.created_at)).filter(d => !isNaN(d.getTime()));
      const dateRange = {
        earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString() : '',
        latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString() : ''
      };

      const userEarnings = (usersData.data || []).map(user => ({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        points: earningsData.data?.filter(t => t.user_id === user.user_id).reduce((sum, t) => sum + (t.points || 0), 0) || 0,
        earnings: parseFloat(String(user.total_earnings || '0'))
      })).sort((a, b) => b.earnings - a.earnings).slice(0, 3);

      const kycStats = {
        pending: usersData.data?.filter(u => u.kyc_status === 'pending').length || 0,
        verified: usersData.data?.filter(u => u.kyc_status === 'verified').length || 0,
        rejected: usersData.data?.filter(u => u.kyc_status === 'rejected').length || 0,
        not_started: usersData.data?.filter(u => !u.kyc_status || u.kyc_status === null).length || 0
      };

      const recentTransactions = (earningsData.data || [])
        .sort((a, b) => {
          try {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
          } catch (error) {
            return 0;
          }
        })
        .slice(0, 10)
        .map(t => {
          const user = usersData.data?.find(u => u.user_id === t.user_id);
          return {
            user_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Unknown User',
            type: t.transaction_type,
            amount: parseFloat(String(t.amount || '0')),
            points: t.points || 0,
            created_at: t.created_at
          };
        });

      setReportData({
        totalUsers,
        activeUsers: totalUsers,
        newUsersThisMonth,
        totalTasks,
        completedTasks,
        totalSurveys,
        completedSurveys,
        totalPointsAwarded,
        totalEarningsAwarded,
        topUsersByPoints: userEarnings,
        kycStats,
        recentTransactions,
        earningsBreakdown: {
          totalTransactions,
          positiveTransactions,
          negativeTransactions,
          zeroTransactions,
          transactionTypes,
          topTransactions,
          dateRange
        }
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `User role updated to ${newRole}`
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const createSurvey = async () => {
    try {
      const { error } = await supabase
        .from('surveys')
        .insert([surveyForm]);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Survey created successfully"
        });
        setSurveyForm({
          title: '',
          description: '',
          typeform_id: '',
          reward_points: 0,
          reward_amount: 0
        });
        fetchSurveys();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create survey",
        variant: "destructive"
      });
    }
  };

  const createTask = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([taskForm]);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Task created successfully"
        });
        setTaskForm({
          title: '',
          description: '',
          reward_points: 0,
          reward_amount: 0
        });
        fetchTasks();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };



  const approveKYC = async (submissionId: string) => {
    try {
      const submission = kycSubmissions.find(s => s.id === submissionId);
      if (!submission) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', submission.user_id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "KYC approved successfully"
        });
        fetchKYCSubmissions();
        fetchReportData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive"
      });
    }
  };

  const rejectKYC = async (submissionId: string) => {
    try {
      const submission = kycSubmissions.find(s => s.id === submissionId);
      if (!submission) return;

      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', submission.user_id);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "KYC rejected"
        });
        setRejectionReason('');
        setSelectedKYCSubmission(null);
        fetchKYCSubmissions();
        fetchReportData();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive"
      });
    }
  };

  if (loading || isAdmin === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FF3B30' }}>
          Access Denied. You are not an administrator.
        </Text>
      </View>
    );
  }

  const renderTabButton = (tabName: string, title: string, icon: string) => (
    <TouchableOpacity
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 4,
        backgroundColor: activeTab === tabName ? '#007AFF' : '#E5E5EA',
        alignItems: 'center',
      }}
      onPress={() => setActiveTab(tabName)}
    >
      <Icon 
        name={icon} 
        size={16} 
        color={activeTab === tabName ? '#fff' : '#666'} 
      />
      <Text style={{
        fontSize: 12,
        fontWeight: '600',
        color: activeTab === tabName ? '#fff' : '#666',
        marginTop: 4,
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={{ padding: 16 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
            Admin Dashboard
          </Text>
          <Text style={{ fontSize: 16, color: '#666' }}>
            Manage surveys, tasks, and user rewards
          </Text>
        </View>

        {/* Tab Navigation */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#fff', 
          borderRadius: 12, 
          padding: 4, 
          marginBottom: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          {renderTabButton('reports', 'Reports', 'bar-chart')}
          {renderTabButton('surveys', 'Surveys', 'document-text')}
          {renderTabButton('tasks', 'Tasks', 'trophy')}
          {renderTabButton('kyc', 'KYC', 'shield')}
          {renderTabButton('users', 'Users', 'people')}
          {/* {renderTabButton('config', 'Config', 'settings')} */}
        </View>

        {/* Reports Tab */}
        {activeTab === 'reports' && reportData && (
          <View>
            {/* Overview Stats */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
              <Card style={{ width: '48%', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Icon name="people" size={24} color="#007AFF" />
                  <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {reportData.totalUsers}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                    Total Users
                  </Text>
                  <Text style={{ fontSize: 10, color: '#007AFF' }}>
                    +{reportData.newUsersThisMonth} this month
                  </Text>
                </View>
              </Card>

              <Card style={{ width: '48%', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Icon name="trophy" size={24} color="#007AFF" />
                  <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {reportData.totalTasks}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                    Total Tasks
                  </Text>
                  <Text style={{ fontSize: 10, color: '#007AFF' }}>
                    {reportData.completedTasks} completed
                  </Text>
                </View>
              </Card>

              <Card style={{ width: '48%', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Icon name="document-text" size={24} color="#007AFF" />
                  <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {reportData.totalSurveys}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                    Total Surveys
                  </Text>
                  <Text style={{ fontSize: 10, color: '#007AFF' }}>
                    {reportData.completedSurveys} completed
                  </Text>
                </View>
              </Card>

              <Card style={{ width: '48%', marginBottom: 16 }}>
                <View style={{ alignItems: 'center' }}>
                  <Icon name="star" size={24} color="#007AFF" />
                  <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                    {reportData.totalPointsAwarded || 0}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                    Total Points
                  </Text>
                  <Text style={{ fontSize: 10, color: '#007AFF' }}>
                    {reportData.totalPointsAwarded} points awarded
                  </Text>
                </View>
              </Card>
            </View>

            {/* KYC Statistics */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                KYC Statistics
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#34C759', marginRight: 8 }} />
                    <Text>Verified</Text>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{reportData.kycStats.verified}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF9500', marginRight: 8 }} />
                    <Text>Pending</Text>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{reportData.kycStats.pending}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30', marginRight: 8 }} />
                    <Text>Rejected</Text>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{reportData.kycStats.rejected}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#8E8E93', marginRight: 8 }} />
                    <Text>Not Started</Text>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{reportData.kycStats.not_started}</Text>
                </View>
              </View>
            </Card>

            {/* Top Users */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Top Users by Earnings
              </Text>
              {reportData.topUsersByPoints.map((user, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < reportData.topUsersByPoints.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E5EA',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: 12, 
                      backgroundColor: '#007AFF', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                        #{index + 1}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: '600' }}>{user.name}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>{user.points} points</Text>
                    </View>
                  </View>
                  <Text style={{ fontWeight: 'bold' }}>{user.points} pts</Text>
                </View>
              ))}
            </Card>

            {/* Earnings Breakdown */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Earnings Transaction Analysis
              </Text>
              
              {/* Summary Stats */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ width: '48%', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Total Transactions</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{reportData.earningsBreakdown.totalTransactions.toLocaleString()}</Text>
                </View>
                <View style={{ width: '48%', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Positive Transactions</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#34C759' }}>{reportData.earningsBreakdown.positiveTransactions.toLocaleString()}</Text>
                </View>
                <View style={{ width: '48%', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Negative Transactions</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#FF3B30' }}>{reportData.earningsBreakdown.negativeTransactions.toLocaleString()}</Text>
                </View>
                <View style={{ width: '48%', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Zero Transactions</Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#8E8E93' }}>{reportData.earningsBreakdown.zeroTransactions.toLocaleString()}</Text>
                </View>
              </View>

              {/* Date Range */}
              <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Transaction Date Range</Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  From: {reportData.earningsBreakdown.dateRange.earliest ? new Date(reportData.earningsBreakdown.dateRange.earliest).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={{ fontSize: 12, color: '#666' }}>
                  To: {reportData.earningsBreakdown.dateRange.latest ? new Date(reportData.earningsBreakdown.dateRange.latest).toLocaleDateString() : 'N/A'}
                </Text>
              </View>

              {/* Transaction Types */}
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Transaction Types Breakdown</Text>
              {reportData.earningsBreakdown.transactionTypes.map((type, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < reportData.earningsBreakdown.transactionTypes.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E5EA',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{type.type}</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{type.count.toLocaleString()} transactions</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: 'bold', color: type.totalPoints >= 0 ? '#34C759' : '#FF3B30' }}>
                      {type.totalPoints.toLocaleString()} pts
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      Avg: {type.avgPoints.toFixed(1)} pts
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Top Transactions */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Top Transactions by Points (Absolute Value)
              </Text>
              {reportData.earningsBreakdown.topTransactions.map((transaction, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < reportData.earningsBreakdown.topTransactions.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E5EA',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{transaction.user_name}</Text>
                    <Badge variant="secondary" style={{ marginTop: 4 }}>
                      {transaction.type}
                    </Badge>
                    <Text style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ 
                      fontWeight: 'bold', 
                      color: transaction.points >= 0 ? '#34C759' : '#FF3B30',
                      fontSize: 16
                    }}>
                      {transaction.points.toLocaleString()} pts
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      ${transaction.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Recent Transactions */}
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Recent Transactions
              </Text>
              {reportData.recentTransactions.map((transaction, index) => (
                <View key={index} style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingVertical: 8,
                  borderBottomWidth: index < reportData.recentTransactions.length - 1 ? 1 : 0,
                  borderBottomColor: '#E5E5EA',
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600' }}>{transaction.user_name}</Text>
                    <Badge variant="secondary" style={{ marginTop: 4 }}>
                      {transaction.type}
                    </Badge>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: 'bold' }}>{transaction.points} pts</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>{transaction.type}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Surveys Tab */}
        {activeTab === 'surveys' && (
          <View>
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Add New Survey
              </Text>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Survey Title</Text>
                  <Input
                    value={surveyForm.title}
                    onChangeText={(text) => setSurveyForm({...surveyForm, title: text})}
                    placeholder="Enter survey title"
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Description</Text>
                  <Input
                    value={surveyForm.description}
                    onChangeText={(text) => setSurveyForm({...surveyForm, description: text})}
                    placeholder="Enter survey description"
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Typeform ID</Text>
                  <Input
                    value={surveyForm.typeform_id}
                    onChangeText={(text) => setSurveyForm({...surveyForm, typeform_id: text})}
                    placeholder="Enter Typeform ID"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Reward Points</Text>
                    <Input
                      keyboardType="numeric"
                      value={surveyForm.reward_points}
                      onChangeText={(text) => setSurveyForm({...surveyForm, reward_points: parseInt(text) || 0})}
                      placeholder="0"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Reward Amount (pts)</Text>
                    <Input
                      keyboardType="decimal-pad"
                      value={surveyForm.reward_amount}
                      onChangeText={(text) => setSurveyForm({...surveyForm, reward_amount: parseFloat(text) || 0})}
                      placeholder="0.00"
                    />
                  </View>
                </View>
                <Button onPress={createSurvey} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Survey</Text>
                </Button>
              </View>
            </Card>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Existing Surveys
            </Text>
            {(surveys || []).map((survey) => (
              <Card key={survey.id}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                  {survey.title || 'Untitled Survey'}
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {survey.description}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>Points: {survey.reward_points || 0}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Amount: {(survey.reward_amount || 0).toFixed(0)} pts</Text>
                  <Badge variant="outline">
                    {survey.status || 'unknown'}
                  </Badge>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <View>
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                Add New Task
              </Text>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Task Title</Text>
                  <Input
                    value={taskForm.title}
                    onChangeText={(text) => setTaskForm({...taskForm, title: text})}
                    placeholder="Enter task title"
                  />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Description</Text>
                  <Input
                    value={taskForm.description}
                    onChangeText={(text) => setTaskForm({...taskForm, description: text})}
                    placeholder="Enter task description"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Reward Points</Text>
                    <Input
                      keyboardType="numeric"
                      value={taskForm.reward_points}
                      onChangeText={(text) => setTaskForm({...taskForm, reward_points: parseInt(text) || 0})}
                      placeholder="0"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Reward Amount (pts)</Text>
                    <Input
                      keyboardType="decimal-pad"
                      value={taskForm.reward_amount}
                      onChangeText={(text) => setTaskForm({...taskForm, reward_amount: parseFloat(text) || 0})}
                      placeholder="0.00"
                    />
                  </View>
                </View>
                <Button onPress={createTask} style={{ marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Task</Text>
                </Button>
              </View>
            </Card>

            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              Existing Tasks
            </Text>
            {(tasks || []).map((task) => (
              <Card key={task.id}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                  {task.title || 'Untitled Task'}
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {task.description}
                </Text>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={{ fontSize: 12, color: '#666' }}>Points: {task.reward_points || 0}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>Amount: {(task.reward_amount || 0).toFixed(0)} pts</Text>
                  <Badge variant="outline">
                    {task.status || 'unknown'}
                  </Badge>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* KYC Tab */}
        {activeTab === 'kyc' && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
              KYC Submissions
            </Text>
            {(kycSubmissions || []).map((submission) => (
              <Card key={submission.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                      {submission.first_name} {submission.last_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      {submission.phone_number}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                      {submission.phone_number}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {submission.address}, {submission.city}, {submission.country}
                    </Text>
                  </View>
                  <Badge 
                    variant={
                      submission.profiles.kyc_status === 'verified' ? 'default' :
                      submission.profiles.kyc_status === 'pending' ? 'secondary' :
                      submission.profiles.kyc_status === 'rejected' ? 'destructive' : 'outline'
                    }
                  >
                    {submission.profiles.kyc_status || 'pending'}
                  </Badge>
                </View>
                
                {submission.profiles.kyc_status === 'pending' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onPress={() => approveKYC(submission.id)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Approve</Text>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onPress={() => rejectKYC(submission.id)}
                      style={{ flex: 1 }}
                    >
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Reject</Text>
                    </Button>
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <View>
            <Card>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
                User Management
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                Total Users: {users.length}
              </Text>
              
              {(users || []).map((user) => (
                <View key={user.id} style={{ 
                  borderBottomWidth: 1, 
                  borderBottomColor: '#E5E5EA', 
                  paddingVertical: 12,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                        {user.first_name || user.last_name 
                          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                          : 'No name set'
                        }
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        {user.user_id || 'No ID'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge 
                          variant={
                            user.kyc_status === 'verified' ? 'default' :
                            user.kyc_status === 'pending' ? 'secondary' :
                            user.kyc_status === 'rejected' ? 'destructive' : 'outline'
                          }
                        >
                          {user.kyc_status || 'not_started'}
                        </Badge>
                      </View>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Points: {(user.total_earnings || 0).toFixed(0)} pts
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => {
                            try {
                              if (user.user_id) {
                                updateUserRole(user.user_id, 'admin');
                              }
                            } catch (error) {
                              console.error('Error updating user role:', error);
                            }
                          }}
                        >
                          <Text style={{ color: '#007AFF', fontSize: 12, fontWeight: '600' }}>Make Admin</Text>
                        </Button>
                      )}
                      {user.role === 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => {
                            try {
                              if (user.user_id) {
                                updateUserRole(user.user_id, 'user');
                              }
                            } catch (error) {
                              console.error('Error updating user role:', error);
                            }
                          }}
                        >
                          <Text style={{ color: '#007AFF', fontSize: 12, fontWeight: '600' }}>Remove Admin</Text>
                        </Button>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <AdminConfiguration />
        )}
      </View>
    </ScrollView>
  );
}
