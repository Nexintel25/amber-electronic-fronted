import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
          <Zap className="size-7 fill-white text-white" />
        </span>
        <p className="mt-6 text-5xl font-bold text-slate-900">404</p>
        <p className="mt-2 text-slate-500">This page doesn’t exist or the complaint was removed.</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
