/**
 * Serviço de Exportação
 * Exporta dados para Excel (ExcelJS) e PDF (jsPDF)
 */

import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exporta dados para Excel usando ExcelJS
 */
export async function exportToExcel(
    data: any[],
    filename: string,
    sheetName: string = 'Dados'
): Promise<void> {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        if (data.length === 0) {
            throw new Error('Nenhum dado para exportar');
        }

        // Obter cabeçalhos das chaves do primeiro objeto
        const headers = Object.keys(data[0]);

        // Adicionar cabeçalhos
        worksheet.addRow(headers);

        // Estilizar cabeçalhos
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD99B61' } // Cor IMAC
        };

        // Adicionar dados
        data.forEach(item => {
            const row = headers.map(header => item[header]);
            worksheet.addRow(row);
        });

        // Auto-ajustar largura das colunas
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell?.({ includeEmpty: true }, cell => {
                const cellLength = cell.value ? cell.value.toString().length : 10;
                if (cellLength > maxLength) {
                    maxLength = cellLength;
                }
            });
            column.width = Math.min(maxLength + 2, 50);
        });

        // Gerar buffer e fazer download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        downloadBlob(blob, `${filename}.xlsx`);
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        throw error;
    }
}

/**
 * Exporta dados para PDF usando jsPDF
 */
export function exportToPDF(
    data: any[],
    filename: string,
    title: string = 'Relatório'
): void {
    try {
        if (data.length === 0) {
            throw new Error('Nenhum dado para exportar');
        }

        const doc = new jsPDF();

        // Adicionar título
        doc.setFontSize(16);
        doc.text(title, 14, 15);

        // Adicionar data de geração
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

        // Obter cabeçalhos e dados
        const headers = Object.keys(data[0]);
        const rows = data.map(item => headers.map(header => item[header]));

        // Adicionar tabela
        autoTable(doc, {
            head: [headers],
            body: rows,
            startY: 28,
            theme: 'grid',
            headStyles: {
                fillColor: [217, 155, 97], // Cor IMAC
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 'auto' }
            }
        });

        // Salvar PDF
        doc.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Erro ao exportar para PDF:', error);
        throw error;
    }
}

/**
 * Exporta tabela HTML para Excel
 */
export async function exportTableToExcel(
    tableId: string,
    filename: string,
    sheetName: string = 'Dados'
): Promise<void> {
    try {
        const table = document.getElementById(tableId);

        if (!table) {
            throw new Error(`Tabela com ID "${tableId}" não encontrada`);
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        // Extrair dados da tabela HTML
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('th, td');
            const rowData: any[] = [];

            cells.forEach(cell => {
                rowData.push(cell.textContent?.trim() || '');
            });

            const excelRow = worksheet.addRow(rowData);

            // Estilizar primeira linha (cabeçalho)
            if (rowIndex === 0) {
                excelRow.font = { bold: true };
                excelRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD99B61' }
                };
            }
        });

        // Auto-ajustar colunas
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell?.({ includeEmpty: true }, cell => {
                const cellLength = cell.value ? cell.value.toString().length : 10;
                if (cellLength > maxLength) {
                    maxLength = cellLength;
                }
            });
            column.width = Math.min(maxLength + 2, 50);
        });

        // Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        downloadBlob(blob, `${filename}.xlsx`);
    } catch (error) {
        console.error('Erro ao exportar tabela para Excel:', error);
        throw error;
    }
}

/**
 * Helper para fazer download de blob
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Formata dados para exportação (remove campos internos)
 */
export function formatDataForExport<T extends Record<string, any>>(
    data: T[],
    excludeFields: string[] = ['id']
): any[] {
    return data.map(item => {
        const formatted: Record<string, any> = {};

        Object.entries(item).forEach(([key, value]) => {
            if (!excludeFields.includes(key)) {
                formatted[key] = value;
            }
        });

        return formatted;
    });
}

/**
 * Exporta múltiplas planilhas em um único arquivo Excel
 */
export async function exportMultipleSheets(
    sheets: Array<{ name: string; data: any[] }>,
    filename: string
): Promise<void> {
    try {
        const workbook = new ExcelJS.Workbook();

        for (const sheet of sheets) {
            if (sheet.data.length === 0) continue;

            const worksheet = workbook.addWorksheet(sheet.name);
            const headers = Object.keys(sheet.data[0]);

            // Adicionar cabeçalhos
            worksheet.addRow(headers);
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD99B61' }
            };

            // Adicionar dados
            sheet.data.forEach(item => {
                const row = headers.map(header => item[header]);
                worksheet.addRow(row);
            });

            // Auto-ajustar colunas
            worksheet.columns.forEach(column => {
                let maxLength = 0;
                column.eachCell?.({ includeEmpty: true }, cell => {
                    const cellLength = cell.value ? cell.value.toString().length : 10;
                    if (cellLength > maxLength) {
                        maxLength = cellLength;
                    }
                });
                column.width = Math.min(maxLength + 2, 50);
            });
        }

        // Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        downloadBlob(blob, `${filename}.xlsx`);
    } catch (error) {
        console.error('Erro ao exportar múltiplas planilhas:', error);
        throw error;
    }
}
