import { FormEvent, useState } from "react";
import {
  ArrowLeft, Check, CheckCircle2, Eye, EyeOff, LockKeyhole,
  Mail, PackageCheck, ShieldCheck, Sparkles, UserRound,
} from "lucide-react";

export type AuthView = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

interface AuthPagesProps {
  initialView?: AuthView;
  onAuthenticated: () => void;
}

const inputClass =
  "w-full h-11 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4F6FD8] focus:ring-4 focus:ring-[#4F6FD8]/10";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F6FD8] text-white shadow-sm shadow-blue-900/20">
        <PackageCheck size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-slate-900">Hexace Inventory</div>
        <div className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400">AI-powered platform</div>
      </div>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.92fr)_minmax(500px,1.08fr)]">
        <section className="relative hidden overflow-hidden bg-[#365CB7] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 18% 20%, #8db4ff 0, transparent 25%), radial-gradient(circle at 85% 78%, #5de0ce 0, transparent 22%)" }} />
          <div className="absolute -right-24 top-28 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-8 top-44 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#4F6FD8]"><PackageCheck size={20} /></div>
            <span className="text-[15px] font-bold">Hexace Inventory</span>
          </div>

          <div className="relative z-10 my-auto max-w-[520px] py-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur">
              <Sparkles size={13} /> Built for modern clinics
            </div>
            <h1 className="text-4xl font-bold leading-[1.16] tracking-[-0.035em] xl:text-5xl">
              Less counting.<br />More caring.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-blue-100/85">
              Keep every clinical supply visible, every purchase organized, and your team ahead of low stock.
            </p>
            <div className="mt-10 grid max-w-md gap-4">
              {[
                "Real-time stock visibility across your clinic",
                "Smart low-stock alerts before supplies run out",
                "A complete, traceable inventory activity log",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-blue-50">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-300/20 text-teal-200"><Check size={14} /></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <p className="relative z-10 text-xs text-blue-200/60">Trusted tools for calm, well-stocked clinics.</p>
        </section>

        <section className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12">
          <div className="lg:hidden"><Brand /></div>
          <div className="mx-auto flex w-full max-w-[420px] flex-1 items-center py-10">{children}</div>
          <div className="mx-auto flex w-full max-w-[420px] items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 Hexace Inventory</span>
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Secure access</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordInput({ value, onChange, placeholder = "Enter your password" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input className={`${inputClass} px-10`} type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      <button type="button" onClick={() => setVisible(!visible)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label={visible ? "Hide password" : "Show password"}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold text-slate-700">{children}</label>;
}

function PrimaryButton({ children, disabled = false, onClick }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void }) {
  return <button disabled={disabled} onClick={onClick} className="flex h-11 w-full items-center justify-center rounded-lg bg-[#4F6FD8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3F5FC2] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60">{children}</button>;
}

function SignIn({ go, onAuthenticated }: { go: (v: AuthView) => void; onAuthenticated: () => void }) {
  const [email, setEmail] = useState("doctor@northstarclinic.ca");
  const [password, setPassword] = useState("clinic123");
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) return setError("Enter a valid email and a password of at least 6 characters.");
    onAuthenticated();
  };
  return (
    <div className="w-full">
      <div className="mb-8 hidden lg:block"><Brand /></div>
      <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-500">Sign in to manage your clinic inventory.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><FieldLabel>Email address</FieldLabel><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input className={`${inputClass} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@clinic.com" /></div></div>
        <div>
          <div className="flex items-center justify-between"><FieldLabel>Password</FieldLabel><button type="button" onClick={() => go("forgot-password")} className="mb-1.5 text-xs font-semibold text-[#4F6FD8] hover:underline">Forgot password?</button></div>
          <PasswordInput value={password} onChange={setPassword} />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600"><input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-[#4F6FD8]" /> Keep me signed in</label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <PrimaryButton>Sign in</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">New to Hexace? <button onClick={() => go("sign-up")} className="font-semibold text-[#4F6FD8] hover:underline">Create an account</button></p>
      <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
    </div>
  );
}

function SignUp({ go }: { go: (v: AuthView) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [created, setCreated] = useState(false);
  if (created) return <Success title="Account created" body={`We sent a verification link to ${email}. Verify your email, then sign in to your workspace.`} action="Go to sign in" onAction={() => go("sign-in")} />;
  return (
    <div className="w-full">
      <button onClick={() => go("sign-in")} className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Back to sign in</button>
      <h2 className="text-2xl font-bold tracking-[-0.02em]">Create your account</h2>
      <p className="mt-2 text-sm text-slate-500">Start organizing your clinic inventory in minutes.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (name && email.includes("@") && password.length >= 8 && agreed) setCreated(true); }} className="mt-7 space-y-4">
        <div><FieldLabel>Full name</FieldLabel><div className="relative"><UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required className={`${inputClass} pl-10`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. Alex Morgan" /></div></div>
        <div><FieldLabel>Work email</FieldLabel><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required className={`${inputClass} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@clinic.com" /></div></div>
        <div><FieldLabel>Password</FieldLabel><PasswordInput value={password} onChange={setPassword} placeholder="Create at least 8 characters" /><p className="mt-1.5 text-[11px] text-slate-400">Use 8+ characters with a number and symbol.</p></div>
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-slate-500"><input required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#4F6FD8]" /><span>I agree to the <span className="font-medium text-slate-700">Terms of Service</span> and <span className="font-medium text-slate-700">Privacy Policy</span>.</span></label>
        <PrimaryButton>Create account</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <button onClick={() => go("sign-in")} className="font-semibold text-[#4F6FD8] hover:underline">Sign in</button></p>
    </div>
  );
}

function ForgotPassword({ go }: { go: (v: AuthView) => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <Success title="Check your inbox" body={`We sent password reset instructions to ${email}. The link expires in 30 minutes.`} action="Preview reset page" onAction={() => go("reset-password")} secondary="Back to sign in" onSecondary={() => go("sign-in")} />;
  return (
    <div className="w-full">
      <button onClick={() => go("sign-in")} className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Back to sign in</button>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#4F6FD8]"><Mail size={22} /></div>
      <h2 className="text-2xl font-bold tracking-[-0.02em]">Forgot your password?</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">No worries. Enter your work email and we’ll send you a secure link to reset it.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (email.includes("@")) setSent(true); }} className="mt-7 space-y-5">
        <div><FieldLabel>Email address</FieldLabel><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required className={`${inputClass} pl-10`} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@clinic.com" /></div></div>
        <PrimaryButton>Send reset link</PrimaryButton>
      </form>
    </div>
  );
}

function ResetPassword({ go }: { go: (v: AuthView) => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  if (done) return <Success title="Password reset" body="Your password has been updated successfully. You can now sign in with your new password." action="Continue to sign in" onAction={() => go("sign-in")} />;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The passwords do not match.");
    setDone(true);
  };
  return (
    <div className="w-full">
      <button onClick={() => go("sign-in")} className="mb-7 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Back to sign in</button>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#4F6FD8]"><LockKeyhole size={22} /></div>
      <h2 className="text-2xl font-bold tracking-[-0.02em]">Set a new password</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Choose a strong password you haven’t used before.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><FieldLabel>New password</FieldLabel><PasswordInput value={password} onChange={setPassword} placeholder="Enter a new password" /></div>
        <div><FieldLabel>Confirm new password</FieldLabel><PasswordInput value={confirm} onChange={setConfirm} placeholder="Re-enter your new password" /></div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
          <span className={password.length >= 8 ? "text-emerald-600" : ""}>• At least 8 characters</span>
          <span>• Include a number</span><span>• Include a symbol</span><span>• Avoid reused passwords</span>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        <PrimaryButton>Reset password</PrimaryButton>
      </form>
    </div>
  );
}

function Success({ title, body, action, onAction, secondary, onSecondary }: { title: string; body: string; action: string; onAction: () => void; secondary?: string; onSecondary?: () => void }) {
  return (
    <div className="w-full text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={28} /></div>
      <h2 className="text-2xl font-bold tracking-[-0.02em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">{body}</p>
      <div className="mt-7"><PrimaryButton onClick={onAction}>{action}</PrimaryButton></div>
      {secondary && <button onClick={onSecondary} className="mt-4 text-xs font-semibold text-[#4F6FD8] hover:underline">{secondary}</button>}
    </div>
  );
}

export default function AuthPages({ initialView = "sign-in", onAuthenticated }: AuthPagesProps) {
  const [view, setView] = useState<AuthView>(initialView);
  return (
    <AuthShell>
      {view === "sign-in" && <SignIn go={setView} onAuthenticated={onAuthenticated} />}
      {view === "sign-up" && <SignUp go={setView} />}
      {view === "forgot-password" && <ForgotPassword go={setView} />}
      {view === "reset-password" && <ResetPassword go={setView} />}
    </AuthShell>
  );
}
