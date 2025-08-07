export const validateRequiredFields = (
  reqBody: any,
  requiredFields: string[]
): string[] => {
  const missingFields: string[] = [];
  for (const field of requiredFields) {
    if (!reqBody[field]) {
      missingFields.push(field);
    }
  }
  return missingFields;
};
