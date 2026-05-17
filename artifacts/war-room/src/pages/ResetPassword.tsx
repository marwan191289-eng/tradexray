import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export default function ResetPassword() {
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>كلمة سر جديدة</CardTitle>
          <CardDescription>تمت إعادة تعيين كلمة السر عبر رابط البريد الإلكتروني</CardDescription>
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
