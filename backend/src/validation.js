const BUSINESS_TYPES = [
  "agency",
  "accounting-tax",
  "automotive",
  "beauty-wellness",
  "construction",
  "education",
  "ecommerce",
  "financial-services",
  "government",
  "healthcare",
  "home-services",
  "hospitality",
  "insurance",
  "it-services",
  "legal",
  "local-services",
  "logistics",
  "manufacturing",
  "marketing-agency",
  "non-profit",
  "real-estate",
  "recruitment-staffing",
  "restaurants",
  "retail",
  "saas",
  "telecommunications",
  "travel-tourism",
  "other"
];

const PRICE_RANGES = ["under-100", "100-299", "100-300", "300-700", "300-999", "700-1500", "1000-plus", "1500-3000", "3000-plus", "not-sure"];
const FEATURE_OPTIONS = [
  "ai-phone-agent",
  "human-like-conversations",
  "appointment-booking",
  "customer-support",
  "crm-integrations",
  "multilingual-support",
  "24-7-availability",
  "human-handoff",
  "lead-qualification",
  "call-recording-transcripts",
  "analytics-reporting",
  "analytics",
  "knowledge-base-integration",
  "custom-workflows",
  "outbound-calling",
  "whatsapp-integration",
  "email-automation",
  "existing-phone-number-support",
  "fast-response-times",
  "other"
];
const ADOPTION_TIMELINES = ["immediately", "within-30-days", "1-3-months", "3-6-months", "6-plus-months", "exploring"];
const TEAM_SIZES = ["just-me", "2-10", "11-25", "11-50", "26-50", "51-100", "51-200", "101-250", "200-plus", "251-500", "501-1000", "1000-plus"];
const ROLES = ["founder", "co-founder", "ceo", "coo", "operations-manager", "sales-manager", "customer-success-manager", "customer-support-manager", "marketing-manager", "it-engineering", "other"];
const CHALLENGES = ["missing-customer-calls", "spending-too-much-time-answering-repetitive-questions", "high-hiring-and-staffing-costs", "overloaded-support-team", "inconsistent-lead-follow-ups", "slow-response-times", "lack-of-after-hours-support", "too-many-manual-processes", "improving-customer-experience", "automating-business-operations", "exploring-voice-ai-for-the-business", "other"];
const CALL_HANDLING = ["receptionist", "customer-support-team", "call-center", "ivr-interactive-voice-response", "employees-answer-calls-directly", "voicemail", "no-structured-process", "a-combination-of-the-above", "other"];
const DAILY_CALLS = ["under-20", "20-50", "50-100", "100-300", "300-1000", "1000-plus", "not-sure"];
const REFERRAL_SOURCES = ["google-search", "linkedin", "instagram", "x-twitter", "youtube", "referral", "friend-or-colleague", "event-or-conference", "other"];
const HELP_OPTIONS = ["answer-incoming-calls", "book-appointments", "customer-support", "qualify-leads", "make-outbound-calls", "follow-up-with-customers", "send-appointment-reminders", "answer-faqs", "route-calls-to-the-right-person", "update-our-crm", "collect-customer-information", "process-orders", "payment-reminders", "collect-customer-feedback", "technical-support", "hr-and-recruitment-calls", "internal-employee-support", "other"];
const SOFTWARE_OPTIONS = ["salesforce", "hubspot", "zoho-crm", "pipedrive", "microsoft-dynamics", "freshworks-crm", "twilio", "aircall", "ringcentral", "five9", "whatsapp-business", "zendesk", "intercom", "freshdesk", "google-workspace", "microsoft-365", "slack", "microsoft-teams", "calendly", "shopify", "woocommerce", "none", "other"];

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

function allowedSelections(value, field, options) {
  if (!Array.isArray(value) || value.length === 0) return `${field} must contain at least one selection`;
  const invalid = [...new Set(value)].filter((item) => !options.includes(item));
  return invalid.length ? `${field} contains unsupported values: ${invalid.join(", ")}` : null;
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
    if (uniqueFeatures.length > 16) {
      errors.push("desiredFeatures can contain at most 16 features");
    }
    const invalid = uniqueFeatures.filter((feature) => {
      if (FEATURE_OPTIONS.includes(feature)) return false;
      return typeof feature !== "string" || !/^custom:.{1,100}$/.test(feature.trim());
    });
    if (invalid.length) {
      errors.push(`desiredFeatures contains unsupported values: ${invalid.join(", ")}`);
    }
  }

  return errors;
}

export function validateWaitlistSubmission(input) {
  return [
    ...validateRegistration(input),
    ...validatePreferences(input),
    allowedValue(input.role, "role", ROLES),
    allowedSelections(input.helpWith, "helpWith", HELP_OPTIONS),
    allowedSelections(input.biggestChallenges, "biggestChallenges", CHALLENGES),
    allowedSelections(input.callHandlings, "callHandlings", CALL_HANDLING),
    allowedSelections(input.software, "software", SOFTWARE_OPTIONS),
    allowedSelections(input.dailyCalls, "dailyCalls", DAILY_CALLS),
    allowedValue(input.referralSource, "referralSource", REFERRAL_SOURCES)
  ].filter(Boolean);
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
