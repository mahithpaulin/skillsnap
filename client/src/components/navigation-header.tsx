import { Link, useLocation } from "wouter";

interface NavigationHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    streakCount?: number | null;
    totalXp?: number | null;
  } | null;
}

export function NavigationHeader({ user }: NavigationHeaderProps) {
  const [location] = useLocation();
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "U";

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fa-home" },
    { href: "/skills", label: "Skills", icon: "fa-book" },
    { href: "/achievements", label: "Achievements", icon: "fa-trophy" },
    { href: "/groups", label: "Study Groups", icon: "fa-users" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="bg-primary rounded-xl p-2 cursor-pointer block" data-testid="logo-link">
              <i className="fas fa-bolt text-primary-foreground text-xl"></i>
            </Link>
            <h1 className="text-xl font-bold text-foreground">SkillSnap</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <i className={`fas ${item.icon} text-xs`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            {user && (
              <>
                {user.totalXp != null && (
                  <div className="hidden sm:flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                    <i className="fas fa-star text-yellow-500 text-xs"></i>
                    <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
                      {user.totalXp} XP
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">
                  <i className="fas fa-fire text-orange-500 text-sm streak-flame"></i>
                  <span className="text-sm font-semibold text-orange-700 dark:text-orange-300" data-testid="text-streak-count">
                    {user.streakCount ?? 0}
                  </span>
                </div>
              </>
            )}
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground" data-testid="text-user-initials">
                {initials}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-2">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center space-y-0.5 px-3 py-1 ${location === item.href ? "text-primary" : "text-muted-foreground"}`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-xs">{item.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
