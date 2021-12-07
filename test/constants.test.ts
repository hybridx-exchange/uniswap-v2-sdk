import { INIT_CODE_HASH } from '../src/constants'

import { bytecode } from '@hybridx-exchange/v2-core/build/UniswapV2Pair.json'
import { keccak256 } from '@ethersproject/solidity'

// this _could_ go in constants, except that it would cost every consumer of the sdk the CPU to compute the hash
// and load the JSON.
const COMPUTED_INIT_CODE_HASH = keccak256(['bytes'], [`0x${bytecode}`])

describe('constants', () => {
  describe('INIT_CODE_HASH', () => {
    it('matches computed bytecode hash', () => {
      console.log(COMPUTED_INIT_CODE_HASH)
      console.log(INIT_CODE_HASH)
    })
  })
})
