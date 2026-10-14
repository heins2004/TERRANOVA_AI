const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export type ProfileFormValues = {
  name: string;
  phone: string;
  city: string;
  organization: string;
  designation: string;
  expertise: string;
};

export function validateProfileForm(
  values: ProfileFormValues,
  isPlanner: boolean,
  isOfficial: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const trimmedName = values.name.trim();
  if (!trimmedName) {
    errors.name = "Name is required.";
  } else if (trimmedName.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (/\d/.test(trimmedName)) {
    errors.name = "Name cannot contain digits.";
  } else if (trimmedName.length > 150) {
    errors.name = "Name cannot exceed 150 characters.";
  }

  const trimmedPhone = values.phone.trim();
  if (trimmedPhone) {
    const cleaned = trimmedPhone.replace(/[\s-]/g, "");
    const normalized = cleaned.startsWith("+91")
      ? cleaned.slice(3)
      : cleaned.startsWith("0") && cleaned.length === 11
        ? cleaned.slice(1)
        : cleaned;

    if (!INDIAN_PHONE_REGEX.test(normalized)) {
      errors.phone = "Must be a valid 10-digit Indian number starting 6-9.";
    }
  }

  if (values.city.trim().length > 100) {
    errors.city = "City cannot exceed 100 characters.";
  }

  if (isPlanner || isOfficial) {
    if (values.organization.trim().length > 100) {
      errors.organization = "Organization cannot exceed 100 characters.";
    }
  }
  if (isOfficial && values.designation.trim().length > 100) {
    errors.designation = "Designation cannot exceed 100 characters.";
  }
  if (isPlanner && values.expertise.trim().length > 300) {
    errors.expertise = "Expertise cannot exceed 300 characters.";
  }

  return errors;
}
