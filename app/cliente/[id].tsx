import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditarServicoModal from '../../components/EditarServicoModal';
import { C } from '../../constants/theme';
import {
  getClienteById,
  getClienteServicos,
  type Cliente,
  type Servico,
  type ServicoComCliente,
} from '../../db/queries';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtData(date: string) {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

export default function ClientePerfil() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | undefined>(() => getClienteById(id));
  const [servicos, setServicos] = useState<Servico[]>(() => getClienteServicos(id));
  const [modalVisivel, setModalVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoComCliente | null>(null);

  function carregar() {
    setCliente(getClienteById(id));
    setServicos(getClienteServicos(id));
  }

  useFocusEffect(useCallback(() => { carregar(); }, [id]));

  if (!cliente) return null;

  const recebido = servicos.filter((s) => s.pago === 1).reduce((acc, s) => acc + (s.valor ?? 0), 0);
  const pendente = servicos.filter((s) => s.pago === 0).reduce((acc, s) => acc + (s.valor ?? 0), 0);

  function abrirServico(s: Servico) {
    setServicoSelecionado({ ...s, cliente: cliente! });
    setModalVisivel(true);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Perfil */}
        <View style={styles.perfil}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{cliente.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.nome}>{cliente.nome}</Text>
          {cliente.telefone ? (
            <View style={styles.telRow}>
              <Ionicons name="call-outline" size={14} color={C.textSecondary} />
              <Text style={styles.tel}>{cliente.telefone}</Text>
            </View>
          ) : null}
        </View>

        {/* Cards de resumo */}
        <View style={styles.cards}>
          <View style={[styles.card, styles.cardVerde]}>
            <Text style={styles.cardLabel}>Recebido</Text>
            <Text style={[styles.cardValor, { color: C.greenDark }]}>{fmt(recebido)}</Text>
          </View>
          <View style={[styles.card, styles.cardVermelho]}>
            <Text style={styles.cardLabel}>Pendente</Text>
            <Text style={[styles.cardValor, { color: '#991b1b' }]}>{fmt(pendente)}</Text>
          </View>
        </View>

        {/* Histórico */}
        <Text style={styles.secao}>
          Histórico · {servicos.length} serviço{servicos.length !== 1 ? 's' : ''}
        </Text>

        {servicos.length === 0 && (
          <View style={styles.vazio}>
            <Ionicons name="construct-outline" size={36} color={C.textMuted} style={styles.vazioIcone} />
            <Text style={styles.vazioTexto}>Nenhum serviço registrado</Text>
          </View>
        )}

        {servicos.map((s) => (
          <Pressable key={s.id} style={styles.item} onPress={() => abrirServico(s)}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemData}>{fmtData(s.data)}</Text>
              {s.observacao ? <Text style={styles.itemObs}>{s.observacao}</Text> : null}
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemValor}>{fmt(s.valor)}</Text>
              <View style={[styles.badge, s.pago ? styles.badgeVerde : styles.badgeVermelho]}>
                <Text style={[styles.badgeTexto, s.pago ? styles.badgeTextoVerde : styles.badgeTextoVermelho]}>
                  {s.pago ? 'Pago' : 'Pendente'}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <EditarServicoModal
        visivel={modalVisivel}
        servico={servicoSelecionado}
        onFechar={() => { setModalVisivel(false); setServicoSelecionado(null); }}
        onSalvar={() => { setModalVisivel(false); setServicoSelecionado(null); carregar(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingBottom: 48 },
  perfil: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: C.greenMid,
  },
  avatarTexto: { fontSize: 34, fontWeight: '700', color: C.green },
  nome: { fontSize: 24, fontWeight: '700', color: C.textPrimary },
  telRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  tel: { fontSize: 15, color: C.textSecondary },
  cards: { flexDirection: 'row', gap: 12, padding: 16 },
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardVerde: { backgroundColor: '#f0fdf4', borderColor: C.greenMid },
  cardVermelho: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  cardLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 6, fontWeight: '500' },
  cardValor: { fontSize: 20, fontWeight: '700', color: C.textPrimary },
  secao: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  vazio: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  vazioIcone: { marginBottom: 12 },
  vazioTexto: { fontSize: 16, color: C.textMuted, fontWeight: '500' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemData: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  itemObs: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  itemValor: { fontSize: 17, fontWeight: '700', color: C.green },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeVerde: { backgroundColor: C.greenLight },
  badgeVermelho: { backgroundColor: C.redLight },
  badgeTexto: { fontSize: 12, fontWeight: '600' },
  badgeTextoVerde: { color: C.green },
  badgeTextoVermelho: { color: C.red },
});
