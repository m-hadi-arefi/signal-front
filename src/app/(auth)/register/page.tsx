import { RegisterForm } from "@/components/auth/RegisterForm";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#08080f]">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 to-purple-950/10 pointer-events-none" />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Signal<span className="text-indigo-400">Pro</span>
          </Link>
          <p className="text-white/40 text-sm mt-2">Join the community</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/3 p-8">
          <h1 className="text-xl font-semibold text-white mb-6">Create Account</h1>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
