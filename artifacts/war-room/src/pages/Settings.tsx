import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Lock, Eye, Palette, Code, Trash2, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "John Trader",
    email: "john@example.com",
    phone: "+1 (555) 000-0000",
    timezone: "UTC",
    language: "en",
  });

  const [notifications, setNotifications] = useState({
    emailSignals: true,
    emailAnalytics: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyReport: true,
    monthlyReport: true,
  });

  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    showStats: false,
    allowDataCollection: true,
    twoFactorEnabled: true,
  });

  const [apiKeys, setApiKeys] = useState([
    {
      id: "key_1",
      name: "Production API Key",
      key: "sk_live_****...****",
      created: "2024-01-15",
      lastUsed: "2024-05-17",
    },
  ]);

  const [saved, setSaved] = useState(false);

  const handleProfileChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
    setSaved(false);
  };

  const handleNotificationChange = (field: string) => {
    setNotifications({ ...notifications, [field]: !notifications[field as keyof typeof notifications] });
    setSaved(false);
  };

  const handlePrivacyChange = (field: string) => {
    setPrivacy({ ...privacy, [field]: !privacy[field as keyof typeof privacy] });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(value) => handleProfileChange("timezone", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern Time</SelectItem>
                        <SelectItem value="CST">Central Time</SelectItem>
                        <SelectItem value="PST">Pacific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={profile.language} onValueChange={(value) => handleProfileChange("language", value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>

                {saved && (
                  <Alert className="bg-emerald-900/20 border-emerald-800">
                    <AlertDescription className="text-emerald-400">
                      Profile updated successfully!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Control how you receive updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="font-semibold text-white capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-sm text-slate-400">
                          {key === "emailSignals" && "Get notified when new signals are generated"}
                          {key === "emailAnalytics" && "Receive weekly analytics summaries"}
                          {key === "pushNotifications" && "Browser push notifications"}
                          {key === "smsAlerts" && "SMS alerts for urgent signals"}
                          {key === "weeklyReport" && "Weekly performance report"}
                          {key === "monthlyReport" && "Monthly detailed report"}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={() => handleNotificationChange(key)}
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Manage your security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                      <div>
                        <p className="font-semibold text-white capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p className="text-sm text-slate-400">
                          {key === "profilePublic" && "Make your profile visible to other users"}
                          {key === "showStats" && "Share your trading statistics"}
                          {key === "allowDataCollection" && "Allow us to collect usage data"}
                          {key === "twoFactorEnabled" && "Require 2FA for account access"}
                        </p>
                      </div>
                      <Switch
                        checked={value}
                        onCheckedChange={() => handlePrivacyChange(key)}
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage your API access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Create New API Key
                </Button>

                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="p-4 bg-slate-700/30 rounded-lg border border-slate-600 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{apiKey.name}</p>
                          <p className="text-sm text-slate-400 font-mono">{apiKey.key}</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-600">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Created</p>
                          <p className="text-white">{apiKey.created}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Last Used</p>
                          <p className="text-white">{apiKey.lastUsed}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-red-600 text-red-500 w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {["light", "dark", "auto"].map((theme) => (
                      <button
                        key={theme}
                        className={`p-3 rounded-lg border-2 capitalize font-semibold transition-colors ${
                          theme === "dark"
                            ? "border-emerald-500 bg-slate-700 text-white"
                            : "border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Chart Style</Label>
                  <Select defaultValue="candlestick">
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="candlestick">Candlestick</SelectItem>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Appearance
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
