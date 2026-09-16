# QA do site William Leonel — 16/09/2026

**Veredito:** pendente até a Fase 7  
**Escopo atual:** F0–F1 da homepage pública e verificação dos CTAs globais em `/cloud`  
**Ambiente:** produção; Vercel; Chromium headless 148.0.7778.96; relação com o commit local não comprovada  
**Viewports:** 390×844, 768×1024 e 1440×900; DPR 1  
**Acesso:** público, sem autenticação  
**Limitações atuais:** Fases 2–7 não executadas; estados de entrega loading/success/error não acionados por falta de staging/canal seguro; nenhum envio; Safari, Firefox e leitor de tela não testados

## Progresso

| Fase | Estado | Evidência principal |
|---|---|---|
| F0 — Baseline e inventário | ✅ concluída | `.site-qa/2026-09-16/fase-0/MANIFESTO.md` |
| F1 — Jornadas, funções e estados | ✅ concluída | `.site-qa/2026-09-16/fase-1/MANIFESTO.md` |
| F2 — Design, narrativa, conversão e confiança | ⬜ a fazer | — |
| F3 — Efeitos, animações e movimento | ⬜ a fazer | — |
| F4 — Imagens, logos e mídia | ⬜ a fazer | — |
| F5 — Responsividade e acessibilidade | ⬜ a fazer | — |
| F6 — Performance percebida e integridade técnica | ⬜ a fazer | — |
| F7 — Síntese e plano de melhorias | ⬜ a fazer | — |

## Matriz de cobertura

| Área | Mobile | Tablet | Desktop | Teclado | Movimento reduzido | Estado |
|---|---|---|---|---|---|---|
| Home — baseline estático | capturado | capturado | capturado | não testado | não testado | F0 concluída |
| Jornadas e estados | testado | testado | testado | menu mobile testado | N/A nesta fase | F1 concluída; envio real não executado |
| Design/conversão | baseline disponível | baseline disponível | baseline disponível | N/A nesta fase | não testado | F2 pendente |
| Movimento | não testado | não testado | não testado | não testado | não testado | F3 pendente |
| Imagens | baseline disponível | baseline disponível | baseline disponível | N/A | N/A | F4 pendente |
| Acessibilidade | não testado | não testado | não testado | não testado | não testado | F5 pendente |
| Performance | não testado | não testado | não testado | N/A | N/A | F6 pendente |

## Fase 0 — Baseline e inventário

### Ambiente congelado

- A produção respondeu HTTP 200 e permaneceu em `https://williamleonel.com.br/`.
- Foram registradas primeira dobra e página completa nas três viewports previstas.
- Não houve overflow horizontal: `scrollWidth === clientWidth` nas três execuções.
- O documento mediu 13.421px no mobile, 9.507px no tablet e 6.440px no desktop.
- As capturas foram feitas após fontes/rede estabilizarem e scroll completo para montar conteúdo lazy.

### Inventário do produto

- A home local compõe cinco seções: Hero, AuthoritySection, AboutMe, Services e ContactCTA.
- A casca global contém Navbar, conteúdo principal, StickyContactBar e Footer.
- A produção renderizou os IDs `inicio`, `autoridade`, `sobre`, `servicos` e `contato` nas três larguras.
- Foram contados 32 links, 8 imagens e 1 formulário.
- Os alvos de contato são centralizados em `src/lib/contact.ts`.
- O formulário declara estados `idle`, `loading`, `success` e `error`, além dos estados do Turnstile.
- Além da home, o repositório contém `/cloud`, `/e/[token]` e `/est/[token]`; as duas últimas exigem token de teste para QA dinâmico.

### Candidatos encaminhados, ainda sem classificação

- Logs de console formatados terminando em `NaN` apareceram duas vezes por viewport; verificar na Fase 6.
- Header e barra fixa apresentaram comportamentos visuais que precisam de reprodução por breakpoint/interação; verificar nas Fases 1, 2 e 5.

Nenhum item acima recebeu ID, severidade ou recomendação: a Fase 0 coleta baseline e não substitui as trilhas de diagnóstico.

## Fase 1 — Jornadas, funções e estados

### Casos executados

| Caso | Pré-condição/ação | Esperado | Observado | Evidência |
|---|---|---|---|---|
| Âncoras da Navbar | clicar nos cinco destinos em 390, 768 e 1440px | hash e seção corretos | passou nas 15 combinações; headings ficaram abaixo do header, exceto “Sobre” que começa pela mídia antes do título em mobile/tablet | `verified-cases.json` |
| Menu mobile | foco no botão, Enter, Tab, Escape | abre, expõe estado e fecha por Escape | abriu; Tab foi para “Início”; não há `aria-expanded`; Escape não fechou | `functional-results.json`, `mobile--menu-open.png` |
| CTA global em rota secundária | em `/cloud`, acionar “Solicitar contato” fixo | voltar para `/#contato` | navegou para `/cloud#contato`, onde o ID não existe | navegador real + `verified-cases.json` |
| Footer em rota secundária | inspecionar links rápidos em `/cloud` | voltar às seções da home | quatro links resolveram dentro de `/cloud` para IDs inexistentes | navegador real + `verified-cases.json` |
| Objetivo pela URL | abrir `?goal=Planejar aposentadoria#contato` | opção correspondente ativa | passou nas três viewports | `functional-results.json` |
| Formulário vazio | consultar validade nativa, sem submit | inválido e envio bloqueado | passou; nome e telefone são obrigatórios | `functional-results.json` |
| Telefone curto | preencher nome sintético e telefone `12`, sem submit | inválido no cliente | falhou; virou `(12` e a validade HTML ficou verdadeira | `verified-cases.json` |
| Turnstile | aguardar em navegador real | concluir ou exibir erro compreensível | concluiu e habilitou o botão; headless não concluiu e foi tratado como limitação da automação | navegador real + `functional-results.json` |
| Barra fixa no fim | medir interseção com copyright/CTA do Footer | não cobrir ação ou conteúdo terminal | passou; interseção 0 nas três viewports | `functional-results.json` |
| Links externos | inspecionar protocolo, destino, `target` e `rel`, sem abrir | URLs coerentes e isolamento de nova aba | passou no DOM/código; disponibilidade dos destinos não testada | `functional-results.json` + código |
| Estados de entrega | loading/success/error | feedback coerente | código inspecionado; não acionados em produção por segurança | `ContactCTA.tsx`; não testado dinamicamente |

## Achados

### FUN-01 — CTA fixo e navegação do Footer quebram fora da home

- **Severidade:** S2 Médio
- **Confiança:** O-I + O-M + O-C
- **Onde:** `/cloud`, todas as larguras, StickyContactBar e Footer · `src/components/layout/StickyContactBar.tsx:37`, `src/components/layout/StickyContactBar.tsx:67`, `src/components/layout/Footer.tsx:38`
- **Evidência:** `/cloud` não possui `#contato`. No navegador real, o CTA fixo mudou a URL para `/cloud#contato` sem sair da página. Os quatro atalhos do Footer também apontam para hashes locais inexistentes.
- **Consequência:** a chamada persistente “Solicitar contato” e a navegação institucional não levam ao conteúdo prometido quando a pessoa está no Zeno Cloud; a Navbar, por contraste, funciona porque usa `/#...`.
- **Causa provável:** componentes globais usam `#...` em vez de âncoras absolutas `/#...`.
- **Correção:** alinhar StickyContactBar e `quickLinks` ao padrão já usado pela Navbar, preferindo `Link href="/#contato"` e `/#<id>`.
- **Verificação posterior:** repetir em `/cloud`; cada ação deve terminar na home, com hash correto e foco/scroll na seção existente.

### A11Y-01 — Menu móvel não comunica expansão nem fecha com Escape

- **Severidade:** S2 Médio
- **Confiança:** O-I + O-M + O-C
- **Onde:** `/`, 390×844, botão Menu · `src/components/layout/Navbar.tsx:115`
- **Evidência:** Enter abriu o menu e Tab avançou para “Início”, mas `aria-expanded` era ausente e Escape manteve o disclosure aberto. O foco permaneceu no botão após abrir.
- **Consequência:** usuários de teclado e tecnologia assistiva perdem estado e um mecanismo esperado de fechamento, embora ainda exista o contorno de reativar o botão.
- **Causa provável:** o toggle controla apenas `isOpen`; não há atributos de disclosure nem listener de Escape.
- **Correção:** adicionar `aria-expanded`, `aria-controls`, ID do painel e fechamento por Escape; manter foco no botão ao fechar. Scroll lock/focus trap não são exigidos enquanto o menu continuar sendo disclosure não modal.
- **Verificação posterior:** testar Enter/Espaço/Escape e leitura do estado expandido/colapsado em 390px.

### FUN-02 — Telefone incompleto só é rejeitado depois do envio

- **Severidade:** S2 Médio
- **Confiança:** O-M + O-C
- **Onde:** `/`, formulário de contato, três viewports · `src/components/sections/ContactCTA.tsx:301`
- **Evidência:** com nome sintético e telefone `12`, o valor foi formatado como `(12` e tanto `phone.validity.valid` quanto `form.checkValidity()` ficaram verdadeiros. Nenhum POST foi realizado. O backend exige 10–15 dígitos.
- **Consequência:** após vencer o Turnstile, a pessoa pode gastar uma tentativa para receber um erro que poderia ser mostrado no campo antes da rede.
- **Causa provável:** `type="tel" required` garante presença, não quantidade de dígitos; a regra existe apenas na API.
- **Correção:** compartilhar/espelhar no cliente a regra mínima do servidor e associar uma mensagem ao campo, sem enfraquecer a validação da API.
- **Verificação posterior:** 2 dígitos devem bloquear localmente; números brasileiros válidos devem permanecer aceitos e formatados.

### A11Y-02 — Campos pessoais não declaram autocomplete

- **Severidade:** S3 Baixo
- **Confiança:** O-M + O-C
- **Onde:** `/`, formulário de contato · `src/components/sections/ContactCTA.tsx:286`, `src/components/sections/ContactCTA.tsx:301`, `src/components/sections/ContactCTA.tsx:342`
- **Evidência:** nome, telefone e e-mail renderizaram sem atributo `autocomplete` nas três viewports.
- **Consequência:** preenchimento móvel e tecnologias que identificam a finalidade dos campos recebem menos contexto, aumentando esforço em uma etapa de conversão.
- **Correção:** declarar `autocomplete="name"`, `"tel"` e `"email"` nos respectivos controles.
- **Verificação posterior:** inspecionar atributos renderizados e confirmar sugestões coerentes do navegador sem preencher dados reais.

## O que funciona e deve ser preservado

- Navbar usa âncoras absolutas e chegou às cinco seções em todas as larguras.
- CTAs de serviço transportam e pré-selecionam um objetivo permitido pela URL.
- Links externos usam protocolos coerentes e novas abas com `noopener noreferrer`.
- Formulário tem labels reais, botões de escolha com `aria-pressed`, estado disabled, honeypot, Turnstile e validação defensiva no servidor.
- A reserva inferior do layout evitou que a barra fixa cobrisse o final do Footer nas três viewports.

## O que ficou aberto

- confirmar se `/cloud` faz parte da auditoria pública;
- fornecer tokens sintéticos caso `/e/[token]` ou `/est/[token]` devam entrar;
- executar as Fases 2–7;
- testar loading/success/error do lead apenas em staging/local com canal seguro.
