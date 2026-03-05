import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Props {
  preferences: Record<string, string>;
  onUpdate: (chave: string, valor: string) => void;
  onNext: () => void;
}

const OnboardingIdentificacaoScreen = ({ preferences, onUpdate, onNext }: Props) => {
  const usaIdentificador = preferences.usa_identificador === 'true';
  const usaNome = preferences.usa_nome_planta === 'true';

  const OptionCard = ({
    selected,
    label,
    description,
    icon,
    onPress,
  }: {
    selected: boolean;
    label: string;
    description: string;
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, selected && styles.iconCircleSelected]}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={selected ? '#fff' : theme.colors.primary}
        />
      </View>
      <View style={styles.optionTextContainer}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="tag-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>Identificação das Plantas</Text>
          <Text style={styles.subtitle}>Como você identifica suas plantas?</Text>
        </View>

        <View style={styles.questionGroup}>
          <Text style={styles.questionLabel}>Você usa plaquinhas com números?</Text>
          <View style={styles.optionsRow}>
            <OptionCard
              selected={usaIdentificador}
              label="Sim"
              description="Uso plaquinhas ou etiquetas"
              icon="numeric"
              onPress={() => onUpdate('usa_identificador', 'true')}
            />
            <OptionCard
              selected={!usaIdentificador}
              label="Não"
              description="Não uso identificadores"
              icon="close"
              onPress={() => onUpdate('usa_identificador', 'false')}
            />
          </View>
        </View>

        <View style={styles.questionGroup}>
          <Text style={styles.questionLabel}>Você costuma dar nomes às suas plantas?</Text>
          <View style={styles.optionsRow}>
            <OptionCard
              selected={usaNome}
              label="Sim"
              description="Dou apelidos carinhosos"
              icon="heart-outline"
              onPress={() => onUpdate('usa_nome_planta', 'true')}
            />
            <OptionCard
              selected={!usaNome}
              label="Não"
              description="Identifico pela espécie"
              icon="leaf"
              onPress={() => onUpdate('usa_nome_planta', 'false')}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
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
    marginBottom: theme.spacing.lg,
  },
  questionLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  optionsRow: {
    gap: theme.spacing.sm,
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.medium,
  },
  nextButtonText: {
    ...theme.typography.button,
    color: '#fff',
  },
});

export default OnboardingIdentificacaoScreen;
