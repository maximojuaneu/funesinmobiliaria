# Funes Inmobiliaria — Plataforma Web

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** con paleta de marca (#067148)
- **Fuente**: Montserrat
- **API**: Tokko Broker
- **Leads**: Google Sheets API
- **Auth**: JWT (jose) con cookies HttpOnly
- **Mapa**: Leaflet (dashboard privado)
- **Flyers**: HTML5 Canvas

---

## Instalación

### 1. Instalar Node.js
Descargá Node.js desde [nodejs.org](https://nodejs.org) (versión 20 LTS recomendada).

### 2. Instalar dependencias

```bash
cd "funes-web"
npm install
```

### 3. Configurar variables de entorno

Copiá `.env.example` a `.env.local` y completá los valores:

```bash
cp .env.example .env.local
```

Valores a completar:
- `TOKKO_API_KEY` — tu API key de Tokko Broker
- `DASHBOARD_USER` / `DASHBOARD_PASSWORD` — credenciales del panel privado
- `JWT_SECRET` — string aleatorio largo (ej: `openssl rand -base64 32`)
- `GOOGLE_SHEETS_ID` — ID de tu Google Sheet para leads
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` — credenciales de Google Service Account

### 4. Agregar el logo

Copiá `logo.png` (fondo blanco, color verde) a la carpeta `public/`:

```bash
cp "../logo.png" public/logo.png
```

### 5. Correr en desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    # Home
│   ├── venta/page.tsx              # Propiedades en venta (con filtros)
│   ├── alquiler/page.tsx           # Propiedades en alquiler (con filtros)
│   ├── emprendimientos/page.tsx    # Desarrollos
│   ├── propiedades/[id]/page.tsx   # Ficha de propiedad
│   ├── tasar-mi-propiedad/         # Landing de tasación
│   ├── nosotros/page.tsx
│   ├── contacto/page.tsx
│   ├── login/page.tsx
│   ├── dashboard/                  # Área privada (requiere auth)
│   │   ├── page.tsx                # Panel con métricas
│   │   ├── mapa/                   # Mapa interactivo de operaciones
│   │   └── flyers/                 # Generador de flyers
│   ├── [seo-location]/page.tsx     # Páginas SEO dinámicas
│   ├── api/
│   │   ├── auth/login/route.ts
│   │   ├── auth/logout/route.ts
│   │   ├── leads/tasacion/route.ts
│   │   ├── leads/contacto/route.ts
│   │   └── tokko/property/[id]/route.ts
│   └── sitemap.ts
├── components/
│   ├── layout/Navbar.tsx
│   ├── layout/Footer.tsx
│   ├── layout/Analytics.tsx
│   ├── properties/PropertyCard.tsx
│   ├── properties/PropertyFilters.tsx
│   ├── properties/FeaturedCarousel.tsx
│   └── dashboard/DashboardSidebar.tsx
├── lib/
│   ├── tokko.ts        # Cliente Tokko Broker API
│   ├── sheets.ts       # Google Sheets para leads
│   └── auth.ts         # JWT auth
├── types/tokko.ts      # TypeScript types
└── middleware.ts       # Protección de rutas /dashboard
```

---

## Páginas SEO incluidas

- `/casas-en-venta-funes`
- `/casas-en-venta-roldan`
- `/lotes-en-venta-funes`
- `/casas-en-venta-kentucky`
- `/casas-en-venta-funes-hills`
- `/casas-en-venta-don-mateo`
- `/casas-en-alquiler-funes`
- `/departamentos-en-venta-funes`
- `/terrenos-en-venta-funes`

---

## Google Sheets — estructura esperada

El sheet debe tener 2 pestañas:
- `Tasaciones` — columnas: Fecha, Nombre, Teléfono, Email, Dirección, Barrio, Tipo, Superficie, Comentarios
- `Contactos` — columnas: Fecha, Nombre, Teléfono, Email, Consulta, Mensaje

---

## Deploy (Vercel)

```bash
npm run build   # verifica que todo compile
```

En Vercel: conectar el repo, configurar las variables de entorno del `.env.example`.
