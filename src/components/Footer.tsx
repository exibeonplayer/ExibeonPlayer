import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="text-sm text-muted-foreground">
          © 2025 Exibeon Player | Todos os direitos reservados.
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/primeiros-passos"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Primeiros Passos
          </Link>
          <Link
            to="/documentacoes"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentações
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;