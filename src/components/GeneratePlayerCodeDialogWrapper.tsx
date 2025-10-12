import { useState, useEffect } from 'react';
import GeneratePlayerCodeDialog from './GeneratePlayerCodeDialog';

interface GeneratePlayerCodeDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneratePlayerCodeDialogWrapper = ({ open, onOpenChange }: GeneratePlayerCodeDialogWrapperProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  // Sincronizar com o estado externo usando useEffect
  useEffect(() => {
    setInternalOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange(newOpen);
  };

  // Só renderizar quando o modal está aberto
  if (!internalOpen) {
    return null;
  }

  return (
    <GeneratePlayerCodeDialog
      open={internalOpen}
      onOpenChange={handleOpenChange}
    />
  );
};

export default GeneratePlayerCodeDialogWrapper;
