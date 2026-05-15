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
import { WarehouseOption } from '../../types/inventory';
import { includesNormalized, normalizeSearchText } from '../../utils/search';

type TableColumnMeta = {
  align?: 'left' | 'right';
  className?: string;
  filterPlaceholder?: string;
};

const fetchWarehouses = async (): Promise<WarehouseOption[]> => {
  const { data } = await api.get('/warehouses');
  return data;
};

export default function WarehousesPage() {
  const { data: warehouses = [], error, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    name: 280,
    address: 360,
  });

  const columns = useMemo<ColumnDef<WarehouseOption>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Kho',
        size: 280,
        meta: { filterPlaceholder: 'Tìm tên kho...' },
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        sortingFn: (rowA, rowB, columnId) => {
          const first = rowA.getValue<string>(columnId).toLowerCase();
          const second = rowB.getValue<string>(columnId).toLowerCase();
          return first.localeCompare(second, 'vi');
        },
        cell: ({ row }) => <span className="font-medium text-white truncate">{row.original.name}</span>,
      },
      {
        accessorKey: 'address',
        header: 'Địa chỉ',
        size: 360,
        meta: { filterPlaceholder: 'Tìm địa chỉ...' },
        cell: ({ row }) => <span className="text-slate-400 truncate">{row.original.address}</span>,
        filterFn: (row, columnId, filterValue) => includesNormalized(row.getValue(columnId), filterValue),
        sortingFn: (rowA, rowB, columnId) => {
          const first = rowA.getValue<string>(columnId).toLowerCase();
          const second = rowB.getValue<string>(columnId).toLowerCase();
          return first.localeCompare(second, 'vi');
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: warehouses,
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
  const totalWarehousesCount = warehouses.length;
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
        <div>
          <h1 className="text-3xl font-bold text-white">Danh sách kho</h1>
          <p className="text-slate-400 mt-1">Các kho hiện có trong hệ thống</p>
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
                    Không tải được danh sách kho.
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="text-center py-12 text-slate-500">
                    {hasActiveFilters ? 'Không tìm thấy kho phù hợp' : 'Chưa có kho nào.'}
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
            Tổng cộng <span className="font-medium text-slate-200">{filteredCount}</span> kết quả {hasActiveFilters && `(lọc từ ${totalWarehousesCount})`}
          </div>
        )}
      </div>
    </div>
  );
}
