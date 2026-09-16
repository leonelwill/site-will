# Site William Leonel — Guia para Agentes

> **Este arquivo é auto-carregado por agentes (Codex, etc).** Ele não contém a documentação técnica completa — serve como ponteiro para os arquivos corretos.

## Leitura obrigatória antes de codar

1. **`memory/MEMORY.md`** — Regras de ouro anti-Frankenstein, pitfalls, estado do projeto
2. **`CLAUDE.md`** — Documentação técnica completa: stack, arquitetura, design system, padrões de código, API, assets
3. **`memory/historico_ias.md`** — Log de sessões de IAs + Mapa de Domínios (Seção 4: veja quem trabalhou na área)

## Ao finalizar sua sessão

- Registre seu report em `memory/historico_ias.md` usando o template da Seção 2.1
- Atualize o Mapa de Domínios (Seção 4) com o domínio que tocou
- Se mudou algo estrutural, atualize `CLAUDE.md` para refletir

## Referência rápida

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| Estilo | Tailwind CSS 4 |
| Animações | Framer Motion 12 |
| Deploy | Vercel |

**Estrutura:** `src/components/sections/` (seções da landing) · `src/components/ui/` (componentes reutilizáveis) · `src/components/layout/` (Navbar, Footer, StickyContactBar) · `src/lib/contact.ts` (dados de contato centralizados — nunca hardcodar)

**Cores:** usar tokens CSS de `globals.css` (`brand-primary`, `brand-dark`, `brand-accent`, `brand-gold`). Nunca hardcodar hex.

**Tema:** CLARO (congelado). Não criar dark mode.
