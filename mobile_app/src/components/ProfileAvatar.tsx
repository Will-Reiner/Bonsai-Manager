import React from 'react';
import { TouchableOpacity, Image, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { resolveMediaUri } from '../utils/resolveMediaUri';

interface ProfileAvatarProps {
  size?: number;
  imageUrl?: string | null;
  onPress?: () => void;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ size = 40, imageUrl, onPress }) => {
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const content = imageUrl ? (
    <Image
      source={{ uri: resolveMediaUri(imageUrl) }}
      style={[styles.image, containerStyle]}
    />
  ) : (
    <View style={[styles.fallback, containerStyle]}>
      <MaterialCommunityIcons name="account" size={size * 0.6} color={theme.colors.subtext} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.lightGray,
  },
  fallback: {
    backgroundColor: theme.colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileAvatar;
