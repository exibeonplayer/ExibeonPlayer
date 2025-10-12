import { useState, useCallback, memo } from 'react';
import GeneratePlayerCodeModal from './GeneratePlayerCodeModal';

interface GeneratePlayerCodeModalWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GeneratePlayerCodeModalWrapper = memo(({ open, onOpenChange }: GeneratePlayerCodeModalWrapperProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setInternalOpen(newOpen);
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Sincronizar estado interno com externo
  if (open !== internalOpen) {
    setInternalOpen(open);
  }

  // Só renderizar quando necessário
  if (!internalOpen) {
    return null;
  }

  return (
    <GeneratePlayerCodeModal
      open={internalOpen}
      onOpenChange={handleOpenChange}
    />
  );
});

GeneratePlayerCodeModalWrapper.displayName = 'GeneratePlayerCodeModalWrapper';

export default GeneratePlayerCodeModalWrapper;
