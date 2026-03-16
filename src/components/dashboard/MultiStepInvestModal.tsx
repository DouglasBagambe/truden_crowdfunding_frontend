'use client';

/**
 * MultiStepInvestModal – Fiat investment flow via DPO Pay
 *
 * Previously this component used a multi-step wagmi/viem/ESCROW blockchain flow.
 * That full implementation is preserved in the `blockchain/nfts-future` branch.
 *
 * Now it delegates to DPOPaymentModal exactly the way charity donations work.
 */

import DPOPaymentModal from '@/components/payments/DPOPaymentModal';

interface MultiStepInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
}

const MultiStepInvestModal = ({ isOpen, onClose, project }: MultiStepInvestModalProps) => (
  <DPOPaymentModal isOpen={isOpen} onClose={onClose} project={project} />
);

export default MultiStepInvestModal;
