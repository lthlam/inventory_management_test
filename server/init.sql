--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3 (Ubuntu 18.3-1)
-- Dumped by pg_dump version 18.3 (Ubuntu 18.3-1)

-- Started on 2026-05-15 19:36:12 +07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16925)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3666 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 229 (class 1259 OID 17163)
-- Name: deliverers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deliverers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.deliverers OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17145)
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    division_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.department OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17133)
-- Name: division; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.division (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.division OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17097)
-- Name: product_stocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_stocks (
    product_id uuid CONSTRAINT inventory_balances_product_id_not_null NOT NULL,
    warehouse_id uuid CONSTRAINT inventory_balances_warehouse_id_not_null NOT NULL,
    quantity numeric(18,3) DEFAULT 0 CONSTRAINT inventory_balances_quantity_not_null NOT NULL,
    total_value numeric(18,2) DEFAULT 0 CONSTRAINT inventory_balances_total_value_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_balances_updated_at_not_null NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_product_stock_quantity CHECK ((quantity >= (0)::numeric)),
    CONSTRAINT chk_product_stock_total_value CHECK ((total_value >= (0)::numeric))
);


ALTER TABLE public.product_stocks OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16936)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(100) NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16975)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    column1 boolean DEFAULT false NOT NULL
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 17027)
-- Name: warehouse_receipt_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_receipt_items (
    id uuid DEFAULT public.uuid_generate_v4() CONSTRAINT inventory_receipt_items_id_not_null NOT NULL,
    receipt_id uuid CONSTRAINT inventory_receipt_items_receipt_id_not_null NOT NULL,
    product_id uuid CONSTRAINT inventory_receipt_items_product_id_not_null NOT NULL,
    document_quantity numeric(18,3) DEFAULT 0 CONSTRAINT inventory_receipt_items_document_quantity_not_null NOT NULL,
    actual_quantity numeric(18,3) CONSTRAINT inventory_receipt_items_actual_quantity_not_null NOT NULL,
    unit_price numeric(18,2) CONSTRAINT inventory_receipt_items_unit_price_not_null NOT NULL,
    line_total numeric(18,2) CONSTRAINT inventory_receipt_items_line_total_not_null NOT NULL,
    sort_order integer DEFAULT 0 CONSTRAINT inventory_receipt_items_sort_order_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_receipt_items_created_at_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_receipt_items_updated_at_not_null NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_warehouse_receipt_item_actual_quantity CHECK ((actual_quantity > (0)::numeric)),
    CONSTRAINT chk_warehouse_receipt_item_document_quantity CHECK ((document_quantity >= (0)::numeric)),
    CONSTRAINT chk_warehouse_receipt_item_line_total CHECK ((line_total >= (0)::numeric)),
    CONSTRAINT chk_warehouse_receipt_item_unit_price CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.warehouse_receipt_items OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16989)
-- Name: warehouse_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_receipts (
    id uuid DEFAULT public.uuid_generate_v4() CONSTRAINT inventory_receipts_id_not_null NOT NULL,
    receipt_no character varying(50) CONSTRAINT inventory_receipts_receipt_no_not_null NOT NULL,
    receipt_date date CONSTRAINT inventory_receipts_receipt_date_not_null NOT NULL,
    department_id character varying(255) CONSTRAINT inventory_receipts_department_id_not_null NOT NULL,
    warehouse_id uuid CONSTRAINT inventory_receipts_warehouse_id_not_null NOT NULL,
    supplier_id uuid CONSTRAINT inventory_receipts_supplier_id_not_null NOT NULL,
    invoice_document text CONSTRAINT inventory_receipts_reference_document_not_null NOT NULL,
    invoice_date date CONSTRAINT inventory_receipts_reference_date_not_null NOT NULL,
    debit_account character varying(50) CONSTRAINT inventory_receipts_debit_account_not_null NOT NULL,
    credit_account character varying(50) CONSTRAINT inventory_receipts_credit_account_not_null NOT NULL,
    total_amount numeric(18,2) DEFAULT 0 CONSTRAINT inventory_receipts_total_amount_not_null NOT NULL,
    attached_document_count integer DEFAULT 0 CONSTRAINT inventory_receipts_attached_document_count_not_null NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying CONSTRAINT inventory_receipts_status_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_receipts_created_at_not_null NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_receipts_updated_at_not_null NOT NULL,
    deliverer_id uuid,
    is_deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_warehouse_receipt_attached_document_count CHECK ((attached_document_count >= 0)),
    CONSTRAINT chk_warehouse_receipt_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'POSTED'::character varying, 'CANCELLED'::character varying])::text[]))),
    CONSTRAINT chk_warehouse_receipt_total_amount CHECK ((total_amount >= (0)::numeric))
);


ALTER TABLE public.warehouse_receipts OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17061)
-- Name: warehouse_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouse_transactions (
    id uuid DEFAULT public.uuid_generate_v4() CONSTRAINT inventory_transactions_id_not_null NOT NULL,
    product_id uuid CONSTRAINT inventory_transactions_product_id_not_null NOT NULL,
    warehouse_id uuid CONSTRAINT inventory_transactions_warehouse_id_not_null NOT NULL,
    receipt_item_id uuid CONSTRAINT inventory_transactions_receipt_item_id_not_null NOT NULL,
    transaction_type character varying(20) CONSTRAINT inventory_transactions_transaction_type_not_null NOT NULL,
    quantity numeric(18,3) CONSTRAINT inventory_transactions_quantity_not_null NOT NULL,
    unit_price numeric(18,2) CONSTRAINT inventory_transactions_unit_price_not_null NOT NULL,
    amount numeric(18,2) CONSTRAINT inventory_transactions_amount_not_null NOT NULL,
    transaction_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_transactions_transaction_date_not_null NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT inventory_transactions_created_at_not_null NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_warehouse_transaction_amount CHECK ((amount >= (0)::numeric)),
    CONSTRAINT chk_warehouse_transaction_quantity CHECK ((quantity > (0)::numeric)),
    CONSTRAINT chk_warehouse_transaction_type CHECK (((transaction_type)::text = ANY ((ARRAY['IN'::character varying, 'OUT'::character varying, 'ADJUSTMENT'::character varying])::text[]))),
    CONSTRAINT chk_warehouse_transaction_unit_price CHECK ((unit_price >= (0)::numeric))
);


ALTER TABLE public.warehouse_transactions OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16956)
-- Name: warehouses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warehouses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    address text NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.warehouses OWNER TO postgres;



--
-- TOC entry 3492 (class 2606 OID 17172)
-- Name: deliverers deliverers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deliverers
    ADD CONSTRAINT deliverers_pkey PRIMARY KEY (id);


--
-- TOC entry 3488 (class 2606 OID 17157)
-- Name: department department_division_id_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_division_id_name_key UNIQUE (division_id, name);


--
-- TOC entry 3490 (class 2606 OID 17155)
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (id);


--
-- TOC entry 3484 (class 2606 OID 17144)
-- Name: division division_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.division
    ADD CONSTRAINT division_name_key UNIQUE (name);


--
-- TOC entry 3486 (class 2606 OID 17142)
-- Name: division division_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.division
    ADD CONSTRAINT division_pkey PRIMARY KEY (id);


--
-- TOC entry 3482 (class 2606 OID 17111)
-- Name: product_stocks product_stocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT product_stocks_pkey PRIMARY KEY (product_id, warehouse_id);


--
-- TOC entry 3466 (class 2606 OID 16955)
-- Name: products products_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_code_key UNIQUE (code);


--
-- TOC entry 3468 (class 2606 OID 16953)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 3472 (class 2606 OID 16988)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 3478 (class 2606 OID 17050)
-- Name: warehouse_receipt_items warehouse_receipt_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipt_items
    ADD CONSTRAINT warehouse_receipt_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3474 (class 2606 OID 17014)
-- Name: warehouse_receipts warehouse_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_pkey PRIMARY KEY (id);


--
-- TOC entry 3476 (class 2606 OID 17016)
-- Name: warehouse_receipts warehouse_receipts_receipt_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT warehouse_receipts_receipt_no_key UNIQUE (receipt_no);


--
-- TOC entry 3480 (class 2606 OID 17081)
-- Name: warehouse_transactions warehouse_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_transactions
    ADD CONSTRAINT warehouse_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3470 (class 2606 OID 16972)
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- TOC entry 3503 (class 2606 OID 17158)
-- Name: department department_division_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department
    ADD CONSTRAINT department_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.division(id);


--
-- TOC entry 3501 (class 2606 OID 17112)
-- Name: product_stocks inventory_balances_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT inventory_balances_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3502 (class 2606 OID 17117)
-- Name: product_stocks inventory_balances_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_stocks
    ADD CONSTRAINT inventory_balances_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3496 (class 2606 OID 17056)
-- Name: warehouse_receipt_items inventory_receipt_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipt_items
    ADD CONSTRAINT inventory_receipt_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3497 (class 2606 OID 17051)
-- Name: warehouse_receipt_items inventory_receipt_items_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipt_items
    ADD CONSTRAINT inventory_receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.warehouse_receipts(id) ON DELETE CASCADE;


--
-- TOC entry 3493 (class 2606 OID 17173)
-- Name: warehouse_receipts inventory_receipts_deliverer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT inventory_receipts_deliverer_id_fkey FOREIGN KEY (deliverer_id) REFERENCES public.deliverers(id);


--
-- TOC entry 3494 (class 2606 OID 17022)
-- Name: warehouse_receipts inventory_receipts_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT inventory_receipts_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- TOC entry 3495 (class 2606 OID 17017)
-- Name: warehouse_receipts inventory_receipts_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_receipts
    ADD CONSTRAINT inventory_receipts_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- TOC entry 3498 (class 2606 OID 17082)
-- Name: warehouse_transactions inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 3499 (class 2606 OID 17092)
-- Name: warehouse_transactions inventory_transactions_receipt_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_transactions
    ADD CONSTRAINT inventory_transactions_receipt_item_id_fkey FOREIGN KEY (receipt_item_id) REFERENCES public.warehouse_receipt_items(id);


--
-- TOC entry 3500 (class 2606 OID 17087)
-- Name: warehouse_transactions inventory_transactions_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warehouse_transactions
    ADD CONSTRAINT inventory_transactions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


-- Completed on 2026-05-15 19:36:12 +07

--
-- PostgreSQL database dump complete
--


