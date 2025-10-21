import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'react-native-qrcode-svg';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface PaymentScreenProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  offerId?: string;
  amount: number;
  businessName: string;
  offerTitle?: string;
}

const PAYMENT_METHODS = [
  { 
    id: 'razorpay', 
    name: 'Razorpay UPI', 
    icon: 'card', 
    color: '#528FF0',
    description: 'Pay with any UPI app'
  },
  { 
    id: 'paytm', 
    name: 'Paytm', 
    icon: 'wallet', 
    color: '#00BAF2',
    description: 'Pay with Paytm wallet or UPI'
  },
  { 
    id: 'phonepe', 
    name: 'PhonePe', 
    icon: 'phone-portrait', 
    color: '#5F259F',
    description: 'Pay with PhonePe UPI'
  },
];

const PaymentScreen: React.FC<PaymentScreenProps> = ({
  visible,
  onClose,
  businessId,
  offerId,
  amount,
  businessName,
  offerTitle,
}) => {
  const [step, setStep] = useState<'method' | 'qr' | 'scanner' | 'success'>('method');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  
  const { user, token } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const createPaymentOrder = async (paymentMethod: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/payments/create-order`,
        {
          business_id: businessId,
          offer_id: offerId,
          amount: amount,
          payment_method: paymentMethod,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPaymentOrder(response.data);
      setSelectedMethod(paymentMethod);
      setStep('qr');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create payment order');
    } finally {
      setLoading(false);
    }
  };

  const completePayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/payments/${paymentOrder.order_id}/complete`,
        null,
        {
          params: { payment_id: paymentId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStep('success');
        // Show success for 3 seconds then close
        setTimeout(() => {
          onClose();
          setStep('method');
          setPaymentOrder(null);
        }, 3000);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to complete payment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpiPayment = () => {
    if (!paymentOrder) return;

    const upiUrl = paymentOrder.qr_code_data;
    Linking.canOpenURL(upiUrl).then(supported => {
      if (supported) {
        Linking.openURL(upiUrl);
        
        // Simulate payment completion after user returns to app
        Alert.alert(
          'Payment Confirmation',
          'Have you completed the payment?',
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Yes', 
              onPress: () => completePayment(`payment_${Date.now()}`)
            }
          ]
        );
      } else {
        Alert.alert('Error', 'No UPI app found. Please install a UPI app to proceed.');
      }
    });
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    // Check if scanned data is a UPI QR code
    if (data.includes('upi://pay') || data.includes('paytm://') || data.includes('phonepe://')) {
      Alert.alert(
        'QR Code Scanned',
        'UPI payment QR code detected. Proceed with payment?',
        [
          { text: 'Cancel', onPress: () => setScanned(false) },
          { 
            text: 'Pay Now', 
            onPress: () => {
              Linking.openURL(data);
              setStep('method');
            }
          }
        ]
      );
    } else {
      Alert.alert('Invalid QR Code', 'This is not a valid payment QR code.');
      setScanned(false);
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Payment Method</Text>
        <Text style={styles.subtitle}>
          Pay ₹{amount} to {businessName}
          {offerTitle && <Text style={styles.offerText}>{'\n'}for: {offerTitle}</Text>}
        </Text>
      </View>

      <ScrollView style={styles.methodsContainer}>
        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodButton, { borderColor: method.color }]}
            onPress={() => createPaymentOrder(method.id)}
            disabled={loading}
          >
            <View style={[styles.methodIcon, { backgroundColor: method.color }]}>
              <Ionicons name={method.icon as any} size={24} color="white" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))}

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setStep('scanner')}
          disabled={loading}
        >
          <Ionicons name="qr-code" size={24} color="#007AFF" />
          <Text style={styles.scanButtonText}>Scan QR Code to Pay</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.amountBreakdown}>
        <Text style={styles.breakdownTitle}>Payment Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Amount</Text>
          <Text style={styles.breakdownValue}>₹{amount.toFixed(2)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>OshirO Fee (2%)</Text>
          <Text style={styles.breakdownValue}>₹{(amount * 0.02).toFixed(2)}</Text>
        </View>
        <View style={styles.breakdownDivider} />
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownTotal}>Total</Text>
          <Text style={styles.breakdownTotal}>₹{amount.toFixed(2)}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Creating payment order...</Text>
        </View>
      )}
    </View>
  );

  const renderQRPayment = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan to Pay</Text>
        <Text style={styles.subtitle}>
          Scan this QR code with any UPI app
        </Text>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCodeWrapper}>
          <QRCode
            value={paymentOrder?.qr_code_data || ''}
            size={200}
            color="#000"
            backgroundColor="#fff"
          />
        </View>
        
        <Text style={styles.paymentInfo}>
          Amount: ₹{amount}
        </Text>
        <Text style={styles.merchantInfo}>
          Pay to: {businessName}
        </Text>
        
        <View style={styles.upiInfo}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.upiText}>
            UPI ID: 7386361725@paytm (OshirO)
          </Text>
        </View>
      </View>

      <View style={styles.paymentActions}>
        <TouchableOpacity
          style={styles.upiButton}
          onPress={handleUpiPayment}
          disabled={loading}
        >
          <Ionicons name="open" size={20} color="white" />
          <Text style={styles.upiButtonText}>Open UPI App</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => completePayment(`manual_${Date.now()}`)}
          disabled={loading}
        >
          <Text style={styles.manualButtonText}>I've Paid Manually</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}
    </View>
  );

  const renderQRScanner = () => {
    if (hasPermission === null) {
      return <Text>Requesting for camera permission</Text>;
    }
    if (hasPermission === false) {
      return <Text>No access to camera</Text>;
    }

    return (
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerBackButton}
              onPress={() => {
                setStep('method');
                setScanned(false);
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Payment QR Code</Text>
          </View>
          
          <View style={styles.scannerFrame}>
            <View style={styles.scannerCorner} />
          </View>
          
          <Text style={styles.scannerInstruction}>
            Point your camera at a UPI QR code
          </Text>
          
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
      </View>
      <Text style={styles.successTitle}>Payment Successful!</Text>
      <Text style={styles.successMessage}>
        ₹{amount} paid to {businessName}
      </Text>
      <Text style={styles.successSubtext}>
        Thank you for using OshirO! You'll receive a WhatsApp confirmation shortly.
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Payment</Text>
          <View style={styles.modalPlaceholder} />
        </View>
        
        {step === 'method' && renderMethodSelection()}
        {step === 'qr' && renderQRPayment()}
        {step === 'scanner' && renderQRScanner()}
        {step === 'success' && renderSuccess()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalPlaceholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  offerText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  methodsContainer: {
    flex: 1,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  scanButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  amountBreakdown: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  breakdownTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  qrContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  paymentInfo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  merchantInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  upiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  upiText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  paymentActions: {
    gap: 12,
  },
  upiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  upiButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  manualButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  manualButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  scannerBackButton: {
    marginRight: 16,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  scannerFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 12,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#007AFF',
    borderTopLeftRadius: 12,
  },
  scannerInstruction: {
    textAlign: 'center',
    fontSize: 16,
    color: 'white',
    marginBottom: 50,
    paddingHorizontal: 40,
  },
  rescanButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 50,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 18,
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PaymentScreen;