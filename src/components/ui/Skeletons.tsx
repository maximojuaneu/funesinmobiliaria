// Bloques en pulso suave que se ven mientras llega la página. Aparecen con 200 ms de retraso
// (animate-skeleton-in): si la página carga rápido, nunca llegan a mostrarse.

const block = 'bg-gray-200/70 animate-pulse rounded-xl'

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <div className={`${block} rounded-none aspect-[4/3]`} />
      <div className="p-4 space-y-3">
        <div className={`${block} h-6 w-1/2`} />
        <div className={`${block} h-4 w-3/4`} />
        <div className={`${block} h-4 w-2/3`} />
      </div>
    </div>
  )
}

export function ListingSkeleton({ sidebar = true }: { sidebar?: boolean }) {
  return (
    <div className="animate-skeleton-in" role="status" aria-label="Cargando">
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
          <div className={`${block} h-3 w-40`} />
          <div className={`${block} h-10 w-56`} />
          <div className={`${block} h-3 w-48`} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex gap-8 items-start">
          {sidebar && (
            <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
              <div className={`${block} h-12`} />
              <div className={`${block} h-80`} />
            </div>
          )}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="animate-skeleton-in" role="status" aria-label="Cargando">
      <section className="pt-20">
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className={`${block} w-full h-[260px] md:h-[420px]`} />
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className={`${block} h-6 w-24`} />
          <div className={`${block} h-9 w-3/4`} />
          <div className={`${block} h-5 w-1/2`} />
          <div className={`${block} h-40`} />
        </div>
        <div className={`${block} h-72`} />
      </div>
    </div>
  )
}
