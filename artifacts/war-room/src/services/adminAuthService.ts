import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
  loginAttempts: number;
  isLocked: boolean;
  lockedUntil?: Date;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: 'user_management' | 'wallet_management' | 'trading_control' | 'platform_settings' | 'analytics' | 'security';
}

export interface AdminSession {
  token: string;
  adminId: string;
  username: string;
  role: string;
  expiresAt: Date;
  permissions: AdminPermission[];
}

export interface AdminLoginLog {
  id: string;
  adminId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}

// All available admin permissions
const ALL_PERMISSIONS: AdminPermission[] = [
  // User Management
  { id: 'view_users', name: 'View All Users', description: 'View all user accounts and details', category: 'user_management' },
  { id: 'edit_user_profile', name: 'Edit User Profile', description: 'Modify user account information', category: 'user_management' },
  { id: 'ban_user', name: 'Ban Users', description: 'Temporarily or permanently ban users', category: 'user_management' },
  { id: 'delete_user', name: 'Delete Users', description: 'Permanently delete user accounts', category: 'user_management' },
  { id: 'reset_user_password', name: 'Reset User Password', description: 'Reset user passwords', category: 'user_management' },
  { id: 'view_user_wallets', name: 'View User Wallets', description: 'View all user wallets and balances', category: 'user_management' },

  // Wallet Management
  { id: 'manage_wallets', name: 'Manage Wallets', description: 'Create, edit, and delete user wallets', category: 'wallet_management' },
  { id: 'adjust_wallet_balance', name: 'Adjust Wallet Balance', description: 'Manually adjust user wallet balances', category: 'wallet_management' },
  { id: 'freeze_wallet', name: 'Freeze Wallet', description: 'Freeze user wallets', category: 'wallet_management' },
  { id: 'view_transactions', name: 'View Transactions', description: 'View all user transactions', category: 'wallet_management' },
  { id: 'reverse_transaction', name: 'Reverse Transactions', description: 'Reverse user transactions', category: 'wallet_management' },

  // Trading Control
  { id: 'view_trades', name: 'View All Trades', description: 'View all user trades and orders', category: 'trading_control' },
  { id: 'cancel_trade', name: 'Cancel Trades', description: 'Cancel user trades and orders', category: 'trading_control' },
  { id: 'execute_trade', name: 'Execute Trades', description: 'Execute trades on behalf of users', category: 'trading_control' },
  { id: 'modify_fee_structure', name: 'Modify Fee Structure', description: 'Change trading fees for users', category: 'trading_control' },
  { id: 'zero_fee_access', name: 'Zero Fee Access', description: 'Trade without platform fees', category: 'trading_control' },

  // Platform Settings
  { id: 'manage_platform_settings', name: 'Manage Platform Settings', description: 'Change platform configuration', category: 'platform_settings' },
  { id: 'manage_admins', name: 'Manage Admins', description: 'Create and manage admin accounts', category: 'platform_settings' },
  { id: 'view_platform_analytics', name: 'View Analytics', description: 'View platform analytics and statistics', category: 'platform_settings' },
  { id: 'manage_announcements', name: 'Manage Announcements', description: 'Create and manage platform announcements', category: 'platform_settings' },

  // Security
  { id: 'view_security_logs', name: 'View Security Logs', description: 'View platform security logs', category: 'security' },
  { id: 'manage_api_keys', name: 'Manage API Keys', description: 'Create and revoke API keys', category: 'security' },
  { id: 'view_audit_logs', name: 'View Audit Logs', description: 'View all admin actions', category: 'security' },
];

class AdminAuthService {
  private admins: Map<string, AdminUser> = new Map();
  private sessions: Map<string, AdminSession> = new Map();
  private loginLogs: AdminLoginLog[] = [];
  private jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  private maxLoginAttempts = 5;
  private lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor() {
    // Initialize with default super admin (Marwan Negm)
    this.initializeSuperAdmin();
  }

  /**
   * Initialize the super admin account
   */
  private initializeSuperAdmin(): void {
    const superAdminId = 'admin-marwan-001';
    const passwordHash = bcrypt.hashSync('Aa010*+*+*', 10);

    const superAdmin: AdminUser = {
      id: superAdminId,
      name: 'Marwan Negm',
      username: 'marwan191289@yahoo.com',
      email: 'marwan191289@yahoo.com',
      passwordHash,
      role: 'super_admin',
      permissions: ALL_PERMISSIONS, // Super admin has all permissions
      isActive: true,
      createdAt: new Date(),
      loginAttempts: 0,
      isLocked: false,
    };

    this.admins.set(superAdminId, superAdmin);
    console.log('✅ Super Admin Account Created: Marwan Negm');
  }

  /**
   * Admin login
   */
  async login(username: string, password: string, ipAddress: string, userAgent: string): Promise<AdminSession> {
    // Find admin by username or email
    let admin: AdminUser | undefined;
    for (const a of this.admins.values()) {
      if (a.username === username || a.email === username) {
        admin = a;
        break;
      }
    }

    if (!admin) {
      this.logLoginAttempt(undefined, ipAddress, userAgent, false, 'User not found');
      throw new Error('Invalid credentials');
    }

    // Check if account is locked
    if (admin.isLocked && admin.lockedUntil && admin.lockedUntil > new Date()) {
      this.logLoginAttempt(admin.id, ipAddress, userAgent, false, 'Account locked');
      throw new Error('Account is locked. Please try again later.');
    }

    // Check if account is active
    if (!admin.isActive) {
      this.logLoginAttempt(admin.id, ipAddress, userAgent, false, 'Account inactive');
      throw new Error('Account is inactive');
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatch) {
      admin.loginAttempts++;
      if (admin.loginAttempts >= this.maxLoginAttempts) {
        admin.isLocked = true;
        admin.lockedUntil = new Date(Date.now() + this.lockoutDuration);
      }
      this.logLoginAttempt(admin.id, ipAddress, userAgent, false, 'Invalid password');
      throw new Error('Invalid credentials');
    }

    // Reset login attempts on successful login
    admin.loginAttempts = 0;
    admin.isLocked = false;
    admin.lastLogin = new Date();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions.map((p) => p.id),
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    const session: AdminSession = {
      token,
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      permissions: admin.permissions,
    };

    this.sessions.set(token, session);
    this.logLoginAttempt(admin.id, ipAddress, userAgent, true);

    return session;
  }

  /**
   * Verify admin session
   */
  verifySession(token: string): AdminSession | null {
    const session = this.sessions.get(token);
    if (!session) return null;

    // Check if token has expired
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  /**
   * Logout
   */
  logout(token: string): void {
    this.sessions.delete(token);
  }

  /**
   * Check if admin has permission
   */
  hasPermission(adminId: string, permissionId: string): boolean {
    const admin = this.admins.get(adminId);
    if (!admin) return false;

    // Super admin has all permissions
    if (admin.role === 'super_admin') return true;

    return admin.permissions.some((p) => p.id === permissionId);
  }

  /**
   * Get admin details
   */
  getAdmin(adminId: string): AdminUser | null {
    return this.admins.get(adminId) || null;
  }

  /**
   * Get all admins
   */
  getAllAdmins(): AdminUser[] {
    return Array.from(this.admins.values());
  }

  /**
   * Create new admin account
   */
  createAdmin(
    name: string,
    username: string,
    email: string,
    password: string,
    role: 'admin' | 'moderator' = 'admin',
    permissions: AdminPermission[] = []
  ): AdminUser {
    const adminId = `admin-${Date.now()}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const newAdmin: AdminUser = {
      id: adminId,
      name,
      username,
      email,
      passwordHash,
      role,
      permissions: role === 'admin' ? permissions : permissions.filter((p) => p.category !== 'security'),
      isActive: true,
      createdAt: new Date(),
      loginAttempts: 0,
      isLocked: false,
    };

    this.admins.set(adminId, newAdmin);
    return newAdmin;
  }

  /**
   * Update admin permissions
   */
  updateAdminPermissions(adminId: string, permissionIds: string[]): AdminUser | null {
    const admin = this.admins.get(adminId);
    if (!admin) return null;

    admin.permissions = ALL_PERMISSIONS.filter((p) => permissionIds.includes(p.id));
    return admin;
  }

  /**
   * Deactivate admin account
   */
  deactivateAdmin(adminId: string): AdminUser | null {
    const admin = this.admins.get(adminId);
    if (!admin) return null;

    admin.isActive = false;
    return admin;
  }

  /**
   * Get login logs
   */
  getLoginLogs(adminId?: string, limit: number = 100): AdminLoginLog[] {
    let logs = this.loginLogs;
    if (adminId) {
      logs = logs.filter((l) => l.adminId === adminId);
    }
    return logs.slice(-limit).reverse();
  }

  /**
   * Log login attempt
   */
  private logLoginAttempt(
    adminId: string | undefined,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    reason?: string
  ): void {
    const log: AdminLoginLog = {
      id: `log-${Date.now()}`,
      adminId: adminId || 'unknown',
      timestamp: new Date(),
      ipAddress,
      userAgent,
      success,
      reason,
    };

    this.loginLogs.push(log);
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): AdminPermission[] {
    return ALL_PERMISSIONS;
  }

  /**
   * Get permissions by category
   */
  getPermissionsByCategory(category: string): AdminPermission[] {
    return ALL_PERMISSIONS.filter((p) => p.category === category);
  }

  /**
   * Change admin password
   */
  async changePassword(adminId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const admin = this.admins.get(adminId);
    if (!admin) return false;

    const passwordMatch = await bcrypt.compare(oldPassword, admin.passwordHash);
    if (!passwordMatch) return false;

    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    return true;
  }

  /**
   * Reset admin password (by super admin)
   */
  resetAdminPassword(adminId: string, newPassword: string): boolean {
    const admin = this.admins.get(adminId);
    if (!admin) return false;

    admin.passwordHash = bcrypt.hashSync(newPassword, 10);
    admin.loginAttempts = 0;
    admin.isLocked = false;
    return true;
  }
}

export const adminAuthService = new AdminAuthService();
