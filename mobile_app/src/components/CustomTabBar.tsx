import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { theme } from '../constants/theme';
import QuickActionSheet from './QuickActionSheet';

interface TabItem {
  name: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

const tabs: TabItem[] = [
  { name: 'Home', label: 'Home', icon: 'home' },
  { name: 'Collection', label: 'Coleção', icon: 'leaf' },
  { name: 'AddAction', label: '', icon: 'plus' },
  { name: 'Encyclopedia', label: 'Enciclopédia', icon: 'book-open-variant' },
  { name: 'Community', label: 'Comunidade', icon: 'account-group' },
];

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const isCenter = tab.name === 'AddAction';
          const isFocused = !isCenter && state.routes[state.index]?.name === tab.name;

          const onPress = () => {
            if (isCenter) {
              setShowActionSheet(true);
              return;
            }
            if (!isFocused) {
              navigation.navigate(tab.name);
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity key={tab.name} style={styles.centerButton} onPress={onPress} activeOpacity={0.8}>
                <View style={styles.centerCircle}>
                  <MaterialCommunityIcons name="plus" size={28} color={theme.colors.card} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={tab.name} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={tab.icon}
                size={24}
                color={isFocused ? theme.colors.primary : theme.colors.subtext}
              />
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <QuickActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        navigation={navigation}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  centerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
});

export default CustomTabBar;
