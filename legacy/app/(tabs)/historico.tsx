import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EditarServicoModal from '../../components/EditarServicoModal';
import { C } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { getServicosFiltro, ServicoComCliente } from '../../db/queries';

type Filtro = 'hoje' | 'semana' | 'mes' | 'tudo';

type Secao = {
  key: string;
  title: string;
  data: ServicoComCliente[];
  total: number;
};

function formatDataSecao(data: string): string {
  const d = parseISO(data);
  const dia = format(d, 'EEE', { locale: ptBR }).replace('.', '');
  const resto = format(d, 'dd MMM yyyy', { locale: ptBR });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${resto}`;
}

function agruparPorData(itens: ServicoComCliente[]): Secao[] {
  const mapa = new Map<string, ServicoComCliente[]>();
  for (const s of itens) {
    const lista = mapa.get(s.data) ?? [];
    lista.push(s);
    mapa.set(s.data, lista);
  }
  return [...mapa.entries()].map(([data, lista]) => ({
    key: data,
    title: formatDataSecao(data),
    data: lista,
    total: lista.reduce((acc, s) => acc + (s.valor ?? 0), 0),
  }));
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'tudo', label: 'Tudo' },
];

export default function Historico() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<Filtro>('mes');
  const [secoes, setSecoes] = useState<Secao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoComCliente | null>(null);

  const recarregar = useCallback(() => {
    if (!usuario) return;
    setSecoes(agruparPorData(getServicosFiltro(filtro, usuario.id)));
  }, [filtro, usuario]);

  useFocusEffect(recarregar);

  function trocarFiltro(novoFiltro: Filtro) {
    setFiltro(novoFiltro);
    if (!usuario) return;
    setSecoes(agruparPorData(getServicosFiltro(novoFiltro, usuario.id)));
  }

  function abrirServico(servico: ServicoComCliente) {
    setServicoSelecionado(servico);
    setModalVisivel(true);
  }

  function fecharModal() {
    setModalVisivel(false);
    setServicoSelecionado(null);
  }

  function aoSalvar() {
    fecharModal();
    recarregar();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Histórico</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtroScroll}
        contentContainerStyle={styles.filtroContent}
      >
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filtroBotao, filtro === f.key && styles.filtroBotaoAtivo]}
            onPress={() => trocarFiltro(f.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filtroTexto, filtro === f.key && styles.filtroTextoAtivo]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {carregando ? (
        <ActivityIndicator size="large" color={C.green} style={styles.loading} />
      ) : secoes.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="time-outline" size={48} color={C.textMuted} style={styles.vazioIcone} />
          <Text style={styles.vazioTexto}>Nenhum serviço encontrado</Text>
          <Text style={styles.vazioSub}>Os serviços registrados aparecem aqui</Text>
        </View>
      ) : (
        <SectionList
          style={styles.lista}
          sections={secoes}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoData}>{section.title}</Text>
              <Text style={styles.secaoTotal}>{fmt(section.total)}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <TouchableOpacity
              style={[
                styles.item,
                index === 0 && styles.itemPrimeiro,
                index === section.data.length - 1 && styles.itemUltimo,
              ]}
              onPress={() => abrirServico(item)}
              activeOpacity={0.6}
            >
              <View style={styles.itemEsquerda}>
                <Text style={styles.itemCliente}>{item.cliente.nome}</Text>
                <Text style={styles.itemHora}>
                  {item.criado_em
                    ? format(new Date(item.criado_em), 'HH:mm', { locale: ptBR })
                    : item.data}
                </Text>
              </View>
              <View style={styles.itemDireita}>
                <Text style={styles.itemValor}>{fmt(item.valor ?? 0)}</Text>
                <View style={[styles.badge, item.pago === 1 ? styles.badgeVerde : styles.badgeVermelho]}>
                  <Text style={[styles.badgeTexto, item.pago === 1 ? styles.badgeTextoVerde : styles.badgeTextoVermelho]}>
                    {item.pago === 1 ? 'Pago' : 'Pendente'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          contentContainerStyle={styles.listaConteudo}
        />
      )}

      <EditarServicoModal
        visivel={modalVisivel}
        servico={servicoSelecionado}
        onFechar={fecharModal}
        onSalvar={aoSalvar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  titulo: { fontSize: 28, fontWeight: '700', color: C.textPrimary },
  filtroScroll: {
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexGrow: 0,
  },
  filtroContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  filtroBotao: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  filtroBotaoAtivo: { backgroundColor: C.green, borderColor: C.green },
  filtroTexto: { fontSize: 14, fontWeight: '600', color: C.textDark },
  filtroTextoAtivo: { color: C.white },
  loading: { flex: 1 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  vazioIcone: { marginBottom: 16 },
  vazioTexto: { fontSize: 17, fontWeight: '600', color: C.textMuted, textAlign: 'center' },
  vazioSub: { fontSize: 13, color: '#d1d5db', textAlign: 'center', marginTop: 6 },
  lista: { flex: 1 },
  listaConteudo: { paddingBottom: 32 },
  secaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  secaoData: { fontSize: 13, fontWeight: '700', color: C.textDark },
  secaoTotal: { fontSize: 13, fontWeight: '700', color: C.green },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.white,
    marginHorizontal: 16,
  },
  itemPrimeiro: { borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  itemUltimo: { borderBottomLeftRadius: 14, borderBottomRightRadius: 14, marginBottom: 4 },
  itemEsquerda: { flex: 1, marginRight: 12 },
  itemCliente: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  itemHora: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  itemDireita: { alignItems: 'flex-end', gap: 4 },
  itemValor: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeVerde: { backgroundColor: C.greenLight },
  badgeVermelho: { backgroundColor: C.redLight },
  badgeTexto: { fontSize: 12, fontWeight: '600' },
  badgeTextoVerde: { color: C.green },
  badgeTextoVermelho: { color: C.red },
  separador: { height: 1, backgroundColor: C.borderLight, marginHorizontal: 16 },
});
