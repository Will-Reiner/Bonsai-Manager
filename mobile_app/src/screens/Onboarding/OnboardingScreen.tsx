import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { theme } from '../../constants/theme';
import { usePreferencias } from '../../context/PreferenciasContext';
import { PREFERENCIAS_DEFAULTS } from '../../types';

import OnboardingIdentificacaoScreen from './OnboardingIdentificacaoScreen';
import OnboardingRegaScreen from './OnboardingRegaScreen';
import OnboardingAdubacaoScreen from './OnboardingAdubacaoScreen';
import OnboardingAtividadesScreen from './OnboardingAtividadesScreen';
import OnboardingResumoScreen from './OnboardingResumoScreen';

const TOTAL_STEPS = 5;

const OnboardingScreen = () => {
  const { updatePreferencias } = usePreferencias();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Estado local das preferências durante o wizard
  const [localPrefs, setLocalPrefs] = useState<Record<string, string>>({
    ...PREFERENCIAS_DEFAULTS,
  });

  const handleUpdate = (chave: string, valor: string) => {
    setLocalPrefs(prev => ({ ...prev, [chave]: valor }));
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updatePreferencias({
        ...localPrefs,
        onboarding_concluido: 'true',
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar suas preferências. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <OnboardingIdentificacaoScreen
            preferences={localPrefs}
            onUpdate={handleUpdate}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <OnboardingRegaScreen
            preferences={localPrefs}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <OnboardingAdubacaoScreen
            preferences={localPrefs}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <OnboardingAtividadesScreen
            preferences={localPrefs}
            onUpdate={handleUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <OnboardingResumoScreen
            onFinish={handleFinish}
            onBack={handleBack}
            isLoading={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step && styles.dotActive,
              i < step && styles.dotCompleted,
            ]}
          />
        ))}
      </View>

      {renderStep()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.lightGray,
  },
  dotActive: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  dotCompleted: {
    backgroundColor: theme.colors.primary,
  },
});

export default OnboardingScreen;
