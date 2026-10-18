import { AppHeader } from "./AppHeader";

type Props = {
  userName: string;
  userId: string;
  children: React.ReactNode;
};

export function AppShell({ userName, userId, children }: Props) {
  return (
    <div className="min-h-screen">
      <AppHeader userName={userName} userId={userId} />
      <main data-tutorial-background className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
