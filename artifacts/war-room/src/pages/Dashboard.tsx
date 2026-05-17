import { useEffect, useState } from "react";
import { useListSignals } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Activity, Target, AlertCircle } from "lucide-react";

interface SignalStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnl: number;
}

const Dashboard = () => {
  const { data: signals, isLoading } = useListSignals();
  const [stats, setStats] = useState<SignalStats>({
    total: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    avgPnl: 0,
  });

  useEffect(() => {
    if (signals && signals.length > 0) {
      const resolved = signals.filter((s) => s.outcome);
      const wins = resolved.filter((s) => s.outcome === "WIN");
      const losses = resolved.filter((s) => s.outcome === "LOSS");

      const avgPnl =
        resolved.length > 0
          ? resolved.reduce((sum, s) => sum + (s.pnlPct || 0), 0) / resolved.length
          : 0;

      setStats({
        total: signals.length,
        wins: wins.length,
        losses: losses.length,
        winRate: resolved.length > 0 ? (wins.length / resolved.length) * 100 : 0,
        avgPnl,
      });
    }
  }, [signals]);

  const recentSignals = signals?.slice(0, 10) || [];
  const chartData = signals
    ?.slice(0, 20)
    .reverse()
    .map((s, idx) => ({
      name: `${s.symbol} #${idx + 1}`,
      pnl: s.pnlPct || 0,
      confidence: Number(s.confidence) * 100,
    })) || [];

  const symbolStats = signals?.reduce(
    (acc, s) => {
      if (!acc[s.symbol]) {
        acc[s.symbol] = { symbol: s.symbol, count: 0, wins: 0 };
      }
      acc[s.symbol].count++;
      if (s.outcome === "WIN") acc[s.symbol].wins++;
      return acc;
    },
    {} as Record<string, any>
  );

  const symbolChartData = Object.values(symbolStats || {}).map((s: any) => ({
    name: s.symbol,
    value: s.count,
    wins: s.wins,
  }));

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Trading Dashboard</h1>
          <p className="text-slate-400">Real-time signal analytics and performance tracking</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <p className="text-xs text-slate-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-emerald-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{stats.wins}</div>
              <p className="text-xs text-slate-400 mt-1">Winning trades</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-red-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Losses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.losses}</div>
              <p className="text-xs text-slate-400 mt-1">Losing trades</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{stats.winRate.toFixed(1)}%</div>
              <p className="text-xs text-slate-400 mt-1">Success rate</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Avg PnL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.avgPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {stats.avgPnl.toFixed(2)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">Average return</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Tables */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="signals">Recent Signals</TabsTrigger>
            <TabsTrigger value="symbols">By Symbol</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>PnL Performance</CardTitle>
                <CardDescription>Last 20 signals</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="pnl" fill="#10b981" name="PnL %" />
                    <Bar dataKey="confidence" fill="#3b82f6" name="Confidence %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Recent Signals</CardTitle>
                <CardDescription>Latest trading signals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="text-center text-slate-400">Loading signals...</div>
                  ) : recentSignals.length === 0 ? (
                    <div className="text-center text-slate-400">No signals available</div>
                  ) : (
                    recentSignals.map((signal) => (
                      <div
                        key={signal.id}
                        className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-slate-500 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white">{signal.symbol}</span>
                            <Badge
                              variant={signal.side === "LONG" ? "default" : "secondary"}
                              className={signal.side === "LONG" ? "bg-emerald-600" : "bg-red-600"}
                            >
                              {signal.side}
                            </Badge>
                            <Badge variant="outline" className="border-slate-600">
                              {(Number(signal.confidence) * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Entry: {Number(signal.entry).toFixed(2)} | Stop: {signal.stop ? Number(signal.stop).toFixed(2) : "N/A"} | Target:{" "}
                            {signal.target ? Number(signal.target).toFixed(2) : "N/A"}
                          </div>
                        </div>
                        <div className="text-right">
                          {signal.outcome ? (
                            <div>
                              <Badge
                                variant={signal.outcome === "WIN" ? "default" : "secondary"}
                                className={signal.outcome === "WIN" ? "bg-emerald-600" : "bg-red-600"}
                              >
                                {signal.outcome}
                              </Badge>
                              {signal.pnlPct && (
                                <div className={`text-sm font-bold mt-1 ${signal.pnlPct >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                  {signal.pnlPct >= 0 ? "+" : ""}
                                  {signal.pnlPct.toFixed(2)}%
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="border-amber-600 text-amber-500">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symbols" className="space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Signals by Symbol</CardTitle>
                <CardDescription>Distribution of signals across trading pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={symbolChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {symbolChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
