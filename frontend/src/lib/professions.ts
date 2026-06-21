const _profImgs = import.meta.glob<string>(
  '../../assets/profissoes/*.png',
  { eager: true, query: '?url', import: 'default' },
);

export function getProfessionImageUrl(profession: string | null | undefined): string | undefined {
  if (!profession) return undefined;
  return _profImgs[`../../assets/profissoes/${profession}.png`];
}
