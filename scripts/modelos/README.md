# Modelos 3D de productos

Los archivos `.glb` de `public/modelos/` se reconstruyen a partir de las fotos del catálogo y de medidas típicas o conocidas: geometría real (no una foto plana), con materiales y texturas.

- `cuchillo-cub27.mjs`: genera `public/modelos/CUB-27.glb` (cuchillo de acero inoxidable, mango de madera, filo dentado). Hoja extruida con dientes reales, mango redondeado con textura de madera (`madera.png`), dos remaches.

Para correrlo hace falta un proyecto con `three` y `@gltf-transform/core` instalados (por ejemplo el del simulador de mesa):

```bash
node scripts/modelos/cuchillo-cub27.mjs public/modelos/CUB-27.glb
```

Para asociar un modelo a un producto: en el panel, campo **Modelo 3D** con la ruta (`/modelos/CUB-27.glb`). Si el producto no tiene modelo, la ficha muestra solo la foto.

## Piezas torneadas (platos, bowls, tazas, vasos, copas, botellas) y sus sets

- `generar-catalogo.py`: a partir de `rows.json` (catálogo) y las fotos en miniatura arma `catalogo-modelos.json` con forma, medidas (del texto o estimadas) y colores (dominantes de la foto) de cada producto.
- `torneados.mjs`: lee ese JSON y genera un `.glb` por producto torneado (geometría de revolución real) y por set compuesto solo de piezas torneadas. Las piezas cuadradas, de madera, hierro o con tapa quedan fuera.

```bash
python3 scripts/modelos/generar-catalogo.py rows.json public/catalogo/mini scripts/modelos/catalogo-modelos.json
node scripts/modelos/torneados.mjs scripts/modelos/catalogo-modelos.json public/modelos
```

Los productos con modelo se asocian en la base con `model_url = '/modelos/SKU.glb'` (ver `supabase/migrations/0006_modelos_torneados.sql`).
