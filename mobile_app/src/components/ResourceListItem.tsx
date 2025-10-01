import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Recurso } from '../types';

interface ResourceListItemProps {
  recurso: Recurso;
  onEdit: () => void;
  onDelete: () => void;
}

const ResourceListItem: React.FC<ResourceListItemProps> = ({ recurso, onEdit, onDelete }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DISPONIVEL':
        return { container: styles.statusDisponivel, text: styles.statusText };
      case 'EM_FALTA':
        return { container: styles.statusEmFalta, text: styles.statusText };
      case 'ENCOMENDADO':
        return { container: styles.statusEncomendado, text: styles.statusText };
      default:
        return { container: {}, text: {} };
    }
  };

  const statusStyle = getStatusStyle(recurso.status);

  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{recurso.tipoRecurso.nome}</Text>
        <Text style={styles.details}>
          Quantidade: {recurso.quantidadeDisponivel} {recurso.unidadeMedida || ''}
        </Text>
        <View style={[styles.statusBadge, statusStyle.container]}>
          <Text style={statusStyle.text}>{recurso.status}</Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.button} onPress={onEdit}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
          <Text style={styles.buttonText}>Apagar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusDisponivel: { backgroundColor: '#28a745' },
  statusEmFalta: { backgroundColor: '#dc3545' },
  statusEncomendado: { backgroundColor: '#ffc107' },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 4,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ResourceListItem;