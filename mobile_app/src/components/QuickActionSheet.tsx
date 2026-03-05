import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { theme } from '../constants/theme';

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
}

const actions = [
  {
    key: 'addPlant',
    label: 'Adicionar Planta',
    icon: 'plus-circle' as const,
    color: theme.colors.primary,
  },
  {
    key: 'addPhoto',
    label: 'Adicionar Foto',
    icon: 'camera' as const,
    color: theme.colors.accent,
  },
  {
    key: 'addCare',
    label: 'Registrar Intervenção',
    icon: 'calendar-plus' as const,
    color: theme.colors.warning,
  },
];

const QuickActionSheet: React.FC<QuickActionSheetProps> = ({ visible, onClose, navigation }) => {
  const handleAction = async (key: string) => {
    onClose();
    switch (key) {
      case 'addPlant':
        navigation.navigate('AddPlant');
        break;
      case 'addPhoto': {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Precisamos de acesso à galeria.');
          return;
        }
        // Abre o image picker — usuário precisa selecionar planta depois
        // Por ora navega para AddPlant como fallback
        Alert.alert('Foto', 'Selecione uma planta primeiro para adicionar fotos, via a tela de detalhes da planta.');
        break;
      }
      case 'addCare':
        navigation.navigate('Tasks', { openIntervention: true });
        break;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Ação Rápida</Text>
          {actions.map(action => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionRow}
              onPress={() => handleAction(action.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: action.color + '15' }]}>
                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl + 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
});

export default QuickActionSheet;
