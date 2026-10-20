import type { Sale, Order } from './types';

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(filename: string, rows: (string | number)[][]): void {
  const csv = rows
    .map((r) => r.map(csvEscape).join(','))
    .join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const methodLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export function exportSalesCSV(sales: Sale[], rangeLabel: string): void {
  const headers = [
    'Fecha',
    'Hora',
    'Total',
    'Método de pago',
    'Recibido',
    'Cambio',
    'Artículos',
    'Unidades',
    'Notas',
  ];

  const rows = sales.map((s) => {
    const d = new Date(s.created_at);
    const items = s.sale_items ?? [];
    const itemsDesc = items
      .map((i) => `${i.quantity}x ${i.product_name}`)
      .join('; ');
    const units = items.reduce((a, i) => a + i.quantity, 0);
    return [
      d.toLocaleDateString('es-CO'),
      d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      s.total,
      methodLabels[s.payment_method] ?? s.payment_method,
      s.amount_received ?? '',
      s.change ?? '',
      itemsDesc,
      units,
      s.notes ?? '',
    ];
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`ventas_${rangeLabel}_${dateStr}.csv`, [headers, ...rows]);
}

function htmlEscape(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportSalesExcel(sales: Sale[], rangeLabel: string): void {
  const rows = sales.map((s) => {
    const date = new Date(s.created_at);
    const items = s.sale_items ?? [];
    return [
      date.toLocaleDateString('es-CO'),
      date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      s.total,
      methodLabels[s.payment_method] ?? s.payment_method,
      s.amount_received ?? '',
      s.change ?? '',
      items.map((item) => `${item.quantity}x ${item.product_name}`).join('; '),
      items.reduce((sum, item) => sum + item.quantity, 0),
      s.notes ?? '',
    ];
  });
  const headers = ['Fecha', 'Hora', 'Total', 'Método de pago', 'Recibido', 'Cambio', 'Artículos', 'Unidades', 'Notas'];
  const table = [headers, ...rows]
    .map((row, index) => `<tr>${row.map((cell) => `<${index === 0 ? 'th' : 'td'}>${htmlEscape(cell)}</${index === 0 ? 'th' : 'td'}>`).join('')}</tr>`)
    .join('');
  const document = `<html><head><meta charset="UTF-8"><style>table{border-collapse:collapse;font-family:Arial}th,td{border:1px solid #d9c9bc;padding:7px}th{background:#f8d8d5;font-weight:bold}</style></head><body><table>${table}</table></body></html>`;
  const blob = new Blob([document], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `ventas_${rangeLabel}_${new Date().toISOString().slice(0, 10)}.xls`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportOrdersCSV(orders: Order[]): void {
  const statusLabels: Record<string, string> = {
    pendiente: 'Pendiente',
    en_preparacion: 'En preparación',
    listo: 'Listo',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };

  const headers = [
    'Número',
    'Fecha',
    'Cliente',
    'Fecha de entrega',
    'Total',
    'Abono',
    'Saldo',
    'Estado',
    'Liquidado',
    'Resumen',
    'Notas',
  ];

  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toLocaleDateString('es-CO'),
    o.customer?.name ?? 'Sin cliente',
    o.delivery_date ? new Date(o.delivery_date).toLocaleDateString('es-CO') : '',
    o.total,
    o.deposit,
    o.total - o.deposit,
    statusLabels[o.status] ?? o.status,
    o.settled ? 'Sí' : 'No',
    o.items_summary ?? '',
    o.notes ?? '',
  ]);

  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(`pedidos_abonos_${dateStr}.csv`, [headers, ...rows]);
}
