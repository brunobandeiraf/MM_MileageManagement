import * as React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion'
import {
  Plane,
  ShieldCheck,
  Search,
  Sparkles,
  PlaneTakeoff,
  CheckCircle2,
  XCircle,
  Gift,
  CreditCard,
  Headset,
  ChevronDown,
  Loader2,
  Lock,
  ArrowRight,
  MessageCircle,
  Armchair,
  Sunrise,
  Wine,
  Handshake,
  ClipboardCheck,
} from 'lucide-react'
import { apiGet, apiPost } from '../../services/api'
import { formatPhone } from '../../lib/phone'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

const LOYALTY_PROGRAMS = [
  'LATAM Pass',
  'Smiles',
  'TudoAzul',
  'TAP Miles&Go',
  'AAdvantage',
  'Livelo',
  'Esfera',
  'LifeMiles',
  'Flying Blue',
  'British Airways Avios',
]

const TRUST_MARKERS = [
  { icon: Lock, text: 'Você mantém o controle total das suas contas e cartões' },
  { icon: ShieldCheck, text: 'Estratégia personalizada para o seu perfil — nunca uma fórmula genérica' },
  { icon: Headset, text: 'Atendimento direto com quem toca sua conta, sem call center' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Handshake,
    title: 'Onboarding Estratégico',
    description: 'Entendemos seu momento, seus objetivos de viagem e os cartões que você já usa para começar com o pé direito.',
  },
  {
    step: '02',
    icon: Search,
    title: 'Análise de Perfil',
    description: 'Mapeamos seus cartões, programas de fidelidade e padrão de gastos para montar a estratégia de maior retorno.',
  },
  {
    step: '03',
    icon: CreditCard,
    title: 'Acúmulo Inteligente',
    description: 'Você mantém seus gastos normais. Direcionamos cada transação para maximizar pontos e bonificações.',
  },
  {
    step: '04',
    icon: PlaneTakeoff,
    title: 'Emissão & Acompanhamento',
    description: 'Definimos a melhor rota e classe, emitimos a passagem e acompanhamos até o embarque.',
  },
  {
    step: '05',
    icon: ClipboardCheck,
    title: 'Registro de Resultados',
    description: 'Registramos cada emissão e a economia gerada, com clareza total do que a estratégia rendeu pra você.',
  },
]

const STATS = [
  { value: 250, prefix: '+', suffix: '', label: 'Clientes que já viajaram com a nossa assessoria' },
  { value: 90, prefix: '', suffix: '%', label: 'Das passagens emitidas com economia acima de 60%' },
  { value: 55, prefix: '', suffix: 'mi', label: 'Milhas otimizadas com estratégia' },
]

const STATS_IMAGE = 'https://images.unsplash.com/photo-1554123168-b400f9c806ca?auto=format&fit=crop&w=900&q=80'
const STATS_IMAGE_ALT = 'Viajante sentado observando a pista pela janela do aeroporto'

// Cada item de "Gestão Própria" é pareado (mesmo índice) com o contraponto
// correspondente em "Gestão Mundo Milhas" — mantenha os dois arrays com o
// mesmo tamanho ao editar.
const SELF_MANAGED_CONS = [
  'Horas pesquisando tarifas e disponibilidade, sem garantia de ter feito a escolha certa',
  'Milhas acumuladas que perdem valor, expiram ou nunca geram retorno real',
  'Transferências sem estratégia que desperdiçam bônus',
  'Gastos altos na executiva, sem saber se era realmente o melhor momento de emitir',
  'Pagar mais do que deveria por passagens, hotéis e serviços',
  'Preso em filas, call centers, remarcações e burocracias que atrasam sua rotina',
]

const MANAGED_PROS = [
  'Estratégia pronta e decisões baseadas em dados — sem você pesquisar nada',
  'Milhas sempre monitoradas, sem risco de perder valor ou expirar',
  'Transferências planejadas para aproveitar cada bônus disponível',
  'Emissão no momento certo, com o melhor custo-benefício em milhas',
  'Preços otimizados em passagens, hotéis e serviços relacionados',
  'Atendimento direto para remarcações e burocracias — você não lida com nada disso',
]

const INCLUDED = [
  {
    icon: PlaneTakeoff,
    title: 'Emissões Sob Demanda',
    description: 'Para você, família ou colaboradores, nos principais programas parceiros.',
  },
  {
    icon: Gift,
    title: 'Monitoramento de Oportunidades',
    description: 'Acompanhamos bonificações e promoções de transferência para otimizar cada ponto acumulado.',
  },
  {
    icon: CreditCard,
    title: 'Assessoria de Cartões',
    description: 'Orientação na escolha de cartões premium com o melhor custo-benefício em acúmulo.',
  },
  {
    icon: Headset,
    title: 'Acompanhamento Dedicado',
    description: 'Suporte próximo do primeiro contato até o embarque, em cada emissão.',
  },
]

const RESULTS_EXAMPLES = [
  {
    icon: Armchair,
    title: 'Executiva para a Europa',
    description: 'Emissão majoritariamente em milhas, por uma fração do valor de balcão em classe executiva.',
    image: 'https://images.unsplash.com/photo-1483450388369-9ed95738483c?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Passageiros em cabine de avião durante um voo',
  },
  {
    icon: Sunrise,
    title: 'Rotas internacionais frequentes',
    description: 'Acúmulo direcionado ao longo do ano viabiliza múltiplas emissões premium sem gasto extra.',
    image: 'https://images.unsplash.com/photo-1674708059513-5f77494844db?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Passageira olhando o celular durante um voo internacional',
  },
  {
    icon: Wine,
    title: 'Upgrades e salas VIP',
    description: 'Acesso a benefícios premium aproveitando o relacionamento com os programas parceiros.',
    image: 'https://images.unsplash.com/photo-1655920885311-9ff59799bfa3?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Pessoas em uma sala VIP de aeroporto com vista para a pista',
  },
]

const NEXT_STEPS = [
  { title: 'Você envia seus dados', description: 'Leva menos de 1 minuto — sem compromisso.' },
  { title: 'Analisamos seu perfil', description: 'Cruzamos gastos, cartões e programas pra estimar o potencial real.' },
  { title: 'Você recebe um plano', description: 'Conversamos por WhatsApp ou email, sem letra miúda.' },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso já ter milhas acumuladas?',
    answer: 'Não. A estratégia é montada a partir do seu padrão de gastos atual — o acúmulo começa a partir da análise de perfil.',
  },
  {
    question: 'Vocês precisam de acesso à minha conta bancária ou cartão?',
    answer: 'Não. Atuamos com orientação e emissão; você mantém o controle total das suas contas e cartões em todo momento.',
  },
  {
    question: 'Qual o investimento na gestão?',
    answer: 'Varia conforme o seu perfil e volume de gastos. Isso é definido na análise de perfil, sem compromisso.',
  },
  {
    question: 'E se eu não tiver viagens previstas no momento?',
    answer: 'Sem problema — o acúmulo estratégico pode começar agora, e você decide quando usar as milhas.',
  },
]

const SPEND_OPTIONS = [
  'Até R$ 15 mil',
  'R$ 15 mil a R$ 30 mil',
  'R$ 30 mil a R$ 50 mil',
  'Acima de R$ 50 mil',
]

const TRIPS_OPTIONS = ['Não viajo com frequência', '1 a 2', '3 a 5', '6 ou mais']

// ─── Motion variants ─────────────────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <motion.div variants={fadeUp} className="mb-12 text-center">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-muted-foreground">{description}</p>}
    </motion.div>
  )
}

function LoyaltyMarquee({ items }: { items: string[] }) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <motion.div
        className="flex w-max gap-3"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="shrink-0 rounded-full border border-border/60 px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground"
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

function StatCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const prefersReducedMotion = useReducedMotion()
  const [count, setCount] = React.useState(prefersReducedMotion ? value : 0)
  const started = React.useRef(false)

  return (
    <motion.span
      onViewportEnter={() => {
        if (started.current || prefersReducedMotion) return
        started.current = true
        const start = performance.now()
        const duration = 1600
        function tick(now: number) {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(value * eased))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }}
      viewport={{ once: true, amount: 0.6 }}
    >
      {prefix}{count}{suffix}
    </motion.span>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <motion.div variants={fadeUp} className="border-b border-border/60 py-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
        aria-expanded={open}
      >
        <span className="font-medium text-foreground">{question}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function HomePage() {
  const prefersReducedMotion = useReducedMotion()
  const [contact, setContact] = React.useState<{ email: string; phone: string } | null>(null)

  const [leadName, setLeadName] = React.useState('')
  const [leadWhatsapp, setLeadWhatsapp] = React.useState('')
  const [leadEmail, setLeadEmail] = React.useState('')
  const [leadSpend, setLeadSpend] = React.useState(SPEND_OPTIONS[0])
  const [leadTrips, setLeadTrips] = React.useState('')
  const [leadError, setLeadError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    apiGet<{ email: string; phone: string }>('/public/contact')
      .then(setContact)
      .catch(() => setContact(null))
  }, [])

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLeadError(null)
    setIsSubmitting(true)
    try {
      await apiPost('/leads', {
        name: leadName,
        whatsapp: leadWhatsapp,
        email: leadEmail,
        monthly_card_spend: leadSpend,
        trips_per_year: leadTrips || undefined,
      })
      setSubmitted(true)
    } catch (err) {
      setLeadError(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Plane className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Mundo Milhas</span>
          </Link>

          <div className="ml-auto flex items-center gap-8">
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#como-funciona" className="transition-colors hover:text-foreground">Como Funciona</a>
              <a href="#comparativo" className="transition-colors hover:text-foreground">Comparativo</a>
              <a href="#resultados" className="transition-colors hover:text-foreground">Resultados</a>
              <a href="#duvidas" className="transition-colors hover:text-foreground">Dúvidas</a>
            </nav>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 font-semibold"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-24 sm:py-32">
          {/* Decorative animated glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <motion.div
              className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-amber-500/20 blur-[120px]"
              animate={prefersReducedMotion ? undefined : { x: [0, 50, 0], y: [0, 30, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute top-32 right-1/4 h-80 w-80 rounded-full bg-amber-400/10 blur-[120px]"
              animate={prefersReducedMotion ? undefined : { x: [0, -40, 0], y: [0, -25, 0] }}
              transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <motion.div
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Para quem gasta acima de R$ 15 mil/mês no cartão
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Acúmulo de milhas não é sorte.{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                É método!
              </span>{' '}
              E o método{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                é nosso
              </span>{' '}
              para fazer suas milhas trabalharem a seu favor.
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-muted-foreground">
              Você não precisa entender de milhas, pontos ou programas de fidelidade. Nós cuidamos de
              cada etapa — da estratégia à emissão — e transformamos sua fatura em passagens premium.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group bg-amber-500 text-black hover:bg-amber-400 font-semibold px-8"
              >
                <a href="#analise-de-perfil">
                  Quero Minha Análise de Perfil
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <a
                href="#como-funciona"
                className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Ver como funciona
              </a>
            </motion.div>

            {/* Trust markers */}
            <motion.div
              variants={fadeUp}
              className="mt-14 grid w-full gap-4 border-t border-border/40 pt-10 sm:grid-cols-3"
            >
              {TRUST_MARKERS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-left">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Partner programs */}
          <Reveal className="mx-auto mt-16 max-w-4xl">
            <motion.p variants={fadeUp} className="mb-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
              Operamos nos principais programas de fidelidade
            </motion.p>
            <motion.div variants={fadeUp}>
              <LoyaltyMarquee items={LOYALTY_PROGRAMS} />
            </motion.div>
          </Reveal>
        </section>

        {/* ── Números ─────────────────────────────────────────── */}
        <section className="border-t border-border/40 px-6 py-24">
          <Reveal className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
            <motion.div variants={fadeUp} className="overflow-hidden rounded-xl">
              <img
                src={STATS_IMAGE}
                alt={STATS_IMAGE_ALT}
                loading="lazy"
                className="h-full max-h-[420px] w-full object-cover"
              />
            </motion.div>
            <div className="divide-y divide-border/60">
              {STATS.map((stat) => (
                <motion.div key={stat.label} variants={fadeUp} className="py-6 first:pt-0 last:pb-0">
                  <p className="text-4xl font-bold tracking-tight text-amber-500 sm:text-5xl">
                    <StatCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Como Funciona ───────────────────────────────────── */}
        <section id="como-funciona" className="scroll-mt-16 px-6 py-24">
          <Reveal className="mx-auto max-w-6xl">
            <SectionHeading
              title="Como Funciona a Gestão"
              description="Cinco etapas. Nenhuma delas exige tempo ou conhecimento técnico da sua parte."
            />

            {/* Animated flight path connector (desktop only) */}
            <div className="relative mx-auto mb-2 hidden h-6 max-w-5xl lg:block">
              <div className="absolute left-[10%] right-[10%] top-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              {!prefersReducedMotion && (
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2"
                  animate={{ left: ['8%', '92%', '8%'] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Plane className="h-4 w-4 rotate-90 text-amber-500" aria-hidden="true" />
                </motion.div>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
                <motion.div
                  key={step}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-xl border border-border/60 bg-card p-6"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl font-bold text-amber-500/40">{step}</span>
                    <Icon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </motion.div>
              ))}
            </div>
            <motion.div variants={fadeUp} className="mt-10 text-center">
              <Button asChild className="bg-amber-500 text-black hover:bg-amber-400 font-semibold">
                <a href="#analise-de-perfil">Solicitar Análise de Perfil</a>
              </Button>
            </motion.div>
          </Reveal>
        </section>

        {/* ── Comparativo ─────────────────────────────────────── */}
        <section id="comparativo" className="scroll-mt-16 border-t border-border/40 bg-muted/20 px-6 py-24">
          <Reveal className="mx-auto max-w-5xl">
            <SectionHeading
              title="Gestão própria vs. Gestão Mundo Milhas"
              description="A diferença entre acumular pontos no escuro e ter uma estratégia acompanhando cada centavo gasto."
            />
            <motion.div variants={fadeUp} className="overflow-hidden rounded-xl border border-border/60">
              {/* Header row */}
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="border-b border-border/60 bg-background px-5 py-4 text-sm font-semibold text-muted-foreground">
                  Gestão Própria
                </div>
                <div className="border-b border-t border-border/60 bg-amber-500/5 px-5 py-4 text-sm font-semibold text-amber-500 sm:border-t-0">
                  Gestão Mundo Milhas
                </div>
              </div>
              {/* Paired rows — each Gestão Própria item lines up with its counterpoint */}
              {SELF_MANAGED_CONS.map((item, i) => (
                <div key={item} className="grid grid-cols-1 sm:grid-cols-2">
                  <div className="flex items-start gap-2 border-b border-border/60 bg-background px-5 py-4 text-sm text-muted-foreground">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" aria-hidden="true" />
                    {item}
                  </div>
                  <div className="flex items-start gap-2 border-b border-t border-border/60 bg-amber-500/5 px-5 py-4 text-sm text-foreground sm:border-t-0">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    {MANAGED_PROS[i]}
                  </div>
                </div>
              ))}
            </motion.div>
          </Reveal>
        </section>

        {/* ── O que está incluso ──────────────────────────────── */}
        <section className="px-6 py-24">
          <Reveal className="mx-auto max-w-6xl">
            <SectionHeading
              title="O que está incluso na gestão"
              description="Tudo o que você precisa para viajar melhor — sem ocupar seu tempo."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INCLUDED.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-xl border border-border/60 bg-card p-6"
                >
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-amber-500/10">
                    <Icon className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Resultados ──────────────────────────────────────── */}
        <section id="resultados" className="scroll-mt-16 border-t border-border/40 bg-muted/20 px-6 py-24">
          <Reveal className="mx-auto max-w-6xl">
            <SectionHeading
              title="O que é possível com a gestão dedicada"
              description="O tipo de resultado que uma estratégia bem desenhada viabiliza."
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {RESULTS_EXAMPLES.map(({ icon: Icon, title, description, image, imageAlt }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="overflow-hidden rounded-xl border border-border/60 bg-background"
                >
                  <div className="relative aspect-[8/3]">
                    <img
                      src={image}
                      alt={imageAlt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0" />
                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm">
                      <Icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="mb-2 text-base font-semibold">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Lead form ───────────────────────────────────────── */}
        <section id="analise-de-perfil" className="scroll-mt-16 px-6 py-24">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <motion.p variants={fadeUp} className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-500">
                Vagas limitadas por mês
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl">
                Descubra o potencial da sua fatura
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
                Avaliamos seu padrão de gastos e apontamos o potencial de economia com a gestão dedicada.
                Sem compromisso, sem letra miúda.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 space-y-5">
                {NEXT_STEPS.map((item, i) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/40 text-sm font-semibold text-amber-500">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </Reveal>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl border border-border/60 bg-card p-6 shadow-lg sm:p-8"
            >
              {submitted ? (
                <div className="py-6 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-amber-500" aria-hidden="true" />
                  </motion.div>
                  <p className="text-lg font-semibold">Recebemos sua solicitação!</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nossa equipe vai entrar em contato pelo WhatsApp ou email informado.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lead-name">Nome Completo *</Label>
                    <Input
                      id="lead-name"
                      required
                      placeholder="Seu nome completo"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-whatsapp">WhatsApp (com DDD) *</Label>
                    <Input
                      id="lead-whatsapp"
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      value={leadWhatsapp}
                      onChange={(e) => setLeadWhatsapp(formatPhone(e.target.value))}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-email">Seu melhor E-mail *</Label>
                    <Input
                      id="lead-email"
                      type="email"
                      required
                      placeholder="email@exemplo.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-spend">Média de Gasto Mensal no Cartão *</Label>
                    <select
                      id="lead-spend"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={leadSpend}
                      onChange={(e) => setLeadSpend(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {SPEND_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-trips">Quantas viagens faz por ano? (opcional)</Label>
                    <select
                      id="lead-trips"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={leadTrips}
                      onChange={(e) => setLeadTrips(e.target.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Prefiro não informar</option>
                      {TRIPS_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {leadError && <p className="text-sm text-destructive">{leadError}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Enviando…
                      </>
                    ) : (
                      'Solicitar Análise de Perfil'
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Seus dados são usados apenas para contato sobre a análise solicitada.
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section id="duvidas" className="scroll-mt-16 border-t border-border/40 bg-muted/20 px-6 py-24">
          <Reveal className="mx-auto max-w-2xl">
            <SectionHeading title="Perguntas Frequentes" />
            <div>
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </Reveal>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Plane className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">Mundo Milhas</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Gestão de milhas para quem entende que tempo tem preço — e passagem em primeira classe também.
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Links Rápidos</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#como-funciona" className="hover:text-foreground">Como Funciona</a></li>
                <li><a href="#comparativo" className="hover:text-foreground">Comparativo</a></li>
                <li><a href="#analise-de-perfil" className="hover:text-foreground">Solicitar Análise</a></li>
                <li><Link to="/login" className="hover:text-foreground">Entrar</Link></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold">Contato</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {contact?.email && (
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    {contact.email}
                  </li>
                )}
                {contact?.phone && (
                  <li className="flex items-center gap-2">
                    <Headset className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    {contact.phone}
                  </li>
                )}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Mundo Milhas. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
