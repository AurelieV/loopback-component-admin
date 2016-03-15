var Promise = require('bluebird');

module.exports = {
  sendError: function(next, error, status) { 
    status = status || '500';
    if (typeof error !== Error) {
      error = new Error(error);
    }
    error.statusCode = error.status = status;
    next(error);
    return Promise.reject(error);
  }
};
