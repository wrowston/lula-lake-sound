import { SignUp } from "@clerk/nextjs";
import { ClerkClientProvider } from "@/components/clerk-client-provider";

export default function SignUpPage() {
  return (
    <ClerkClientProvider>
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <SignUp />
      </div>
    </ClerkClientProvider>
  );
}
