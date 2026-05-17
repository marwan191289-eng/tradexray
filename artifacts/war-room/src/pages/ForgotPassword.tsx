import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function ForgotPassword() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إعادة تعيين كلمة السر</CardTitle>
          <CardDescription>يُرجى استخدام خيار "نسيت كلمة السر" في صفحة تسجيل الدخول</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/auth">
            <Button variant="outline" className="w-full">
              <ArrowRight className="ml-2 h-4 w-4" />
              العودة لتسجيل الدخول
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
