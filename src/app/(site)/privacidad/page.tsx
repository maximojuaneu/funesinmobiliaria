import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad de FI App, el sistema de gestión interno de Funes Inmobiliaria.',
}

export default function PrivacidadPage() {
  return (
    <>
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6">
          <span className="page-hero-eyebrow">Legales</span>
          <div className="flex items-center gap-6 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase tracking-widest text-center">Política de privacidad</h1>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <p className="text-center text-xs text-gray-600 tracking-widest uppercase">FI App · Última actualización: 4 de octubre de 2026</p>
        </div>
      </div>

      <section className="max-w-3xl mx-auto px-6 py-16 space-y-10 text-gray-700 leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Quiénes somos</h2>
          <p>
            FI App es el sistema de gestión interno que usa el equipo de Funes Inmobiliaria (Córdoba 2115, Ruta 9, Funes,
            Santa Fe, Argentina) para organizar su trabajo comercial. Es de uso exclusivo de los integrantes del equipo.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Conexión con Google Calendar</h2>
          <p className="mb-3">
            Cada integrante del equipo puede, de forma voluntaria, conectar su propia cuenta de Google a FI App para
            agendar en su calendario las visitas a propiedades que registra.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Qué datos usamos:</strong> la dirección de correo de la cuenta de Google conectada (para mostrar con
              qué cuenta está vinculada) y un permiso que nos habilita a crear eventos en su calendario.
            </li>
            <li>
              <strong>Para qué los usamos:</strong> únicamente para crear el evento de una visita cuando el usuario lo
              solicita al registrarla. FI App no lee, modifica ni elimina otros eventos del calendario, ni accede a otros
              servicios de la cuenta de Google.
            </li>
            <li>
              <strong>Dónde se guardan:</strong> el permiso se almacena en una base de datos protegida, accesible solamente
              desde el servidor de la aplicación, y nunca se expone en el navegador.
            </li>
            <li>
              <strong>Con quién se comparten:</strong> con nadie. No vendemos ni cedemos esta información a terceros, ni la
              usamos para publicidad.
            </li>
          </ul>
          <p className="mt-3">
            El uso y la transferencia a cualquier otra aplicación de la información recibida de las API de Google se
            ajustarán a la{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-brand-green font-semibold underline" target="_blank" rel="noopener noreferrer">
              Política de datos de usuario de los servicios de API de Google
            </a>
            , incluidos los requisitos de uso limitado.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cómo desconectar tu cuenta</h2>
          <p>
            Podés desconectar tu Google Calendar en cualquier momento desde FI App (enlace &ldquo;desconectar&rdquo; en el
            formulario de visitas), lo que elimina el permiso guardado. También podés revocar el acceso desde tu cuenta de
            Google en{' '}
            <a href="https://myaccount.google.com/permissions" className="text-brand-green font-semibold underline" target="_blank" rel="noopener noreferrer">
              myaccount.google.com/permissions
            </a>
            . Si un usuario es dado de baja del sistema, su permiso se elimina.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Contacto</h2>
          <p>
            Ante cualquier consulta sobre esta política o sobre tus datos, escribinos a{' '}
            <a href="mailto:info@funesinmobiliaria.com.ar" className="text-brand-green font-semibold">info@funesinmobiliaria.com.ar</a>.
          </p>
        </div>
      </section>
    </>
  )
}
