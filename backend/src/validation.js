const BUSINESS_TYPES = [
  "agency",
  "ecommerce",
  "financial-services",
  "healthcare",
  "hospitality",
  "local-services",
  "real-estate",
  "saas",
  "other"
];

const PRICE_RANGES = ["under-100", "100-299", "300-999", "1000-plus", "not-sure"];
const FEATURE_OPTIONS = [
  "ai-phone-agent",
  "appointment-booking",
  "customer-support",
  "lead-qualification",
  "multilingual-support",
  "analytics",
  "crm-integrations",
  "custom-workflows"
];
const ADOPTION_TIMELINES = ["immediately", "1-3-months", "3-6-months", "exploring"];
const TEAM_SIZES = ["just-me", "2-10", "11-50", "51-200", "200-plus"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE_PATTERN = /^\+[1-9]\d{0,3}$/;
const PHONE_PATTERN = /^[\d\s().-]{6,24}$/;

function requiredString(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim()) {
    return `${field} is required`;
  }
  if (value.trim().length > maxLength) {
    return `${field} must be ${maxLength} characters or fewer`;
  }
  return null;
}

function allowedValue(value, field, options) {
  if (!options.includes(value)) {
    return `${field} must be one of: ${options.join(", ")}`;
  }
  return null;
}

export function validateRegistration(input) {
  const errors = [
    requiredString(input.firstName, "firstName", 80),
    requiredString(input.lastName, "lastName", 80),
    requiredString(input.email, "email", 254),
    requiredString(input.countryCode, "countryCode", 8),
    requiredString(input.phoneNumber, "phoneNumber", 24),
    allowedValue(input.businessType, "businessType", BUSINESS_TYPES)
  ].filter(Boolean);

  if (typeof input.email === "string" && !EMAIL_PATTERN.test(input.email.trim())) {
    errors.push("email must be a valid email address");
  }
  if (typeof input.countryCode === "string" && !COUNTRY_CODE_PATTERN.test(input.countryCode.trim())) {
    errors.push("countryCode must be a valid international dialing code");
  }
  if (typeof input.phoneNumber === "string" && !PHONE_PATTERN.test(input.phoneNumber.trim())) {
    errors.push("phoneNumber must be a valid phone number");
  }
  if (input.businessName !== undefined && input.businessName !== null && typeof input.businessName !== "string") {
    errors.push("businessName must be a string");
  } else if (typeof input.businessName === "string" && input.businessName.trim().length > 160) {
    errors.push("businessName must be 160 characters or fewer");
  }
  if (input.metadata !== undefined) {
    if (!input.metadata || Array.isArray(input.metadata) || typeof input.metadata !== "object") {
      errors.push("metadata must be an object");
    } else if (JSON.stringify(input.metadata).length > 5_000) {
      errors.push("metadata is too large");
    }
  }

  return errors;
}

export function validatePreferences(input) {
  const errors = [
    allowedValue(input.priceRange, "priceRange", PRICE_RANGES),
    requiredString(input.primaryChallenge, "primaryChallenge", 1_000),
    allowedValue(input.adoptionTimeline, "adoptionTimeline", ADOPTION_TIMELINES),
    allowedValue(input.teamSize, "teamSize", TEAM_SIZES)
  ].filter(Boolean);

  if (!Array.isArray(input.desiredFeatures) || input.desiredFeatures.length === 0) {
    errors.push("desiredFeatures must contain at least one feature");
  } else {
    const uniqueFeatures = [...new Set(input.desiredFeatures)];
    if (uniqueFeatures.length > 5) {
      errors.push("desiredFeatures can contain at most 5 features");
    }
    const invalid = uniqueFeatures.filter((feature) => !FEATURE_OPTIONS.includes(feature));
    if (invalid.length) {
      errors.push(`desiredFeatures contains unsupported values: ${invalid.join(", ")}`);
    }
  }

  return errors;
}

export function validateSalesInquiry(input) {
  const errors = [
    requiredString(input.firstName, "firstName", 80),
    requiredString(input.lastName, "lastName", 80),
    requiredString(input.email, "email", 254),
    requiredString(input.countryCode, "countryCode", 8),
    requiredString(input.phoneNumber, "phoneNumber", 24),
    requiredString(input.message, "message", 1_000),
    allowedValue(input.businessType, "businessType", BUSINESS_TYPES)
  ].filter(Boolean);

  if (typeof input.email === "string" && !EMAIL_PATTERN.test(input.email.trim())) {
    errors.push("email must be a valid email address");
  }
  if (typeof input.countryCode === "string" && !COUNTRY_CODE_PATTERN.test(input.countryCode.trim())) {
    errors.push("countryCode must be a valid international dialing code");
  }
  if (typeof input.phoneNumber === "string" && !PHONE_PATTERN.test(input.phoneNumber.trim())) {
    errors.push("phoneNumber must be a valid phone number");
  }
  if (input.businessName !== undefined && input.businessName !== null && typeof input.businessName !== "string") {
    errors.push("businessName must be a string");
  } else if (typeof input.businessName === "string" && input.businessName.trim().length > 160) {
    errors.push("businessName must be 160 characters or fewer");
  }
  if (input.metadata !== undefined) {
    if (!input.metadata || Array.isArray(input.metadata) || typeof input.metadata !== "object") {
      errors.push("metadata must be an object");
    } else if (JSON.stringify(input.metadata).length > 5_000) {
      errors.push("metadata is too large");
    }
  }

  return errors;
}

export const waitlistOptions = {
  businessTypes: BUSINESS_TYPES,
  priceRanges: PRICE_RANGES,
  features: FEATURE_OPTIONS,
  adoptionTimelines: ADOPTION_TIMELINES,
  teamSizes: TEAM_SIZES
};
