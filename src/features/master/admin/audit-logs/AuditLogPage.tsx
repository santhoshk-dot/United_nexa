import { useState, useEffect, type JSX } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  RefreshCw,
  X,
  FilterX,
  ChevronUp,
  User,
  Clock,
  Database,
  Loader2,
  Box,
  ArrowRight,
  Hash,
  Activity,
  CheckCircle2,
  Truck,
  Users,
  MapPin,
  Package,
  Layers,
  Home
} from 'lucide-react';
import { useServerPagination } from '../../../../hooks/useServerPagination';
import type { HistoryLog, GcEntry } from '../../../../types';
import { Button } from '../../../../components/shared/Button';
import { DateFilterButtons, getTodayDate, getYesterdayDate } from '../../../../components/shared/DateFilterButtons';
import { Pagination } from '../../../../components/shared/Pagination';
import {LoadingScreen } from '../../../../components/shared/LoadingScreen';
import { useDataContext } from '../../../../contexts/DataContext';

interface ExtendedHistoryLog extends HistoryLog {
  reason?: string;
}

// 🟢 HELPER: Determine if a collection is Operational
const isOperational = (collectionName: string) => {
  return ['GcEntry', 'TripSheet', 'LoadingSheet'].includes(collectionName);
};

const AuditLogPage = () => {
  const { fetchGcById, consignors, consignees, fetchConsignors, fetchConsignees } = useDataContext();

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
  } = useServerPagination<ExtendedHistoryLog>({
    endpoint: '/users/history',
    initialFilters: {
      search: '',
      module: 'All',
      action: 'All',
      filterType: 'all',
      startDate: '',
      endDate: ''
    }
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ExtendedHistoryLog | null>(null);
  const [logContext, setLogContext] = useState<GcEntry | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    if (consignors.length === 0) fetchConsignors();
    if (consignees.length === 0) fetchConsignees();
  }, []); 

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
      module: 'All',
      action: 'All',
      filterType: 'all',
      startDate: '',
      endDate: ''
    });
  };

  // 🟢 HANDLERS FOR SPLIT DROPDOWNS
  const handleOpsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters({ module: val || 'All' });
  };

  const handleMasterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilters({ module: val || 'All' });
  };

  // 🟢 LOGIC TO DETERMINE DROPDOWN VALUES
  const currentModule = filters.module || 'All';
  
  const opsOptions = ['GcEntry', 'TripSheet', 'LoadingSheet'];
  const masterOptions = ['Consignor', 'Consignee', 'Vehicle', 'Driver', 'User', 'FromPlace', 'ToPlace', 'Packing', 'Content',];

  const isOpsSelected = opsOptions.includes(currentModule) || currentModule === 'Operations';
  const isMasterSelected = masterOptions.includes(currentModule) || currentModule === 'Masters';

  const opsValue = isOpsSelected ? currentModule : (currentModule === 'All' ? '' : '');
  const masterValue = isMasterSelected ? currentModule : (currentModule === 'All' ? '' : '');

  // --- Effects ---
  useEffect(() => {
    if (selectedLog && (selectedLog.collectionName === 'LoadingSheet' || selectedLog.collectionName === 'GcEntry')) {
      if (selectedLog.action === 'DELETE') {
         setLogContext(null);
         return;
      }
      
      setLoadingContext(true);
      fetchGcById(selectedLog.documentId)
        .then((data) => {
          setLogContext(data);
        })
        .catch(() => {
          setLogContext(null);
        })
        .finally(() => {
          setLoadingContext(false);
        });
    } else {
      setLogContext(null);
    }
  }, [selectedLog, fetchGcById]);

  // --- Formatters ---
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

  const getActionColor = (act: string) => {
    switch (act) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const resolveIdToName = (id: string | number, key: string) => {
    if (!id) return 'N/A';
    const idStr = String(id);
    const keyLower = key.toLowerCase();

    if (keyLower.includes('consignor')) {
      const found = consignors.find(c => String(c.id) === idStr);
      return found ? found.name : idStr;
    }
    if (keyLower.includes('consignee')) {
      const found = consignees.find(c => String(c.id) === idStr);
      return found ? found.name : idStr;
    }
    return idStr;
  };

  // --- Render Helpers ---
  const formatObject = (obj: any): JSX.Element => {
    if (!obj) return <span className="text-muted-foreground italic">Empty</span>;

    const keys = Object.keys(obj).filter(k => !['id', '_id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', '__v'].includes(k));

    if (keys.length === 0) return <span className="text-xs italic text-muted-foreground">ID: {obj.id || 'Object'}</span>;

    return (
      <div className="space-y-1.5">
        {keys.map(k => {
          const isIdField = k.toLowerCase().includes('consignor') || k.toLowerCase().includes('consignee');
          const displayValue = isIdField ? resolveIdToName(obj[k], k) : String(obj[k]);

          return (
            <div key={k} className="flex flex-col sm:flex-row sm:gap-2 text-xs border-b border-border/40 last:border-0 pb-1.5 last:pb-0">
              <span className="font-semibold text-muted-foreground capitalize shrink-0 min-w-[100px]">
                {k.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="break-all text-foreground font-medium">
                {displayValue}
                {isIdField && String(obj[k]) !== displayValue && (
                  <span className="text-[10px] text-muted-foreground ml-1 font-normal">({obj[k]})</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const formatValue = (val: any, fieldName?: string) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic text-xs">Empty</span>;

    if ((typeof val === 'string' || typeof val === 'number') && fieldName && (fieldName.toLowerCase().includes('consignor') || fieldName.toLowerCase().includes('consignee'))) {
      const resolvedName = resolveIdToName(val, fieldName);
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{resolvedName}</span>
          {String(resolvedName) !== String(val) && (
            <span className="text-[10px] text-muted-foreground font-mono">{val}</span>
          )}
        </div>
      );
    }

    if (typeof val === 'boolean') return <span className={`text-xs px-2 py-0.5 rounded ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{val ? 'Yes' : 'No'}</span>;

    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-muted-foreground italic text-xs">[] (Empty List)</span>;

      if (typeof val[0] !== 'object' && val[0] !== null) {
        return (
          <div className="flex flex-wrap gap-1.5">
            {val.map((v, i) => (
              <span key={i} className="inline-flex px-2.5 py-1 bg-background border border-border rounded text-xs font-mono shadow-sm">{String(v)}</span>
            ))}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {val.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-secondary/30 border border-border text-sm shadow-sm">
              <div className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider border-b border-border/50 pb-1">Item {idx + 1}</div>
              {formatObject(item)}
            </div>
          ))}
          <div className="text-[10px] text-muted-foreground text-center pt-1 mt-1">
            Total: {val.length} items
          </div>
        </div>
      );
    }

    if (typeof val === 'object') {
      return <div className="p-3 rounded-lg bg-secondary/30 border border-border text-sm shadow-sm">{formatObject(val)}</div>;
    }

    return <span className="text-sm break-words leading-relaxed">{String(val)}</span>;
  };

  const hasActiveFilters =
    filters.module !== 'All' ||
    filters.action !== 'All' ||
    filters.filterType !== 'all' ||
    !!filters.search;

  const getModuleLabel = (collectionName: string) => {
    switch (collectionName) {
      case 'GcEntry': return 'GC Entry';
      case 'TripSheet': return 'Trip Sheet';
      case 'LoadingSheet': return 'Loading Sheet';
      case 'Consignor': return 'Consignor';
      case 'Consignee': return 'Consignee';
      case 'Vehicle': return 'Vehicle';
      case 'Driver': return 'Driver';
      case 'User': return 'User';
      case 'FromPlace': return 'From Place';
      case 'ToPlace': return 'To Place';
      case 'Packing': return 'Packing Unit';
      case 'Content': return 'Content Type';
      case 'Godown': return 'Godown';
      default: return collectionName;
    }
  };

  const getModuleIcon = (collectionName: string) => {
    switch (collectionName) {
      case 'LoadingSheet': return <Box size={18} />;
      case 'TripSheet': return <Activity size={18} />;
      case 'GcEntry': return <FileText size={18} />;
      case 'Consignor': 
      case 'Consignee': return <Users size={18} />;
      case 'Vehicle': return <Truck size={18} />;
      case 'Driver': return <User size={18} />;
      case 'User': return <User size={18} className="text-purple-600" />;
      case 'FromPlace':
      case 'ToPlace': return <MapPin size={18} />;
      case 'Packing': return <Package size={18} />;
      case 'Content': return <Layers size={18} />;
      case 'Godown': return <Home size={18} />;
      default: return <Database size={18} />;
    }
  };

  const renderLoadingSheetChanges = () => {
    if (loadingContext) {
      return (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Loading content details...
        </div>
      );
    }

    const loadedChange = selectedLog?.changes?.find(c => c.field === 'loadedPackages');

    if (!loadedChange) {
      const statusChange = selectedLog?.changes?.find(c => c.field === 'loadingStatus');
      if (statusChange) {
        return (
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <div className="text-sm font-medium text-foreground mb-2">Status Changed</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{formatValue(statusChange.oldValue)}</span>
              <ArrowRight size={14} className="text-muted-foreground" />
              <span className="font-bold text-primary">{formatValue(statusChange.newValue)}</span>
            </div>
          </div>
        );
      }
      return (
        <div className="p-4 bg-muted/20 rounded-lg text-center text-muted-foreground italic text-sm">
          No loading changes recorded in this update.
        </div>
      );
    }

    const getPackagesForId = (data: any, itemId: string | null): Set<number> => {
      const set = new Set<number>();
      if (!data || !Array.isArray(data)) return set;
      data.forEach((entry: any) => {
        if (typeof entry === 'number') {
          if (itemId === null) set.add(entry);
        } else if (entry && typeof entry === 'object' && Array.isArray(entry.packages)) {
          if (itemId === null || String(entry.itemId) === String(itemId)) {
            entry.packages.forEach((p: number) => set.add(p));
          }
        }
      });
      return set;
    };

    const getAllPackages = (data: any): number[] => {
      const list: number[] = [];
      if (!data || !Array.isArray(data)) return list;
      data.forEach((entry: any) => {
        if (typeof entry === 'number') list.push(entry);
        else if (entry?.packages) list.push(...entry.packages);
      });
      return list;
    };

    const totalOld = getAllPackages(loadedChange.oldValue);
    const totalNew = getAllPackages(loadedChange.newValue);
    const addedCount = totalNew.filter(x => !totalOld.includes(x)).length;
    const removedCount = totalOld.filter(x => !totalNew.includes(x)).length;

    let contentItems = logContext?.contentItems || [];
    if (contentItems.length === 0) {
      contentItems = [{
        id: 'FALLBACK_ALL',
        packing: 'Packages',
        contents: 'All Items (Details Unavailable)',
        fromNo: 1,
        qty: 0,
        prefix: ''
      }];
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/30 p-3 rounded-lg border border-border gap-2">
          <div className="text-sm font-medium">
            <span className="text-muted-foreground">Total Loaded:</span>
            <span className="ml-1 font-mono">{totalOld.length}</span>
            <ArrowRight size={14} className="inline mx-2 text-muted-foreground" />
            <span className="font-mono text-foreground font-bold">{totalNew.length}</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {addedCount > 0 && <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">+{addedCount} Added</span>}
            {removedCount > 0 && <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">-{removedCount} Removed</span>}
            {addedCount === 0 && removedCount === 0 && <span className="text-muted-foreground">No quantity changes</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-2 bg-card rounded-lg text-[10px] sm:text-xs font-medium text-muted-foreground border border-border shadow-sm">
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-400 rounded mr-2"></div> Newly Loaded</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-red-50 border border-red-300 rounded mr-2 relative overflow-hidden"><div className="absolute inset-0 bg-red-400 opacity-20 transform -rotate-45"></div></div> Unloaded</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded mr-2"></div> Previously Loaded</div>
          <div className="flex items-center"><div className="w-2.5 h-2.5 bg-card border border-gray-300 border-dashed rounded mr-2"></div> Remaining</div>
        </div>

        <div className="space-y-6">
          {contentItems.map((item: any, idx: number) => {
            const itemId = item.id === 'FALLBACK_ALL' ? null : item.id;
            const oldSet = getPackagesForId(loadedChange.oldValue, itemId);
            const newSet = getPackagesForId(loadedChange.newValue, itemId);
            // Calculate range
            let startNo, endNo, qty;
            if (item.id === 'FALLBACK_ALL') {
              const allNums = [...Array.from(oldSet), ...Array.from(newSet)];
              if (allNums.length === 0) return null;
              startNo = Math.min(...allNums);
              endNo = Math.max(...allNums);
              qty = endNo - startNo + 1;
            } else {
              startNo = parseInt(item.fromNo || '1');
              qty = parseInt(item.qty || '0');
              endNo = startNo + qty - 1;
            }
            const fullRange = Array.from({ length: qty }, (_, i) => startNo + i);

            return (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                <div className="bg-muted/30 px-4 py-2.5 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center sticky top-0 z-10 gap-1">
                  <div className="flex items-center gap-2">
                    <Box size={16} className="text-primary shrink-0" />
                    <span className="font-semibold text-sm text-foreground truncate">
                      {item.packing} - {item.contents}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono bg-card px-2 py-0.5 rounded border border-border whitespace-nowrap">
                    Range: {startNo} - {endNo}
                  </span>
                </div>

                <div className="p-4 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {fullRange.map(num => {
                    const wasLoaded = oldSet.has(num);
                    const isLoaded = newSet.has(num);
                    let className = "";

                    if (isLoaded && !wasLoaded) className = "bg-emerald-100 text-emerald-700 border-emerald-400 font-bold ring-1 ring-emerald-400/30";
                    else if (!isLoaded && wasLoaded) className = "bg-red-50 text-red-500 border-red-200 line-through decoration-red-500/50 opacity-70";
                    else if (isLoaded && wasLoaded) className = "bg-blue-50 text-blue-700 border-blue-100";
                    else className = "bg-card text-muted-foreground border-gray-200 border-dashed hover:bg-muted/20";

                    return (
                      <div key={num} className={`px-1 py-1 rounded text-[10px] sm:text-xs font-mono border flex items-center justify-center min-w-[32px] transition-colors ${className}`}>
                        {num}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        {/* Desktop - Single Row */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Doc ID or User..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
            />
          </div>
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-10 px-4 shrink-0"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          </Button>
          <Button variant="outline" onClick={refresh} className="h-10">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Mobile/Tablet - Two Rows */}
        <div className="flex lg:hidden flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search || ''}
                onChange={handleSearchChange}
                className="w-full h-10 pl-10 pr-4 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 text-sm"
              />
            </div>
            <Button
              variant={hasActiveFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-3 shrink-0"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Filters</span>
              {hasActiveFilters && <span className="ml-1.5 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refresh} className="flex-1 h-9 text-xs sm:text-sm">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Refresh
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
          {/* 🟢 CHANGED: Two separate dropdowns for Module */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Operation Module</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full h-10 pl-10 pr-3 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none"
                  value={isOpsSelected ? opsValue : ''}
                  onChange={handleOpsChange}
                >
                  <option value="">Select Operation...</option>
                  <option value="Operations">All Operations</option>
                  <option value="GcEntry">GC Entry</option>
                  <option value="TripSheet">Trip Sheet</option>
                  <option value="LoadingSheet">Loading Sheet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Master Module</label>
              <div className="relative">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full h-10 pl-10 pr-3 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none"
                  value={isMasterSelected ? masterValue : ''}
                  onChange={handleMasterChange}
                >
                  <option value="">Select Master...</option>
                  <option value="Masters">All Masters</option>
                  <option value="Consignor">Consignor</option>
                  <option value="Consignee">Consignee</option>
                  <option value="Vehicle">Vehicle</option>
                  <option value="Driver">Driver</option>
                  <option value="FromPlace">From Place</option>
                  <option value="ToPlace">To Place</option>
                  <option value="Packing">Packing Unit</option>
                  <option value="Content">Content Type</option>
                  <option value="Godown">Godown</option>
                  <option value="User">User</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Action</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  className="w-full h-10 pl-10 pr-3 bg-secondary/50 text-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm appearance-none"
                  value={filters.action || 'All'}
                  onChange={(e) => setFilters({ action: e.target.value })}
                >
                  <option value="All">All Actions</option>
                  <option value="CREATE">Created</option>
                  <option value="UPDATE">Updated</option>
                  <option value="DELETE">Deleted</option>
                </select>
              </div>
            </div>
          </div>
          <DateFilterButtons
            filterType={filters.filterType || 'all'}
            setFilterType={handleFilterTypeChange}
            customStart={filters.startDate || ''}
            setCustomStart={(val) => handleCustomDateChange(val, filters.endDate || '')}
            customEnd={filters.endDate || ''}
            setCustomEnd={(val) => handleCustomDateChange(filters.startDate || '', val)}
          />
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
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Hash className="w-3.5 h-3.5" />
                        Doc ID
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Database className="w-3.5 h-3.5" />
                        Module
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <User className="w-3.5 h-3.5" />
                        User
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" />
                        Timestamp
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={log._id || index} className="hover:bg-muted/30 transition-colors">
                        {/* 🟢 CHANGED: Display S.No for Master, DocID for Operations */}
                        <td className="px-4 py-3">
                           {isOperational(log.collectionName) ? (
                              <span className="font-mono font-semibold text-primary">{log.documentId}</span>
                           ) : (
                              <span className="font-mono text-muted-foreground text-sm">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </span>
                           )}
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{getModuleIcon(log.collectionName)}</span>
                                <span className="text-sm text-foreground font-medium">{getModuleLabel(log.collectionName)}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm text-foreground font-medium">{log.changedBy}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-foreground font-medium">{formatDateTime(log.timestamp)}</span></td>
                        <td className="px-4 py-3"><span className={`inline-flex px-2 py-1 rounded text-xs font-semibold border ${getActionColor(log.action)}`}>{log.action}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            <button onClick={() => setSelectedLog(log)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No audit logs found matching your filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Tablet View - show on md screens */}
            <div className="hidden md:block lg:hidden overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Doc ID / Module
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User / Time
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                      Action
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={log._id || index} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3">
                          <div>
                            {isOperational(log.collectionName) ? (
                              <span className="font-mono font-semibold text-primary block">{log.documentId}</span>
                            ) : (
                              <span className="font-mono text-muted-foreground text-sm block">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </span>
                            )}
                            <span className="text-xs text-foreground mt-0.5 block font-medium flex items-center gap-1">
                                {getModuleIcon(log.collectionName)}
                                {getModuleLabel(log.collectionName)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <span className="text-sm text-foreground block font-medium">{log.changedBy}</span>
                            <span className="text-xs text-foreground mt-0.5 block font-medium">{formatDateTime(log.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No audit logs found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards - show on small screens only */}
            <div className="block md:hidden divide-y divide-border">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={log._id || index} className="p-4 bg-card">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${log.action === 'DELETE' ? 'bg-red-100 text-red-600' :
                          log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                          {getModuleIcon(log.collectionName)}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground text-sm">
                             {isOperational(log.collectionName) ? log.documentId : `S.No: ${(currentPage - 1) * itemsPerPage + index + 1}`}
                          </h3>
                          <div className="text-sm text-foreground mt-0.5 font-medium">{getModuleLabel(log.collectionName)}</div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getActionColor(log.action)}`}>{log.action}</span>
                    </div>
                    <div className="pl-[3.25rem] mb-4 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium"><User className="w-3.5 h-3.5" /><span>{log.changedBy}</span></div>
                      <div className="flex items-center gap-2 text-xs text-foreground font-medium"><Clock className="w-3.5 h-3.5" /> <span className="font-medium">{formatDateTime(log.timestamp)}</span></div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <button onClick={() => setSelectedLog(log)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50">
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">No audit logs found</div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={setItemsPerPage} totalItems={totalItems} />
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL - Redesigned for Mobile (Centered & Responsive) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl border border-border overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 md:py-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2 truncate">
                  Audit Details
                  <span className="px-2 py-0.5 text-xs font-mono bg-card border border-border rounded text-muted-foreground hidden sm:inline-block">
                    {selectedLog.documentId}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] md:text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User size={10} /> {selectedLog.changedBy}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {formatDateTime(selectedLog.timestamp)}</span>
                  <span className="sm:hidden font-mono text-primary bg-primary/10 px-1 rounded">{selectedLog.documentId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
              {selectedLog.collectionName === 'LoadingSheet' ? (
                renderLoadingSheetChanges()
              ) : selectedLog.action === 'UPDATE' ? (
                <div className="space-y-4">
                  <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Field Changes</h4>
                  {selectedLog.changes && selectedLog.changes.length > 0 ? (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="min-w-full overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30 text-xs text-muted-foreground uppercase border-b border-border">
                            <tr>
                              <th className="px-4 py-2 text-left w-1/4 whitespace-nowrap">Field</th>
                              <th className="px-4 py-2 text-left text-red-600 bg-red-50/50 w-1/3 whitespace-nowrap">Old Value</th>
                              <th className="px-4 py-2 text-left text-emerald-600 bg-emerald-50/50 w-1/3 whitespace-nowrap">New Value</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {selectedLog.changes.map((change, idx) => (
                              <tr key={idx} className="hover:bg-muted/30 align-top">
                                <td className="px-4 py-3 font-medium text-foreground border-r border-border text-sm whitespace-nowrap">
                                  {change.field.replace(/([A-Z])/g, ' $1').trim()}
                                </td>
                                <td className="px-4 py-3 text-gray-600 border-r border-border bg-red-50/10 min-w-[150px]">
                                  {formatValue(change.oldValue, change.field)}
                                </td>
                                <td className="px-4 py-3 text-gray-900 bg-emerald-50/10 min-w-[150px]">
                                  {formatValue(change.newValue, change.field)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/20 rounded-lg text-center text-muted-foreground italic text-sm">
                      No specific field changes recorded (Soft Update)
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${selectedLog.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                    {selectedLog.action === 'CREATE' ? <CheckCircle2 size={32} /> : <X size={32} />}
                  </div>
                  <h3 className="text-xl font-medium text-foreground">
                    Record {selectedLog.action === 'CREATE' ? 'Created' : 'Deleted'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                    This record was {selectedLog.action.toLowerCase()} by <span className="font-semibold text-foreground">{selectedLog.changedBy}</span>.
                    {selectedLog.action === 'DELETE' && " Data is preserved in history but hidden from active views."}
                  </p>

                  {/* 🟢 DISPLAY REASON if available */}
                  {selectedLog.action === 'DELETE' && selectedLog.reason && (
                    <div className="mt-4 max-w-sm mx-auto p-3 bg-red-50 border border-red-200 rounded-md text-left">
                      <span className="text-xs font-bold text-red-800 uppercase tracking-wide block mb-1">
                        Deletion Reason
                      </span>
                      <p className="text-sm text-red-700 italic">
                        "{selectedLog.reason}"
                      </p>
                    </div>
                  )}

                  {/* 🟢 Show Snapshot ONLY for Deletes (Hidden for Creates as requested) */}
                  {/* {selectedLog.snapshot && selectedLog.action !== 'CREATE' && (
                     <div className="mt-8 text-left">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 border-b border-border pb-1">
                            Snapshot Data
                        </h4>
                        <div className="bg-muted/10 rounded-lg border border-border p-4">
                            {formatObject(selectedLog.snapshot)}
                        </div>
                     </div>
                  )} */}

                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 md:p-4 border-t border-border bg-muted/30 flex justify-end shrink-0">
              <Button
                variant="outline"
                onClick={() => setSelectedLog(null)}
                className="w-full md:w-auto h-11 md:h-10 text-base md:text-sm"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;