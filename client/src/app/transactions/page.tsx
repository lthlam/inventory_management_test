'use client';

import { useMemo, useState } from 'react';
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
import { ChevronDown, ChevronUp } from 'lucide-react';

import api from '../../utils/api';
import { TransactionListItem } from '../../types/inventory';
import { includesNormalized } from '../../utils/search';

type TableColumnMeta = {
  align?: 'left' | 'right';
  className?: string;
  filterPlaceholder?: string;
};

const fetchTransactions = async (): Promise<TransactionListItem[]> => {
  const { data } = await api.get('/transactions');
  return data;
};

export default function TransactionsPage() {
  const { data: transactions = [], error, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    transaction_date: 160,
    transaction_type: 120,
    receipt_no: 140,
    product_name: 240,
    warehouse_name: 180,
    quantity: 120,
    unit_price: 150,
    amount: 160,
  });

  const columns = useMemo<ColumnDef<TransactionListItem>[]>(
    () => [
      {
        accessorKey: 'transaction_date',
        header: 'Thời gian',
        size: 160,
        meta: { filterPlaceholder: 'Tìm ngày...' },
        filterFn: (row, columnId, filterValue) => {
          const formattedDate = new Date(row.original.transaction_date).toLocaleString('vi-VN');
          return includesNormalized(formattedDate, filterValue);
        },
        sortingFn: (rowA, rowB, columnId) => {
          return new Date(rowA.getValue<string>(columnId)).getTime() - new Date(rowB.getValue<string>(columnId)).getTime();
        },
        cell: ({ row }) => (
          <span className="text-slate-300">
            {new Date(row.original.transaction_date).toLocaleString('vi-VN')}
          </span>
        ),
      },
      {
        accessorKey: 'transaction_type',
        header: 'Loại giao dịch',
        size: 120,
        meta: { filterPlaceholder: 'Tìm loại...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        cell: ({ row }) => {
          const type = row.original.transaction_type;
          return (
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' :
                type === 'OUT' ? 'bg-orange-500/20 text-orange-400' :
                'bg-blue-500/20 text-blue-400'
              }`}
            >
              {type === 'IN' ? 'Nhập Kho' : type === 'OUT' ? 'Xuất Kho' : 'Điều Chỉnh'}
            </span>
          );
        },
      },
      {
        accessorKey: 'receipt_no',
        header: 'Số phiếu nhập kho',
        size: 140,
        meta: { filterPlaceholder: 'Tìm số phiếu nhập kho...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        cell: ({ row }) => (
          <span className="text-blue-400">
            {row.original.receipt_no}
          </span>
        ),
      },
      {
        accessorKey: 'product_name',
        header: 'Sản phẩm',
        size: 240,
        meta: { filterPlaceholder: 'Tìm tên/mã sản phẩm...' },
        filterFn: (row, columnId, filterValue) => {
          return includesNormalized(row.original.product_name, filterValue) || includesNormalized(row.original.product_code, filterValue);
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.product_name}</div>
            <div className="text-xs text-slate-500">{row.original.product_code}</div>
          </div>
        ),
      },
      {
        accessorKey: 'warehouse_name',
        header: 'Kho',
        size: 180,
        meta: { filterPlaceholder: 'Tìm kho...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng',
        size: 120,
        meta: { align: 'right', filterPlaceholder: 'Tìm số lượng...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(String(row.getValue(columnId)), filterValue),
        cell: ({ row }) => (
          <span className="font-semibold text-white">
            {Number(row.original.quantity || 0).toLocaleString('vi-VN')}
          </span>
        ),
      },
      {
        accessorKey: 'unit_price',
        header: 'Đơn giá',
        size: 150,
        meta: { align: 'right', filterPlaceholder: 'Tìm đơn giá...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(String(row.getValue(columnId)), filterValue),
        cell: ({ row }) => (
          <span className="font-medium text-slate-200">
            {Number(row.original.unit_price || 0).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Thành tiền',
        size: 160,
        meta: { align: 'right', filterPlaceholder: 'Tìm số tiền...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(String(row.getValue(columnId)), filterValue),
        cell: ({ row }) => (
          <span className="font-medium text-emerald-400">
            {Number(row.original.amount || 0).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: transactions,
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

  const totalColumns = table.getVisibleLeafColumns().length;
  const filteredCount = table.getRowModel().rows.length;
  const totalCount = transactions.length;
  const hasActiveFilters = columnFilters.some((filter) => String(filter.value ?? '').trim().length > 0);

  const getAlignmentClass = (align?: 'left' | 'right') => {
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const getColumnClassName = (meta?: TableColumnMeta) => {
    return [getAlignmentClass(meta?.align), meta?.className].filter(Boolean).join(' ');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white">Lịch sử giao dịch</h1>
        <p className="text-slate-400 mt-1">Quản lý lịch sử nhập/xuất kho và điều chỉnh tồn kho</p>
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
                      className={`${meta?.align === 'right' ? 'text-right' : 'text-left'} ${meta?.className ?? ''} p-3`}
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
                    Không tải được lịch sử giao dịch.
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-slate-500">
                    {hasActiveFilters ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có giao dịch nào.'}
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
            Tổng cộng <span className="font-medium text-slate-200">{filteredCount}</span> kết quả {hasActiveFilters && `(lọc từ ${totalCount})`}
          </div>
        )}
      </div>
    </div>
  );
}
