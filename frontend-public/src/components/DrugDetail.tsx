import { ArrowLeft, BookOpen, Search } from "lucide-react"

type CatalogueDrug = {
  name: string
  category: string
  minPrice: number
  availableAt: number
  description?: string
}

type Props = {
  drug: CatalogueDrug
  onBack: () => void
  onSearch: (drugName: string) => void
}

export default function DrugDetail({ drug, onBack, onSearch }: Props) {
  const description =
    drug.description ||
    `Learn more about ${drug.name}, a widely used ${drug.category.toLowerCase()} medication. Use this page to compare pharmacies, read general information, and search availability.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 hover:text-primary-700 font-semibold transition shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au catalogue
          </button>
          <div className="rounded-full bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500">
            Astuce : utilisez ce bouton pour revenir à votre catalogue de médicaments. Les raccourcis clavier du navigateur peuvent fermer l'onglet.
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-10 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-3">
                  <BookOpen className="w-4 h-4" />
                  {drug.category}
                </span>
                <h1 className="text-4xl font-bold text-slate-900">{drug.name}</h1>
                <p className="mt-4 text-slate-600 max-w-2xl">{description}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-6 text-center border border-slate-200">
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Prix de départ</p>
                <p className="text-4xl font-bold text-primary-600 mt-4">{drug.minPrice.toLocaleString()} FCFA</p>
                <p className="mt-2 text-slate-600">Disponible dans {drug.availableAt} pharmacies</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Usage</h2>
                <p className="text-slate-600 leading-7">
                  {drug.description ||
                    `${drug.name} est généralement prescrit pour traiter des conditions liées à ${drug.category.toLowerCase()}. Il peut être disponible en plusieurs dosages et formulations selon le stock local.`}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-2">Mode d'emploi</h3>
                  <p className="text-slate-600 leading-7">Suivez les instructions du pharmacien et ne prenez que la posologie prescrite.</p>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-2">Quand consulter</h3>
                  <p className="text-slate-600 leading-7">Consultez un pharmacien en cas d'allergies, de grossesse ou d'effets indésirables.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm text-slate-500 uppercase tracking-[0.2em] mb-4">Actions rapides</h3>
                <button
                  onClick={() => onSearch(drug.name)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-2xl transition"
                >
                  <Search className="w-4 h-4" />
                  Rechercher la disponibilité
                </button>
              </div>
              <div className="bg-primary-50 rounded-3xl p-6 border border-primary-100">
                <h3 className="text-sm font-semibold text-primary-800 mb-3">Pourquoi cela aide</h3>
                <p className="text-sm text-primary-700 leading-6">Cette page vous aide à en savoir plus sur le médicament avant de vérifier les pharmacies. Quand vous êtes prêt, recherchez pour comparer prix et stock.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
