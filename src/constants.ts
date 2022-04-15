import JSBI from 'jsbi'

// exports for external consumption
export type BigintIsh = JSBI | bigint | string

export enum ChainId {
  MAINNET = 42262,
  TESTNET = 42261
}

export enum SwapType {
  EXACT_INPUT,
  EXACT_OUTPUT
}

export enum TradeType {
  LIMIT_BUY = 1,
  LIMIT_SELL= 2
}

export enum Rounding {
  ROUND_DOWN,
  ROUND_HALF_UP,
  ROUND_UP
}

export const FACTORY_ADDRESS = '0x68E86D6fA7AD6f15690149F45b45B22a21B3DDdC'

export const INIT_CODE_HASH = '0xf098c0393b36cedf23c63f959d84d02bb38a719c10c9f00d1920eb1c3b6182a5'

export const ORDER_BOOK_FACTORY_ADDRESS = "0x7F2858b5BC80f04F8Ab68c85C7a303c2D957E413"

export const ORDER_BOOK_INIT_CODE_HASH = "0xf354baaef11965053dfbd45fee0f048eb9e6824869191be4544205a855936a9c"

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
