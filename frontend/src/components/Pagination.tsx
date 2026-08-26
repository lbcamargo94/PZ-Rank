interface PaginationProps {
  page:       number;
  totalPages: number;
  onChange:   (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pz-pagination">
      <button
        className="pz-page-btn"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <i className="ti ti-chevron-left" /> Anterior
      </button>
      <span className="pz-page-info">
        Página <strong>{page}</strong> de <strong>{totalPages}</strong>
      </span>
      <button
        className="pz-page-btn"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Próximo <i className="ti ti-chevron-right" />
      </button>
    </div>
  );
}
