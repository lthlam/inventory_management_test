import { SupplierRepository, Supplier } from '../repositories/supplier.repository';

const getAllSuppliers = async (): Promise<Supplier[]> => {
  return SupplierRepository.findAll();
};

const createSupplier = async (data: { name: string }): Promise<Supplier> => {
  const normalizedName = data.name.trim();
  
  const existingSupplier = await SupplierRepository.findByName(normalizedName);
  if (existingSupplier) {
    return existingSupplier;
  }

  return await SupplierRepository.create(normalizedName);
};

export const SupplierService = {
  getAllSuppliers,
  createSupplier
};
