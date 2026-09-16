# Protocolo de auditoria

## 1. Fontes de verdade e confiança

Use a fonte mais forte disponível para cada afirmação:

| Nível | Evidência | Pode provar |
|---|---|---|
| O-M | Observado, medido no navegador | contraste computado, dimensão, overflow, tempo, estilo, evento |
| O-V | Observado visualmente | hierarquia, crop, ritmo, legibilidade aparente, continuidade |
| O-I | Observado por interação | navegação, foco, estados, retorno, feedback, links |
| O-C | Observado no código | ramo/estado existente, semântica, origem do estilo, configuração |
| INF | Inferência sustentada | impacto provável ou causa provável ainda não reproduzida |
| HIP | Hipótese | oportunidade que depende de analytics, usuário ou decisão de marca |

Uma captura estática não prova hover, foco, animação ou sucesso de formulário. Código não prova aparência. Lighthouse não prova qualidade percebida. Analytics não devem ser inventados.

## 2. Severidade

| Nível | Critério |
|---|---|
| S0 Bloqueador | impede a jornada principal, envia/expõe dado indevido, quebra o site ou exclui uso essencial |
| S1 Alto | prejudica fortemente conversão, compreensão, confiança, acessibilidade ou funcionamento em viewport comum |
| S2 Médio | causa atrito perceptível, inconsistência ou perda de qualidade, mas existe contorno claro |
| S3 Baixo | refinamento de craft com impacto limitado e sem quebra de jornada |

Não derive severidade de gosto. Combine alcance, frequência provável, impacto e reversibilidade. Em serviços financeiros, alegações sem lastro, números ambíguos, privacidade e confiança recebem peso adicional.

## 3. Matriz mínima de ambiente

| Perfil | Viewport | Entrada principal |
|---|---:|---|
| Mobile | 390×844 | touch simulado + teclado |
| Tablet | 768×1024 | touch/layout intermediário |
| Desktop | 1440×900 | mouse + teclado |

Se houver falha de layout, encontre também a largura em que começa. Teste 320px para piso estreito e 1920px para excesso de largura apenas quando houver sinal de risco. Registre DPR, zoom e navegador. Chromium é baseline, não sinônimo de compatibilidade universal.

Antes da captura final:

- aguarde rede e fontes estabilizarem;
- percorra a página para disparar lazy loading e animações once-only;
- volte ao topo quando o estado inicial for relevante;
- diferencie screenshot de viewport e full-page;
- confirme que overlays, barras fixas e banners não esconderam conteúdo.

## 4. Trilha funcional e de estados

### Home pública

- Navbar: links, âncoras, posição após scroll, retorno ao topo e foco.
- Menu mobile: abrir, fechar, Escape, clique fora quando aplicável, scroll lock e foco.
- CTAs: destino, texto coerente, indicação de link externo e área clicável.
- WhatsApp e redes: valide URL e contexto; não conclua envio ou ação externa.
- Sticky contact bar: sobreposição, safe area, competição com CTA e comportamento no mobile.
- Formulário: rótulos, tipos, autocomplete, campos obrigatórios, validação vazia/inválida, mensagens, loading, erro e sucesso. Em produção, pare antes de submissão real.
- Rodapé: links, dados centralizados, logos, disclaimer e legibilidade.

### Outras rotas

- `/cloud`: incluir no inventário e auditar se fizer parte do escopo público confirmado.
- `/e/[token]` e `/est/[token]`: somente com token sintético/de teste autorizado.
- APIs: revisão de contrato/código não equivale a QA visual. Não faça fuzzing em produção.

Para cada ação, registre: pré-condição, ação, resultado esperado, resultado observado e evidência.

## 5. Trilha de design, conversão e confiança

Avalie de cima para baixo e depois pelo “teste do borrão”:

- proposta de valor compreensível na primeira dobra;
- um CTA primário dominante, sem competição desnecessária;
- hierarquia tipográfica, medida de linha e contraste;
- ritmo entre seções, agrupamento por proximidade e escala de espaços;
- coerência de cards, bordas, sombras, raios, ícones e alinhamentos;
- autoridade baseada em fatos, sem selos, números ou promessas não sustentados;
- tom compatível com assessoria financeira e público de alta renda;
- progressão narrativa até contato, sem repetição que dilua a mensagem;
- consistência da identidade Ethimos e uso dos tokens do projeto;
- estados de hover/foco/active/disabled compatíveis com a função.

Use Nielsen para usabilidade, Rams para utilidade/honestidade/economia e WCAG para requisitos verificáveis. Não infle o laudo: lente sem violação não precisa gerar achado.

## 6. Trilha de movimento, efeitos e 3D

Observe uma visita fresca, uma navegação completa e `prefers-reduced-motion: reduce`.

Cheque:

- animação comunica hierarquia, causalidade ou continuidade, em vez de decorar;
- duração/easing coerentes; interações simples normalmente encerram rápido;
- `transform` e `opacity` são preferidos; layout/pintura por frame exige justificativa;
- conteúdo não fica invisível se JS falhar ou movimento for reduzido;
- scroll não é sequestrado e a leitura não depende de parallax;
- entrada once-only não impede reorientação ou captura;
- hover não carrega função inacessível em touch;
- foco de teclado não é encoberto por animação;
- não há CLS, frame drop perceptível, atraso de interação ou uso excessivo de GPU;
- vídeo/canvas/WebGL pausa quando fora da tela e tem fallback.

### Portão GSAP

Considere GSAP apenas para sequência complexa, SVG, timeline sincronizada ou scroll storytelling que a implementação atual não expresse com clareza. Compare com Framer Motion/CSS em capacidade, bundle, hidratação, limpeza e manutenção.

### Portão Three.js

Considere Three.js apenas se o 3D for parte da mensagem e continuar legível sem WebGL. Exija orçamento de performance, asset loading progressivo, fallback estático, controles de movimento e teste térmico/mobile. “Parecer premium” sozinho não basta.

## 7. Trilha de imagens e mídia

Para cada imagem relevante:

- função: informativa, prova, retrato, marca ou decoração;
- fonte e legitimidade; evitar imagem genérica que enfraqueça confiança;
- resolução suficiente sem bytes excessivos;
- largura/altura ou proporção reservada para evitar CLS;
- crop e ponto focal em todas as viewports;
- `alt` útil quando informativa e vazio quando decorativa;
- prioridade apenas para LCP provável; lazy abaixo da dobra;
- logo correta para a superfície clara;
- texto não embutido na imagem quando deveria ser HTML;
- fallback e estado de erro coerentes.

Não recomende “mais imagens” sem nomear a função que elas cumprem.

## 8. Trilha responsiva e acessível

- navegação completa por teclado; ordem de foco segue leitura;
- foco visível e não escondido por header/sticky bar;
- semântica de landmarks, heading e controles nativos;
- nome acessível em ícones e links ambíguos;
- label real, descrição e erro ligados aos campos;
- contraste WCAG AA: 4,5:1 texto normal; 3:1 texto grande e componentes relevantes;
- zoom/reflow e ausência de scroll horizontal acidental;
- alvo mínimo WCAG 2.2 AA de 24×24 CSS px; prefira 44×44 em ações móveis principais;
- nada depende apenas de cor, hover ou movimento;
- movimento reduzido preserva conteúdo e função.

Automação de acessibilidade é amostragem, não certificação. Declare leitores de tela e navegadores não testados.

## 9. Trilha técnica e performance percebida

Colete apenas o suficiente para explicar a experiência:

- erros de console e requisições falhas;
- LCP/CLS/INP quando ferramenta disponível, com ambiente registrado;
- fontes, imagens, JS e terceiros que dominam a carga;
- hidratação, conteúdo piscando ou layout deslocando;
- links quebrados, metadata básica e imagens sociais quando no escopo;
- divergência entre produção observada e branch local.

Não transforme uma execução de Lighthouse em verdade universal. Resultado de laboratório precisa de data, device/throttle e distinção de dados de campo.

## 10. Regras de execução segura

- Produção é leitura/interação reversível.
- Não submeta formulário, gere evento externo ou use identidade real sem autorização explícita.
- Mascarar tokens, query strings, emails e telefones nas evidências.
- Não armazenar cookies, payloads ou screenshots com dado pessoal no repositório.
- Artefatos temporários vão para `.site-qa/`, que deve permanecer ignorado pelo Git.
