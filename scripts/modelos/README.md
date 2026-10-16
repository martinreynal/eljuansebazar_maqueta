# Modelos 3D de productos

Los archivos `.glb` de `public/modelos/` se reconstruyen a partir de las fotos del catálogo y de medidas típicas o conocidas: geometría real (no una foto plana), con materiales y texturas.

- `cuchillo-cub27.mjs`: genera `public/modelos/CUB-27.glb` (cuchillo de acero inoxidable, mango de madera, filo dentado). Hoja extruida con dientes reales, mango redondeado con textura de madera (`madera.png`), dos remaches.

Para correrlo hace falta un proyecto con `three` y `@gltf-transform/core` instalados (por ejemplo el del simulador de mesa):

```bash
node scripts/modelos/cuchillo-cub27.mjs public/modelos/CUB-27.glb
```

Para asociar un modelo a un producto: en el panel, campo **Modelo 3D** con la ruta (`/modelos/CUB-27.glb`). Si el producto no tiene modelo, la ficha muestra solo la foto.
