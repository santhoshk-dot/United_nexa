import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TruckElectric, FilePlus, FileSymlink, Navigation, Archive, TrendingUp, Calendar, ArrowRight, Sparkles
} from 'lucide-react';
import api from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, gradient, delay, onClick }: any) => (
  <div onClick={onClick} className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${gradient} ${delay} transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4 cursor-pointer border border-white/20`}>
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full opacity-50 blur-2xl animate-pulse" />
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
    <div className="absolute bottom-0 right-0 w-20 h-20 bg-white/5 rounded-tl-full" />
    
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <Icon className="w-5 h-5" />
      </div>
      <TrendingUp className="w-5 h-5 opacity-70" />
    </div>
    <div className="relative z-10">
      <p className="text-sm opacity-90 font-semibold tracking-wide">{title}</p>
      <p className="text-4xl font-black tracking-tight">{value}</p>
    </div>
  </div>
);

const ActionCard = ({ title, subtitle, icon: Icon, gradient, delay, onClick }: any) => (
  <div onClick={onClick} className={`group relative overflow-hidden rounded-xl border border-white/10 bg-card/80 backdrop-blur-sm p-4 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-primary/30 cursor-pointer ${delay} animate-in fade-in slide-in-from-right-4`}>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    
    <div className="relative z-10 flex items-center gap-4">
      <div className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-2 transition-all duration-300`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-xs text-muted-foreground group-hover:text-foreground/80">{subtitle}</p>
      </div>
      <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
    </div>
  </div>
);

const OverviewStat = ({ label, value }: { label: string, value: string | number }) => (
  <div className="group relative overflow-hidden bg-muted/30 backdrop-blur-sm border border-white/5 rounded-lg p-4 transition-all duration-300 hover:bg-muted/50 hover:border-white/10 hover:scale-[1.02] flex flex-col justify-center h-full">
    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative z-10">
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayGc: 0,
    weekGc: 0,
    tripSheetsWeek: 0,
    activeTrips: 0,
    pendingStock: 0,
    totalRecords: 0,
    loadingSheetsWeek: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 🟢 FIX APPLIED: Added { skipLoader: true } to prevent global loading flash
        const { data } = await api.get('/operations/dashboard/stats', { skipLoader: true } as any);
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-bold tracking-tight">Operations Dashboard</h1>
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-lg">Welcome back! Here's your daily operations hub.</p>
        </div>
        <div className="w-full md:w-auto p-4 bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in duration-500 delay-100 hover:shadow-xl hover:border-primary/20 transition-all">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Today's GC Entries" 
              value={stats.todayGc} 
              icon={FilePlus} 
              gradient="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500" 
              delay="duration-500" 
              onClick={() => navigate('/gc-entry')} 
            />
            <StatCard 
              title="Active Trips" 
              value={stats.activeTrips} 
              icon={TruckElectric} 
              gradient="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" 
              delay="duration-500 delay-100" 
              onClick={() => navigate('/trip-sheet')} 
            />
            <StatCard 
              title="Pending Stock" 
              value={stats.pendingStock} 
              icon={Archive} 
              gradient="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500" 
              delay="duration-500 delay-200" 
              onClick={() => navigate('/pending-stock')} 
            />
          </div>

          <div className="bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 flex-1 flex flex-col hover:shadow-xl hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Weekly Overview</h2>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days activity summary</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <OverviewStat label="GC Entries" value={stats.weekGc} />
              <OverviewStat label="Loading Sheets" value={stats.loadingSheetsWeek} />
              <OverviewStat label="Trip Sheets" value={stats.tripSheetsWeek} />
              <OverviewStat label="Total Records" value={stats.totalRecords} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-4 duration-500 delay-200 h-full flex flex-col hover:shadow-xl hover:border-primary/20 transition-all">
            <h3 className="text-lg font-semibold text-foreground p-6 pb-4">Quick Actions</h3>
            <div className="space-y-3 p-6 pt-0 flex-1">
              <ActionCard 
                title="New GC Entry" 
                subtitle="Create a goods challan" 
                icon={FilePlus} 
                gradient="from-primary to-blue-500" 
                delay="duration-300" 
                onClick={() => navigate('/gc-entry/new')} 
              />
              <ActionCard 
                title="Loading Sheet" 
                subtitle="Prepare loading manifest" 
                icon={FileSymlink} 
                gradient="from-indigo-500 to-purple-500" 
                delay="duration-300 delay-100" 
                onClick={() => navigate('/loading-sheet')} 
              />
              <ActionCard 
                title="Trip Sheet" 
                subtitle="Schedule a new delivery" 
                icon={Navigation} 
                gradient="from-cyan-500 to-teal-500" 
                delay="duration-300 delay-200" 
                onClick={() => navigate('/tripsheet/new')} 
              />
              <ActionCard 
                title="Pending Stock" 
                subtitle="View current inventory" 
                icon={Archive} 
                gradient="from-amber-500 to-orange-500" 
                delay="duration-300 delay-300" 
                onClick={() => navigate('/pending-stock')} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};