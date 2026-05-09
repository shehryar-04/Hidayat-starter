export default function NazraModule() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary">record_voice_over</span>
      </div>
      <h1 className="font-serif text-headline-md text-primary mb-3">Nazra Program</h1>
      <p className="text-body-md text-slate-500 max-w-md mb-6">
        Lesson-by-lesson Quran recitation tracking with Tajweed quality notes and progress reports.
      </p>
      <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full border border-secondary/20">
        <span className="material-symbols-outlined text-lg">construction</span>
        <span className="font-label-lg text-sm">Under Construction</span>
      </div>
      <p className="text-sm text-slate-400 mt-4">This module is being developed. Check back soon.</p>
    </div>
  )
}
