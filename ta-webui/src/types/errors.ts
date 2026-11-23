export interface FieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fields: FieldError[];
  readonly code?: string;

  constructor(status: number, message: string, fields: FieldError[] = [], code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}
