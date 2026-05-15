"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-slate-800 mb-8 rounded-2xl px-8 py-5 flex justify-between items-center border border-slate-700">
      <div className="flex items-center space-x-10">
        <nav className="hidden md:flex items-center space-x-2">
          <Link href="/receipts" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Phiếu Nhập Kho
          </Link>
          <Link href="/products" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Danh Mục Vật Tư
          </Link>
          <Link href="/warehouses" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Danh Sách Kho
          </Link>
          <Link href="/organization" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Đơn Vị / Bộ Phận
          </Link>
          <Link href="/suppliers" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Nhà Cung Cấp
          </Link>
          <Link href="/deliverers" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Người Giao
          </Link>
          <Link href="/inventory" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Tồn Kho
          </Link>
          <Link href="/transactions" className="text-slate-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5 active:scale-95">
            Lịch Sử Giao Dịch
          </Link>
        </nav>
      </div>
    </header>
  );
}
