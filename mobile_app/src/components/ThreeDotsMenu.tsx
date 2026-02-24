import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  destructive?: boolean;
}

interface ThreeDotsMenuProps {
  items: MenuItem[];
}

const ThreeDotsMenu: React.FC<ThreeDotsMenuProps> = ({ items }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => {
                  setVisible(false);
                  item.onPress();
                }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.destructive ? theme.colors.danger : theme.colors.text}
                />
                <Text style={[styles.menuLabel, item.destructive && styles.destructiveLabel]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 90,
    paddingRight: theme.spacing.md,
  },
  menu: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    minWidth: 180,
    ...theme.shadows.elevated,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  menuLabel: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  destructiveLabel: {
    color: theme.colors.danger,
  },
});

export default ThreeDotsMenu;
