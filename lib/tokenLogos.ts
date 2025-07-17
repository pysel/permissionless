// Token logos and metadata mapping
export interface TokenInfo {
  symbol: string;
  name: string;
  logoUrl: string;
  color: string;
  precision: number; // Number of decimal places allowed for input
}

// Common token addresses (you'll need to update these with actual addresses for your network)
export const TOKEN_ADDRESSES = {
  ETH: '0x0000000000000000000000000000000000000000'.toLowerCase(),
  WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c'.toLowerCase(),
  USDC: '0xA0b86a33E6441b8DBC06e6F6BBEe6DBb6Ee4F5D5'.toLowerCase(),
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(),
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'.toLowerCase(),
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'.toLowerCase(),
  LINK: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5'.toLowerCase(),
} as const;

export const TOKEN_INFO: Record<string, TokenInfo> = {
  [TOKEN_ADDRESSES.ETH]: {
    symbol: 'ETH',
    name: 'Ethereum',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png',
    color: 'bg-blue-500',
    precision: 3,
  },
  [TOKEN_ADDRESSES.WETH]: {
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    color: 'bg-blue-500',
    precision: 3,
  },
  [TOKEN_ADDRESSES.USDC]: {
    symbol: 'USDC',
    name: 'USD Coin',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86a33E6441b8DBC06e6F6BBEe6DBb6Ee4F5D5/logo.png',
    color: 'bg-blue-600',
    precision: 2,
  },
  [TOKEN_ADDRESSES.USDT]: {
    symbol: 'USDT',
    name: 'Tether USD',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
    color: 'bg-green-500',
    precision: 2,
  },
  [TOKEN_ADDRESSES.DAI]: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png',
    color: 'bg-yellow-500',
    precision: 2,
  },
  [TOKEN_ADDRESSES.WBTC]: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
    color: 'bg-orange-500',
    precision: 8,
  },
  [TOKEN_ADDRESSES.LINK]: {
    symbol: 'LINK',
    name: 'Chainlink',
    logoUrl: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png',
    color: 'bg-blue-400',
    precision: 3,
  },
};

// Fallback for unknown tokens
export const getTokenInfo = (address: string): TokenInfo => {
  return TOKEN_INFO[address.toLowerCase()] || {
    symbol: 'UNK',
    name: 'Unknown Token',
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTIiIHk9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsIj4/PC90ZXh0Pgo8L3N2Zz4K',
    color: 'bg-gray-500',
    precision: 2,
  };
}; 