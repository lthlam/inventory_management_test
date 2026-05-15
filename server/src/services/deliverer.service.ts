import { Deliverer, DelivererRepository } from '../repositories/deliverer.repository';

const getAllDeliverers = async (): Promise<Deliverer[]> => {
  return DelivererRepository.findAll();
};

const createDeliverer = async (data: { name: string }): Promise<Deliverer> => {
  const normalizedName = data.name.trim();

  const existingDeliverer = await DelivererRepository.findByName(normalizedName);
  if (existingDeliverer) {
    return existingDeliverer;
  }

  return DelivererRepository.create(normalizedName);
};

export const DelivererService = {
  getAllDeliverers,
  createDeliverer
};
