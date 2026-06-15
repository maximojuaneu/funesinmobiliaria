'use client'
import {
  Document, Page, Text, View, Image, StyleSheet, Font
} from '@react-pdf/renderer'

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.woff', fontWeight: 400 },
    { src: '/fonts/Montserrat-SemiBold.woff', fontWeight: 600 },
    { src: '/fonts/Montserrat-Bold.woff', fontWeight: 700 },
    { src: '/fonts/Montserrat-Italic.woff', fontWeight: 400, fontStyle: 'italic' },
  ],
})

Font.register({
  family: 'Eurostile',
  fonts: [
    { src: '/fonts/EurostileRegular.otf', fontWeight: 400 },
  ],
})

const GREEN  = '#067148'
const LGRAY  = '#f4f4f4'
const DGRAY  = '#333333'
const MGRAY  = '#666666'
const WHITE  = '#ffffff'
const BORDER = '#e0e0e0'

const EURO = 'Eurostile'
const MONT = 'Montserrat'

const s = StyleSheet.create({
  page: { fontFamily: MONT, fontSize: 10, color: DGRAY, backgroundColor: WHITE },

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverBand:   { backgroundColor: GREEN, width: '100%', paddingVertical: 50, paddingHorizontal: 50, alignItems: 'center' },
  coverLogo:   { width: 160, height: 64, objectFit: 'contain', marginBottom: 28 },
  coverTitle:  { color: WHITE, fontSize: 22, fontFamily: EURO, textAlign: 'center', letterSpacing: 1 },
  coverProp:   { color: WHITE, fontSize: 15, fontFamily: MONT, fontWeight: 600, marginTop: 18, textAlign: 'center' },
  coverBody:   { flex: 1, width: '100%', paddingHorizontal: 50, paddingBottom: 44, alignItems: 'center', justifyContent: 'center' },
  coverFooter: { width: '100%', paddingHorizontal: 50, paddingBottom: 44, alignItems: 'center' },
  coverDate:   { fontSize: 9, color: MGRAY, marginBottom: 6, textAlign: 'center' },
  coverAgent:  { fontSize: 14, fontFamily: MONT, fontWeight: 700, color: DGRAY, textAlign: 'center' },
  coverDetail: { fontSize: 9, color: MGRAY, marginTop: 2, textAlign: 'center' },
  coverLine:   { width: 40, height: 3, backgroundColor: GREEN, marginBottom: 14 },

  // ── Content pages ──────────────────────────────────────────────────────────
  contentPage: { paddingHorizontal: 50, paddingVertical: 40 },
  pageHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                 borderBottomWidth: 2, borderBottomColor: GREEN, paddingBottom: 8, marginBottom: 22 },
  pageTitle:   { fontSize: 13, fontFamily: EURO, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.8 },
  pageLogo:    { width: 80, height: 32, objectFit: 'contain' },

  // ── Section labels ────────────────────────────────────────────────────────
  sectionLabel: { fontSize: 7.5, fontFamily: MONT, fontWeight: 700, color: WHITE, backgroundColor: GREEN,
                  paddingHorizontal: 8, paddingVertical: 3, textTransform: 'uppercase',
                  letterSpacing: 0.8, marginBottom: 8, marginTop: 14, alignSelf: 'flex-start' },
  row:          { flexDirection: 'row', marginBottom: 5, flexWrap: 'wrap' },
  field:        { marginRight: 24, marginBottom: 4 },
  fieldLabel:   { fontSize: 7, color: MGRAY, fontFamily: MONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 1 },
  fieldValue:   { fontSize: 9, color: DGRAY },

  // ── Metrics strip ────────────────────────────────────────────────────────
  metricsRow:  { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  metricBox:   { flex: 1, backgroundColor: LGRAY, borderRadius: 4, padding: 8, alignItems: 'center' },
  metricVal:   { fontSize: 12, fontFamily: MONT, fontWeight: 700, color: GREEN },
  metricLbl:   { fontSize: 7, color: MGRAY, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── Body text ────────────────────────────────────────────────────────────
  bodyText:    { fontSize: 9.5, lineHeight: 1.6, color: DGRAY, marginBottom: 6 },

  // ── Comparativo ──────────────────────────────────────────────────────────
  compTitle:   { fontSize: 10, fontFamily: MONT, fontWeight: 700, color: GREEN, marginBottom: 4 },
  compNum:     { fontSize: 24, fontFamily: EURO, color: LGRAY, position: 'absolute', right: 0, top: -4 },
  compBox:     { backgroundColor: LGRAY, borderRadius: 4, padding: 10, marginBottom: 6, position: 'relative' },
  compUrl:     { fontSize: 8, color: '#1a73e8', textDecoration: 'underline' },
  compDesc:    { fontSize: 9, color: MGRAY, marginTop: 4, lineHeight: 1.4 },
  compSep:     { borderTopWidth: 1, borderTopColor: BORDER, marginTop: 14, marginBottom: 10 },

  // ── Referencias ──────────────────────────────────────────────────────────
  refTable:    { marginTop: 8 },
  refRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 7, paddingHorizontal: 4 },
  refHead:     { flexDirection: 'row', backgroundColor: GREEN, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 3, marginBottom: 4 },
  refHeadText: { fontSize: 7.5, fontFamily: MONT, fontWeight: 700, color: WHITE, textTransform: 'uppercase', letterSpacing: 0.5 },
  refText:     { fontSize: 9, color: DGRAY },
  colUbi:      { flex: 2.5 },
  colDesc:     { flex: 3 },
  colAno:      { flex: 1, textAlign: 'center' },
  colPrecio:   { flex: 1.5, textAlign: 'right' },

  // ── ACM / Valuación ───────────────────────────────────────────────────────
  acmBox:      { backgroundColor: GREEN, borderRadius: 6, padding: 16, marginTop: 12, alignItems: 'center' },
  acmLabel:    { fontSize: 8, fontFamily: MONT, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.8 },
  acmValue:    { fontSize: 26, fontFamily: EURO, color: WHITE, marginVertical: 4 },
  acmRowBoxes: { flexDirection: 'row', gap: 10, marginTop: 10 },
  acmSmBox:    { flex: 1, backgroundColor: LGRAY, borderRadius: 4, padding: 8, alignItems: 'center' },
  acmSmLbl:    { fontSize: 7.5, color: MGRAY, textTransform: 'uppercase', letterSpacing: 0.5 },
  acmSmVal:    { fontSize: 13, fontFamily: EURO, color: GREEN, marginTop: 3 },
  segBox:      { backgroundColor: '#e6f4ee', borderRadius: 4, padding: 8, marginTop: 8, alignItems: 'center' },
  segLabel:    { fontSize: 7.5, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: MONT, fontWeight: 700 },
  segValue:    { fontSize: 13, fontFamily: EURO, color: GREEN, marginTop: 4 },
  segNote:     { fontSize: 7.5, color: MGRAY, marginTop: 4, textAlign: 'center', lineHeight: 1.5 },

  // ── Marketing (inline) ────────────────────────────────────────────────────
  mktBand:     { backgroundColor: GREEN, padding: 16, alignItems: 'center', marginTop: 18, marginBottom: 12, borderRadius: 4 },
  mktTitle:    { color: WHITE, fontSize: 11, fontFamily: EURO, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 },
  mktItem:     { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start', gap: 8 },
  mktDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: GREEN, marginTop: 3, flexShrink: 0 },
  mktItemTitle:{ fontSize: 9, fontFamily: MONT, fontWeight: 700, color: GREEN, marginBottom: 1 },
  mktItemBody: { fontSize: 8.5, color: MGRAY, lineHeight: 1.4 },
  mktFooter:   { position: 'absolute', bottom: 40, left: 50, right: 50, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10, alignItems: 'center' },
  mktFooterTxt:{ fontSize: 8, color: MGRAY },

  // ── Disclaimer ────────────────────────────────────────────────────────────
  disclaimer: { marginTop: 14, backgroundColor: '#fff8e1', borderRadius: 4, padding: 8 },
  disclaimerTxt: { fontSize: 8, color: '#7d6206', lineHeight: 1.5 },
})

// ── Helpers ────────────────────────────────────────────────────────────────
const Hdr = ({ title, logoUrl }: { title: string; logoUrl: string }) => (
  <View style={s.pageHeader}>
    <Text style={s.pageTitle}>{title}</Text>
    <Image src={logoUrl} style={s.pageLogo} />
  </View>
)

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={s.field}>
    <Text style={s.fieldLabel}>{label}</Text>
    <Text style={s.fieldValue}>{value || '—'}</Text>
  </View>
)

const SLabel = ({ text }: { text: string }) => (
  <Text style={s.sectionLabel}>{text}</Text>
)

function fmt(v: string) {
  if (!v) return '—'
  const n = parseFloat(v.replace(/[^\d.]/g, ''))
  if (isNaN(n)) return v
  return 'U$S ' + n.toLocaleString('es-AR')
}

// Renderiza un bloque de comparativo reutilizable
const CompBlock = ({ comp, index, withSep }: { comp: Comparativo; index: number; withSep: boolean }) => (
  <View>
    {withSep ? <View style={s.compSep} /> : null}
    <Text style={[s.sectionLabel, { marginTop: withSep ? 0 : 14 }]}>Comparativo {index + 1}</Text>
    {comp.fotos && comp.fotos.length > 0 ? (
      <View style={{ flexDirection: 'row', gap: 5, marginBottom: 8 }}>
        {comp.fotos.map((foto, fi) => (
          <Image key={fi} src={foto} style={{ flex: 1, height: 120, borderRadius: 4, objectFit: 'cover' }} />
        ))}
      </View>
    ) : null}
    <View style={s.compBox}>
      <Text style={s.compNum}>{index + 1}</Text>
      {comp.titulo ? <Text style={s.compTitle}>{comp.titulo}</Text> : null}
      {comp.url ? <Text style={s.compUrl}>{comp.url}</Text> : null}
      {comp.descripcion ? <Text style={s.compDesc}>{comp.descripcion}</Text> : null}
    </View>
  </View>
)

// ── Types ─────────────────────────────────────────────────────────────────
export interface Comparativo { titulo: string; url: string; descripcion: string; fotos?: string[] }
export interface Referencia  { ubicacion: string; descripcion: string; año: string; precio: string }

export interface TasacionData {
  agenteNombre:      string
  agenteSubtitulo:   string
  agenteCel:         string
  agenteEmail:       string
  agenteFoto?:       string
  fecha:             string
  solicitanteNombre: string
  solicitanteTel:    string
  solicitanteEmail:  string
  propiedadNombre:   string
  calle:             string
  numero:            string
  barrio:            string
  ciudad:            string
  supTerreno:        string
  supCubierta:       string
  supSemicubierta:   string
  antiguedad:        string
  aptaCredito:       string
  descripcionAmbientes: string
  caracteristicasZona:  string
  servicios:            string
  comparativos:  Comparativo[]
  referencias:   Referencia[]
  valorACM:      string
  valorPublicacion: string
  segmentoMin:   string
  segmentoMax:   string
}

// ── Document ──────────────────────────────────────────────────────────────
export function TasacionDocument({ data, logoUrl, logoBlancoUrl }: { data: TasacionData; logoUrl: string; logoBlancoUrl: string }) {
  const comps = data.comparativos.filter(c => c.titulo.trim() || c.url.trim() || c.descripcion.trim())
  const refs  = data.referencias.filter(r => r.ubicacion.trim())


  const MKT_ITEMS = [
    { t: 'Experiencia y trayectoria', b: 'Años en el mercado inmobiliario de Rosario nos avalan. Conocemos los barrios, los valores y los tiempos reales del mercado.' },
    { t: 'Red de compradores activos', b: 'Contamos con una cartera de compradores calificados que están buscando propiedades como la tuya en este momento.' },
    { t: 'Asesoramiento integral', b: 'Te acompañamos en cada etapa del proceso: valuación, presentación, negociación y cierre de la operación.' },
    { t: 'Marketing profesional', b: 'Difundimos tu propiedad en los principales portales inmobiliarios, redes sociales y canales digitales con material de alta calidad.' },
    { t: 'Transparencia y confianza', b: 'Trabajamos con total claridad, informándote en cada paso y defendiendo siempre el mejor precio para tu propiedad.' },
  ]

  return (
    <Document title={`Informe de Valoración - ${data.propiedadNombre}`} author={data.agenteNombre}>

      {/* ── 1. TAPA ──────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <View style={s.coverBand}>
          <Image src={logoBlancoUrl} style={s.coverLogo} />
          <Text style={s.coverTitle}>INFORME DE VALORACIÓN{'\n'}DE PROPIEDAD</Text>
          {data.propiedadNombre ? <Text style={s.coverProp}>{data.propiedadNombre}</Text> : null}
        </View>
        {/* Centro: foto grande del agente */}
        <View style={s.coverBody}>
          {data.agenteFoto ? (
            <Image src={data.agenteFoto} style={{ width: 180, height: 180, borderRadius: 90, objectFit: 'cover' }} />
          ) : null}
        </View>
        {/* Inferior: fecha + nombre + datos, centrados */}
        <View style={s.coverFooter}>
          <View style={s.coverLine} />
          <Text style={s.coverDate}>Fecha: {data.fecha}</Text>
          <Text style={s.coverAgent}>{data.agenteNombre || '—'}</Text>
          <Text style={s.coverDetail}>{data.agenteSubtitulo}</Text>
          {data.agenteCel   ? <Text style={s.coverDetail}>Cel. {data.agenteCel}</Text>   : null}
          {data.agenteEmail ? <Text style={s.coverDetail}>{data.agenteEmail}</Text> : null}
        </View>
      </Page>

      {/* ── 2. DATOS ─────────────────────────────────────────────────────── */}
      <Page size="A4" style={[s.page, s.contentPage]}>
        <Hdr title="Datos de la Propiedad" logoUrl={logoUrl} />

        <SLabel text="Datos del solicitante" />
        <View style={s.row}>
          <Field label="Nombre completo" value={data.solicitanteNombre} />
          <Field label="Teléfono de contacto" value={data.solicitanteTel} />
          {data.solicitanteEmail ? <Field label="Email" value={data.solicitanteEmail} /> : null}
        </View>

        <SLabel text="Ubicación" />
        <View style={s.row}>
          <Field label="Calle"  value={data.calle}  />
          <Field label="Número" value={data.numero} />
          <Field label="Barrio" value={data.barrio} />
          <Field label="Ciudad" value={data.ciudad} />
        </View>

        <SLabel text="Características del inmueble" />
        <View style={s.metricsRow}>
          <View style={s.metricBox}><Text style={s.metricVal}>{data.supTerreno || '—'} m²</Text><Text style={s.metricLbl}>Terreno</Text></View>
          <View style={s.metricBox}><Text style={s.metricVal}>{data.supCubierta || '—'} m²</Text><Text style={s.metricLbl}>Cubierta</Text></View>
          <View style={s.metricBox}><Text style={s.metricVal}>{data.supSemicubierta || '—'} m²</Text><Text style={s.metricLbl}>Semicubierta</Text></View>
          <View style={s.metricBox}><Text style={s.metricVal}>{data.antiguedad || '—'} años</Text><Text style={s.metricLbl}>Antigüedad</Text></View>
          <View style={s.metricBox}><Text style={s.metricVal}>{data.aptaCredito || '—'}</Text><Text style={s.metricLbl}>Apta crédito</Text></View>
        </View>

        {data.descripcionAmbientes ? (
          <>
            <SLabel text="Distribución y características de los ambientes" />
            <Text style={s.bodyText}>{data.descripcionAmbientes}</Text>
          </>
        ) : null}

        <SLabel text="Factores de la ubicación y entorno" />
        <View style={s.row}><Field label="Características de la zona" value={data.caracteristicasZona} /></View>
        <View style={s.row}><Field label="Servicios disponibles" value={data.servicios} /></View>
      </Page>

      {/* ── 3. MÉTODO + COMPARATIVOS (flujo natural, react-pdf maneja saltos) ── */}
      <Page size="A4" style={[s.page, s.contentPage]}>
        <Hdr title="Método de Valoración" logoUrl={logoUrl} />
        <SLabel text="Método utilizado" />
        <Text style={s.bodyText}>
          Para realizar la valoración del bien inmueble se ha utilizado el método de análisis comparativo de mercado tomando como referencia antecedentes de venta y/o oferta de inmuebles en la zona debidamente estandarizados para obtener un valor más preciso.
        </Text>
        <View style={s.disclaimer}>
          <Text style={s.disclaimerTxt}>
            Este documento no tiene valor como tasación ni para presentaciones judiciales, sino que tiene como objetivo sugerir un valor de venta del inmueble. Vigencia 90 días.
          </Text>
        </View>
        {comps.map((comp, i) => (
          <View key={i} wrap={false}>
            <CompBlock comp={comp} index={i} withSep={true} />
          </View>
        ))}
      </Page>

      {/* ── 5. REFERENCIAS ───────────────────────────────────────────────── */}
      {refs.length > 0 ? (
        <Page size="A4" style={[s.page, s.contentPage]}>
          <Hdr title="Referencias de Ventas" logoUrl={logoUrl} />
          <SLabel text="Referencias de ventas en la zona" />
          <View style={s.refTable}>
            <View style={s.refHead}>
              <Text style={[s.refHeadText, s.colUbi]}>Ubicación</Text>
              <Text style={[s.refHeadText, s.colDesc]}>Descripción</Text>
              <Text style={[s.refHeadText, s.colAno]}>Año</Text>
              <Text style={[s.refHeadText, s.colPrecio]}>Precio cierre</Text>
            </View>
            {refs.map((ref, i) => (
              <View key={i} style={[s.refRow, i % 2 === 1 ? { backgroundColor: LGRAY } : {}]}>
                <Text style={[s.refText, s.colUbi]}>{ref.ubicacion}</Text>
                <Text style={[s.refText, s.colDesc]}>{ref.descripcion}</Text>
                <Text style={[s.refText, s.colAno, { textAlign: 'center' }]}>{ref.año}</Text>
                <Text style={[s.refText, s.colPrecio, { textAlign: 'right' }]}>{fmt(ref.precio)}</Text>
              </View>
            ))}
          </View>
        </Page>
      ) : null}

      {/* ── 6. VALUACIÓN + MARKETING + FOOTER ───────────────────────────── */}
      <Page size="A4" style={[s.page, s.contentPage]}>
        <Hdr title="Valuación y Cierre" logoUrl={logoUrl} />
        <SLabel text="Resultado de la valoración" />

        <View style={s.acmBox}>
          <Text style={s.acmLabel}>Valoración del inmueble</Text>
          <Text style={s.acmValue}>{fmt(data.valorACM)}</Text>
        </View>

        <View style={s.acmRowBoxes}>
          <View style={s.acmSmBox}>
            <Text style={s.acmSmLbl}>Valor sugerido de publicación</Text>
            <Text style={s.acmSmVal}>{fmt(data.valorPublicacion)}</Text>
          </View>
        </View>

        <View style={s.segBox}>
          <Text style={s.segLabel}>Segmento metrológico de venta</Text>
          <Text style={s.segValue}>{fmt(data.segmentoMin)} – {fmt(data.segmentoMax)}</Text>
          <Text style={s.segNote}>
            Este segmento establece el rango de valores en los que posiblemente{'\n'}llegue la oferta real por la propiedad.
          </Text>
        </View>

        {/* Marketing inline */}
        <View style={s.mktBand}>
          <Text style={s.mktTitle}>¿Por qué somos la mejor opción{'\n'}a la hora de vender tu propiedad?</Text>
        </View>
        {MKT_ITEMS.map(item => (
          <View key={item.t} style={s.mktItem}>
            <View style={s.mktDot} />
            <View>
              <Text style={s.mktItemTitle}>{item.t}</Text>
              <Text style={s.mktItemBody}>{item.b}</Text>
            </View>
          </View>
        ))}

        <View style={s.mktFooter}>
          <Image src={logoUrl} style={{ width: 90, height: 36, objectFit: 'contain', marginBottom: 5 }} />
          <Text style={s.mktFooterTxt}>{data.agenteNombre ? `${data.agenteNombre} — Funes Inmobiliaria` : 'Funes Inmobiliaria'}</Text>
          {data.agenteEmail ? <Text style={s.mktFooterTxt}>{data.agenteEmail}</Text> : null}
          {data.agenteCel   ? <Text style={s.mktFooterTxt}>Cel. {data.agenteCel}</Text>  : null}
        </View>
      </Page>

    </Document>
  )
}
