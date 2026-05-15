'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnSizingState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

import api from '../../../utils/api';
import { ReceiptDetail, ReceiptDetailItem } from '../../../types/inventory';

const toNumber = (value: string | number) => Number(value || 0);
type TableColumnMeta = { align?: 'left' | 'right'; className?: string };

const fetchReceipt = async (id: string): Promise<ReceiptDetail> => {
  const { data } = await api.get(`/receipts/${id}`);
  return data;
};

export default function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const { data: receipt, error, isLoading } = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => fetchReceipt(id),
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    index: 64,
    product_name: 280,
    product_code: 140,
    unit: 96,
    document_quantity: 120,
    actual_quantity: 120,
    unit_price: 140,
    total_amount: 180,
  });

  const details = receipt?.details ?? [];

  const columns = useMemo<ColumnDef<ReceiptDetailItem>[]>(() => [
    {
      id: 'index',
      header: 'STT',
      size: 64,
      enableSorting: false,
      meta: { className: 'w-16' },
      cell: ({ row }) => <span className="text-slate-500">{row.index + 1}</span>,
    },
    {
      accessorKey: 'product_name',
      header: 'Vật Tư / Hàng Hóa',
      size: 280,
      sortingFn: (rowA, rowB, columnId) => {
        const first = rowA.getValue<string>(columnId).toLowerCase();
        const second = rowB.getValue<string>(columnId).toLowerCase();
        return first.localeCompare(second, 'vi');
      },
      cell: ({ row }) => (
        <span className="font-medium text-white print:text-black">{row.original.product_name}</span>
      ),
    },
    {
      accessorKey: 'product_code',
      header: 'Mã Số',
      size: 140,
      sortingFn: (rowA, rowB, columnId) => {
        const first = rowA.getValue<string>(columnId).toLowerCase();
        const second = rowB.getValue<string>(columnId).toLowerCase();
        return first.localeCompare(second, 'vi');
      },
      meta: { className: 'w-32' },
      cell: ({ row }) => (
        <span className="text-xs text-slate-200 print:text-slate-800">
          {row.original.product_code}
        </span>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Đơn vị tính',
      size: 96,
      sortingFn: (rowA, rowB, columnId) => {
        const first = rowA.getValue<string>(columnId).toLowerCase();
        const second = rowB.getValue<string>(columnId).toLowerCase();
        return first.localeCompare(second, 'vi');
      },
      meta: { className: 'w-20' },
      cell: ({ row }) => (
        <span className="text-slate-400 print:text-slate-600">{row.original.unit}</span>
      ),
    },
    {
      accessorKey: 'document_quantity',
      header: 'Số lượng chứng từ',
      size: 120,
      meta: { align: 'right', className: 'w-24' },
      cell: ({ row }) => (
        <span>{toNumber(row.original.document_quantity).toLocaleString('vi-VN')}</span>
      ),
    },
    {
      accessorKey: 'actual_quantity',
      header: 'Thực Nhập',
      size: 120,
      meta: { align: 'right', className: 'w-24' },
      cell: ({ row }) => (
        <span className="font-semibold text-blue-400 print:text-blue-700">
          {toNumber(row.original.actual_quantity).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      accessorKey: 'unit_price',
      header: 'Đơn Giá',
      size: 140,
      meta: { align: 'right', className: 'w-32' },
      cell: ({ row }) => (
        <span className="text-slate-400 print:text-slate-600">
          {toNumber(row.original.unit_price).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Thành Tiền',
      size: 180,
      meta: { align: 'right', className: 'w-40' },
      cell: ({ row }) => (
        <span className="font-bold text-emerald-400 print:text-emerald-700">
          {toNumber(row.original.total_amount).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: details,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
  });

  const totalColumns = table.getVisibleLeafColumns().length;
  const totalActualQuantity = details.reduce((sum, item) => sum + toNumber(item.actual_quantity), 0);
  const totalAmount = receipt ? toNumber(receipt.total_amount) : 0;

  const getAlignmentClass = (align?: 'left' | 'right') => {
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const getColumnClassName = (meta?: TableColumnMeta) => {
    return [getAlignmentClass(meta?.align), meta?.className].filter(Boolean).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        Đang tải thông tin phiếu...
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 p-8 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-red-400 mb-2">Không tìm thấy phiếu</h2>
        <p className="text-slate-400 mb-6">Phiếu nhập kho này không tồn tại hoặc có lỗi xảy ra.</p>
        <Link href="/receipts" className="text-blue-400 hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách phiếu
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Chi tiết phiếu nhập kho</h1>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden print:bg-white print:text-black print:border-none">
        <div className="p-6 border-b border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Số phiếu:</span> <span className="font-semibold text-white print:text-black">{receipt.receipt_number}</span></span>
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Ngày nhập:</span> {new Date(receipt.receipt_date).toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span>
                <span className="text-slate-400 print:text-slate-600">Đơn vị / Bộ phận:</span> {receipt.division_name} / {receipt.department_name}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Người giao:</span> {receipt.deliverer_name}</span>
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Nhà cung cấp:</span> {receipt.supplier_name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Kho:</span> {receipt.warehouse_name}</span>
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span><span className="text-slate-400 print:text-slate-600">Địa điểm:</span> {receipt.location}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span className="text-slate-400 print:text-slate-600">Hóa đơn:</span> {receipt.invoice_document}
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700">
              <span className="text-slate-400 print:text-slate-600">Ngày hóa đơn:</span> {new Date(receipt.invoice_date).toLocaleDateString('vi-VN')}
            </div>
            <div className="text-sm text-slate-300 print:text-slate-700 flex gap-3">
              <span><span className="text-slate-500">Nợ:</span> {receipt.debit_account}</span>
              <span><span className="text-slate-500">Có:</span> {receipt.credit_account}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-grid w-full table-fixed border-collapse text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-slate-900/50 print:bg-slate-100">
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as TableColumnMeta | undefined;
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className={`${getColumnClassName(meta)} p-4 font-semibold text-slate-300 relative group`}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              } ${meta?.align === 'right' ? 'justify-end' : 'justify-start'}`}
                          >
                            <span className="truncate">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanSort() && (
                              <span className="flex flex-col text-slate-500 shrink-0">
                                <ChevronUp className={`w-3 h-3 -mb-1 ${sorted === 'asc' ? 'text-blue-400' : ''}`} />
                                <ChevronDown className={`w-3 h-3 ${sorted === 'desc' ? 'text-blue-400' : ''}`} />
                              </span>
                            )}
                          </div>
                        )}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={(event) => {
                              event.stopPropagation();
                              header.getResizeHandler()(event);
                            }}
                            onTouchStart={(event) => {
                              event.stopPropagation();
                              header.getResizeHandler()(event);
                            }}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500/50 transition-all z-10"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-slate-500">
                    Chưa có vật tư nào
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
                      return (
                        <td
                          key={cell.id}
                          className={`${getColumnClassName(meta)} p-4 truncate`}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900/50 print:bg-slate-50 border-t border-slate-700 font-bold">
                <td colSpan={5} className="p-4 text-right text-slate-400 uppercase text-xs tracking-wider">Tổng cộng:</td>
                <td className="p-4 text-right text-blue-400 print:text-blue-700">
                  {totalActualQuantity.toLocaleString('vi-VN')}
                </td>
                <td className="p-4 text-right"></td>
                <td className="p-4 text-right text-lg text-emerald-400 print:text-emerald-700">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
