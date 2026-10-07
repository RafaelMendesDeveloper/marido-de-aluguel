import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  ChevronDown,
  Clock,
  Contact,
  MapPin,
  MessageCircle,
  Play,
  QrCode,
  Receipt,
  Smartphone,
  Wallet,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo, classesBotao, cx } from '../components/ui'
import { PROFISSOES } from '../lib/profissoes'

function rolarPara(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const RECURSOS = [
  { icone: <CalendarCheck />, titulo: 'Agenda que não deixa esquecer', texto: 'Calendário com as visitas do dia, horário e endereço. Visitas atrasadas ficam em destaque.' },
  { icone: <Zap />, titulo: 'Registro em 10 segundos', texto: 'Escolha o cliente, toque no valor, pronto. Atalhos para os serviços que você mais faz.' },
  { icone: <Wallet />, titulo: 'Saiba quem está devendo', texto: 'O total a receber aparece logo na tela inicial, separado por cliente.' },
  { icone: <QrCode />, titulo: 'Cobrança com Pix', texto: 'Uma imagem com os serviços, o total e o QR Code Pix com o valor. Envie pelo WhatsApp em um toque.' },
  { icone: <BarChart3 />, titulo: 'Financeiro sem planilha', texto: 'Quanto entrou no mês e no ano, média por serviço e seus melhores clientes.' },
  { icone: <Contact />, titulo: 'Clientes na palma da mão', texto: 'Importe da agenda do celular. WhatsApp, ligação e rota no Maps a 1 toque.' },
]

const PASSOS = [
  { titulo: 'Crie sua conta', texto: 'Nome, e-mail e senha. Sem cartão, sem pegadinha.' },
  { titulo: 'Traga seus clientes', texto: 'Importe da agenda do celular ou cole uma lista de nomes.' },
  { titulo: 'Agende e registre', texto: 'Marque as visitas e anote o valor quando terminar. O resto o Orça! calcula.' },
]

const DUVIDAS = [
  { p: 'Quanto custa?', r: 'Nada. O Orça! é gratuito.' },
  { p: 'Preciso instalar alguma coisa?', r: 'Não. Ele abre no navegador. Se quiser, toque em "Adicionar à tela inicial" e ele passa a abrir como um aplicativo, em tela cheia.' },
  { p: 'Funciona no iPhone, no Android e no computador?', r: 'Sim. Foi feito primeiro para o celular, mas no computador você ganha uma tela ampla com a agenda e o financeiro lado a lado.' },
  { p: 'Consigo trazer meus clientes do celular?', r: 'Sim. No Android você escolhe direto da agenda. No iPhone, exporte os contatos como arquivo (.vcf) e importe em um toque. Também dá para colar uma lista de nomes.' },
  { p: 'Meus dados ficam seguros?', r: 'Cada conta enxerga apenas os próprios dados — isso é garantido pelo banco de dados, não só pela tela. A senha é protegida e a conexão é criptografada.' },
]

export function Landing() {
  return (
    <div className="min-h-dvh bg-white text-ink-900">
      <Navegacao />
      <Hero />
      <Profissoes />
      <Recursos />
      <Cobranca />
      <ComoFunciona />
      <Duvidas />
      <ChamadaFinal />
      <Rodape />
    </div>
  )
}

function Navegacao() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ['recursos', 'Recursos'],
            ['como-funciona', 'Como funciona'],
            ['duvidas', 'Dúvidas'],
          ].map(([id, rotulo]) => (
            <button key={id} type="button" onClick={() => rolarPara(id)} className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50 hover:text-ink-900">
              {rotulo}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/entrar" className={classesBotao('fantasma', 'sm')}>
            Entrar
          </Link>
          <Link to="/cadastro" className={classesBotao('primario', 'sm')}>
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(34_197_94/0.16),transparent_70%),radial-gradient(40%_40%_at_10%_10%,rgb(16_185_129/0.10),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(22_27_24/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(22_27_24/0.04)_1px,transparent_1px)] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)] bg-[size:48px_48px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-10 lg:pt-24 lg:pb-28">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/20 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800 sm:text-sm">
            <span className="size-1.5 rounded-full bg-brand-500" /> Grátis · Feito para profissionais de reparos
          </span>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-extrabold tracking-tight text-ink-950 sm:text-6xl lg:text-[56px] xl:text-[64px]">
            Menos caderninho.
            <br />
            <span className="bg-linear-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">Mais serviço fechado.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600 lg:mx-0">
            O Orça! organiza suas visitas, registra cada serviço em segundos e mostra quem ainda está te devendo. Tudo no celular, sem complicação.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link to="/cadastro" className={classesBotao('primario', 'lg')}>
              Criar conta grátis <ArrowRight className="size-5" />
            </Link>
            <Link to="/entrar" className={classesBotao('secundario', 'lg')}>
              Já tenho conta
            </Link>
          </div>
          <ul className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-ink-600 lg:justify-start">
            {['Sem cartão de crédito', 'Pronto em 1 minuto', 'Celular e computador'].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check className="size-4 text-brand-600" strokeWidth={3} /> {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[340px] lg:max-w-[360px]">
          <CelularMockup />
          <div className="absolute top-24 -left-6 hidden animate-flutuar rounded-2xl border border-ink-100 bg-white p-3 shadow-elevado sm:-left-20 sm:block">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Check className="size-5" strokeWidth={3} />
              </span>
              <div>
                <p className="text-xs text-ink-500">Seu Jorge pagou</p>
                <p className="tabular text-sm font-extrabold text-ink-900">+ R$ 180,00</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-4 bottom-6 hidden animate-flutuar rounded-2xl border border-ink-100 bg-white p-3 shadow-elevado [animation-delay:1.5s] sm:-right-16 sm:block">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <CalendarCheck className="size-5" />
              </span>
              <div>
                <p className="text-xs text-ink-500">Amanhã · 09:00</p>
                <p className="text-sm font-bold text-ink-900">Instalar luminária</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Miniatura da tela inicial do app, feita em HTML (nítida em qualquer tela). */
function CelularMockup() {
  return (
    <div className="relative rounded-[2.75rem] bg-ink-900 p-2.5 shadow-[0_40px_80px_-20px_rgb(5_46_22/0.45)] ring-1 ring-ink-950">
      <div className="absolute top-2.5 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-ink-900" />
      <div className="overflow-hidden rounded-[2.25rem] bg-ink-50" aria-hidden>
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-bold text-ink-900">
          <span>9:41</span>
          <span className="tracking-widest">●●● ▮</span>
        </div>
        <div className="px-4 pt-3 pb-4">
          <p className="text-[19px] font-extrabold tracking-tight">Bom dia, Carlos</p>
          <p className="text-xs text-ink-500">Terça-feira, 6 de outubro</p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-ink-200/80 bg-white p-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                <span className="flex size-5 items-center justify-center rounded-md bg-brand-50 text-brand-600">
                  <Wallet className="size-3" />
                </span>
                Recebido hoje
              </p>
              <p className="tabular mt-1.5 text-base font-extrabold">R$ 380</p>
            </div>
            <div className="rounded-xl border border-ink-200/80 bg-white p-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold text-ink-500">
                <span className="flex size-5 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                  <Clock className="size-3" />
                </span>
                A receber
              </p>
              <p className="tabular mt-1.5 text-base font-extrabold">R$ 1.240</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-linear-to-br from-brand-700 via-brand-600 to-emerald-500 p-3 text-white">
            <p className="text-[9px] font-bold tracking-wider text-brand-100 uppercase">Próximo atendimento · Hoje</p>
            <div className="mt-1 flex items-end gap-2.5">
              <span className="tabular text-2xl font-extrabold">14:00</span>
              <div className="pb-0.5">
                <p className="text-[13px] font-bold">Dona Cida</p>
                <p className="text-[10px] text-brand-50">Trocar chuveiro</p>
              </div>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-brand-800">
                <Play className="size-2.5" fill="currentColor" /> Iniciar
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1.5 text-[10px] font-bold">
                <MapPin className="size-2.5" /> Rota
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-ink-200/80 bg-white">
            <p className="px-3 pt-2.5 pb-1 text-[11px] font-bold">Serviços de hoje</p>
            {[
              { n: 'Seu Jorge', o: 'Montar guarda-roupa', v: 'R$ 180,00', pago: true, cor: 'bg-sky-100 text-sky-800' },
              { n: 'Padaria Central', o: 'Trocar tomadas', v: 'R$ 200,00', pago: true, cor: 'bg-amber-100 text-amber-800' },
              { n: 'Marília', o: 'Desentupir pia', v: 'R$ 120,00', pago: false, cor: 'bg-rose-100 text-rose-800' },
            ].map((s) => (
              <div key={s.n} className="flex items-center gap-2 border-t border-ink-100 px-3 py-2">
                <span className={cx('flex size-6 items-center justify-center rounded-full text-[10px] font-bold', s.cor)}>{s.n[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold">{s.n}</p>
                  <p className="truncate text-[9px] text-ink-500">{s.o}</p>
                </div>
                <div className="text-right">
                  <p className={cx('tabular text-[11px] font-bold', !s.pago && 'text-amber-700')}>{s.v}</p>
                  <p className={cx('text-[8px] font-bold', s.pago ? 'text-brand-700' : 'text-amber-700')}>{s.pago ? '● Pago' : '● A receber'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-5 border-t border-ink-200/70 bg-white px-2 pt-2 pb-4 text-[8px] font-semibold text-ink-400">
          {['Início', 'Agenda', '', 'Clientes', 'Finanças'].map((r, i) =>
            r ? (
              <span key={r} className={cx('text-center', i === 0 && 'text-brand-700')}>
                <span className={cx('mx-auto mb-0.5 block size-3.5 rounded', i === 0 ? 'bg-brand-600/80' : 'bg-ink-200')} />
                {r}
              </span>
            ) : (
              <span key="mais" className="flex justify-center">
                <span className="-mt-4 flex size-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white ring-2 ring-white">+</span>
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  )
}

function Profissoes() {
  return (
    <section className="border-y border-ink-100 bg-ink-50/60">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <p className="text-center text-xs font-bold tracking-widest text-ink-400 uppercase">Feito para quem resolve</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
          {PROFISSOES.filter((p) => p.id !== 'outro').map((p) => (
            <li key={p.id} className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 shadow-card">
              {p.emoji} {p.nome}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function TituloSecao({ rotulo, titulo, texto, claro }: { rotulo: string; titulo: ReactNode; texto?: string; claro?: boolean }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className={cx('text-sm font-bold tracking-wide', claro ? 'text-brand-300' : 'text-brand-700')}>{rotulo}</p>
      <h2 className={cx('mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl', claro ? 'text-white' : 'text-ink-950')}>{titulo}</h2>
      {texto && <p className={cx('mt-4 text-lg', claro ? 'text-ink-300' : 'text-ink-600')}>{texto}</p>}
    </div>
  )
}

function Recursos() {
  return (
    <section id="recursos" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <TituloSecao
          rotulo="Recursos"
          titulo="Feito para quem passa o dia na rua"
          texto="Nada de planilha complicada. Cada tela resolve o que você precisa em dois toques — com uma mão só."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {RECURSOS.map((r) => (
            <div key={r.titulo} className="rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevado">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 [&_svg]:size-5">{r.icone}</span>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{r.titulo}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{r.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Cobranca() {
  return (
    <section className="px-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-ink-950 px-6 py-14 sm:px-12 lg:py-20">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-wide text-brand-400">Fim do fiado esquecido</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Saiba quem te deve — e cobre com Pix em um toque.</h2>
            <ul className="mt-8 space-y-4">
              {[
                'O total a receber aparece logo na tela inicial',
                'Cobrança em imagem com os serviços feitos, as datas e o total',
                'QR Code e Pix copia e cola já com o valor — o cliente só paga',
                'Recebeu? Marque como pago e o financeiro se atualiza sozinho',
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[17px] text-ink-200">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-1 shadow-2xl" aria-hidden>
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <p className="font-bold text-ink-900">Quem está devendo</p>
              <p className="tabular rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">R$ 1.240,00</p>
            </div>
            {[
              ['Marília', 'R$ 520,00 · 3 serv.', 'bg-rose-100 text-rose-800'],
              ['Condomínio Ipê', 'R$ 480,00 · 2 serv.', 'bg-violet-100 text-violet-800'],
              ['Seu Antônio', 'R$ 240,00 · 1 serv.', 'bg-teal-100 text-teal-800'],
            ].map(([n, v, cor]) => (
              <div key={n} className="flex items-center gap-3 border-t border-ink-100 px-5 py-3">
                <span className={cx('flex size-10 items-center justify-center rounded-full text-sm font-bold', cor)}>{n[0]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{n}</p>
                  <p className="tabular text-sm text-amber-700">{v}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#25d366]/12 px-3 py-2 text-sm font-bold text-[#128c4a]">
                  <MessageCircle className="size-4" /> Cobrar
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ComoFunciona() {
  return (
    <section id="como-funciona" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <TituloSecao rotulo="Como funciona" titulo="Comece a usar em 1 minuto" />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="relative rounded-2xl border border-ink-200/80 bg-white p-6 shadow-card">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-600 text-lg font-extrabold text-white shadow-marca">{i + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-ink-900">{p.titulo}</h3>
              <p className="mt-1.5 text-[15px] text-ink-600">{p.texto}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 grid gap-4 rounded-2xl border border-ink-200/80 bg-ink-50/60 p-6 sm:grid-cols-3">
          {[
            [<Smartphone key="i" />, 'Abre como app', 'Adicione à tela inicial e use em tela cheia.'],
            [<Receipt key="i" />, 'Seu histórico guardado', 'Tudo salvo na nuvem — trocou de celular, está tudo lá.'],
            [<Zap key="i" />, 'Rápido no computador', 'Atalhos de teclado: S registra serviço, A agenda.'],
          ].map(([icone, titulo, texto]) => (
            <div key={String(titulo)} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-ink-700 shadow-card [&_svg]:size-5">{icone}</span>
              <div>
                <p className="font-bold text-ink-900">{titulo}</p>
                <p className="text-sm text-ink-600">{texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Duvidas() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-ink-100 bg-ink-50/60 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <TituloSecao rotulo="Dúvidas" titulo="Perguntas frequentes" />
        <div className="mt-10 space-y-3">
          {DUVIDAS.map((d) => (
            <details key={d.p} className="group rounded-2xl border border-ink-200/80 bg-white shadow-card open:shadow-elevado">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-bold text-ink-900">
                {d.p}
                <ChevronDown className="size-5 shrink-0 text-ink-400 transition group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink-600">{d.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function ChamadaFinal() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-700 via-brand-600 to-emerald-500 px-6 py-14 text-center shadow-marca sm:px-12">
        <div className="pointer-events-none absolute -bottom-24 -left-16 size-72 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Seu próximo serviço já pode estar organizado.</h2>
        <p className="relative mx-auto mt-3 max-w-xl text-lg text-brand-50">Crie a conta agora e deixe o caderninho na gaveta.</p>
        <Link to="/cadastro" className={cx(classesBotao('escuro', 'lg'), 'relative mt-8')}>
          Criar conta grátis <ArrowRight className="size-5" />
        </Link>
      </div>
    </section>
  )
}

function Rodape() {
  return (
    <footer className="border-t border-ink-100">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] text-sm text-ink-500 sm:flex-row sm:px-6">
        <Logo />
        <p>© 2026 Orça! · Tempo é dinheiro.</p>
        <div className="flex gap-4">
          <Link to="/entrar" className="hover:text-ink-900">
            Entrar
          </Link>
          <Link to="/cadastro" className="hover:text-ink-900">
            Criar conta
          </Link>
        </div>
      </div>
    </footer>
  )
}
