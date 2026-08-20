const BR_MOBILE_PHONE = /^\(\d{2}\) 9\d{4}-\d{4}$/;

/**
 * Validates a Brazilian mobile phone number in the "(DD) 9XXXX-XXXX" format.
 */
export function isValidPhone(phone: string): boolean {
  return BR_MOBILE_PHONE.test(phone);
}
