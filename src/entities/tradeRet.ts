import { TokenAmount } from "entities/fractions";
import { OrderBook } from "entities/orderBook";

export class TradeRet {
    public readonly orderBook: OrderBook
    public readonly ammAmountIn: TokenAmount
    public readonly ammAmountOut: TokenAmount
    public readonly orderAmountIn: TokenAmount
    public readonly orderAmountOut: TokenAmount
    public readonly orderFee: TokenAmount
    public readonly amountLeft: TokenAmount
    public readonly priceTo: TokenAmount

    public constructor (orderBook: OrderBook,
    ammAmountIn: TokenAmount,
    ammAmountOut: TokenAmount,
    orderAmountIn: TokenAmount,
    orderAmountOut: TokenAmount,
    orderFee: TokenAmount,
    amountLeft: TokenAmount,
    priceTo: TokenAmount) {
        this.orderBook = orderBook
        this.ammAmountIn = ammAmountIn
        this.ammAmountOut = ammAmountOut
        this.orderAmountIn = orderAmountIn
        this.orderAmountOut = orderAmountOut
        this.orderFee = orderFee
        this.amountLeft = amountLeft
        this.priceTo = priceTo
    }
}