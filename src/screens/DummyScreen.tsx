import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { dummyStyles } from '../styles/dummyStyles';

export const DummyScreen = () => {
  return (
    <View style={dummyStyles.container}>
      <View style={dummyStyles.content}>
        <View style={dummyStyles.iconContainer}>
          <Icon name="cube-outline" size={64} color="#007AFF" />
        </View>
        <Text style={dummyStyles.title}>Dummy Screen</Text>
        <Text style={dummyStyles.message}>
          This is a simple dummy screen with no navigation or menu items.
        </Text>
        <View style={dummyStyles.info}>
          <Icon name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={dummyStyles.infoText}>
            This screen can be used for testing or as a placeholder.
          </Text>
        </View>
      </View>
    </View>
  );
};

