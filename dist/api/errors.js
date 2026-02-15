export class HttpError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype); // important for instanceof
    }
}
export class BadRequestError extends HttpError {
    constructor(message) {
        super(400, message);
    }
}
export class UserNotAuthenticatedError extends HttpError {
    constructor(message) {
        super(401, message);
    }
}
export class UserForbiddenError extends HttpError {
    constructor(message) {
        super(403, message);
    }
}
export class NotFoundError extends HttpError {
    constructor(message) {
        super(404, message);
    }
}
