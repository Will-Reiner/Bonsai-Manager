import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface StatItem {
  label: string;
  value: string | number;
}

interface StatisticsCardProps {
  stats: StatItem[];
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statItem}>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    justifyContent: 'space-around',
    ...theme.shadows.soft,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  label: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default StatisticsCard;
