/*
 * ALTERE OS TEMAS AQUI
 *
 * NO MOMENTO O SITE ESTA CONGELADO NO TEMA CLARO.
 * O tema escuro permanece definido aqui apenas para trabalho futuro.
 *
 * light:
 * - usado em navbar, footer e superfícies claras
 * - logo recomendado: logo_ethimos_white.png
 *
 * dark:
 * - usado em blocos escuros de destaque
 * - logo recomendado: logo_ethimos_blue.png
 */
export const siteTheme = {
  light: {
    logoSrc: "/images/logo_ethimos_white.png",
    surfaceClass: "theme-light-surface",
  },
  dark: {
    logoSrc: "/images/logo_ethimos_blue.png",
    surfaceClass: "theme-dark-surface",
    panelClass: "theme-dark-panel",
  },
} as const;
