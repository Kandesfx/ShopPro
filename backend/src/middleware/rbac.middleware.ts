import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ApiError } from '../utils/ApiError';

export const rbacMiddleware = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ApiError.forbidden(
          `You do not have permission to access this resource. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const isAdmin = rbacMiddleware('admin');
export const isManager = rbacMiddleware('admin', 'manager');
export const isStaff = rbacMiddleware('admin', 'manager', 'staff');
export const isAccountant = rbacMiddleware('admin', 'accountant');
export const isCustomer = rbacMiddleware('customer');
export const isAdminOrManager = rbacMiddleware('admin', 'manager');
