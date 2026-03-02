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
  AlertCircle
} from 'lucide-react';
import { verifyPassword, getStats } from '@/app/actions';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, sent: 0, failed: 0 });
  const [waStatus, setWaStatus] = useState<'connecting' | 'open' | 'close' | 'none'>('none');
  const [qr, setQr] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        fetchStats();
        fetchWaStatus();
      }, 5000);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center p-4 font-sans" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[32px] shadow-xl max-w-md w-full border border-black/5"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center mb-4 shadow-lg">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#1a1a1a] serif">تسجيل الدخول</h1>
            <p className="text-gray-500 text-sm mt-2">يرجى إدخال كلمة المرور للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5A5A40] transition-all text-center"
                required
              />
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-2"
              >
                <AlertCircle size={16} />
                {error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold hover:bg-[#4a4a35] transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'دخول'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-[#1a1a1a]" dir="rtl">
      <header className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shadow-sm">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold serif">بتروتريد - نظام الإخطارات</h1>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="إجمالي الأرقام" 
            value={stats.total} 
            icon={<Users className="text-blue-500" />} 
            color="bg-blue-50"
          />
          <StatCard 
            title="تم الإرسال" 
            value={stats.sent} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
            color="bg-emerald-50"
          />
          <StatCard 
            title="فشل الإرسال" 
            value={stats.failed} 
            icon={<XCircle className="text-red-500" />} 
            color="bg-red-50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 flex flex-col items-center justify-center min-h-[400px]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <QrCode className="text-[#5A5A40]" />
              اتصال واتساب
            </h2>
            
            <AnimatePresence mode="wait">
              {waStatus === 'open' ? (
                <motion.div 
                  key="connected"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="text-emerald-600 w-12 h-12" />
                  </div>
                  <p className="text-emerald-600 font-bold text-lg">متصل بنجاح</p>
                  <button 
                    onClick={startSending}
                    disabled={isStarting}
                    className="bg-[#5A5A40] text-white px-8 py-4 rounded-2xl font-bold hover:bg-[#4a4a35] transition-all shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {isStarting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    بدء إرسال الرسائل
                  </button>
                </motion.div>
              ) : qr ? (
                <motion.div 
                  key="qr"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
                    <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-gray-500 text-sm">قم بمسح الكود باستخدام تطبيق واتساب</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <p className="text-gray-400 italic">غير متصل</p>
                  <button 
                    onClick={connectWa}
                    className="bg-white border-2 border-[#5A5A40] text-[#5A5A40] px-8 py-4 rounded-2xl font-bold hover:bg-[#5A5A40] hover:text-white transition-all"
                  >
                    توليد كود الاتصال
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5">
            <h2 className="text-xl font-bold mb-6">معاينة الرسالة</h2>
            <div className="bg-gray-50 p-6 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-gray-700 border border-gray-100 max-h-[400px] overflow-y-auto">
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
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[32px] shadow-sm border border-black/5 flex items-center gap-6"
    >
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </motion.div>
  );
}
