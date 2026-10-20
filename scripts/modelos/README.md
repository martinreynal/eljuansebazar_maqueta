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

## Resto del catálogo (cubiertos, utensilios, palitos, bandejas, platos con forma, teteras, madera)

- `resto.mjs`: modela por receta los productos que no son de revolución simple: juegos de cubiertos pieza por pieza (tenedor, cuchillo, cuchara, cucharita según la descripción), cuchillos, trinches y pinzas de asado con mango de madera, palitos y apoya-palitos, cucharas de cerámica, bandejas y platos cuadrados/triangulares (perfil torneado deformado en planta), bases de madera con patas, teteras, sartén de hierro, cubilete, y los sets que combinan estas piezas.

```bash
node scripts/modelos/resto.mjs datos/rows.json scripts/modelos/catalogo-modelos.json scripts/modelos/madera.png public/modelos [SKU ...]
```

Con esto, los 333 productos del catálogo tienen modelo 3D (`supabase/migrations/0007_modelos_resto.sql`).

## Versión realista (texturas y materiales a partir de la foto)

Reemplaza a `torneados.mjs` y mejora `resto.mjs`. Cada foto se analiza para deducir proporciones y superficie, y los materiales usan PBR.

1. `analizar-fotos.py`: separa el producto del fondo (modelo de fondo por grupos de color del borde), detecta cada pieza (componentes conexas), mide proporciones (alto/ancho, conicidad de la base), colores (interior, borde, parte baja) y acabado (brillos especulares). Extrae texturas por pieza en `texturas/`: `-top.jpg` (vista cenital sintética: color interior → color del borde, con una muestra real de la superficie sin el sombreado de la foto), `-side.jpg` (lateral sintética), `-disc.jpg` (la pieza desproyectada a círculo, solo si la silueta es una elipse limpia) y `-strip.jpg` (franja lateral real, solo para piezas sueltas). Las piezas descritas como blancas se neutralizan (la foto las tiñe).
2. `realista.mjs`: platos, bowls, tazas, vasos, copas, botellas y sus sets. Perfiles de revolución con la conicidad medida; plato = tapa (textura cenital, proyección plana) + exterior; bowl/taza/vaso = exterior (textura lateral, proyección cilíndrica) + interior; asa de taza como tubo elíptico. Esmalte: roughness 0.32 + clearcoat (mate: 0.78). Vidrio: translúcido (alpha 0.26, roughness 0.05, clearcoat) y acanalado real cuando la descripción lo indica.
3. `resto.mjs`: mismas recetas de antes, con materiales PBR (acero metálico, dorado, esmalte con clearcoat, vidrio translúcido, madera texturada) y la superficie de la foto en platos y bandejas de cerámica cuando el color medido coincide con el del material.

```bash
python3 scripts/modelos/analizar-fotos.py public/catalogo scripts/modelos/catalogo-modelos.json datos/fotos.json datos/texturas datos/rows.json
node scripts/modelos/realista.mjs scripts/modelos/catalogo-modelos.json datos/rows.json datos/fotos.json datos/texturas public/modelos
node scripts/modelos/resto.mjs datos/rows.json scripts/modelos/catalogo-modelos.json scripts/modelos/madera.png datos/fotos.json datos/texturas public/modelos <SKUs que realista no generó>
```

`CUB-27` conserva su modelo dedicado (`cuchillo-cub27.mjs`). Los `.glb` pesan entre 20 KB y 700 KB (texturas JPEG de 512 px incrustadas).
