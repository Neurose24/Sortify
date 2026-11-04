
export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);

    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}
