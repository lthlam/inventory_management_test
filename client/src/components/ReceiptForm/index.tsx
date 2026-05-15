'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ColumnDef,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

import api from '../../utils/api';
import OverlayModal from '../OverlayModal';
import {
  DepartmentOption,
  DelivererOption,
  DivisionOption,
  ProductRecord,
  SupplierOption,
  WarehouseOption
} from '../../types/inventory';
import { includesNormalized, normalizeSearchText } from '../../utils/search';

const receiptSchema = z.object({
  receiptNumber: z.string().trim().min(1, 'Số phiếu là bắt buộc'),
  receiptDate: z.string().min(1, 'Ngày nhập là bắt buộc'),
  divisionId: z.string().trim().min(1, 'Đơn vị là bắt buộc'),
  departmentId: z.string().trim().min(1, 'Bộ phận là bắt buộc').uuid('Bộ phận không hợp lệ'),
  supplierId: z.string().min(1, 'Nhà cung cấp là bắt buộc'),
  delivererId: z.string().trim().min(1, 'Người giao hàng là bắt buộc').uuid('Người giao hàng không hợp lệ'),
  warehouseId: z.string().min(1, 'Kho là bắt buộc'),
  invoiceDocument: z.string().trim().min(1, 'Số hóa đơn là bắt buộc'),
  invoiceDate: z.string().min(1, 'Ngày hóa đơn là bắt buộc'),
  debitAccount: z.string().trim().min(1, 'Tài khoản nợ là bắt buộc'),
  creditAccount: z.string().trim().min(1, 'Tài khoản có là bắt buộc'),
  details: z.array(
    z.object({
      productCode: z.string().trim().min(1, 'Mã số là bắt buộc'),
      productName: z.string().trim().min(1, 'Tên vật tư là bắt buộc'),
      unit: z.string().trim().min(1, 'Đơn vị tính là bắt buộc'),
      documentQuantity: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : Number(val)),
        z.number({ required_error: 'Số lượng chứng từ là bắt buộc', invalid_type_error: 'Phải là số' }).nonnegative('Số lượng chứng từ phải lớn hơn hoặc bằng 0')
      ),
      actualQuantity: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : Number(val)),
        z.number({ required_error: 'Số lượng thực nhập là bắt buộc', invalid_type_error: 'Phải là số' }).nonnegative('Số lượng phải lớn hơn hoặc bằng 0')
      ),
      unitPrice: z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : Number(val)),
        z.number({ required_error: 'Đơn giá là bắt buộc', invalid_type_error: 'Phải là số' }).nonnegative('Đơn giá >= 0')
      )
    })
  ).min(1, 'Cần ít nhất 1 mặt hàng')
});

type ReceiptFormValues = z.infer<typeof receiptSchema>;
type TableColumnMeta = { align?: 'left' | 'right'; className?: string };
const FOOTER_VALUE_AND_ACTION_COLUMNS = 2;

const fetchProducts = async (): Promise<ProductRecord[]> => {
  const { data } = await api.get('/products');
  return data;
};

const fetchWarehouses = async (): Promise<WarehouseOption[]> => {
  const { data } = await api.get('/warehouses');
  return data;
};

const fetchSuppliers = async (): Promise<SupplierOption[]> => {
  const { data } = await api.get('/suppliers');
  return data;
};

const fetchDeliverers = async (): Promise<DelivererOption[]> => {
  const { data } = await api.get('/deliverers');
  return data;
};

const fetchDivisions = async (): Promise<DivisionOption[]> => {
  const { data } = await api.get('/divisions');
  return data;
};

const fetchDepartments = async (divisionId: string): Promise<DepartmentOption[]> => {
  const { data } = await api.get('/departments', {
    params: { divisionId }
  });
  return data;
};

export default function ReceiptForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [errorMsg, setErrorMsg] = useState('');
  const [showDivisionQuickAdd, setShowDivisionQuickAdd] = useState(false);
  const [showDepartmentQuickAdd, setShowDepartmentQuickAdd] = useState(false);
  const [showDelivererQuickAdd, setShowDelivererQuickAdd] = useState(false);
  const [showSupplierQuickAdd, setShowSupplierQuickAdd] = useState(false);
  const [showWarehouseQuickAdd, setShowWarehouseQuickAdd] = useState(false);
  const [divisionForm, setDivisionForm] = useState({ name: '' });
  const [departmentForm, setDepartmentForm] = useState({ name: '' });
  const [delivererForm, setDelivererForm] = useState({ name: '' });
  const [supplierForm, setSupplierForm] = useState({ name: '' });
  const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '' });

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      receiptDate: new Date().toISOString().split('T')[0],
      details: [],
      supplierId: '',
      warehouseId: '',
      divisionId: '',
      departmentId: '',
      delivererId: '',
      invoiceDocument: '',
      invoiceDate: '',
      debitAccount: '',
      creditAccount: '',
    }
  });
  const selectedDivisionId = watch('divisionId');
  const { data: availableProducts = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const { data: availableWarehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses,
  });
  const { data: availableSuppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
  const { data: availableDeliverers = [] } = useQuery({
    queryKey: ['deliverers'],
    queryFn: fetchDeliverers,
  });
  const { data: availableDivisions = [] } = useQuery({
    queryKey: ['divisions'],
    queryFn: fetchDivisions,
  });
  const { data: availableDepartments = [] } = useQuery({
    queryKey: ['departments', selectedDivisionId],
    queryFn: () => fetchDepartments(selectedDivisionId),
    enabled: Boolean(selectedDivisionId),
  });

  useEffect(() => {
    setValue('departmentId', '');
  }, [selectedDivisionId, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: ReceiptFormValues) => {
      const payload = {
        receiptNumber: data.receiptNumber,
        receiptDate: data.receiptDate,
        departmentId: data.departmentId,
        invoiceDocument: data.invoiceDocument,
        invoiceDate: data.invoiceDate,
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        supplierId: data.supplierId,
        delivererId: data.delivererId,
        warehouseId: data.warehouseId,
        details: data.details.map((item) => ({
          ...item,
          totalAmount: item.actualQuantity * item.unitPrice
        }))
      };

      const { data: responseData } = await api.post('/receipts', payload);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      alert('Đã lưu phiếu thành công vào cơ sở dữ liệu!');
      router.push('/receipts');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || err.message;
      setErrorMsg(message);
      alert('Lỗi: ' + message);
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (payload: typeof supplierForm) => {
      const { data } = await api.post('/suppliers', payload);
      return data;
    },
    onSuccess: (response) => {
      const supplier = response.supplier as SupplierOption;
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setValue('supplierId', supplier.id, { shouldValidate: true });
      closeSupplierQuickAdd();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message);
    }
  });

  const createDelivererMutation = useMutation({
    mutationFn: async (payload: typeof delivererForm) => {
      const { data } = await api.post('/deliverers', payload);
      return data;
    },
    onSuccess: (response) => {
      const deliverer = response.deliverer as DelivererOption;
      queryClient.invalidateQueries({ queryKey: ['deliverers'] });
      setValue('delivererId', deliverer.id, { shouldValidate: true });
      closeDelivererQuickAdd();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message);
    }
  });

  const createDivisionMutation = useMutation({
    mutationFn: async (payload: typeof divisionForm) => {
      const { data } = await api.post('/divisions', payload);
      return data;
    },
    onSuccess: (response) => {
      const division = response.division as DivisionOption;
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      setValue('divisionId', division.id, { shouldValidate: true });
      closeDivisionQuickAdd();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message);
    }
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (payload: { divisionId: string; name: string }) => {
      const { data } = await api.post('/departments', payload);
      return data;
    },
    onSuccess: (response) => {
      const department = response.department as DepartmentOption;
      queryClient.invalidateQueries({ queryKey: ['departments', department.division_id] });
      setValue('departmentId', department.id, { shouldValidate: true });
      closeDepartmentQuickAdd();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message);
    }
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async (payload: typeof warehouseForm) => {
      const { data } = await api.post('/warehouses', payload);
      return data;
    },
    onSuccess: (response) => {
      const warehouse = response.warehouse as WarehouseOption;
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setValue('warehouseId', warehouse.id, { shouldValidate: true });
      closeWarehouseQuickAdd();
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || err.message);
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'details'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({
    index: 56,
    productCode: 120,
    productName: 280,
    unit: 96,
    documentQuantity: 140,
    actualQuantity: 140,
    unitPrice: 140,
    totalAmount: 160,
    actions: 72,
  });

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length > 0) {
          const importedDetails = data.map(row => ({
            productCode: (row['Mã số'] || row['D'] || '').toString(),
            productName: (row['Tên vật tư'] || row['E'] || '').toString(),
            unit: (row['Đơn vị tính'] || row['F'] || '').toString(),
            documentQuantity: parseFloat(row['Số lượng theo chứng từ'] || row['1'] || 0),
            actualQuantity: parseFloat(row['Số lượng thực nhập'] || row['2'] || 0),
            unitPrice: parseFloat(row['Đơn giá'] || row['3'] || 0)
          }));

          if (importedDetails.length > 0) {
            replace(importedDetails);

            const currentNumber = watch('receiptNumber');
            if (!currentNumber) {
              const fileName = file.name.split('.')[0];
              setValue('receiptNumber', fileName);
            }
          }
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error('Error importing excel:', err);
      alert('Có lỗi khi đọc file Excel.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const details = useWatch({ name: 'details', control }) || [];
  const selectedWarehouseId = watch('warehouseId');
  const selectedDivision = availableDivisions.find(
    (division) => division.id === selectedDivisionId
  );
  const selectedWarehouse = availableWarehouses.find(
    (warehouse) => warehouse.id === selectedWarehouseId
  );

  const getSuggestedProducts = useCallback((productCode: string) => {
    const normalized = normalizeSearchText(productCode);

    if (!normalized) {
      return availableProducts.slice(0, 8);
    }

    return availableProducts
      .filter((product) =>
        includesNormalized(product.code, normalized) ||
        includesNormalized(product.name, normalized)
      )
      .slice(0, 8);
  }, [availableProducts]);

  const syncProductFromCatalog = useCallback((index: number, rawValue: string) => {
    const code = rawValue.trim().toUpperCase();

    if (!code) {
      setValue(`details.${index}.productName`, '');
      setValue(`details.${index}.unit`, '');
      return;
    }

    const matchedProduct = availableProducts.find(
      (product) => product.code.toUpperCase() === code
    );

    if (!matchedProduct) {
      return;
    }

    setValue(`details.${index}.productCode`, matchedProduct.code, { shouldValidate: true });
    setValue(`details.${index}.productName`, matchedProduct.name, { shouldValidate: true });
    setValue(`details.${index}.unit`, matchedProduct.unit, { shouldValidate: true });
  }, [availableProducts, setValue]);

  const calculateTotal = useCallback((index: number) => {
    const currentDetails = getValues('details');
    const qty = currentDetails?.[index]?.actualQuantity || 0;
    const price = currentDetails?.[index]?.unitPrice || 0;
    return qty * price;
  }, [getValues]);

  const grandTotal = useMemo(
    () => details?.reduce((sum, _item, index) => sum + calculateTotal(index), 0) || 0,
    [calculateTotal, details]
  );

  const columns = useMemo<ColumnDef<(typeof fields)[number]>[]>(() => [
    {
      id: 'index',
      header: 'STT',
      size: 56,
      enableResizing: false,
      meta: { align: 'left' },
      cell: ({ row }) => <span className="text-slate-400">{row.index + 1}</span>,
    },
    {
      id: 'productCode',
      accessorKey: 'productCode',
      header: () => <>Mã số <span className="text-red-500">*</span></>,
      size: 120,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input
              {...register(`details.${index}.productCode`, {
                onChange: (e) => {
                  syncProductFromCatalog(index, e.target.value);
                }
              })}
              list={`product-suggestions-${row.id}`}
              className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.productCode ? 'border-red-500' : 'border-white/10'} rounded-lg px-2 py-2 outline-none text-xs text-center focus:border-blue-500`}
            />
            <datalist id={`product-suggestions-${row.id}`}>
              {getSuggestedProducts(getValues('details')?.[index]?.productCode || '').map((product) => (
                <option key={product.id} value={product.code}>
                  {product.name}
                </option>
              ))}
            </datalist>
            {errors.details?.[index]?.productCode && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].productCode?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'productName',
      accessorKey: 'productName',
      header: () => <>Tên, nhãn hiệu... <span className="text-red-500">*</span></>,
      size: 280,
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input
              {...register(`details.${index}.productName`)}
              className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.productName ? 'border-red-500' : 'border-white/10'} rounded-lg px-3 py-2 outline-none text-white focus:ring-1 focus:ring-blue-500/30 text-sm`}
            />
            {errors.details?.[index]?.productName && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].productName?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'unit',
      accessorKey: 'unit',
      header: () => <>Đơn vị tính <span className="text-red-500">*</span></>,
      size: 96,
      meta: { align: 'left' },
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input
              {...register(`details.${index}.unit`)}
              className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.unit ? 'border-red-500' : 'border-white/10'} rounded-lg px-1 py-2 outline-none text-center text-slate-300 text-sm`}
            />
            {errors.details?.[index]?.unit && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].unit?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'documentQuantity',
      accessorKey: 'documentQuantity',
      header: () => <>Số lượng chứng từ <span className="text-red-500">*</span></>,
      size: 140,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input type="number" min="0" onKeyDown={(e) => ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault()} {...register(`details.${index}.documentQuantity`, { valueAsNumber: true })} className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.documentQuantity ? 'border-red-500' : 'border-white/10'} rounded-lg px-2 py-2 outline-none text-right text-sm`} />
            {errors.details?.[index]?.documentQuantity && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].documentQuantity?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'actualQuantity',
      accessorKey: 'actualQuantity',
      header: () => <>Số lượng thực nhập <span className="text-red-500">*</span></>,
      size: 140,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input type="number" min="0" onKeyDown={(e) => ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault()} {...register(`details.${index}.actualQuantity`, { valueAsNumber: true })} className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.actualQuantity ? 'border-red-500' : 'border-white/10'} rounded-lg px-2 py-2 outline-none text-right text-sm`} />
            {errors.details?.[index]?.actualQuantity && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].actualQuantity?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'unitPrice',
      accessorKey: 'unitPrice',
      header: () => <>Đơn giá <span className="text-red-500">*</span></>,
      size: 140,
      meta: { align: 'right' },
      cell: ({ row }) => {
        const index = row.index;

        return (
          <div className="relative">
            <input type="number" min="0" onKeyDown={(e) => ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault()} {...register(`details.${index}.unitPrice`, { valueAsNumber: true })} className={`w-full bg-slate-900/50 border ${errors.details?.[index]?.unitPrice ? 'border-red-500' : 'border-white/10'} rounded-lg px-2 py-2 outline-none text-right text-sm`} />
            {errors.details?.[index]?.unitPrice && <p className="absolute -bottom-4 left-0 w-full text-[9px] text-red-400 font-bold uppercase truncate">{errors.details[index].unitPrice?.message}</p>}
          </div>
        );
      },
    },
    {
      id: 'totalAmount',
      header: 'Thành tiền',
      size: 160,
      meta: { align: 'right' },
      enableResizing: false,
      cell: ({ row }) => (
        <span className="font-medium text-blue-400 text-sm">
          {calculateTotal(row.index).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 72,
      meta: { align: 'left' },
      enableResizing: false,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => remove(row.index)}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
          title="Xóa dòng"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ),
    },
  ], [calculateTotal, errors.details, getSuggestedProducts, register, remove, syncProductFromCatalog, getValues]);

  const table = useReactTable({
    data: fields,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
  });

  const totalColumns = table.getVisibleLeafColumns().length;
  const footerLabelColSpan = useMemo(
    () => Math.max(totalColumns - FOOTER_VALUE_AND_ACTION_COLUMNS, 1),
    [totalColumns]
  );

  const getAlignmentClass = (align?: 'left' | 'right') => {
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const getColumnClassName = (meta?: TableColumnMeta) => {
    return [getAlignmentClass(meta?.align), meta?.className].filter(Boolean).join(' ');
  };

  const onSubmit = (data: ReceiptFormValues) => {
    mutation.mutate(data);
  };

  const closeSupplierQuickAdd = () => {
    setShowSupplierQuickAdd(false);
    setSupplierForm({ name: '' });
  };

  const closeDivisionQuickAdd = () => {
    setShowDivisionQuickAdd(false);
    setDivisionForm({ name: '' });
  };

  const closeDepartmentQuickAdd = () => {
    setShowDepartmentQuickAdd(false);
    setDepartmentForm({ name: '' });
  };

  const closeDelivererQuickAdd = () => {
    setShowDelivererQuickAdd(false);
    setDelivererForm({ name: '' });
  };

  const closeWarehouseQuickAdd = () => {
    setShowWarehouseQuickAdd(false);
    setWarehouseForm({ name: '', address: '' });
  };

  const handleCreateDivision = () => {
    createDivisionMutation.mutate({
      name: divisionForm.name.trim()
    });
  };

  const handleCreateDepartment = () => {
    if (!selectedDivisionId) {
      alert('Cần chọn đơn vị trước khi thêm bộ phận.');
      return;
    }

    createDepartmentMutation.mutate({
      divisionId: selectedDivisionId,
      name: departmentForm.name.trim()
    });
  };

  const handleCreateDeliverer = () => {
    createDelivererMutation.mutate({
      name: delivererForm.name.trim()
    });
  };

  const handleCreateSupplier = () => {
    createSupplierMutation.mutate({
      name: supplierForm.name.trim()
    });
  };

  const handleCreateWarehouse = () => {
    createWarehouseMutation.mutate({
      name: warehouseForm.name.trim(),
      address: warehouseForm.address.trim()
    });
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-white/10 bg-slate-900/50 p-6 flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Tạo Phiếu Nhập Kho</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-10">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4 border-b border-white/5 pb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Số phiếu nhập kho<span className="text-red-500">*</span></label>
              <input {...register('receiptNumber')} className={`w-full bg-slate-900/50 border ${errors.receiptNumber ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`} placeholder="Ví dụ: PNK001" />
              {errors.receiptNumber && <p className="text-red-500 text-xs">{errors.receiptNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Ngày nhập phiếu <span className="text-red-500">*</span></label>
              <input type="date" {...register('receiptDate')} className={`w-full bg-slate-900/50 border ${errors.receiptDate ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`} />
              {errors.receiptDate && <p className="text-red-500 text-xs">{errors.receiptDate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Đơn vị <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentQuickAdd(false);
                    setShowDivisionQuickAdd(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <select
                {...register('divisionId')}
                className={`w-full bg-slate-900/50 border ${errors.divisionId ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              >
                <option value="">Chọn đơn vị</option>
                {availableDivisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
              {errors.divisionId && <p className="text-red-500 text-xs">{errors.divisionId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Bộ phận <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  disabled={!selectedDivisionId}
                  onClick={() => {
                    setShowDivisionQuickAdd(false);
                    setShowDepartmentQuickAdd(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <select
                {...register('departmentId')}
                disabled={!selectedDivisionId}
                className={`w-full bg-slate-900/50 border ${errors.departmentId ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:cursor-not-allowed disabled:text-slate-500`}
              >
                <option value="">
                  {selectedDivisionId ? 'Chọn bộ phận' : 'Chọn đơn vị trước'}
                </option>
                {availableDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-red-500 text-xs">{errors.departmentId.message}</p>}
              <p className="text-xs text-slate-500">Chỉ chọn từ dropdown. Muốn thêm mới, dùng nút `Thêm`.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Nhà cung cấp <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => {
                    setShowWarehouseQuickAdd(false);
                    setShowSupplierQuickAdd(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <select
                {...register('supplierId')}
                className={`w-full bg-slate-900/50 border ${errors.supplierId ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              >
                <option value="">Chọn nhà cung cấp</option>
                {availableSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-red-500 text-xs">{errors.supplierId.message}</p>}
              <p className="text-xs text-slate-500">Chọn từ danh sách có sẵn hoặc bấm `Thêm` để tạo nhanh nhà cung cấp.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Kho nhập <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierQuickAdd(false);
                    setShowWarehouseQuickAdd(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <select
                {...register('warehouseId')}
                className={`w-full bg-slate-900/50 border ${errors.warehouseId ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              >
                <option value="">Chọn kho</option>
                {availableWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
              {errors.warehouseId && <p className="text-red-500 text-xs">{errors.warehouseId.message}</p>}
              <p className="text-xs text-slate-500">Chọn từ danh sách có sẵn hoặc bấm `Thêm` để tạo nhanh kho.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Địa điểm kho <span className="text-red-500">*</span></label>
                <span
                  aria-hidden="true"
                  className="inline-flex items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-xs font-medium opacity-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </span>
              </div>
              <input
                type="text"
                value={selectedWarehouse?.address?.trim() || ''}
                disabled
                placeholder="Chọn kho để xem địa điểm"
                className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2 text-white outline-none transition-all opacity-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-100"
              />
              <p className="text-xs text-slate-500">Địa điểm được tự động hiển thị theo kho đã chọn.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-slate-400">Người giao hàng <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => setShowDelivererQuickAdd(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm
                </button>
              </div>
              <select
                {...register('delivererId')}
                className={`w-full bg-slate-900/50 border ${errors.delivererId ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              >
                <option value="">Chọn người giao hàng</option>
                {availableDeliverers.map((deliverer) => (
                  <option key={deliverer.id} value={deliverer.id}>
                    {deliverer.name}
                  </option>
                ))}
              </select>
              {errors.delivererId && <p className="text-red-500 text-xs">{errors.delivererId.message}</p>}
              <p className="text-xs text-slate-500">Chỉ chọn từ danh sách có sẵn hoặc bấm `Thêm` để tạo nhanh người giao.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Số hóa đơn <span className="text-red-500">*</span></label>
              <input
                {...register('invoiceDocument')}
                className={`w-full bg-slate-900/50 border ${errors.invoiceDocument ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                placeholder="Số hóa đơn"
              />
              {errors.invoiceDocument && <p className="text-red-500 text-xs">{errors.invoiceDocument.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Ngày hóa đơn <span className="text-red-500">*</span></label>
              <input
                type="date"
                {...register('invoiceDate')}
                className={`w-full bg-slate-900/50 border ${errors.invoiceDate ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
              />
              {errors.invoiceDate && <p className="text-red-500 text-xs">{errors.invoiceDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Tài khoản nợ <span className="text-red-500">*</span></label>
              <input
                {...register('debitAccount')}
                className={`w-full bg-slate-900/50 border ${errors.debitAccount ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                placeholder="Ví dụ: 156"
              />
              {errors.debitAccount && <p className="text-red-500 text-xs">{errors.debitAccount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-400">Tài khoản có <span className="text-red-500">*</span></label>
              <input
                {...register('creditAccount')}
                className={`w-full bg-slate-900/50 border ${errors.creditAccount ? 'border-red-500' : 'border-white/10'} rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all`}
                placeholder="Ví dụ: 331"
              />
              {errors.creditAccount && <p className="text-red-500 text-xs">{errors.creditAccount.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Chi Tiết Vật Tư</h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelImport}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
              >
                <FileSpreadsheet className="w-4 h-4" /> Nhập từ Excel
              </button>
              <button
                type="button"
                onClick={() => append({
                  productCode: '',
                  productName: '',
                  unit: '',
                  documentQuantity: '' as unknown as number,
                  actualQuantity: '' as unknown as number,
                  unitPrice: '' as unknown as number
                })}
                className="text-sm inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Thêm dòng
              </button>
            </div>
          </div>

          <div className="table-frame overflow-x-auto border border-white/10">
            <table className="table-grid w-full border-collapse text-left table-fixed">
              <thead className="bg-slate-900/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as TableColumnMeta | undefined;
                      return (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={`${getColumnClassName(meta)} p-3 font-medium text-slate-300 relative group`}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-blue-500/50 transition-all"
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={totalColumns} className="p-6 text-center text-slate-500">
                      Chưa có vật tư nào
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="bg-slate-800/30 group/row">
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as TableColumnMeta | undefined;
                        return (
                          <td
                            key={cell.id}
                            style={{ width: cell.column.getSize() }}
                            className={`${getColumnClassName(meta)} p-3 align-top`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-900/50 border-t border-white/10">
                <tr>
                  <td colSpan={footerLabelColSpan} className="p-4 text-right font-medium text-slate-300 uppercase text-xs tracking-wider">Tổng:</td>
                  <td className="p-4 text-right font-bold text-emerald-400 text-lg">
                    {grandTotal.toLocaleString('vi-VN')} đ
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          {errors.details && <p className="text-red-400 text-xs mt-2">{errors.details.message}</p>}
        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : (
              <>
                <Save className="w-5 h-5" />
                Lưu Phiếu Nhập Kho
              </>
            )}
          </button>
        </div>
      </form>

      {showDivisionQuickAdd && (
        <OverlayModal
          title="Tạo nhanh đơn vị"
          onClose={closeDivisionQuickAdd}
          maxWidthClassName="max-w-lg"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateDivision();
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Tên đơn vị</label>
              <input
                autoFocus
                value={divisionForm.name}
                onChange={(e) => setDivisionForm({ name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Nhập tên đơn vị"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={createDivisionMutation.isPending || !divisionForm.name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {createDivisionMutation.isPending ? 'Đang lưu...' : 'Lưu đơn vị'}
              </button>
            </div>
          </form>
        </OverlayModal>
      )}

      {showDepartmentQuickAdd && (
        <OverlayModal
          title="Tạo nhanh bộ phận"
          onClose={closeDepartmentQuickAdd}
          maxWidthClassName="max-w-lg"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateDepartment();
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Đơn vị đang chọn</label>
              <input
                value={selectedDivision?.name || ''}
                disabled
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-slate-300 outline-none"
                placeholder="Chọn đơn vị trước"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Tên bộ phận</label>
              <input
                autoFocus
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Nhập tên bộ phận"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={createDepartmentMutation.isPending || !selectedDivisionId || !departmentForm.name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {createDepartmentMutation.isPending ? 'Đang lưu...' : 'Lưu bộ phận'}
              </button>
            </div>
          </form>
        </OverlayModal>
      )}

      {showDelivererQuickAdd && (
        <OverlayModal
          title="Tạo nhanh người giao"
          onClose={closeDelivererQuickAdd}
          maxWidthClassName="max-w-lg"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateDeliverer();
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Tên người giao</label>
              <input
                autoFocus
                value={delivererForm.name}
                onChange={(e) => setDelivererForm({ name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Nhập tên người giao"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={createDelivererMutation.isPending || !delivererForm.name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {createDelivererMutation.isPending ? 'Đang lưu...' : 'Lưu người giao'}
              </button>
            </div>
          </form>
        </OverlayModal>
      )}

      {showSupplierQuickAdd && (
        <OverlayModal
          title="Tạo nhanh nhà cung cấp"
          onClose={closeSupplierQuickAdd}
          maxWidthClassName="max-w-lg"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateSupplier();
            }}
          >
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-300">Tên nhà cung cấp</label>
              <input
                autoFocus
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ name: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Nhập tên nhà cung cấp"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={createSupplierMutation.isPending || !supplierForm.name.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {createSupplierMutation.isPending ? 'Đang lưu...' : 'Lưu nhà cung cấp'}
              </button>
            </div>
          </form>
        </OverlayModal>
      )}

      {showWarehouseQuickAdd && (
        <OverlayModal
          title="Tạo nhanh kho"
          onClose={closeWarehouseQuickAdd}
          maxWidthClassName="max-w-2xl"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleCreateWarehouse();
            }}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300">Tên kho</label>
                <input
                  autoFocus
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Nhập tên kho"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-300">Địa chỉ kho</label>
                <input
                  value={warehouseForm.address}
                  onChange={(e) => setWarehouseForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Nhập địa chỉ kho"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={
                  createWarehouseMutation.isPending ||
                  !warehouseForm.name.trim() ||
                  !warehouseForm.address.trim()
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {createWarehouseMutation.isPending ? 'Đang lưu...' : 'Lưu kho'}
              </button>
            </div>
          </form>
        </OverlayModal>
      )}
    </div>
  );
}
