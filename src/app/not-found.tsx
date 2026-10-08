import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap" style={{ paddingBlock: 48 }}>
      <div className="empty">
        <h3>No encontramos esta página</h3>
        <p>Puede que el producto se haya dado de baja o que el enlace no sea correcto.</p>
        <Link className="btn btn-dark" href="/catalogo">Ir al catálogo</Link>
      </div>
    </div>
  );
}
