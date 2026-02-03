import React from 'react';
import { View, StyleSheet } from 'react-native';
import DatabaseDebug from '../components/debug/DatabaseDebug';

export default function DebugPage() {
  return (
    <View style={styles.container}>
      <DatabaseDebug />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});