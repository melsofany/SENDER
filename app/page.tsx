'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Users, 
  LogOut, 
  ShieldCheck,
  Loader2,
  AlertCircle,
  PauseCircle,
  Activity,
  FileText,
  Smartphone,
  Check
} from 'lucide-react';
import { verifyPassword, getStats } from '@/app/actions';

const PetrotradeLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 5 C50 5 85 45 85 70 C85 89.33 69.33 105 50 105 C30.67 105 15 89.33 15 70 C15 45 50 5 50 5 Z" fill="#7AC142"/>
    <path d="M5 60 C 20 80, 80 80, 95 40 C 80 60, 20 60, 5 60 Z" fill="#1A1A1A"/>
    <text x="50" y="65" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" transform="rotate(-10 50 65)">بتروتريد</text>
  </svg>
);

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [waStatus, setWaStatus] = useState<'open' | 'close' | 'none'>('none');
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentAction, setCurrentAction] = useState('متوقف');
  const [loading, setLoading] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(`السيد / العميل الكريم

إنذار قانوني نهائي

بمراجعة سجلات الحساب لدى شركة بتروتريد تبين وجود مديونية مستحقة عليكم مقابل استهلاك الغاز الطبيعي، ولم يتم سدادها حتى تاريخه رغم التنبيهات والمطالبات السابقة.

وعليه يعتبر هذا الإخطار **إنذارًا قانونيًا نهائيًا وأخيرًا** بضرورة سداد كامل المديونية خلال مدة أقصاها **48 ساعة من تاريخ استلام هذه الرسالة**.

وفي حالة عدم السداد خلال المهلة المحددة، ستقوم الشركة فورًا ودون أي إخطار آخر باتخاذ كافة الإجراءات القانونية المقررة قانونًا، والتي تشمل على سبيل المثال لا الحصر:

• تحرير محضر ورفع **جنحة تبديد مواد بترولية** ضد سيادتكم.
• استبدال العداد الحالي بعداد **مسبق الدفع (كارت)** طبقًا للوائح المنظمة.
• تحميل العميل **كامل تكلفة العداد الجديد ومصاريف التركيب والإجراءات**، على أن يتم خصمها من عمليات شحن العداد.
• اتخاذ الإجراءات القضائية اللازمة لتحصيل المديونية مع **إلزامكم بالمصاريف القضائية وأتعاب المحاماة**.

لذا نهيب بسيادتكم سرعة التوجه إلى مقر الشركة أو التواصل فورًا لتسوية المديونية تفاديًا لاتخاذ الإجراءات القانونية.

العنوان: ش. شكري القواتلي – مول أبو هارون – الدور الثالث علوي
شركة بتروتريد
إدارة التحصيل`);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchStats();
        fetchWaStatus();
      }, 3000);
      fetchStats();
      fetchWaStatus();
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    const s = await getStats();
    setStats(s);
  };

  const fetchWaStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp?action=status');
      if (!res.ok) return;
      const data = await res.json();
      setWaStatus(data.status);
      setIsSending(data.isSending || false);
      setCurrentAction(data.currentAction || 'متوقف');
    } catch (e) {
      // Ignore network errors during polling
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await verifyPassword(password);
    if (ok) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
    setLoading(false);
  };

  const startSending = async () => {
    setIsStarting(true);
    try {
      await fetch('/api/whatsapp?action=stop');
      await fetch('/api/whatsapp?action=start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: messageTemplate })
      });
    } catch (e) {
      console.error('Failed to start campaign:', e);
    }
    setTimeout(() => setIsStarting(false), 2000);
  };

  const stopSending = async () => {
    await fetch('/api/whatsapp?action=stop');
    fetchWaStatus();
  };

  const progress = stats.total > 0 ? Math.round(((stats.sent + stats.failed) / stats.total) * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden" dir="rtl">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#8ED257] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#4A8522] rounded-full mix-blend-multiply filter blur-[150px] opacity-10"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-md w-full border border-white/50 relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <PetrotradeLogo className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">بتروتريد</h1>
            <p className="text-slate-600 text-sm font-bold bg-slate-100 px-4 py-1.5 rounded-full mt-2 border border-slate-200">نظام الإخطارات القانونية الذكي</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-6 py-4 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A9E2B] focus:border-transparent transition-all text-center text-lg shadow-inner"
                required
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 text-sm font-bold text-center flex items-center justify-center gap-2 bg-red-50 py-3 rounded-xl border border-red-100"
              >
                <AlertCircle size={18} />
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
            <PetrotradeLogo className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">بتروتريد</h1>
            <p className="text-xs text-slate-500 font-bold">نظام الإخطارات القانونية الذكي</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-slate-500 font-bold text-sm border border-transparent hover:border-red-100"
        >
          <LogOut size={18} />
          <span>تسجيل خروج</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="إجمالي الأرقام المستهدفة" 
            value={stats.total} 
            icon={<Users className="text-slate-700 w-7 h-7" />} 
            color="bg-slate-100"
            borderColor="border-slate-200"
            textColor="text-slate-800"
          />
          <StatCard 
            title="تم الإرسال بنجاح" 
            value={stats.sent} 
            icon={<CheckCircle2 className="text-[#5A9E2B] w-7 h-7" />} 
            color="bg-[#f2f9ec]"
            borderColor="border-[#d7eec5]"
            textColor="text-[#4A8522]"
          />
          <StatCard 
            title="فشل الإرسال" 
            value={stats.failed} 
            icon={<XCircle className="text-red-600 w-7 h-7" />} 
            color="bg-red-50"
            borderColor="border-red-100"
            textColor="text-red-700"
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5A9E2B]" />
              حالة الحملة الحالية
            </span>
            <span className="text-sm font-extrabold text-[#5A9E2B]">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-gradient-to-l from-[#7AC142] to-[#5A9E2B] h-full shadow-sm"
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-2 h-2 rounded-full bg-[#5A9E2B] animate-pulse"></div>
            {currentAction}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <FileText className="w-5 h-5 text-slate-700" />
                  </div>
                  <h2 className="font-extrabold text-slate-800">قالب الرسالة القانونية</h2>
                </div>
                <button 
                  onClick={() => setIsEditingMessage(!isEditingMessage)}
                  className="text-sm font-bold text-[#5A9E2B] hover:bg-[#5A9E2B]/10 px-4 py-2 rounded-xl transition-colors border border-transparent hover:border-[#5A9E2B]/20"
                >
                  {isEditingMessage ? 'حفظ التعديلات' : 'تعديل النص'}
                </button>
              </div>
              <div className="p-6">
                {isEditingMessage ? (
                  <textarea 
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full h-[400px] p-6 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-[#5A9E2B] focus:border-transparent outline-none font-sans text-slate-700 leading-relaxed bg-slate-50/30"
                  />
                ) : (
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed font-medium shadow-inner">
                    {messageTemplate}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Smartphone className="w-5 h-5 text-slate-700" />
                  </div>
                  <h2 className="font-extrabold text-slate-800">حالة الاتصال والتحكم</h2>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                    <ShieldCheck className="w-8 h-8 text-[#5A9E2B]" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-extrabold text-slate-900 mb-1">WASenderAPI متصل</h3>
                    <p className="text-sm text-slate-500 font-bold">النظام جاهز لإرسال الرسائل عبر السحابة</p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 px-4 py-1.5 bg-[#f2f9ec] text-[#4A8522] rounded-full text-xs font-black border border-[#d7eec5]">
                    <div className="w-2 h-2 rounded-full bg-[#5A9E2B]"></div>
                    متصل بالخدمة السحابية
                  </div>
                </div>

                <div className="space-y-4">
                  {!isSending ? (
                    <button 
                      onClick={startSending}
                      disabled={isStarting}
                      className="w-full bg-[#5A9E2B] text-white py-5 rounded-2xl font-black hover:bg-[#4A8522] transition-all shadow-lg shadow-[#5A9E2B]/20 flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                    >
                      {isStarting ? <Loader2 className="animate-spin" /> : <Send size={22} />}
                      بدء حملة الإرسال الآن
                    </button>
                  ) : (
                    <button 
                      onClick={stopSending}
                      className="w-full bg-red-600 text-white py-5 rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 text-lg"
                    >
                      <PauseCircle size={22} />
                      إيقاف الحملة مؤقتاً
                    </button>
                  )}
                  
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                    <AlertCircle className="text-amber-600 shrink-0" size={20} />
                    <p className="text-xs text-amber-800 font-bold leading-relaxed">
                      تنبيه: يتم الإرسال بمعدل رسالة كل 30-90 ثانية، مع فترة راحة 30 دقيقة كل 20 رسالة لتجنب حظر الرقم.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor, textColor }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`${color} p-8 rounded-3xl border ${borderColor} shadow-sm transition-all`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-bold mb-1">{title}</p>
        <h3 className={`text-4xl font-black ${textColor}`}>{value}</h3>
      </div>
    </motion.div>
  );
}
