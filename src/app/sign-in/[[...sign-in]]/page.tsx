import { SignIn } from "@clerk/nextjs";
import { ClerkClientProvider } from "@/components/clerk-client-provider";

export default function SignInPage() {
  return (
    <ClerkClientProvider>
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <SignIn />
      </div>
    </ClerkClientProvider>
  );
}
