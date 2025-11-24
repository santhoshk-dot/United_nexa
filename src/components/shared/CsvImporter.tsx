import { useState, useRef } from 'react';
import { Button } from './Button';
import { Upload, AlertCircle, X, CheckCircle, FileText, AlertTriangle, Download } from 'lucide-react';

interface CsvImporterProps<T> {
  onImport: (data: T[]) => void;
  existingData: T[];
  mapRow: (row: any) => T | null; 
  checkDuplicate: (newItem: T, existingItem: T) => boolean;
  label?: string;
}

interface FailedRecord {
  originalLine: string[]; // Keep original raw values
  reason: string;
}

export const CsvImporter = <T,>({ 
  onImport, 
  existingData, 
  mapRow, 
  checkDuplicate, 
  label = "Import CSV" 
}: CsvImporterProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
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

  // --- ROBUST CSV PARSING ---
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

    // 1. Parse Headers (Keep original for Export, Normalize for Mapping)
    const headerLine = lines[0];
    const rawHeaders = parseCSVLine(headerLine);
    setOriginalHeaders(rawHeaders); // Save for Error Log
    
    const normalizedHeaders = rawHeaders.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const rawObjects = lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj: any = {};
      normalizedHeaders.forEach((header, index) => {
        obj[header] = values[index] || ''; 
      });
      return { obj, values }; // Return object AND raw values
    });

    const uniqueNewData: T[] = [];
    const failures: FailedRecord[] = [];
    let dupes = 0;
    let invalid = 0;

    rawObjects.forEach(({ obj, values }) => {
      // 2. Map & Validate
      const item = mapRow(obj);

      if (!item) {
        invalid++;
        failures.push({ originalLine: values, reason: "Missing Required Fields or Invalid Format" });
        return;
      }

      // 3. Check Duplicates
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

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

  const handleConfirmImport = () => {
    onImport(previewData);
    handleClose();
  };

  // --- NEW: GENERATE & DOWNLOAD ERROR LOG ---
  const handleDownloadErrorLog = () => {
    if (failedRecords.length === 0) return;

    // Add "Error Reason" to headers
    const headers = [...originalHeaders, "Error Reason"];
    
    // Construct CSV content
    const csvContent = [
        headers.join(','),
        ...failedRecords.map(record => {
            // Escape quotes in values and join
            const row = record.originalLine.map(val => `"${val?.replace(/"/g, '""') || ''}"`);
            // Add the reason
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

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} size="sm">
        <Upload size={16} className="mr-2" />
        {label}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg border border-muted flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-muted">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Import Data
              </h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {!file ? (
                <div 
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={40} className="text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Click to upload CSV</p>
                  <p className="text-xs text-muted-foreground mt-1">Supported format: .csv</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md border border-muted">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full"><CheckCircle size={18} /></div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button onClick={handleReset} className="text-xs text-destructive hover:underline font-medium">Change File</button>
                  </div>

                  {error ? (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-start gap-2 border border-destructive/20">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                      <div className="p-3 border-b border-border bg-muted/20">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis Report</h4>
                      </div>
                      <div className="divide-y divide-border">
                        
                        {/* Ready to Import */}
                        <div className="p-4 flex justify-between items-center bg-green-50/50 dark:bg-green-900/10">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm font-medium text-foreground">Ready to Import</span></div>
                          <span className="text-lg font-bold text-green-600">{previewData.length}</span>
                        </div>

                        {/* Duplicates */}
                        <div className="p-4 flex justify-between items-center bg-orange-50/50 dark:bg-orange-900/10">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-sm font-medium text-foreground">Duplicates (Skipped)</span></div>
                          <span className="text-lg font-bold text-orange-600">{duplicateCount}</span>
                        </div>

                        {/* Invalid */}
                        <div className="p-4 flex justify-between items-center bg-red-50/50 dark:bg-red-900/10">
                          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-sm font-medium text-foreground">Invalid / Missing Fields</span></div>
                          <span className="text-lg font-bold text-red-600">{invalidCount}</span>
                        </div>

                      </div>
                    </div>
                  )}
                  
                  {/* Download Error Log Button - Only appears if there are errors */}
                  {failedRecords.length > 0 && !error && (
                    <div className="pt-2">
                        <Button 
                            onClick={handleDownloadErrorLog} 
                            variant="outline" 
                            className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            <Download size={16} className="mr-2" />
                            Download Error Log ({failedRecords.length} Records)
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center mt-1">
                            Contains rejected records with reasons. Fix and re-upload.
                        </p>
                    </div>
                  )}

                  {previewData.length === 0 && failedRecords.length === 0 && !error && (
                    <div className="p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md text-sm flex items-center gap-2">
                        <AlertTriangle size={16} />
                        <span>No data found.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-muted flex justify-end gap-3 bg-muted/10">
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirmImport} disabled={!file || !!error || previewData.length === 0}>
                Import {previewData.length} Records
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
