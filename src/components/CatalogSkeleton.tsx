export function CatalogSkeleton() {
  return (
    <div className="wrap" aria-busy="true" aria-label="Cargando productos">
      <div className="sk" style={{ height: 14, width: 160, margin: "22px 0 18px", borderRadius: 4 }} />
      <div className="sk" style={{ height: 36, width: 220, marginBottom: 24, borderRadius: 6 }} />
      <div className="grid">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="sk-card" key={i}><div className="sk a" /><div className="sk b" /><div className="sk c" /></div>
        ))}
      </div>
    </div>
  );
}
