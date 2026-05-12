export const DOMAIN_ERROR_STATUS = {
  INVALID_QUERY_PARAMS: 400,
  INVALID_FILTER_PARAMS: 400,
  MISSING_FILE: 400,
  UNSUPPORTED_FILE_TYPE: 400,
  INVALID_FILE: 400,
  NO_SHEET_RECOGNIZED: 422,
  IMPORT_NOT_FOUND: 404,
  IMPORT_ALREADY_CONFIRMED: 409,
  IMPORT_FAILED_STATE: 409,
  IMPORT_UNKNOWN_TEMPLATE: 422,
  IMPORT_ORIGINAL_FILE_MISSING: 409,
  IMPORT_REFERENCE_NOT_FOUND: 422,
} as const;

export type DomainErrorCode = keyof typeof DOMAIN_ERROR_STATUS;

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

export function isDomainError(err: unknown): err is DomainError {
  return err instanceof DomainError;
}

export function getDomainErrorStatus(code: DomainErrorCode): number {
  return DOMAIN_ERROR_STATUS[code];
}
