import raceTimeout from 'race-timeout-anywhere'
import mixin from 'create-mixin'
import CompositeClass from 'composite-class'
import StateMachine from 'fsm-base'
import TestContext from './lib/test-context.mjs'
import { isPromise, isPlainObject } from 'typical/index.mjs'
import { performance } from 'perf_hooks';

/**
 * @module test-object-model
 */

/**
 * @param {string} [name] - The test name.
 * @param {function} [testFn] - A function which will either succeed, reject or throw.
 * @param {object} [options] - Test config.
 * @param {number} [options.timeout] - A time limit for the test in ms.
 * @param {number} [options.maxConcurrency] - The max concurrency that child tests will be able to run. For example, specifying `2` will allow child tests to run two at a time. Defaults to `10`.
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
    super('pending', [
      { from: 'pending', to: 'in-progress' },
      { from: 'pending', to: 'skipped' },
      { from: 'pending', to: 'ignored' },
      { from: 'in-progress', to: 'pass' },
      { from: 'in-progress', to: 'fail' }
    ])
    /**
     * Test name
     * @type {string}
     */
    this.name = name

    /**
     * A function which will either succeed, reject or throw.
     * @type {function}
     */
    this.testFn = testFn

    /**
     * Position of this test within its parents children
     * @type {number}
     */
    this.index = 1

    /**
     * Test state. Can be one of `pending`, `start`, `skip`, `pass` or `fail`.
     * @member {string} module:test-object-model#state
     */

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
     * If the test passed, the value returned by the test function. If it failed, the exception thrown or rejection reason.
     * @type {*}
     */
    this.result = undefined

    /**
     * The max concurrency that child tests will be able to run. For example, specifying `2` will allow child tests to run two at a time.
     * @type {number}
     * @default 10
     */
    this.maxConcurrency = options.maxConcurrency || 10

    this.markedSkip = options.skip || false
    this.markedOnly = options.only || false

    this.options = options

    /**
     * Test execution stats
     * @namespace
     */
    this.stats = {
      /**
       * Start time.
       * @type {number}
       */
      start: 0,
      /**
       * End time.
       * @type {number}
       */
      end: 0,
      /**
       * Test execution duration.
       * @type {number}
       */
      duration: 0
    }

    /**
     * The text execution context.
     * @type {TextContext}
     */
    this.context = undefined
  }

  /**
   * Returns the test name.
   * @returns {string}
   */
  toString () {
    return this.name
  }

  /**
   * Add a test group.
   */
  group (name, options) {
    return this.test(name, options)
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
  async run () {
    if (this.testFn) {
      if (this.markedSkip) {
        this.setState('skipped', this)
      } else {
        this.setState('in-progress', this)
        /**
         * Test start.
         * @event module:test-object-model#start
         * @param test {TestObjectModel} - The test node.
         */
        this.emit('start', this)

        this.stats.start = performance.now()

        try {
          this.context = new TestContext({
            name: this.name,
            index: this.index
          })
          const testResult = this.testFn.call(this.context)
          if (isPromise(testResult)) {
            try {
              const result = await Promise.race([testResult, raceTimeout(this.timeout)])
              this.result = result
              this.stats.end = performance.now()
              this.stats.duration = this.stats.end - this.stats.start

              /**
               * Test pass.
               * @event module:test-object-model#pass
               * @param test {TestObjectModel} - The test node.
               * @param result {*} - The value returned by the test.
               */
              this.setState('pass', this, result)
              return result
            } catch (err) {
              this.result = err
              this.stats.end = performance.now()
              this.stats.duration = this.stats.end - this.stats.start

              /**
               * Test fail.
               * @event module:test-object-model#fail
               * @param test {TestObjectModel} - The test node.
               * @param err {Error} - The exception thrown.
               */
              this.setState('fail', this, err)
              return Promise.reject(err)
            }
          } else {
            this.stats.end = performance.now()
            this.stats.duration = this.stats.end - this.stats.start
            this.result = testResult
            this.setState('pass', this, testResult)
            return testResult
          }
        } catch (err) {
          this.result = err
          this.stats.end = performance.now()
          this.stats.duration = this.stats.end - this.stats.start
          this.setState('fail', this, err)
          throw (err)
        }
      }
    } else {
      /**
       * Test ignored.
       * @event module:test-object-model#ignored
       * @param test {TestObjectModel} - The test node.
       */
      this.setState('ignored', this)
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
      this.resetState()
      this.markedSkip = this.options.skip || false
      this.markedOnly = this.options.only || false
    }
  }

  /**
   * If more than one TOM instances are supplied, combine them into a common root.
   * @param {Array.<Tom>} tests
   * @param {string} [name]
   * @return {Tom}
   */
  static combine (tests, name, options) {
    let test
    if (tests.length > 1) {
      test = new this(name, options)
      for (const subTom of tests) {
        this.validate(subTom)
        test.add(subTom)
      }
    } else {
      test = tests[0]
      this.validate(test)
    }
    test._skipLogic()
    return test
  }

  /**
   * Returns true if the input is a valid test.
   * @param {module:test-object-model} tom - Input to test.
   * @returns {boolean}
   */
  static validate (tom = {}) {
    const valid = ['name', 'testFn', 'index', 'ended'].every(prop => Object.keys(tom).includes(prop))
    if (!valid) {
      const err = new Error('Valid TOM required')
      err.invalidTom = tom
      throw err
    }
  }
}

export default Tom
