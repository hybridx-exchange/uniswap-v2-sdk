import { TokenAmount } from './tokenAmount'
import {BigintIsh, TradeType} from "../../constants";
import {Token} from "entities";

export class UserOrder {
    public readonly orderBook: string
    public readonly baseToken: Token
    public readonly quoteToken: Token
    public readonly owner: string
    public readonly to: string
    public readonly orderId: BigintIsh
    public readonly price: TokenAmount
    public readonly amountOffer: TokenAmount
    public readonly amountLeft: TokenAmount
    public readonly orderType: TradeType
    public readonly orderIndex: BigintIsh


    public constructor(orderBook: string,
                       baseToken: Token,
                       quoteToken: Token,
                       owner: string,
                       to: string,
                       orderId: BigintIsh,
                       price: TokenAmount,
                       amountOffer: TokenAmount,
                       amountLeft: TokenAmount,
                       orderType: TradeType,
                       orderIndex: BigintIsh){
        this.orderBook = orderBook
        this.baseToken = baseToken
        this.quoteToken = quoteToken
        this.owner = owner
        this.to = to
        this.orderId = orderId
        this.price = price
        this.amountOffer = amountOffer
        this.amountLeft = amountLeft
        this.orderType = orderType
        this.orderIndex = orderIndex
    }
}