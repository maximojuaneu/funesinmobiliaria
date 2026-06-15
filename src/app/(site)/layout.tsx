import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? '5493413165704'
const WA_TEXT   = encodeURIComponent('Hola! Vengo desde la pagina web de Funes Inmobiliaria, necesito información sobre...')

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const waHref = `https://wa.me/${WA_NUMBER}?text=${WA_TEXT}`
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton href={waHref} />
    </>
  )
}
