import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface UnderConstructionScreenProps {
  title?: string;
  message?: string;
}

const UnderConstructionScreen: React.FC<UnderConstructionScreenProps> = ({
  title = 'Em Construção',
  message = 'Esta funcionalidade está a ser desenvolvida. Volte em breve!',
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="hammer-wrench" size={72} color={theme.colors.accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
  },
  message: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});

export default UnderConstructionScreen;
