export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F0F1A] flex flex-col items-center justify-center text-white p-5">
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 text-3xl">
        ✨
      </div>

      <h1 className="text-5xl font-bold tracking-widest mb-2">
        BROK
      </h1>

      <p className="text-base text-white/60 tracking-wider mb-12">
        learn anything
      </p>

      <div className="bg-white/10 rounded-2xl p-8 max-w-md text-center">
        <h2 className="text-lg font-semibold mb-3">
          API Server Running
        </h2>
        <p className="text-sm text-white/70 mb-4 leading-relaxed">
          This is the backend API. To use the app, run the mobile client:
        </p>
        <code className="block bg-black/30 p-3 rounded-lg text-sm text-green-400">
          cd apps/mobile && npm start
        </code>
      </div>

      <div className="mt-8 text-xs text-white/50">
        API Endpoints: /api/courses, /api/threads, /api/modules, /api/progress
      </div>
    </div>
  );
}
