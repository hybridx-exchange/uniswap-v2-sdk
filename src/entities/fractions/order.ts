import { TokenAmount } from './tokenAmount'
import { Price } from './price'

export class Order {
    public readonly price: Price
    public readonly amount: TokenAmount

    public constructor(price: Price, amount: TokenAmount){
        this.price = price
        this.amount = amount
    }

    public lessThan(other: Order): boolean {
        return this.price.lessThan(other.price)
    }

    public equalTo(other: Order): boolean {
        return this.price.equalTo(other.price)
    }

    public greaterThan(other: Order): boolean {
        return this.price.greaterThan(other.price)
    }
}