import { SignIn, SignUp } from "@clerk/react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">مرحباً بك</h1>
          <p className="text-muted-foreground mt-2">سجّل دخولك أو أنشئ حساباً جديداً</p>
        </div>
        <div className="flex gap-2 mb-4 justify-center">
          <button
            className={`px-4 py-2 rounded text-sm font-medium ${mode === "signin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            onClick={() => setMode("signin")}
          >
            تسجيل الدخول
          </button>
          <button
            className={`px-4 py-2 rounded text-sm font-medium ${mode === "signup" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            onClick={() => setMode("signup")}
          >
            إنشاء حساب
          </button>
        </div>
        {mode === "signin" ? (
          <SignIn
            routing="hash"
            signUpUrl={`${basePath}/auth`}
            afterSignInUrl={basePath || "/"}
          />
        ) : (
          <SignUp
            routing="hash"
            signInUrl={`${basePath}/auth`}
            afterSignUpUrl={basePath || "/"}
          />
        )}
      </div>
    </div>
  );
}
