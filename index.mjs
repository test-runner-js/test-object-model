import raceTimeout from './node_modules/race-timeout-anywhere/index.mjs'
import mixin from './node_modules/create-mixin/index.mjs'
import CompositeClass from './node_modules/composite-class/index.mjs'
import StateMachine from './node_modules/fsm-base/index.mjs'

/**
 * Test function class.
 * @param {string} name
 * @param {function} testFn
 * @param {object} [options]
 * @param {number} [options.timeout]
 */
class Test extends mixin(CompositeClass)(StateMachine) {
  constructor (name, testFn, options) {
    if (typeof name === 'string') {
    } else if (typeof name === 'function') {
      options = testFn
      testFn = name
      name = ''
    } else if (typeof name === 'object') {
      options = name
      testFn = undefined
      name = ''
    }
    options = options || {}
    name = name || 'tom'
    super ([
      { from: undefined, to: 'pending' },
      { from: 'pending', to: 'start' },
      { from: 'pending', to: 'skip' },
      { from: 'start', to: 'pass' },
      { from: 'start', to: 'fail' },
      /* reset */
      { from: 'start', to: 'pending' },
      { from: 'pass', to: 'pending' },
      { from: 'fail', to: 'pending' },
      { from: 'skip', to: 'pending' },
    ])
    this.name = name
    this.testFn = testFn
    this.options = Object.assign({ timeout: 10000 }, options)
    this.index = 1
    this.state = 'pending'
    this._markSkip = options._markSkip
    this._skip = null
    this._only = options.only
  }

  toString () {
    return `${this.name}`
  }

  test (name, testFn, options) {
    for (const child of this) {
      if (child.name === name) {
        throw new Error('Duplicate name: ' + name)
      }
    }
    const test = new this.constructor(name, testFn, options)
    this.add(test)
    test.index = this.children.length
    this.skipLogic()
    return test
  }

  onlyExists () {
    return Array.from(this.root()).some(t => t._only)
  }

  skipLogic () {
    if (this.onlyExists()) {
      for (const test of this.root()) {
        if (test._markSkip) {
          test._skip = true
        } else {
          test._skip = !test._only
        }
      }
    } else {
      for (const test of this.root()) {
        test._skip = test._markSkip
      }
    }
  }

  skip (name, testFn, options) {
    options = options || {}
    options._markSkip = true
    const test = this.test(name, testFn, options)
    return test
  }

  only (name, testFn, options) {
    options = options || {}
    options.only = true
    const test = this.test(name, testFn, options)
    return test
  }

  /**
   * Execute the stored test function.
   * @returns {Promise}
   */
  run () {
    if (this.testFn) {
      if (this._skip) {
        this.setState('skip', this)
        return Promise.resolve()
      } else {
        this.state = 'start'
        const testFnResult = new Promise((resolve, reject) => {
          try {
            const result = this.testFn.call(new TestContext({
              name: this.name,
              index: this.index
            }))

            if (result && result.then) {
              result
                .then(testResult => {
                  this.setState('pass', this, testResult)
                  resolve(testResult)
                })
                .catch(reject)
            } else {
              this.setState('pass', this, result)
              resolve(result)
            }
          } catch (err) {
            this.setState('fail', this, err)
            reject(err)
          }
        })
        return Promise.race([ testFnResult, raceTimeout(this.options.timeout) ])
      }
    } else {
      return Promise.resolve()
    }
  }

  reset (deep) {
    if (deep) {
      for (const tom of this) {
        tom.reset()
      }
    } else {
      this.index = 1
      this.state = 'pending'
      this._skip = null
      this._only = null
    }
  }

  static combine (toms, name) {
    if (toms.length > 1) {
      const tom = new this(name)
      for (const subTom of toms) {
        tom.add(subTom)
      }
      return tom
    } else {
      return toms[0]
    }
  }
}

/**
 * The test context, available as `this` within each test function.
 */
class TestContext {
  constructor (context) {
    this.name = context.name
    this.index = context.index
  }
}

export default Test
