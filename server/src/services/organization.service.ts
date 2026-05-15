import {
  DepartmentOption,
  DivisionOption,
  OrganizationRepository
} from '../repositories/organization.repository';
import { AppError } from '../utils/app.error';

const getAllDivisions = async (): Promise<DivisionOption[]> => {
  return OrganizationRepository.findAllDivisions();
};

const getAllDepartments = async (divisionId?: string): Promise<DepartmentOption[]> => {
  return OrganizationRepository.findAllDepartments(divisionId);
};

const createDivision = async (data: { name: string }): Promise<DivisionOption> => {
  const normalizedName = data.name.trim();

  const existingDivision = await OrganizationRepository.findDivisionByName(normalizedName);
  if (existingDivision) {
    return existingDivision;
  }

  return OrganizationRepository.createDivision(normalizedName);
};

const createDepartment = async (data: { divisionId: string; name: string }): Promise<DepartmentOption> => {
  const normalizedName = data.name.trim();
  const divisionExists = await OrganizationRepository.divisionExistsById(data.divisionId);
  if (!divisionExists) {
    throw new AppError(400, 'Không tìm thấy đơn vị', 'DIVISION_NOT_FOUND');
  }

  const existingDepartment = await OrganizationRepository.findDepartmentByDivisionAndName(
    data.divisionId,
    normalizedName
  );
  if (existingDepartment) {
    return existingDepartment;
  }

  return OrganizationRepository.createDepartment(data.divisionId, normalizedName);
};

export const OrganizationService = {
  getAllDivisions,
  getAllDepartments,
  createDivision,
  createDepartment
};
