export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-OM', {
    style: 'currency',
    currency: 'OMR',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
    numberingSystem: 'latn' // Use Latin (English) numerals
  }).format(amount);
};
