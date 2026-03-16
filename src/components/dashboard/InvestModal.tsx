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

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const InvestModal = ({ isOpen, onClose, project }: InvestModalProps) => (
  <DPOPaymentModal isOpen={isOpen} onClose={onClose} project={project} />
);

export default InvestModal;
