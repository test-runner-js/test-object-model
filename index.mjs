import raceTimeout from './node_modules/race-timeout-anywhere/index.mjs'
import mixin from './node_modules/create-mixin/index.mjs'
import CompositeClass from './node_modules/composite-class/index.mjs'
import StateMachine from './node_modules/fsm-base/dist/index.mjs'
import TestContext from './lib/test-context.mjs'

/**
 * @module test-object-model
 */

/**
 * @param {string} [name] - The test name.
 * @param {function} [testFn] - A function which will either complete successfully, reject or throw.
 * @param {object} [options]
 * @param {number} [options.timeout] - A time limit for the test in ms.
 * @param {number} [options.maxConcurrency] - The max concurrency that asynchronous child jobs can run.
 * @param {boolean} [options.skip] - Skip this test.
 * @param {boolean} [options.only] - Only run this test.
 * @alias module:test-object-model
 */
class Tom extends mixin(CompositeClass)(StateMachine) {
  constructor (name, testFn, options) {
    if (typeof name === 'string') {
      if (isPlainObject(testFn)) {
        options = testFn
        testFn = undefined
      }
    } else if (typeof name === 'function') {
      options = testFn
      testFn = name
      name = ''
    } else if (typeof name === 'object') {
      options = name
      testFn = undefined
      name = ''
    }
    options = Object.assign({ timeout: 10000 }, options)
    name = name || 'tom'
    super ([
      { from: undefined, to: 'pending' },
      { from: 'pending', to: 'in-progress' },
      { from: 'pending', to: 'skipped' },
      { from: 'pending', to: 'ignored' },
      { from: 'in-progress', to: 'pass' },
      { from: 'in-progress', to: 'fail' },
      /* reset */
      { from: 'in-progress', to: 'pending' },
      { from: 'pass', to: 'pending' },
      { from: 'fail', to: 'pending' },
      { from: 'skipped', to: 'pending' },
      { from: 'ignored', to: 'pending' },
    ])
    /**
     * Test name
     * @type {string}
     */
    this.name = name

    /**
     * A function which will either complete successfully, reject or throw.
     * @type {function}
     */
    this.testFn = testFn

    /**
     * Position of this test within its parents children
     * @type {number}
     */
    this.index = 1

    /**
     * Test state: pending, start, skip, pass or fail.
     * @type {string}
     */
    this.state = 'pending'

    /**
     * A time limit for the test in ms.
     * @type {number}
     */
    this.timeout = options.timeout

    /**
     * True if the test has ended.
     * @type {boolean}
     */
    this.ended = false

    /**
     * The max concurrency that asynchronous child jobs can run.
     * @type {number}
     * @default 10
     */
    this.maxConcurrency = options.maxConcurrency || 10

    this.markedSkip = options.skip || false
    this.markedOnly = options.only || false

    this.options = options
  }

  toString () {
    return `${this.name}`
  }

  /**
   * Add a test.
   * @return {module:test-object-model}
   */
  test (name, testFn, options) {
    /* validation */
    for (const child of this) {
      if (child.name === name) {
        throw new Error('Duplicate name: ' + name)
      }
    }
    const test = new this.constructor(name, testFn, options)
    this.add(test)
    test.index = this.children.length
    this._skipLogic()
    return test
  }

  /**
   * Add a skipped test
   * @return {module:test-object-model}
   */
  skip (name, testFn, options) {
    options = options || {}
    options.skip = true
    const test = this.test(name, testFn, options)
    return test
  }

  /**
   * Add an only test
   * @return {module:test-object-model}
   */
  only (name, testFn, options) {
    options = options || {}
    options.only = true
    const test = this.test(name, testFn, options)
    return test
  }

  _onlyExists () {
    return Array.from(this.root()).some(t => t.markedOnly)
  }

  _skipLogic () {
    if (this._onlyExists()) {
      for (const test of this.root()) {
        test.markedSkip = !test.markedOnly
      }
    }
  }

  setState (state, target, data) {
    if (state === 'pass' || state === 'fail') {
      this.ended = true
    }
    super.setState(state, target, data)
    if (state === 'pass' || state === 'fail') {
      this.emit('end')
    }
  }

  /**
   * Execute the stored test function.
   * @returns {Promise}
   * @fulfil {*}
   */
  run () {
    if (this.testFn) {
      if (this.markedSkip) {
        this.setState('skipped', this)
        return Promise.resolve()
      } else {
        this.setState('in-progress', this)
        this.emit('start')
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
                .catch(err => {
                  this.setState('fail', this, err)
                  reject(err)
                })
            } else {
              this.setState('pass', this, result)
              resolve(result)
            }
          } catch (err) {
            this.setState('fail', this, err)
            reject(err)
          }
        })
        return Promise.race([ testFnResult, raceTimeout(this.timeout) ])
      }
    } else {
      this.setState('ignored', this)
      return Promise.resolve()
    }
  }

  /**
   * Reset state
   */
  reset (deep) {
    if (deep) {
      for (const tom of this) {
        tom.reset()
      }
    } else {
      this.index = 1
      this.state = 'pending'
      this.markedSkip = this.options.skip || false
      this.markedOnly = this.options.only || false
    }
  }

  /**
   * Combine several TOM instances into a common root
   * @param {Array.<Tom>} tests
   * @param {string} [name]
   * @return {Tom}
   */
  static combine (tests, name) {
    let test
    if (tests.length > 1) {
      test = new this(name)
      for (const subTom of tests) {
        test.add(subTom)
      }

    } else {
      test = tests[0]
    }
    test._skipLogic()
    return test
  }
}

function isPlainObject (input) {
  return input !== null && typeof input === 'object' && input.constructor === Object
}

export default Tom
