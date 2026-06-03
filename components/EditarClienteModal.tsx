import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { C } from '../constants/theme';
import { Cliente, updateCliente } from '../db/queries';

interface Props {
  visivel: boolean;
  cliente: Cliente | null;
  onFechar: () => void;
  onSalvar: () => void;
}

export default function EditarClienteModal({ visivel, cliente, onFechar, onSalvar }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setTelefone(cliente.telefone ?? '');
      setEndereco(cliente.endereco ?? '');
    }
  }, [cliente]);

  function salvar() {
    if (!cliente || !nome.trim()) return;
    updateCliente(cliente.id, {
      nome: nome.trim(),
      telefone: telefone.trim() || undefined,
      endereco: endereco.trim() || undefined,
    });
    onSalvar();
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.sheet}>
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.titulo}>Editar cliente</Text>
              <Pressable onPress={onFechar} style={styles.btnFechar} hitSlop={12}>
                <Ionicons name="close" size={18} color={C.textDark} />
              </Pressable>
            </View>

            <ScrollView style={styles.corpo} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome do cliente"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="(00) 00000-0000"
                placeholderTextColor={C.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Endereço</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={endereco}
                onChangeText={setEndereco}
                placeholder="Rua, número, bairro..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.rodape}>
              <Pressable
                style={[styles.btnSalvar, !nome.trim() && styles.btnDesabilitado]}
                onPress={salvar}
                disabled={!nome.trim()}
              >
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  kav: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titulo: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
  btnFechar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpo: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textDark,
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.textPrimary,
    backgroundColor: C.bg,
  },
  inputMulti: { minHeight: 80, paddingTop: 12 },
  rodape: { padding: 20, paddingBottom: 28 },
  btnSalvar: {
    height: 52,
    backgroundColor: C.green,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  btnDesabilitado: { opacity: 0.4 },
  btnSalvarTexto: { fontSize: 16, fontWeight: '700', color: C.white },
});
