# Histórico de IAs — Site William Leonel

> **Propósito:** registro oficial e rastreável de todas as sessões de trabalho das IAs no projeto.
> Toda IA que trabalhar neste site deve registrar aqui o que fez, ao final de cada sessão relevante.

---

## 1. Personas — Quem é Quem

| Símbolo | Persona | Perfil de atuação |
|---------|---------|-------------------|
| 🟢 | **ChatGPT** | Estrutura, governança, copy, decisões de produto |
| 🔵 | **Gemini** | Execução pragmática, performance, UX |
| 🟠 | **Claude** | Engenharia completa, design system, segurança, integração |
| 🟣 | **Codex** | Implementação fullstack, depuração e testes |

---

## 2. Diretrizes de Report (obrigatório para toda IA)

### ✅ Checklist de Onboarding (execute ANTES de codar)

Antes de escrever qualquer linha de código, confirme que fez cada item:

- [ ] Li `memory/MEMORY.md` completo (Regras de Ouro + Pitfalls + Estado do Projeto)
- [ ] Li `CLAUDE.md` (arquitetura, design system, padrões e componentes existentes)
- [ ] Consultei este arquivo Seção 4 (Mapa de Domínios) para ver **quem trabalhou na área que vou tocar**
- [ ] Identifiquei quais **componentes existentes** posso reutilizar (não criar do zero)
- [ ] Verifiquei que dados de contato vêm de `lib/contact.ts` e cores de `globals.css` (nunca hardcodar)

### 📋 Regras de Registro

1. **Ao final de cada sessão relevante**, adicione um bloco de report ao fim deste arquivo.
2. **Use o template abaixo** — não improvise estrutura.
3. **Nunca apague** reports anteriores. Este é um log append-only.
4. **Inclua sempre**: arquivos impactados, resultado concreto e pendências abertas.
5. **Nível de evidência**: seja honesto — `E2` só se há código confirmado no repositório.
6. **ID sequencial**: verifique o último ID na matriz e incremente (S-001, S-002…).
7. **Atualize a Matriz** (Seção 3) com a nova linha da sua sessão.
8. **Atualize o Mapa de Domínios** (Seção 4) com o domínio que você tocou.

### Estados de Status
| Código | Significado |
|--------|-------------|
| ✅ EXECUTADO | Implementado e verificado no código |
| ⚠️ PARCIAL | Entrega incompleta ou sessão interrompida |
| 📝 PROPOSTO | Plano documentado sem execução completa |
| 🔍 AUDITADO | Contribuição revisada por outra IA ou pelo William |

### Nível de Evidência
| Código | Significado |
|--------|-------------|
| E2 | Arquivos/endpoints explícitos e confirmados no repositório |
| E1 | Contribuição detalhada e plausível no log, sem validação completa |
| E0 | Intenção ou plano sem evidência técnica suficiente |

---

## 2.1 Template Oficial de Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [SÍMBOLO + PERSONA] — SESSÃO [DD/MM/AAAA] — ID: S-XXX
  [TÍTULO CURTO DA ENTREGA]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   [✅ EXECUTADO | ⚠️ PARCIAL | 📝 PROPOSTO | 🔍 AUDITADO]
EVIDÊNCIA: [E2 | E1 | E0]

OBJETIVO DA SESSÃO:
  - ...

MUDANÇAS IMPLEMENTADAS:
  1. [Arquivo ou componente] — o que foi feito e por quê
  2. ...

ARQUIVOS MODIFICADOS/CRIADOS:
  - caminho/arquivo_1  (CRIADO | MODIFICADO)
  - caminho/arquivo_2  (MODIFICADO)

BUGS CORRIGIDOS (se houver):
  - [Descrição do bug] → [Fix aplicado]

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - [O que você reusou: componente, token CSS, lib centralizada, pattern existente]
  CRIADO DO ZERO (justifique cada item):
    - [O que você criou novo] — Motivo: [por que não havia equivalente existente]

DECISÕES ARQUITETURAIS (se houver):
  - [Decisão tomada] — Alternativas consideradas: [...] — Razão da escolha: [...]

RESULTADO VERIFICADO:
  - ...

PENDÊNCIAS:
  - [P1/P2/P3] Descrição da pendência
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 3. Matriz de Sessões

| ID | Data | Persona | Título da Sessão | Status | Ev. |
|----|------|---------|------------------|--------|-----|
| S-001 | 16/09/2026 | 🤖 OpenCode | Régua Wilson espelhada em `lib/estudos.ts` + teste vitest; cópias `margemBinomial` mortas (EstudosClient/Simulado) | ✅ EXECUTADO | E2 |
| S-002 | 16/09/2026 | 🤖 OpenCode | Porta de 20 min: home nova do Estudos (vista `home` default), fila `montarFilaEstudo` na lib + testes, W5 — `dataProva` fora de toda UI | ✅ EXECUTADO | E2 |
| S-003 | 16/09/2026 | 🟣 Codex | Skill local `site-quality-audit` + plano em 8 fases para QA visual, funcional, movimento e mídia | 📝 PROPOSTO | E2 |
| S-004 | 16/09/2026 | 🟣 Codex | Plano de QA convertido em handoff executável por fase, com ponteiro global, checkpoints e Status/Evidência/FALTA | 📝 PROPOSTO | E2 |
| S-005 | 16/09/2026 | 🟣 Codex | QA F0: produção/inventário congelados + baseline mobile/tablet/desktop; checkpoint C0 concluído | ✅ EXECUTADO | E2 |
| S-006 | 16/09/2026 | 🟣 Codex + OpenCode Go | QA F1: jornadas/estados em 3 viewports; links globais fora da home, menu móvel e validação do telefone diagnosticados | ✅ EXECUTADO | E2 |
| S-007 | 16/09/2026 | 🤖 OpenCode | Sonda — mini-simulado por temas (Fase 2): espelhos `embaralharComSemente`/`alocarPorMaiorRestoEstudo`/`montarSondaEstudo` na lib, componente `Sonda.tsx`, porta na home, testes 20/20 | ✅ EXECUTADO | E2 |

---

## 4. Mapa de Domínios (o que cada área tem de histórico)

### Hero / First Paint
*(nenhuma sessão registrada)*

### Autoridade / Social Proof
*(nenhuma sessão registrada)*

### Sobre / AboutMe
*(nenhuma sessão registrada)*

### Serviços
*(nenhuma sessão registrada)*

### Formulário / Lead Capture
- **S-006 (Codex + OpenCode Go, 2026-09-16, ✅ E2):** F1 confirmou objetivo vindo da URL, obrigatoriedade e Turnstile em navegador real; telefone de 2 dígitos passa a validade HTML e só seria rejeitado pela API. Nenhum lead foi enviado.

### Design System / Identidade Visual
- **S-003 (Codex, 2026-09-16, 📝 E2):** Criada a skill de projeto `site-quality-audit`, com protocolo de evidência/severidade, referências externas e template de laudo; plano de auditoria criado, sem executar QA ou alterar a UI.
- **S-004 (Codex, 2026-09-16, 📝 E2):** `PLANO_AVALIACAO_SITE.md` adaptado ao formato de handoff do Zeno: uma fase por sessão, ponteiro de retomada, economia de contexto, checkpoints C0–C3 e blocos obrigatórios de status; nenhuma fase executada.
- **S-005 (Codex, 2026-09-16, ✅ E2):** Fase 0 concluída: produção HTTP 200 inventariada e seis baselines capturados em 390×844, 768×1024 e 1440×900; laudo incremental criado e plano avançado para F1.

### Layout (Navbar / Footer / StickyBar)
- **S-006 (Codex + OpenCode Go, 2026-09-16, ✅ E2):** Navbar chegou às cinco seções nas três larguras; em `/cloud`, StickyContactBar e links rápidos do Footer usam hashes locais inexistentes. Menu móvel não expõe `aria-expanded` nem fecha por Escape. Barra fixa não cobriu o final do Footer nas medições.

### API / Backend (route handlers)
*(nenhuma sessão registrada)*

### SEO / Metadata / Performance
*(nenhuma sessão registrada)*

### Segurança (CSP, Turnstile, rate limit)
- **S-006 (Codex + OpenCode Go, 2026-09-16, ✅ E2):** Turnstile concluiu em navegador real; falha no headless foi classificada como limitação de automação. API inspecionada, sem POST/fuzzing em produção.

### Estudos (módulo /est/<token> — régua de acertos)
- **S-001 (opencode, 2026-09-16, ✅ E2):** Régua de Wilson 95% espelhada de `zeno_cloud/src/lib/estudos/margem.ts` em `src/lib/estudos.ts` (`wilson` + `acertoComMargem`, formato único `43,8% · IC95 23,1%–66,8% · n=16`); teste `src/lib/estudos.test.ts` (vitest, único dev-deps instalado); `margemBinomial` (±pp) morta em `EstudosClient.tsx` (3 spans do painel viram o local `StatSessao`) e `Simulado.tsx` (resumo por origem usa `acertoComMargem`).
- **S-002 (opencode, 2026-09-16, ✅ E2):** W5 aplicada — `dataProva` não é lida por NENHUMA tela (chip do hub, linha do header, card "Dias p/ a prova", `diasParaProva` no `PainelHome`, `diasCorridosAteProva`/`formatarDataProva` removidos; o campo opcional fica só no tipo `CursoInfo`). Fila movida de `SessaoEstudo` para `montarFilaEstudo` na lib (com `composicao`, `hojeLocalISO`, `MINUTOS_CARD/QUESTAO` exportados) + 5 testes na prova. Home nova (`vista` default `"home"`): ação única "Estudar 20 min", prévia da fila com os números do motor, Sonda desabilitada com motivo, "Mais" (Banco/Simulado/Temas); `orcamentoInicial={20}`, `ORCAMENTOS=[20,30,45,60]`.
- **S-007 (opencode, 2026-09-16, ✅ E2):** Sonda (Fase 2): `SondaConfig`/`VereditoTema` tipados, `EstudoCompleto.sonda?`/`vereditosTemas?`, `postarSessao(..., modo?: "livre"|"sonda")`. Espelhos na lib: `embaralharComSemente` (mulberry32), `alocarPorMaiorRestoEstudo` (rotação do empate pela rodada, soma = n), `montarSondaEstudo` (pool só validada, piso, nunca-vistas primeiro). Componente `Sonda.tsx` (escolha → rodada sem relógio → resumo com global rotulado "desempenho desta rodada" + eventos clicáveis por módulo + acumulado só com `estado === "estude"`). Home liga a porta quando `dados.sonda` existe; `estudarModulo` recorta a sessão por módulo via `arvoreTemas`. 6 novos casos de teste (total 20/20).

---

## 5. Relatórios Detalhados

> Adicione os reports abaixo, em ordem cronológica.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 OpenCode — SESSÃO 16/09/2026 — ID: S-001
  Espelho da régua de Wilson no Estudos do site + teste vitest (branch estudos-v2/regua-e-porta)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   ✅ EXECUTADO
EVIDÊNCIA: E2 (`vitest run` 5/5 · `npm run lint` exit 0 · `tsc --noEmit` exit 0; sem browser walkthrough)

ARQUIVOS MODIFICADOS/CONSTRUÍDOS:
  - src/lib/estudos.ts  (MODIFICADO — espelho `wilson` + `acertoComMargem` ao final)
  - src/lib/estudos.test.ts  (NOVO — 5 testes cobrindo régua e formato)
  - src/components/estudos/EstudosClient.tsx  (MODIFICADO — `margemBinomial` ±pp morta; spans Oficial/Cursinho/Gerada via `StatSessao`)
  - src/components/estudos/Simulado.tsx  (MODIFICADO — `margemBinomial`/`fmt1` mortos; resumo por origem em `acertoComMargem`)
  - package.json / package-lock.json  (MODIFICADO — devDep `vitest@4.1.11` + script `"test": "vitest run"`)

MUDANÇAS IMPLEMENTADAS:
  - Espelho declarado cópia-idêntica do motor `zeno_cloud/src/lib/estudos/margem.ts` (sem pacote compartilhado entre os repos).
  - `EstudosClient`: componente local `StatSessao` constrói o sufixo `· IC95 …–… · n=` a partir de `acertoComMargem` (wilson chamado UMA vez, travessão EN DASH nunca quebrado no JSX); `n=0` continua `—`.
  - `Simulado`: `texto: n > 0 ? acertoComMargem(acertos, n) : null`.

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - `acertoComMargem`/`wilson` (lib centralizada) nos dois componentes; `fmt1` local do EstudosClient para o <strong>; `text-est-fg-soft`/`text-est-fg` do escopo `.estudos`.
  CRIADO DO ZERO (justifique cada item):
    - `StatSessao` (função local em EstudosClient) — motivo: os 3 spans repetiam idêntica formatação inline; extrair mata a triplicação sem criar componente reutilizável global.

CHECKS E VALIDAÇÃO:
  - `npm run lint` → ✅ exit 0
  - `npx vitest run src/lib/estudos.test.ts` → ✅ 5/5
  - `npx tsc --noEmit` → ✅ exit 0

OBSERVAÇÕES / PENDÊNCIAS:
  - `wilson(0,n).inferior` sai negativo por float (n=1,3,5,6,7,8,11,13…): o guard `-0,0→0,0` do motor é necessário — por isso os spans derivam de `acertoComMargem` em vez de formatar os limites crus com `fmt1`.
  - Contrato pedia importar `wilson` no EstudosClient, mas ficaria não-usado (lint) — o import direto foi só `acertoComMargem`; o `wilson` roda dentro dele (1 chamada/span).
  - Zeno Cloud (motor) intocado: espelho + teste do lado de lá já existem no repo irmão.
  - Sem commit/push, conforme a tarefa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 OpenCode — SESSÃO 16/09/2026 — ID: S-002
  Porta de entrada de 20 min: home nova do Estudos + fila na lib + W5 (fim do prazo em toda UI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   ✅ EXECUTADO
EVIDÊNCIA: E2 (`vitest run` 10/10 · `npm run lint` exit 0 · `tsc --noEmit` exit 0; sem browser walkthrough)

OBJETIVO DA SESSÃO:
  - W5 (invariante do dono): "o sistema de estudo não terá e nunca vai ter nenhum tipo de prazo" — toda leitura de `dataProva` sai da UI.
  - Home nova do Estudos: uma ação só ("Estudar 20 min") no lugar de abrir direto no banco de questões.
  - Fila sai do componente e vira função exportada da lib, com composição testável.

MUDANÇAS IMPLEMENTADAS:
  1. `src/lib/estudos.ts` — nova seção "Fila de estudo" (espelho declarado de `zeno_cloud/src/lib/estudos/fila.ts`): `montarFilaEstudo` (retorna `itens` + `minutos` + `composicao {vencidas, erradas, novas}`), `ItemFilaEstudo`, `FilaEstudoMontada`, `MINUTOS_CARD=1`/`MINUTOS_QUESTAO=2`, `hojeLocalISO()`. `PainelHome` perde `diasParaProva`. `formatarDataProva` e `diasCorridosAteProva` deletados (zero consumidores restantes). `CursoInfo.dataProva` continua no tipo — fica no dado, a UI para de ler.
  2. `src/components/estudos/EstudosClient.tsx` — `vista` ganha `"home"` e passa a ser a default; header perde o bloco `linhaProva` (CAUSA removida, não só o `suppressHydrationWarning`); painel de 4 cards vira a home: botão grande `<Play/> Estudar 20 min`, linha de prévia da fila (`textoPreviaFila` sobre a MESMA `montarFilaEstudo(…, 20)` com os MESMOS inputs da sessão), Sonda `disabled` com o motivo escrito ao lado, "Mais" expandindo Banco/Simulado/Temas, e os dois cards de número (vencidas + cobertura com ressalva `soGerada`). Todas as voltas (`aoFechar`, "Voltar") levam a `"home"`; banco ganhou botão "Voltar" próprio; gravação de sessão do banco intocada.
  3. `src/components/estudos/SessaoEstudo.tsx` — `montarFilaLocal`/`ItemFila`/`hojeISO`/constantes locais deletados em favor da lib; `orcamentoInicial?: number` (default 20); `ORCAMENTOS=[20,30,45,60]`; resumo pós-POST: "Revisões agendadas pelo SM-2." (a menção à véspera da prova sai — W5). Motor (rascunho, dica, thumbs-down, finalizar) intocado.
  4. `src/components/estudos/HubEstudos.tsx` — chip "Prova DD/MM/AAAA · N dias corridos" morto (com `dias`, `Calendar`, imports e `suppressHydrationWarning`); comentário do `mt-auto` reescrito sem falar de prova.
  5. `src/lib/estudos.test.ts` — `describe("montarFilaEstudo")` com 5 casos (composição 10/3/4 em 20 min, item inteiro quebra e nada depois entra, due mais antigo primeiro, alvo antes das demais, questão custa 2 min) — fixtures com `hoje` fixo, sem relógio.

ARQUIVOS MODIFICADOS/CRIADOS:
  - src/lib/estudos.ts  (MODIFICADO)
  - src/components/estudos/EstudosClient.tsx  (MODIFICADO)
  - src/components/estudos/SessaoEstudo.tsx  (MODIFICADO)
  - src/components/estudos/HubEstudos.tsx  (MODIFICADO)
  - src/lib/estudos.test.ts  (MODIFICADO — descreve novo)

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - Tokens `est-*` do escopo `.estudos` (nenhum hex novo); molde dos botões secundários existentes para "Mais" e o banco; `Play`/`ListTree`/`Timer`/`Search` já conhecidos; fluxo de gravação do banco inalterado.
    - `hojeLocalISO` substitui a cópia local de `hojeISO` no `SessaoEstudo` (uma fonte de "hoje"; `Simulado` mantém a sua — fora do escopo da tarefa).
  CRIADO DO ZERO (justifique cada item):
    - `textoPreviaFila` (função local em EstudosClient) — motivo: pluralização pt-BR da composição não existe em nenhum lugar do repo.
    - `Radar`/`Ellipsis` (lucide) para Sonda/Mais — motivo: nenhum ícone existente descreve o gesto.

DECISÕES ARQUITETURAIS (se houver):
  - Prévia da home usa a `montarFilaEstudo` da lib com orçamento 20 e os mesmos inputs da sessão — o número da porta é o do motor, não uma estimativa paralela (regra da tarefa; evita a segunda fonte de verdade).
  - `ItemFilaEstudo` com `card?`/`questao?` opcionais (shape pedido pela tarefa) → o `finalizar` do `SessaoEstudo` ganha guards `item.card?.id`/`item.questao` no lugar da union discriminada estrita.

RESULTADO VERIFICADO:
  - `npx vitest run src/lib/estudos.test.ts` → Test Files 1 passed, Tests 10 passed.
  - `npm run lint` → exit 0. `npx tsc --noEmit` → exit 0.
  - `grep dataProva src/` → só o campo opcional no tipo `CursoInfo` + comentário; nenhuma tela lê prazo.

PENDÊNCIAS:
  - [P2] Fase 2: ligar a Sonda (botão já está desabilitado com motivo na home).
  - [P3] `Simulado.tsx` mantém um `hojeISO()` local (usado só em evento, não na fila) — pode apontar para `hojeLocalISO` numa próxima passagem.
  - [P3] Zeno Cloud (repo irmão): alinhar `fila.ts` à assinatura com `composicao`/`hoje` se ainda divergir.
  - Sem commit/push, conforme a tarefa.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟣 CODEX — SESSÃO 16/09/2026 — ID: S-003
  Skill local e plano de avaliação completa do site
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   📝 PROPOSTO
EVIDÊNCIA: E2 (`quick_validate.py` da skill + arquivos explícitos no repositório; QA do site não executado)

OBJETIVO DA SESSÃO:
  - Pesquisar skills existentes no perfil e no GitHub para auditoria de site.
  - Avaliar o reaproveitamento das skills `avaliar-design` e `criar-plano` do Zeno.
  - Criar uma skill exclusiva do projeto e um plano verificável, sem executar a auditoria.

MUDANÇAS IMPLEMENTADAS:
  1. `.agents/skills/site-quality-audit/` — skill de projeto com limites de produção, trilhas de QA, níveis de evidência, severidade, matriz responsiva, portões para GSAP/Three.js e formato de laudo.
  2. `PLANO_AVALIACAO_SITE.md` — plano em 8 fases (baseline; funções; design/conversão; movimento; imagens; acessibilidade; performance; síntese), todas marcadas A FAZER.
  3. `.gitignore` — `.site-qa/` ignorado para impedir que capturas e dumps temporários entrem no Git.

ARQUIVOS MODIFICADOS/CRIADOS:
  - `.agents/skills/site-quality-audit/SKILL.md`  (CRIADO)
  - `.agents/skills/site-quality-audit/agents/openai.yaml`  (CRIADO)
  - `.agents/skills/site-quality-audit/references/audit-protocol.md`  (CRIADO)
  - `.agents/skills/site-quality-audit/references/reference-library.md`  (CRIADO)
  - `.agents/skills/site-quality-audit/references/report-template.md`  (CRIADO)
  - `PLANO_AVALIACAO_SITE.md`  (CRIADO)
  - `.gitignore`  (MODIFICADO)
  - `memory/historico_ias.md`  (MODIFICADO)

BUGS CORRIGIDOS (se houver):
  - Nenhum; esta sessão não executou QA nem alterou o produto.

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - Zeno `avaliar-design`: DOM medido, Craft/Nielsen/Rams/WCAG, estados e separação tela × código.
    - Zeno `criar-plano`: fases verificáveis, status, invariantes, portões e evidência fresca.
    - Skill Vercel `web-design-guidelines` e referências MIT `ui-ux-audit`/`ux-audit-skill` como base metodológica, sem copiar scripts externos.
  CRIADO DO ZERO (justifique cada item):
    - Lente específica do site William — motivo: conversão de assessoria financeira, tema claro congelado, stack e regras Ethimos não existem nas skills genéricas ou no Zeno.

DECISÕES ARQUITETURAIS (se houver):
  - Skill fica em `.agents/skills/` para ser local ao repositório e portável entre agentes compatíveis.
  - GSAP e Three.js são referências condicionais, não dependências propostas; Framer Motion/CSS continuam como baseline.
  - Evidências futuras ficam em `.site-qa/` e fora do Git; o laudo final é Markdown persistente.

RESULTADO VERIFICADO:
  - Estrutura da skill validada pelo `quick_validate.py`.
  - Plano declara explicitamente que nenhuma fase de QA foi executada.

PENDÊNCIAS:
  - [P1] Executar as fases 0–7 somente em pedido posterior do William.
  - [P2] Confirmar se `/cloud` faz parte do escopo público e fornecer tokens sintéticos caso `/e/[token]` ou `/est/[token]` devam entrar.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟣 CODEX — SESSÃO 16/09/2026 — ID: S-004
  Plano de QA convertido em handoff executável por fases
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   📝 PROPOSTO
EVIDÊNCIA: E2 (`PLANO_AVALIACAO_SITE.md` atualizado; 8 fases seguem A FAZER)

OBJETIVO DA SESSÃO:
  - Aplicar ao site o que é reutilizável da skill `criar-plano` do Zeno.
  - Permitir execução gradual e retomada por outra IA sem depender da conversa.

MUDANÇAS IMPLEMENTADAS:
  1. `PLANO_AVALIACAO_SITE.md` — novo Estado global com próxima fase, último checkpoint, laudo, evidências e bloqueios.
  2. Regras de uma fase por sessão, parada segura por limite de tokens e atualização obrigatória do handoff.
  3. Checkpoints C0–C3 e blocos `Status / Evidência / FALTA` em todas as fases.
  4. Separação explícita do que se aplica e do que não se aplica da skill do Zeno.

ARQUIVOS MODIFICADOS/CRIADOS:
  - `PLANO_AVALIACAO_SITE.md`  (MODIFICADO)
  - `memory/historico_ias.md`  (MODIFICADO)

BUGS CORRIGIDOS (se houver):
  - Nenhum; plano e governança somente.

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - Zeno `criar-plano`: handoff, fase verificável, evidência fresca, checkpoints e bloco de status.
    - `site-quality-audit`: limites de produção, matriz de evidência e portões do laudo.
  CRIADO DO ZERO (justifique cada item):
    - Checkpoints C0–C3 específicos do QA do site — motivo: não há CI/PR nem matriz de cinco temas aplicável.

DECISÕES ARQUITETURAIS (se houver):
  - O plano permanece a fonte canônica porque o site não possui `PENDENCIAS.md`.
  - Delegação OpenCode, cinco temas e rituais de PR do Zeno foram excluídos por não se aplicarem a uma auditoria read-only deste site.

RESULTADO VERIFICADO:
  - Fases 0–7 contêm bloco vazio de `Status / Evidência / FALTA` e o ponteiro global aponta para F0.

PENDÊNCIAS:
  - [P1] Executar F0 em uma sessão posterior; nenhuma fase foi iniciada aqui.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟣 CODEX — SESSÃO 16/09/2026 — ID: S-005
  QA Fase 0 — baseline e inventário
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   ✅ EXECUTADO
EVIDÊNCIA: E2 (produção HTTP 200; seis PNGs; metadados de navegador; SHA-256; inventário código × DOM)

OBJETIVO DA SESSÃO:
  - Executar somente a Fase 0 do plano de QA e deixar handoff íntegro para a Fase 1.

MUDANÇAS IMPLEMENTADAS:
  1. Produção aberta em navegador real e confirmada em `https://williamleonel.com.br/`.
  2. Baseline capturado em 390×844, 768×1024 e 1440×900, com primeira dobra e página completa.
  3. Rotas, composição da home, casca global, contatos e estados do formulário inventariados no código.
  4. Manifesto de evidências e laudo incremental criados; plano marcado F0 concluída e próxima fase F1.

ARQUIVOS MODIFICADOS/CRIADOS:
  - `.site-qa/2026-09-16/fase-0/`  (CRIADO, ignorado pelo Git — 6 PNGs, metadados, manifesto e script de captura)
  - `RELATORIO_QA_SITE_2026-09-16.md`  (CRIADO)
  - `PLANO_AVALIACAO_SITE.md`  (MODIFICADO)
  - `memory/historico_ias.md`  (MODIFICADO)

BUGS CORRIGIDOS (se houver):
  - Nenhum; auditoria read-only, sem alteração de produto.

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - Skill `site-quality-audit`, plano de execução e `webapp-testing`/Playwright para baseline reproduzível.
    - Arquitetura existente (`page.tsx`, `layout.tsx`, `contact.ts`, `ContactCTA.tsx`) como fonte de inventário.
  CRIADO DO ZERO (justifique cada item):
    - Script de captura dentro da pasta ignorada — motivo: o binário `agent-browser` não estava disponível e era necessário persistir evidências exatas por viewport.

DECISÕES ARQUITETURAIS (se houver):
  - Evidências brutas permanecem fora do Git em `.site-qa/`; o laudo e o estado do plano são persistentes.
  - Candidatos visuais e logs `NaN` não foram classificados na F0; foram encaminhados às fases próprias para evitar achado sem medição.

RESULTADO VERIFICADO:
  - Produção: HTTP 200, Vercel, URL final sem redirect divergente.
  - DOM: cinco IDs esperados, 32 links, 8 imagens e 1 formulário em todas as viewports.
  - Layout: sem overflow horizontal medido nas três viewports.
  - Checkpoint C0 satisfeito; próxima fase registrada como F1.

PENDÊNCIAS:
  - [P1] Fase 1 — testar jornadas, funções e estados sem submissão externa.
  - [P2] Confirmar escopo de `/cloud`; tokens sintéticos seguem necessários para rotas tokenizadas.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🟣 CODEX + OPENCODE GO — SESSÃO 16/09/2026 — ID: S-006
  QA Fase 1 — jornadas, funções e estados
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   ✅ EXECUTADO
EVIDÊNCIA: E2 (interação e DOM em produção, código local, navegador real, capturas e JSON reproduzível)

OBJETIVO DA SESSÃO:
  - Executar somente a Fase 1 sem gerar lead ou ação externa.
  - Adaptar a skill de agentes do Zeno ao projeto e usar OpenCode Go como leitura auxiliar, com verificação independente.

MUDANÇAS IMPLEMENTADAS:
  1. Skill local `site-qa-agent-team` criada e validada; MiMo V2.5 usado em modo `--pure`, somente leitura, retenção zero.
  2. Navbar, âncoras, menu móvel, links/CTAs, StickyContactBar, objetivo pela URL, validade vazia/inválida e Turnstile testados nas três viewports.
  3. Quatro achados documentados: hashes globais quebrados fora da home, menu sem Escape/estado expandido, telefone curto válido no cliente e ausência de autocomplete.
  4. Plano e laudo avançados para Fase 2; estados de entrega ficaram explicitamente condicionados a staging/local seguro.

ARQUIVOS MODIFICADOS/CRIADOS:
  - `.agents/skills/site-qa-agent-team/SKILL.md`  (CRIADO)
  - `.agents/skills/site-qa-agent-team/agents/openai.yaml`  (CRIADO)
  - `.site-qa/2026-09-16/fase-1/`  (CRIADO, ignorado pelo Git)
  - `RELATORIO_QA_SITE_2026-09-16.md`  (MODIFICADO)
  - `PLANO_AVALIACAO_SITE.md`  (MODIFICADO)
  - `memory/historico_ias.md`  (MODIFICADO)

BUGS CORRIGIDOS (se houver):
  - Nenhum; auditoria read-only, sem alteração do produto.

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - Skill `equipe-agentes` do Zeno: sonda, modelo explícito, privacidade, brief fechado e supervisão do processo.
    - Skills `site-quality-audit` e `skill-creator`, mais Playwright e navegador real para confirmação.
  CRIADO DO ZERO (justifique cada item):
    - Skill `site-qa-agent-team` — motivo: converter a orquestração genérica do Zeno em contrato seguro e específico do QA deste site, sem delegar interação/veredito.
    - Scripts de F1 dentro de `.site-qa` — motivo: registrar casos repetíveis sem tocar no produto.

DECISÕES ARQUITETURAIS (se houver):
  - Candidatos do subagente não viram achados sem reprodução; dois falsos positivos e uma exigência inadequada de focus trap foram descartados.
  - Falha do Turnstile no headless não foi classificada como defeito porque o navegador real concluiu a verificação.

RESULTADO VERIFICADO:
  - Fase 1 concluída com casos, esperado/observado e evidência; nenhum POST ou destino externo acionado.
  - Plano aponta Fase 2; artefatos brutos permanecem ignorados pelo Git.

PENDÊNCIAS:
  - [P1] Fase 2 — design, narrativa, conversão e confiança.
  - [P2] Loading/success/error do lead somente em staging/local com canal seguro.
  - [P2] Tokens sintéticos continuam necessários para `/e/[token]` e `/est/[token]`.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 OpenCode — SESSÃO 16/09/2026 — ID: S-007
  Sonda — mini-simulado por temas (Fase 2 do Estudos v2): espelhos na lib, componente, porta na home e testes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS:   ✅ EXECUTADO
EVIDÊNCIA: E2 (`vitest run` 20/20 · `npm run lint` exit 0 · `tsc --noEmit` exit 0; sem browser walkthrough)

OBJETIVO DA SESSÃO:
  - Rodada curta que toca TODOS os módulos da certificação e aponta onde doeu, sem fingir resistência de prova (sem relógio/prazo/countdown).
  - Espelhos testáveis do motor `zeno_cloud/src/lib/estudos/sonda.ts` e `embaralhar.ts` na lib do site (mesma filosofia da fila).

MUDANÇAS IMPLEMENTADAS:
  1. `src/lib/estudos.ts` — tipos `SondaConfig` e `VereditoTema`; `EstudoCompleto` ganha `sonda?` e `vereditosTemas?`; `postarSessao` ganha 5º parâmetro `modo?: "livre" | "sonda"` (enviado no corpo quando presente, o Zeno já persiste). Nova seção "Sonda": `embaralharComSemente` (mulberry32 + Fisher-Yates, cópia exata do motor), `alocarPorMaiorRestoEstudo` (maior resto + rotação do empate `(índice+rodada) mod nºEmpatados`, soma exata = n, renormaliza pesos) e `montarSondaEstudo` (pool só `origem !== "gerada"`, piso por parâmetro, insuficientes com contagem real, nunca-vistas primeiro mantendo ordem do embaralho, itens agrupados por módulo na ordem da composição).
  2. `src/components/estudos/Sonda.tsx` (NOVO) — estados escolha → rodada → resumo. Escolha: dois botões "Sonda 8 min · 8 questões" / "20 min · 16" (números de `dados.sonda.duracoes`), linha `Pesos: {fonte}` (G3), selos `acervo insuficiente: N questões validadas` por módulo e botões desabilitados quando NENHUM módulo tem acervo. Rodada: questão a questão, `button[aria-pressed]`, "Responder", feedback com gabarito/explicação, progresso "3/8 questões", ZERO cronômetro. Resumo: global `acertoComMargem` rotulado "Desempenho desta rodada" + composição por módulo discreta; módulos com erro como EVENTO clicável ("{nome} — 1 errada de 3 · n=3", sem %/cor → `aoEstudarTema`); módulos com tudo certo como linha não clicável ("{nome} — 3/3 certas"); acumulado (`vereditosTemas`): "Estude X — n=… únicas · topo de Wilson …% < alvo …%" só com `estado === "estude"` (fonte do alvo ao pé), senão "amostra insuficiente para veredito" (wilsonSuperior nunca como percentual isolado). "Gravar sessão da sonda" → `postarSessao(..., "sonda")` com itens `{questaoId, resultado, origem, tipo}` (sem `usouDica`), status `role="status"`. Rodada gira em localStorage `zeno:est:sonda-rodada:<token>`; semente = `Date.now() % 0xffffffff`.
  3. `src/components/estudos/EstudosClient.tsx` — `vista` ganha `"sonda"`; botão da home habilitado quando `dados.sonda` existe (motivo "mini-simulado por temas: 8 ou 20 min") e desabilitado com "programa detalhado ainda não ingerido" quando não; branch `sonda` → `<Sonda dados={{ ...dados, questoes }} aoEstudarTema={...} />`; `estudarModulo` monta recorte de módulo a partir de `arvoreTemas` (microtemas do módulo), `dadosSessao` filtra questoes/cards/erradasRecentes do módulo e `SessaoEstudo` segue intocado com subheader "Sessão de {módulo}" + botão de remover; fechar a sessão limpa o recorte e volta à home.
  4. `src/lib/estudos.test.ts` — 6 novos describes/casos: maior resto 8/16, rotação do empate (rodada 0/1), renormalização, módulo com 7 validadas → insuficiente e fora do sorteio (renormalização dá slots aos demais), gerada nunca entra (inclusive só-gerada → validadas 0), nunca-vistas primeiro mantendo ordem, e `embaralharComSemente` determinística + permutação.

ARQUIVOS MODIFICADOS/CRIADOS:
  - src/lib/estudos.ts  (MODIFICADO)
  - src/components/estudos/Sonda.tsx  (CRIADO)
  - src/components/estudos/EstudosClient.tsx  (MODIFICADO)
  - src/lib/estudos.test.ts  (MODIFICADO)

REUSO DE CÓDIGO (Anti-Frankenstein — obrigatório):
  REAPROVEITADO:
    - `acertoComMargem`, `montarFilaEstudo`, `postarSessao`, `hojeLocalISO`, tokens `est-*`, `cn()`, molde de feedback da `SessaoEstudo`/banco, `arvoreTemas` do backend, `dados.respondidas` para nunca-vistas.
  CRIADO DO ZERO (justifique cada item):
    - `Sonda.tsx` — motivo: não havia fluxo de mini-simulado por temas; os espelhos (`embaralharComSemente`/`alocarPorMaiorRestoEstudo`/`montarSondaEstudo`) e os tipos `SondaConfig`/`VereditoTema` não existiam na lib (repos separados, sem pacote compartilhado).

DECISÕES ARQUITETURAIS (se houver):
  - Sonda recebe `aoEstudarTema` como prop além do trio `{token, pin, dados, aoFechar}` do enunciado — o clique no evento de módulo precisa chamar o recorte que o `EstudosClient` implementa.
  - "Gravar sessão da sonda" NÃO fecha sozinho: mostra `role="status"` "Sessão da sonda gravada." e o botão vira "Voltar" → `aoFechar(true)` (molde do Simulado), evitando navegação assíncrona invisível.
  - `minutos` do POST = decorrido real desde o início da rodada (sem relógio na tela, mas o contrato do POST pede minutos).

RESULTADO VERIFICADO:
  - `npx vitest run src/lib/estudos.test.ts` → 20/20 passam
  - `npm run lint` → exit 0
  - `npx tsc --noEmit` → exit 0
  - Sem browser walkthrough (UI nova não navegada em navegador real nesta sessão).

PENDÊNCIAS:
  - [P2] Walkthrough em navegador real da Sonda (escolha → rodada → resumo → gravar) com token sintético.
  - [P2] Validar que `arvoreTemas[].id` casa com as chaves de `sonda.pesos` no payload real do Zeno (hoje mapeado por microtema→módulo).
  - [P3] Quando o Zeno ainda não despachar `vereditosTemas`, o bloco "Acumulado por tema" simplesmente não aparece — ok, mas é invisível: confirmar intenção.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
