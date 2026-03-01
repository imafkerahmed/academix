import pb from "./pocketbase";

/**
 * Generates unique registration number in format: ACD-INT2026MAR-BBM-001
 * @param intakeCode - Full intake code (e.g., "INT/2026/MAR")
 * @param courseCode - Full course code (e.g., "BBM/MARCH/2026")
 * @returns Promise<string> - Unique registration number
 */
export async function generateRegistrationNumber(
  intakeCode: string,
  courseCode: string,
): Promise<string> {
  const prefix = "ACD";
  const intakePart = normalizeIntakeCode(intakeCode);
  const coursePart = extractCourseCodePrefix(courseCode);

  // Build pattern for this intake-course combination
  const basePattern = `${prefix}-${intakePart}-${coursePart}`;

  // Find highest sequence number for this pattern
  const existingCodes = await pb
    .collection("used_registration_codes")
    .getFullList({
      filter: `intake_code = "${intakeCode}" && course_code = "${courseCode}"`,
      sort: "-sequence_number",
    })
    .catch(() => []);

  const nextSequence =
    existingCodes.length > 0 ? existingCodes[0].sequence_number + 1 : 1;

  const sequenceStr = String(nextSequence).padStart(3, "0");
  const registrationNumber = `${basePattern}-${sequenceStr}`;

  // Store in permanent tracking table
  await pb.collection("used_registration_codes").create({
    registration_number: registrationNumber,
    intake_code: intakeCode,
    course_code: courseCode,
    sequence_number: nextSequence,
  });

  return registrationNumber;
}

/**
 * Normalize intake code: "INT/2026/MAR" → "INT2026MAR"
 */
function normalizeIntakeCode(code: string): string {
  return code.replace(/\//g, "").toUpperCase();
}

/**
 * Extract course prefix: "BBM/MARCH/2026" → "BBM"
 */
function extractCourseCodePrefix(code: string): string {
  const parts = code.split("/");
  return parts[0].toUpperCase();
}

/**
 * Generate installment ID from registration number
 * @param registrationNumber - e.g., "ACD-INT2026MAR-BBM-001"
 * @param installmentNumber - 1, 2, 3...
 * @returns "INST-ACD2026MAR001-01"
 */
export function generateInstallmentId(
  registrationNumber: string,
  installmentNumber: number,
): string {
  // Extract base: "ACD-INT2026MAR-BBM-001" → "ACD2026MAR001"
  const parts = registrationNumber.split("-");
  const base = parts[0] + parts[1].replace(/INT/g, "") + parts[3];

  const seqStr = String(installmentNumber).padStart(2, "0");
  return `INST-${base}-${seqStr}`;
}

/**
 * Generate payment reference ID
 * @param registrationNumber - e.g., "ACD-INT2026MAR-BBM-001"
 * @param paymentType - "registration", "upfront", or "installment"
 * @param installmentNumber - Optional, for installment payments
 * @returns e.g., "PAY-ACD2026MAR001-REG"
 */
export function generatePaymentReferenceId(
  registrationNumber: string,
  paymentType: "registration" | "upfront" | "installment",
  installmentNumber?: number,
): string {
  const parts = registrationNumber.split("-");
  const base = parts[0] + parts[1].replace(/INT/g, "") + parts[3];

  let suffix = "";
  switch (paymentType) {
    case "registration":
      suffix = "REG";
      break;
    case "upfront":
      suffix = "UPF";
      break;
    case "installment":
      suffix = installmentNumber
        ? `I${String(installmentNumber).padStart(2, "0")}`
        : "I00";
      break;
  }

  return `PAY-${base}-${suffix}`;
}
