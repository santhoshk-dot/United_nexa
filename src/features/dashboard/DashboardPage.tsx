import { useNavigate } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { 
  Truck, 
  FilePlus, 
  FileSymlink, 
  Navigation, 
  Archive, 
  TrendingUp, 
  Calendar, 
  ArrowRight} from 'lucide-react';
import { getTodayDate } from '../../utils/dateHelpers';

// --- Futuristic Stat Card ---
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  delay 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  gradient: string; 
  delay: string;
}) => (
  <div 
    className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg ${gradient} ${delay} transition-all duration-300 hover:scale-105 hover:shadow-primary/30 animate-in fade-in slide-in-from-bottom-4`}
  >
    {/* Subtle light bubble effect */}
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full opacity-50 blur-2xl" />
    
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <Icon className="w-5 h-5" />
      </div>
      <TrendingUp className="w-5 h-5 opacity-70" />
    </div>
    
    <div className="relative z-10">
      <p className="text-sm opacity-90 font-medium">{title}</p>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  </div>
);

// --- Futuristic Action Card (from Master page, adapted) ---
const ActionCard = ({ 
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
    className={`group relative overflow-hidden rounded-xl border border-white/10 bg-card/80 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-primary/20 hover:border-primary/30 cursor-pointer ${delay} animate-in fade-in slide-in-from-right-4`}
  >
    {/* Hover Gradient Effect */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
    
    {/* Content */}
    <div className="relative z-10 flex items-center gap-4">
      <div className={`flex-shrink-0 p-3 rounded-lg bg-gradient-to-br ${gradient} text-white shadow-lg`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-xs text-muted-foreground group-hover:text-foreground/80">{subtitle}</p>
      </div>
      <ArrowRight 
        size={16} 
        className="text-muted-foreground group-hover:text-primary -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" 
      />
    </div>
  </div>
);

// --- Small stat component for the overview grid ---
const OverviewStat = ({ label, value }: { label: string, value: string | number }) => (
  <div className="bg-muted/30 backdrop-blur-sm border border-white/5 rounded-lg p-4 transition-all hover:bg-muted/50 flex flex-col justify-center h-full">
    <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
    <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { gcEntries } = useData();
  
  // Helper to count today's entries
  const todayCount = gcEntries.filter(g => g.gcDate === getTodayDate()).length;
  const weekCount = gcEntries.filter(g => {
    const entryDate = new Date(g.gcDate);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return entryDate >= weekAgo && entryDate <= today;
  }).length;
  

  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl font-bold tracking-tight mb-1">
            Operations Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back! Here's your daily operations hub.
          </p>
        </div>
        <div className="w-full md:w-auto p-4 bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in duration-500 delay-100">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-stretch">
        
        {/* Left Column - Stats */}
        <div className="lg:col-span-8 space-y-6 flex flex-col">
          
          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Today's GC Entries"
              value={todayCount}
              icon={FilePlus}
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              delay="duration-500"
            />
            <StatCard
              title="Active Trips"
              value="0"
              icon={Truck}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              delay="duration-500 delay-100"
            />
            <StatCard
              title="Pending Stock"
              value={gcEntries.length}
              icon={Archive}
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              delay="duration-500 delay-200"
            />
          </div>

          {/* Activity Overview Card */}
          <div className="bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Weekly Overview</h2>
                <p className="text-sm text-muted-foreground mt-1">Last 7 days activity summary</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
              <OverviewStat label="GC Entries" value={weekCount} />
              <OverviewStat label="Loading Sheets" value="0" />
              <OverviewStat label="Trip Sheets" value="0" />
              <OverviewStat label="Total Records" value={gcEntries.length} />
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Activity */}
        <div className="lg:col-span-4">
          
          {/* Quick Actions */}
          <div className="bg-card/60 backdrop-blur-lg border border-border/30 rounded-2xl shadow-lg animate-in fade-in slide-in-from-right-4 duration-500 delay-200 h-full flex flex-col">
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
                onClick={() => navigate('/trip-sheet')}
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

          {/* Recent Activity - REMOVED */}
        </div>
      </div>
    </div>
  );
};