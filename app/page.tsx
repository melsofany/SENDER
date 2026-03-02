'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
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
  Droplet
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
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100"
        >
          <div className="flex flex-col items-center mb-8">
            <PetrotradeLogo className="w-24 h-24 mb-4 drop-shadow-md" />
            <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">بتروتريد</h1>
            <p className="text-gray-500 text-sm mt-2 font-medium">نظام الإخطارات القانونية الذكي</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-6 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7AC142] focus:border-transparent transition-all text-center text-lg"
                required
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-2 bg-red-50 py-2 rounded-lg"
              >
                <AlertCircle size={16} />
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'تسجيل الدخول'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-[#1A1A1A]" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <PetrotradeLogo className="w-12 h-12" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">بتروتريد</h1>
            <p className="text-xs text-gray-500 font-medium">نظام الإخطارات القانونية الذكي</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-gray-500 font-medium text-sm"
        >
          <LogOut size={18} />
          <span>تسجيل خروج</span>
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="إجمالي الأرقام المستهدفة" 
            value={stats.total} 
            icon={<Users className="text-[#1A1A1A]" />} 
            color="bg-gray-100"
            borderColor="border-gray-200"
          />
          <StatCard 
            title="تم الإرسال بنجاح" 
            value={stats.sent} 
            icon={<CheckCircle2 className="text-[#7AC142]" />} 
            color="bg-[#f2f9ec]"
            borderColor="border-[#d7eec5]"
          />
          <StatCard 
            title="فشل الإرسال" 
            value={stats.failed} 
            icon={<XCircle className="text-red-600" />} 
            color="bg-red-50"
            borderColor="border-red-100"
          />
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-700">تقدم الحملة</span>
            <span className="text-sm font-bold text-[#7AC142]">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <motion.div 
              className="bg-[#7AC142] h-4 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>تم معالجة {stats.sent + stats.failed} من أصل {stats.total}</span>
            <span>متبقي {stats.total - (stats.sent + stats.failed)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-3">
                <QrCode className="text-[#7AC142] w-6 h-6" />
                حالة الاتصال والإرسال
              </h2>
              {waStatus === 'open' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-[#f2f9ec] text-[#5a8e31] rounded-full text-sm font-medium border border-[#d7eec5]">
                  <div className="w-2 h-2 rounded-full bg-[#7AC142] animate-pulse"></div>
                  متصل
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
                    <div className="bg-[#f8fafc] p-6 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#f2a900]" />
                          حالة النظام
                        </h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isSending ? 'bg-[#d7eec5] text-[#467026]' : 'bg-gray-200 text-gray-700'}`}>
                          {isSending ? 'نشط' : 'متوقف'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        {currentAction}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {!isSending ? (
                        <button 
                          onClick={startSending}
                          disabled={isStarting}
                          className="w-full bg-[#1A1A1A] text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50 text-lg"
                        >
                          {isStarting ? <Loader2 className="animate-spin" /> : <Send size={24} className="text-[#7AC142]" />}
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
                      
                      <div className="text-xs text-gray-500 text-center space-y-1 mt-2">
                        <p>💡 النظام يستخدم الذكاء الاصطناعي لتغيير صيغة الرسائل تلقائياً.</p>
                        <p>⏱️ يتم ترك فاصل زمني (30-90 ثانية) بين كل رسالة لتجنب الحظر.</p>
                        <p>⏸️ يتوقف النظام لمدة 30 دقيقة بعد كل 20 رسالة.</p>
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
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 inline-block">
                      <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">اربط حساب واتساب</h3>
                      <p className="text-gray-500 text-sm">قم بفتح تطبيق واتساب على هاتفك، اذهب إلى "الأجهزة المرتبطة" وامسح الكود أعلاه.</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-6"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="text-gray-400 w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">غير متصل بواتساب</h3>
                      <p className="text-gray-500 text-sm mb-6">يجب ربط حساب واتساب الخاص بالشركة للبدء في إرسال الإخطارات.</p>
                    </div>
                    <button 
                      onClick={connectWa}
                      className="bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] px-8 py-3 rounded-xl font-bold hover:bg-[#1A1A1A] hover:text-white transition-all shadow-sm"
                    >
                      توليد كود الاتصال (QR)
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
              معاينة الرسالة الأساسية
            </h2>
            <div className="bg-[#f8fafc] p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-gray-700 border border-gray-200 flex-1 overflow-y-auto font-medium">
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
            <div className="mt-4 p-4 bg-[#f2f9ec] text-[#467026] rounded-xl text-xs font-medium border border-[#d7eec5] flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#7AC142]" />
              <p>
                هذا هو القالب الأساسي. سيقوم الذكاء الاصطناعي (DeepSeek) بإعادة صياغة المقدمة والخاتمة لكل عميل بشكل مختلف لتجنب حظر واتساب، مع الحفاظ على الإجراءات القانونية والعنوان كما هي تماماً.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color, borderColor }: { title: string, value: number, icon: React.ReactNode, color: string, borderColor: string }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`bg-white p-6 rounded-3xl shadow-sm border ${borderColor} flex items-center gap-6 transition-all`}
    >
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-bold mb-1">{title}</p>
        <p className="text-4xl font-black text-[#1A1A1A]">{value}</p>
      </div>
    </motion.div>
  );
}
