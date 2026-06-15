'use client'
import {
  Document, Page, Text, View, Image, StyleSheet, Font,
} from '@react-pdf/renderer'

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '/fonts/Montserrat-Regular.woff',  fontWeight: 400 },
    { src: '/fonts/Montserrat-SemiBold.woff', fontWeight: 600 },
    { src: '/fonts/Montserrat-Bold.woff',     fontWeight: 700 },
  ],
})
Font.register({
  family: 'Eurostile',
  fonts: [{ src: '/fonts/EurostileRegular.otf', fontWeight: 400 }],
})

const GREEN  = '#067148'
const DGRAY  = '#1a1a1a'
const MGRAY  = '#666666'
const WHITE  = '#ffffff'
const BORDER = '#e0e0e0'
const MONT   = 'Montserrat'
const EURO   = 'Eurostile'

const s = StyleSheet.create({
  page:      { fontFamily: MONT, fontSize: 10, color: DGRAY, backgroundColor: WHITE,
               paddingHorizontal: 50, paddingTop: 32, paddingBottom: 52 },

  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
               borderBottomWidth: 2, borderBottomColor: GREEN, paddingBottom: 8, marginBottom: 12 },
  logo:      { width: 90, height: 36, objectFit: 'contain' },
  title:     { fontSize: 15, fontFamily: EURO, color: GREEN, textTransform: 'uppercase', letterSpacing: 0.8 },

  body:      { fontSize: 9.5, lineHeight: 1.75, color: DGRAY, marginBottom: 5, textAlign: 'justify' },
  bold:      { fontFamily: MONT, fontWeight: 700 },
  underline: { textDecoration: 'underline' },

  rule:      { borderBottomWidth: 1, borderBottomColor: BORDER, marginVertical: 8 },

  sigSection:{ marginTop: 14, borderTopWidth: 1, borderTopColor: DGRAY, paddingTop: 10 },
  sigTitle:  { fontSize: 9, fontFamily: MONT, fontWeight: 700, color: MGRAY,
               textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sigRow:    { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  sigLeft:   { flex: 1 },
  sigRight:  { flex: 1, marginLeft: 20 },
  sigImg:    { width: 130, height: 52, objectFit: 'contain', marginBottom: 3 },
  sigSpace:  { height: 52, marginBottom: 3 },
  sigLine:   { borderBottomWidth: 1, borderBottomColor: DGRAY, marginBottom: 3 },
  sigLabel:  { fontSize: 8, color: MGRAY },
  sigValue:  { fontSize: 9, fontFamily: MONT, fontWeight: 700, color: DGRAY },

  dataRow:   { flexDirection: 'row', marginBottom: 8 },
  dataLabel: { fontSize: 8.5, color: MGRAY, width: 110 },
  dataLine:  { flex: 1, borderBottomWidth: 1, borderBottomColor: DGRAY, marginLeft: 4, paddingBottom: 1 },
  dataValue: { fontSize: 9, color: DGRAY },

  footer:    { position: 'absolute', bottom: 22, left: 50, right: 50,
               borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7,
               flexDirection: 'row', justifyContent: 'space-between' },
  footerTxt: { fontSize: 7, color: MGRAY },
})

export interface AutorizacionData {
  agenteNombre:   string
  agenteEmail:    string
  inmuebleDir:    string
  inmuebleCiudad: string
  provincia:      string
  partida:        string
  precio:         string
  precioLetras:   string
  exclusividad:   boolean
  fecha:          string
  // filled by client
  titularNombre:  string
  titularDNI:     string
  titularTel:     string
  titularEmail:   string
  firmaDataUrl:   string
}

function parseFecha(fecha: string) {
  const parts = fecha.split('/')
  if (parts.length !== 3) return { dia: fecha, mes: '', año: '' }
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
                 'julio','agosto','septiembre','octubre','noviembre','diciembre']
  return { dia: String(parseInt(parts[0])), mes: meses[parseInt(parts[1]) - 1] ?? parts[1], año: parts[2] }
}

export function AutorizacionDocument({ data, logoUrl }: { data: AutorizacionData; logoUrl: string }) {
  const { dia, mes, año } = parseFecha(data.fecha)
  const excl = data.exclusividad

  const dir     = data.inmuebleDir    || '........................................'
  const ciudad  = data.inmuebleCiudad || '..................'
  const prov    = data.provincia      || '.................'
  const partida = data.partida        || '.............................................................................'
  const precio  = data.precio         || '……………'
  const pLetras = data.precioLetras   ? `${data.precioLetras} dólares` : '……………………………………………………………'

  return (
    <Document title="Autorización de Venta" author="Funes Inmobiliaria">
      <Page size="LEGAL" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Autorización de Venta</Text>
          <Image src={logoUrl} style={s.logo} />
        </View>

        {/* Cuerpo del documento — texto exacto del original */}
        <Text style={s.body}>
          {'Por la presente autorizo'}
          {excl ? <Text style={s.bold}>{' en exclusividad'}</Text> : null}
          {' a '}
          <Text style={s.bold}>FUNES INMOBILIARIA</Text>
          {' representada por C.I Fabio H. Juaneu Mat. 0298 COCIR y/o C.I Máximo F. Juaneu Mat. 2708 COCIR, con oficinas en calle Córdoba 2115 (s/ruta 9) Funes; para que gestionen la venta, por mi cuenta y orden, de la propiedad ubicada en '}
          <Text style={s.underline}>{dir}</Text>
          {' de la ciudad de '}
          <Text style={s.underline}>{ciudad}</Text>
          {', Pcia de '}
          <Text style={s.underline}>{prov}</Text>
          {' denominada con partida inmobiliaria N° '}
          <Text style={s.underline}>{partida}</Text>
        </Text>

        <View style={s.rule} />

        <Text style={s.body}>
          {'El precio de venta es de '}
          <Text style={s.underline}>{pLetras}</Text>
          {' (U$S '}
          <Text style={s.underline}>{precio}</Text>
          {'), siendo la forma de pago a convenir. En caso de vender el inmueble abonare a Uds. en concepto de honorarios inmobiliarios, el equivalente al tres por ciento (3%) mas IVA del valor total de la compra-venta. Garantizo a ustedes que los títulos de propiedad son perfectos y sobre esta base pueden vender. Los impuestos que graven el inmueble deberán ser abonados por mi parte hasta el día de la escrituración a favor de los compradores (salvo acuerdo contrario).'}
        </Text>

        <Text style={s.body}>
          {'La presente autorización es amplia e irrevocablemente valida por '}
          <Text style={s.bold}>ciento ochenta (180) días</Text>
          {' a partir del '}
          <Text style={s.underline}>{dia}</Text>
          {' de '}
          <Text style={s.underline}>{mes}</Text>
          {' de '}
          <Text style={s.underline}>{año}</Text>
          {', quedando automáticamente prorrogada a partir del vencimiento por periodos de treinta días (30) sucesivos si no comunicara fehacientemente la voluntad de dejarla sin efecto, obligándome a respetar la operación como bien realizada en las condiciones y plazos establecidos en la autorización.'}
        </Text>

        <Text style={s.body}>
          Si la operación se concretara durante el período de la vigencia de la presente autorización en forma directa entre vendedor y comprador sin informar a la inmobiliaria, o si luego de vencido el plazo se realizara la operación compraventa con clientes que hubieran efectuado tratativas con Uds, se le reconocerá los honorarios inmobiliarios pactados mas los honorarios inmobiliarios de la parte compradora del 3% mas IVA.
        </Text>

        <Text style={s.body}>
          Todos los gastos que demande la concreción del negocio, publicidad, carteles, movilidad, etc. serán soportados por la inmobiliaria interviniente. Autorizo al corredor inmobiliario a tomar reservas de ofertas y retener el monto entregado en tal concepto hasta el día la firma del boleto/cesión/adhesión o escritura traslativa de dominio (lo que ocurra primero).
        </Text>

        <Text style={s.body}>
          Además, autorizo a que publiquen en los medios de comunicación tradicionales y como así también en los medios de comunicación digitales y las redes sociales, y que coloquen cartel de VENTA en la propiedad.-
        </Text>

        <Text style={[s.body, { marginTop: 4 }]}>
          {'Funes, a los '}
          <Text style={s.underline}>{dia}</Text>
          {' días del mes de '}
          <Text style={s.underline}>{mes}</Text>
          {' de '}
          <Text style={s.underline}>{año}</Text>
          {'.-'}
        </Text>

        {/* Bloque de firma */}
        <View style={s.sigSection}>
          <Text style={s.sigTitle}>Firma del Vendedor</Text>

          {/* Firma canvas */}
          <View style={s.sigRow}>
            <View style={s.sigLeft}>
              {data.firmaDataUrl
                ? <Image src={data.firmaDataUrl} style={s.sigImg} />
                : <View style={s.sigSpace} />
              }
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Firma</Text>
            </View>
          </View>

          {/* Datos del vendedor */}
          <View style={s.dataRow}>
            <Text style={s.dataLabel}>Aclaración</Text>
            <View style={s.dataLine}>
              <Text style={s.dataValue}>{data.titularNombre || ''}</Text>
            </View>
          </View>
          <View style={s.dataRow}>
            <Text style={s.dataLabel}>DNI</Text>
            <View style={s.dataLine}>
              <Text style={s.dataValue}>{data.titularDNI || ''}</Text>
            </View>
          </View>
          <View style={s.dataRow}>
            <Text style={s.dataLabel}>TE</Text>
            <View style={s.dataLine}>
              <Text style={s.dataValue}>{data.titularTel || ''}</Text>
            </View>
          </View>
          <View style={s.dataRow}>
            <Text style={s.dataLabel}>Domicilio electrónico</Text>
            <View style={s.dataLine}>
              <Text style={s.dataValue}>{data.titularEmail || ''}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerTxt}>FUNES INMOBILIARIA — Córdoba 2115 (s/ruta 9), Funes — Mat. 0298</Text>
          <Text style={s.footerTxt}>{data.fecha}</Text>
        </View>

      </Page>
    </Document>
  )
}
