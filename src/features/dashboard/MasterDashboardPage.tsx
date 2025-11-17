import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { 
  Truck, 
  Users, 
  MapPin, 
  Package, 
  FileText, 
  Database, 
  Activity, 
  ArrowRight,
  Layers,
  Globe
} from 'lucide-react';

// --- Futuristic Card Component ---
const ModuleCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  gradient, 
  delay, 
  onClick 
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  delay: string;
  onClick: () => void;
}) => (
  <div 
    onClick={onClick}
    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-card/40 backdrop-blur-md p-6 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/20 hover:border-primary/30 cursor-pointer ${delay}`}
  >
    {/* Hover Gradient Effect */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
    
    {/* Content */}
    <div className="relative z-10 flex items-start justify-between">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
        <Icon size={24} />
      </div>
      <div className="p-2 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
        <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
      </div>
    </div>

    <div className="relative z-10 mt-4">
      <h3 className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 group-hover:text-foreground/80 transition-colors">
        {subtitle}
      </p>
    </div>

    {/* Decorative background shape */}
    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
  </div>
);

// --- Stat Card Component ---
const StatCard = ({ label, value, icon: Icon, trend }: { label: string, value: string | number, icon: any, trend?: string }) => (
  <div className="relative overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <Icon size={18} className="text-primary opacity-70 group-hover:scale-110 transition-transform" />
    </div>
    <div className="flex items-baseline space-x-2">
      <h4 className="text-3xl font-bold text-foreground">{value}</h4>
      {trend && <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>}
    </div>
    {/* Subtle glowing line at bottom */}
    <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary/50 group-hover:w-full transition-all duration-700 ease-out" />
  </div>
);

export const MasterDashboardPage = () => {
  const navigate = useNavigate();
  const { consignors, consignees } = useData();

  return (
    <div className="min-h-screen space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* --- Hero Section --- */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[128px] animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-primary-foreground/80">
              <Database size={20} className="animate-bounce" />
              <span className="font-medium tracking-wide text-sm uppercase">System Administration</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
              Master Control
            </h1>
            <p className="mt-2 text-lg text-slate-300 max-w-xl">
              Centralized management for all core data entities. Configure consignors, routing, and inventory parameters from one secure location.
            </p>
          </div>
        </div>
      </div>

      {/* --- Stats Overview --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Consignors" 
          value={consignors.length} 
          icon={Truck} 
          trend="+Active"
        />
        <StatCard 
          label="Total Consignees" 
          value={consignees.length} 
          icon={Users}
          trend="+Active" 
        />
        <StatCard 
          label="System Health" 
          value="Optimal" 
          icon={Activity}
          trend="100%"
        />
      </div>

      {/* --- Modules Grid --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-2">
          <Layers size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Data Modules</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* PEOPLE GROUP */}
          <ModuleCard 
            title="Consignors" 
            subtitle="Manage senders & GST details"
            icon={Truck}
            gradient="from-blue-500 to-cyan-500"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500"
            onClick={() => navigate('/master/consignors')}
          />
          
          <ModuleCard 
            title="Consignees" 
            subtitle="Manage receivers & destinations"
            icon={Users}
            gradient="from-indigo-500 to-purple-500"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
            onClick={() => navigate('/master/consignees')}
          />

          {/* LOCATION GROUP */}
          <ModuleCard 
            title="Route Origins" 
            subtitle="Configure 'From' locations"
            icon={MapPin}
            gradient="from-emerald-500 to-teal-500"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
            onClick={() => navigate('/master/from-places')}
          />

          <ModuleCard 
            title="Destinations" 
            subtitle="Configure 'To' locations"
            icon={Globe}
            gradient="from-rose-500 to-orange-500"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
            onClick={() => navigate('/master/to-places')}
          />

          {/* INVENTORY GROUP */}
          <ModuleCard 
            title="Packing Types" 
            subtitle="Define package units"
            icon={Package}
            gradient="from-amber-500 to-orange-500"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
            onClick={() => navigate('/master/packings')}
          />

          <ModuleCard 
            title="Contents" 
            subtitle="Standardize goods descriptions"
            icon={FileText}
            gradient="from-cyan-500 to-blue-600"
            delay="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
            onClick={() => navigate('/master/contents')}
          />
        </div>
      </div>
    </div>
  );
};