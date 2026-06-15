import { google } from 'googleapis'

const PROPERTY_ID = process.env.GA_PROPERTY_ID ?? ''

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
}

function n(val: string | undefined | null) {
  return Math.round(parseFloat(val ?? '0'))
}

function pct(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

const CHANNEL_LABEL: Record<string, string> = {
  'Organic Search':  'Google orgánico',
  'Direct':          'Directo',
  'Organic Social':  'Redes sociales',
  'Paid Social':     'Redes sociales (pago)',
  'Referral':        'Referidos',
  'Email':           'Email',
  'Paid Search':     'Google Ads',
  'Display':         'Display',
  'Unassigned':      'Sin asignar',
}

const DEVICE_LABEL: Record<string, string> = {
  mobile:  'Mobile',
  desktop: 'Desktop',
  tablet:  'Tablet',
}

export interface GaOverview {
  totalUsers: number
  newUsers: number
  avgEngagementTimeSecs: number
  engagementRate: number
}

export interface GaPage       { label: string; path: string; views: number }
export interface GaSource     { source: string; sessions: number; pct: number }
export interface GaCity       { city: string; sessions: number }
export interface GaDevice     { device: string; sessions: number; pct: number }
export interface GaLanding    { label: string; path: string; sessions: number }
export interface GaProperty   { label: string; path: string; id: string; views: number }

export interface GaData {
  overview:       GaOverview
  topPages:       GaPage[]
  propertyPages:  GaProperty[]
  trafficSources: GaSource[]
  cities:         GaCity[]
  devices:        GaDevice[]
  landingPages:   GaLanding[]
}

export async function getAnalyticsData(startDate: string, endDate: string): Promise<GaData | null> {
  if (!PROPERTY_ID) return null

  try {
    const auth = getAuth()
    const ga   = google.analyticsdata({ version: 'v1beta', auth })
    const range = [{ startDate, endDate }]

    const [overviewRes, pagesRes, propPagesRes, sourcesRes, citiesRes, devicesRes, landingRes] =
      await Promise.all([
        // Overview
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            metrics: [
              { name: 'totalUsers' },
              { name: 'newUsers' },
              { name: 'averageSessionDuration' },
              { name: 'engagementRate' },
            ],
          },
        }),
        // Top pages (all)
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10,
            dimensionFilter: {
              notExpression: {
                filter: {
                  fieldName: 'pagePath',
                  stringFilter: { matchType: 'BEGINS_WITH', value: '/propiedades/' },
                },
              },
            },
          },
        }),
        // Property detail pages (matches /propiedades/, /ficha/, /propiedad/)
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
            metrics: [{ name: 'screenPageViews' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 5,
            dimensionFilter: {
              orGroup: {
                expressions: [
                  { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/propiedades/' } } },
                  { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/ficha/' } } },
                  { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/propiedad/' } } },
                  { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: '/inmueble/' } } },
                ],
              },
            },
          },
        }),
        // Traffic sources
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          },
        }),
        // Cities
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'city' }],
            metrics: [{ name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
            limit: 10,
            dimensionFilter: {
              notExpression: {
                filter: {
                  fieldName: 'city',
                  stringFilter: { matchType: 'EXACT', value: '(not set)' },
                },
              },
            },
          },
        }),
        // Devices
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'sessions' }],
          },
        }),
        // Landing pages
        ga.properties.runReport({
          property: `properties/${PROPERTY_ID}`,
          requestBody: {
            dateRanges: range,
            dimensions: [{ name: 'landingPage' }],
            metrics: [{ name: 'sessions' }],
            orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
            limit: 10,
          },
        }),
      ])

    const ov = overviewRes.data.rows?.[0]
    const overview: GaOverview = {
      totalUsers:           n(ov?.metricValues?.[0]?.value),
      newUsers:             n(ov?.metricValues?.[1]?.value),
      avgEngagementTimeSecs: n(ov?.metricValues?.[2]?.value),
      engagementRate:       Math.round(parseFloat(ov?.metricValues?.[3]?.value ?? '0') * 100),
    }

    const PAGE_LABEL: Record<string, string> = {
      '/':                     'Inicio',
      '/venta':                'Venta',
      '/alquiler':             'Alquiler',
      '/emprendimientos':      'Emprendimientos',
      '/nosotros':             'Nosotros',
      '/contacto':             'Contacto',
      '/tasar-mi-propiedad':   'Tasación',
      '/sumate':               'Sumate al equipo',
    }

    const topPages: GaPage[] = (pagesRes.data.rows ?? []).map(r => {
      const path = r.dimensionValues?.[0]?.value ?? ''
      return { label: PAGE_LABEL[path] ?? path, path, views: n(r.metricValues?.[0]?.value) }
    })

    const propertyPages: GaProperty[] = (propPagesRes.data.rows ?? []).map(r => {
      const path  = r.dimensionValues?.[0]?.value ?? ''
      const title = r.dimensionValues?.[1]?.value ?? path
      const id    = path.split('/').pop() ?? ''
      return { label: title.replace(' | Funes Inmobiliaria', '').trim(), path, id, views: n(r.metricValues?.[0]?.value) }
    })

    const totalSessions = (sourcesRes.data.rows ?? []).reduce((s, r) => s + n(r.metricValues?.[0]?.value), 0)
    const trafficSources: GaSource[] = (sourcesRes.data.rows ?? []).map(r => {
      const raw = r.dimensionValues?.[0]?.value ?? ''
      const sessions = n(r.metricValues?.[0]?.value)
      return { source: CHANNEL_LABEL[raw] ?? raw, sessions, pct: pct(sessions, totalSessions) }
    })

    const cities: GaCity[] = (citiesRes.data.rows ?? []).map(r => ({
      city:     r.dimensionValues?.[0]?.value ?? '',
      sessions: n(r.metricValues?.[0]?.value),
    }))

    const totalDevSessions = (devicesRes.data.rows ?? []).reduce((s, r) => s + n(r.metricValues?.[0]?.value), 0)
    const devices: GaDevice[] = (devicesRes.data.rows ?? []).map(r => {
      const raw = r.dimensionValues?.[0]?.value ?? ''
      const sessions = n(r.metricValues?.[0]?.value)
      return { device: DEVICE_LABEL[raw] ?? raw, sessions, pct: pct(sessions, totalDevSessions) }
    })

    const landingPages: GaLanding[] = (landingRes.data.rows ?? []).map(r => {
      const path = r.dimensionValues?.[0]?.value ?? ''
      return { label: PAGE_LABEL[path] ?? path, path, sessions: n(r.metricValues?.[0]?.value) }
    })

    return { overview, topPages, propertyPages, trafficSources, cities, devices, landingPages }
  } catch (err) {
    console.error('[analytics]', err)
    return null
  }
}
