import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigation } from '@react-navigation/native';

const AuthScreen = () => {
  const [step, setStep] = useState<'method' | 'input' | 'verify'>('method');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | null>(null);
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoOTP, setDemoOTP] = useState<string>('');
  
  const { sendOTP, verifyOTP, login } = useAuth();
  // const navigation = useNavigation();

  const handleMethodSelect = (method: 'phone' | 'email') => {
    setAuthMethod(method);
    setStep('input');
  };

  const handleSendOTP = async () => {
    if (!contact.trim() || !authMethod) {
      Alert.alert('Error', 'Please enter your phone number or email');
      return;
    }

    // Basic validation
    if (authMethod === 'phone' && !contact.startsWith('+')) {
      Alert.alert('Error', 'Please enter phone number with country code (e.g., +919182653234)');
      return;
    }

    if (authMethod === 'email' && !contact.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(contact, authMethod);
      if (result.success) {
        setDemoOTP(result.demo_otp || '');
        setStep('verify');
        Alert.alert('Success', `OTP sent to ${contact}${result.demo_otp ? `\nDemo OTP: ${result.demo_otp}` : ''}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(contact, authMethod!, otpCode);
      if (result.success && result.access_token) {
        // Create user object for context
        const userData = {
          id: result.user_id!,
          user_type: 'customer',
          preferences: [],
          is_phone_verified: authMethod === 'phone',
          is_email_verified: authMethod === 'email',
          ...(authMethod === 'phone' ? { phone_number: contact } : { email: contact })
        };
        
        await login(result.access_token, userData as any);
        // Navigation will be handled by the parent component
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to SheshA</Text>
        <Text style={styles.subtitle}>Discover amazing services near you</Text>
      </View>

      <View style={styles.methodContainer}>
        <Text style={styles.sectionTitle}>Choose verification method:</Text>
        
        <TouchableOpacity 
          style={styles.methodButton}
          onPress={() => handleMethodSelect('phone')}
        >
          <Ionicons name="call" size={24} color="#007AFF" />
          <View style={styles.methodText}>
            <Text style={styles.methodTitle}>Phone Number</Text>
            <Text style={styles.methodSubtitle}>Verify with SMS OTP</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.methodButton}
          onPress={() => handleMethodSelect('email')}
        >
          <Ionicons name="mail" size={24} color="#007AFF" />
          <View style={styles.methodText}>
            <Text style={styles.methodTitle}>Email Address</Text>
            <Text style={styles.methodSubtitle}>Verify with email OTP</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactInput = () => (
    <View style={styles.content}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setStep('method')}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>
          Enter {authMethod === 'phone' ? 'Phone Number' : 'Email Address'}
        </Text>
        <Text style={styles.subtitle}>
          We'll send you a verification code
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons 
          name={authMethod === 'phone' ? 'call' : 'mail'} 
          size={20} 
          color="#666" 
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={authMethod === 'phone' ? '+919182653234' : 'your.email@example.com'}
          value={contact}
          onChangeText={setContact}
          keyboardType={authMethod === 'phone' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPVerification = () => (
    <View style={styles.content}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setStep('input')}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to {contact}
        </Text>
        {demoOTP && (
          <Text style={styles.demoOTP}>Demo OTP: {demoOTP}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="shield-checkmark" size={20} color="#666" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          value={otpCode}
          onChangeText={setOtpCode}
          keyboardType="number-pad"
          maxLength={6}
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Verify & Continue</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.resendButton}
        onPress={handleSendOTP}
      >
        <Text style={styles.resendText}>Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {step === 'method' && renderMethodSelection()}
          {step === 'input' && renderContactInput()}
          {step === 'verify' && renderOTPVerification()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  demoOTP: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 8,
    fontWeight: '600',
  },
  methodContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  methodText: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthScreen;