import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import api from '../../api';
import { Atividade } from '../../types';

interface Props {
  preferences: Record<string, string>;
  onUpdate: (chave: string, valor: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const OnboardingAtividadesScreen = ({ preferences, onUpdate, onNext, onBack }: Props) => {
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const gerenciaRega = preferences.gerencia_rega === 'true';

  // IDs selecionados
  let selectedIds: string[] = [];
  try {
    selectedIds = JSON.parse(preferences.atividades_rastreadas || '[]');
  } catch {
    selectedIds = [];
  }

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const response = await api.get('/atividades');
        const data: Atividade[] = response.data;
        setAtividades(data);

        // Na primeira vez, seleciona todas exceto Rega (se não gerencia)
        if (!preferences.atividades_rastreadas || preferences.atividades_rastreadas === '[]') {
          const defaultIds = data
            .filter(a => gerenciaRega || a.nome.toLowerCase() !== 'rega')
            .map(a => a.id);
          onUpdate('atividades_rastreadas', JSON.stringify(defaultIds));
        }
      } catch {
        // Silently handle error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAtividades();
  }, []);

  const toggleAtividade = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter(i => i !== id)
      : [...selectedIds, id];
    onUpdate('atividades_rastreadas', JSON.stringify(newIds));
  };

  const ATIVIDADE_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
    'poda': 'content-cut',
    'aramação': 'hook',
    'transplante': 'swap-horizontal',
    'adubação': 'flask-outline',
    'pinçamento': 'gesture-pinch',
    'tratamento fitossanitário': 'shield-bug-outline',
    'rega': 'water-outline',
    'estilização': 'palette-outline',
  };

  const getIcon = (nome: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] => {
    return ATIVIDADE_ICONS[nome.toLowerCase()] || 'checkbox-blank-circle-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={40} color={theme.colors.primary} />
          <Text style={styles.title}>Atividades</Text>
          <Text style={styles.subtitle}>Quais cuidados você quer acompanhar?</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : (
          <View style={styles.grid}>
            {atividades.map(atividade => {
              const isSelected = selectedIds.includes(atividade.id);
              return (
                <TouchableOpacity
                  key={atividade.id}
                  style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                  onPress={() => toggleAtividade(atividade.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? (
                      <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    ) : null}
                  </View>
                  <MaterialCommunityIcons
                    name={getIcon(atividade.nome)}
                    size={28}
                    color={isSelected ? theme.colors.primary : theme.colors.subtext}
                  />
                  <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                    {atividade.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  activityCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.shadows.soft,
  },
  activityCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  checkCircle: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  activityName: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.subtext,
    textAlign: 'center',
  },
  activityNameSelected: {
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

export default OnboardingAtividadesScreen;
