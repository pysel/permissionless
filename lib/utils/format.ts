export const formatUsdAmount = (amount: number) => {
  amount = amount / 1e8;
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(2)}`;
  }
}; 

export const calculateLoanStatus = (loan: any) => {
  if (!loan) return { status: 'unknown', color: 'bg-gray-100 text-gray-800', percentage: 0 };
  
  const initialLoanValue = Number(loan.initialLoanValue);
  const currentLoanValue = Number(loan.currentLoanValue);
  const collateralCurrentValue = Number(loan.collateralCurrentValue);
  
  const diff = currentLoanValue + collateralCurrentValue - initialLoanValue;
  const fraction = diff / collateralCurrentValue;

  if (!loan.isActive) {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-800', percentage: 0 };
  }
  
  if (fraction > 0.7) {
    return { status: 'good', color: 'bg-green-100 text-green-800', percentage: Math.round(fraction * 100) };
  } else if (fraction > 0.15) {
    return { status: 'medium', color: 'bg-yellow-100 text-yellow-800', percentage: Math.round(fraction * 100) };
  } else {
    return { status: 'bad', color: 'bg-red-100 text-red-800', percentage: Math.round(fraction * 100) };
  }
};