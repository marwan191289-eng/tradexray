import { useState, useEffect } from 'react';
import {
  Users, Lock, Trash2, Ban, CheckCircle, AlertCircle, Search, Filter,
  BarChart3, TrendingUp, Eye, Settings, LogOut, Shield, Wallet, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminAuthService } from '@/services/adminAuthService';
import { userManagementService } from '@/services/userManagementService';
import { developerPrivilegesService } from '@/services/developerPrivilegesService';

export default function AdminDashboard() {
  const [adminSession, setAdminSession] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [developerAccount, setDeveloperAccount] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  // Handle admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const session = await adminAuthService.login(
        loginForm.username,
        loginForm.password,
        'localhost',
        'admin-dashboard'
      );
      setAdminSession(session);
      setIsLoggedIn(true);
      loadDashboardData();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard data
  const loadDashboardData = () => {
    const allUsers = userManagementService.getAllUsers();
    const platformStats = userManagementService.getPlatformStats();
    setUsers(allUsers);
    setStats(platformStats);
  };

  // Ban user
  const handleBanUser = async (userId: string) => {
    if (!banReason.trim()) {
      alert('Please provide a ban reason');
      return;
    }

    try {
      userManagementService.banUser(userId, adminSession.adminId, banReason);
      loadDashboardData();
      setSelectedUser(null);
      setBanReason('');
      alert('User banned successfully');
    } catch (error) {
      console.error('Failed to ban user:', error);
      alert('Failed to ban user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      userManagementService.deleteUser(userId, adminSession.adminId, 'Admin deletion');
      loadDashboardData();
      setSelectedUser(null);
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  // Create developer account
  const handleCreateDeveloperAccount = async () => {
    try {
      setLoading(true);
      const devAccount = developerPrivilegesService.createDeveloperAccount(
        adminSession.adminId,
        'Marwan Negm',
        'marwan191289@yahoo.com'
      );
      setDeveloperAccount(devAccount);
      alert('Developer account created successfully!');
    } catch (error) {
      console.error('Failed to create developer account:', error);
      alert('Failed to create developer account');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    adminAuthService.logout(adminSession.token);
    setIsLoggedIn(false);
    setAdminSession(null);
    setLoginForm({ username: '', password: '' });
  };

  // Search users
  const filteredUsers = searchQuery
    ? userManagementService.searchUsers(searchQuery)
    : users;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-500" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              Developer Portal - Restricted Access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Username / Email</label>
                <Input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="marwan191289@yahoo.com"
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400">Password</label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Welcome, {adminSession?.username}</p>
          </div>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-xs text-emerald-400 mt-1">{stats.activeUsers} active</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Banned Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-400">{stats.bannedUsers}</div>
                <p className="text-xs text-slate-500 mt-1">{stats.suspendedUsers} suspended</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  ${(stats.totalVolume / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-slate-500 mt-1">{stats.totalTrades} trades</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Platform Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-400">
                  ${stats.totalFees.toFixed(2)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Total collected</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800 border-b border-slate-700">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="developer">Developer Account</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">KYC Verified Users</p>
                    <p className="text-2xl font-bold text-white">{stats?.verifiedUsers || 0}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Average User Volume</p>
                    <p className="text-2xl font-bold text-white">
                      ${(stats?.averageVolume || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Manage Users</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users by email, name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button className="bg-slate-700 hover:bg-slate-600">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No users found</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:border-slate-500 cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div>
                          <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'destructive'}
                        >
                          {user.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Details */}
            {selectedUser && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">User Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-400 text-sm">Name</p>
                      <p className="text-white font-semibold">{selectedUser.firstName} {selectedUser.lastName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white font-semibold">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Status</p>
                      <p className="text-white font-semibold">{selectedUser.status}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Total Trades</p>
                      <p className="text-white font-semibold">{selectedUser.totalTrades}</p>
                    </div>
                  </div>

                  {selectedUser.status === 'active' && (
                    <div className="space-y-3 pt-4 border-t border-slate-600">
                      <div>
                        <label className="text-sm text-slate-400">Ban Reason</label>
                        <Input
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Enter ban reason..."
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleBanUser(selectedUser.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Ban User
                        </Button>
                        <Button
                          onClick={() => handleDeleteUser(selectedUser.id)}
                          className="bg-red-600 hover:bg-red-700 text-white flex-1"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Developer Account Tab */}
          <TabsContent value="developer" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Developer Account Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!developerAccount ? (
                  <Button
                    onClick={handleCreateDeveloperAccount}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  >
                    {loading ? 'Creating...' : 'Create Developer Account for Marwan Negm'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-900/20 border border-emerald-700 rounded-lg">
                      <p className="text-emerald-400 font-semibold mb-2">✅ Developer Account Created</p>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-slate-400">Name:</span> <span className="text-white">{developerAccount.name}</span></p>
                        <p><span className="text-slate-400">Email:</span> <span className="text-white">{developerAccount.email}</span></p>
                        <p><span className="text-slate-400">ID:</span> <span className="text-white font-mono">{developerAccount.id}</span></p>
                        <p><span className="text-slate-400">Internal Wallet:</span> <span className="text-white font-mono">{developerAccount.internalWalletId}</span></p>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 text-sm font-semibold mb-2">Active Privileges:</p>
                      <div className="space-y-1">
                        {developerAccount.privileges.map((priv: any) => (
                          <Badge key={priv.id} className="bg-emerald-600">
                            {priv.type.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Admin Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminSession?.permissions?.map((perm: any) => (
                    <div key={perm.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded border border-slate-600">
                      <div>
                        <p className="font-semibold text-white">{perm.name}</p>
                        <p className="text-xs text-slate-400">{perm.description}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
