import { TokenAmount } from './fractions/tokenAmount'
import { Token } from './token'
import { pack, keccak256 } from '@ethersproject/solidity'
import { getCreate2Address } from '@ethersproject/address'
import {BigintIsh, ORDER_BOOK_FACTORY_ADDRESS, ORDER_BOOK_INIT_CODE_HASH} from '../constants'
import {Order} from "entities/fractions/order";

let ORDERBOOK_ADDRESS_CACHE: { [token0Address: string]: { [token1Address: string]: string } } = {}

export class OrderBook {
  public readonly orderBookAddress: String
  public readonly protocolFeeRate: BigintIsh
  public readonly subsidyFeeRate: BigintIsh
  public readonly buyOrders: Order[]
  public readonly sellOrders: Order[]

  public constructor(tokenAmountA: TokenAmount, tokenAmountB: TokenAmount,
                     protocolFeeRate: BigintIsh, subsidyFeeRate: BigintIsh,
                     buyOrders: Order[], sellOrders: Order[]) {
    this.orderBookAddress = OrderBook.getAddress(tokenAmountA.token, tokenAmountB.token)
    this.protocolFeeRate = protocolFeeRate
    this.subsidyFeeRate = subsidyFeeRate
    this.buyOrders = buyOrders
    this.sellOrders = sellOrders
  }

  public static getAddress(tokenA: Token, tokenB: Token): string {
    const tokens = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks

    if (ORDERBOOK_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined) {
      ORDERBOOK_ADDRESS_CACHE = {
        ...ORDERBOOK_ADDRESS_CACHE,
        [tokens[0].address]: {
          ...ORDERBOOK_ADDRESS_CACHE?.[tokens[0].address],
          [tokens[1].address]: getCreate2Address(
              ORDER_BOOK_FACTORY_ADDRESS,
              keccak256(['bytes'], [pack(['address', 'address'], [tokens[0].address, tokens[1].address])]),
              ORDER_BOOK_INIT_CODE_HASH
          )
        }
      }
    }

    return ORDERBOOK_ADDRESS_CACHE[tokens[0].address][tokens[1].address]
  }
}
