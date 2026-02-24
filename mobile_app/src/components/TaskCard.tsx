import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface TaskCardProps {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
  count: number;
  urgent?: boolean;
  onPress?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ icon, text, count, urgent = false, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.container, urgent && styles.urgentContainer]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, urgent && styles.urgentIcon]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={urgent ? theme.colors.urgent : theme.colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={1}>{text}</Text>
        <Text style={[styles.count, urgent && styles.urgentCount]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    ...theme.shadows.soft,
  },
  urgentContainer: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.urgent,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  urgentIcon: {
    backgroundColor: '#FDEAEA',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  count: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  urgentCount: {
    color: theme.colors.urgent,
  },
});

export default TaskCard;
