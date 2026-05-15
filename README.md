# Hệ thống quản lý kho (chức năng nhập liệu)

## Hướng dẫn cài đặt và Chạy

### 1. Yêu cầu hệ thống
- Node.js (phiên bản mới nhất)
- PostgreSQL đang hoạt động

### 2. Cấu hình cơ sở dữ liệu
Trong thư mục `server/`, tạo file `.env` (nếu chưa có) và cấu hình các thông số kết nối:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=inventory_management
PORT=3001
```

Chạy script khởi tạo database:
```bash
cd server
npm run db:init
```

### 3. Cài đặt và Chạy Backend
```bash
cd server
npm install
npm run dev
```
Server sẽ chạy tại: `http://localhost:3001`

### 4. Cài đặt và Chạy Frontend
```bash
cd client
npm install
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:3000`

### 5. Chạy bằng Docker

```bash
sudo docker compose up -d --build
```
Hệ thống sẽ tự động khởi tạo cơ sở dữ liệu (nạp sẵn file `init.sql`) và chạy:
- Frontend tại: `http://localhost:3000`
- Backend tại nội bộ (và map ra ngoài ở port `3001` nếu cần)

*Nếu bạn muốn thiết lập lại Database từ đầu (xóa sạch dữ liệu), hãy chạy:*
```bash
sudo docker compose down -v
sudo docker compose up -d
```

## Cấu trúc Cơ sở Dữ liệu

Hệ thống sử dụng PostgreSQL. Dưới đây là Sơ đồ thực thể quan hệ (ERD):

```mermaid
erDiagram
    DIVISION ||--o{ DEPARTMENT : "has"
    DEPARTMENT ||--o{ WAREHOUSE_RECEIPTS : "receives"
    
    SUPPLIERS ||--o{ WAREHOUSE_RECEIPTS : "supplies"
    DELIVERERS ||--o{ WAREHOUSE_RECEIPTS : "delivers"
    WAREHOUSES ||--o{ WAREHOUSE_RECEIPTS : "stores"
    WAREHOUSES ||--o{ PRODUCT_STOCKS : "contains"
    
    PRODUCTS ||--o{ PRODUCT_STOCKS : "has stock in"
    PRODUCTS ||--o{ WAREHOUSE_RECEIPT_ITEMS : "included in"
    PRODUCTS ||--o{ WAREHOUSE_TRANSACTIONS : "has transaction"
    
    WAREHOUSE_RECEIPTS ||--|{ WAREHOUSE_RECEIPT_ITEMS : "contains"
    WAREHOUSE_RECEIPT_ITEMS ||--o{ WAREHOUSE_TRANSACTIONS : "generates"
    
    WAREHOUSE_RECEIPTS {
        uuid id PK
        string receipt_no "Số phiếu nhập"
        date receipt_date "Ngày lập phiếu"
        string department_id "Mã bộ phận"
        uuid warehouse_id FK
        uuid supplier_id FK
        string invoice_document "Chứng từ kèm theo"
        date invoice_date "Ngày chứng từ"
        string debit_account "Tài khoản nợ"
        string credit_account "Tài khoản có"
        decimal total_amount "Tổng tiền"
        integer attached_document_count "Số lượng chứng từ đính kèm"
        string status "Trạng thái (DRAFT/POSTED/CANCELLED)"
        timestamp created_at
        timestamp updated_at
        uuid deliverer_id FK
        boolean is_deleted
    }

    WAREHOUSE_RECEIPT_ITEMS {
        uuid id PK
        uuid receipt_id FK
        uuid product_id FK
        decimal document_quantity "Số lượng theo chứng từ"
        decimal actual_quantity "Số lượng thực nhập"
        decimal unit_price "Đơn giá"
        decimal line_total "Thành tiền"
        integer sort_order "Thứ tự sắp xếp"
        timestamp created_at
        timestamp updated_at
        boolean is_deleted
    }

    PRODUCTS {
        uuid id PK
        string code "Mã SP"
        string name "Tên SP"
        string unit "Đơn vị tính"
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    WAREHOUSES {
        uuid id PK
        string name "Tên kho"
        string address "Địa chỉ"
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_STOCKS {
        uuid product_id PK, FK
        uuid warehouse_id PK, FK
        decimal quantity "Số lượng tồn"
        decimal total_value "Tổng giá trị"
        timestamp updated_at
        boolean is_deleted
    }

    WAREHOUSE_TRANSACTIONS {
        uuid id PK
        uuid product_id FK
        uuid warehouse_id FK
        uuid receipt_item_id FK
        string transaction_type "Loại giao dịch (IN/OUT/ADJUSTMENT)"
        decimal quantity "Số lượng"
        decimal unit_price "Đơn giá"
        decimal amount "Giá trị"
        timestamp transaction_date "Ngày giao dịch"
        timestamp created_at
        boolean is_deleted
    }

    SUPPLIERS {
        uuid id PK
        string name "Tên nhà cung cấp"
        boolean is_deleted
        timestamp created_at
        timestamp updated_at
        boolean column1
    }

    DEPARTMENT {
        uuid id PK
        uuid division_id FK
        string name "Tên bộ phận"
        timestamp created_at
        timestamp updated_at
        boolean is_deleted
    }

    DIVISION {
        uuid id PK
        string name "Tên đơn vị"
        timestamp created_at
        timestamp updated_at
        boolean is_deleted
    }
    
    DELIVERERS {
        uuid id PK
        string name "Tên người giao"
        timestamp created_at
        timestamp updated_at
        boolean is_deleted
    }
```

Các bảng chính sau:

- **Tổ chức**: `division` (Đơn vị), `department` (Bộ phận).
- **Danh mục**: `suppliers` (Nhà cung cấp), `warehouses` (Kho), `products` (Vật tư), `deliverers` (Người giao).
- **Nghiệp vụ Nhập kho**:
  - `warehouse_receipts`: Thông tin chung của phiếu nhập (Số phiếu, ngày nhập, đối tác...).
  - `warehouse_receipt_items`: Chi tiết từng mặt hàng trong phiếu nhập.
- **Tồn kho & Giao dịch**:
  - `product_stocks`: Lưu trữ số lượng tồn thực tế của vật tư theo từng kho.
  - `warehouse_transactions`: Nhật ký chi tiết mọi biến động xuất/nhập hàng hoá.

