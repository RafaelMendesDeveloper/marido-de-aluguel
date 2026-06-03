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
import { type Cliente } from '../db/queries';

type Props = {
  visivel: boolean;
  clienteInicial?: Partial<Pick<Cliente, 'nome' | 'telefone' | 'endereco'>>;
  onFechar: () => void;
  onSalvar: (dados: { nome: string; telefone: string; endereco: string }) => void;
};

export default function NovoClienteModal({ visivel, clienteInicial, onFechar, onSalvar }: Props) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  useEffect(() => {
    if (visivel) {
      setNome(clienteInicial?.nome ?? '');
      setTelefone(clienteInicial?.telefone ?? '');
      setEndereco(clienteInicial?.endereco ?? '');
    }
  }, [visivel]);

  function handleSalvar() {
    if (!nome.trim()) return;
    onSalvar({ nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim() });
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <Pressable style={s.overlay} onPress={onFechar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.sheet}
      >
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.titulo}>
            {clienteInicial?.nome ? 'Editar cliente' : 'Novo cliente'}
          </Text>
          <Pressable onPress={onFechar} hitSlop={8}>
            <Ionicons name="close" size={24} color={C.textSecondary} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={s.label}>Nome *</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Maria Silva"
            placeholderTextColor={C.textMuted}
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            autoFocus
          />

          <Text style={s.label}>Telefone</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: (11) 99999-9999"
            placeholderTextColor={C.textMuted}
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
          />

          <Text style={s.label}>Endereço</Text>
          <TextInput
            style={[s.input, s.inputMulti]}
            placeholder="Ex: Rua das Flores, 123 - Bairro"
            placeholderTextColor={C.textMuted}
            value={endereco}
            onChangeText={setEndereco}
            multiline
            numberOfLines={2}
          />

          <Pressable
            style={[s.btnSalvar, !nome.trim() && s.btnDesabilitado]}
            onPress={handleSalvar}
            disabled={!nome.trim()}
          >
            <Text style={s.btnSalvarTexto}>Salvar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  titulo: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textDark,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: C.textPrimary,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  btnSalvar: {
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDesabilitado: { backgroundColor: '#d1d5db' },
  btnSalvarTexto: { fontSize: 17, fontWeight: '700', color: C.white },
});
