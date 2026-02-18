export const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0xC13522d9fF924Da679B51eD9FD3A950CD2D3eCc2') as `0x${string}`;

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

export const INVESTMENT_NFT_ADDRESS = (process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const INVESTMENT_NFT_ABI = [
  {
    type: 'function',
    name: 'mintInvestmentNFT',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'investor', type: 'address' },
      { name: 'projectId', type: 'string' },
      { name: 'amount', type: 'uint256' },
      { name: 'metadataURI', type: 'string' },
      { name: 'investmentId', type: 'string' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'updateInvestmentValue',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'newValue', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getInvestmentData',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'projectId', type: 'string' },
          { name: 'investor', type: 'address' },
          { name: 'initialAmount', type: 'uint256' },
          { name: 'currentValue', type: 'uint256' },
          { name: 'investmentDate', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'investmentId', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const;
