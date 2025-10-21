import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import * as Location from 'expo-location';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'apps', color: '#666' },
  { id: 'food', name: 'Food', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'clothing', name: 'Clothing', icon: 'shirt', color: '#4ECDC4' },
  { id: 'spa', name: 'Spa', icon: 'flower', color: '#45B7D1' },
];

const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '5km', value: 5000 },
];

interface Business {
  id: string;
  business_name: string;
  category: string;
  phone_number: string;
  address: string;
  description?: string;
  rating: number;
  distance_meters: number;
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
  business_info?: any;
  distance_meters?: number;
  valid_until: string;
}

const CustomerScreen = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'offers'>('services');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState(2000);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  
  const { user, token, updateLocation } = useAuth();

  useEffect(() => {
    if (activeTab === 'services') {
      loadNearbyServices();
    } else {
      loadNearbyOffers();
    }
  }, [activeTab, selectedCategory, selectedRadius]);

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
        
        setCurrentLocation(coords);
        await updateLocation(coords.latitude, coords.longitude);
        return coords;
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
    return null;
  };

  const loadNearbyServices = async (location?: {latitude: number, longitude: number}) => {
    if (!location && !currentLocation) {
      const newLocation = await getCurrentLocation();
      if (!newLocation) {
        Alert.alert('Location Required', 'Please enable location to discover nearby services');
        return;
      }
      location = newLocation;
    }

    const coords = location || currentLocation!;
    setLoading(true);

    try {
      const categories = selectedCategory === 'all' ? undefined : [selectedCategory];
      
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/discover/nearby`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius_meters: selectedRadius,
          categories,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      let filteredBusinesses = response.data.businesses;
      
      if (searchQuery.trim()) {
        filteredBusinesses = filteredBusinesses.filter((business: Business) =>
          business.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          business.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setBusinesses(filteredBusinesses);
    } catch (error: any) {
      console.error('Error discovering services:', error);
      Alert.alert('Error', 'Failed to discover nearby services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNearbyOffers = async (location?: {latitude: number, longitude: number}) => {
    if (!location && !currentLocation) {
      const newLocation = await getCurrentLocation();
      if (!newLocation) {
        Alert.alert('Location Required', 'Please enable location to discover nearby offers');
        return;
      }
      location = newLocation;
    }

    const coords = location || currentLocation!;
    setLoading(true);

    try {
      const categories = selectedCategory === 'all' ? undefined : [selectedCategory];
      
      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/offers/nearby`,
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius_meters: selectedRadius,
          categories,
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
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getCurrentLocation().then(location => {
      if (location) {
        if (activeTab === 'services') {
          loadNearbyServices(location);
        } else {
          loadNearbyOffers(location);
        }
      } else {
        setRefreshing(false);
      }
    });
  }, [activeTab, selectedCategory, selectedRadius]);

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

  const callBusiness = (phoneNumber: string) => {
    Alert.alert('Call Business', `Contact: ${phoneNumber}\n\nNote: This is a demo. In a real app, this would open the phone dialer.`);
  };

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <View style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{item.business_name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.businessMeta}>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.distanceText}>{formatDistance(item.distance_meters)}</Text>
          </View>
          {item.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.businessDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      
      <Text style={styles.businessAddress} numberOfLines={1}>
        {item.address}
      </Text>
      
      <View style={styles.businessActions}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => callBusiness(item.phone_number)}
        >
          <Ionicons name="call" size={16} color="#007AFF" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOfferCard = ({ item }: { item: Offer }) => (
    <View style={styles.offerCard}>
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

      <View style={styles.validityContainer}>
        <Ionicons name="time" size={14} color="#666" />
        <Text style={styles.validityText}>
          Valid until {new Date(item.valid_until).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.oshiroTag}>
        <Ionicons name="star" size={12} color="#007AFF" />
        <Text style={styles.oshiroText}>Exclusive for OshirO Users</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Near You</Text>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Ionicons 
            name={loading ? 'hourglass' : 'refresh'} 
            size={24} 
            color="#007AFF" 
          />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.activeTab]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabText, activeTab === 'services' && styles.activeTabText]}>
            Services
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offers' && styles.activeTab]}
          onPress={() => setActiveTab('offers')}
        >
          <Text style={[styles.tabText, activeTab === 'offers' && styles.activeTabText]}>
            Offers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={activeTab === 'services' ? loadNearbyServices : loadNearbyOffers}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={20} 
              color={selectedCategory === category.id ? 'white' : category.color} 
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category.id && styles.categoryButtonTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Radius Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.radiusContainer}
        contentContainerStyle={styles.radiusContent}
      >
        <Text style={styles.radiusLabel}>Radius:</Text>
        {RADIUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.radiusButton,
              selectedRadius === option.value && styles.radiusButtonActive
            ]}
            onPress={() => setSelectedRadius(option.value)}
          >
            <Text style={[
              styles.radiusButtonText,
              selectedRadius === option.value && styles.radiusButtonTextActive
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {loading ? 'Searching...' : `Found ${activeTab === 'services' ? businesses.length : offers.length} ${activeTab}`}
        </Text>
      </View>

      {/* Content List */}
      <FlatList
        data={activeTab === 'services' ? businesses : offers}
        renderItem={activeTab === 'services' ? renderBusinessCard : renderOfferCard}
        keyExtractor={(item) => item.id}
        style={styles.contentList}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'services' ? 'business-outline' : 'gift-outline'} 
                size={48} 
                color="#ccc" 
              />
              <Text style={styles.emptyStateText}>
                No {activeTab} found nearby
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters or increasing the search radius
              </Text>
            </View>
          ) : null
        }
      />
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  categoryContainer: {
    maxHeight: 60,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  radiusContainer: {
    maxHeight: 50,
  },
  radiusContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 16,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  radiusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  radiusButtonActive: {
    backgroundColor: '#007AFF',
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  radiusButtonTextActive: {
    color: 'white',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  contentList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  businessMeta: {
    alignItems: 'flex-end',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  offerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  businessAddress: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  businessActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f7ff',
  },
  callButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
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
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  validityText: {
    marginLeft: 4,
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
});

export default CustomerScreen;