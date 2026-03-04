import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface Props {
  preferences: Record<string, string>;
  onUpdate: (chave: string, valor: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const FREQUENCIA_OPTIONS = [
  { valor: 'SEMANAL', label: 'Semanal' },
  { valor: 'QUINZENAL', label: 'Quinzenal' },
  { valor: 'MENSAL', label: 'Mensal' },
  { valor: 'OUTRO', label: 'Outra' },
];

const TRANSPLANTE_OPTIONS = [
  { valor: '0', label: 'Não espero' },
  { valor: '10', label: '10 dias' },
  { valor: '15', label: '15 dias' },
  { valor: '20', label: '20 dias' },
  { valor: '30', label: '1 mês' },
  { valor: '60', label: '2 meses' },
  { valor: '90', label: '3 meses' },
  { valor: '180', label: '6 meses' },
];

const OnboardingAdubacaoScreen = ({ preferences, onUpdate, onNext, onBack }: Props) => {
  const adubacaoModo = preferences.adubacao_modo || 'GERAL';
  const adubacaoFrequencia = preferences.adubacao_frequencia || 'MENSAL';
  const periodoTransplante = preferences.periodo_pos_transplante_dias || '90';
  const mostraFrequencia = adubacaoModo !== 'NAO_ADUBA';

  const ChipOption = ({
    selected,
    label,
    onPress,
  }: {
    selected: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="flask-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>Adubação</Text>
          <Text style={styles.subtitle}>Como funciona sua rotina de adubação?</Text>
        </View>

        {/* Modo de adubação */}
        <View style={styles.questionGroup}>
          <Text style={styles.questionLabel}>Como você aduba suas plantas?</Text>

          <TouchableOpacity
            style={[styles.optionCard, adubacaoModo === 'GERAL' && styles.optionCardSelected]}
            onPress={() => onUpdate('adubacao_modo', 'GERAL')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, adubacaoModo === 'GERAL' && styles.iconCircleSelected]}>
              <MaterialCommunityIcons name="select-group" size={22} color={adubacaoModo === 'GERAL' ? '#fff' : theme.colors.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, adubacaoModo === 'GERAL' && styles.optionLabelSelected]}>Todas de uma vez</Text>
              <Text style={styles.optionDescription}>Adubo geral para toda a coleção</Text>
            </View>
            <View style={[styles.radio, adubacaoModo === 'GERAL' && styles.radioSelected]}>
              {adubacaoModo === 'GERAL' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, adubacaoModo === 'INDIVIDUAL' && styles.optionCardSelected]}
            onPress={() => onUpdate('adubacao_modo', 'INDIVIDUAL')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, adubacaoModo === 'INDIVIDUAL' && styles.iconCircleSelected]}>
              <MaterialCommunityIcons name="flower-outline" size={22} color={adubacaoModo === 'INDIVIDUAL' ? '#fff' : theme.colors.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, adubacaoModo === 'INDIVIDUAL' && styles.optionLabelSelected]}>Cada uma individualmente</Text>
              <Text style={styles.optionDescription}>Cada planta tem sua agenda</Text>
            </View>
            <View style={[styles.radio, adubacaoModo === 'INDIVIDUAL' && styles.radioSelected]}>
              {adubacaoModo === 'INDIVIDUAL' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, adubacaoModo === 'NAO_ADUBA' && styles.optionCardSelected]}
            onPress={() => onUpdate('adubacao_modo', 'NAO_ADUBA')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, adubacaoModo === 'NAO_ADUBA' && styles.iconCircleSelected]}>
              <MaterialCommunityIcons name="close-circle-outline" size={22} color={adubacaoModo === 'NAO_ADUBA' ? '#fff' : theme.colors.primary} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionLabel, adubacaoModo === 'NAO_ADUBA' && styles.optionLabelSelected]}>Não adubo regularmente</Text>
              <Text style={styles.optionDescription}>Não preciso rastrear adubação</Text>
            </View>
            <View style={[styles.radio, adubacaoModo === 'NAO_ADUBA' && styles.radioSelected]}>
              {adubacaoModo === 'NAO_ADUBA' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Frequência */}
        {mostraFrequencia && (
          <View style={styles.questionGroup}>
            <Text style={styles.questionLabel}>Com que frequência você aduba?</Text>
            <View style={styles.chipRow}>
              {FREQUENCIA_OPTIONS.map(opt => (
                <ChipOption
                  key={opt.valor}
                  selected={adubacaoFrequencia === opt.valor}
                  label={opt.label}
                  onPress={() => onUpdate('adubacao_frequencia', opt.valor)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Período pós-transplante */}
        <View style={styles.questionGroup}>
          <Text style={styles.questionLabel}>Após transplante, quanto tempo espera antes de adubar?</Text>
          <View style={styles.chipRow}>
            {TRANSPLANTE_OPTIONS.map(opt => (
              <ChipOption
                key={opt.valor}
                selected={periodoTransplante === opt.valor}
                label={opt.label}
                onPress={() => onUpdate('periodo_pos_transplante_dias', opt.valor)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
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
    gap: theme.spacing.sm,
  },
  questionLabel: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 15,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.primaryDark,
    fontWeight: '600',
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

export default OnboardingAdubacaoScreen;
