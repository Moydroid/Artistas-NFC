export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Iniciar Sesión</h1>
        <form className="space-y-4">
          <input type="email" placeholder="Correo" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" />
          <input type="password" placeholder="Contraseña" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" />
          <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg">Entrar</button>
        </form>
      </div>
    </main>
  );
}
