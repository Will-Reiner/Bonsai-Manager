import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../constants/theme';

/**
 * Rótulo fixo de um campo de formulário. Fica visível mesmo depois que o
 * usuário começa a digitar (ao contrário do placeholder, que desaparece).
 */
export const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <Text style={styles.label}>
    {label}
    {required ? <Text style={styles.required}> *</Text> : null}
  </Text>
);

/**
 * Título de seção para agrupar campos em formulários longos.
 */
export const FormSectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

interface LabeledInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  hint?: string;
  /** Mensagem de aviso/erro. Quando presente, destaca o campo em vermelho. */
  warning?: string;
}

/**
 * Campo de texto com rótulo fixo acima. Suporta `multiline` (vira área de texto),
 * uma dica opcional (`hint`) e uma mensagem de `warning` (destaca em vermelho).
 */
export const LabeledInput: React.FC<LabeledInputProps> = ({
  label,
  required,
  hint,
  warning,
  multiline,
  style,
  ...rest
}) => (
  <View style={styles.field}>
    <FieldLabel label={label} required={required} />
    <TextInput
      style={[styles.input, multiline && styles.textArea, !!warning && styles.inputError, style]}
      placeholderTextColor={theme.colors.subtext}
      multiline={multiline}
      {...rest}
    />
    {warning ? (
      <Text style={styles.warning}>{warning}</Text>
    ) : hint ? (
      <Text style={styles.hint}>{hint}</Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  required: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: 8,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    fontSize: 16,
    color: theme.colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
  },
  hint: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  warning: {
    fontSize: 12,
    color: theme.colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default LabeledInput;
