import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { setupRecaptcha, sendOTP, verifyOTP } from "../phoneAuth";
import { Phone, Mail, Key, Loader2 } from "lucide-react";

function Login() {
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });

    try {
      setupRecaptcha();
    } catch (err) {
      console.warn("Recaptcha initialization skipped or already initialized");
    }

    return () => unsubscribe();
  }, []);

  const setUserDocument = async (uid: string, email: string | null, phoneNumber: string | null, additionalData?: any) => {
    const userRef = doc(db, "users", uid);
    const baseData = {
      email,
      phoneNumber: phoneNumber || additionalData?.phone || null,
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    const finalData = additionalData 
      ? { ...baseData, ...additionalData, createdAt: new Date().toISOString() }
      : { ...baseData };

    await setDoc(userRef, finalData, { merge: true });
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setUserDocument(result.user.uid, result.user.email, result.user.phoneNumber, {
          fullName,
          phone,
          age: parseInt(age),
        });
        setMessage(`Account created for ${result.user.email}.`);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await setUserDocument(result.user.uid, result.user.email, result.user.phoneNumber);
        setMessage(`Welcome back ${result.user.email}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setIsLoading(true);
    try {
      if (!otpSent) {
        // Formate phone number to E.164 if it's not already
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        await sendOTP(formattedPhone);
        setOtpSent(true);
        setMessage("OTP sent to your phone number.");
      } else {
        const verifiedUser = await verifyOTP(otp);
        await setUserDocument(verifiedUser.uid, verifiedUser.email, verifiedUser.phoneNumber);
        setMessage(`Logged in successfully via Phone.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Phone authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (mode === "login" && loginMethod === "phone") {
      await handlePhoneLogin();
    } else {
      await handleEmailAuth();
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      setMessage("Logged out");
      // Clear form fields
      setFullName("");
      setPhone("");
      setAge("");
      setEmail("");
      setPassword("");
      setOtp("");
      setOtpSent(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full">
      <div id="recaptcha-container"></div>
      
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 drop-shadow-sm">
          {mode === 'signup' ? 'Join the Fun!' : 'Welcome Back!'}
        </h2>
        <p className="text-sm text-slate-400 mt-2 font-medium">
          {mode === 'signup'
            ? 'Create your account to start learning with games'
            : 'Login to access your rewards and saved progress'}
        </p>
      </div>

      {user ? (
        <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-300 text-sm mb-1">Signed in as</p>
            <p className="text-white font-bold text-lg">{user.email || user.phoneNumber}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logging out...
              </>
            ) : (
              'Logout'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Login Method Toggle */}
          {mode === 'login' && (
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                onClick={() => { setLoginMethod('email'); setOtpSent(false); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  loginMethod === 'email' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => { setLoginMethod('phone'); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  loginMethod === 'phone' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {mode === 'signup' ? (
                <>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      placeholder="Phone (e.g. 9876543210)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                      min="3"
                      max="100"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                </>
              ) : (
                // Login Mode
                loginMethod === 'email' ? (
                  <>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
                    />
                  </>
                ) : (
                  // Phone Login Mode
                  <>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={otpSent}
                        className={`w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500 ${otpSent ? 'opacity-50' : ''}`}
                      />
                      {otpSent && (
                        <button 
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-cyan-400 hover:text-cyan-300"
                        >
                          Change
                        </button>
                      )}
                    </div>
                    {otpSent && (
                      <div className="relative animate-in slide-in-from-top-2">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          required
                          maxLength={6}
                          className="w-full rounded-xl border border-cyan-400/30 bg-white/5 pl-11 pr-4 py-3.5 text-white outline-none transition-all focus:border-cyan-400 focus:bg-white/10 placeholder:text-slate-500"
                        />
                      </div>
                    )}
                  </>
                )
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-4 font-bold text-black shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {mode === 'signup' 
                    ? 'Creating Account...' 
                    : (loginMethod === 'phone' && !otpSent ? 'Sending OTP...' : 'Signing In...')}
                </>
              ) : (
                mode === 'signup' 
                  ? 'Create Free Account' 
                  : (loginMethod === 'phone' && !otpSent ? 'Send OTP' : (loginMethod === 'phone' ? 'Verify & Login' : 'Sign In'))
              )}
            </button>

            <div className="pt-4 text-center">
              <p className="text-sm text-slate-400">
                {mode === 'signup' ? 'Already part of the family?' : "New to Sikshakhel?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup');
                    setOtpSent(false);
                    setError("");
                    setMessage("");
                  }}
                  className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {mode === 'signup' ? 'Login' : 'Create Account'}
                </button>
              </p>
            </div>
          </form>
        </div>
      )}

      {message && (
        <div className="mt-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-400 text-sm font-medium animate-in slide-in-from-top-2">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-400 text-sm font-medium animate-in slide-in-from-top-2">
          {error}
        </div>
      )}
    </div>
  );
}

export default Login;