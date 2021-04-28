import invariant from 'tiny-invariant'
import JSBI from 'jsbi'
import {getNetwork} from '@ethersproject/networks'
import {BaseProvider, getDefaultProvider} from '@ethersproject/providers'
import {Contract} from '@ethersproject/contracts'
import {pack, keccak256} from '@ethersproject/solidity'
import {getCreate2Address} from '@ethersproject/address'

import FactoryABI from '../abis/Factory.json'
import PairABI from '../abis/Pair.json'
import {
    BigintIsh,
    ChainId,
    FACTORY_ADDRESS,
    ZERO_ADDRESS,
    INIT_CODE_HASH,
    MINIMUM_LIQUIDITY,
    ZERO,
    ONE,
    FIVE,
    _997,
    _1000
} from '../constants'
import {sqrt, parseBigintIsh} from '../utils'
import {InsufficientReservesError, InsufficientInputAmountError} from '../errors'
import {Token} from './token'
import {Price} from './fractions/price'
import {TokenAmount} from './fractions/tokenAmount'

let PAIR_ADDRESS_CACHE: { [token0Address: string]: { [token1Address: string]: string } } =
    localStorage.getItem('PAIR_ADDRESS_CACHE') ? JSON.parse(<string>localStorage.getItem('PAIR_ADDRESS_CACHE')) : {}
let PAIR_OBJ_CACHE: { [pairKey: string]: Pair } = {}

export class Pair {
    public liquidityToken: Token
    private readonly tokenAmounts: [TokenAmount, TokenAmount]

    public static getProvider(_chainId: ChainId): BaseProvider {
        let provider
        if (_chainId === ChainId.OETH) {
            provider = getDefaultProvider("https://rpc.oasiseth.org:8545")
        } else {
            let network = getNetwork(_chainId);
            provider = getDefaultProvider(network)
        }

        return provider
    }

    public static computePairAddress = ({
                                            factoryAddress,
                                            tokenA,
                                            tokenB
                                        }: {
        factoryAddress: string
        tokenA: Token
        tokenB: Token
    }): string => {
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
        return getCreate2Address(
            factoryAddress,
            keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
            INIT_CODE_HASH
        )
    }

    public static async fetchAllPairAddress(_chainId: ChainId) {
        let provider = this.getProvider(_chainId)
        let factoryContract = new Contract(FACTORY_ADDRESS, FactoryABI, provider)
        let allPairsLengh = await factoryContract.allPairsLength()

        for (let i = 0; i < allPairsLengh; i++) {
            let pairAddress = await factoryContract.allPairs(i)
            if (PAIR_ADDRESS_CACHE?.[pairAddress] === undefined) {
                let pairContract = new Contract(pairAddress, PairABI, provider)
                let token0 = await pairContract.token0()
                let token1 = await pairContract.token1()
                PAIR_ADDRESS_CACHE = {
                    ...PAIR_ADDRESS_CACHE,
                    [token0]: {
                        ...PAIR_ADDRESS_CACHE?.[token0],
                        [token1]: pairAddress
                    }
                }
                PAIR_ADDRESS_CACHE = {
                    ...PAIR_ADDRESS_CACHE,
                    [token1]: {
                        ...PAIR_ADDRESS_CACHE?.[token1],
                        [token0]: pairAddress
                    }
                }
                PAIR_ADDRESS_CACHE = {
                    ...PAIR_ADDRESS_CACHE,
                    [pairAddress]: token0.concat("-").concat(token1)
                }
            }
        }
        localStorage.setItem('PAIR_ADDRESS_CACHE', JSON.stringify(PAIR_ADDRESS_CACHE))
    }

    public static fetchPairAddress(
        tokenA: Token, tokenB: Token
    ) {
        invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID')
        const tokens = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
        if (PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined) {
            let provider = this.getProvider(tokenA.chainId)
            new Contract(FACTORY_ADDRESS, FactoryABI, provider).getPair(tokens[0].address, tokens[1].address).then((pairAddress: string) => {
                let pairToken = new Token(
                    tokens[0].chainId,
                    pairAddress,
                    18,
                    'UNI-V2',
                    'Uniswap V2'
                )

                if (pairToken) {
                    PAIR_ADDRESS_CACHE = {
                        ...PAIR_ADDRESS_CACHE,
                        [tokens[0].address]: {
                            ...PAIR_ADDRESS_CACHE?.[tokens[0].address],
                            [tokens[1].address]: pairAddress
                        }
                    }

                    PAIR_ADDRESS_CACHE = {
                        ...PAIR_ADDRESS_CACHE,
                        [tokens[1].address]: {
                            ...PAIR_ADDRESS_CACHE?.[tokens[1].address],
                            [tokens[0].address]: pairAddress
                        }
                    }
                    localStorage.setItem('PAIR_ADDRESS_CACHE', JSON.stringify(PAIR_ADDRESS_CACHE))
                    let pairKey1 = tokens[0].address.concat(tokens[1].address)
                    let pairKey2 = tokens[1].address.concat(tokens[0].address)
                    if (PAIR_OBJ_CACHE[pairKey1]) PAIR_OBJ_CACHE[pairKey1].liquidityToken = pairToken
                    if (PAIR_OBJ_CACHE[pairKey2]) PAIR_OBJ_CACHE[pairKey2].liquidityToken = pairToken
                }
            })
        }
    }

    public static getAddress(tokenA: Token, tokenB: Token): string {
        invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID')
        if (ChainId.OETH == tokenA.chainId) {
            const tokens = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
            if (PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address] === undefined) {
                Pair.fetchPairAddress(tokenA, tokenB)
                return ZERO_ADDRESS
            }

            return PAIR_ADDRESS_CACHE?.[tokens[0].address]?.[tokens[1].address]
        } else {
            return this.computePairAddress({factoryAddress: FACTORY_ADDRESS, tokenA, tokenB})
        }
    }

    constructor(tokenAmountA: TokenAmount, tokenAmountB: TokenAmount) {
        const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
            ? [tokenAmountA, tokenAmountB]
            : [tokenAmountB, tokenAmountA]
        this.liquidityToken = new Token(
            tokenAmounts[0].token.chainId,
            Pair.getAddress(tokenAmounts[0].token, tokenAmounts[1].token),
            18,
            'UNI-V2',
            'Uniswap V2'
        )
        this.tokenAmounts = tokenAmounts as [TokenAmount, TokenAmount]
        PAIR_OBJ_CACHE[tokenAmounts[0].token.address.concat(tokenAmounts[1].token.address)] = this
        PAIR_OBJ_CACHE[tokenAmounts[1].token.address.concat(tokenAmounts[0].token.address)] = this
    }

    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    public involvesToken(token: Token): boolean {
        return token.equals(this.token0) || token.equals(this.token1)
    }

    /**
     * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
     */
    public get token0Price(): Price {
        return new Price(this.token0, this.token1, this.tokenAmounts[0].raw, this.tokenAmounts[1].raw)
    }

    /**
     * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
     */
    public get token1Price(): Price {
        return new Price(this.token1, this.token0, this.tokenAmounts[1].raw, this.tokenAmounts[0].raw)
    }

    /**
     * Return the price of the given token in terms of the other token in the pair.
     * @param token token to return price of
     */
    public priceOf(token: Token): Price {
        invariant(this.involvesToken(token), 'TOKEN')
        return token.equals(this.token0) ? this.token0Price : this.token1Price
    }

    /**
     * Returns the chain ID of the tokens in the pair.
     */
    public get chainId(): ChainId {
        return this.token0.chainId
    }

    public get token0(): Token {
        return this.tokenAmounts[0].token
    }

    public get token1(): Token {
        return this.tokenAmounts[1].token
    }

    public get reserve0(): TokenAmount {
        return this.tokenAmounts[0]
    }

    public get reserve1(): TokenAmount {
        return this.tokenAmounts[1]
    }

    public reserveOf(token: Token): TokenAmount {
        invariant(this.involvesToken(token), 'TOKEN')
        return token.equals(this.token0) ? this.reserve0 : this.reserve1
    }

    public getOutputAmount(inputAmount: TokenAmount): [TokenAmount, Pair] {
        invariant(this.involvesToken(inputAmount.token), 'TOKEN')
        if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
            throw new InsufficientReservesError()
        }
        const inputReserve = this.reserveOf(inputAmount.token)
        const outputReserve = this.reserveOf(inputAmount.token.equals(this.token0) ? this.token1 : this.token0)
        const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _997)
        const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw)
        const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _1000), inputAmountWithFee)
        const outputAmount = new TokenAmount(
            inputAmount.token.equals(this.token0) ? this.token1 : this.token0,
            JSBI.divide(numerator, denominator)
        )
        if (JSBI.equal(outputAmount.raw, ZERO)) {
            throw new InsufficientInputAmountError()
        }
        return [outputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
    }

    public getInputAmount(outputAmount: TokenAmount): [TokenAmount, Pair] {
        invariant(this.involvesToken(outputAmount.token), 'TOKEN')
        if (
            JSBI.equal(this.reserve0.raw, ZERO) ||
            JSBI.equal(this.reserve1.raw, ZERO) ||
            JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.token).raw)
        ) {
            throw new InsufficientReservesError()
        }

        const outputReserve = this.reserveOf(outputAmount.token)
        const inputReserve = this.reserveOf(outputAmount.token.equals(this.token0) ? this.token1 : this.token0)
        const numerator = JSBI.multiply(JSBI.multiply(inputReserve.raw, outputAmount.raw), _1000)
        const denominator = JSBI.multiply(JSBI.subtract(outputReserve.raw, outputAmount.raw), _997)
        const inputAmount = new TokenAmount(
            outputAmount.token.equals(this.token0) ? this.token1 : this.token0,
            JSBI.add(JSBI.divide(numerator, denominator), ONE)
        )
        return [inputAmount, new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount))]
    }

    public getLiquidityMinted(
        totalSupply: TokenAmount,
        tokenAmountA: TokenAmount,
        tokenAmountB: TokenAmount
    ): TokenAmount {
        invariant(totalSupply.token.equals(this.liquidityToken), 'LIQUIDITY')
        const tokenAmounts = tokenAmountA.token.sortsBefore(tokenAmountB.token) // does safety checks
            ? [tokenAmountA, tokenAmountB]
            : [tokenAmountB, tokenAmountA]
        invariant(tokenAmounts[0].token.equals(this.token0) && tokenAmounts[1].token.equals(this.token1), 'TOKEN')

        let liquidity: JSBI
        if (JSBI.equal(totalSupply.raw, ZERO)) {
            liquidity = JSBI.subtract(sqrt(JSBI.multiply(tokenAmounts[0].raw, tokenAmounts[1].raw)), MINIMUM_LIQUIDITY)
        } else {
            const amount0 = JSBI.divide(JSBI.multiply(tokenAmounts[0].raw, totalSupply.raw), this.reserve0.raw)
            const amount1 = JSBI.divide(JSBI.multiply(tokenAmounts[1].raw, totalSupply.raw), this.reserve1.raw)
            liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1
        }
        if (!JSBI.greaterThan(liquidity, ZERO)) {
            throw new InsufficientInputAmountError()
        }
        return new TokenAmount(this.liquidityToken, liquidity)
    }

    public getLiquidityValue(
        token: Token,
        totalSupply: TokenAmount,
        liquidity: TokenAmount,
        feeOn: boolean = false,
        kLast?: BigintIsh
    ): TokenAmount {
        invariant(this.involvesToken(token), 'TOKEN')
        invariant(totalSupply.token.equals(this.liquidityToken), 'TOTAL_SUPPLY')
        invariant(liquidity.token.equals(this.liquidityToken), 'LIQUIDITY')
        invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), 'LIQUIDITY')

        let totalSupplyAdjusted: TokenAmount
        if (!feeOn) {
            totalSupplyAdjusted = totalSupply
        } else {
            invariant(!!kLast, 'K_LAST')
            const kLastParsed = parseBigintIsh(kLast)
            if (!JSBI.equal(kLastParsed, ZERO)) {
                const rootK = sqrt(JSBI.multiply(this.reserve0.raw, this.reserve1.raw))
                const rootKLast = sqrt(kLastParsed)
                if (JSBI.greaterThan(rootK, rootKLast)) {
                    const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(rootK, rootKLast))
                    const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast)
                    const feeLiquidity = JSBI.divide(numerator, denominator)
                    totalSupplyAdjusted = totalSupply.add(new TokenAmount(this.liquidityToken, feeLiquidity))
                } else {
                    totalSupplyAdjusted = totalSupply
                }
            } else {
                totalSupplyAdjusted = totalSupply
            }
        }

        return new TokenAmount(
            token,
            JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw)
        )
    }
}

Pair.fetchAllPairAddress(ChainId.OETH).then(() => {
    console.log("fetch all pair done")
})
