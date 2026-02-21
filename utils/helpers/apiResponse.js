class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(res, message = 'Success', data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }

  static error(res, message = 'Error', statusCode = 500, data = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
  }
}

module.exports = ApiResponse;