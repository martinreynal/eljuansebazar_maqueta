/**
 * Productos cuyas fotos se muestran giradas (en grados, sentido horario).
 * -90 = giro a la izquierda: la punta de cuchillos y tenedores apunta hacia arriba.
 */
export const IMAGE_ROTATION: Record<string, number> = {
  "CUB-31": -90,
  "CUB-32": -90,
  "CUB-33": -90,
};
export const rotationOf = (sku?: string) => (sku ? IMAGE_ROTATION[sku] ?? 0 : 0);
