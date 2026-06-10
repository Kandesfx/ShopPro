import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db';
import { config } from '../config';
import { ApiError } from '../utils/ApiError';
import { User, LoginCredentials, AuthResponse, JWTPayload } from '../types';

export class AuthService {
  async register(data: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const { username, email, password, full_name, phone } = data;

    // Check if user exists
    const existingUser = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email) as { id: number } | undefined;

    if (existingUser) {
      throw ApiError.conflict('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, phone, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `).run(username, email, passwordHash, full_name || null, phone || null);

    const userId = result.lastInsertRowid as number;

    // Get user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    this.saveRefreshToken(user.id, tokens.refreshToken);

    // Create customer record
    db.prepare(`
      INSERT INTO customers (user_id, full_name, phone, email)
      VALUES (?, ?, ?, ?)
    `).run(userId, full_name || username, phone || null, email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(credentials: LoginCredentials, deviceInfo?: string, ipAddress?: string): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Get user
    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, username) as User | undefined;

    if (!user) {
      throw ApiError.unauthorized('Invalid username or password');
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw ApiError.unauthorized('Account is locked. Please try again later.');
    }

    // Check if account is active
    if (!user.is_active) {
      throw ApiError.unauthorized('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      // Update failed login attempts
      const failedAttempts = user.failed_login_attempts + 1;
      const lockedUntil = failedAttempts >= 5 
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString() 
        : null;

      db.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, locked_until = ?
        WHERE id = ?
      `).run(failedAttempts, lockedUntil, user.id);

      throw ApiError.unauthorized('Invalid username or password');
    }

    // Reset failed login attempts on successful login
    if (user.failed_login_attempts > 0) {
      db.prepare(`
        UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?
      `).run(user.id);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    this.saveRefreshToken(user.id, tokens.refreshToken, deviceInfo, ipAddress);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    db.prepare(`
      UPDATE refresh_tokens 
      SET revoked_at = CURRENT_TIMESTAMP 
      WHERE token = ? AND revoked_at IS NULL
    `).run(refreshToken);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Find token
    const tokenRecord = db.prepare(`
      SELECT rt.*, u.*
      FROM refresh_tokens rt
      JOIN users u ON rt.user_id = u.id
      WHERE rt.token = ? AND rt.revoked_at IS NULL AND rt.expires_at > datetime('now')
    `).get(refreshToken) as any;

    if (!tokenRecord) {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = {
      id: tokenRecord.user_id,
      username: tokenRecord.username,
      email: tokenRecord.email,
      role: tokenRecord.role,
    } as User;

    // Revoke old token
    db.prepare(`
      UPDATE refresh_tokens 
      SET revoked_at = CURRENT_TIMESTAMP 
      WHERE token = ?
    `).run(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Save new refresh token
    this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async getProfile(userId: number): Promise<Omit<User, 'password_hash'>> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: number, data: { full_name?: string; phone?: string; email?: string }): Promise<Omit<User, 'password_hash'>> {
    const { full_name, phone, email } = data;

    // Check if email is taken by another user
    if (email) {
      const existingEmail = db.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).get(email, userId);

      if (existingEmail) {
        throw ApiError.conflict('Email already in use');
      }
    }

    db.prepare(`
      UPDATE users 
      SET full_name = COALESCE(?, full_name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name, phone, email, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
    return this.sanitizeUser(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(newPasswordHash, userId);

    // Revoke all refresh tokens for security
    db.prepare(`
      UPDATE refresh_tokens 
      SET revoked_at = CURRENT_TIMESTAMP 
      WHERE user_id = ? AND revoked_at IS NULL
    `).run(userId);
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload: JWTPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return { accessToken, refreshToken };
  }

  private saveRefreshToken(
    userId: number,
    token: string,
    deviceInfo?: string,
    ipAddress?: string
  ): void {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO refresh_tokens (user_id, token, device_info, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, token, deviceInfo || null, ipAddress || null, expiresAt);
  }

  private sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async getAllUsers(page = 1, limit = 20, role?: string): Promise<{ users: any[]; total: number }> {
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params: any[] = [];

    if (role) {
      whereClause = 'WHERE role = ?';
      params.push(role);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params) as { count: number };

    const users = db.prepare(`
      SELECT id, username, email, full_name, phone, role, avatar, is_active, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return { users, total: total.count };
  }

  async updateUserRole(userId: number, role: string): Promise<void> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    db.prepare(`
      UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(role, userId);
  }

  async toggleUserStatus(userId: number): Promise<void> {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    db.prepare(`
      UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(user.is_active ? 0 : 1, userId);
  }
}

export const authService = new AuthService();
