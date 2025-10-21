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

interface Offer {
  id: string;
  business_id: string;
  title: string;
  description: string;
  discount_type: string;
  discount_value: number;
  original_price?: number;
  discounted_price?: number;
  image_base64?: string;
  valid_until: string;
  max_uses?: number;
  current_uses: number;
  business_info?: any;
  distance_meters?: number;
  terms_conditions?: string;
}

const OffersScreen = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_offers'>('browse');
  
  // Create offer form state
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    original_price: '',
    valid_until: '',
    max_uses: '',
    terms_conditions: '',
    image_base64: '',
  });

  const { user, token, updateLocation } = useAuth();

  useEffect(() => {
    if (activeTab === 'browse') {
      loadNearbyOffers();
    } else {
      loadMyOffers();
    }
  }, [activeTab]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        
        await updateLocation(coords.latitude, coords.longitude);
        return coords;
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
    return null;
  };

  const loadNearbyOffers = async () => {
    setLoading(true);
    try {
      const location = user?.location || await getCurrentLocation();
      if (!location) {
        Alert.alert('Location Required', 'Please enable location to view nearby offers');
        return;
      }

      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/offers/nearby`,
        {
          latitude: location.latitude,
          longitude: location.longitude,
          radius_meters: 2000, // 2km radius
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setOffers(response.data.offers || []);
    } catch (error: any) {
      console.error('Error loading nearby offers:', error);
      Alert.alert('Error', 'Failed to load nearby offers');
    } finally {
      setLoading(false);
    }
  };

  const loadMyOffers = async () => {
    if (user?.user_type !== 'business_owner') return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/offers/my`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMyOffers(response.data || []);
    } catch (error: any) {
      console.error('Error loading my offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!offerForm.title.trim() || !offerForm.description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    // Get user's first business (for demo purposes)
    try {
      const businessResponse = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/my`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const businesses = businessResponse.data;
      if (!businesses || businesses.length === 0) {
        Alert.alert('Error', 'Please create a business first before adding offers');
        return;
      }

      const businessId = businesses[0].id;

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
        image_base64: offerForm.image_base64,
      };

      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/${businessId}/offers`,
        offerData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMyOffers(prev => [...prev, response.data]);
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
        image_base64: '',
      });

      Alert.alert('Success', 'Offer created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create offer');
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% OFF`;
    } else {
      return `₹${offer.discount_value} OFF`;
    }
  };

  const renderOfferCard = ({ item }: { item: Offer }) => (
    <View style={styles.offerCard}>
      {item.image_base64 && (
        <Image
          source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }}
          style={styles.offerImage}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.offerContent}>
        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle}>{item.title}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{formatDiscount(item)}</Text>
          </View>
        </View>
        
        <Text style={styles.offerDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {item.business_info && (
          <View style={styles.businessInfo}>
            <Ionicons name="business" size={14} color="#666" />
            <Text style={styles.businessName}>{item.business_info.business_name}</Text>
            {item.distance_meters !== undefined && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={14} color="#666" />
                <Text style={styles.distanceText}>{formatDistance(item.distance_meters)}</Text>
              </View>
            )}
          </View>
        )}

        {item.original_price && item.discounted_price && (
          <View style={styles.priceContainer}>
            <Text style={styles.originalPrice}>₹{item.original_price}</Text>
            <Text style={styles.discountedPrice}>₹{item.discounted_price.toFixed(2)}</Text>
          </View>
        )}

        <View style={styles.offerFooter}>
          <View style={styles.validityContainer}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={styles.validityText}>
              Valid until {new Date(item.valid_until).toLocaleDateString()}
            </Text>
          </View>
          
          {item.max_uses && (
            <Text style={styles.usageText}>
              {item.current_uses}/{item.max_uses} used
            </Text>
          )}
        </View>

        <View style={styles.oshiroTag}>
          <Ionicons name="star" size={12} color="#007AFF" />
          <Text style={styles.oshiroText}>Exclusive for OshirO Users</Text>
        </View>
      </View>
    </View>
  );

  const renderMyOfferCard = ({ item }: { item: Offer }) => (
    <View style={styles.myOfferCard}>
      <View style={styles.offerHeader}>
        <Text style={styles.offerTitle}>{item.title}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{formatDiscount(item)}</Text>
        </View>
      </View>
      
      <Text style={styles.offerDescription}>{item.description}</Text>
      
      {item.business_info && (
        <Text style={styles.businessNameSmall}>
          {item.business_info.business_name}
        </Text>
      )}

      <View style={styles.myOfferStats}>
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offers & Deals</Text>
        {user?.user_type === 'business_owner' && activeTab === 'my_offers' && (
          <TouchableOpacity onPress={() => setShowCreateOffer(true)}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
          onPress={() => setActiveTab('browse')}
        >
          <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
            Browse Offers
          </Text>
        </TouchableOpacity>

        {user?.user_type === 'business_owner' && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my_offers' && styles.activeTab]}
            onPress={() => setActiveTab('my_offers')}
          >
            <Text style={[styles.tabText, activeTab === 'my_offers' && styles.activeTabText]}>
              My Offers
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading offers...</Text>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'browse' ? offers : myOffers}
            renderItem={activeTab === 'browse' ? renderOfferCard : renderMyOfferCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={activeTab === 'browse' ? loadNearbyOffers : loadMyOffers}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons 
                  name={activeTab === 'browse' ? 'gift-outline' : 'add-circle-outline'} 
                  size={48} 
                  color="#ccc" 
                />
                <Text style={styles.emptyStateText}>
                  {activeTab === 'browse' ? 'No offers nearby' : 'No offers created'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {activeTab === 'browse' 
                    ? 'Check back later for amazing deals'
                    : 'Create your first offer to attract customers'
                  }
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Create Offer Modal */}
      <Modal visible={showCreateOffer} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateOffer(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Offer</Text>
            <TouchableOpacity onPress={handleCreateOffer}>
              <Text style={styles.modalSave}>Create</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
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
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  offerImage: {
    width: '100%',
    height: 120,
  },
  offerContent: {
    padding: 16,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessName: {
    marginLeft: 6,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validityText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  usageText: {
    fontSize: 12,
    color: '#666',
  },
  oshiroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  oshiroText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  myOfferCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  businessNameSmall: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 12,
  },
  myOfferStats: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
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
  modalContent: {
    flex: 1,
    padding: 20,
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

export default OffersScreen;