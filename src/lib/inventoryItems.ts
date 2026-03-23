export type InventoryItem = {
  name: string;
  symbol: string;
  address: `0x${string}`;
  image?: string;
  decimals: number; // inventory items are 0 decimals
};

// Source: https://devs.defikingdoms.com/tokens/inventory-items (DFK Chain mainnet)
export const DFK_INVENTORY_ITEMS: InventoryItem[] = [
  {
    name: 'Ambertaffy',
    symbol: 'DFKAMBRTFY',
    address: '0xB78d5580d6D897DE60E1A942A5C1dc07Bc716943',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/ambertaffy.png',
    decimals: 0,
  },
  {
    name: 'Bluestem',
    symbol: 'DFKBLUESTEM',
    address: '0x0776b936344DE7bd58A4738306a6c76835ce5D3F',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/bluestem.png',
    decimals: 0,
  },
  {
    name: 'Darkweed',
    symbol: 'DFKDRKWD',
    address: '0x848Ac8ddC199221Be3dD4e4124c462B806B6C4Fd',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/darkweed.png',
    decimals: 0,
  },
  {
    name: 'Ironscale',
    symbol: 'DFKIRONSCALE',
    address: '0x04B43D632F34ba4D4D72B0Dc2DC4B30402e5Cf88',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/ironscale.png',
    decimals: 0,
  },
  {
    name: 'Lanterneye',
    symbol: 'DFKLANTERNEYE',
    address: '0xc2Ff93228441Ff4DD904c60Ecbc1CfA2886C76eB',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/lanterneye.png',
    decimals: 0,
  },
  {
    name: 'Milkweed',
    symbol: 'DFKMILKWEED',
    address: '0xA2cef1763e59198025259d76Ce8F9E60d27B17B5',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/milkweed.png',
    decimals: 0,
  },
  {
    name: 'Rockroot',
    symbol: 'DFKRCKRT',
    address: '0x60170664b52c035Fcb32CF5c9694b22b47882e5F',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/rockroot.png',
    decimals: 0,
  },
  {
    name: 'Sailfish',
    symbol: 'DFKSAILFISH',
    address: '0x7f46E45f6e0361e7B9304f338404DA85CB94E33D',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/sailfish.png',
    decimals: 0,
  },
  {
    name: 'Shimmerskin',
    symbol: 'DFKSHIMMERSKIN',
    address: '0xd44ee492889C078934662cfeEc790883DCe245f3',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/shimmerskin.png',
    decimals: 0,
  },
  {
    name: 'Skunk Shade',
    symbol: 'DFKSKNSHADE',
    address: '0xc6030Afa09EDec1fd8e63a1dE10fC00E0146DaF3',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/skunkShade.png',
    decimals: 0,
  },
  {
    name: 'Spiderfruit',
    symbol: 'DFKSPIDRFRT',
    address: '0x3E022D84D397F18743a90155934aBAC421D5FA4C',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/spider-fruit.png',
    decimals: 0,
  },
  {
    name: 'Swift-Thistle',
    symbol: 'DFKSWFTHSL',
    address: '0x97b25DE9F61BBBA2aD51F1b706D4D7C04257f33A',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/swift-thistle.png',
    decimals: 0,
  },
  {
    name: 'Three-Eyed Eel',
    symbol: 'DFKTHREEL',
    address: '0x6513757978E89e822772c16B60AE033781A29A4F',
    image: 'https://defi-kingdoms.b-cdn.net/art-assets/items/threeEyedEel.png',
    decimals: 0,
  },
];
