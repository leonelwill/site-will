# Formato do laudo

Salvar o relatório como `RELATORIO_QA_SITE_<AAAA-MM-DD>.md`. Evidências brutas ficam em `.site-qa/<AAAA-MM-DD>/` e não entram no Git sem pedido explícito.

## Cabeçalho obrigatório

```markdown
# QA do site William Leonel — <data>

**Veredito:** ✅ Sólido | ⚠️ Arestas relevantes | 🚨 Precisa de intervenção
**Escopo:** <URLs/rotas>
**Ambiente:** <produção/local, commit/deploy se conhecido, navegador>
**Viewports:** <lista>
**Acesso:** <público/test token/staging>
**Limitações:** <o que não foi possível testar>
```

## Resumo executivo

- três a cinco conclusões que mudam decisão;
- contagem por severidade;
- maior risco para conversão/confiança;
- maior oportunidade de melhoria;
- o que está funcionando e deve ser preservado.

## Matriz de cobertura

| Área | Mobile | Tablet | Desktop | Teclado | Movimento reduzido | Estado |
|---|---|---|---|---|---|---|
| Home | ... | ... | ... | ... | ... | testado/não testado/bloqueado |

Nunca deixe célula vazia: ausência de evidência vira `não testado`.

## Achados

Ordenar por severidade, depois pela jornada. Use um bloco por achado:

```markdown
### VIS-01 — <título objetivo>

- **Severidade:** S1 Alto
- **Confiança:** O-M + O-V
- **Onde:** `/`, 390×844, CTA do Hero · `src/components/sections/Hero.tsx:NN`
- **Evidência:** <fato e medida; link/nome da captura quando houver>
- **Consequência:** <impacto para usuário/conversão/confiança>
- **Causa provável:** <quando sustentada; caso contrário “não isolada”>
- **Correção:** <ação concreta usando o sistema existente>
- **Referência:** <princípio ou fonte aplicável, sem decoração bibliográfica>
- **Verificação posterior:** <como provar que o fix funcionou>
```

Prefixos:

- `FUN`: função/jornada/estado;
- `VIS`: design visual/craft/sistema;
- `CONV`: mensagem, confiança e conversão;
- `MOT`: movimento/efeito;
- `IMG`: imagem/mídia;
- `A11Y`: acessibilidade/responsividade;
- `PERF`: performance/renderização.

## Referências aplicadas

Não faça galeria de links. Inclua apenas comparações que geraram recomendação, no formato atributo → aplicação → risco. Diferencie inspiração de norma.

## Backlog priorizado

No máximo cinco prioridades executivas. Cada item contém IDs relacionados, resultado esperado, escopo provável, risco e portão de verificação. Não estime horas; use esforço relativo `P/M/G` somente se ajudar decisão.

## O que ficou aberto

- decisão de marca ou produto;
- necessidade de analytics ou teste com usuários;
- ambiente/token ausente;
- navegador/leitor de tela não testado;
- hipótese a validar.

## O que foi preservado

Liste padrões fortes que não devem ser “melhorados” por reflexo. Isso reduz regressão e impede que referências externas desfaçam identidade útil.
