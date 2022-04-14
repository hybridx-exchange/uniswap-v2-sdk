import {TradeType, ZERO} from './constants'
import invariant from 'tiny-invariant'
import {parseBigintIsh, toHex, validateAndParseAddress, ZERO_HEX} from './utils'
import {ETHER, Trade, WETH} from './entities'
import JSBI from "jsbi";

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How long the swap is valid until it expires, in seconds.
   * This will be used to produce a `deadline` parameter which is computed from when the swap call parameters
   * are generated.
   */
  ttl: number
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string
}

export interface TradeOptionsDeadline extends Omit<TradeOptions, 'ttl'> {
  /**
   * When the transaction expires.
   * This is an atlernate to specifying the ttl, for when you do not want to use local time.
   */
  deadline: number
}

/**
 * The parameters to use in the call to the Uniswap V2 Router to execute a trade.
 */
export interface TradeParameters {
  /**
   * The method to call on the Uniswap V2 Router.
   */
  methodName: string
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[]
  /**
   * The amount of wei to send in hex.
   */
  value: string
}

/**
 * Represents the Uniswap V2 Router, and has static methods for helping execute trades.
 */
export abstract class Trader {
  /**
   * Cannot be constructed.
   */
  private constructor() {}
  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static tradeCallParameters(trade: Trade, options: TradeOptions | TradeOptionsDeadline): TradeParameters {
    const type = trade.tradeType
    const baseToken = trade.orderBook.baseToken.token
    const quoteToken = trade.orderBook.quoteToken.token
    const etherIn = (type === TradeType.LIMIT_BUY && trade.quoteToken === ETHER) || (type === TradeType.LIMIT_SELL && trade.baseToken === ETHER)
    // the router does not support both ether in and out
    invariant(((trade.baseToken === ETHER && baseToken === WETH[baseToken.chainId]) || (trade.baseToken === baseToken)), 'BASE_TOKEN_NOT_MATCH')
    invariant(((trade.quoteToken === ETHER && quoteToken === WETH[quoteToken.chainId]) || (trade.quoteToken === quoteToken)), 'QUOTE_TOKEN_NOT_MATCH')
    invariant(!((trade.quoteToken === ETHER && trade.baseToken === WETH[quoteToken.chainId]) ||
        (trade.baseToken === ETHER && trade.quoteToken === WETH[quoteToken.chainId]) ||
        (trade.quoteToken === trade.baseToken)), 'TOKEN_NOT_MATCH')
    //invariant(JSBI.equal(JSBI.remainder(trade.price.raw, parseBigintIsh(trade.orderBook.priceStep)), ZERO),
      // 'PRICE_MISMATCH_STEP')
    //invariant((type === TradeType.LIMIT_BUY && JSBI.GE(trade.amount.raw, parseBigintIsh(trade.orderBook.minAmount)) ||
        //(type === TradeType.LIMIT_SELL && JSBI.GE(trade.amount.raw,
      // trade.orderBook.getMinBaseAmount(trade.price.raw)))), 'AMOUNT_TOO_SMALL')
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL')

    const to: string = validateAndParseAddress(options.recipient)
    const amountHex: string = toHex(trade.amount)
    const priceHex: string = toHex(trade.price)
    const deadline =
      'ttl' in options
        ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
        : `0x${options.deadline.toString(16)}`

    let methodName: string
    let args: (string | string[])[]
    let value: string
    switch (trade.tradeType) {
      case TradeType.LIMIT_BUY:
        if (etherIn) {
          methodName = 'buyWithEth'
          // (uint price, baseTokenAddress, address to, uint deadline)
          args = [priceHex, baseToken.address, to, deadline]
          value = amountHex
        } else {
          methodName = 'buyWithToken'
          // (uint amount, uint price, baseAddress, quoteAddress, address to, uint deadline)
          args = [amountHex, priceHex, baseToken.address, quoteToken.address, to, deadline]
          value = ZERO_HEX
        }
        break
      case TradeType.LIMIT_SELL:
        if (etherIn) {
          methodName = 'sellEth'
          // (uint price, quoteTokenAddress, address to, uint deadline)
          args = [priceHex, quoteToken.address, to, deadline]
          value = amountHex
        } else {
          methodName = 'sellToken'
          // (uint amount, uint price, baseTokenAddress, quoteTokenAddress, address to, uint deadline)
          args = [amountHex, priceHex, baseToken.address, quoteToken.address, to, deadline]
          value = ZERO_HEX
        }
        break
    }
    return {
      methodName,
      args,
      value
    }
  }
}
