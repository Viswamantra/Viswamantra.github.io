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

const AuthScreen = () => {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { sendOTP, verifyOTP, login } = useAuth();

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phoneNumber}`;
      const result = await sendOTP(fullPhone, 'phone');
      if (result.success) {
        setStep('verify');
        // OTP 1234 is shown on screen, no alert needed
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the OTP code');
      return;
    }

    if (otpCode !== '1234') {
      Alert.alert('Error', 'Invalid OTP. Please enter 1234');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `+91${phoneNumber}`;
      const result = await verifyOTP(fullPhone, 'phone', otpCode);
      if (result.success && result.access_token) {
        const userData = {
          id: result.user_id!,
          user_type: 'customer',
          preferences: [],
          is_phone_verified: true,
          is_email_verified: false,
          phone_number: fullPhone
        };
        
        await login(result.access_token, userData as any);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneInput = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to OshirO</Text>
        <Text style={styles.subtitle}>Discover amazing services near you</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Enter Phone Number</Text>
        
        <View style={styles.phoneInputContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="XXXXXXXXXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={10}
            autoCorrect={false}
          />
        </View>

        <Text style={styles.helperText}>
          Enter your 10-digit mobile number
        </Text>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.buttonText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOTPVerification = () => (
    <View style={styles.content}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          setStep('input');
          setOtpCode('');
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to +91 {phoneNumber}
        </Text>
      </View>

      <View style={styles.otpDisplayContainer}>
        <View style={styles.otpBadge}>
          <Ionicons name="key" size={24} color="#4CAF50" />
          <Text style={styles.otpLabel}>Your OTP Code</Text>
          <Text style={styles.otpValue}>1234</Text>
          <Text style={styles.otpNote}>Enter this code below</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.otpInputContainer}>
          <Ionicons name="shield-checkmark" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.otpInput}
            placeholder="Enter 4-digit OTP"
            value={otpCode}
            onChangeText={setOtpCode}
            keyboardType="number-pad"
            maxLength={4}
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
            <>
              <Text style={styles.buttonText}>Verify & Continue</Text>
              <Ionicons name="checkmark-circle" size={20} color="white" style={styles.buttonIcon} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendButton}
          onPress={() => {
            setStep('input');
            setOtpCode('');
            setPhoneNumber('');
          }}
        >
          <Text style={styles.resendText}>Change Phone Number</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {step === 'input' && renderPhoneInput()}
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
    marginBottom: 20,
    width: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
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
  formContainer: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#0056b3',
  },
  countryCodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#000',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 24,
  },
  otpDisplayContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  otpBadge: {
    backgroundColor: '#f0fff4',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    minWidth: 200,
  },
  otpLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  otpValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 8,
    marginVertical: 8,
  },
  otpNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  otpInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    color: '#000',
    letterSpacing: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonIcon: {
    marginLeft: 8,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthScreen;
