export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-900 mb-6">Test Tailwind CSS</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Test Card 1 */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Couleurs de base</h2>
            <div className="space-y-2">
              <div className="bg-red-500 text-white p-2 rounded">Rouge</div>
              <div className="bg-green-500 text-white p-2 rounded">Vert</div>
              <div className="bg-blue-500 text-white p-2 rounded">Bleu</div>
            </div>
          </div>

          {/* Test Card 2 */}
          <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-3">Variables CSS</h2>
            <div className="space-y-2">
              <div className="bg-primary text-primary-foreground p-2 rounded">Primary</div>
              <div className="bg-secondary text-secondary-foreground p-2 rounded">Secondary</div>
              <div className="bg-accent text-accent-foreground p-2 rounded">Accent</div>
            </div>
          </div>

          {/* Test Card 3 */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Dégradés</h2>
            <div className="space-y-2">
              <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm p-2 rounded transition-colors">
                Button Hover
              </button>
              <div className="w-full h-4 bg-white/20 rounded-full">
                <div className="w-3/4 h-full bg-white/40 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Test de margins et spacing */}
        <div className="mt-12 bg-yellow-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4">Test Margins & Spacing</h2>
          <div className="space-y-4">
            <div className="bg-yellow-200 p-4 mx-2">Padding et margin test</div>
            <div className="flex space-x-4">
              <div className="w-1/3 bg-yellow-300 p-3">1/3</div>
              <div className="w-1/3 bg-yellow-400 p-3">1/3</div>
              <div className="w-1/3 bg-yellow-500 p-3 text-white">1/3</div>
            </div>
          </div>
        </div>

        {/* Test responsive */}
        <div className="mt-8">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-center p-4 bg-gray-100 rounded">
            Texte responsive: XS → SM → MD → LG → XL
          </div>
        </div>
      </div>
    </div>
  )
}