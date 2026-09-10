/**
 * Fonte de verdade para a navegação do site.
 *
 * REGRA: ao adicionar uma nova página pública, adicione um item aqui.
 * Esse array alimenta automaticamente:
 *   - O menu do header (Header.tsx)
 *   - Os cards de Acesso Rápido na home (App.tsx → QuickNav)
 *
 * Também é necessário:
 *   1. Adicionar a chave `nav.<navKey>` nos 4 arquivos de tradução (pt, en, es, fr)
 *   2. Adicionar a chave `home.quick_nav.<quickKey>` com `label` e `sub` nos mesmos arquivos
 */
export const NAV_ITEMS = [
  { to: '/rank',          icon: 'ti-trophy',        navKey: 'rank',         quickKey: 'rank'         },
  { to: '/regras',        icon: 'ti-book',           navKey: 'rules',        quickKey: 'rules'        },
  { to: '/wiki',          icon: 'ti-book-2',         navKey: 'wiki',         quickKey: 'wiki'         },
  { to: '/mods',          icon: 'ti-puzzle',         navKey: 'mods',         quickKey: 'mods'         },
  { to: '/dicas',         icon: 'ti-bulb',           navKey: 'tips',         quickKey: 'tips'         },
  { to: '/lendas',        icon: 'ti-award',          navKey: 'legends',      quickKey: 'legends'      },
  { to: '/links',         icon: 'ti-link',           navKey: 'links',        quickKey: 'links'        },
  { to: '/transparencia', icon: 'ti-chart-pie',      navKey: 'transparency', quickKey: 'transparency' },
  { to: '/comparar',      icon: 'ti-arrows-diff',    navKey: 'compare',      quickKey: 'compare'      },
] as const;

export type NavItem = typeof NAV_ITEMS[number];
