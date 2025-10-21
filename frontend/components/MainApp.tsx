import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import CustomerScreen from './CustomerScreen';
import MerchantScreen from './MerchantScreen';
import AdminScreen from './AdminScreen';
import QRGenerator from './QRGenerator';
import ProfileScreen from './ProfileScreen';

type TabType = 'customer' | 'merchant' | 'qr' | 'admin' | 'profile';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>('customer');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'customer':
        return <CustomerScreen />;
      case 'merchant':
        return <MerchantScreen />;
      case 'qr':
        return <QRGenerator />;
      case 'admin':
        return <AdminScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <CustomerScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Custom Tab Bar */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarContainer}
        contentContainerStyle={styles.tabBar}
      >
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customer' && styles.activeTab]}
          onPress={() => setActiveTab('customer')}
        >
          <Ionicons
            name={activeTab === 'customer' ? 'storefront' : 'storefront-outline'}
            size={20}
            color={activeTab === 'customer' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'customer' && styles.activeTabText]}>
            Customer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'merchant' && styles.activeTab]}
          onPress={() => setActiveTab('merchant')}
        >
          <Ionicons
            name={activeTab === 'merchant' ? 'business' : 'business-outline'}
            size={20}
            color={activeTab === 'merchant' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'merchant' && styles.activeTabText]}>
            Merchant
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
          onPress={() => setActiveTab('qr')}
        >
          <Ionicons
            name={activeTab === 'qr' ? 'qr-code' : 'qr-code-outline'}
            size={20}
            color={activeTab === 'qr' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
            QR Codes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
          onPress={() => setActiveTab('admin')}
        >
          <Ionicons
            name={activeTab === 'admin' ? 'shield' : 'shield-outline'}
            size={20}
            color={activeTab === 'admin' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>
            Admin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={20}
            color={activeTab === 'profile' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBarContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    maxHeight: 80,
  },
  tabBar: {
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default MainApp;