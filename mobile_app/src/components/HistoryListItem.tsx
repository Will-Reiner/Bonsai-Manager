import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Agenda } from '../types'; // Agora usamos o tipo Agenda
import { theme } from '../constants/theme';

// A propriedade agora espera um item do tipo Agenda
interface HistoryListItemProps {
  item: Agenda;
}

const HistoryListItem: React.FC<HistoryListItemProps> = ({ item }) => {
  // A data de realização agora é a data de conclusão
  const dataRealizacao = new Date(item.dataConcluida!).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.timelineDot} />
      <View style={styles.content}>
        {/* O nome da atividade vem da relação aninhada */}
        <Text style={styles.activity}>{item.atividade?.nome}</Text>
        <Text style={styles.date}>{dataRealizacao}</Text>
        {/* Os detalhes vêm diretamente do item da agenda */}
        {item.detalhes && <Text style={styles.details}>{item.detalhes}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
    marginLeft: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.success, // Verde para indicar sucesso
    marginRight: theme.spacing.md,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  activity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  date: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  details: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 8,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: 6,
  },
});

export default HistoryListItem;