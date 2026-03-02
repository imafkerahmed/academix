import pb from "./pocketbase";

/**
 * Generates unique registration number in format: ACD-INTMAR2026-BBM-001
 * @param intakeCode - Full intake code (e.g., "INT/MAR/2026" or "INT/2026/MAR")
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

  // Find all records matching this exact prefix pattern
  const existingCodes = await pb
    .collection("used_registration_codes")
    .getFullList({
      filter: `intake_code = "${intakeCode}" && course_code = "${courseCode}" && registration_number ~ "${basePattern}-"`,
    })
    .catch(() => []);

  // Extract sequence numbers from registration_number strings and find the max
  let maxSequence = 0;
  for (const record of existingCodes) {
    const regNum = record.registration_number as string;
    // Extract the last segment (e.g., "001" from "ACD-INTMAR2026-BBM-001")
    const match = regNum.match(/-(\d+)$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSequence) {
        maxSequence = seq;
      }
    }
  }

  const nextSequence = maxSequence + 1;
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
 * Normalize intake code to always produce: "INT" + month + year
 * Handles both "INT/MAR/2026" and "INT/2026/MAR" input formats.
 * e.g. "INT/MAR/2026" → "INTMAR2026"
 *      "INT/2026/MAR" → "INTMAR2026"
 */
function normalizeIntakeCode(code: string): string {
  const parts = code.toUpperCase().split("/");
  if (parts.length === 3) {
    const prefix = parts[0]; // e.g. "INT"
    const yearPart = parts.find((p) => /^\d{4}$/.test(p)) || "";
    const monthPart =
      parts.find((p) => !/^\d{4}$/.test(p) && p !== prefix) || "";
    return prefix + monthPart + yearPart;
  }
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
 * Rolls back a registration number if enrollment creation fails.
 * Deletes the used_registration_codes record so the sequence slot is freed.
 */
export async function rollbackRegistrationNumber(
  registrationNumber: string,
): Promise<void> {
  try {
    const records = await pb.collection("used_registration_codes").getFullList({
      filter: `registration_number = "${registrationNumber}"`,
    });
    await Promise.all(
      records.map((r) => pb.collection("used_registration_codes").delete(r.id)),
    );
  } catch {
    // Best-effort — silent fail
  }
}

/**
 * Generate installment ID from registration number
 * @param registrationNumber - e.g., "ACD-INTMAR2026-BBM-001"
 * @param installmentNumber - 1, 2, 3...
 * @returns "ACD-INTMAR2026-BBM-001-I01"
 */
export function generateInstallmentId(
  registrationNumber: string,
  installmentNumber: number,
): string {
  const seqStr = String(installmentNumber).padStart(2, "0");
  return `${registrationNumber}-I${seqStr}`;
}

/**
 * Generate payment reference ID
 * @param registrationNumber - e.g., "ACD-INT2026MAR-BBM-001"
 * @param paymentType - "registration", "upfront", "full_payment", or "installment"
 * @param installmentNumber - Optional, for installment payments
 * @returns e.g., "PAY-ACD2026MAR001-REG"
 */
export function generatePaymentReferenceId(
  registrationNumber: string,
  paymentType: "registration" | "upfront" | "full_payment" | "installment",
  installmentNumber?: number,
): string {
  const parts = registrationNumber.split("-");
  const base = parts[0] + parts[1].replace(/^INT/i, "") + parts[3];

  let suffix = "";
  switch (paymentType) {
    case "registration":
      suffix = "REG";
      break;
    case "upfront":
      suffix = "UPF";
      break;
    case "full_payment":
      suffix = "FUL";
      break;
    case "installment":
      suffix = installmentNumber
        ? `I${String(installmentNumber).padStart(2, "0")}`
        : "I00";
      break;
  }

  return `PAY-${base}-${suffix}`;
}
