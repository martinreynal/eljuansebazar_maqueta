# El Juanse Bazar · Bazar a medida

Catálogo digital del bazar, versión provisoria (maqueta con productos de demostración).
Las consultas y cotizaciones se hacen por WhatsApp: +54 9 11 2676-3257.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La página completa: tienda, catálogo, fichas, lista de consulta y panel administrador. |
| `catalogo-el-juanse-bazar.pdf` | Catálogo descargable. El botón "Descargar catálogo en PDF" apunta a este archivo. |
| `favicon.png` | Ícono de la pestaña del navegador. |
| `apple-touch-icon.png` | Ícono cuando alguien guarda la web en la pantalla de inicio del celular. |
| `og-image.png` | Imagen que aparece al compartir el link por WhatsApp o redes. |

Todos los archivos tienen que estar en la misma carpeta (la raíz del repo).

## Panel administrador

Entrar a `/#admin` o desde el link "Panel administrador" del pie de página.

En esta versión los cambios del panel no se guardan: se ven solo en la pestaña de quien los hace y se pierden al recargar. La clave es una barrera liviana del navegador, no una protección real. Antes de conectar una base de datos hay que reemplazarla por un inicio de sesión validado en el servidor (Supabase Auth).

## Cómo actualizar la web

1. Reemplazá el archivo que cambió (por ejemplo `index.html`) en GitHub.
2. Vercel publica la nueva versión solo, en uno o dos minutos.

## Próxima etapa

Pasar a Next.js + Supabase (base de datos, inicio de sesión real y fotos de productos) para que el panel guarde los cambios y el PDF se genere solo con los productos cargados.
