import { WarehouseRepository, Warehouse } from '../repositories/warehouse.repository';

const getAllWarehouses = async (): Promise<Warehouse[]> => {
  return WarehouseRepository.findAll();
};

const createWarehouse = async (data: { name: string; address?: string }): Promise<Warehouse> => {
  const normalizedName = data.name.trim();
  
  const existingWarehouse = await WarehouseRepository.findByName(normalizedName);
  if (existingWarehouse) {
    return existingWarehouse;
  }

  return await WarehouseRepository.create(normalizedName, data.address);
};

export const WarehouseService = {
  getAllWarehouses,
  createWarehouse
};
