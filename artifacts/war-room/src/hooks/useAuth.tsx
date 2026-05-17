import { useUser, useClerk } from "@clerk/react";

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  return {
    user: user ? { id: user.id, email: user.primaryEmailAddress?.emailAddress ?? "" } : null,
    loading: !isLoaded,
    signOut: () => signOut(),
  };
}
