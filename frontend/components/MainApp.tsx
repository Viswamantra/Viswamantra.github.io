import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import CustomerScreen from './CustomerScreen';
import MerchantScreen from './MerchantScreen';
import ProfileScreen from './ProfileScreen';

type TabType = 'customer' | 'merchant' | 'profile';

const MainApp = () => {
  const [activeTab, setActiveTab] = useState<TabType>('customer');
  const { user } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'discover':
        return <DiscoverScreen />;
      case 'offers':
        return <OffersScreen />;
      case 'business':
        return <BusinessScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <OffersScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>
      
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <Ionicons
            name={activeTab === 'discover' ? 'location' : 'location-outline'}
            size={24}
            color={activeTab === 'discover' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
          onPress={() => setActiveTab('offers')}
        >
          <Ionicons
            name={activeTab === 'offers' ? 'gift' : 'gift-outline'}
            size={24}
            color={activeTab === 'offers' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
            Offers
          </Text>
        </TouchableOpacity>

        {user?.user_type === 'business_owner' && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'business' && styles.activeTab]}
            onPress={() => setActiveTab('business')}
          >
            <Ionicons
              name={activeTab === 'business' ? 'business' : 'business-outline'}
              size={24}
              color={activeTab === 'business' ? '#007AFF' : '#666'}
            />
            <Text style={[styles.tabText, activeTab === 'business' && styles.activeTabText]}>
              Business
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Ionicons
            name={activeTab === 'profile' ? 'person' : 'person-outline'}
            size={24}
            color={activeTab === 'profile' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
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