import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native'; // Import core RN components and Linking
import { ExternalLink, Award, CheckCircle, Clock } from "lucide-react-native"; // Assuming lucide-react-native is installed
import { styled } from 'nativewind';

// Styled components using Nativewind for reusability
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

// Assuming useAuth and supabase are already adapted for React Native
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Interfaces (remain the same as they are type definitions)
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

interface UserProgress {
  survey_id?: string;
  task_id?: string;
  status: string;
  completed_at: string | null;
}

// Replicating simplified Card components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card = styled(({ children, className }: CardProps) => (
  <StyledView className={`rounded-lg bg-white shadow-md ${className}`}>
    {children}
  </StyledView>
));

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}
const CardHeader = styled(({ children, className }: CardHeaderProps) => (
  <StyledView className={`p-4 pb-0 ${className}`}>
    {children}
  </StyledView>
));

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}
const CardTitle = styled(({ children, className }: CardTitleProps) => (
  <StyledText className={`text-lg font-semibold ${className}`}>
    {children}
  </StyledText>
));

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}
const CardContent = styled(({ children, className }: CardContentProps) => (
  <StyledView className={`p-4 pt-3 ${className}`}>
    {children}
  </StyledView>
));

// Replicating simplified Button component
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void; // Changed onClick to onPress for React Native
  disabled?: boolean;
  variant?: 'outline' | 'default' | 'secondary';
  className?: string;
}
const Button = styled(({ children, onPress, disabled, variant = 'default', className }: ButtonProps) => {
  let buttonClasses = `px-4 py-2 rounded-lg flex-row items-center justify-center `;
  let textClasses = `text-white`;

  if (variant === 'outline') {
    buttonClasses += `border border-gray-300 bg-white`;
    textClasses = `text-gray-700`;
  } else if (variant === 'secondary') {
    buttonClasses += `bg-gray-200`;
    textClasses = `text-gray-800`;
  } else { // default
    buttonClasses += `bg-blue-500`;
    textClasses = `text-white`;
  }

  if (disabled) {
    buttonClasses += ` opacity-50`;
  }

  return (
    <StyledTouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${buttonClasses} ${className}`}
    >
      {typeof children === 'string' ? (
        <StyledText className={`${textClasses}`}>{children}</StyledText>
      ) : (
        children
      )}
    </StyledTouchableOpacity>
  );
});

// Replicating simplified Badge component
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  className?: string;
}
const Badge = styled(({ children, variant = 'default', className }: BadgeProps) => {
  let badgeClasses = `px-2.5 py-0.5 rounded-full text-xs font-semibold `;
  let textClasses = `text-white`;

  if (variant === 'outline') {
    badgeClasses += `border border-gray-300 bg-white`;
    textClasses = `text-gray-700`;
  } else if (variant === 'secondary') {
    badgeClasses += `bg-gray-200`;
    textClasses = `text-gray-800`;
  } else if (variant === 'destructive') {
    badgeClasses += `bg-red-500`;
    textClasses = `text-white`;
  } else { // default
    badgeClasses += `bg-gray-800`;
    textClasses = `text-white`;
  }

  return (
    <StyledView className={`${badgeClasses} ${className}`}>
      {typeof children === 'string' ? (
        <StyledText className={`${textClasses}`}>{children}</StyledText>
      ) : (
        children
      )}
    </StyledView>
  );
});

export default function Surveys() {
  const { user } = useAuth();
  // useToast removed as it's web-specific. Implement a React Native toast library if needed.
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSurveyProgress, setUserSurveyProgress] = useState<UserProgress[]>([]);
  const [userTaskProgress, setUserTaskProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSurveysAndTasks();
  }, [user]);

  const fetchSurveysAndTasks = async () => {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select('*')
        .eq('status', 'active');
      if (surveysError) throw surveysError;
      setSurveys(surveysData || []);

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'active');
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Fetch user survey progress
      const { data: surveyProgressData, error: surveyProgressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .not('survey_id', 'is', null);
      if (surveyProgressError) throw surveyProgressError;
      setUserSurveyProgress(surveyProgressData || []);

      // Fetch user task progress
      const { data: taskProgressData, error: taskProgressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .not('task_id', 'is', null);
      if (taskProgressError) throw taskProgressError;
      setUserTaskProgress(taskProgressData || []);

    } catch (error: any) {
      console.error('Error fetching surveys/tasks:', error.message);
      // You would typically show a user-friendly error message here
    } finally {
      setLoading(false);
    }
  };

  const getUserSurveyStatus = (surveyId: string): 'not_started' | 'pending' | 'completed' => {
    const progress = userSurveyProgress.find(p => p.survey_id === surveyId);
    return progress ? (progress.status as 'not_started' | 'pending' | 'completed') : 'not_started';
  };

  const getUserTaskStatus = (taskId: string): 'not_started' | 'completed' => {
    const progress = userTaskProgress.find(p => p.task_id === taskId);
    return progress ? (progress.status as 'not_started' | 'completed') : 'not_started';
  };

  const completeSurvey = async (surveyId: string, typeformId: string) => {
    if (!user) return;

    try {
      // Mark survey as pending
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          survey_id: surveyId,
          status: 'pending',
        });
      if (insertError) throw insertError;

      // Open Typeform (using Linking for React Native)
      const typeformUrl = `https://example.typeform.com/to/${typeformId}?user_id=${user.id}`; // Adjust Typeform URL
      await Linking.openURL(typeformUrl);

      // Re-fetch progress to update UI after opening Typeform
      fetchSurveysAndTasks();
      console.log('Survey opened, status set to pending.');
      // Show success toast/message here
    } catch (error: any) {
      console.error('Error starting survey:', error.message);
      // Show error toast/message here
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user) return;

    try {
      const existingProgress = userTaskProgress.find(p => p.task_id === taskId);

      if (existingProgress) {
        // Update existing progress if already started (e.g., if re-attempting)
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('task_id', taskId);
        if (updateError) throw updateError;
      } else {
        // Insert new progress if not started
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            task_id: taskId,
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
        if (insertError) throw insertError;
      }

      fetchSurveysAndTasks();
      console.log('Task marked as completed.');
      // Show success toast/message here
    } catch (error: any) {
      console.error('Error completing task:', error.message);
      // Show error toast/message here
    }
  };


  if (loading) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#0000ff" />
        <StyledText className="text-xl font-bold mt-4">Loading available opportunities...</StyledText>
      </StyledView>
    );
  }

  return (
    <StyledView className="flex-1 p-6 bg-gray-100 space-y-6">
      <StyledView>
        <StyledText className="text-2xl font-bold text-gray-900 mb-2">
          Surveys & Tasks
        </StyledText>
        <StyledText className="text-sm text-gray-500">
          Earn rewards by participating in surveys and completing tasks.
        </StyledText>
      </StyledView>

      {/* Surveys Section */}
      <StyledView>
        <StyledText className="text-xl font-semibold text-gray-900 mb-4">
          Available Surveys
        </StyledText>
        <StyledView className="flex-row flex-wrap -mx-2"> {/* grid conversion to flex-wrap */}
          {surveys.map((survey) => {
            const status = getUserSurveyStatus(survey.id);
            return (
              <Card key={survey.id} className="w-full sm:w-1/2 lg:w-1/3 p-2"> {/* Responsive width */}
                <CardHeader>
                  <CardTitle>{survey.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StyledView className="flex-row justify-between items-center mb-2">
                    <Badge
                      variant={
                        status === 'completed'
                          ? 'default'
                          : status === 'pending'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {status === 'completed'
                        ? 'Completed'
                        : status === 'pending'
                          ? 'Pending'
                          : 'Available'}
                    </Badge>
                    {status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {status === 'pending' && (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                  </StyledView>
                  <StyledText className="text-gray-500">{survey.description}</StyledText>
                  <StyledView className="flex-row items-center gap-4 text-sm">
                    <StyledView className="flex-row items-center gap-1">
                      <Award className="h-4 w-4" />
                      <StyledText>{survey.reward_points} points</StyledText>
                    </StyledView>
                    <StyledText>${survey.reward_amount.toFixed(2)}</StyledText>
                  </StyledView>
                  <StyledView className="flex-row justify-between items-center">
                    {status === 'not_started' && (
                      <Button onPress={() => completeSurvey(survey.id, survey.typeform_id)} className="flex-1">
                        Start Survey
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    {status === 'pending' && (
                      <Button variant="secondary" disabled className="flex-1">
                        Pending
                        <Clock className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    {status === 'completed' && (
                      <Button variant="secondary" disabled className="flex-1">
                        Completed
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </StyledView>
                </CardContent>
              </Card>
            );
          })}
        </StyledView>
      </StyledView>

      {/* Tasks Section */}
      <StyledView>
        <StyledText className="text-xl font-semibold text-gray-900 mb-4">
          Available Tasks
        </StyledText>
        <StyledView className="flex-row flex-wrap -mx-2"> {/* grid conversion to flex-wrap */}
          {tasks.map((task) => {
            const status = getUserTaskStatus(task.id);
            return (
              <Card key={task.id} className="w-full sm:w-1/2 lg:w-1/3 p-2"> {/* Responsive width */}
                <CardHeader>
                  <CardTitle>{task.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StyledView className="flex-row justify-between items-center mb-2">
                    <Badge
                      variant={status === 'completed' ? 'default' : 'outline'}
                    >
                      {status === 'completed' ? 'Completed' : 'Available'}
                    </Badge>
                    {status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </StyledView>
                  <StyledText className="text-gray-500">{task.description}</StyledText>
                  <StyledView className="flex-row items-center gap-4 text-sm">
                    <StyledView className="flex-row items-center gap-1">
                      <Award className="h-4 w-4" />
                      <StyledText>{task.reward_points} points</StyledText>
                    </StyledView>
                    <StyledText>${task.reward_amount.toFixed(2)}</StyledText>
                  </StyledView>
                  <StyledView className="flex-row justify-between items-center">
                    {status === 'not_started' && (
                      <Button onPress={() => completeTask(task.id)} className="flex-1">
                        Complete Task
                      </Button>
                    )}
                    {status === 'completed' && (
                      <Button variant="secondary" disabled className="flex-1">
                        Completed
                        <CheckCircle className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </StyledView>
                </CardContent>
              </Card>
            );
          })}
        </StyledView>
      </StyledView>

      {surveys.length === 0 && tasks.length === 0 && (
        <Card className="glass-card"> {/* This class is approximated */}
          <CardContent className="p-8 text-center">
            <StyledText className="text-gray-500">
              No surveys or tasks available at the moment. Check back later!
            </StyledText>
          </CardContent>
        </Card>
      )}
    </StyledView>
  );
}
