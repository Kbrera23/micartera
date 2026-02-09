// BankCSVImporter.tsx - VERSIÓN CORREGIDA PARA SANTANDER
// Maneja archivos XLS con columnas: FECHA OPERACIÓN, FECHA VALOR, CONCEPTO, IMPORTE EUR, SALDO

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
    const headersStr = headers.map(h => String(h || '').toUpperCase().trim()).join('|');
    
    console.log('Detectando formato con headers:', headersStr);
    
    // Santander tiene estas columnas exactas
    if (headersStr.includes('FECHA OPERACIÓN') || headersStr.includes('FECHA OPERACION')) {
      console.log('→ Formato SANTANDER detectado');
      return 'SANTANDER';
    }
    
    // BBVA
    if (headersStr.includes('FECHA') && headersStr.includes('IMPORTE') && !headersStr.includes('CONCEPTO')) {
      console.log('→ Formato BBVA detectado');
      return 'BBVA';
    }
    
    // CaixaBank
    if (headersStr.includes('DATA') && headersStr.includes('IMPORT')) {
      console.log('→ Formato CAIXABANK detectado');
      return 'CAIXABANK';
    }
    
    // ING
    if (headersStr.includes('NOMBRE / DESCRIPCIÓN') || headersStr.includes('DESCRIPTION')) {
      console.log('→ Formato ING detectado');
      return 'ING';
    }
    
    // Revolut
    if (headersStr.includes('COMPLETED DATE')) {
      console.log('→ Formato REVOLUT detectado');
      return 'REVOLUT';
    }
    
    // N26
    if (headersStr.includes('PAYEE') && headersStr.includes('AMOUNT (EUR)')) {
      console.log('→ Formato N26 detectado');
      return 'N26';
    }
    
    console.log('→ Formato GENERIC (intentará auto-detectar)');
    return 'GENERIC';
  };

  // Parsear transacción según formato del banco
  const parseTransaction = (row: any, format: string, rowIndex: number): Transaction | null => {
    try {
      let date = '';
      let description = '';
      let amount = 0;

      console.log(`\n--- Parseando fila ${rowIndex} (formato: ${format}) ---`);
      console.log('Datos de la fila:', row);

      switch (format) {
        case 'SANTANDER':
          // Santander tiene: FECHA OPERACIÓN, FECHA VALOR, CONCEPTO, IMPORTE EUR, SALDO
          date = row['FECHA OPERACIÓN'] || row['FECHA OPERACION'] || row['F. OPERACIÓN'] || '';
          description = row['CONCEPTO'] || '';
          const santanderImporte = row['IMPORTE EUR'] || row['IMPORTE'] || '0';
          amount = parseFloat(String(santanderImporte).replace('.', '').replace(',', '.').replace(' EUR', '').replace('€', '').trim());
          console.log('Santander extraído:', { date, description, amount });
          break;

        case 'BBVA':
          date = row['Fecha operación'] || row['Fecha operacion'] || row['Fecha'] || '';
          description = row['Concepto'] || '';
          amount = parseFloat(String(row['Importe'] || '0').replace(',', '.'));
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
          const keys = Object.keys(row);
          console.log('Keys disponibles:', keys);
          
          // Buscar fecha
          const dateKey = keys.find(k => {
            const lower = String(k).toLowerCase();
            return lower.includes('fecha') || lower.includes('date') || lower === 'f.';
          }) || keys[0]; // Primera columna si no encuentra
          
          // Buscar descripción/concepto
          const descKey = keys.find(k => {
            const lower = String(k).toLowerCase();
            return lower.includes('concepto') || 
                   lower.includes('descripcion') ||
                   lower.includes('description') ||
                   lower.includes('payee') ||
                   lower.includes('detalle');
          }) || keys[1]; // Segunda columna si no encuentra
          
          // Buscar importe
          const amountKey = keys.find(k => {
            const lower = String(k).toLowerCase();
            return lower.includes('importe') || 
                   lower.includes('amount') ||
                   lower.includes('cantidad') ||
                   lower.includes('monto');
          }) || keys[keys.length - 2]; // Penúltima columna (antes del saldo) si no encuentra
          
          console.log('Columnas auto-detectadas:', { dateKey, descKey, amountKey });
          
          if (dateKey) date = row[dateKey];
          if (descKey) description = row[descKey];
          if (amountKey) {
            const amountStr = String(row[amountKey] || '0')
              .replace('.', '')  // Quitar puntos de miles
              .replace(',', '.')  // Coma decimal a punto
              .replace(' EUR', '')
              .replace('€', '')
              .trim();
            amount = parseFloat(amountStr);
          }
          
          console.log('Valores auto-detectados:', { date, description, amount });
          break;
      }

      // Validar que tengamos datos mínimos
      if (!date || !description || isNaN(amount) || amount === 0) {
        console.log('❌ Fila inválida (falta fecha, descripción o importe)');
        return null;
      }

      // Normalizar fecha
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        console.log('❌ Fecha inválida:', date);
        return null;
      }

      // Solo gastos (convertir todo a positivo)
      const finalAmount = Math.abs(amount);

      console.log('✅ Transacción válida:', { normalizedDate, description, finalAmount });

      return {
        date: normalizedDate,
        description: description.trim(),
        amount: finalAmount,
        category: categorizeTransaction(description)
      };
    } catch (err) {
      console.error('❌ Error parseando transacción:', err);
      return null;
    }
  };

  // Normalizar fecha a formato YYYY-MM-DD
  const normalizeDate = (dateStr: any): string | null => {
    try {
      // Si es un número de Excel (serial date)
      if (typeof dateStr === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      }

      // Si es string
      const str = String(dateStr);
      
      // Formatos comunes: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD.MM.YYYY
      const formats = [
        /(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/, // DD/MM/YYYY
        /(\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2})/, // YYYY-MM-DD
      ];

      for (const format of formats) {
        const match = str.match(format);
        if (match) {
          if (str.startsWith('20') || str.startsWith('19')) {
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
    const desc = description.toLowerCase();
    
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('amazon prime')) return 'Subscripciones';
    if (desc.includes('mercadona') || desc.includes('carrefour') || desc.includes('lidl') || desc.includes('supermercado')) return 'Alimentación';
    if (desc.includes('restaurante') || desc.includes('cafe') || desc.includes('bar')) return 'Restaurantes';
    if (desc.includes('gasolina') || desc.includes('repsol') || desc.includes('cepsa')) return 'Transporte';
    if (desc.includes('farmacia')) return 'Salud';
    if (desc.includes('zara') || desc.includes('h&m') || desc.includes('mango')) return 'Ropa';
    if (desc.includes('amazon') || desc.includes('fnac')) return 'Compras';
    if (desc.includes('alquiler') || desc.includes('rent')) return 'Vivienda';
    
    return 'Otros';
  };

  // Procesar CSV
  const processCSV = (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            console.log('\n========== PROCESANDO CSV ==========');
            console.log('Headers detectados:', results.meta.fields);
            console.log('Total de filas:', results.data.length);

            const format = detectBankFormat(results.meta.fields || []);
            const transactions: Transaction[] = [];

            for (let i = 0; i < results.data.length; i++) {
              const transaction = parseTransaction(results.data[i], format, i);
              if (transaction) {
                transactions.push(transaction);
              }
            }

            console.log('\n========== RESULTADO ==========');
            console.log('Transacciones válidas encontradas:', transactions.length);
            resolve(transactions);
          } catch (error: any) {
            reject(new Error('Error procesando CSV: ' + error.message));
          }
        },
        error: (error) => {
          reject(new Error('Error leyendo CSV: ' + error.message));
        }
      });
    });
  };

  // Procesar Excel
  const processExcel = (file: File): Promise<Transaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          console.log('\n========== PROCESANDO EXCEL ==========');
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          // Convertir a array de arrays (raw data)
          const rawData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1,
            defval: null,
            raw: false  // Importante: convertir todo a strings
          });

          console.log('Total de filas en el archivo:', rawData.length);
          console.log('Primeras 10 filas:', rawData.slice(0, 10));

          // Buscar la fila de headers (debe contener FECHA, CONCEPTO, IMPORTE, etc.)
          let headerRowIndex = -1;
          let headers: string[] = [];

          for (let i = 0; i < Math.min(15, rawData.length); i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const potentialHeaders = row.map(cell => String(cell || '').toUpperCase().trim());
            
            // Verificar si esta fila contiene headers típicos
            if (potentialHeaders.some(h => h.includes('FECHA')) && 
                (potentialHeaders.some(h => h.includes('CONCEPTO')) || potentialHeaders.some(h => h.includes('IMPORTE')))) {
              headerRowIndex = i;
              headers = row.map(cell => String(cell || ''));
              console.log(`✅ HEADERS ENCONTRADOS en fila ${i}:`, headers);
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error('No se encontraron encabezados válidos. Asegúrate de que el archivo tiene columnas como FECHA, CONCEPTO e IMPORTE.');
          }

          // Convertir las filas de datos a objetos
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

          console.log('\n========== PROCESANDO TRANSACCIONES ==========');
          console.log('Total de filas de datos:', jsonData.length);

          const format = detectBankFormat(headers);

          const transactions: Transaction[] = [];
          for (let i = 0; i < jsonData.length; i++) {
            const transaction = parseTransaction(jsonData[i], format, i);
            if (transaction) {
              transactions.push(transaction);
            }
          }

          console.log('\n========== RESULTADO ==========');
          console.log('Transacciones válidas encontradas:', transactions.length);

          resolve(transactions);
        } catch (error: any) {
          reject(new Error('Error procesando Excel: ' + error.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo'));
      };

      reader.readAsArrayBuffer(file);
    });
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
          // ✅ CORRECCIÓN: Usar 'monthly' en lugar de 'once' as any
          await addExpense(
            transaction.description,
            transaction.amount,
            false,  // isRecurring = false (gasto único)
            'monthly',  // Valor válido del enum ExpenseFrequency
            null
          );
          success++;
        } catch (err) {
          console.error('Error guardando transacción:', err);
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
