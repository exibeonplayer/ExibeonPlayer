import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SimplePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimplePreviewModal: React.FC<SimplePreviewModalProps> = ({ isOpen, onClose }) => {
  console.log('SimplePreviewModal renderizado', { isOpen });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Preview da Barra Horizontal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Modal de Preview Funcionando!</h3>
            <p className="text-gray-600">Se você está vendo isso, o modal está abrindo corretamente.</p>
          </div>

          <div className="relative w-full h-64 bg-gray-100 rounded-lg border-2 border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">ÁREA DE PREVIEW</div>
              <div className="text-sm text-gray-500 mt-2">Aqui será exibido o vídeo e a barra horizontal</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimplePreviewModal;
