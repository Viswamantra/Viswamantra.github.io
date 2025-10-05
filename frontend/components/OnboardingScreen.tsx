import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

const CATEGORIES = [
  { id: 'food', name: 'Food & Restaurants', icon: 'restaurant', color: '#FF6B6B' },
  { id: 'clothing', name: 'Clothing & Fashion', icon: 'shirt', color: '#4ECDC4' },
  { id: 'spa', name: 'Beauty & Spa', icon: 'flower', color: '#45B7D1' },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'preferences' | 'location'>('welcome');
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { updatePreferences, updateLocation, user } = useAuth();
  const navigation = useNavigation();

  const togglePreference = (categoryId: string) => {
    setSelectedPreferences(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedPreferences.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one category to continue');
      return;
    }

    setLoading(true);
    try {
      await updatePreferences(selectedPreferences);
      setStep('location');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationPermission = async () => {
    setLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to discover services near you. You can enable it later in settings.',
          [
            { text: 'Skip for now', onPress: () => navigation.navigate('Main' as never) },
            { text: 'Try again', onPress: requestLocationPermission },
          ]
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Update user location in backend
      await updateLocation(
        location.coords.latitude,
        location.coords.longitude
      );

      // Navigate to main app
      navigation.navigate('Main' as never);
      
    } catch (error: any) {
      Alert.alert('Error', 'Unable to get location. You can set it manually later.');
      navigation.navigate('Main' as never);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcome = () => (
    <View style={styles.content}>
      <View style={styles.welcomeHeader}>
        <View style={styles.logoContainer}>
          <Ionicons name="location" size={48} color="#007AFF" />
        </View>
        <Text style={styles.welcomeTitle}>Welcome to SheshA!</Text>
        <Text style={styles.welcomeSubtitle}>
          Discover amazing food, clothing, and spa services right around you
        </Text>
      </View>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Ionicons name="location-outline" size={24} color="#007AFF" />
          <Text style={styles.featureText}>Find services near your location</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="notifications-outline" size={24} color="#007AFF" />
          <Text style={styles.featureText}>Get notified about nearby offers</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="star-outline" size={24} color="#007AFF" />
          <Text style={styles.featureText}>Discover highly rated businesses</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={() => setStep('preferences')}
      >
        <Text style={styles.continueButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>What interests you?</Text>
        <Text style={styles.subtitle}>
          Select the types of services you'd like to discover
        </Text>
      </View>

      <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedPreferences.includes(category.id) && styles.categoryCardSelected
            ]}
            onPress={() => togglePreference(category.id)}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={28} color="white" />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              {selectedPreferences.includes(category.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Text style={styles.selectedCount}>
          {selectedPreferences.length} categories selected
        </Text>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSavePreferences}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocation = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.locationIconContainer}>
          <Ionicons name="location" size={48} color="#007AFF" />
        </View>
        <Text style={styles.title}>Enable Location</Text>
        <Text style={styles.subtitle}>
          Allow SheshA to access your location to discover services near you
        </Text>
      </View>

      <View style={styles.locationBenefits}>
        <View style={styles.benefitItem}>
          <Ionicons name="navigate-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.benefitText}>Automatic service discovery</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="time-outline" size={24} color="#007AFF" />
          <Text style={styles.benefitText}>Real-time location updates</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
          <Text style={styles.benefitText}>Your privacy is protected</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={requestLocationPermission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Enable Location</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={() => navigation.navigate('Main' as never)}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {step === 'welcome' && renderWelcome()}
        {step === 'preferences' && renderPreferences()}
        {step === 'location' && renderLocation()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
  categoriesContainer: {
    flex: 1,
    marginBottom: 20,
  },
  categoryCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  categoryCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f7ff',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  locationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  locationBenefits: {
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  benefitText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  selectedCount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OnboardingScreen;