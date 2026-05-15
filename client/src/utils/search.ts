export const normalizeSearchText = (value: unknown) => {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

export const includesNormalized = (value: unknown, filterValue: unknown) => {
  return normalizeSearchText(value).includes(normalizeSearchText(filterValue));
};
