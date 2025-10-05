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

interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price?: number;
  duration_minutes?: number;
  category: string;
  is_active: boolean;
}

const BusinessScreen = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [showCreateService, setShowCreateService] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Business form state
  const [businessForm, setBusinessForm] = useState({
    business_name: '',
    description: '',
    category: 'food',
    phone_number: '',
    email: '',
    address: '',
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration_minutes: '',
    category: 'food',
  });

  const { user, token } = useAuth();

  useEffect(() => {
    loadMyBusinesses();
  }, []);

  const loadMyBusinesses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/api/businesses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBusinesses(response.data);
      if (response.data.length > 0) {
        setSelectedBusiness(response.data[0]);
        loadBusinessServices(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessServices = async (businessId: string) => {
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/${businessId}/services`
      );
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleCreateBusiness = async () => {
    if (!businessForm.business_name.trim() || !businessForm.address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Get current location for business
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location permission is required to register a business');
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
        services: [],
      };

      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses`,
        businessData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBusinesses(prev => [...prev, response.data]);
      setSelectedBusiness(response.data);
      setShowCreateBusiness(false);
      
      // Reset form
      setBusinessForm({
        business_name: '',
        description: '',
        category: 'food',
        phone_number: '',
        email: '',
        address: '',
      });

      Alert.alert('Success', 'Business created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!selectedBusiness || !serviceForm.name.trim()) {
      Alert.alert('Error', 'Please enter service name');
      return;
    }

    setLoading(true);
    try {
      const serviceData = {
        ...serviceForm,
        price: serviceForm.price ? parseFloat(serviceForm.price) : undefined,
        duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : undefined,
      };

      const response = await axios.post(
        `${EXPO_PUBLIC_BACKEND_URL}/api/businesses/${selectedBusiness.id}/services`,
        serviceData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setServices(prev => [...prev, response.data]);
      setShowCreateService(false);
      
      // Reset form
      setServiceForm({
        name: '',
        description: '',
        price: '',
        duration_minutes: '',
        category: 'food',
      });

      Alert.alert('Success', 'Service added successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const renderBusinessCard = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={[
        styles.businessCard,
        selectedBusiness?.id === item.id && styles.businessCardSelected
      ]}
      onPress={() => {
        setSelectedBusiness(item);
        loadBusinessServices(item.id);
      }}
    >
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.business_name}</Text>
        <Text style={styles.businessCategory}>{item.category}</Text>
        <Text style={styles.businessAddress}>{item.address}</Text>
      </View>
      <Ionicons 
        name={selectedBusiness?.id === item.id ? 'checkmark-circle' : 'chevron-forward'} 
        size={20} 
        color="#007AFF" 
      />
    </TouchableOpacity>
  );

  const renderServiceCard = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceName}>{item.name}</Text>
        {item.price && (
          <Text style={styles.servicePrice}>${item.price}</Text>
        )}
      </View>
      {item.description && (
        <Text style={styles.serviceDescription}>{item.description}</Text>
      )}
      <View style={styles.serviceDetails}>
        <Text style={styles.serviceCategory}>{item.category}</Text>
        {item.duration_minutes && (
          <Text style={styles.serviceDuration}>{item.duration_minutes} min</Text>
        )}
      </View>
    </View>
  );

  if (businesses.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Business Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first business to start offering services to customers
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateBusiness(true)}
          >
            <Text style={styles.createButtonText}>Create Business</Text>
          </TouchableOpacity>
        </View>

        {/* Create Business Modal */}
        <Modal visible={showCreateBusiness} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCreateBusiness(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Create Business</Text>
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
                placeholder="Business phone number"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={businessForm.email}
                onChangeText={(text) => setBusinessForm(prev => ({ ...prev, email: text }))}
                placeholder="Business email"
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => setShowCreateBusiness(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Business List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Businesses</Text>
          <FlatList
            data={businesses}
            renderItem={renderBusinessCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.businessList}
          />
        </View>

        {/* Services Section */}
        {selectedBusiness && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Services ({selectedBusiness.business_name})
              </Text>
              <TouchableOpacity onPress={() => setShowCreateService(true)}>
                <Ionicons name="add-circle" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={services}
              renderItem={renderServiceCard}
              keyExtractor={(item) => item.id}
              style={styles.servicesList}
              ListEmptyComponent={
                <View style={styles.emptyServices}>
                  <Text style={styles.emptyServicesText}>No services yet</Text>
                  <TouchableOpacity
                    style={styles.addServiceButton}
                    onPress={() => setShowCreateService(true)}
                  >
                    <Text style={styles.addServiceButtonText}>Add Service</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Create Business Modal */}
      <Modal visible={showCreateBusiness} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateBusiness(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Business</Text>
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
              placeholder="Business phone number"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={businessForm.email}
              onChangeText={(text) => setBusinessForm(prev => ({ ...prev, email: text }))}
              placeholder="Business email"
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

      {/* Create Service Modal */}
      <Modal visible={showCreateService} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateService(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Service</Text>
            <TouchableOpacity onPress={handleCreateService} disabled={loading}>
              <Text style={[styles.modalSave, loading && styles.modalSaveDisabled]}>
                {loading ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.input}
              value={serviceForm.name}
              onChangeText={(text) => setServiceForm(prev => ({ ...prev, name: text }))}
              placeholder="Enter service name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={serviceForm.description}
              onChangeText={(text) => setServiceForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe the service"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Price ($)</Text>
            <TextInput
              style={styles.input}
              value={serviceForm.price}
              onChangeText={(text) => setServiceForm(prev => ({ ...prev, price: text }))}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={serviceForm.duration_minutes}
              onChangeText={(text) => setServiceForm(prev => ({ ...prev, duration_minutes: text }))}
              placeholder="30"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryOption,
                    serviceForm.category === cat.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => setServiceForm(prev => ({ ...prev, category: cat.id }))}
                >
                  <Ionicons name={cat.icon as any} size={20} color={serviceForm.category === cat.id ? 'white' : '#007AFF'} />
                  <Text style={[
                    styles.categoryOptionText,
                    serviceForm.category === cat.id && styles.categoryOptionTextSelected
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessList: {
    maxHeight: 120,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 200,
  },
  businessCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
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
  servicesList: {
    flex: 1,
  },
  serviceCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
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
  emptyServices: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyServicesText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  addServiceButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addServiceButtonText: {
    color: 'white',
    fontSize: 14,
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
});

export default BusinessScreen;