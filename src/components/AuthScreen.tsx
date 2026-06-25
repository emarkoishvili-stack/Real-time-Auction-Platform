import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInAnonymously, 
  updateProfile,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Coins, Chrome, User, Sparkles, ShieldCheck, Mail, Lock, Landmark, Award, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onGuestLogin: (name: string) => void;
}

type AuthMode = 'signin' | 'register' | 'guest';

export default function AuthScreen({ onGuestLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Guest fields
  const [guestName, setGuestName] = useState('');
  
  // Statuses
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('ბრაუზერმა დაბლოკა ფანჯარა. გთხოვთ გამოიყენოთ მარტივი რეგისტრაცია ან სტუმრის სწრაფი რეჟიმი.');
      } else {
        setError(err.message || 'გუგლით ავტორიზაცია ვერ მოხერხდა.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('გთხოვთ მიუთითოთ მეტსახელი / სახელი');
        }
        if (password.length < 6) {
          throw new Error('პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან');
        }

        // 1. Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Update profile name
        await updateProfile(userCredential.user, {
          displayName: name.trim()
        });

        setSuccessMsg('ანგარიში წარმატებით შეიქმნა! მიმდინარეობს შესვლა...');
      } else {
        // Sign in mode
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      let localizedError = err.message;
      if (err.code === 'auth/email-already-in-use') {
        localizedError = 'ეს ელ-ფოსტა უკვე დაკავებულია სხვა მომხმარებლის მიერ.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        localizedError = 'არასწორი ელ-ფოსტა ან პაროლი.';
      } else if (err.code === 'auth/invalid-email') {
        localizedError = 'არასწორი ელ-ფოსტის ფორმატი.';
      }
      setError(localizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      await updateProfile(userCredential.user, {
        displayName: guestName.trim()
      });
      onGuestLogin(guestName.trim());
    } catch (err: any) {
      console.error('Anonymous Auth Error:', err);
      setError(err.message || 'სტუმრის რეჟიმით შესვლა ვერ მოხერხდა.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Gold & Bronze ambient glows to evoke ancient metallurgy */}
      <div className="absolute top-[-25%] left-[-20%] w-[70%] h-[70%] rounded-full bg-amber-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[70%] h-[70%] rounded-full bg-yellow-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-amber-500/3 blur-[180px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10 relative">
        
        {/* Left Side: Luxurious Information and Branding */}
        <div className="md:col-span-5 text-left space-y-6 hidden md:block pr-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-inner">
              <Landmark className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <span className="text-amber-400 font-mono text-[10px] tracking-widest uppercase font-bold">Numismatic Royal Auction</span>
              <h2 className="text-xl font-bold text-white">ნუმიზმატიკა</h2>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              აღმოაჩინე და ივაჭრე <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
                იშვიათი მონეტებით
              </span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              კეთილი იყოს თქვენი მობრძანება პრემიუმ კლასის ნუმიზმატთა და კოლექციონერთა ციფრულ სივრცეში. 
              აქ ყოველი ექსპონატი ინახავს უნიკალურ ისტორიას.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 bg-gray-900/60 border border-gray-800 rounded-lg text-amber-400">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-200">უნიკალური ექსპონატები</h4>
                <p className="text-[11px] text-gray-400">ანტიკური კოლხური თეთრიდან დაწყებული, თანამედროვე საიუბილეო ოქროს მონეტებამდე.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 bg-gray-900/60 border border-gray-800 rounded-lg text-amber-400">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-200">Gemini AI ექსპერტიზა</h4>
                <p className="text-[11px] text-gray-400">მიიღეთ რეალურ დროში ინტელექტუალური ნუმიზმატიკური შეფასება და ბაზრის ანალიტიკა.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 p-1.5 bg-gray-900/60 border border-gray-800 rounded-lg text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-200">ცოცხალი ვაჭრობა</h4>
                <p className="text-[11px] text-gray-400">სინქრონული და მყისიერი ფსონების სისტემა წამიერი განახლებით.</p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-500/80" />
            <span>დაცული კოლექციების რეესტრი</span>
          </div>
        </div>

        {/* Right Side: Authentication/Registration Box */}
        <div className="md:col-span-7 w-full sm:max-w-md mx-auto">
          <div className="text-center md:hidden mb-6">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center">
                <Coins className="h-7 w-7 text-amber-400 animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">ნუმიზმატიკური აუქციონი</h1>
            <p className="text-xs text-amber-400/80 font-medium">Numismatic Royal Portal</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/40 backdrop-blur-xl border border-gray-800/80 shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden"
          >
            {/* Soft inner coin watermark background */}
            <div className="absolute right-[-30px] bottom-[-30px] opacity-5 pointer-events-none text-white">
              <Coins size={150} />
            </div>

            {/* Premium Tab Toggles */}
            <div className="grid grid-cols-3 gap-1 bg-gray-950/80 p-1.5 rounded-2xl border border-gray-800/50 mb-6">
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'signin' 
                    ? 'bg-amber-500 text-gray-950 shadow-md font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
                }`}
              >
                შესვლა
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'register' 
                    ? 'bg-amber-500 text-gray-950 shadow-md font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
                }`}
              >
                რეგისტრაცია
              </button>
              <button
                type="button"
                onClick={() => { setMode('guest'); setError(''); setSuccessMsg(''); }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  mode === 'guest' 
                    ? 'bg-amber-500 text-gray-950 shadow-md font-bold' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
                }`}
              >
                სტუმარი
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300"
              >
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300"
              >
                {successMsg}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signin' && (
                <motion.form 
                  key="signin"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleAuthSubmit} 
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      ელ-ფოსტა / Email
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="numismatist@example.com"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      პაროლი / Password
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/10 text-xs font-bold uppercase tracking-wider text-gray-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'მიმდინარეობს შესვლა...' : 'ავტორიზაცია / Sign In'}
                  </button>
                </motion.form>
              )}

              {mode === 'register' && (
                <motion.form 
                  key="register"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleAuthSubmit} 
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      მეტსახელი ან სრული სახელი / Nickname
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="მაგ: გიორგი, ირაკლი"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      ელ-ფოსტა / Email Address
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      პაროლი / Password (მინ. 6 სიმბოლო)
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/10 text-xs font-bold uppercase tracking-wider text-gray-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'მიმდინარეობს რეგისტრაცია...' : 'რეგისტრაცია / Sign Up'}
                  </button>
                </motion.form>
              )}

              {mode === 'guest' && (
                <motion.form 
                  key="guest"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleGuestSubmit} 
                  className="space-y-4"
                >
                  <p className="text-[11px] text-gray-400 leading-relaxed text-center">
                    სწრაფი შესვლა ტესტირებისა და დეველოპმენტისთვის. პაროლისა და ელ-ფოსტის გარეშე.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      აირჩიეთ ნუმიზმატის მეტსახელი
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-amber-500/50" />
                      </div>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="მაგ: კოლექციონერი, ანტიკვარი"
                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !guestName.trim()}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-amber-500/10 text-xs font-bold uppercase tracking-wider text-gray-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    სწრაფი შესვლა / Instant Access
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Social Divider (for Email & Password views) */}
            {mode !== 'guest' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-gray-900/40 text-gray-500 text-[10px] uppercase tracking-wider font-mono">
                      ან გამოიყენეთ
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-gray-800 rounded-xl shadow-sm text-xs font-semibold text-white bg-gray-950/60 hover:bg-gray-900 hover:border-gray-700 transition-all focus:outline-none"
                  >
                    <Chrome className="h-4 w-4 mr-2 text-red-400" />
                    შესვლა Google-ით
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-500/80" />
              <span>სინქრონიზებულია Firestore-თან</span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
