import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';

type QRType = 'customer' | 'merchant';

const QRGenerator = () => {
  const [activeTab, setActiveTab] = useState<QRType>('customer');
  const appUrl = 'https://shop-nearby-3.preview.emergentagent.com';
  
  const customerRegistrationUrl = `${appUrl}?type=customer&ref=qr`;
  const merchantRegistrationUrl = `${appUrl}?type=merchant&ref=qr`;

  const shareQRCode = async (type: QRType) => {
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

  const renderCustomerQR = () => (
    <ScrollView style={styles.content}>
      <View style={styles.qrSection}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="people" size={48} color="#007AFF" />
          </View>
        </View>

        <Text style={styles.qrTitle}>Customer Registration</Text>
        <Text style={styles.qrDescription}>
          Customers scan this QR code to discover deals and services near them
        </Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={customerRegistrationUrl}
            size={240}
            color="#007AFF"
            backgroundColor="#fff"
          />
        </View>
        
        <View style={styles.qrActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.customerButton]}
            onPress={() => shareQRCode('customer')}
          >
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share QR Code</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>Registration Link:</Text>
          <Text style={styles.urlText}>{customerRegistrationUrl}</Text>
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <View style={styles.instructionsContent}>
          <Text style={styles.instructionsTitle}>How Customers Use This:</Text>
          <Text style={styles.instructionsText}>
            • Scan QR code with phone camera{'\n'}
            • Opens OshirO app directly{'\n'}
            • Register with phone number{'\n'}
            • Start discovering local deals{'\n'}
            • Save money with instant discounts
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderMerchantQR = () => (
    <ScrollView style={styles.content}>
      <View style={styles.qrSection}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: '#f1f8e9' }]}>
            <Ionicons name="storefront" size={48} color="#4CAF50" />
          </View>
        </View>

        <Text style={styles.qrTitle}>Merchant Registration</Text>
        <Text style={styles.qrDescription}>
          Business owners scan this QR code to list their services and create offers
        </Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={merchantRegistrationUrl}
            size={240}
            color="#4CAF50"
            backgroundColor="#fff"
          />
        </View>
        
        <View style={styles.qrActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.merchantButton]}
            onPress={() => shareQRCode('merchant')}
          >
            <Ionicons name="share-social" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share QR Code</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>Registration Link:</Text>
          <Text style={styles.urlText}>{merchantRegistrationUrl}</Text>
        </View>
      </View>

      <View style={styles.instructionsCard}>
        <Ionicons name="information-circle" size={24} color="#4CAF50" />
        <View style={styles.instructionsContent}>
          <Text style={styles.instructionsTitle}>How Merchants Use This:</Text>
          <Text style={styles.instructionsText}>
            • Scan QR code with phone camera{'\n'}
            • Opens OshirO registration{'\n'}
            • Add business details & location{'\n'}
            • Create instant discount offers{'\n'}
            • Reach nearby customers automatically
          </Text>
        </View>
      </View>

      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>Merchant Benefits</Text>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Free to register & list business</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Only 2% fee on completed sales</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Auto WhatsApp notifications to customers</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.benefitText}>Location-based customer discovery</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registration QR Codes</Text>
        <Text style={styles.headerSubtitle}>
          Share these codes for quick signup
        </Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
          onPress={() => setActiveTab('customer')}
        >
          <Ionicons
            name={activeTab === 'customer' ? 'people' : 'people-outline'}
            size={24}
            color={activeTab === 'customer' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>
            Customer QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'merchant' && styles.activeTab]}
          onPress={() => setActiveTab('merchant')}
        >
          <Ionicons
            name={activeTab === 'merchant' ? 'storefront' : 'storefront-outline'}
            size={24}
            color={activeTab === 'merchant' ? '#4CAF50' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'merchant' && styles.activeTabText]}>
            Merchant QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'customer' ? renderCustomerQR() : renderMerchantQR()}

      {/* Contact Info */}
      <View style={styles.contactCard}>
        <Ionicons name="call" size={20} color="#4CAF50" />
        <Text style={styles.contactText}>
          Support: +917386361725 | OshirO Team
        </Text>
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  qrSection: {
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  qrActions: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  customerButton: {
    backgroundColor: '#007AFF',
  },
  merchantButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  urlContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  urlLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  urlText: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f7ff',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
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
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: '#f1f8e9',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fff4',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  contactText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default QRGenerator;
