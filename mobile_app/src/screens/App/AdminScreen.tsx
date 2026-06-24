import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ManageEspeciesScreen from '../Admin/ManageEspeciesScreen';
import ManageAtividadesScreen from '../Admin/ManageAtividadesScreen';
import ManageTiposRecursoScreen from '../Admin/ManageTiposRecursoScreen';
import { theme } from '../../constants/theme';

type AdminSection = 'especies' | 'atividades' | 'recursos';

interface SegmentDef {
  key: AdminSection;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const SEGMENTS: SegmentDef[] = [
  { key: 'especies', label: 'Espécies', icon: 'sprout' },
  { key: 'atividades', label: 'Atividades', icon: 'tools' },
  { key: 'recursos', label: 'Recursos', icon: 'package-variant' },
];

const AdminScreen = () => {
  const [active, setActive] = useState<AdminSection>('especies');

  return (
    <View style={styles.container}>
      <View style={styles.segmentBar}>
        {SEGMENTS.map((segment) => {
          const isActive = active === segment.key;
          return (
            <TouchableOpacity
              key={segment.key}
              style={[styles.segment, isActive && styles.segmentActive]}
              onPress={() => setActive(segment.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={segment.icon}
                size={20}
                color={isActive ? theme.colors.card : theme.colors.primary}
              />
              <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>
                {segment.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {active === 'especies' && <ManageEspeciesScreen />}
        {active === 'atividades' && <ManageAtividadesScreen />}
        {active === 'recursos' && <ManageTiposRecursoScreen />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  segmentBar: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  segmentLabelActive: {
    color: theme.colors.card,
  },
  content: {
    flex: 1,
  },
});

export default AdminScreen;
