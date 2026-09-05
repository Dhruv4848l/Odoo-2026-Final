import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'peoplepay360-dev-secret-key-2026';

export interface AuthUser {
  id: string;
  userId?: string;
  employee_id?: number;
  employeeId?: string | number | null;
  role: string;
  roleId?: string;
  email?: string;
}

export interface UserPayload {
  userId: string;
  email: string;
  roleId: string;
  employeeId?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser | UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch (err) {
    return null;
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Demo fallback for development
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      employee_id: 1,
      role: 'HR Payroll Manager',
      roleId: 'HR Payroll Manager',
      email: 'amara.chen@company.com'
    };
    return next();
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Invalid or expired token' } });
  }

  req.user = user;
  next();
};

export const authMiddleware = authenticateToken;

export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const currentRole = req.user.role || req.user.roleId;

    if (currentRole === 'Admin') {
      return next();
    }

    if (!currentRole || !allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN_ROLE', message: `Access denied. Role ${currentRole} is not permitted.` }
      });
    }

    next();
  };
};

export const requireRole = requireRoles;
