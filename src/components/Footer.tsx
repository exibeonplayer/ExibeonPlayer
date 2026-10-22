import { Link } from 'react-router-dom';
import { Download, ArrowUpRight } from 'lucide-react';

const Footer = () => <footer className="mt-auto border-t border-border bg-card/60">
  <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
    <p>© {new Date().getFullYear()} Exibeon Player <span className="mx-1.5 text-border">/</span> Sinalização digital</p>
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3"><Link to="/primeiros-passos" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">Guia de uso <ArrowUpRight className="h-3 w-3"/></Link>
      <a href="https://github.com/exibeonplayer/Download-Exibeon/releases/download/1.1.0/Exibeon-Player-Setup-1.1.0.exe" target="_blank" rel="noopener noreferrer" aria-label="Baixar Exibeon Player 1.1.0 para Windows" className="inline-flex items-center gap-1.5 hover:text-foreground"><Download className="h-3.5 w-3.5"/>Baixar player 1.1.0</a>
    </div>
  </div>
</footer>;
export default Footer;
