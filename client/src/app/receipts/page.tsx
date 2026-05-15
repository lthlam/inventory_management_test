'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  flexRender,
  getFilteredRowModel,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { PlusCircle, FileText, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import api from '../../utils/api';
import { ReceiptListItem } from '../../types/inventory';
import { includesNormalized, normalizeSearchText } from '../../utils/search';

const toNumber = (value: string | number) => Number(value || 0);

type TableColumnMeta = {
  align?: 'left' | 'right';
  className?: string;
  filterPlaceholder?: string;
};

const fetchReceipts = async (): Promise<ReceiptListItem[]> => {
  const { data } = await api.get('/receipts');
  return data;
};

export default function ReceiptsPage() {
  const { data: receipts = [], error, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: fetchReceipts,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    receipt_number: 160,
    receipt_date: 150,
    deliverer_name: 200,
    total_quantity: 140,
    total_amount: 180,
    actions: 96,
  });

  const columns = useMemo<ColumnDef<ReceiptListItem>[]>(
    () => [
      {
        accessorKey: 'receipt_number',
        header: 'Số phiếu',
        size: 160,
        meta: { filterPlaceholder: 'Tìm số phiếu...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        sortingFn: (rowA, rowB, columnId) => {
          const first = rowA.getValue<string>(columnId).toLowerCase();
          const second = rowB.getValue<string>(columnId).toLowerCase();
          return first.localeCompare(second, 'vi');
        },
        cell: ({ row }) => <span className="font-medium">{row.original.receipt_number}</span>,
      },
      {
        accessorKey: 'receipt_date',
        header: 'Ngày nhập',
        size: 150,
        meta: { filterPlaceholder: 'Tìm ngày nhập...' },
        filterFn: (row, columnId, filterValue) => {
          const formattedDate = new Date(row.original.receipt_date).toLocaleDateString('vi-VN');
          return includesNormalized(formattedDate, filterValue);
        },
        cell: ({ row }) => (
          <span className="text-slate-400">
            {new Date(row.original.receipt_date).toLocaleDateString('vi-VN')}
          </span>
        ),
      },
      {
        accessorKey: 'deliverer_name',
        header: 'Người giao hàng',
        size: 180,
        meta: { filterPlaceholder: 'Tìm người giao...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        cell: ({ row }) => row.original.deliverer_name,
      },
      {
        accessorKey: 'total_quantity',
        header: 'Tổng số lượng',
        size: 140,
        meta: { align: 'right', filterPlaceholder: 'Tìm tổng số lượng...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        cell: ({ row }) => (
          <span className="font-semibold text-blue-400">
            {toNumber(row.original.total_quantity).toLocaleString('vi-VN')}
          </span>
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Tổng tiền',
        size: 180,
        meta: { align: 'right', filterPlaceholder: 'Tìm tổng tiền...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        cell: ({ row }) => (
          <span className="font-bold text-emerald-400">
            {toNumber(row.original.total_amount).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Chi Tiết',
        size: 96,
        minSize: 96,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
        <Link
          href={`/receipts/${row.original.id}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 p-2 transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: receipts || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnSizingChange: setColumnSizing,
  });

  const hasActiveFilters = columnFilters.some((filter) => String(filter.value ?? '').trim().length > 0);

  const totalColumns = table.getVisibleLeafColumns().length;
  const filteredCount = table.getRowModel().rows.length;
  const totalReceiptsCount = receipts.length;

  const getAlignmentClass = (align?: 'left' | 'right') => {
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const getColumnClassName = (meta?: TableColumnMeta) => {
    return [getAlignmentClass(meta?.align), meta?.className].filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Quản lý phiếu nhập kho
          </h1>
          <p className="text-slate-400 mt-1">Danh sách các phiếu nhập kho gần đây</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/receipts/new"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo phiếu nhập kho
          </Link>
        </div>
      </div>

      <div className="table-frame bg-slate-800 border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-grid w-full table-fixed border-collapse text-left">
            <thead className="bg-slate-900/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
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
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort() ? 'cursor-pointer select-none' : ''
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
              <tr className="bg-slate-900/30">
                {table.getFlatHeaders().map((header) => {
                  const meta = header.column.columnDef.meta as TableColumnMeta | undefined;

                  return (
                    <th
                      key={`${header.id}-filter`}
                      style={{ width: header.getSize() }}
                      className={`${getColumnClassName(meta)} p-3`}
                    >
                      {header.column.getCanFilter() ? (
                        <input
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={(event) => header.column.setFilterValue(event.target.value)}
                          placeholder={meta?.filterPlaceholder || 'Tìm kiếm...'}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500"
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-red-400">
                    Không tải được danh sách phiếu nhập kho.
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-slate-500">
                    {hasActiveFilters ? 'Không tìm thấy phiếu nhập kho phù hợp' : 'Chưa có phiếu nhập kho nào.'}
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
          </table>
        </div>

        {!isLoading && !error && (
          <div className="p-4 border-t border-white/10 bg-slate-900/30 text-sm text-slate-400">
            Tổng cộng <span className="font-medium text-slate-200">{filteredCount}</span> kết quả {hasActiveFilters && `(lọc từ ${totalReceiptsCount})`}
          </div>
        )}
      </div>
    </div>
  );
}
