export interface EnrollmentFeeCalculation {
  total_course_fee: number;
  registration_fee_amount: number;
  discount_amount: number;
  fee_after_discount: number;
  upfront_payment: number;
  installment_amount: number;
  installment_count: number;
  months_remaining: number;
}

/**
 * Calculate all enrollment fees based on payment option and discount
 * @param courseFee - Base course fee from course_intake_fees
 * @param registrationFee - Registration fee from course_intake_fees
 * @param duration - Course duration in months
 * @param paymentOption - Payment structure chosen
 * @param includeRegistrationFee - Whether to include registration fee
 * @param discountType - Type of discount (percentage or flat amount)
 * @param discountValue - Discount value (percentage number or flat LKR)
 * @param customUpfrontAmount - For upfront_installments: admin-entered upfront amount (excluding reg fee)
 * @returns Complete fee breakdown
 */
export function calculateEnrollmentFees(
  courseFee: number,
  registrationFee: number,
  duration: number,
  paymentOption: "full_payment" | "upfront_installments" | "installments_only",
  includeRegistrationFee: boolean,
  discountType: "percentage" | "flat" | null,
  discountValue: number,
  customUpfrontAmount?: number,
): EnrollmentFeeCalculation {
  // Apply discount to course fee
  let discountAmount = 0;
  if (discountType === "percentage") {
    discountAmount = (courseFee * discountValue) / 100;
  } else if (discountType === "flat") {
    discountAmount = Math.min(discountValue, courseFee); // Can't discount more than course fee
  }

  const feeAfterDiscount = Math.max(0, courseFee - discountAmount);
  const registrationFeeAmount = includeRegistrationFee ? registrationFee : 0;

  // Calculate payments based on option
  let upfrontPayment = 0;
  let installmentAmount = 0;
  let installmentCount = 0;
  let monthsRemaining = duration;

  switch (paymentOption) {
    case "full_payment":
      // Pay everything upfront
      upfrontPayment = feeAfterDiscount + registrationFeeAmount;
      installmentAmount = 0;
      installmentCount = 0;
      monthsRemaining = 0;
      break;

    case "upfront_installments":
      // Admin enters a custom upfront amount; registration fee is always on top (separate)
      // Balance (feeAfterDiscount - customUpfront) splits into (duration - 1) installments
      const clampedUpfront = Math.min(
        Math.max(customUpfrontAmount || 0, 0),
        feeAfterDiscount,
      );
      upfrontPayment = registrationFeeAmount + clampedUpfront;
      const remainingBalance = Math.max(0, feeAfterDiscount - clampedUpfront);
      installmentCount = duration > 1 ? duration - 1 : 1;
      installmentAmount =
        installmentCount > 0 ? remainingBalance / installmentCount : 0;
      monthsRemaining = installmentCount;
      break;

    case "installments_only":
      // Only pay registration upfront (if enabled), course fee all in installments
      upfrontPayment = registrationFeeAmount;
      installmentCount = duration;
      installmentAmount = feeAfterDiscount / duration;
      monthsRemaining = duration;
      break;
  }

  return {
    total_course_fee: courseFee,
    registration_fee_amount: registrationFeeAmount,
    discount_amount: Math.round(discountAmount * 100) / 100,
    fee_after_discount: Math.round(feeAfterDiscount * 100) / 100,
    upfront_payment: Math.round(upfrontPayment * 100) / 100,
    installment_amount: Math.round(installmentAmount * 100) / 100,
    installment_count: installmentCount,
    months_remaining: monthsRemaining,
  };
}
