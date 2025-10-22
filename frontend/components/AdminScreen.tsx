import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface AdminStats {
  total_customers: number;
  total_merchants: number;
  total_businesses: number;
  total_offers: number;
  total_purchases: number;
  total_revenue: number;
  total_sales_volume: number;
  total_discounts_given: number;
  active_users_today: number;
  popular_categories: Array<{ category: string; count: number }>;
}

interface Purchase {
  id: string;
  customer_info: { phone: string };
  business_info: { name: string; category: string };
  final_amount: number;
  oshiro_revenue: number;
  purchase_date: string;
  discount_amount?: number;
}

const AdminScreen = () => {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<Purchase[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'merchants'>('dashboard');
  const [customers, setCustomers] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);

  const authenticateAdmin = async () => {
    if (!adminKey.trim()) {
      Alert.alert('Error', 'Please enter admin key');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/admin/stats?admin_key=${adminKey}`
      );
      
      setStats(response.data);
      setIsAuthenticated(true);
      await loadRecentActivity();
    } catch (error: any) {
      Alert.alert('Access Denied', 'Invalid admin key');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    if (!adminKey) return;
    
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/admin/recent-activity?admin_key=${adminKey}&limit=20`
      );
      
      setRecentActivity(response.data.recent_purchases || []);
      setTodayRevenue(response.data.total_oshiro_revenue_today || 0);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadCustomers = async () => {
    if (!adminKey) return;
    
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/admin/customers?admin_key=${adminKey}&limit=100`
      );
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadMerchants = async () => {
    if (!adminKey) return;
    
    try {
      const response = await axios.get(
        `${EXPO_PUBLIC_BACKEND_URL}/api/admin/merchants?admin_key=${adminKey}&limit=100`
      );
      setMerchants(response.data.merchants || []);
    } catch (error) {
      console.error('Error loading merchants:', error);
    }
  };

  const onRefresh = async () => {
    if (!isAuthenticated) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        authenticateAdmin(),
        loadRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.authHeader}>
            <Ionicons name="shield-checkmark" size={64} color="#007AFF" />
            <Text style={styles.authTitle}>OshirO Admin Panel</Text>
            <Text style={styles.authSubtitle}>
              Enter admin key to access dashboard
            </Text>
          </View>

          <View style={styles.authForm}>
            <TextInput
              style={styles.adminKeyInput}
              placeholder="Admin Key"
              value={adminKey}
              onChangeText={setAdminKey}
              secureTextEntry
              autoCapitalize="none"
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={authenticateAdmin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.authButtonText}>Access Dashboard</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.authFooter}>
            <Text style={styles.authFooterText}>
              OshirO Team Only • Contact Support: +917386361725
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity
          onPress={() => {
            setIsAuthenticated(false);
            setAdminKey('');
            setStats(null);
            setRecentActivity([]);
          }}
        >
          <Ionicons name="log-out" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons name="stats-chart" size={20} color={activeTab === 'dashboard' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => {
            setActiveTab('customers');
            loadCustomers();
          }}
        >
          <Ionicons name="people" size={20} color={activeTab === 'customers' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>Customers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'merchants' && styles.activeTab]}
          onPress={() => {
            setActiveTab('merchants');
            loadMerchants();
          }}
        >
          <Ionicons name="business" size={20} color={activeTab === 'merchants' ? '#007AFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'merchants' && styles.activeTabText]}>Merchants</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'dashboard' && (
        <View>
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Ionicons name="people" size={24} color="#4CAF50" />
              <Text style={styles.metricValue}>{stats?.total_customers || 0}</Text>
              <Text style={styles.metricLabel}>Customers</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="business" size={24} color="#2196F3" />
              <Text style={styles.metricValue}>{stats?.total_merchants || 0}</Text>
              <Text style={styles.metricLabel}>Merchants</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="storefront" size={24} color="#FF9800" />
              <Text style={styles.metricValue}>{stats?.total_businesses || 0}</Text>
              <Text style={styles.metricLabel}>Businesses</Text>
            </View>
            <View style={styles.metricCard}>
              <Ionicons name="gift" size={24} color="#E91E63" />
              <Text style={styles.metricValue}>{stats?.total_offers || 0}</Text>
              <Text style={styles.metricLabel}>Active Offers</Text>
            </View>
          </View>
        </View>

        {/* Revenue Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Analytics</Text>
          <View style={styles.revenueCard}>
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Today's OshirO Revenue</Text>
                <Text style={styles.revenueValue}>{formatCurrency(todayRevenue)}</Text>
              </View>
              <Ionicons name="trending-up" size={24} color="#4CAF50" />
            </View>
            
            <View style={styles.revenueDivider} />
            
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Total OshirO Revenue (2%)</Text>
                <Text style={styles.revenueTotalValue}>{formatCurrency(stats?.total_revenue || 0)}</Text>
              </View>
            </View>
            
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueSubLabel}>Total Sales Volume</Text>
                <Text style={styles.revenueSubValue}>{formatCurrency(stats?.total_sales_volume || 0)}</Text>
              </View>
            </View>
            
            <View style={styles.revenueRow}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueSubLabel}>Total Customer Savings</Text>
                <Text style={styles.revenueSubValue}>{formatCurrency(stats?.total_discounts_given || 0)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Activity Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Overview</Text>
          <View style={styles.activityGrid}>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{stats?.total_purchases || 0}</Text>
              <Text style={styles.activityLabel}>Total Transactions</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>{stats?.active_users_today || 0}</Text>
              <Text style={styles.activityLabel}>Active Today</Text>
            </View>
            <View style={styles.activityCard}>
              <Text style={styles.activityValue}>
                {stats?.total_purchases ? ((stats.total_revenue / stats.total_sales_volume) * 100).toFixed(1) : '0'}%
              </Text>
              <Text style={styles.activityLabel}>Revenue Share</Text>
            </View>
          </View>
        </View>

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.categoriesContainer}>
            {stats?.popular_categories?.map((category, index) => (
              <View key={category.category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryCount}>{category.count} businesses</Text>
                </View>
                <View style={styles.categoryRank}>
                  <Text style={styles.categoryRankText}>#{index + 1}</Text>
                </View>
              </View>
            )) || []}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.transactionsContainer}>
            {recentActivity.map((purchase) => (
              <View key={purchase.id} style={styles.transactionItem}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionBusiness}>
                      {purchase.business_info?.name || 'Unknown Business'}
                    </Text>
                    <Text style={styles.transactionCustomer}>
                      Customer: {purchase.customer_info?.phone || 'Unknown'}
                    </Text>
                  </View>
                  <View style={styles.transactionAmounts}>
                    <Text style={styles.transactionAmount}>
                      {formatCurrency(purchase.final_amount)}
                    </Text>
                    <Text style={styles.transactionFee}>
                      +{formatCurrency(purchase.oshiro_revenue)} fee
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionFooter}>
                  <Text style={styles.transactionCategory}>
                    {purchase.business_info?.category || 'general'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(purchase.purchase_date)}
                  </Text>
                </View>
                
                {purchase.discount_amount && (
                  <View style={styles.discountInfo}>
                    <Ionicons name="pricetag" size={12} color="#4CAF50" />
                    <Text style={styles.discountText}>
                      {formatCurrency(purchase.discount_amount)} saved
                    </Text>
                  </View>
                )}
              </View>
            ))}
            
            {recentActivity.length === 0 && (
              <View style={styles.emptyTransactions}>
                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTransactionsText}>No transactions yet</Text>
              </View>
            )}
          </View>
        </View>
        </View>
        )}

        {/* Customers List */}
        {activeTab === 'customers' && (
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>All Customers ({customers.length})</Text>
              <Text style={styles.listSubtitle}>View customer phone numbers and details</Text>
            </View>
            {customers.map((customer, index) => (
              <View key={customer.id || index} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <Ionicons name="person-circle" size={32} color="#007AFF" />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{customer.name || 'Customer'}</Text>
                    <Text style={styles.listItemPhone}>{customer.phone_number || customer.email}</Text>
                    {customer.preferences && customer.preferences.length > 0 && (
                      <Text style={styles.listItemPrefs}>
                        Interests: {customer.preferences.join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.verificationBadges}>
                  {customer.is_phone_verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.verifiedText}>Phone</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {customers.length === 0 && (
              <View style={styles.emptyList}>
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text style={styles.emptyListText}>No customers yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Merchants List */}
        {activeTab === 'merchants' && (
          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>All Merchants ({merchants.length})</Text>
              <Text style={styles.listSubtitle}>View merchant details and businesses</Text>
            </View>
            {merchants.map((merchant, index) => (
              <View key={merchant.id || index} style={styles.merchantItem}>
                <View style={styles.listItemHeader}>
                  <Ionicons name="business" size={32} color="#4CAF50" />
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{merchant.name || 'Merchant'}</Text>
                    <Text style={styles.listItemPhone}>{merchant.phone_number || merchant.email}</Text>
                    <Text style={styles.merchantBusinessCount}>
                      {merchant.total_businesses} business(es)
                    </Text>
                  </View>
                </View>
                {merchant.businesses && merchant.businesses.length > 0 && (
                  <View style={styles.businessList}>
                    {merchant.businesses.map((business: any, idx: number) => (
                      <View key={idx} style={styles.businessCard}>
                        <Text style={styles.businessName}>• {business.name}</Text>
                        <Text style={styles.businessCategory}>{business.category}</Text>
                        <Text style={styles.businessContact}>{business.contact}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
            {merchants.length === 0 && (
              <View style={styles.emptyList}>
                <Ionicons name="business-outline" size={64} color="#ccc" />
                <Text style={styles.emptyListText}>No merchants yet</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  authForm: {
    marginBottom: 40,
  },
  adminKeyInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 20,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  authFooter: {
    alignItems: 'center',
  },
  authFooterText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
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
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  revenueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  revenueItem: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  revenueTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  revenueSubLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  revenueSubValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activityValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    color: '#666',
  },
  categoryRank: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryRankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionsContainer: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionBusiness: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  transactionCustomer: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  transactionFee: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'capitalize',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  discountText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTransactionsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
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
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  listHeader: {
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  listSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  listItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  listItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  listItemPhone: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  listItemPrefs: {
    fontSize: 13,
    color: '#666',
  },
  verificationBadges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  merchantItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  merchantBusinessCount: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  businessList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  businessCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 13,
    color: '#007AFF',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  businessContact: {
    fontSize: 13,
    color: '#666',
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

export default AdminScreen;