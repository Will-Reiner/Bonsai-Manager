import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Agenda } from '../types'; // Agora usamos o tipo Agenda

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
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginLeft: 10,
    marginHorizontal: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28a745', // Verde para indicar sucesso
    marginRight: 15,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  activity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  details: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
  },
});

export default HistoryListItem;