import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * Get current user info
 */
router.get("/me", (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      userId,
      user: auth.user,
      sessionId: auth.sessionId,
    });
  } catch (err) {
    req.log.error({ err }, "getMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Get user role
 */
router.get("/me/role", (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      userId,
      role: "user", // Default role
    });
  } catch (err) {
    req.log.error({ err }, "getRole error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Update user profile
 */
router.patch("/me/profile", (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, email, avatar } = req.body;

    // In a real app, you would update the user profile in the database
    res.json({
      userId,
      name,
      email,
      avatar,
      updated: true,
    });
  } catch (err) {
    req.log.error({ err }, "updateProfile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Verify email
 */
router.post("/verify-email", (req: any, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    // In a real app, you would verify the code against what was sent
    res.json({
      verified: true,
      email,
    });
  } catch (err) {
    req.log.error({ err }, "verifyEmail error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Verify phone
 */
router.post("/verify-phone", (req: any, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and code are required" });
    }

    // In a real app, you would verify the code against what was sent
    res.json({
      verified: true,
      phone,
    });
  } catch (err) {
    req.log.error({ err }, "verifyPhone error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Send verification code to email
 */
router.post("/send-email-code", (req: any, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // In a real app, you would send an email with a verification code
    res.json({
      sent: true,
      email,
      message: "Verification code sent to email",
    });
  } catch (err) {
    req.log.error({ err }, "sendEmailCode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Send verification code to phone
 */
router.post("/send-phone-code", (req: any, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }

    // In a real app, you would send an SMS with a verification code
    res.json({
      sent: true,
      phone,
      message: "Verification code sent to phone",
    });
  } catch (err) {
    req.log.error({ err }, "sendPhoneCode error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * OAuth callback handlers
 */

router.post("/oauth/google/callback", (req: any, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    // In a real app, you would verify the Google token and create/update user
    res.json({
      authenticated: true,
      provider: "google",
      message: "Successfully authenticated with Google",
    });
  } catch (err) {
    req.log.error({ err }, "googleCallback error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/oauth/apple/callback", (req: any, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    res.json({
      authenticated: true,
      provider: "apple",
      message: "Successfully authenticated with Apple",
    });
  } catch (err) {
    req.log.error({ err }, "appleCallback error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/oauth/facebook/callback", (req: any, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    res.json({
      authenticated: true,
      provider: "facebook",
      message: "Successfully authenticated with Facebook",
    });
  } catch (err) {
    req.log.error({ err }, "facebookCallback error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/oauth/twitter/callback", (req: any, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    res.json({
      authenticated: true,
      provider: "twitter",
      message: "Successfully authenticated with Twitter",
    });
  } catch (err) {
    req.log.error({ err }, "twitterCallback error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Logout
 */
router.post("/logout", (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // In a real app, you would invalidate the session
    res.json({
      loggedOut: true,
      message: "Successfully logged out",
    });
  } catch (err) {
    req.log.error({ err }, "logout error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
