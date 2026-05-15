import { InventoryListItem, InventoryRepository } from '../repositories/inventory.repository';

const getAllInventory = async (): Promise<InventoryListItem[]> => {
  return InventoryRepository.findAllWithDetails();
};

export const InventoryService = {
  getAllInventory,
};
