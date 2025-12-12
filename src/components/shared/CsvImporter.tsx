import { useState, useRef } from 'react';
import { Button } from './Button';
import { 
  Upload, 
  AlertCircle, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Download,
  FileUp,
  FileCheck,
  XCircle,
  Copy,
  Sparkles
} from 'lucide-react';

interface CsvImporterProps<T> {
  onImport: (data: T[]) => void;
  existingData: T[];
  mapRow: (row: any) => T | null; 
  checkDuplicate: (newItem: T, existingItem: T) => boolean;
  label?: string;
  className?: string;
  // 泙 NEW: Added size prop
  size?: 'default' | 'sm' | 'lg';
}

interface FailedRecord {
  originalLine: string[]; 
  reason: string;
}

export const CsvImporter = <T,>({ 
  onImport, 
  existingData, 
  mapRow, 
  checkDuplicate, 
  label = "Import CSV",
  className,
  // 泙 NEW: Default to 'default' (h-10)
  size = 'default'
}: CsvImporterProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [previewData, setPreviewData] = useState<T[]>([]);
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const [originalHeaders, setOriginalHeaders] = useState<string[]>([]);
  
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setFailedRecords([]);
    setOriginalHeaders([]);
    setDuplicateCount(0);
    setInvalidCount(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    setIsOpen(false);
    handleReset();
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let start = 0;
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        let field = text.substring(start, i).trim();
        if (field.startsWith('"') && field.endsWith('"')) {
          field = field.slice(1, -1).replace(/""/g, '"');
        }
        result.push(field);
        start = i + 1;
      }
    }
    let lastField = text.substring(start).trim();
    if (lastField.startsWith('"') && lastField.endsWith('"')) {
      lastField = lastField.slice(1, -1).replace(/""/g, '"');
    }
    result.push(lastField);
    return result;
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
      setError("File appears to be empty or missing headers.");
      return;
    }

    const headerLine = lines[0];
    const rawHeaders = parseCSVLine(headerLine);
    setOriginalHeaders(rawHeaders); 
    
    const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const rawObjects = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj: any = {};
      normalizedHeaders.forEach((header, index) => {
        obj[header] = values[index] || ''; 
      });
      return { obj, values }; 
    });

    const uniqueNewData: T[] = [];
    const failures: FailedRecord[] = [];
    let dupes = 0;
    let invalid = 0;

    rawObjects.forEach(({ obj, values }) => {
      const item = mapRow(obj);

      if (!item) {
        invalid++;
        failures.push({ originalLine: values, reason: "Missing Required Fields or Invalid Format" });
        return;
      }

      const existsInDb = existingData.some(existing => checkDuplicate(item, existing));
      const existsInBatch = uniqueNewData.some(batchItem => checkDuplicate(item, batchItem));

      if (existsInDb || existsInBatch) {
        dupes++;
        failures.push({ originalLine: values, reason: "Duplicate Record" });
      } else {
        uniqueNewData.push(item);
      }
    });

    setPreviewData(uniqueNewData);
    setFailedRecords(failures);
    setDuplicateCount(dupes);
    setInvalidCount(invalid);
    setError(null);
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid .csv file.");
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleConfirmImport = () => {
    onImport(previewData);
    handleClose();
  };

  const handleDownloadErrorLog = () => {
    if (failedRecords.length === 0) return;

    const headers = [...originalHeaders, "Error Reason"];
    
    const csvContent = [
        headers.join(','),
        ...failedRecords.map(record => {
            const row = record.originalLine.map(val => `"${val?.replace(/"/g, '""') || ''}"`);
            row.push(`"${record.reason}"`);
            return row.join(',');
        })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `import_errors_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalRecords = previewData.length + duplicateCount + invalidCount;

  return (
    <>
      {/* 泙 NEW: Pass the size prop here */}
      <Button variant="outline" onClick={() => setIsOpen(true)} size={size} className={className}>
        <Upload size={16} className="mr-1.5 sm:mr-2" />
        <span className="hidden xs:inline">{label}</span>
        <span className="xs:hidden">Import</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="bg-card rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg border border-border flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Import Data</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Upload a CSV file to import records</p>
                </div>
              </div>
              <button 
                onClick={handleClose} 
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {!file ? (
                /* Upload Area */
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-6 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    isDragging ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Upload className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                      isDragging ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-foreground mb-1">
                    {isDragging ? 'Drop your file here' : 'Click or drag to upload'}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Supports CSV files only
                  </p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".csv" 
                    className="hidden" 
                  />
                </div>
              ) : (
                /* File Selected - Analysis View */
                <div className="space-y-4 sm:space-y-5">
                  {/* File Info Card */}
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 border border-border">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB • {totalRecords} records found
                      </p>
                    </div>
                    <button 
                      onClick={handleReset} 
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Error State */}
                  {error && (
                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Import Error</p>
                        <p className="text-xs sm:text-sm text-destructive/80 mt-0.5">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Analysis Report */}
                  {!error && (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground">Analysis Report</h4>
                        </div>
                      </div>
                      
                      <div className="divide-y divide-border">
                        {/* Ready to Import */}
                        <div className="flex items-center justify-between p-3 sm:p-4">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-foreground">Ready to Import</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Valid unique records</p>
                            </div>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-emerald-600">{previewData.length}</span>
                        </div>

                        {/* Duplicates */}
                        <div className="flex items-center justify-between p-3 sm:p-4">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-foreground">Duplicates</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Will be skipped</p>
                            </div>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-amber-600">{duplicateCount}</span>
                        </div>

                        {/* Invalid */}
                        <div className="flex items-center justify-between p-3 sm:p-4">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-foreground">Invalid Records</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Missing or invalid fields</p>
                            </div>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-red-600">{invalidCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Download Error Log */}
                  {failedRecords.length > 0 && !error && (
                    <button 
                      onClick={handleDownloadErrorLog}
                      className="w-full flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-xs sm:text-sm font-medium">
                        Download Error Log ({failedRecords.length} records)
                      </span>
                    </button>
                  )}

                  {/* No Data Warning */}
                  {previewData.length === 0 && failedRecords.length === 0 && !error && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                        No valid data found in the file.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-border bg-muted/20">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  className="w-full sm:w-auto h-10 sm:h-11"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleConfirmImport} 
                  disabled={!file || !!error || previewData.length === 0}
                  className="w-full sm:w-auto h-10 sm:h-11"
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Import {previewData.length} Records
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};