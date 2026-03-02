'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  CheckCircle2, 
  XCircle, 
  Users, 
  QrCode, 
  LogOut, 
  ShieldCheck,
  Loader2,
  AlertCircle,
  PauseCircle,
  Activity,
  FileText,
  Smartphone
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
  const [waStatus, setWaStatus] = useState<'connecting' | 'open' | 'close' | 'none'>('none');
  const [qr, setQr] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentAction, setCurrentAction] = useState('متوقف');
  const [loading, setLoading] = useState(false);

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
      if (!res.ok) {
        if (res.status !== 503 && res.status !== 502 && res.status !== 504) {
          console.error(`Server returned an error: ${res.status}`);
        }
        return;
      }
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setWaStatus(data.status);
        setQr(data.qr);
        setIsSending(data.isSending || false);
        setCurrentAction(data.currentAction || 'متوقف');
      } catch (e) {
        if (!text.toLowerCase().includes('<!doctype html>')) {
          console.error('Failed to parse JSON:', text.substring(0, 100));
        }
      }
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

  const connectWa = async () => {
    await fetch('/api/whatsapp?action=connect');
    fetchWaStatus();
  };

  const startSending = async () => {
    setIsStarting(true);
    await fetch('/api/whatsapp?action=start');
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
        {/* Decorative Background */}
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

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5A9E2B]" />
              تقدم الحملة
            </span>
            <span className="text-sm font-bold text-[#4A8522] bg-[#f2f9ec] px-3 py-1 rounded-full border border-[#d7eec5]">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
            <motion.div 
              className="bg-gradient-to-r from-[#5A9E2B] to-[#8ED257] h-3 rounded-full relative" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            >
              <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
            </motion.div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500 font-bold">
            <span>تم معالجة {stats.sent + stats.failed} من أصل {stats.total}</span>
            <span>متبقي {stats.total - (stats.sent + stats.failed)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[500px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300"></div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800">
                <QrCode className="text-slate-400 w-6 h-6" />
                حالة الاتصال والإرسال
              </h2>
              {waStatus === 'open' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f2f9ec] text-[#4A8522] rounded-full text-sm font-bold border border-[#d7eec5] shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-[#5A9E2B] animate-pulse"></div>
                  متصل بواتساب
                </div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {waStatus === 'open' ? (
                  <motion.div 
                    key="connected"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-8"
                  >
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#f2a900]" />
                          حالة النظام
                        </h3>
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${isSending ? 'bg-[#d7eec5] text-[#467026] border-[#bce0a1]' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
                          {isSending ? 'نشط الآن' : 'متوقف مؤقتاً'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-bold leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        {currentAction}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {!isSending ? (
                        <button 
                          onClick={startSending}
                          disabled={isStarting}
                          className="w-full bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
                        >
                          {isStarting ? <Loader2 className="animate-spin" /> : <Send size={24} className="text-[#8ED257]" />}
                          بدء حملة الإرسال الذكية
                        </button>
                      ) : (
                        <button 
                          onClick={stopSending}
                          className="w-full bg-red-50 text-red-600 border-2 border-red-200 px-8 py-4 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-3 text-lg"
                        >
                          <PauseCircle size={24} />
                          إيقاف الإرسال مؤقتاً
                        </button>
                      )}
                      
                      <div className="text-xs text-slate-500 text-center space-y-2 mt-4 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="flex items-center justify-center gap-2"><span className="text-lg">💡</span> النظام يستخدم الذكاء الاصطناعي لتغيير صيغة الرسائل تلقائياً.</p>
                        <p className="flex items-center justify-center gap-2"><span className="text-lg">⏱️</span> يتم ترك فاصل زمني (30-90 ثانية) بين كل رسالة لتجنب الحظر.</p>
                        <p className="flex items-center justify-center gap-2"><span className="text-lg">⏸️</span> يتوقف النظام لمدة 30 دقيقة بعد كل 20 رسالة.</p>
                      </div>
                    </div>
                  </motion.div>
                ) : qr ? (
                  <motion.div 
                    key="qr"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 inline-block relative">
                      <div className="absolute inset-0 border-2 border-[#8ED257] rounded-3xl opacity-20 animate-pulse"></div>
                      <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64 relative z-10 rounded-xl" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl mb-2 text-slate-800">اربط حساب واتساب</h3>
                      <p className="text-slate-500 text-sm font-medium">قم بفتح تطبيق واتساب على هاتفك، اذهب إلى "الأجهزة المرتبطة" وامسح الكود أعلاه.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-8 border-white shadow-sm">
                      <Smartphone className="text-slate-300 w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl mb-2 text-slate-800">غير متصل بواتساب</h3>
                      <p className="text-slate-500 text-sm mb-8 font-medium">يجب ربط حساب واتساب الخاص بالشركة للبدء في إرسال الإخطارات.</p>
                    </div>
                    <button 
                      onClick={connectWa}
                      className="bg-white border-2 border-slate-900 text-slate-900 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 mx-auto"
                    >
                      <QrCode size={20} />
                      توليد كود الاتصال (QR)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5A9E2B] to-[#8ED257]"></div>
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-slate-100 flex items-center gap-3 text-slate-800">
              <FileText className="w-6 h-6 text-[#5A9E2B]" />
              معاينة الإخطار القانوني
            </h2>
            <div className="bg-slate-50 p-8 rounded-xl text-sm leading-loose whitespace-pre-wrap text-slate-800 border border-slate-200 flex-1 overflow-y-auto font-bold shadow-inner relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
                <PetrotradeLogo className="w-64 h-64 grayscale" />
              </div>
              <div className="relative z-10">
                {`السيد / العميل الكريم

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
إدارة التحصيل`}
              </div>
            </div>
            <div className="mt-6 p-4 bg-[#f2f9ec] text-[#4A8522] rounded-xl text-xs font-bold border border-[#d7eec5] flex items-start gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#5A9E2B]" />
              <p className="leading-relaxed">
                هذا هو القالب الأساسي. سيقوم الذكاء الاصطناعي (DeepSeek) بإعادة صياغة المقدمة والخاتمة لكل عميل بشكل مختلف لتجنب حظر واتساب، مع الحفاظ على الإجراءات القانونية والعنوان كما هي تماماً.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor, textColor }: { title: string, value: number, icon: React.ReactNode, color: string, borderColor: string, textColor: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-white p-6 rounded-2xl shadow-sm border ${borderColor} flex items-center gap-6 transition-all relative overflow-hidden`}
    >
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} rounded-full opacity-50 blur-2xl`}></div>
      <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center shadow-inner border ${borderColor} relative z-10`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-slate-500 text-sm font-bold mb-1">{title}</p>
        <p className={`text-3xl font-black ${textColor}`}>{value}</p>
      </div>
    </motion.div>
  );
}
