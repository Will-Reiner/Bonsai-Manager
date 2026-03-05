import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface NextCareCardProps {
  label: string;
  date: string | null;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const NextCareCard: React.FC<NextCareCardProps> = ({ label, date, icon }) => {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : '—';

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={styles.date}>{formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  date: {
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 2,
  },
});

export default NextCareCard;
