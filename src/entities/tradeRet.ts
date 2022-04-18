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
    public readonly amountExpect: TokenAmount
    public readonly priceTo: TokenAmount

    public constructor (orderBook: OrderBook,
    ammAmountIn: TokenAmount,
    ammAmountOut: TokenAmount,
    orderAmountIn: TokenAmount,
    orderAmountOut: TokenAmount,
    orderFee: TokenAmount,
    amountLeft: TokenAmount,
    amountExpect: TokenAmount,
    priceTo: TokenAmount) {
        this.orderBook = orderBook
        this.ammAmountIn = ammAmountIn
        this.ammAmountOut = ammAmountOut
        this.orderAmountIn = orderAmountIn
        this.orderAmountOut = orderAmountOut
        this.orderFee = orderFee
        this.amountLeft = amountLeft
        this.amountExpect = amountExpect
        this.priceTo = priceTo
    }

    public equalTo(other: TradeRet): boolean {
        if (!this.ammAmountIn &&
            !this.ammAmountOut &&
            !this.orderAmountIn &&
            !this.orderAmountOut &&
            !this.amountLeft &&
            !this.amountExpect &&
            !this.orderFee) {
            return false
        }

        return this.ammAmountIn.equalTo(other.ammAmountIn) &&
            this.ammAmountOut.equalTo(other.ammAmountOut) &&
            this.orderAmountIn.equalTo(other.orderAmountIn) &&
            this.orderAmountOut.equalTo(other.orderAmountOut) &&
            this.amountLeft.equalTo(other.amountLeft) &&
            this.amountExpect.equalTo(other.amountExpect) &&
            this.orderFee.equalTo(other.orderFee)
    }
}