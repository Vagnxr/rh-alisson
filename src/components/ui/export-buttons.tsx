import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useTenantStore } from '@/stores/tenantStore';

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
  className?: string;
}

/**
 * Componente reutilizável para exportação de dados em Excel e PDF
 * Inclui logo, data/hora e numeração de páginas
 */
export function ExportButtons({
  data,
  columns,
  filename,
  title,
  className,
}: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState<'excel' | 'pdf' | null>(null);
  const tenant = useTenantStore((s) => s.currentTenant);

  const formatDate = () => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToExcel = async () => {
    setIsExporting('excel');

    try {
      // Prepara os dados
      const headers = columns.map((col) => col.label.toUpperCase());
      const rows = data.map((item) =>
        columns.map((col) => {
          const value = item[col.key];
          const formatted = col.format ? col.format(value) : String(value ?? '');
          return formatted.toUpperCase();
        })
      );

      // Cria conteúdo CSV (compatível com Excel)
      const csvContent = [
        // Cabeçalho com logo/nome centralizado
        [''],
        ['MSYSTEM - PLATAFORMA FINANCEIRA'],
        [''],
        // Informações da empresa
        [`EMPRESA: ${(tenant?.nomeFantasia || tenant?.name || 'EMPRESA').toUpperCase()}`],
        [`RELATORIO: ${(title || filename).toUpperCase()}`],
        [`DATA/HORA: ${formatDate()}`],
        [`TOTAL DE REGISTROS: ${data.length}`],
        [''],
        // Cabeçalhos das colunas
        headers,
        // Dados
        ...rows,
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(';'))
        .join('\n');

      // Adiciona BOM para suporte a caracteres especiais no Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], {
        type: 'text/csv;charset=utf-8',
      });

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const exportToPDF = async () => {
    setIsExporting('pdf');

    try {
      // Calcula totais de páginas (estimativa)
      const itemsPerPage = 25;
      const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

      // Logo: do tenant se houver, senao SVG padrao MSystem
      const logoHTML = tenant?.logo
        ? `<img src="${tenant.logo}" alt="Logo" style="max-height: 50px; max-width: 180px; object-fit: contain;" />`
        : `
        <svg width="180" height="50" viewBox="0 0 180 50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#10b981"/>
              <stop offset="100%" style="stop-color:#059669"/>
            </linearGradient>
          </defs>
          <rect x="2" y="10" width="30" height="30" rx="6" fill="url(#logoGrad)"/>
          <text x="10" y="32" fill="white" font-family="Arial" font-size="18" font-weight="bold">$</text>
          <text x="40" y="33" fill="#1e293b" font-family="Arial" font-size="22" font-weight="bold">MSystem</text>
        </svg>
      `;

      // Cria conteúdo HTML para impressão/PDF
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title || filename}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 11px;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .logo-container {
              text-align: center;
              padding: 15px 0;
              border-bottom: 3px solid #10b981;
              margin-bottom: 15px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header-left {
              text-align: left;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
              color: #1e293b;
            }
            .report-title {
              font-size: 18px;
              font-weight: bold;
              color: #10b981;
              margin-top: 4px;
            }
            .header-right {
              text-align: right;
              font-size: 10px;
              color: #64748b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: #10b981;
              color: white;
              font-weight: 600;
              text-align: left;
              padding: 10px 8px;
              font-size: 10px;
              text-transform: uppercase;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
              text-transform: uppercase;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              padding: 10px;
              border-top: 1px solid #e2e8f0;
              background: white;
            }
            .total-row {
              font-weight: bold;
              background: #f1f5f9 !important;
            }
            @media print {
              .no-print { display: none; }
              .footer { position: fixed; }
            }
          </style>
        </head>
        <body>
          <div class="logo-container">
            ${logoHTML}
          </div>
          
          <div class="header">
            <div class="header-left">
              <div class="company-name">${tenant?.nomeFantasia || tenant?.name || 'Empresa'}</div>
              <div class="report-title">${title || filename}</div>
            </div>
            <div class="header-right">
              <div><strong>Data:</strong> ${formatDate()}</div>
              <div><strong>Total de registros:</strong> ${data.length}</div>
              <div>Página 1 de ${totalPages}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                ${columns.map((col) => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (item) => `
                <tr>
                  ${columns
                    .map((col) => {
                      const value = item[col.key];
                      const formatted = col.format ? col.format(value) : String(value ?? '');
                      return `<td>${formatted}</td>`;
                    })
                    .join('')}
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <strong>MSystem</strong> - Plataforma Financeira | ${tenant?.nomeFantasia || tenant?.name || 'Empresa'} | Gerado em ${formatDate()}
          </div>
        </body>
        </html>
      `;

      // Abre janela para impressão/salvar como PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Aguarda carregar e imprime
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={exportToExcel}
        disabled={isExporting !== null || data.length === 0}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium',
          'text-slate-700 transition-colors',
          'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Exportar para Excel (CSV)"
      >
        {isExporting === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">Excel</span>
      </button>
      
      <button
        type="button"
        onClick={exportToPDF}
        disabled={isExporting !== null || data.length === 0}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium',
          'text-slate-700 transition-colors',
          'hover:border-red-300 hover:bg-red-50 hover:text-red-700',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Exportar para PDF"
      >
        {isExporting === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );
}

/**
 * Hook helper para criar colunas de exportação
 */
export function useExportColumns<T extends object>(
  columns: Array<{
    key: keyof T & string;
    label: string;
    format?: (value: T[keyof T]) => string;
  }>
): ExportColumn[] {
  return columns.map((col) => ({
    key: col.key as string,
    label: col.label,
    format: col.format as ((value: unknown) => string) | undefined,
  }));
}
