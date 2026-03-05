import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Props {
  preferences: Record<string, string>;
  onUpdate: (chave: string, valor: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingRegaScreen = ({ preferences, onUpdate, onNext, onBack }: Props) => {
  const gerenciaRega = preferences.gerencia_rega === 'true';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="water-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>Rega</Text>
          <Text style={styles.subtitle}>Como você gerencia a rega?</Text>
        </View>

        <View style={styles.questionGroup}>
          <Text style={styles.questionLabel}>Deseja que o app ajude a gerenciar a rega?</Text>

          <TouchableOpacity
            style={[styles.optionCard, gerenciaRega && styles.optionCardSelected]}
            onPress={() => onUpdate('gerencia_rega', 'true')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, gerenciaRega && styles.iconCircleSelected]}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={24}
                color={gerenciaRega ? '#fff' : theme.colors.primary}
              />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, gerenciaRega && styles.optionLabelSelected]}>
                Sim, quero lembretes
              </Text>
              <Text style={styles.optionDescription}>
                O app criará agendas de rega para suas plantas
              </Text>
            </View>
            <View style={[styles.radio, gerenciaRega && styles.radioSelected]}>
              {gerenciaRega && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, !gerenciaRega && styles.optionCardSelected]}
            onPress={() => onUpdate('gerencia_rega', 'false')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, !gerenciaRega && styles.iconCircleSelected]}>
              <MaterialCommunityIcons
                name="hand-wave-outline"
                size={24}
                color={!gerenciaRega ? '#fff' : theme.colors.primary}
              />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, !gerenciaRega && styles.optionLabelSelected]}>
                Não, eu rego por conta própria
              </Text>
              <Text style={styles.optionDescription}>
                Rego diariamente e não preciso de lembretes
              </Text>
            </View>
            <View style={[styles.radio, !gerenciaRega && styles.radioSelected]}>
              {!gerenciaRega && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.text} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Próximo</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  questionGroup: {
    gap: theme.spacing.sm,
  },
  questionLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  optionLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  optionLabelSelected: {
    color: theme.colors.primaryDark,
  },
  optionDescription: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
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
  nextButton: {
    flex: 2,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  nextButtonText: {
    ...theme.typography.button,
    color: '#fff',
  },
});

export default OnboardingRegaScreen;
