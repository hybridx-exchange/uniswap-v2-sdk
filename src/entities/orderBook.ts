import {TokenAmount} from './fractions/tokenAmount'
import {Token} from './token'
import {keccak256, pack} from '@ethersproject/solidity'
import {getCreate2Address} from '@ethersproject/address'
import {BigintIsh, ORDER_BOOK_FACTORY_ADDRESS, ORDER_BOOK_INIT_CODE_HASH, TradeType} from '../constants'
import {Order} from './fractions/order';
import JSBI from "jsbi";
import {parseBigintIsh} from "../utils";
import {formatUnits, parseUnits} from "@ethersproject/units";

let ORDERBOOK_ADDRESS_CACHE: { [token0Address: string]: { [token1Address: string]: string } } = {}

export class OrderBook {
  public readonly baseToken: TokenAmount
  public readonly quoteToken: TokenAmount
  public readonly orderBookAddress: String
  public readonly minAmount: BigintIsh
  public readonly priceStep: BigintIsh
  public readonly protocolFeeRate: BigintIsh
  public readonly subsidyFeeRate: BigintIsh
  public readonly curPrice: TokenAmount
  public readonly buyOrders: Order[]
  public readonly sellOrders: Order[]

  public constructor(baseToken: TokenAmount, quoteToken: TokenAmount,
                     minAmount: BigintIsh, priceStep: BigintIsh,
                     protocolFeeRate: BigintIsh, subsidyFeeRate: BigintIsh,
                     curPrice: TokenAmount,
                     buyOrders: Order[], sellOrders: Order[]) {
    this.orderBookAddress = OrderBook.getAddress(baseToken.token, quoteToken.token)
    this.baseToken = baseToken
    this.quoteToken = quoteToken
    this.minAmount = minAmount
    this.priceStep = priceStep
    this.protocolFeeRate = protocolFeeRate
    this.subsidyFeeRate = subsidyFeeRate
    this.curPrice = curPrice
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

  public getMinQuoteAmount(parsedPrice: BigintIsh) : BigintIsh {
    //minQuoteAmount = minBaseAmount * parsePrice / baseDecimal
    return JSBI.divide(JSBI.multiply(parseBigintIsh(parsedPrice), parseBigintIsh(this.minAmount)),
        parseBigintIsh(parseUnits('1', this.baseToken.token.decimals).toString()))
  }

  public getPriceSignificantDigits() : number {
    const priceStepAmount = formatUnits(this.priceStep.toString(), this.quoteToken.token.decimals)
    return priceStepAmount.substring(priceStepAmount.indexOf('.')).length
  }

  public getAmountSignificantDigits(tradeType: TradeType) : number {
    if (tradeType === TradeType.LIMIT_BUY) {
      const minAmount = JSBI.divide(JSBI.multiply(parseBigintIsh(this.minAmount), parseBigintIsh(this.priceStep)),
          parseBigintIsh(parseUnits('1', this.baseToken.token.decimals).toString()))
      const minAmountAmount = formatUnits(minAmount.toString(), this.quoteToken.token.decimals)
      return minAmountAmount.substring(minAmountAmount.indexOf('.')).length
    } else if (tradeType === TradeType.LIMIT_SELL) {
      const minAmount = this.minAmount
      const minAmountAmount = formatUnits(minAmount.toString(), this.baseToken.token.decimals)
      return minAmountAmount.substring(minAmountAmount.indexOf('.')).length
    }

    return 18
  }
}
