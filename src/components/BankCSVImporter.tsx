// BankCSVImporter.tsx
// Componente para importar movimientos bancarios desde CSV/Excel

import { useState, useCallback } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useSupabaseFinances } from '@/hooks/useSupabaseFinances';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  duplicates: number;
  transactions: Transaction[];
}

export const BankCSVImporter = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { addExpense } = useSupabaseFinances();

  // Detectar formato del banco basado en headers
  const detectBankFormat = (headers: string[]) => {
    const headersLower = headers.map(h => String(h || '').toLowerCase().trim());
    
    // BBVA
    if (headersLower.some(h => h.includes('fecha operación') || h === 'fecha operacion') && 
        headersLower.some(h => h.includes('importe'))) {
      return 'BBVA';
    }
    
    // Santander (puede tener "FECHA OPERACIÓN", "CONCEPTO", "IMPORTE EUR")
    if (headersLower.some(h => h.includes('fecha operación') || h.includes('fecha operacion')) && 
        headersLower.some(h => h.includes('concepto')) &&
        headersLower.some(h => h.includes('importe'))) {
      return 'SANTANDER';
    }
    
    // CaixaBank
    if (headersLower.some(h => h.includes('data')) && 
        headersLower.some(h => h.includes('import'))) {
      return 'CAIXABANK';
    }
    
    // ING
    if (headersLower.some(h => h.includes('fecha') || h === 'date') && 
        headersLower.some(h => h.includes('nombre / descripción') || h.includes('description'))) {
      return 'ING';
    }
    
    // Revolut
    if (headersLower.some(h => h === 'completed date') && 
        headersLower.some(h => h === 'description') &&
        headersLower.some(h => h === 'amount')) {
      return 'REVOLUT';
    }
    
    // N26
    if (headersLower.some(h => h === 'date') && 
        headersLower.some(h => h === 'payee') &&
        headersLower.some(h => h === 'amount (eur)')) {
      return 'N26';
    }
    
    return 'GENERIC';
  };

  // Parsear transacción según formato del banco
  const parseTransaction = (row: any, format: string): Transaction | null => {
    try {
      let date = '';
      let description = '';
      let amount = 0;

      switch (format) {
        case 'BBVA':
          date = row['Fecha operación'] || row['Fecha operacion'] || '';
          description = row['Concepto'] || '';
          amount = parseFloat(String(row['Importe'] || '0').replace(',', '.'));
          break;

        case 'SANTANDER':
          date = row['FECHA OPERACIÓN'] || row['Fecha Operación'] || row['FECHA OPERACION'] || row['Fecha'] || '';
          description = row['CONCEPTO'] || row['Concepto'] || row['Descripción'] || '';
          const importeStr = row['IMPORTE EUR'] || row['Importe EUR'] || row['IMPORTE'] || row['Importe'] || row['Cargo'] || row['Abono'] || '0';
          amount = parseFloat(String(importeStr).replace(',', '.').replace(' EUR', '').trim());
          break;

        case 'CAIXABANK':
          date = row['Data'] || '';
          description = row['Concepte'] || row['Concepto'] || '';
          amount = parseFloat(String(row['Import'] || '0').replace(',', '.'));
          break;

        case 'ING':
          date = row['Fecha'] || row['Date'] || '';
          description = row['Nombre / Descripción'] || row['Description'] || '';
          amount = parseFloat(String(row['Cantidad'] || row['Amount'] || '0').replace(',', '.'));
          break;

        case 'REVOLUT':
          date = row['Completed Date'] || '';
          description = row['Description'] || '';
          amount = parseFloat(String(row['Amount'] || '0'));
          break;

        case 'N26':
          date = row['Date'] || '';
          description = row['Payee'] || '';
          amount = parseFloat(String(row['Amount (EUR)'] || '0'));
          break;

        case 'GENERIC':
          // Intentar detectar columnas automáticamente
          const keys = Object.keys(row);
          const dateKey = keys.find(k => k.toLowerCase().includes('fecha') || k.toLowerCase().includes('date'));
          const descKey = keys.find(k => 
            k.toLowerCase().includes('concepto') || 
            k.toLowerCase().includes('descripcion') ||
            k.toLowerCase().includes('description') ||
            k.toLowerCase().includes('payee')
          );
          const amountKey = keys.find(k => 
            k.toLowerCase().includes('importe') || 
            k.toLowerCase().includes('amount') ||
            k.toLowerCase().includes('cantidad')
          );
          
          if (dateKey) date = row[dateKey];
          if (descKey) description = row[descKey];
          if (amountKey) amount = parseFloat(String(row[amountKey] || '0').replace(',', '.'));
          break;
      }

      // Validar que tengamos datos mínimos
      if (!date || !description || amount === 0) {
        return null;
      }

      // Normalizar fecha
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) return null;

      // Solo gastos (negativos) o hacerlos todos positivos
      const finalAmount = Math.abs(amount);

      return {
        date: normalizedDate,
        description: description.trim(),
        amount: finalAmount,
        category: categorizeTransaction(description)
      };
    } catch (err) {
      console.error('Error parsing transaction:', err);
      return null;
    }
  };

  // Normalizar fecha a formato YYYY-MM-DD
  const normalizeDate = (dateStr: string): string | null => {
    try {
      // Formatos comunes: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
      const formats = [
        /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/, // DD/MM/YYYY
        /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/, // YYYY-MM-DD
      ];

      for (const format of formats) {
        const match = dateStr.match(format);
        if (match) {
          if (dateStr.startsWith('20') || dateStr.startsWith('19')) {
            // YYYY-MM-DD
            return `${match[1]}-${match[2]}-${match[3]}`;
          } else {
            // DD/MM/YYYY
            return `${match[3]}-${match[2]}-${match[1]}`;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  // Categorizar transacción automáticamente
  const categorizeTransaction = (description: string): string => {
    const lower = description.toLowerCase();

    // Alimentación
    if (lower.match(/mercadona|carrefour|lidl|aldi|dia|supermercado|alcampo|eroski/)) {
      return 'alimentación';
    }

    // Restaurantes
    if (lower.match(/restaurante|burger|mcdonalds|kfc|pizz|cafeteria|bar |cafe /)) {
      return 'restaurantes';
    }

    // Transporte
    if (lower.match(/gasolina|repsol|cepsa|shell|renfe|uber|cabify|taxi|parkia|parking/)) {
      return 'transporte';
    }

    // Suscripciones
    if (lower.match(/netflix|spotify|amazon prime|disney|hbo|apple|google|youtube premium/)) {
      return 'suscripciones';
    }

    // Hogar
    if (lower.match(/ikea|leroy|bricomart|electricidad|gas|agua|alquiler|hipoteca/)) {
      return 'hogar';
    }

    // Salud
    if (lower.match(/farmacia|medico|hospital|seguro.*salud|dental/)) {
      return 'salud';
    }

    // Ocio
    if (lower.match(/cine|teatro|concierto|entradas|steam|playstation|nintendo/)) {
      return 'ocio';
    }

    // Ropa
    if (lower.match(/zara|h&m|mango|pull&bear|bershka|decathlon|nike|adidas/)) {
      return 'ropa';
    }

    return 'otros';
  };

  // Procesar archivo CSV
  const processCSV = async (file: File) => {
    return new Promise<Transaction[]>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error('Error al parsear CSV'));
            return;
          }

          const headers = Object.keys(results.data[0] || {});
          const format = detectBankFormat(headers);
          
          console.log('Formato detectado:', format);
          console.log('Headers:', headers);

          const transactions: Transaction[] = [];
          for (const row of results.data) {
            const transaction = parseTransaction(row, format);
            if (transaction) {
              transactions.push(transaction);
            }
          }

          resolve(transactions);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  // Procesar archivo Excel
  const processExcel = async (file: File): Promise<Transaction[]> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convertir a JSON sin headers para analizar
    const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
    
    if (rawData.length === 0) {
      throw new Error('El archivo Excel está vacío');
    }

    // Buscar la fila de encabezados (puede no estar en la primera fila)
    let headerRowIndex = -1;
    let headers: string[] = [];
    
    for (let i = 0; i < Math.min(20, rawData.length); i++) {
      const row = rawData[i];
      const potentialHeaders = row.map(cell => String(cell || '').toLowerCase());
      
      // Buscar indicadores de fila de encabezados
      if (potentialHeaders.some(h => 
        h.includes('fecha') || 
        h.includes('concepto') || 
        h.includes('importe') ||
        h.includes('date') ||
        h.includes('amount')
      )) {
        headerRowIndex = i;
        headers = row.map(cell => String(cell || ''));
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new Error('No se encontraron encabezados válidos en el archivo');
    }

    // Convertir las filas de datos (después de los headers) a objetos
    const dataRows = rawData.slice(headerRowIndex + 1);
    const jsonData = dataRows
      .filter(row => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
      .map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

    if (jsonData.length === 0) {
      throw new Error('No se encontraron datos válidos en el archivo');
    }

    const format = detectBankFormat(headers);
    
    console.log('Formato detectado:', format);
    console.log('Headers encontrados:', headers);
    console.log('Fila de headers:', headerRowIndex);
    console.log('Filas de datos:', jsonData.length);

    const transactions: Transaction[] = [];
    for (const row of jsonData) {
      const transaction = parseTransaction(row, format);
      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  };

  // Manejar subida de archivo
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      let transactions: Transaction[] = [];

      if (file.name.endsWith('.csv')) {
        transactions = await processCSV(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        transactions = await processExcel(file);
      } else {
        throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
      }

      if (transactions.length === 0) {
        throw new Error('No se encontraron transacciones válidas en el archivo');
      }

      // Guardar en Supabase
      let success = 0;
      let failed = 0;

      for (const transaction of transactions) {
        try {
          await addExpense(
            transaction.description,
            transaction.amount,
            false, // No recurrente
            'once' as any, // Frecuencia única
            null // Sin banco específico
          );
          success++;
        } catch (err) {
          console.error('Error saving transaction:', err);
          failed++;
        }
      }

      setResult({
        success,
        failed,
        duplicates: 0,
        transactions
      });

    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo');
    } finally {
      setImporting(false);
      // Limpiar input para permitir subir el mismo archivo de nuevo
      event.target.value = '';
    }
  }, [addExpense]);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      const event = { target: { files: [file], value: '' } } as any;
      handleFileUpload(event);
    }
  }, [handleFileUpload]);

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Importar movimientos bancarios
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Arrastra tu archivo CSV o Excel aquí, o haz click para seleccionar
        </p>

        <label className="inline-block">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={importing}
            className="hidden"
          />
          <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-flex items-center gap-2 transition-colors">
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Seleccionar archivo
              </>
            )}
          </span>
        </label>

        <p className="text-xs text-gray-500 mt-4">
          Formatos soportados: CSV, Excel (.xlsx, .xls)<br />
          Bancos: BBVA, Santander, CaixaBank, ING, Revolut, N26 y más
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Error al importar</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900 mb-1">¡Importación completada!</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>✅ {result.success} transacciones importadas correctamente</p>
                {result.failed > 0 && <p>❌ {result.failed} transacciones fallidas</p>}
              </div>
            </div>
          </div>

          {/* Preview de transacciones */}
          <div className="mt-4 bg-white rounded border border-green-200 max-h-60 overflow-y-auto">
            <div className="text-xs font-medium text-gray-700 p-2 border-b bg-gray-50">
              Vista previa (primeras 10 transacciones)
            </div>
            <div className="divide-y">
              {result.transactions.slice(0, 10).map((t, idx) => (
                <div key={idx} className="p-2 flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{t.description}</div>
                    <div className="text-gray-500">
                      {t.date} • {t.category}
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {t.amount.toFixed(2)}€
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};