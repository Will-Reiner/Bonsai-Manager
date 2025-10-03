import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Recurso } from '../types';
import { theme } from '../constants/theme';

interface ResourceListItemProps {
  recurso: Recurso;
  onEdit: () => void;
  onDelete: () => void;
}

const ResourceListItem: React.FC<ResourceListItemProps> = ({ recurso, onEdit, onDelete }) => {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{recurso.tipoRecurso.nome}</Text>
        <Text style={styles.details}>
          Quantidade: {recurso.quantidadeDisponivel} {recurso.unidadeMedida || ''}
        </Text>
        {recurso.observacoes && (
          <Text style={styles.observations}>{recurso.observacoes}</Text>
        )}
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
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.sm,
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
    color: theme.colors.text,
  },
  details: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  observations: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 5,
    marginVertical: 4,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ResourceListItem;