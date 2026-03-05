import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Props {
  onFinish: () => void;
  onBack: () => void;
  isLoading: boolean;
}

const OnboardingResumoScreen = ({ onFinish, onBack, isLoading }: Props) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="check-circle" size={80} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Tudo pronto!</Text>
          <Text style={styles.subtitle}>
            Sua experiência foi personalizada de acordo com suas preferências.
          </Text>
          <Text style={styles.hint}>
            Você pode alterar estas preferências a qualquer momento nas Configurações.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.text} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.buttonDisabled]}
          onPress={onFinish}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.startButtonText}>Começar</Text>
              <MaterialCommunityIcons name="rocket-launch-outline" size={22} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  hint: {
    ...theme.typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    ...theme.typography.button,
    color: theme.colors.text,
  },
  startButton: {
    flex: 2,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.elevated,
  },
  startButtonText: {
    ...theme.typography.button,
    color: '#fff',
    fontSize: 18,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
});

export default OnboardingResumoScreen;
