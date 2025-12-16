import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  FilterX,
  ChevronUp,
  User,
  Clock,
  Shield,
  Monitor,
  Smartphone
} from 'lucide-react';
import { useServerPagination } from '../../../../hooks/useServerPagination';
import { Button } from '../../../../components/shared/Button';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../../../components/shared/DateFilterButtons';
import { Pagination } from '../../../../components/shared/Pagination';
import LoadingScreen from '../../../../components/shared/LoadingScreen';
import { Input } from '../../../../components/shared/Input';

interface TermsLog {
  _id: string;
  gcNo: string;
  role: string;
  viewerName: string;
  viewedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

const TermsLogPage = () => {
  const {
    data: logs,
    loading,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    setFilters,
    filters,
    refresh
  } = useServerPagination<TermsLog>({
    endpoint: '/users/terms-logs',
    initialFilters: {
      search: '',
      role: 'All',
      filterType: 'all',
      startDate: '',
      endDate: ''
    }
  });

  const [showFilters, setShowFilters] = useState(false);

  // --- Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleFilterTypeChange = (type: string) => {
    let start = '';
    let end = '';

    if (type === 'today') {
      start = getTodayDate();
      end = getTodayDate();
    } else if (type === 'yesterday') {
      start = getYesterdayDate();
      end = getYesterdayDate();
    } else if (type === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
      end = getTodayDate();
    }

    setFilters({
      filterType: type,
      startDate: start,
      endDate: end
    });
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setFilters({
      filterType: 'custom',
      startDate: start,
      endDate: end
    });
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      role: 'All',
      filterType: 'all',
      startDate: '',
      endDate: ''
    });
  };

  // --- Formatters ---
  
  const formatViewerName = (name: string) => {
    if (!name) return 'Unknown';
    return name.split('(')[0].trim();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Helper to format User Agent into something readable
  const formatUserAgent = (ua: string | undefined) => {
    if (!ua) return 'Unknown Device';
    
    // Simple checks for common devices/browsers
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Android Device';
    if (ua.includes('Macintosh')) return 'Mac';
    if (ua.includes('Windows')) return 'Windows PC';
    
    // Fallback: truncate the long string
    return ua.length > 30 ? ua.substring(0, 30) + '...' : ua;
  };

  const getRoleBadgeColor = (role: string) => {
    const r = role.toLowerCase();
    if (r === 'consignor') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (r === 'consignee') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (r === 'driver') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const hasActiveFilters =
    filters.role !== 'All' ||
    filters.filterType !== 'all' ||
    !!filters.search;

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by GC No or Viewer Name..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={hasActiveFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 flex-1 lg:flex-none"
            >
              <Filter className="w-4 h-4" />
              <span className="ml-2">Filters</span>
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>
            <Button variant="outline" onClick={refresh} className="h-10 px-4 flex-1 lg:flex-none">
              <RefreshCw className="w-4 h-4" />
              <span className="ml-2 ">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
              >
                <FilterX className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Row 1: Date Buttons (Left) + Role Filter (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
            
            {/* Left Side: Date Filters */}
            <div className="w-full lg:w-auto">
              <DateFilterButtons
                filterType={filters.filterType || 'all'}
                setFilterType={handleFilterTypeChange}
                customStart={filters.startDate || ''}
                setCustomStart={(val) => handleCustomDateChange(val, filters.endDate || '')}
                customEnd={filters.endDate || ''}
                setCustomEnd={(val) => handleCustomDateChange(filters.startDate || '', val)}
                hideInputs={true}
              />
            </div>

            {/* Right Side: Role Filter */}
            <div className="w-full lg:flex-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Viewer Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full h-10 pl-10 pr-3 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none capitalize"
                  value={filters.role || 'All'}
                  onChange={(e) => setFilters({ role: e.target.value })}
                >
                  <option value="All">All Roles</option>
                  <option value="consignor">Consignor</option>
                  <option value="consignee">Consignee</option>
                  <option value="driver">Driver</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Custom Date Inputs - Full Width Below */}
          {filters.filterType === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-xl animate-in slide-in-from-top-2 duration-200">
              <Input 
                label="Start Date" 
                id="customStart" 
                name="customStart" 
                type="date" 
                value={filters.startDate || ''}
                onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate || '')}
              />
              <Input 
                label="End Date" 
                id="customEnd" 
                name="customEnd" 
                type="date" 
                value={filters.endDate || ''}
                onChange={(e) => handleCustomDateChange(filters.startDate || '', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Main List Data Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingScreen />
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        GC Number
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Viewer
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                         <Shield className="w-3.5 h-3.5" />
                        Role
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Accessed At
                      </div>
                    </th>
                     <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3.5 h-3.5" />
                        Device Details
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-primary">{log.gcNo}</span>
                        </td>
                        <td className="px-4 py-3">
                            <span className="text-sm text-foreground font-medium">{formatViewerName(log.viewerName)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold border capitalize ${getRoleBadgeColor(log.role)}`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                            <span className="text-sm text-foreground font-medium">{formatDateTime(log.viewedAt)}</span>
                        </td>
                         <td className="px-4 py-3">
                            <div className="text-sm text-foreground font-medium flex items-center gap-2" title={log.userAgent}>
                              {formatUserAgent(log.userAgent) === 'iPhone' || formatUserAgent(log.userAgent) === 'Android Device' ? (
                                <Smartphone size={14} className="text-sm text-foreground font-medium" />
                              ) : (
                                <Monitor size={14} className="text-sm text-foreground font-medium" />
                              )}
                              {formatUserAgent(log.userAgent)}
                            </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                            No access logs found matching your filters
                        </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="block lg:hidden divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log._id} className="p-4 bg-card">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm text-primary">{log.gcNo}</h3>
                          <div className="font-medium text-xs mt-0.5 flex items-center gap-1">
                             <Clock size={10} />
                             {formatDateTime(log.viewedAt)}
                          </div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getRoleBadgeColor(log.role)}`}>
                          {log.role}
                      </span>
                    </div>
                    
                    <div className="pl-[3.25rem] space-y-1.5">
                        <div className="font-medium flex items-center gap-2 text-sm text-foreground">
                            <User className="w-3.5 h-3.5" />
                            <span>{formatViewerName(log.viewerName)}</span>
                        </div>
                        <div className="font-medium flex items-center gap-2 text-sm text-foreground" title={log.userAgent}>
                             {formatUserAgent(log.userAgent) === 'iPhone' || formatUserAgent(log.userAgent) === 'Android Device' ? (
                                <Smartphone className="w-3.5 h-3.5" />
                              ) : (
                                <Monitor className="w-3.5 h-3.5" />
                              )}
                             <span className="truncate max-w-[200px]">{formatUserAgent(log.userAgent)}</span>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No access logs found</div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={setCurrentPage} 
                itemsPerPage={itemsPerPage} 
                onItemsPerPageChange={setItemsPerPage} 
                totalItems={totalItems} 
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TermsLogPage;