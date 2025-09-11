import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RegistroHistorico } from '../types';

interface HistoryListItemProps {
  item: RegistroHistorico;
}

const HistoryListItem: React.FC<HistoryListItemProps> = ({ item }) => {
  const dataRealizacao = new Date(item.dataRealizacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.container}>
      <View style={styles.timelineDot} />
      <View style={styles.content}>
        <Text style={styles.activity}>{item.atividadeRealizada}</Text>
        <Text style={styles.date}>{dataRealizacao}</Text>
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
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007bff',
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