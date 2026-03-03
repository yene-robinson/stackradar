import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-6 border-t border-border/30 relative">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
            <Zap className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">
            Stack<span className="text-primary">Radar</span>
          </span>
        </div>
        <nav aria-label="Footer links" className="flex items-center gap-6 text-xs text-muted-foreground">
          {['Docs', 'GitHub', 'Discord', 'Twitter'].map((link) => (
            <a
              key={link}
              href="#"
              aria-label={link}
              className="hover:text-foreground transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-px after:bottom-0 after:left-0 after:bg-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
            >
              {link}
            </a>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">© 2026 StackRadar. All rights reserved.</p>
      </div>
    </footer>
  );
}
