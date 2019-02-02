/**
 * @name Exception
 * @description Lightweight Exception class that extends Error object and serves as base of all exceptions
 * @example
 *  Exception()
 *  Exception(type)
 *  Exception(error)
 *  Exception(type, message)
 *  Exception(type, error)
 *  Exception(type, message, error)
 * @params
 *  type: string - error name or type
 *  message: string - error message
 *  error: object - inner error or exception object
 * @constructs Exception object
 * @throws
 *  None
 */  
flair.Exception = _Exception;

// add to members list
flair.members.push('Exception');