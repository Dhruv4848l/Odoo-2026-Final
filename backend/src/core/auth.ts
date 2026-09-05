import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  employee_id: number;
  role: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-secret-key-2026';

export const generateToken = (payload: AuthUser): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Demo fallback: default to HR Payroll Manager user if no token header provided
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      employee_id: 1,
      role: 'HR Payroll Manager',
      email: 'amara.chen@company.com'
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid or expired token' } });
    }
    req.user = user as AuthUser;
    next();
  });
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (allowedRoles.includes('Admin') && req.user.role === 'Admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ROLE', message: `Access denied. Role ${req.user.role} is not permitted.` }
      });
    }

    next();
  };
};
