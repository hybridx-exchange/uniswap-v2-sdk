import JSBI from 'jsbi'

// exports for external consumption
export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 42262,
  TESTNET = 42261
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export const FACTORY_ADDRESS = '0x9d6206526Ed7522ba2eA1badFc5282A151Bc6F1d'

export const INIT_CODE_HASH = '0xf098c0393b36cedf23c63f959d84d02bb38a719c10c9f00d1920eb1c3b6182a5'

export const ORDER_BOOK_FACTORY_ADDRESS = "0xBc1F5Fdf4Bf9188a64a11EA307E8a118bFB2b8b4"

export const ORDER_BOOK_INIT_CODE_HASH = "0x40ed9e254a1a1c2b46ce07156be5683687740f84431d1805f7e90a15c0d713be"

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const TWO = JSBI.BigInt(2)
export const THREE = JSBI.BigInt(3)
export const FIVE = JSBI.BigInt(5)
export const TEN = JSBI.BigInt(10)
export const _100 = JSBI.BigInt(100)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}
