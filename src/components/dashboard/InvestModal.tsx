'use client';

/**
 * InvestModal – Fiat investment flow via DPO Pay
 *
 * Previously this component used wagmi/viem/ESCROW smart-contract.
 * That implementation is preserved in the `blockchain/nfts-future` branch.
 *
 * Now it simply delegates to DPOPaymentModal exactly the way charity donations do.
 */

import DPOPaymentModal from '@/components/payments/DPOPaymentModal';
import { useRoiAccess } from '@/hooks/useRoiAccess';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const InvestModal = ({ isOpen, onClose, project }: InvestModalProps) => {
  const { hasRoiAccess } = useRoiAccess();

  if (!hasRoiAccess) return null;

  return <DPOPaymentModal isOpen={isOpen} onClose={onClose} project={project} />;
};

export default InvestModal;
