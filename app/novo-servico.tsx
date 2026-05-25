import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import {
  concluirAgendamento,
  createCliente,
  createServico,
  getAgendamentoById,
  getClienteById,
  searchClientes,
  type Cliente,
} from '../db/queries';

function valorFormatado(raw: string): string {
  if (!raw) return '';
  const n = parseInt(raw, 10) / 100;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NovoServico() {
  const { usuario } = useAuth();
  const { clienteId, agendamentoId } = useLocalSearchParams<{
    clienteId?: string;
    agendamentoId?: string;
  }>();

  const [query, setQuery] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [sugestoes, setSugestoes] = useState<Cliente[]>([]);
  const [valorRaw, setValorRaw] = useState('');
  const [pago, setPago] = useState(false);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (clienteId) {
      const c = getClienteById(clienteId);
      if (c) {
        setClienteSelecionado(c);
        setQuery(c.nome);
      }
    }

    if (agendamentoId) {
      const a = getAgendamentoById(agendamentoId);

      if(a) {
        setObservacao(a.descricao);
      }
    }
  }, [clienteId]);

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  function handleQueryChange(text: string) {
    setQuery(text);
    setClienteSelecionado(null);
    setSugestoes(text.length >= 1 && usuario ? searchClientes(text, usuario.id) : []);
  }

  function selecionarCliente(c: Cliente) {
    setClienteSelecionado(c);
    setQuery(c.nome);
    setSugestoes([]);
  }

  function handleValorChange(text: string) {
    setValorRaw(text.replace(/\D/g, ''));
  }

  function salvar() {
    if (!usuario) return;
    const valor = parseInt(valorRaw, 10) / 100;
    if (!query.trim() || valor <= 0) return;

    const cliente = clienteSelecionado ?? createCliente(query.trim(), usuario.id);
    createServico({ clienteId: cliente.id, usuarioId: usuario.id, valor, pago, observacao });

    if (agendamentoId) {
      concluirAgendamento(agendamentoId);
    }

    router.back();
  }

  const podeSalvar = query.trim().length > 0 && parseInt(valorRaw || '0', 10) > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.dataTexto}>{hoje}</Text>

          <Text style={styles.label}>Cliente</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Nome do cliente"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
            autoFocus={!clienteId}
            editable={!clienteSelecionado || !clienteId}
          />
          {sugestoes.length > 0 && (
            <View style={styles.sugestoes}>
              {sugestoes.map((c) => (
                <Pressable key={c.id} style={styles.sugestaoItem} onPress={() => selecionarCliente(c)}>
                  <Text style={styles.sugestaoTexto}>{c.nome}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {query.length > 0 && !clienteSelecionado && sugestoes.length === 0 && (
            <View style={styles.novoCliente}>
              <Text style={styles.novoClienteTexto}>+ Novo cliente: {query}</Text>
            </View>
          )}

          <Text style={styles.label}>Valor</Text>
          <TextInput
            style={styles.input}
            value={valorFormatado(valorRaw)}
            onChangeText={handleValorChange}
            placeholder="R$ 0,00"
            placeholderTextColor={C.textMuted}
            keyboardType="numeric"
            autoFocus={!!clienteId}
          />

          <Text style={styles.label}>Status</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, !pago && styles.toggleVermelho]}
              onPress={() => setPago(false)}
            >
              <Text style={[styles.toggleTexto, !pago && styles.toggleTextoAtivo]}>Pendente</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, pago && styles.toggleVerde]}
              onPress={() => setPago(true)}
            >
              <Text style={[styles.toggleTexto, pago && styles.toggleTextoAtivo]}>Pago</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Observação (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Ex: Trocar tomada, pintar quarto..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.botao, !podeSalvar && styles.botaoDesabilitado]}
            onPress={salvar}
            disabled={!podeSalvar}
          >
            <Text style={styles.botaoTexto}>Salvar serviço</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  dataTexto: { fontSize: 14, color: C.textSecondary, marginBottom: 16, textTransform: 'capitalize' },
  label: { fontSize: 13, fontWeight: '600', color: C.textDark, marginTop: 20, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: C.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inputMultiline: { minHeight: 90, paddingTop: 14 },
  sugestoes: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  sugestaoItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  sugestaoTexto: { fontSize: 16, color: C.textPrimary },
  novoCliente: {
    marginTop: 6,
    backgroundColor: C.greenLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.greenMid,
  },
  novoClienteTexto: { fontSize: 14, color: C.green, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: 12 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: 'center',
    backgroundColor: C.white,
  },
  toggleVerde: { borderColor: C.green, backgroundColor: C.greenLight },
  toggleVermelho: { borderColor: C.red, backgroundColor: C.redLight },
  toggleTexto: { fontSize: 16, fontWeight: '600', color: C.textMuted },
  toggleTextoAtivo: { color: C.textPrimary },
  botao: {
    marginTop: 36,
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: C.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  botaoDesabilitado: { backgroundColor: C.textMuted, shadowOpacity: 0 },
  botaoTexto: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: 0.3 },
});
