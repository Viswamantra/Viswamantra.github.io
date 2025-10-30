import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LogoHeader = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/oshiro-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 60,
    height: 60,
  },
});

export default LogoHeader;
