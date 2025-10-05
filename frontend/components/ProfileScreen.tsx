import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = [
  { id: 'food', name: 'Food & Restaurants', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'clothing', name: 'Clothing & Fashion', icon: 'shirt', color: '#4ECDC4' },
  { id: 'spa', name: 'Beauty & Spa', icon: 'flower', color: '#45B7D1' },
];

const ProfileScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { user, logout, updatePreferences } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.navigate('Auth' as never);
          }
        },
      ]
    );
  };

  const togglePreference = async (categoryId: string) => {
    if (!user) return;

    const newPreferences = user.preferences.includes(categoryId)
      ? user.preferences.filter(p => p !== categoryId)
      : [...user.preferences, categoryId];

    try {
      await updatePreferences(newPreferences);
      Alert.alert('Success', 'Preferences updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderPreferenceItem = (category: any) => {
    const isSelected = user?.preferences.includes(category.id) || false;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={styles.preferenceItem}
        onPress={() => togglePreference(category.id)}
      >
        <View style={styles.preferenceLeft}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon as any} size={20} color="white" />
          </View>
          <Text style={styles.preferenceName}>{category.name}</Text>
        </View>
        <Switch
          value={isSelected}
          onValueChange={() => togglePreference(category.id)}
          trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
          thumbColor={isSelected ? '#fff' : '#f4f3f4'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#007AFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.name || 'User'}
              </Text>
              <Text style={styles.userContact}>
                {user?.phone_number || user?.email || 'Not verified'}
              </Text>
              <View style={styles.userType}>
                <Ionicons 
                  name={user?.user_type === 'business_owner' ? 'business' : 'person'} 
                  size={14} 
                  color="#007AFF" 
                />
                <Text style={styles.userTypeText}>
                  {user?.user_type === 'business_owner' ? 'Business Owner' : 'Customer'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Status</Text>
          <View style={styles.verificationCard}>
            <View style={styles.verificationItem}>
              <Ionicons 
                name={user?.is_phone_verified ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={user?.is_phone_verified ? '#4CAF50' : '#f44336'} 
              />
              <Text style={styles.verificationText}>
                Phone: {user?.is_phone_verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
            <View style={styles.verificationItem}>
              <Ionicons 
                name={user?.is_email_verified ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={user?.is_email_verified ? '#4CAF50' : '#f44336'} 
              />
              <Text style={styles.verificationText}>
                Email: {user?.is_email_verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Preferences</Text>
          <Text style={styles.sectionSubtitle}>
            Choose which types of services you want to be notified about
          </Text>
          <View style={styles.preferencesContainer}>
            {CATEGORIES.map(renderPreferenceItem)}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>SheshA - Discover services near you</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="call" size={20} color="#007AFF" />
              <Text style={styles.infoText}>Support: +919182653234</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="code" size={20} color="#007AFF" />
              <Text style={styles.infoText}>Version 1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Ionicons name="help-circle" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Ionicons name="document-text" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
            <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="#f44336" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color="#f44336" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  userContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  userType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userTypeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  verificationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  preferencesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  preferenceName: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#f44336',
  },
});

export default ProfileScreen;