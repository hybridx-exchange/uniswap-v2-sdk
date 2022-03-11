import { TokenAmount } from './tokenAmount'

export class Order {
    public readonly price: TokenAmount
    public readonly amount: TokenAmount

    public constructor(price: TokenAmount, amount: TokenAmount){
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