export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  unit: string;
}

export interface WarehouseOption {
  id: string;
  name: string;
  address: string;
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface DelivererOption {
  id: string;
  name: string;
}

export interface DivisionOption {
  id: string;
  name: string;
}

export interface DepartmentOption {
  id: string;
  division_id: string;
  name: string;
}

export interface ReceiptListItem {
  id: string;
  receipt_number: string;
  receipt_date: string;
  deliverer_name: string;
  total_quantity: string | number;
  total_amount: string | number;
}

export interface ReceiptDetailItem {
  id: string;
  receipt_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  document_quantity: string | number;
  actual_quantity: string | number;
  unit_price: string | number;
  total_amount: string | number;
}

export interface ReceiptDetail {
  id: string;
  receipt_number: string;
  receipt_date: string;
  department_id: string;
  department_name: string;
  division_id: string;
  division_name: string;
  supplier_id: string;
  supplier_name: string;
  deliverer_name: string;
  invoice_document: string;
  invoice_date: string;
  debit_account: string;
  credit_account: string;
  status: string;
  total_amount: string | number;
  warehouse_id: string;
  warehouse_name: string;
  location: string;
  details: ReceiptDetailItem[];
}

export interface InventoryRecord {
  product_id: string;
  product_code: string;
  product_name: string;
  unit: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_address: string;
  quantity: number;
}

export interface TransactionListItem {
  id: string;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  transaction_date: string;
  product_code: string;
  product_name: string;
  warehouse_name: string;
  receipt_no: string;
  receipt_id: string;
}
