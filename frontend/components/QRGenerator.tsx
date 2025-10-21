import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

const QRGenerator = () => {
  const appUrl = 'https://shesha-finder.preview.emergentagent.com';
  
  const customerRegistrationUrl = `${appUrl}?type=customer&ref=qr`;
  const merchantRegistrationUrl = `${appUrl}?type=merchant&ref=qr`;

  const shareQRCode = async (type: 'customer' | 'merchant') => {
    const url = type === 'customer' ? customerRegistrationUrl : merchantRegistrationUrl;
    const message = type === 'customer' 
      ? `🛍️ Join OshirO as a Customer! Discover amazing deals near you: ${url}`
      : `🏪 Join OshirO as a Merchant! Grow your business with us: ${url}`;

    try {
      await Share.share({
        message,
        url,
        title: `OshirO ${type === 'customer' ? 'Customer' : 'Merchant'} Registration`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share QR code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OshirO Registration QR Codes</Text>
        <Text style={styles.headerSubtitle}>
          Share these QR codes for direct registration
        </Text>
      </View>

      <View style={styles.content}>
        {/* Customer QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>👥 Customer Registration</Text>
          <Text style={styles.qrDescription}>
            Customers scan this to discover deals and services
          </Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={customerRegistrationUrl}
              size={200}
              color="#007AFF"
              backgroundColor="#fff"
            />
          </View>
          
          <View style={styles.qrActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.customerButton]}
              onPress={() => shareQRCode('customer')}
            >
              <Ionicons name="share" size={20} color="white" />
              <Text style={styles.actionButtonText}>Share Customer QR</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.urlText}>{customerRegistrationUrl}</Text>
        </View>

        {/* Merchant QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>🏪 Merchant Registration</Text>
          <Text style={styles.qrDescription}>
            Business owners scan this to list their services
          </Text>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={merchantRegistrationUrl}
              size={200}
              color="#4CAF50"
              backgroundColor="#fff"
              logo={require('../assets/icon.png') || undefined}
              logoSize={40}
              logoBackgroundColor="transparent"
            />
          </View>
          
          <View style={styles.qrActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.merchantButton]}
              onPress={() => shareQRCode('merchant')}
            >
              <Ionicons name="share" size={20} color="white" />
              <Text style={styles.actionButtonText}>Share Merchant QR</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.urlText}>{merchantRegistrationUrl}</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>How to Use:</Text>
            <Text style={styles.instructionsText}>
              1. Save or print these QR codes{'\n'}
              2. Share with customers and merchants{'\n'}
              3. They scan with any QR scanner or camera{'\n'}
              4. Opens OshirO directly in their browser{'\n'}
              5. No app download required!
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Ionicons name="call" size={20} color="#4CAF50" />
          <Text style={styles.contactText}>
            Support: +917386361725 | OshirO Team
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  qrActions: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  customerButton: {
    backgroundColor: '#007AFF',
  },
  merchantButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsContent: {
    marginLeft: 12,
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderRadius: 8,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default QRGenerator;