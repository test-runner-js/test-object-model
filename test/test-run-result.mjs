import Test from '../index.mjs'
import a from 'assert'
import { halt } from './lib/util.mjs'

{ /* passing sync test */
  const test = new Test('tom', () => true)
  test.run()
    .then(result => {
      a.ok(result === true)
    })
    .catch(halt)
}

{ /* failing sync test */
  const test = new Test('tom', function () {
    throw new Error('failed')
  })
  test.run()
    .then(() => {
      a.ok(false, "shouldn't reach here")
    })
    .catch(err => {
      a.ok(/failed/.test(err.message))
    })
    .catch(halt)
}

{ /* passing async test */
  const test = new Test('tom', function () {
    return Promise.resolve(true)
  })
  test.run().then(result => {
    a.strictEqual(result, true)
  })
}

{ /* failing async test: rejected */
  const test = new Test('tom', function () {
    return Promise.reject(new Error('failed'))
  })
  test.run()
    .then(() => {
      a.ok(false, "shouldn't reach here")
    })
    .catch(err => {
      a.ok(/failed/.test(err.message))
    })
    .catch(halt)
}

{ /* failing async test: timeout */
  const test = new Test(
    'tom',
    function () {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 300)
      })
    },
    { timeout: 150 }
  )
  test.run()
    .then(() => a.ok(false, 'should not reach here'))
    .catch(err => {
      a.ok(/Timeout expired/.test(err.message))
    })
    .catch(halt)
}

{ /* passing async test: timeout 2 */
  const test = new Test(
    'tom',
    function () {
      return new Promise((resolve, reject) => {
        setTimeout(() => resolve('ok'), 300)
      })
    },
    { timeout: 350 }
  )
  test.run()
    .then(result => {
      a.ok(result === 'ok')
    })
    .catch(halt)
}

{ /* no test function: ignore, don't start, skip, pass or fail event */
  const test = new Test('one')
  test.run()
    .then(result => {
      a.strictEqual(result, undefined)
      a.strictEqual(test.ended, false)
      a.strictEqual(test.state, 'ignored')
    })
    .catch(halt)
}
