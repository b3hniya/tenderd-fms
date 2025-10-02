export type APIError = {
  statusCode: number;
  message: string;
  type: "APIError";
};

export const createAPIError = (statusCode: number, message: string) => ({
  statusCode,
  message,
  type: "APIError",
});

export class NotFoundError extends Error {
  public statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  public statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}
