import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { createAgendamento, createCliente, searchClientes, type Cliente } from '../db/queries';

function fmtData(d: Date) {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function fmtHora(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function NovoAgendamento() {
  const { usuario } = useAuth();
  const [query, setQuery] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [sugestoes, setSugestoes] = useState<Cliente[]>([]);
  const [descricao, setDescricao] = useState('');

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(9, 0, 0, 0);

  const [data, setData] = useState(amanha);
  const [hora, setHora] = useState(amanha);
  const [showData, setShowData] = useState(false);
  const [showHora, setShowHora] = useState(false);

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

  function salvar() {
    if (!usuario || !query.trim() || !descricao.trim()) return;
    const cliente = clienteSelecionado ?? createCliente(query.trim(), usuario.id);
    createAgendamento({
      clienteId: cliente.id,
      usuarioId: usuario.id,
      data: toISO(data),
      hora: toHHMM(hora),
      descricao,
    });
    router.back();
  }

  const podeSalvar = query.trim().length > 0 && descricao.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.label}>Cliente</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Nome do cliente"
            placeholderTextColor={C.textMuted}
            autoCapitalize="words"
            autoFocus
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

          <Text style={styles.label}>Data</Text>
          <Pressable style={styles.seletor} onPress={() => { setShowHora(false); setShowData(!showData); }}>
            <Text style={styles.seletorTexto}>{fmtData(data)}</Text>
            <Text style={styles.seletorIcone}>📅</Text>
          </Pressable>
          {showData && (
            <DateTimePicker
              value={data}
              mode="date"
              display="default"
              minimumDate={new Date()}
              locale="pt-BR"
              onChange={(event, selected) => {
                setShowData(false);
                if (event.type === 'set' && selected) setData(selected);
              }}
            />
          )}

          <Text style={styles.label}>Hora</Text>
          <Pressable style={styles.seletor} onPress={() => { setShowData(false); setShowHora(!showHora); }}>
            <Text style={styles.seletorTexto}>{fmtHora(hora)}</Text>
            <Text style={styles.seletorIcone}>🕐</Text>
          </Pressable>
          {showHora && (
            <DateTimePicker
              value={hora}
              mode="time"
              display="default"
              is24Hour
              locale="pt-BR"
              onChange={(event, selected) => {
                setShowHora(false);
                if (event.type === 'set' && selected) setHora(selected);
              }}
            />
          )}

          <Text style={styles.label}>Serviço</Text>
          <TextInput
            style={styles.input}
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Ex: Trocar registro, instalar chuveiro..."
            placeholderTextColor={C.textMuted}
            autoCapitalize="sentences"
          />

          <Pressable
            style={[styles.botao, !podeSalvar && styles.botaoDesabilitado]}
            onPress={salvar}
            disabled={!podeSalvar}
          >
            <Text style={styles.botaoTexto}>Agendar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 20, paddingBottom: 48 },
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
  seletor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  seletorTexto: { fontSize: 17, color: C.textPrimary, textTransform: 'capitalize' },
  seletorIcone: { fontSize: 20 },
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
