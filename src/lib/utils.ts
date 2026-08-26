export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatVolume(m3: number): string {
  return `${formatNumber(m3, 3)} m³`;
}

export function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function generatePONumber(existingCount: number = 0): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const seq = String(existingCount + 1).padStart(3, '0');
  return `PO-${year}${month}${day}-${seq}`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(item => {
          const str = String(item ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
}

export function parseSKUCSV(csvText: string): CSVParseResult<{
  code: string;
  name: string;
  category: string;
  supplier: string;
  price_per_unit: number;
  qty_per_box: number;
  m3_per_box: number;
}> {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  const errors: string[] = [];
  const data: {
    code: string;
    name: string;
    category: string;
    supplier: string;
    price_per_unit: number;
    qty_per_box: number;
    m3_per_box: number;
  }[] = [];

  if (lines.length <= 1) {
    errors.push('File CSV kosong atau hanya berisi baris header.');
    return { data, errors };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const codeIdx = header.findIndex(h => h === 'code' || h === 'kode' || h === 'sku');
  const nameIdx = header.findIndex(h => h === 'name' || h === 'nama' || h === 'nama barang');
  const catIdx = header.findIndex(h => h === 'category' || h === 'kategori');
  const supIdx = header.findIndex(h => h === 'supplier' || h === 'pemasok');
  const priceIdx = header.findIndex(h => h === 'price' || h === 'price_per_unit' || h === 'harga');
  const qtyBoxIdx = header.findIndex(h => h === 'qty_per_box' || h === 'qty per box' || h === 'pcs_per_box');
  const m3BoxIdx = header.findIndex(h => h === 'm3_per_box' || h === 'm3 per box' || h === 'volume_per_box');

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(item => item.trim().replace(/^"(.*)"$/, '$1'));
    if (row.length === 1 && row[0] === '') continue;

    const code = codeIdx >= 0 ? row[codeIdx] : row[0];
    const name = nameIdx >= 0 ? row[nameIdx] : row[1];
    const category = catIdx >= 0 ? row[catIdx] : row[2] || 'Umum';
    const supplier = supIdx >= 0 ? row[supIdx] : row[3] || 'Supplier Utama';
    const price = priceIdx >= 0 ? parseFloat(row[priceIdx]) : parseFloat(row[4] || '0');
    const qtyBox = qtyBoxIdx >= 0 ? parseInt(row[qtyBoxIdx], 10) : parseInt(row[5] || '1', 10);
    const m3Box = m3BoxIdx >= 0 ? parseFloat(row[m3BoxIdx]) : parseFloat(row[6] || '0.01');

    if (!code || !name) {
      errors.push(`Baris ${i + 1}: Kode SKU dan Nama Barang wajib diisi.`);
      continue;
    }

    data.push({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      supplier: supplier.trim(),
      price_per_unit: isNaN(price) || price < 0 ? 0 : price,
      qty_per_box: isNaN(qtyBox) || qtyBox <= 0 ? 1 : qtyBox,
      m3_per_box: isNaN(m3Box) || m3Box <= 0 ? 0.01 : m3Box,
    });
  }

  return { data, errors };
}
