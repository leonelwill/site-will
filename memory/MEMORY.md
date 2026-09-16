# Site William Leonel — Memória do Projeto

> **⚠️ LEITURA OBRIGATÓRIA PARA QUALQUER IA ANTES DE CODAR.** Este arquivo define os padrões, convenções e armadilhas do projeto. Não é log cronológico — para isso, use `memory/historico_ias.md`.

---

## 🗺️ Mapa de Navegação — Leia Nesta Ordem

| Arquivo | O que contém | Quando ler |
|---------|-------------|-----------|
| **Este arquivo** (`memory/MEMORY.md`) | Regras de ouro, convenções, pitfalls e estado do sistema | Sempre, antes de codar |
| `CLAUDE.md` | Documentação técnica completa: stack, arquitetura de pastas, design system, padrões de código, SEO, API, assets | Antes de criar componente, seção, rota ou mexer em estilo |
| `AGENTS.md` | Versão compacta da documentação técnica (para agentes com contexto menor) | Alternativa ao CLAUDE.md para agentes leves |
| `memory/historico_ias.md` | Log de todas as sessões de IAs, com template de report e mapa de domínios | Antes de tocar em qualquer área — verifique quem trabalhou ali |
| `README.md` | Setup, env vars, fotos e deploy | Para onboarding e ambiente local |

---

## 🧠 REGRAS DE OURO (Anti-Frankenstein)

### 1. Antes de criar, verifique o que existe

- Consulte `memory/historico_ias.md` Seção 4 (Mapa de Domínios) para ver quem trabalhou na área
- Consulte `CLAUDE.md` para a arquitetura de pastas, componentes existentes e padrões
- **O projeto é pequeno** (~15 componentes, 1 rota, 1 API route) — leia tudo antes de agir

#### Componentes existentes que DEVEM ser reusados

| Componente | Caminho | Propósito |
|-----------|---------|-----------|
| `AnimateOnScroll` | `components/ui/AnimateOnScroll.tsx` | Wrapper Framer Motion para reveal no scroll |
| `SectionHeading` | `components/ui/SectionHeading.tsx` | Título padronizado de seção (eyebrow + title + desc) |
| `Counter` | `components/ui/Counter.tsx` | Contador animado com IntersectionObserver |
| `TurnstileWidget` | `components/ui/TurnstileWidget.tsx` | Integração client-side com Cloudflare Turnstile |
| `cn()` | `lib/utils.ts` | Merge condicional de classes (Tailwind) |
| `contactInfo` | `lib/contact.ts` | Dados centralizados de contato (nunca hardcodar telefone/email/WhatsApp) |
| `siteTheme` | `lib/theme.ts` | Config de temas com definição de logos por contexto |

### 2. Design e Identidade Visual

- **Tema do site: CLARO.** O tema está congelado em claro. Não criar dark mode.
- **Cores:** usar SOMENTE tokens CSS de `globals.css` (`brand-primary`, `brand-dark`, `brand-accent`, `brand-gold`, etc). **Nunca hardcodar hex em componentes.**
- **Regra de logo:**
  - Navbar clara → `logo_ethimos_blue.png`
  - Footer claro → `ethimos_investimentos_logo.png`
  - Bloco escuro (se existir) → `logo_ethimos_white.png`
- **Tipografia:** Montserrat local via `next/font/local` (já configurada em `layout.tsx`). Não importar fontes do Google CDN.
- **Ícones:** usar Lucide React para UI. Ícones de marca (LinkedIn, Instagram, YouTube) são SVGs inline — Lucide não os tem.

### 3. Estrutura de Código

- **Nova seção da landing?** → criar em `components/sections/NomeDaSecao.tsx`, usar template do CLAUDE.md
  - `<section id="...">` para ancoragem na Navbar
  - Container: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`
  - Espaçamento: `py-24` padrão
  - Usar `<SectionHeading>` + `<AnimateOnScroll>`
  - Registrar em `page.tsx` e, se tiver nav link, em `Navbar.tsx`
- **Novo componente atômico reutilizável?** → criar em `components/ui/`
- **Componente de layout (presente em todas as páginas)?** → criar em `components/layout/`
- **Dados de contato?** → atualizar `lib/contact.ts`, nunca duplicar em componentes
- **`"use client"`** → só quando necessário (useState, useEffect, Framer Motion, event handlers)

### 4. API / Leads

- A rota de leads é `POST /api/lead` em `app/api/lead/route.ts`
- Proteções ativas: honeypot, rate limit em memória, Turnstile opcional
- Entrega: Resend e/ou webhook (configuráveis por env)
- Em produção sem canal configurado → responde `503` (nunca perder lead silenciosamente)
- Header `Cache-Control: no-store` na resposta — nunca cachear dados de lead

### 5. Gestão da documentação

- **Sessão finalizada?** → escreva o report em `memory/historico_ias.md` (template na Seção 2)
- **Mudou a arquitetura?** → atualize `CLAUDE.md` e `AGENTS.md` para refletir o novo estado
- **MEMORY.md não é log** — não escreva blocos datados com "Sessão DD/MM" aqui

---

## ⚠️ Armadilhas Conhecidas (Pitfalls)

Estes são problemas que JÁ aconteceram ou que o projeto é suscetível a.

| Pitfall | Causa | Fix correto |
|---------|-------|-------------|
| Hex de cor hardcodado em componente | Ignorou tokens CSS | Usar `brand-primary`, `brand-dark`, etc de `globals.css` |
| Logo errada no fundo errado | Sem consultar regra de logo | Ver tabela na Regra 2 acima |
| `"use client"` desnecessário | Componente sem interatividade marcado como client | Só usar se tiver useState/useEffect/event handlers |
| SSR crash com window/document | Acesso a browser API no server component | Usar `"use client"` ou verificar `typeof window !== 'undefined'` |
| Telefone/email divergente entre seções | Hardcodou em componente em vez de usar `contact.ts` | Sempre importar de `lib/contact.ts` |
| Seção sem animação de entrada | Esqueceu `<AnimateOnScroll>` | Envolver em `<AnimateOnScroll delay={n}>` |
| Seção sem `id` para Navbar | Esqueceu `<section id="...">` | Toda seção precisa de id para ancoragem |
| Import estático de Framer Motion sem "use client" | Server Component tentando usar Framer Motion | Marcar com `"use client"` ou usar wrapper `AnimateOnScroll` |
| Build quebra em produção por CSP | Script inline ou recurso externo bloqueado | CSP definida em `next.config.ts` — verificar antes de adicionar scripts |

---

## 📦 Estado do Projeto

### Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.x |
| Linguagem | TypeScript | 5.x |
| Estilo | Tailwind CSS | 4.x |
| Animações | Framer Motion | 12.x |
| Ícones | Lucide React | 1.x |
| Runtime | React | 19.x |
| Deploy | Vercel | - |

### Seções ativas na homepage (ordem em `page.tsx`)

1. `Hero` — CTA principal com WhatsApp + diagnóstico
2. `AuthoritySection` — Números, pilares de credibilidade e processo
3. `AboutMe` — Bio com foto, citação editorial e cards de perfil
4. `Services` — 3 serviços prioritários + grade secundária
5. `ContactCTA` — Formulário de lead com qualificação leve

### Seções legacy (existem mas NÃO estão na homepage)

- `SocialProof.tsx` — Barra de contadores animados
- `Calculators.tsx` — Preview de ferramentas (lead magnet)
- `Testimonials.tsx` — Depoimentos de clientes
- `WhyEthimos.tsx` — Diferenciais e prêmios

### Variáveis de ambiente

| Variável | Obrigatória | Onde |
|----------|------------|------|
| `NEXT_PUBLIC_SITE_URL` | Sim | `http://localhost:3000` (dev) / `https://williamleonel.com.br` (prod) |
| `RESEND_API_KEY` | Sim (prod) | Painel Vercel |
| `LEAD_NOTIFICATION_EMAIL` | Sim (prod) | Painel Vercel |
| `LEAD_FROM_EMAIL` | Não | Painel Vercel |
| `LEAD_WEBHOOK_URL` | Não | Painel Vercel |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Não | Painel Vercel |
| `TURNSTILE_SECRET_KEY` | Não | Painel Vercel |

### Domínio e Deploy

- **URL produção:** `https://williamleonel.com.br`
- **Deploy:** Vercel (automático via Git)
- **Build:** `npm run build` (SSG)

---

## Roadmap (referência rápida)

1. Ativar Turnstile em produção
2. Integrar calculadoras do Zeno com captura de lead
3. Integrar leads com CRM Zeno
4. Criar páginas `/sobre` e `/calculadoras`
5. Adicionar depoimentos reais
6. Blog com conteúdo educativo
7. Medir conversão por origem
