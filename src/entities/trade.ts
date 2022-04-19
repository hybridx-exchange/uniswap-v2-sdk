import { TokenAmount } from "entities/fractions";
import { OrderBook } from "entities/orderBook";
import { TradeType } from "../constants";
import { Token } from "entities/token";
import { TradeRet } from "entities/tradeRet";

export class Trade {
    public readonly orderBook: OrderBook
    public readonly tradeRet: TradeRet
    public readonly baseToken: Token
    public readonly quoteToken: Token
    public readonly tradeType: TradeType
    public readonly amount: TokenAmount
    public readonly price: TokenAmount

    public constructor (orderBook: OrderBook,
    tradeType: TradeType,
    baseToken: Token,
    quoteToken: Token,
    amount: TokenAmount,
    price: TokenAmount,
    tradeRet: TradeRet) {
        this.orderBook = orderBook
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.tradeType = tradeType
        this.amount = amount
        this.price = price
        this.tradeRet = tradeRet
    }
}