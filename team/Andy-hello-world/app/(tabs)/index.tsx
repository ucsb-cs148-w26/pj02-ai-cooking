import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World!</Text>
      <Text style={styles.subtitle}>
        Welcome to the AI Cooking Prototype
      </Text>
      <View style={styles.separator} />
      <Text style={styles.footer}>
        This is the Hello World made by Ratatouille 🐭
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  separator: {
    marginVertical: 30,
    height: 1,   
    width: '80%', 
    backgroundColor: '#eee',
  },
  footer: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic', 
    textAlign: 'center',
  }
});