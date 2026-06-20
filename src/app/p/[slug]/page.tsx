import { redirect, notFound } from 'next/navigation'

interface Props { params: { slug: string } }

export default function TokkoPropertyRedirect({ params }: Props) {
  // Tokko share URLs look like: /p/8010666-Departamento-en-Venta-en-...
  // Extract the numeric ID from the beginning of the slug
  const match = params.slug.match(/^(\d+)/)
  if (!match) notFound()
  redirect(`/propiedades/${match[1]}`)
}
