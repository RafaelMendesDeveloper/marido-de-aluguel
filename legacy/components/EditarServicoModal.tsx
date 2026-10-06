import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import {
  deleteServico,
  ServicoComCliente,
  updateClienteNome,
  updateServico,
} from '../db/queries';

interface Props {
  visivel: boolean;
  servico: ServicoComCliente | null;
  onFechar: () => void;
  onSalvar: () => void;
}

export default function EditarServicoModal({ visivel, servico, onFechar, onSalvar }: Props) {
  const [clienteNome, setClienteNome] = useState('');
  const [valor, setValor] = useState('');
  const [pago, setPago] = useState(1);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (servico) {
      setClienteNome(servico.cliente.nome);
      setValor(String(servico.valor ?? ''));
      setPago(servico.pago);
      setObservacao(servico.observacao ?? '');
    }
  }, [servico]);

  function salvar() {
    if (!servico) return;
    const valorNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valorNum) || valorNum < 0) {
      Alert.alert('Valor inválido', 'Digite um valor numérico válido.');
      return;
    }
    if (clienteNome.trim() !== servico.cliente.nome) {
      updateClienteNome(servico.cliente_id, clienteNome);
    }
    updateServico(servico.id, {
      valor: valorNum,
      pago,
      observacao: observacao.trim() || null,
    });
    onSalvar();
  }

  function excluir() {
    if (!servico) return;
    Alert.alert('Excluir serviço', 'Tem certeza? Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteServico(servico.id);
          onSalvar();
        },
      },
    ]);
  }

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={onFechar}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.sheet}>
            {/* Handle indicator */}
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.titulo}>Editar serviço</Text>
              <Pressable onPress={onFechar} style={styles.btnFechar} hitSlop={12}>
                <Ionicons name="close" size={18} color={C.textDark} />
              </Pressable>
            </View>

            <ScrollView style={styles.corpo} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Cliente</Text>
              <TextInput
                style={styles.input}
                value={clienteNome}
                onChangeText={setClienteNome}
                placeholder="Nome do cliente"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
              />

              <Text style={styles.label}>Valor</Text>
              <View style={styles.inputRow}>
                <Text style={styles.prefixo}>R$</Text>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={valor}
                  onChangeText={setValor}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={C.textMuted}
                />
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                <Pressable
                  style={[styles.statusBtn, pago === 1 && styles.statusBtnPago]}
                  onPress={() => setPago(1)}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={pago === 1 ? C.green : C.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.statusBtnTexto, pago === 1 && styles.statusBtnTextoAtivoPago]}>
                    Pago
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.statusBtn, pago === 0 && styles.statusBtnPendente]}
                  onPress={() => setPago(0)}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={pago === 0 ? C.red : C.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.statusBtnTexto, pago === 0 && styles.statusBtnTextoAtivoPendente]}>
                    Pendente
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Observação</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={observacao}
                onChangeText={setObservacao}
                placeholder="Opcional..."
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={styles.rodape}>
              <Pressable style={styles.btnSalvar} onPress={salvar}>
                <Text style={styles.btnSalvarTexto}>Salvar</Text>
              </Pressable>
              <Pressable style={styles.btnExcluir} onPress={excluir}>
                <Ionicons name="trash-outline" size={14} color={C.red} />
                <Text style={styles.btnExcluirTexto}>Excluir serviço</Text>
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
  corpo: { paddingHorizontal: 20, paddingTop: 12 },
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
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefixo: { fontSize: 17, fontWeight: '600', color: C.textDark },
  inputFlex: { flex: 1 },
  inputMulti: { minHeight: 80, paddingTop: 12 },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  statusBtnPago: { backgroundColor: C.greenLight, borderColor: C.green },
  statusBtnPendente: { backgroundColor: C.redLight, borderColor: C.red },
  statusBtnTexto: { fontSize: 15, fontWeight: '600', color: C.textMuted },
  statusBtnTextoAtivoPago: { color: C.green },
  statusBtnTextoAtivoPendente: { color: C.red },
  rodape: { padding: 20, gap: 10, paddingBottom: 28 },
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
  btnSalvarTexto: { fontSize: 16, fontWeight: '700', color: C.white },
  btnExcluir: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnExcluirTexto: { fontSize: 14, color: C.red, fontWeight: '500' },
});
