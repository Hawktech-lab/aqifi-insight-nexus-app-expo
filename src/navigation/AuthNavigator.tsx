import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { authStyles } from '../styles/authStyles';

const AuthStack = createNativeStackNavigator();

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={authStyles.scrollContainer}>
      <View style={authStyles.authContainer}>
        <View style={authStyles.authHeader}>
          <Icon name="shield" size={60} color="#007AFF" />
          <Text style={authStyles.authTitle}>Aqifi Insight Nexus</Text>
          <Text style={authStyles.authSubtitle}>Sign in to your account</Text>
        </View>

        <View style={authStyles.authForm}>
          <View style={authStyles.inputContainer}>
            <Icon name="mail" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={authStyles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[authStyles.authButton, loading && authStyles.authButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={authStyles.authButtonText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={authStyles.linkButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={authStyles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const SignUpScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, firstName, lastName, referralCode.trim().toUpperCase() || undefined);
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
        navigation.navigate('Login');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={authStyles.scrollContainer}>
      <View style={authStyles.authContainer}>
        <View style={authStyles.authHeader}>
          <Icon name="shield" size={60} color="#007AFF" />
          <Text style={authStyles.authTitle}>Create Account</Text>
          <Text style={authStyles.authSubtitle}>Join Aqifi Insight Nexus</Text>
        </View>

        <View style={authStyles.authForm}>
          <View style={authStyles.nameRow}>
            <View style={[authStyles.inputContainer, authStyles.halfInput]}>
              <TextInput
                style={authStyles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>
            <View style={[authStyles.inputContainer, authStyles.halfInput]}>
              <TextInput
                style={authStyles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={authStyles.inputContainer}>
            <Icon name="mail" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={authStyles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={authStyles.inputContainer}>
            <Icon name="lock-closed" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={authStyles.inputContainer}>
            <Icon name="gift-outline" size={20} color="#666" style={authStyles.inputIcon} />
            <TextInput
              style={authStyles.input}
              placeholder="Referral Code (Optional)"
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              autoCapitalize="characters"
            />
          </View>
          {referralCode && (
            <Text style={authStyles.helperText}>
              Enter a referral code to help your friend earn rewards!
            </Text>
          )}

          <TouchableOpacity 
            style={[authStyles.authButton, loading && authStyles.authButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={authStyles.authButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={authStyles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={authStyles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
};

