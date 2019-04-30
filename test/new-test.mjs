import Test from '../index.mjs'
import a from 'assert'
import { halt } from './lib/util.mjs'

{ /* new Test(): default name, default options */
  const test = new Test()
  a.ok(test.name)
  a.strictEqual(test.testFn, undefined)
  a.strictEqual(test.timeout, 10000)
}

{ /* new Test(name) */
  const test = new Test('name')
  a.strictEqual(test.name, 'name')
  a.strictEqual(test.testFn, undefined)
  a.strictEqual(test.timeout, 10000)
}

{ /* new Test(name, testFn, options) */
  const testFn = function () {}
  const options = { timeout: 1 }
  const test = new Test('one', testFn, options)
  a.strictEqual(test.name, 'one')
  a.strictEqual(test.testFn, testFn)
  a.strictEqual(test.timeout, 1)
}

{ /* new Test(testFn, options): default name and testFn */
  const testFn = function () {}
  const options = { timeout: 1 }
  const test = new Test(testFn, options)
  a.ok(test.name)
  a.strictEqual(test.testFn, testFn)
  a.strictEqual(test.timeout, 1)
}

{ /* new Test(options): options only */
  const options = { timeout: 1 }
  const test = new Test(options)
  a.ok(test.name)
  a.strictEqual(test.testFn, undefined)
  a.strictEqual(test.timeout, 1)
}

{ /* new Test(name, options) */
  const options = { timeout: 1 }
  const test = new Test('one', options)
  a.strictEqual(test.name, 'one')
  a.strictEqual(test.testFn, undefined)
  a.strictEqual(test.timeout, 1)
}
