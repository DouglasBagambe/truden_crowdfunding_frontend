export const ESCROW_ADDRESS = '0xC13522d9fF924Da679B51eD9FD3A950CD2D3eCc2';

export const ESCROW_ABI = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [
      { name: '_projectId', type: 'uint256' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'createProject',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_title', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_targetAmount', type: 'uint256' },
      { name: '_deadline', type: 'uint256' },
      { name: '_token', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;
