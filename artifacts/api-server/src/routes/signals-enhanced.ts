import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { signalLogTable, userRolesTable } from "@workspace/db";
import { desc, eq, and, gte, lte } from "drizzle-orm";
import { CreateSignalBody } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.userId;
  const role = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))
    .limit(1);
  if (!role.length || role[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

// Enhanced signal response formatter
function formatSignal(s: any) {
  return {
    id: s.id,
    symbol: s.symbol,
    side: s.side as "LONG" | "SHORT",
    entry: Number(s.entry),
    stop: s.stop ? Number(s.stop) : null,
    target: s.target ? Number(s.target) : null,
    confidence: Number(s.confidence),
    features: s.features || {},
    outcome: s.outcome ?? null,
    pnlPct: s.pnlPct ? Number(s.pnlPct) : null,
    resolvedAt: s.resolvedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

// Get all signals with filtering and analytics
router.get("/", requireAuth, async (req: any, res) => {
  try {
    const { symbol, side, outcome, limit = 50, offset = 0, resolved } = req.query;

    let query = db.select().from(signalLogTable);

    // Apply filters
    const conditions = [];
    if (symbol) conditions.push(eq(signalLogTable.symbol, symbol));
    if (side) conditions.push(eq(signalLogTable.side, side));
    if (outcome) conditions.push(eq(signalLogTable.outcome, outcome));
    if (resolved === "true") conditions.push(signalLogTable.resolvedAt.isNotNull());
    if (resolved === "false") conditions.push(signalLogTable.resolvedAt.isNull());

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const signals = await query
      .orderBy(desc(signalLogTable.createdAt))
      .limit(Math.min(parseInt(limit) || 50, 500))
      .offset(parseInt(offset) || 0);

    res.json(signals.map(formatSignal));
  } catch (err) {
    req.log.error({ err }, "listSignals error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get signal analytics/performance
router.get("/analytics", requireAuth, async (req: any, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const signals = await db
      .select()
      .from(signalLogTable)
      .where(gte(signalLogTable.createdAt, daysAgo));

    // Calculate analytics
    const totalSignals = signals.length;
    const resolvedSignals = signals.filter((s) => s.resolvedAt);
    const winningSignals = resolvedSignals.filter((s) => s.pnlPct && Number(s.pnlPct) > 0);
    const losingSignals = resolvedSignals.filter((s) => s.pnlPct && Number(s.pnlPct) < 0);

    const winRate = resolvedSignals.length > 0 ? (winningSignals.length / resolvedSignals.length) * 100 : 0;
    const avgPnl = resolvedSignals.length > 0
      ? resolvedSignals.reduce((sum, s) => sum + (s.pnlPct ? Number(s.pnlPct) : 0), 0) / resolvedSignals.length
      : 0;

    const bySymbol = signals.reduce(
      (acc, s) => {
        if (!acc[s.symbol]) {
          acc[s.symbol] = { count: 0, wins: 0, losses: 0, avgPnl: 0 };
        }
        acc[s.symbol].count++;
        if (s.resolvedAt && s.pnlPct) {
          if (Number(s.pnlPct) > 0) acc[s.symbol].wins++;
          else if (Number(s.pnlPct) < 0) acc[s.symbol].losses++;
          acc[s.symbol].avgPnl += Number(s.pnlPct);
        }
        return acc;
      },
      {} as Record<string, any>
    );

    Object.keys(bySymbol).forEach((sym) => {
      if (bySymbol[sym].count > 0) {
        bySymbol[sym].avgPnl /= bySymbol[sym].count;
      }
    });

    res.json({
      period: { days: parseInt(days), from: daysAgo.toISOString() },
      summary: {
        totalSignals,
        resolvedSignals: resolvedSignals.length,
        unresolvedSignals: totalSignals - resolvedSignals.length,
        winRate: parseFloat(winRate.toFixed(2)),
        avgPnl: parseFloat(avgPnl.toFixed(4)),
        totalWins: winningSignals.length,
        totalLosses: losingSignals.length,
      },
      bySymbol,
      signals: signals.map(formatSignal),
    });
  } catch (err) {
    req.log.error({ err }, "analytics error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single signal
router.get("/:id", requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const signal = await db
      .select()
      .from(signalLogTable)
      .where(eq(signalLogTable.id, id))
      .limit(1);

    if (!signal.length) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json(formatSignal(signal[0]));
  } catch (err) {
    req.log.error({ err }, "getSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create signal
router.post("/", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const parsed = CreateSignalBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const { symbol, side, entry, stop, target, confidence, features } = parsed.data;
    const [inserted] = await db
      .insert(signalLogTable)
      .values({
        symbol,
        side,
        entry: String(entry),
        stop: stop ? String(stop) : null,
        target: target ? String(target) : null,
        confidence: String(confidence),
        features: features || {},
      })
      .returning();

    res.status(201).json(formatSignal(inserted));
  } catch (err) {
    req.log.error({ err }, "createSignal error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update signal outcome
router.patch("/:id/outcome", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { outcome, pnlPct } = req.body;

    if (!["WIN", "LOSS", "BREAKEVEN", "CANCELLED"].includes(outcome)) {
      return res.status(400).json({ error: "Invalid outcome" });
    }

    const [updated] = await db
      .update(signalLogTable)
      .set({
        outcome,
        pnlPct: pnlPct ? String(pnlPct) : null,
        resolvedAt: new Date(),
      })
      .where(eq(signalLogTable.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Signal not found" });
    }

    res.json(formatSignal(updated));
  } catch (err) {
    req.log.error({ err }, "updateSignalOutcome error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
