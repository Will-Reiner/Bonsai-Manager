import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Usuario } from '../types';
import { theme } from '../constants/theme';

interface UserListItemProps {
  user: Partial<Usuario>;
  onPress: () => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onPress }) => {
  // Placeholder para a imagem de perfil
  const placeholderImage = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image 
        source={{ uri: user.fotoPerfilUrl || placeholderImage }} 
        style={styles.avatar} 
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{user.nomePublico || user.nome}</Text>
        <Text style={styles.location}>{user.localidade || 'Localidade não informada'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  location: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
});

export default UserListItem;