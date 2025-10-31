import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import * as Location from 'expo-location';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = [
  { id: 'food', name: 'Food & Restaurants', icon: 'restaurant' },
  { id: 'clothing', name: 'Clothing & Fashion', icon: 'shirt' },
  { id: 'spa', name: 'Beauty & Spa', icon: 'flower' },
];

interface Business {
  id: string;
  business_name: string;
  category: string;
  phone_number: string;
  address: string;
  description?: string;
  rating: number;
  is_active: boolean;
}

interface Offer {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  original_price?: number;
  discounted_price?: number;
  valid_until: string;
  max_uses?: number;
  current_uses: number;
  business_info?: any;
  is_active: boolean;
}

const MerchantScreen = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'business' | 'offers' | 'analytics'>('dashboard');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  
  // Business form state
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    description: '',
    category: 'food',
    phone_number: '',
    email: '',
    address: '',
  });

  // Offer form state
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    original_price: '',
    valid_until: '',
    max_uses: '',
    terms_conditions: '',
  });

  const { user, token } = useAuth();

  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMyBusinesses(),
        loadMyOffers(),
      ]);
    } catch (error) {
      console.error('Error loading merchant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBusinesses = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/businesses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(response.data);
      if (response.data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  const loadMyOffers = async () => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/offers/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOffers(response.data);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const handleCreateBusiness = async () => {
    if (!businessForm.business_name.trim() || !businessForm.address.trim()) {
      alert('Please fill in business name and address');
      return;
    }

    setLoading(true);
    try {
      // Get current location for business
      const { status} = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Location permission is required to register a business');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const businessData = {
        ...businessForm,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };

      if (editingBusiness) {
        // Update existing business
        const response = await axios.put(
          `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/${editingBusiness.id}`,
          businessData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setBusinesses(prev => prev.map(b => b.id === editingBusiness.id ? response.data : b));
        alert('Business updated successfully!');
      } else {
        // Create new business
        const response = await axios.post(
          `${EXPO_PUBLIC_BACKEND_URL}/api/businesses`,
          businessData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setBusinesses(prev => [...prev, response.data]);
        setSelectedBusiness(response.data);
        alert('Business registered successfully!');
      }

      setShowCreateBusiness(false);
      setEditingBusiness(null);
      
      // Reset form
      setBusinessForm({
        business_name: '',
        description: '',
        category: 'food',
        phone_number: '',
        email: '',
        address: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to save business');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!selectedBusiness) {
      Alert.alert('Error', 'Please select a business first');
      return;
    }

    if (!offerForm.title.trim() || !offerForm.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      // Set valid_until to 30 days from now if not provided
      const validUntil = offerForm.valid_until || 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const offerData = {
        title: offerForm.title,
        description: offerForm.description,
        discount_type: offerForm.discount_type,
        discount_value: parseFloat(offerForm.discount_value) || 0,
        original_price: offerForm.original_price ? parseFloat(offerForm.original_price) : undefined,
        valid_until: validUntil,
        max_uses: offerForm.max_uses ? parseInt(offerForm.max_uses) : undefined,
        terms_conditions: offerForm.terms_conditions,
      };

      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/${selectedBusiness.id}/offers`,
        offerData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      await loadMyOffers(); // Reload to get updated data
      setShowCreateOffer(false);
      
      // Reset form
      setOfferForm({
        title: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        original_price: '',
        valid_until: '',
        max_uses: '',
        terms_conditions: '',
      });

      Alert.alert('Success', 'Offer created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRevenue = () => {
    return offers.reduce((total, offer) => {
      if (offer.original_price && offer.discounted_price) {
        return total + (offer.current_uses * offer.discounted_price);
      }
      return total;
    }, 0);
  };

  const calculateTotalSavings = () => {
    return offers.reduce((total, offer) => {
      if (offer.original_price && offer.discounted_price) {
        return total + (offer.current_uses * (offer.original_price - offer.discounted_price));
      }
      return total;
    }, 0);
  };

  const renderDashboard = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="business" size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{businesses.length}</Text>
          <Text style={styles.statLabel}>Businesses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="gift" size={24} color="#FF6B6B" />
          <Text style={styles.statNumber}>{offers.length}</Text>
          <Text style={styles.statLabel}>Active Offers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#4ECDC4" />
          <Text style={styles.statNumber}>{offers.reduce((sum, offer) => sum + offer.current_uses, 0)}</Text>
          <Text style={styles.statLabel}>Total Uses</Text>
        </View>
      </View>

      {/* Revenue Overview */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <View style={styles.revenueRow}>
          <Text style={styles.revenueLabel}>Total Revenue Generated</Text>
          <Text style={styles.revenueValue}>₹{calculateTotalRevenue().toFixed(2)}</Text>
        </View>
        <View style={styles.revenueRow}>
          <Text style={styles.revenueLabel}>Customer Savings Provided</Text>
          <Text style={styles.savingsValue}>₹{calculateTotalSavings().toFixed(2)}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowCreateBusiness(true)}
          >
            <Ionicons name="add-circle" size={32} color="#007AFF" />
            <Text style={styles.actionText}>Add Business</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowCreateOffer(true)}
            disabled={businesses.length === 0}
          >
            <Ionicons name="gift" size={32} color={businesses.length === 0 ? "#ccc" : "#FF6B6B"} />
            <Text style={[styles.actionText, businesses.length === 0 && styles.actionTextDisabled]}>Create Offer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('analytics')}
          >
            <Ionicons name="analytics" size={32} color="#4ECDC4" />
            <Text style={styles.actionText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Offers */}
      {offers.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Offers</Text>
          {offers.slice(0, 3).map((offer) => (
            <View key={offer.id} style={styles.offerSummary}>
              <View style={styles.offerSummaryHeader}>
                <Text style={styles.offerSummaryTitle}>{offer.title}</Text>
                <Text style={styles.offerSummaryDiscount}>
                  {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                </Text>
              </View>
              <Text style={styles.offerSummaryUses}>{offer.current_uses} uses</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderBusinessTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Businesses</Text>
        <TouchableOpacity onPress={() => setShowCreateBusiness(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Businesses Yet</Text>
          <Text style={styles.emptyStateSubtitle}>Register your first business to start</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateBusiness(true)}
          >
            <Text style={styles.createButtonText}>Register Business</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={businesses}
          renderItem={({ item }) => (
            <View style={styles.businessCard}>
              <View style={styles.businessHeader}>
                <View style={styles.businessInfo}>
                  <Text style={styles.businessName}>{item.business_name}</Text>
                  <Text style={styles.businessCategory}>{item.category}</Text>
                  <Text style={styles.businessAddress}>{item.address}</Text>
                </View>
                <View style={styles.businessActions}>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setEditingBusiness(item);
                      setShowCreateBusiness(true);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setSelectedBusiness(item)}
                  >
                    <Text style={styles.selectButtonText}>
                      {selectedBusiness?.id === item.id ? 'Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {item.description && (
                <Text style={styles.businessDescription}>{item.description}</Text>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderOffersTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Offers</Text>
        <TouchableOpacity 
          onPress={() => setShowCreateOffer(true)}
          disabled={businesses.length === 0}
        >
          <Ionicons name="add" size={24} color={businesses.length === 0 ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>

      {offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={64} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Offers Created</Text>
          <Text style={styles.emptyStateSubtitle}>
            {businesses.length === 0 ? 'Register a business first' : 'Create your first offer'}
          </Text>
          {businesses.length > 0 && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateOffer(true)}
            >
              <Text style={styles.createButtonText}>Create Offer</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={({ item }) => (
            <View style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.offerTitle}>{item.title}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {item.discount_type === 'percentage' ? `${item.discount_value}%` : `₹${item.discount_value}`} OFF
                  </Text>
                </View>
              </View>
              
              <Text style={styles.offerDescription}>{item.description}</Text>
              
              {item.business_info && (
                <Text style={styles.offerBusinessName}>
                  {item.business_info.business_name}
                </Text>
              )}

              <View style={styles.offerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.current_uses}</Text>
                  <Text style={styles.statLabel}>Uses</Text>
                </View>
                {item.max_uses && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{item.max_uses - item.current_uses}</Text>
                    <Text style={styles.statLabel}>Remaining</Text>
                  </View>
                )}
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.ceil((new Date(item.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </Text>
                  <Text style={styles.statLabel}>Days left</Text>
                </View>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Business Analytics</Text>
      
      {/* Performance Metrics */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Performance Overview</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Offers Created</Text>
          <Text style={styles.metricValue}>{offers.length}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Redemptions</Text>
          <Text style={styles.metricValue}>{offers.reduce((sum, offer) => sum + offer.current_uses, 0)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Average Uses per Offer</Text>
          <Text style={styles.metricValue}>
            {offers.length > 0 ? (offers.reduce((sum, offer) => sum + offer.current_uses, 0) / offers.length).toFixed(1) : '0'}
          </Text>
        </View>
      </View>

      {/* Top Performing Offers */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Top Performing Offers</Text>
        {offers
          .sort((a, b) => b.current_uses - a.current_uses)
          .slice(0, 5)
          .map((offer) => (
            <View key={offer.id} style={styles.topOfferItem}>
              <View style={styles.topOfferInfo}>
                <Text style={styles.topOfferTitle}>{offer.title}</Text>
                <Text style={styles.topOfferBusiness}>{offer.business_info?.business_name}</Text>
              </View>
              <Text style={styles.topOfferUses}>{offer.current_uses} uses</Text>
            </View>
          ))}
        
        {offers.length === 0 && (
          <Text style={styles.noDataText}>No offers data available</Text>
        )}
      </View>

      {/* Customer Insights */}
      <View style={styles.sectionCard}>
        <Text style={styles.cardTitle}>Customer Insights</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Customer Savings</Text>
          <Text style={styles.metricValue}>₹{calculateTotalSavings().toFixed(2)}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Revenue from Offers</Text>
          <Text style={styles.metricValue}>₹{calculateTotalRevenue().toFixed(2)}</Text>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Merchant Dashboard</Text>
        <TouchableOpacity onPress={loadMerchantData} disabled={loading}>
          <Ionicons 
            name={loading ? 'hourglass' : 'refresh'} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
            { key: 'business', label: 'Business', icon: 'business' },
            { key: 'offers', label: 'Offers', icon: 'gift' },
            { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.key ? '#007AFF' : '#666'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'business' && renderBusinessTab()}
      {activeTab === 'offers' && renderOffersTab()}
      {activeTab === 'analytics' && renderAnalytics()}

      {/* Create Business Modal */}
      <Modal visible={showCreateBusiness} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateBusiness(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Register Business</Text>
            <TouchableOpacity onPress={handleCreateBusiness} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Creating...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={styles.input}
              value={businessForm.business_name}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, business_name: text }))}
              placeholder="Enter business name"
            />

            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    businessForm.category === cat.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => setBusinessForm(prev => ({ ...prev, category: cat.id }))}
                >
                  <Ionicons name={cat.icon as any} size={20} color={businessForm.category === cat.id ? 'white' : '#007AFF'} />
                  <Text style={[
                    styles.categoryOptionText,
                    businessForm.category === cat.id && styles.categoryOptionTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessForm.description}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe your business"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={businessForm.phone_number}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, phone_number: text }))}
              placeholder="+917386361725"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={businessForm.email}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, email: text }))}
              placeholder="business@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={businessForm.address}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, address: text }))}
              placeholder="Business address"
              multiline
              numberOfLines={2}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Create Offer Modal */}
      <Modal visible={showCreateOffer} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateOffer(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Offer</Text>
            <TouchableOpacity onPress={handleCreateOffer} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {selectedBusiness && (
              <View style={styles.selectedBusinessInfo}>
                <Text style={styles.selectedBusinessText}>Creating offer for: {selectedBusiness.business_name}</Text>
              </View>
            )}

            <Text style={styles.label}>Offer Title *</Text>
            <TextInput
              style={styles.input}
              value={offerForm.title}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, title: text }))}
              placeholder="e.g., Special Lunch Deal"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={offerForm.description}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe your offer in detail"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Discount Type</Text>
            <View style={styles.discountTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  offerForm.discount_type === 'percentage' && styles.discountTypeButtonActive
                ]}
                onPress={() => setOfferForm(prev => ({ ...prev, discount_type: 'percentage' }))}
              >
                <Text style={[
                  styles.discountTypeText,
                  offerForm.discount_type === 'percentage' && styles.discountTypeTextActive
                ]}>
                  Percentage (%)
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.discountTypeButton,
                  offerForm.discount_type === 'fixed_amount' && styles.discountTypeButtonActive
                ]}
                onPress={() => setOfferForm(prev => ({ ...prev, discount_type: 'fixed_amount' }))}
              >
                <Text style={[
                  styles.discountTypeText,
                  offerForm.discount_type === 'fixed_amount' && styles.discountTypeTextActive
                ]}>
                  Fixed Amount (₹)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              Discount Value ({offerForm.discount_type === 'percentage' ? '%' : '₹'})
            </Text>
            <TextInput
              style={styles.input}
              value={offerForm.discount_value}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, discount_value: text }))}
              placeholder={offerForm.discount_type === 'percentage' ? '20' : '100'}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Original Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={offerForm.original_price}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, original_price: text }))}
              placeholder="500"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Max Uses (Optional)</Text>
            <TextInput
              style={styles.input}
              value={offerForm.max_uses}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, max_uses: text }))}
              placeholder="100"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Terms & Conditions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={offerForm.terms_conditions}
              onChangeText={(text) => setOfferForm(prev => ({ ...prev, terms_conditions: text }))}
              placeholder="Terms and conditions for this offer"
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f7ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#000',
    marginTop: 8,
    textAlign: 'center',
  },
  actionTextDisabled: {
    color: '#ccc',
  },
  offerSummary: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  offerSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  offerSummaryDiscount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  offerSummaryUses: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: '#666',
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  businessActions: {
    marginLeft: 12,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  offerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  offerBusinessName: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 12,
  },
  offerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  topOfferItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topOfferInfo: {
    flex: 1,
  },
  topOfferTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  topOfferBusiness: {
    fontSize: 12,
    color: '#666',
  },
  topOfferUses: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
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
  modalSave: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSaveDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedBusinessInfo: {
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedBusinessText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryScroll: {
    maxHeight: 80,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  categoryOptionSelected: {
    backgroundColor: '#007AFF',
  },
  categoryOptionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  categoryOptionTextSelected: {
    color: 'white',
  },
  discountTypeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  discountTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  discountTypeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  discountTypeTextActive: {
    color: 'white',
  },
});

export default MerchantScreen;