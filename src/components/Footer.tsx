import { Link } from 'react-router-dom';
import { Download, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';

const Footer = () => {
  // Links externos - configure aqui
  const PLAYER_DOWNLOAD_LINK = 'https://github.com/exibeonplayer/Download-Exibeon/releases/download/1.0/Instalador.Exibeon-Player.1.0.exe'; // TODO: Adicionar link real do player
  const WHATSAPP_LINK = 'https://wa.me/5511999999999'; // TODO: Adicionar número do WhatsApp (formato: 55DDDNÚMERO)

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
          
          {/* Botão de Download do Player */}
          <a
            href={PLAYER_DOWNLOAD_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixe nosso player
            </Button>
          </a>

          {/* Botão de Contato WhatsApp */}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4" />
              Fale conosco
            </Button>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;