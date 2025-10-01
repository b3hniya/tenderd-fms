export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: any;
  timestamp: Date;
  path?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}
