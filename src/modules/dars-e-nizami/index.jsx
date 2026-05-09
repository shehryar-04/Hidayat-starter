export default function DarsENizamiModule() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary">school</span>
      </div>
      <h1 className="font-serif text-headline-md text-primary mb-3">Dars-e-Nizami Program</h1>
      <p className="text-body-md text-slate-500 max-w-md mb-6">
        Multi-year Islamic curriculum with levels, subjects, evaluations, transcripts, and student promotion.
      </p>
      <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full border border-secondary/20">
        <span className="material-symbols-outlined text-lg">construction</span>
        <span className="font-label-lg text-sm">Under Construction</span>
      </div>
      <p className="text-sm text-slate-400 mt-4">This module is being developed. Check back soon.</p>
    </div>
  )
}
