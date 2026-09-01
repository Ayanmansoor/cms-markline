import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10 overflow-hidden bg-slate-950">
      {/* Premium E-commerce Background Image with subtle blur & opacity */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25 filter blur-[2px] scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      {/* Dark modern gradient overlay for readability and premium feel */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-950 via-slate-950/95 to-slate-900/40" />
      
      {/* Glowing ambient light orbs to wow the user */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Login Card Wrapper */}
      <div className="relative z-10 w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
