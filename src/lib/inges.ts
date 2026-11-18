import "server-only";
import JSZip from "jszip";
import { INGES_TEMPLATE_B64 } from "./inges-template";

/**
 * Exporta la contracara de un producto en la planilla de clasificación INGES (el mismo archivo que pide el despachante),
 * completando sus celdas y pegando la foto del producto en el recuadro «Fotos de producto a posicionar».
 * Lo que no está cargado queda con el texto guía original («ADD …») para que se vea qué falta.
 */

export type IngesData = {
  inges_order: string; customs_name: string; customs_description: string; origin: string; operating_details: string;
  material_composition: string; sample: string; customs_notes: string;
  total_pcs: number | null; units_per_box: number | null; total_cartons: number | null; box_dimensions: string; total_cbm: number | null;
  cost: number | null; currency: string; fob_djai: number | null; net_weight_g: number | null; shipping_mode: string; loading_port: string; lead_time: string;
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Reemplaza el contenido de una celda conservando su formato (estilo). */
function setCell(xml: string, ref: string, value: string | number | null | undefined, style?: number): string {
  if (value === null || value === undefined || value === "") return xml;
  const re = new RegExp(`<c r="${ref}"([^>]*?)(/>|>[\\s\\S]*?</c>)`);
  return xml.replace(re, (_m, attrs: string) => {
    const s = style ?? attrs.match(/\ss="(\d+)"/)?.[1];
    const st = s ? ` s="${s}"` : "";
    if (typeof value === "number") return `<c r="${ref}"${st}><v>${value}</v></c>`;
    return `<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  });
}

const EMU = 9525; // por píxel

export async function buildIngesXlsx(d: IngesData, photo?: { data: Buffer; px: number } | null): Promise<Buffer> {
  const zip = await JSZip.loadAsync(Buffer.from(INGES_TEMPLATE_B64, "base64"));
  const sheetPath = "xl/worksheets/sheet1.xml";
  let x = await zip.file(sheetPath)!.async("string");

  const fob = d.cost == null ? null : d.currency === "USD" ? d.cost : `${d.currency} ${d.cost}`;
  const cells: [string, string | number | null][] = [
    ["C1", d.inges_order], ["C4", d.customs_name], ["C5", d.customs_description], ["C6", d.origin], ["C7", d.operating_details],
    ["C8", d.material_composition], ["C9", d.sample], ["C10", d.customs_notes],
    ["F3", d.total_pcs], ["F4", d.units_per_box], ["F5", d.total_cartons], ["F6", d.box_dimensions], ["F7", d.total_cbm],
    ["F8", fob], ["F9", d.fob_djai], ["F10", d.net_weight_g],
    ["F11", d.shipping_mode === "aereo" ? "AÉREO" : d.shipping_mode === "maritimo" ? "MARÍTIMO" : null],
    ["F12", d.loading_port], ["F13", d.lead_time],
  ];
  // Estilo extra: el de las celdas de texto de la planilla, con ajuste de línea (los textos largos no se salen del recuadro)
  const stylesPath = "xl/styles.xml";
  let styles = await zip.file(stylesPath)!.async("string");
  let wrap: number | undefined;
  styles = styles.replace(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/, (_m, n: string, body: string) => {
    wrap = Number(n);
    const xf = '<xf numFmtId="0" fontId="10" fillId="0" borderId="11" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>';
    return `<cellXfs count="${wrap + 1}">${body}${xf}</cellXfs>`;
  });
  zip.file(stylesPath, styles);
  for (const [ref, v] of cells) x = setCell(x, ref, v, /^C([4-9]|10)$/.test(ref) && typeof v === "string" ? wrap : undefined);

  if (photo) {
    // La foto ocupa el recuadro B12:C19 (≈ 636 × 320 px): cuadrada, centrada
    x = setCell(x, "B12", " ");
    const side = 290, colOff = Math.round((636 - side) / 2), rowOff = 15;
    x = x.replace("</worksheet>", '<drawing r:id="rIdFoto"/></worksheet>');
    const relsPath = "xl/worksheets/_rels/sheet1.xml.rels";
    const rels = await zip.file(relsPath)!.async("string");
    zip.file(relsPath, rels.replace("</Relationships>", '<Relationship Id="rIdFoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/></Relationships>'));
    zip.file("xl/drawings/drawing1.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:oneCellAnchor><xdr:from><xdr:col>1</xdr:col><xdr:colOff>${colOff * EMU}</xdr:colOff><xdr:row>11</xdr:row><xdr:rowOff>${rowOff * EMU}</xdr:rowOff></xdr:from><xdr:ext cx="${side * EMU}" cy="${side * EMU}"/><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="2" name="Foto del producto"/><xdr:cNvPicPr><a:picLocks noChangeAspect="1"/></xdr:cNvPicPr></xdr:nvPicPr><xdr:blipFill><a:blip xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></xdr:blipFill><xdr:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${side * EMU}" cy="${side * EMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></xdr:spPr></xdr:pic><xdr:clientData/></xdr:oneCellAnchor></xdr:wsDr>`);
    zip.file("xl/drawings/_rels/drawing1.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.jpeg"/></Relationships>`);
    zip.file("xl/media/image1.jpeg", photo.data);
    const ctPath = "[Content_Types].xml";
    let ct = await zip.file(ctPath)!.async("string");
    if (!/Extension="jpeg"/.test(ct)) ct = ct.replace("<Default ", '<Default Extension="jpeg" ContentType="image/jpeg"/><Default ');
    ct = ct.replace("</Types>", '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>');
    zip.file(ctPath, ct);
  }

  zip.file(sheetPath, x);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
