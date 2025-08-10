import { useState, useEffect, ReactNode } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { supabase } from '@/integrations/supabase/client'; // Assuming this path is correct
import { useAuth } from '@/contexts/AuthContext'; // Assuming this path is correct
import { styled } from 'nativewind'; // For applying Tailwind classes
import {
  Plus, ExternalLink, Users, Award, FileText, Shield, UserCheck, UserX,
  BarChart3, TrendingUp, Clock, DollarSign
} from 'lucide-react-native'; // Assuming lucide-react-native is installed

// Placeholder for custom components. In a real app, you'd build these robustly.

// Styled components using Nativewind
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledTextInput = styled(TextInput);

// Mock `useToast` for React Native. Use a dedicated library like `react-native-toast-message`
// or `react-native-popup-menu` in a real application.
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description?: string; variant?: 'default' | 'destructive' }) => {
      Alert.alert(title, description);
    }
  };
};

// Simplified Card Components (reusing logic from Activity.tsx conversion)
interface CardProps {
  children: ReactNode;
  className?: string;
}

const Card = styled(({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
));

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}
const CardHeader = styled(({ children, className }: CardHeaderProps) => (
  <StyledView className={`p-4 pb-0 ${className}`}>
    {children}
  </StyledView>
));

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}
const CardTitle = styled(({ children, className }: CardTitleProps) => (
  <StyledText className={`text-lg font-semibold ${className}`}>
    {children}
  </StyledText>
));

interface CardContentProps {
  children: ReactNode;
  className?: string;
}
const CardContent = styled(({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 pt-3 ${className}`}>
    {children}
  </StyledView>
));

interface ButtonProps {
  children: ReactNode;
  onPress: () => void; // Changed onClick to onPress for React Native
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'destructive';
  size?: 'sm' | 'default';
  className?: string;
}
const Button = styled(({ children, onPress, disabled, variant = 'default', size = 'default', className }: ButtonProps) => {
  const baseClasses = `rounded-lg flex-row items-center justify-center ${disabled ? 'opacity-50' : ''}`;
  const variantClasses = {
    default: 'bg-blue-500',
    outline: 'border border-gray-300 bg-white',
    destructive: 'bg-red-500',
  };
  const sizeClasses = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-sm',
  };

  return (
    <StyledTouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </StyledTouchableOpacity>
  );
});

interface InputProps {
  id?: string;
  value: string | number;
  onChangeText: (text: string) => void; // Changed onChange to onChangeText
  placeholder?: string;
  keyboardType?: TextInput['props']['keyboardType'];
  secureTextEntry?: boolean;
  required?: boolean;
  step?: string; // For number inputs
  className?: string;
}
const Input = styled(({ value, onChangeText, ...props }: InputProps) => (
  <StyledTextInput
    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800"
    value={String(value)} // Ensure value is a string for TextInput
    onChangeText={onChangeText}
    {...props}
  />
));

interface LabelProps {
  htmlFor?: string; // Not used in RN directly for association, but good for context
  children: ReactNode;
  className?: string;
}
const Label = styled(({ children, className }: LabelProps) => (
  <StyledText className={`text-sm font-medium text-gray-700 mb-1 ${className}`}>
    {children}
  </StyledText>
));

interface TextareaProps {
  id?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}
const Textarea = styled(({ value, onChangeText, ...props }: TextareaProps) => (
  <StyledTextInput
    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 h-24"
    multiline
    numberOfLines={4}
    value={value}
    onChangeText={onChangeText}
    textAlignVertical="top" // Ensures text starts from the top
    {...props}
  />
));

// Simplified Tabs Components
interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
const TabsContext = useState<TabsContextType | undefined>(undefined);

const Tabs = styled(({ defaultValue, children, className }: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <StyledView className={className}>
        {children}
      </StyledView>
    </TabsContext.Provider>
  );
});

interface TabsListProps {
  children: ReactNode;
  className?: string;
}
const TabsList = styled(({ children, className }: TabsListProps) => (
  <StyledView className={`flex-row justify-around p-1 bg-gray-200 rounded-lg ${className}`}>
    {children}
  </StyledView>
));

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}
const TabsTrigger = styled(({ value, children, className }: TabsTriggerProps) => {
  const [context] = TabsContext;
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  const { activeTab, setActiveTab } = context;

  const isActive = activeTab === value;
  return (
    <StyledTouchableOpacity
      onPress={() => setActiveTab(value)}
      className={`flex-1 flex-row items-center justify-center p-2 rounded-md ${isActive ? 'bg-white shadow-sm' : 'bg-transparent'} ${className}`}
    >
      {children}
    </StyledTouchableOpacity>
  );
});

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}
const TabsContent = styled(({ value, children, className }: TabsContentProps) => {
  const [context] = TabsContext;
  if (!context) throw new Error("TabsContent must be used within Tabs");
  const { activeTab } = context;

  if (activeTab !== value) return null;
  return <StyledView className={className}>{children}</StyledView>;
});

// Simplified Table Components using Views and Texts
interface TableProps {
  children: ReactNode;
  className?: string;
}
const Table = styled(({ children, className }: TableProps) => (
  <StyledView className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
    {children}
  </StyledView>
));

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}
const TableHeader = styled(({ children, className }: TableHeaderProps) => (
  <StyledView className={`bg-gray-50 border-b border-gray-200 ${className}`}>
    <StyledView className="flex-row items-center p-3"> {/* For row structure */}
      {children}
    </StyledView>
  </StyledView>
));

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}
const TableHead = styled(({ children, className }: TableHeadProps) => (
  <StyledText className={`flex-1 text-xs font-semibold uppercase text-gray-500 ${className}`}>
    {children}
  </StyledText>
));

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}
const TableBody = styled(({ children, className }: TableBodyProps) => (
  <StyledView className={className}>
    {children}
  </StyledView>
));

interface TableRowProps {
  children: ReactNode;
  className?: string;
}
const TableRow = styled(({ children, className }: TableRowProps) => (
  <StyledView className={`flex-row items-center border-b border-gray-100 last:border-b-0 p-3 ${className}`}>
    {children}
  </StyledView>
));

interface TableCellProps {
  children: ReactNode;
  className?: string;
}
const TableCell = styled(({ children, className }: TableCellProps) => (
  <StyledView className={`flex-1 ${className}`}>
    <StyledText className="text-sm text-gray-800">{children}</StyledText>
  </StyledView>
));


// Reusing Badge from Activity.tsx conversion
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}
const Badge = styled(({ children, variant = 'default', className }: BadgeProps) => {
  const baseClasses = `px-3 py-1 rounded-full text-xs font-semibold flex items-center justify-center`;
  const variantClasses = {
    default: 'bg-blue-500',
    secondary: 'bg-gray-200',
    destructive: 'bg-red-500',
    outline: 'border border-gray-300 bg-white',
  };
  const textClasses = {
    default: 'text-white',
    secondary: 'text-gray-700',
    destructive: 'text-white',
    outline: 'text-gray-700',
  };

  return (
    <StyledView className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <StyledText className={`${textClasses[variant]}`}>{children}</StyledText>
    </StyledView>
  );
});

// Assuming KYCAdminPanel is a separate component that also needs conversion
// For now, it's just imported as-is.
interface KYCAdminPanelProps {
  // Define props if any
}
const KYCAdminPanel = (props: KYCAdminPanelProps) => {
  // This would be your React Native KYCAdminPanel component
  return (
    <StyledView className="p-4 bg-white rounded-lg shadow-md">
      <StyledText className="text-lg font-semibold">KYC Admin Panel Placeholder</StyledText>
      <StyledText className="text-sm text-gray-600 mt-2">
        Integrate your React Native KYC component here.
      </StyledText>
    </StyledView>
  );
};


interface Survey {
  id: string;
  title: string;
  description: string;
  typeform_id: string;
  reward_points: number;
  reward_amount: number;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  reward_amount: number;
  status: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  kyc_status: string;
  total_earnings: number;
  created_at: string;
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
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // Functions are called here
    checkAdminRole();
    fetchSurveys();
    fetchTasks();
    fetchUsers();
    fetchReportData();

    // Listen for real-time updates to refresh data
    const channel = supabase
      .channel('admin-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'kyc_status=neq.null'
        },
        () => {
          fetchUsers();
          fetchReportData();
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
          fetchReportData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Depend on `user` for initial data fetch and role check

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    setIsAdmin(profile?.role === 'admin');
    setLoading(false);
  };

  const fetchSurveys = async () => {
    const { data } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSurveys(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTasks(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
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
  };

  const fetchReportData = async () => {
    try {
      // Get current date and first day of month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all necessary data in parallel
      const [
        usersData,
        tasksData,
        surveysData,
        userTasksData,
        userSurveysData,
        earningsData,
        kycData
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('surveys').select('*'),
        supabase.from('user_tasks').select('*'),
        supabase.from('user_surveys').select('*'),
        supabase.from('earnings_transactions').select('*'),
        supabase.from('kyc_submissions').select('*')
      ]);

      // Calculate metrics
      const totalUsers = usersData.data?.length || 0;
      const newUsersThisMonth = usersData.data?.filter(u => 
        new Date(u.created_at) >= firstDayOfMonth
      ).length || 0;

      const totalTasks = tasksData.data?.length || 0;
      const completedTasks = userTasksData.data?.filter(ut => ut.status === 'completed').length || 0;

      const totalSurveys = surveysData.data?.length || 0;
      const completedSurveys = userSurveysData.data?.filter(us => us.status === 'completed').length || 0;

      const totalPointsAwarded = earningsData.data?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      const totalEarningsAwarded = earningsData.data?.reduce((sum, t) => sum + parseFloat(String(t.amount) || '0'), 0) || 0;
      
      // Alternative calculation from user profiles
      const totalEarningsFromProfiles = usersData.data?.reduce((sum, u) => sum + parseFloat(String(u.total_earnings) || '0'), 0) || 0;
      
      console.log('Earnings Debug:', {
        fromTransactions: totalEarningsAwarded,
        fromProfiles: totalEarningsFromProfiles,
        transactionsData: earningsData.data,
        profilesData: usersData.data?.map(u => ({ name: `${u.first_name} ${u.last_name}`, earnings: u.total_earnings }))
      });

      // Top users by earnings
      const userEarnings = (usersData.data || []).map(user => ({
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
        points: earningsData.data?.filter(t => t.user_id === user.user_id).reduce((sum, t) => sum + (t.points || 0), 0) || 0,
        earnings: parseFloat(String(user.total_earnings || '0'))
      })).sort((a, b) => b.earnings - a.earnings).slice(0, 3);

      // KYC stats - use profiles table for consistency
      const kycStats = {
        pending: usersData.data?.filter(u => u.kyc_status === 'pending').length || 0,
        verified: usersData.data?.filter(u => u.kyc_status === 'verified').length || 0,
        rejected: usersData.data?.filter(u => u.kyc_status === 'rejected').length || 0,
        not_started: usersData.data?.filter(u => !u.kyc_status || u.kyc_status === null).length || 0
      };

      console.log('KYC Stats Debug:', {
        totalProfiles: usersData.data?.length,
        profiles: usersData.data?.map(u => ({ name: `${u.first_name} ${u.last_name}`, status: u.kyc_status })),
        kycStats
      });

      // Recent transactions (last 10)
      const recentTransactions = (earningsData.data || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
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
        activeUsers: totalUsers, // For now, consider all users as active
        newUsersThisMonth,
        totalTasks,
        completedTasks,
        totalSurveys,
        completedSurveys,
        totalPointsAwarded,
        totalEarningsAwarded, // Use transactions total (correct value)
        topUsersByPoints: userEarnings,
        kycStats,
        recentTransactions
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  };

  const createSurvey = async () => { // Removed 'e: React.FormEvent'
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
  };

  const createTask = async () => { // Removed 'e: React.FormEvent'
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
  };

  if (loading || isAdmin === null) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">
          Loading...
        </StyledText>
      </StyledView>
    );
  }

  if (!isAdmin) {
    // In React Native, you would typically navigate away using React Navigation
    // For example: navigation.navigate('Home');
    // For this conversion, we'll just show a message.
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <StyledText className="text-xl font-bold text-red-600">
          Access Denied. You are not an administrator.
        </StyledText>
      </StyledView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100 p-6"> {/* Use ScrollView for scrollable content */}
      <StyledView className="max-w-6xl mx-auto space-y-8 pb-8"> {/* Added padding bottom */}
        <StyledView className="text-center">
          <StyledText className="text-2xl font-bold text-gray-900 mb-2"> {/* Removed gradient-text */}
            Admin Dashboard
          </StyledText>
          <StyledText className="text-sm text-gray-500">
            Manage surveys, tasks, and user rewards
          </StyledText>
        </StyledView>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid-cols-5"> {/* Nativewind `grid-cols-5` might work if set up, or adjust flex-row */}
            <TabsTrigger value="reports">
              <BarChart3 className="h-4 w-4 mr-2 text-gray-700" />
              <StyledText className="text-gray-700 text-sm">Reports</StyledText>
            </TabsTrigger>
            <TabsTrigger value="surveys">
              <FileText className="h-4 w-4 mr-2 text-gray-700" />
              <StyledText className="text-gray-700 text-sm">Surveys</StyledText>
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <Award className="h-4 w-4 mr-2 text-gray-700" />
              <StyledText className="text-gray-700 text-sm">Tasks</StyledText>
            </TabsTrigger>
            <TabsTrigger value="kyc">
              <Shield className="h-4 w-4 mr-2 text-gray-700" />
              <StyledText className="text-gray-700 text-sm">KYC</StyledText>
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2 text-gray-700" />
              <StyledText className="text-gray-700 text-sm">Users</StyledText>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {reportData ? (
              <>
                {/* Overview Stats */}
                <StyledView className="flex-col md:flex-row gap-6"> {/* Simplified grid to flex-col */}
                  <Card className="flex-1"> {/* Removed glass-card */}
                    <CardContent className="p-6">
                      <StyledView className="flex-row items-center justify-between">
                        <StyledView>
                          <StyledText className="text-sm font-medium text-gray-500">Total Users</StyledText>
                          <StyledText className="text-3xl font-bold text-gray-900">{reportData.totalUsers}</StyledText>
                        </StyledView>
                        <Users className="h-8 w-8 text-blue-500" />
                      </StyledView>
                      <StyledText className="text-xs text-gray-500 mt-2">
                        +{reportData.newUsersThisMonth} this month
                      </StyledText>
                    </CardContent>
                  </Card>

                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <StyledView className="flex-row items-center justify-between">
                        <StyledView>
                          <StyledText className="text-sm font-medium text-gray-500">Total Tasks</StyledText>
                          <StyledText className="text-3xl font-bold text-gray-900">{reportData.totalTasks}</StyledText>
                        </StyledView>
                        <Award className="h-8 w-8 text-blue-500" />
                      </StyledView>
                      <StyledText className="text-xs text-gray-500 mt-2">
                        {reportData.completedTasks} completed
                      </StyledText>
                    </CardContent>
                  </Card>

                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <StyledView className="flex-row items-center justify-between">
                        <StyledView>
                          <StyledText className="text-sm font-medium text-gray-500">Total Surveys</StyledText>
                          <StyledText className="text-3xl font-bold text-gray-900">{reportData.totalSurveys}</StyledText>
                        </StyledView>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </StyledView>
                      <StyledText className="text-xs text-gray-500 mt-2">
                        {reportData.completedSurveys} completed
                      </StyledText>
                    </CardContent>
                  </Card>

                  <Card className="flex-1">
                    <CardContent className="p-6">
                      <StyledView className="flex-row items-center justify-between">
                        <StyledView>
                          <StyledText className="text-sm font-medium text-gray-500">Total Earnings</StyledText>
                          <StyledText className="text-3xl font-bold text-gray-900">${reportData.totalEarningsAwarded.toFixed(2)}</StyledText>
                        </StyledView>
                        <DollarSign className="h-8 w-8 text-blue-500" />
                      </StyledView>
                      <StyledText className="text-xs text-gray-500 mt-2">
                        {reportData.totalPointsAwarded} points awarded
                      </StyledText>
                    </CardContent>
                  </Card>
                </StyledView>

                {/* Detailed Analytics */}
                <StyledView className="flex-col lg:flex-row gap-6">
                  {/* Top Users */}
                  <Card className="flex-1"> {/* Removed glass-card */}
                    <CardHeader>
                      <CardTitle className="flex-row items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-gray-700" />
                        <StyledText>Top Users by Earnings</StyledText>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StyledView className="space-y-4">
                        {reportData.topUsersByPoints.map((user, index) => (
                          <StyledView key={index} className="flex-row items-center justify-between p-3 rounded-lg bg-gray-100">
                            <StyledView className="flex-row items-center gap-3">
                              <StyledView className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <StyledText className="text-sm font-bold text-blue-700">#{index + 1}</StyledText>
                              </StyledView>
                              <StyledView>
                                <StyledText className="font-medium text-gray-800">{user.name}</StyledText>
                                <StyledText className="text-sm text-gray-500">{user.points} points</StyledText>
                              </StyledView>
                            </StyledView>
                            <StyledView className="text-right">
                              <StyledText className="font-bold text-gray-800">${user.earnings.toFixed(2)}</StyledText>
                            </StyledView>
                          </StyledView>
                        ))}
                      </StyledView>
                    </CardContent>
                  </Card>

                  {/* KYC Statistics */}
                  <Card className="flex-1"> {/* Removed glass-card */}
                    <CardHeader>
                      <CardTitle className="flex-row items-center gap-2">
                        <Shield className="h-5 w-5 text-gray-700" />
                        <StyledText>KYC Statistics</StyledText>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StyledView className="space-y-4">
                        <StyledView className="flex-row items-center justify-between p-3 rounded-lg bg-green-50">
                          <StyledView className="flex-row items-center gap-3">
                            <StyledView className="w-3 h-3 rounded-full bg-green-500"></StyledView>
                            <StyledText>Verified</StyledText>
                          </StyledView>
                          <StyledText className="font-bold">{reportData.kycStats.verified}</StyledText>
                        </StyledView>
                        <StyledView className="flex-row items-center justify-between p-3 rounded-lg bg-yellow-50">
                          <StyledView className="flex-row items-center gap-3">
                            <StyledView className="w-3 h-3 rounded-full bg-yellow-500"></StyledView>
                            <StyledText>Pending</StyledText>
                          </StyledView>
                          <StyledText className="font-bold">{reportData.kycStats.pending}</StyledText>
                        </StyledView>
                        <StyledView className="flex-row items-center justify-between p-3 rounded-lg bg-red-50">
                          <StyledView className="flex-row items-center gap-3">
                            <StyledView className="w-3 h-3 rounded-full bg-red-500"></StyledView>
                            <StyledText>Rejected</StyledText>
                          </StyledView>
                          <StyledText className="font-bold">{reportData.kycStats.rejected}</StyledText>
                        </StyledView>
                        <StyledView className="flex-row items-center justify-between p-3 rounded-lg bg-gray-50">
                          <StyledView className="flex-row items-center gap-3">
                            <StyledView className="w-3 h-3 rounded-full bg-gray-500"></StyledView>
                            <StyledText>Not Started</StyledText>
                          </StyledView>
                          <StyledText className="font-bold">{reportData.kycStats.not_started}</StyledText>
                        </StyledView>
                      </StyledView>
                    </CardContent>
                  </Card>
                </StyledView>

                {/* Recent Activity */}
                <Card className=""> {/* Removed glass-card */}
                  <CardHeader>
                    <CardTitle className="flex-row items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-700" />
                      <StyledText>Recent Transactions</StyledText>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead><StyledText>User</StyledText></TableHead>
                          <TableHead><StyledText>Type</StyledText></TableHead>
                          <TableHead><StyledText>Amount</StyledText></TableHead>
                          <TableHead><StyledText>Points</StyledText></TableHead>
                          <TableHead><StyledText>Date</StyledText></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.recentTransactions.map((transaction, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <StyledText className="font-medium text-gray-800">{transaction.user_name}</StyledText>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell><StyledText>${transaction.amount.toFixed(2)}</StyledText></TableCell>
                            <TableCell><StyledText>{transaction.points}</StyledText></TableCell>
                            <TableCell>
                              <StyledText>
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </StyledText>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Completion Rates */}
                <StyledView className="flex-col md:flex-row gap-6">
                  <Card className="flex-1"> {/* Removed glass-card */}
                    <CardHeader>
                      <CardTitle><StyledText>Task Completion Rate</StyledText></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StyledView className="space-y-2">
                        <StyledView className="flex-row justify-between text-sm">
                          <StyledText>Completed</StyledText>
                          <StyledText>{reportData.completedTasks}/{reportData.totalTasks}</StyledText>
                        </StyledView>
                        <StyledView className="w-full bg-gray-200 rounded-full h-2"> {/* Removed bg-muted */}
                          <StyledView 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" // Removed bg-primary
                            style={{
                              width: `${reportData.totalTasks > 0 ? (reportData.completedTasks / reportData.totalTasks) * 100 : 0}%`
                            }}
                          ></StyledView>
                        </StyledView>
                        <StyledText className="text-xs text-gray-500"> {/* Removed text-muted-foreground */}
                          {reportData.totalTasks > 0 ? ((reportData.completedTasks / reportData.totalTasks) * 100).toFixed(1) : 0}% completion rate
                        </StyledText>
                      </StyledView>
                    </CardContent>
                  </Card>

                  <Card className="flex-1"> {/* Removed glass-card */}
                    <CardHeader>
                      <CardTitle><StyledText>Survey Completion Rate</StyledText></CardTitle>
                    </CardHeader>
                    <CardContent>
                      <StyledView className="space-y-2">
                        <StyledView className="flex-row justify-between text-sm">
                          <StyledText>Completed</StyledText>
                          <StyledText>{reportData.completedSurveys}/{reportData.totalSurveys}</StyledText>
                        </StyledView>
                        <StyledView className="w-full bg-gray-200 rounded-full h-2"> {/* Removed bg-muted */}
                          <StyledView 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" // Removed bg-primary
                            style={{
                              width: `${reportData.totalSurveys > 0 ? (reportData.completedSurveys / reportData.totalSurveys) * 100 : 0}%`
                            }}
                          ></StyledView>
                        </StyledView>
                        <StyledText className="text-xs text-gray-500"> {/* Removed text-muted-foreground */}
                          {reportData.totalSurveys > 0 ? ((reportData.completedSurveys / reportData.totalSurveys) * 100).toFixed(1) : 0}% completion rate
                        </StyledText>
                      </StyledView>
                    </CardContent>
                  </Card>
                </StyledView>
              </>
            ) : (
              <StyledView className="flex items-center justify-center h-64">
                <ActivityIndicator size="large" color="#0000ff" />
                <StyledText className="text-gray-600 mt-4">Loading reports...</StyledText>
              </StyledView>
            )}
          </TabsContent>

          <TabsContent value="surveys" className="space-y-6">
            {/* Create Survey Form */}
            <Card className=""> {/* Removed glass-card */}
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Plus className="h-5 w-5 text-gray-700" />
                  <StyledText>Add New Survey</StyledText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StyledView className="space-y-4"> {/* Replaced form with StyledView */}
                  <StyledView className="flex-col md:flex-row gap-4"> {/* Simplified grid to flex-col */}
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="survey-title">Survey Title</Label>
                      <Input
                        id="survey-title"
                        value={surveyForm.title}
                        onChangeText={(text) => setSurveyForm({...surveyForm, title: text})}
                        placeholder="Enter survey title"
                        required
                      />
                    </StyledView>
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="typeform-id">Typeform ID</Label>
                      <Input
                        id="typeform-id"
                        value={surveyForm.typeform_id}
                        onChangeText={(text) => setSurveyForm({...surveyForm, typeform_id: text})}
                        placeholder="Enter Typeform ID"
                        required
                      />
                    </StyledView>
                  </StyledView>
                  <StyledView className="space-y-2">
                    <Label htmlFor="survey-description">Description</Label>
                    <Textarea
                      id="survey-description"
                      value={surveyForm.description}
                      onChangeText={(text) => setSurveyForm({...surveyForm, description: text})}
                      placeholder="Enter survey description"
                    />
                  </StyledView>
                  <StyledView className="flex-col md:flex-row gap-4"> {/* Simplified grid to flex-col */}
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="survey-points">Reward Points</Label>
                      <Input
                        id="survey-points"
                        keyboardType="number-pad"
                        value={surveyForm.reward_points}
                        onChangeText={(text) => setSurveyForm({...surveyForm, reward_points: parseInt(text || '0')})}
                        placeholder="0"
                      />
                    </StyledView>
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="survey-amount">Reward Amount ($)</Label>
                      <Input
                        id="survey-amount"
                        keyboardType="decimal-pad"
                        step="0.01" // This prop is not directly supported by RN TextInput for validation. It's for web.
                        value={surveyForm.reward_amount}
                        onChangeText={(text) => setSurveyForm({...surveyForm, reward_amount: parseFloat(text || '0')})}
                        placeholder="0.00"
                      />
                    </StyledView>
                  </StyledView>
                  <Button onPress={createSurvey} className="w-full">
                    <StyledText className="text-white text-base font-semibold">Create Survey</StyledText>
                  </Button>
                </StyledView>
              </CardContent>
            </Card>

            {/* Existing Surveys */}
            <StyledView className="gap-4">
              <StyledText className="text-lg font-semibold text-gray-800">Existing Surveys</StyledText>
              {surveys.map((survey) => (
                <Card key={survey.id} className=""> {/* Removed glass-card */}
                  <CardContent className="p-4">
                    <StyledView className="flex-row justify-between items-start">
                      <StyledView className="space-y-2 flex-1">
                        <StyledText className="font-semibold text-gray-800">{survey.title}</StyledText>
                        <StyledText className="text-sm text-gray-500">{survey.description}</StyledText>
                        <StyledView className="flex-row gap-4 text-sm">
                          <StyledText>Points: {survey.reward_points}</StyledText>
                          <StyledText>Amount: ${survey.reward_amount.toFixed(2)}</StyledText>
                          <StyledText className="capitalize">Status: {survey.status}</StyledText>
                        </StyledView>
                      </StyledView>
                      <Button
                        size="sm"
                        variant="outline"
                        onPress={() => Alert.alert("Open Typeform", `Open survey with ID: ${survey.typeform_id}`)}
                        // For a real app, use Linking.openURL
                        // onPress={() => Linking.openURL(`https://form.typeform.com/to/${survey.typeform_id}`)}
                      >
                        <ExternalLink className="h-4 w-4 text-gray-700" />
                      </Button>
                    </StyledView>
                  </CardContent>
                </Card>
              ))}
            </StyledView>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {/* Create Task Form */}
            <Card className=""> {/* Removed glass-card */}
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Plus className="h-5 w-5 text-gray-700" />
                  <StyledText>Add New Task</StyledText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StyledView className="space-y-4"> {/* Replaced form with StyledView */}
                  <StyledView className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      value={taskForm.title}
                      onChangeText={(text) => setTaskForm({...taskForm, title: text})}
                      placeholder="Enter task title"
                      required
                    />
                  </StyledView>
                  <StyledView className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Textarea
                      id="task-description"
                      value={taskForm.description}
                      onChangeText={(text) => setTaskForm({...taskForm, description: text})}
                      placeholder="Enter task description"
                    />
                  </StyledView>
                  <StyledView className="flex-col md:flex-row gap-4"> {/* Simplified grid to flex-col */}
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="task-points">Reward Points</Label>
                      <Input
                        id="task-points"
                        keyboardType="number-pad"
                        value={taskForm.reward_points}
                        onChangeText={(text) => setTaskForm({...taskForm, reward_points: parseInt(text || '0')})}
                        placeholder="0"
                      />
                    </StyledView>
                    <StyledView className="flex-1 space-y-2">
                      <Label htmlFor="task-amount">Reward Amount ($)</Label>
                      <Input
                        id="task-amount"
                        keyboardType="decimal-pad"
                        step="0.01" // Not directly supported by RN TextInput for validation
                        value={taskForm.reward_amount}
                        onChangeText={(text) => setTaskForm({...taskForm, reward_amount: parseFloat(text || '0')})}
                        placeholder="0.00"
                      />
                    </StyledView>
                  </StyledView>
                  <Button onPress={createTask} className="w-full">
                    <StyledText className="text-white text-base font-semibold">Create Task</StyledText>
                  </Button>
                </StyledView>
              </CardContent>
            </Card>

            {/* Existing Tasks */}
            <StyledView className="gap-4">
              <StyledText className="text-lg font-semibold text-gray-800">Existing Tasks</StyledText>
              {tasks.map((task) => (
                <Card key={task.id} className=""> {/* Removed glass-card */}
                  <CardContent className="p-4">
                    <StyledView className="space-y-2">
                      <StyledText className="font-semibold text-gray-800">{task.title}</StyledText>
                      <StyledText className="text-sm text-gray-500">{task.description}</StyledText>
                      <StyledView className="flex-row gap-4 text-sm">
                        <StyledText>Points: {task.reward_points}</StyledText>
                        <StyledText>Amount: ${task.reward_amount.toFixed(2)}</StyledText>
                        <StyledText className="capitalize">Status: {task.status}</StyledText>
                      </StyledView>
                    </StyledView>
                  </CardContent>
                </Card>
              ))}
            </StyledView>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            <KYCAdminPanel />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className=""> {/* Removed glass-card */}
              <CardHeader>
                <CardTitle className="flex-row items-center gap-2">
                  <Users className="h-5 w-5 text-gray-700" />
                  <StyledText>User Management</StyledText>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StyledView className="space-y-4">
                  <StyledView className="flex-row justify-between items-center">
                    <StyledText className="text-sm text-gray-500">
                      Total Users: {users.length}
                    </StyledText>
                  </StyledView>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead><StyledText>Name</StyledText></TableHead>
                        <TableHead><StyledText>Role</StyledText></TableHead>
                        <TableHead><StyledText>KYC Status</StyledText></TableHead>
                        <TableHead><StyledText>Total Earnings</StyledText></TableHead>
                        <TableHead><StyledText>Joined</StyledText></TableHead>
                        <TableHead><StyledText>Actions</StyledText></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <StyledView>
                              <StyledText className="font-medium text-gray-800">
                                {user.first_name || user.last_name 
                                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                                  : 'No name set'
                                }
                              </StyledText>
                              <StyledText className="text-sm text-gray-500">
                                {user.user_id}
                              </StyledText>
                            </StyledView>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                user.kyc_status === 'verified' ? 'default' :
                                user.kyc_status === 'pending' ? 'secondary' :
                                user.kyc_status === 'rejected' ? 'destructive' : 'outline'
                              }
                            >
                              {user.kyc_status || 'not_started'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StyledText>${user.total_earnings?.toFixed(2) || '0.00'}</StyledText>
                          </TableCell>
                          <TableCell>
                            <StyledText>
                              {new Date(user.created_at).toLocaleDateString()}
                            </StyledText>
                          </TableCell>
                          <TableCell>
                            <StyledView className="flex-row gap-2">
                              {user.role !== 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onPress={() => updateUserRole(user.user_id, 'admin')}
                                >
                                  <UserCheck className="h-4 w-4 mr-1 text-gray-700" />
                                  <StyledText className="text-gray-700 text-sm">Make Admin</StyledText>
                                </Button>
                              )}
                              {user.role === 'admin' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onPress={() => updateUserRole(user.user_id, 'user')}
                                >
                                  <UserX className="h-4 w-4 mr-1 text-gray-700" />
                                  <StyledText className="text-gray-700 text-sm">Remove Admin</StyledText>
                                </Button>
                              )}
                            </StyledView>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </StyledView>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </StyledView>
    </ScrollView>
  );
}
