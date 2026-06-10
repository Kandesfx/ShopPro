import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  async register(req: Request, res: Response) {
    const { username, email, password, full_name, phone } = req.body;
    const result = await authService.register({ username, email, password, full_name, phone });
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  }

  async login(req: Request, res: Response) {
    const { username, password } = req.body;
    const deviceInfo = req.get('User-Agent') || undefined;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await authService.login({ username, password }, deviceInfo, ipAddress);
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  }

  async logout(req: Request, res: Response) {
    const { refresh_token } = req.body;
    await authService.logout(refresh_token);
    res.json({
      success: true,
      message: 'Logout successful',
    });
  }

  async refreshToken(req: Request, res: Response) {
    const { refresh_token } = req.body;
    const result = await authService.refreshToken(refresh_token);
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  }

  async getProfile(req: AuthRequest, res: Response) {
    const result = await authService.getProfile(req.user!.id);
    res.json({
      success: true,
      data: result,
    });
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const result = await authService.updateProfile(req.user!.id, req.body);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  }

  async changePassword(req: AuthRequest, res: Response) {
    const { current_password, new_password } = req.body;
    await authService.changePassword(req.user!.id, current_password, new_password);
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  async getAllUsers(req: Request, res: Response) {
    const { page, limit, role } = req.query;
    const result = await authService.getAllUsers(
      Number(page) || 1,
      Number(limit) || 20,
      role as string | undefined
    );
    res.json({
      success: true,
      data: result.users,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
      },
    });
  }

  async updateUserRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    await authService.updateUserRole(Number(id), role);
    res.json({
      success: true,
      message: 'User role updated successfully',
    });
  }

  async toggleUserStatus(req: Request, res: Response) {
    const { id } = req.params;
    await authService.toggleUserStatus(Number(id));
    res.json({
      success: true,
      message: 'User status updated successfully',
    });
  }
}

export const authController = new AuthController();
