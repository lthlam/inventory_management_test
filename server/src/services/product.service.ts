import { ProductRepository, Product } from '../repositories/product.repository';

const getAllProducts = async (): Promise<Product[]> => {
  return ProductRepository.findAll();
};

export const ProductService = {
  getAllProducts
};
