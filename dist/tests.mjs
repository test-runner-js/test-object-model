import a from 'assert';

function raceTimeout (ms, msg) {
  return new Promise((resolve, reject) => {
    const interval = setTimeout(() => {
      const err = new Error(msg || `Timeout expired [${ms}]`);
      reject(err);
    }, ms);
    if (interval.unref) interval.unref();
  })
}

/**
 * Creates a mixin for use in a class extends expression.
 * @module create-mixin
 */

/**
 * @alias module:create-mixin
 * @param {class} Src - The class containing the behaviour you wish to mix into another class.
 * @returns {function}
 */
function createMixin (Src) {
  return function (Base) {
    class Mixed extends Base {}
    for (const propName of Object.getOwnPropertyNames(Src.prototype)) {
      if (propName === 'constructor') continue
      Object.defineProperty(Mixed.prototype, propName, Object.getOwnPropertyDescriptor(Src.prototype, propName));
    }
    if (Src.prototype[Symbol.iterator]) {
      Object.defineProperty(Mixed.prototype, Symbol.iterator, Object.getOwnPropertyDescriptor(Src.prototype, Symbol.iterator));
    }
    return Mixed
  }
}

/**
 * @module composite-class
 */

const _children = new WeakMap();
const _parent = new WeakMap();

/**
 * A base class for building standard composite structures. Can also be mixed in.
 * @alias module:composite-class
 */
class Composite {
  /**
   * Children
   * @type {Array}
   */
  get children () {
    if (_children.has(this)) {
      return _children.get(this)
    } else {
      _children.set(this, []);
      return _children.get(this)
    }
  }

  set children (val) {
    _children.set(this, val);
  }


  /**
   * Parent
   * @type {Composite}
   */
  get parent () {
    return _parent.get(this)
  }
  set parent (val) {
    _parent.set(this, val);
  }

  /**
   * Add a child
   * @returns {Composite}
   */
  add (child) {
    if (!(isComposite(child))) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.push(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to append
   * @returns {Composite}
   */
  append (child) {
    if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.push(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to prepend
   * @returns {Composite}
   */
  prepend (child) {
    if (!(child instanceof Composite)) throw new Error('can only add a Composite instance')
    child.parent = this;
    this.children.unshift(child);
    return child
  }

  /**
   * @param {Composite} child - the child node to remove
   * @returns {Composite}
   */
  remove (child) {
    return this.children.splice(this.children.indexOf(child), 1)
  }

  /**
   * depth level in the tree, 0 being root.
   * @returns {number}
   */
  level () {
    let count = 0;
    function countParent (composite) {
      if (composite.parent) {
        count++;
        countParent(composite.parent);
      }
    }
    countParent(this);
    return count
  }

  /**
   * @returns {number}
   */
  getDescendentCount () {
    return Array.from(this).length
  }

  /**
   * prints a tree using the .toString() representation of each node in the tree
   * @returns {string}
   */
  tree () {
    return Array.from(this).reduce((prev, curr) => {
      return prev += `${'  '.repeat(curr.level())}- ${curr}\n`
    }, '')
  }

  /**
   * Returns the root instance of this tree.
   * @returns {Composite}
   */
  root () {
    function getRoot (composite) {
      return composite.parent ? getRoot(composite.parent) : composite
    }
    return getRoot(this)
  }

  /**
   * default iteration strategy
   */
  * [Symbol.iterator] () {
    yield this;
    for (let child of this.children) {
      yield * child;
    }
  }

  /**
   * Used by node's `util.inspect`.
   */
  inspect (depth) {
    const clone = Object.assign({}, this);
    delete clone.parent;
    return clone
  }

  /**
   * Returns an array of ancestors
   * @return {Composite[]}
   */
  parents () {
    const output = [];
    function addParent (node) {
      if (node.parent) {
        output.push(node.parent);
        addParent(node.parent);
      }
    }
    addParent(this);
    return output
  }
}

function isComposite (item) {
  return item && item.children && item.add && item.level && item.root
}

/**
 * @module obso
 */

/**
 * @alias module:obso
 */
class Emitter {
  /**
   * Emit an event.
   * @param {string} eventName - the event name to emit.
   * @param ...args {*} - args to pass to the event handler
   */
  emit (eventName, ...args) {
    if (this._listeners && this._listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of this._listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(this, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, this, ...args);
  }

  _emitTarget (eventName, target, ...args) {
    if (this._listeners && this._listeners.length > 0) {
      const toRemove = [];

      /* invoke each relevant listener */
      for (const listener of this._listeners) {
        const handlerArgs = args.slice();
        if (listener.eventName === '__ALL__') {
          handlerArgs.unshift(eventName);
        }

        if (listener.eventName === '__ALL__' || listener.eventName === eventName) {
          listener.handler.call(target, ...handlerArgs);

          /* remove once handler */
          if (listener.once) toRemove.push(listener);
        }
      }

      toRemove.forEach(listener => {
        this._listeners.splice(this._listeners.indexOf(listener), 1);
      });
    }

    /* bubble event up */
    if (this.parent) this.parent._emitTarget(eventName, target || this, ...args);
  }

   /**
    * Register an event listener.
    * @param {string} [eventName] - The event name to watch. Omitting the name will catch all events.
    * @param {function} handler - The function to be called when `eventName` is emitted. Invocated with `this` set to `emitter`.
    * @param {object} [options]
    * @param {boolean} [options.once] - If `true`, the handler will be invoked once then removed.
    */
  on (eventName, handler, options) {
    createListenersArray(this);
    options = options || {};
    if (arguments.length === 1 && typeof eventName === 'function') {
      handler = eventName;
      eventName = '__ALL__';
    }
    if (!handler) {
      throw new Error('handler function required')
    } else if (handler && typeof handler !== 'function') {
      throw new Error('handler arg must be a function')
    } else {
      this._listeners.push({ eventName, handler: handler, once: options.once });
    }
  }

  /**
   * Remove an event listener.
   * @param eventName {string} - the event name
   * @param handler {function} - the event handler
   */
  removeEventListener (eventName, handler) {
    if (!this._listeners || this._listeners.length === 0) return
    const index = this._listeners.findIndex(function (listener) {
      return listener.eventName === eventName && listener.handler === handler
    });
    if (index > -1) this._listeners.splice(index, 1);
  }

  /**
   * Once.
   * @param {string} eventName - the event name to watch
   * @param {function} handler - the event handler
   */
  once (eventName, handler) {
    /* TODO: the once option is browser-only */
    this.on(eventName, handler, { once: true });
  }

  /**
   * Propagate.
   * @param {string} eventName - the event name to propagate
   * @param {object} from - the emitter to propagate from
   */
  propagate (eventName, from) {
    from.on(eventName, (...args) => this.emit(eventName, ...args));
  }
}

/**
 * Alias for `on`.
 */
Emitter.prototype.addEventListener = Emitter.prototype.on;

function createListenersArray (target) {
  if (target._listeners) return
  Object.defineProperty(target, '_listeners', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: []
  });
}

/**
 * Takes any input and guarantees an array back.
 *
 * - converts array-like objects (e.g. `arguments`) to a real array
 * - converts `undefined` to an empty array
 * - converts any another other, singular value (including `null`) into an array containing that value
 * - ignores input which is already an array
 *
 * @module array-back
 * @example
 * > const arrayify = require('array-back')
 *
 * > arrayify(undefined)
 * []
 *
 * > arrayify(null)
 * [ null ]
 *
 * > arrayify(0)
 * [ 0 ]
 *
 * > arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > function f(){ return arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */

function isObject (input) {
  return typeof input === 'object' && input !== null
}

function isArrayLike (input) {
  return isObject(input) && typeof input.length === 'number'
}

/**
 * @param {*} - the input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 */
function arrayify (input) {
  if (Array.isArray(input)) {
    return input
  } else {
    if (input === undefined) {
      return []
    } else if (isArrayLike(input)) {
      return Array.prototype.slice.call(input)
    } else {
      return [ input ]
    }
  }
}

/**
 * @module fsm-base
 * @typicalname stateMachine
 */

const _state = new WeakMap();
const _validMoves = new WeakMap();

/**
 * @class
 * @alias module:fsm-base
 * @extends {Emitter}
 */
class StateMachine extends Emitter {
  constructor (validMoves) {
    super();
    _validMoves.set(this, arrayify(validMoves).map(move => {
      if (!Array.isArray(move.from)) move.from = [ move.from ];
      if (!Array.isArray(move.to)) move.to = [ move.to ];
      return move
    }));
  }

  /**
   * The current state
   * @type {string} state
   * @throws `INVALID_MOVE` if an invalid move made
   */
  get state () {
    return _state.get(this)
  }

  set state (state) {
    this.setState(state);
  }

  /**
   * Set the current state. The second arg onward will be sent as event args.
   * @param {string} state
   */
  setState (state, ...args) {
    /* nothing to do */
    if (this.state === state) return

    const validTo = _validMoves.get(this).some(move => move.to.indexOf(state) > -1);
    if (!validTo) {
      const msg = `Invalid state: ${state}`;
      const err = new Error(msg);
      err.name = 'INVALID_MOVE';
      throw err
    }

    let moved = false;
    const prevState = this.state;
    _validMoves.get(this).forEach(move => {
      if (move.from.indexOf(this.state) > -1 && move.to.indexOf(state) > -1) {
        _state.set(this, state);
        moved = true;
        /**
         * fired on every state change
         * @event module:fsm-base#state
         * @param state {string} - the new state
         * @param prev {string} - the previous state
         */
        this.emit('state', state, prevState);

        /**
         * fired on every state change
         * @event module:fsm-base#&lt;state value&gt;
         */
        this.emit(state, ...args);
      }
    });
    if (!moved) {
      let froms = _validMoves.get(this)
        .filter(move => move.to.indexOf(state) > -1)
        .map(move => move.from.map(from => `'${from}'`))
        .reduce(flatten);
      const msg = `Can only move to '${state}' from ${froms.join(' or ') || '<unspecified>'} (not '${prevState}')`;
      const err = new Error(msg);
      err.name = 'INVALID_MOVE';
      throw err
    }
  }
}

function flatten (prev, curr) {
  return prev.concat(curr)
}

/**
 * The test context, available as `this` within each test function.
 */
class TestContext {
  constructor (context) {
    /**
     * The name given to this test.
     */
    this.name = context.name;
    /**
     * The test index within the current set.
     */
    this.index = context.index;
  }
}

/**
 * @module test-object-model
 */

/**
 * @param {string} [name]
 * @param {function} [testFn]
 * @param {object} [options]
 * @param {number} [options.timeout]
 * @alias module:test-object-model
 */
class Tom extends createMixin(Composite)(StateMachine) {
  constructor (name, testFn, options) {
    if (typeof name === 'string') {
      if (isPlainObject(testFn)) {
        options = testFn;
        testFn = undefined;
      }
    } else if (typeof name === 'function') {
      options = testFn;
      testFn = name;
      name = '';
    } else if (typeof name === 'object') {
      options = name;
      testFn = undefined;
      name = '';
    }
    options = Object.assign({ timeout: 10000 }, options);
    name = name || 'tom';
    super ([
      { from: undefined, to: 'pending' },
      { from: 'pending', to: 'in-progress' },
      { from: 'pending', to: 'skip' },
      { from: 'pending', to: 'ignored' },
      { from: 'in-progress', to: 'pass' },
      { from: 'in-progress', to: 'fail' },
      /* reset */
      { from: 'in-progress', to: 'pending' },
      { from: 'pass', to: 'pending' },
      { from: 'fail', to: 'pending' },
      { from: 'skip', to: 'pending' },
      { from: 'ignored', to: 'pending' },
    ]);
    /**
     * Test name
     * @type {string}
     */
    this.name = name;

    /**
     * Tree function
     * @type {function}
     */
    this.testFn = testFn;

    /**
     * Position of this test within its parents children
     * @type {number}
     */
    this.index = 1;

    /**
     * Test state: pending, start, skip, pass or fail.
     * @type {string}
     */
    this.state = 'pending';

    /**
     * Timeout in ms
     * @type {number}
     */
    this.timeout = options.timeout;

    /**
     * True if the test has ended
     * @type {boolean}
     */
    this.ended = false;

    /**
     * The max concurrency that asynchronous child jobs can run.
     * @type {number}
     * @default 10
     */
    this.maxConcurrency = options.maxConcurrency || 10;

    this._markSkip = options._markSkip;
    this._skip = null;
    this._only = options.only;

    this.options = options;
  }

  toString () {
    return `${this.name}`
  }

  /**
   * Add a test.
   * @return {module:test-object-model}
   */
  test (name, testFn, options) {
    for (const child of this) {
      if (child.name === name) {
        throw new Error('Duplicate name: ' + name)
      }
    }
    const test = new this.constructor(name, testFn, options);
    this.add(test);
    test.index = this.children.length;
    this._skipLogic();
    return test
  }

  /**
   * Add a skipped test
   * @return {module:test-object-model}
   */
  skip (name, testFn, options) {
    options = options || {};
    options._markSkip = true;
    const test = this.test(name, testFn, options);
    return test
  }

  /**
   * Add an only test
   * @return {module:test-object-model}
   */
  only (name, testFn, options) {
    options = options || {};
    options.only = true;
    const test = this.test(name, testFn, options);
    return test
  }

  _onlyExists () {
    return Array.from(this.root()).some(t => t._only)
  }

  _skipLogic () {
    if (this._onlyExists()) {
      for (const test of this.root()) {
        if (test._markSkip) {
          test._skip = true;
        } else {
          test._skip = !test._only;
        }
      }
    } else {
      for (const test of this.root()) {
        test._skip = test._markSkip;
      }
    }
  }

  setState (state, target, data) {
    if (state === 'pass' || state === 'fail') {
      this.ended = true;
    }
    super.setState(state, target, data);
    if (state === 'pass' || state === 'fail') {
      this.emit('end');
    }
  }

  /**
   * Execute the stored test function.
   * @returns {Promise}
   * @fulfil {*}
   */
  run () {
    if (this.testFn) {
      if (this._skip) {
        this.setState('skip', this);
        return Promise.resolve()
      } else {
        this.setState('in-progress', this);
        this.emit('start');
        const testFnResult = new Promise((resolve, reject) => {
          try {
            const result = this.testFn.call(new TestContext({
              name: this.name,
              index: this.index
            }));

            if (result && result.then) {
              result
                .then(testResult => {
                  this.setState('pass', this, testResult);
                  resolve(testResult);
                })
                .catch(err => {
                  this.setState('fail', this, err);
                  reject(err);
                });
            } else {
              this.setState('pass', this, result);
              resolve(result);
            }
          } catch (err) {
            this.setState('fail', this, err);
            reject(err);
          }
        });
        return Promise.race([ testFnResult, raceTimeout(this.timeout) ])
      }
    } else {
      this.setState('ignored', this);
      return Promise.resolve()
    }
  }

  /**
   * Reset state
   */
  reset (deep) {
    if (deep) {
      for (const tom of this) {
        tom.reset();
      }
    } else {
      this.index = 1;
      this.state = 'pending';
      this._skip = null;
      this._only = null;
    }
  }

  /**
   * Combine several TOM instances into a common root
   * @param {Array.<Tom>} tests
   * @param {string} [name]
   * @return {Tom}
   */
  static combine (tests, name) {
    let test;
    if (tests.length > 1) {
      test = new this(name);
      for (const subTom of tests) {
        test.add(subTom);
      }

    } else {
      test = tests[0];
    }
    test._skipLogic();
    return test
  }
}

function isPlainObject (input) {
  return input !== null && typeof input === 'object' && input.constructor === Object
}

{ /* new Test(): default name, default options */
  const test = new Tom();
  a.ok(test.name);
  a.strictEqual(test.testFn, undefined);
  a.strictEqual(test.timeout, 10000);
}

{ /* new Test(name) */
  const test = new Tom('name');
  a.strictEqual(test.name, 'name');
  a.strictEqual(test.testFn, undefined);
  a.strictEqual(test.timeout, 10000);
}

{ /* new Test(name, testFn, options) */
  const testFn = function () {};
  const options = { timeout: 1 };
  const test = new Tom('one', testFn, options);
  a.strictEqual(test.name, 'one');
  a.strictEqual(test.testFn, testFn);
  a.strictEqual(test.timeout, 1);
}

{ /* new Test(testFn, options): default name and testFn */
  const testFn = function () {};
  const options = { timeout: 1 };
  const test = new Tom(testFn, options);
  a.ok(test.name);
  a.strictEqual(test.testFn, testFn);
  a.strictEqual(test.timeout, 1);
}

{ /* new Test(options): options only */
  const options = { timeout: 1 };
  const test = new Tom(options);
  a.ok(test.name);
  a.strictEqual(test.testFn, undefined);
  a.strictEqual(test.timeout, 1);
}

{ /* new Test(name, options) */
  const options = { timeout: 1 };
  const test = new Tom('one', options);
  a.strictEqual(test.name, 'one');
  a.strictEqual(test.testFn, undefined);
  a.strictEqual(test.timeout, 1);
}

function halt (err) {
  console.error(err);
  process.exitCode = 1;
}

{ /* test.skip(): event args */
  const tom = new Tom();
  const skippedTest = tom.skip('one', () => 1);
  skippedTest.on('skip', (test, result) => {
    a.strictEqual(test, skippedTest);
    a.strictEqual(result, undefined);
  });
  skippedTest.run()
    .catch(halt);
}

{ /* skippedTest.skip(): don't emit "start", emit "skip" */
  const actuals = [];
  const tom = new Tom();
  const skippedTest = tom.skip('one', () => 1);
  tom.on('start', () => actuals.push('start'));
  tom.on('skip', () => actuals.push('skip'));
  skippedTest.run()
    .then(() => {
      a.deepStrictEqual(actuals, [ 'skip' ]);
    })
    .catch(halt);
}

{ /* child.skip(): testFn is not run */
  const actuals = [];
  const tom = new Tom();
  const skippedTest = tom.skip('one', () => { actuals.push('one' ); });
  Promise
    .all([ tom.run(), skippedTest.run() ])
    .then(() => {
      a.deepStrictEqual(actuals, []);
    })
    .catch(halt);
}

{ /* child.skip(): multiple */
  const actuals = [];
  const tom = new Tom();
  const one = tom.skip('one', () => 1);
  const two = tom.skip('two', () => 2);
  tom.on('start', () => actuals.push('start'));
  tom.on('skip', () => actuals.push('skip'));
  Promise
    .all([ tom.run(), one.run(), two.run() ])
    .then(results => {
      a.deepStrictEqual(actuals, [ 'skip', 'skip' ]);
    })
    .catch(halt);
}

{ /* test.run(): event order, passing test */
  let actuals = [];
  const test = new Tom('one', function () {
    actuals.push('body');
    return true
  });
  test.on('start', test => actuals.push('start'));
  test.on('pass', test => actuals.push('pass'));
  test.on('end', test => actuals.push('end'));
  test.run()
    .then(result => {
      a.strictEqual(result, true);
      a.deepStrictEqual(actuals, [ 'start', 'body', 'pass', 'end' ]);
    })
    .catch(halt);
}

{ /* test.run(): event order, failing test */
  let actuals = [];
  const test = new Tom('one', function () {
    actuals.push('body');
    throw new Error('broken')
  });
  test.on('start', test => actuals.push('start'));
  test.on('fail', test => actuals.push('fail'));
  test.on('end', test => actuals.push('end'));
  test.run()
    .then(() => {
      throw new Error('should not reach here')
    })
    .catch(err => {
      a.strictEqual(err.message, 'broken');
      a.deepStrictEqual(actuals, [ 'start', 'body', 'fail', 'end' ]);
    })
    .catch(halt);
}

{ /* test.run(): event order, failing test, rejected */
  let actuals = [];
  const test = new Tom('one', function () {
    actuals.push('body');
    return Promise.reject(new Error('broken'))
  });
  test.on('start', test => actuals.push('start'));
  test.on('fail', test => actuals.push('fail'));
  test.on('end', test => actuals.push('end'));
  test.run()
    .then(() => {
      throw new Error('should not reach here')
    })
    .catch(err => {
      a.strictEqual(err.message, 'broken');
      a.deepStrictEqual(actuals, [ 'start', 'body', 'fail', 'end' ]);
    })
    .catch(halt);
}

{ /* test.run(): pass event args */
  const test = new Tom('one', () => 1);
  test.on('pass', (t, result) => {
    a.strictEqual(t, test);
    a.strictEqual(result, 1);
  });
  test.run()
    .catch(halt);
}

{ /* test.run(): skip event args */
  const tom = new Tom();
  const test = tom.skip('one', () => 1);
  test.on('skip', (t, result) => {
    a.strictEqual(t, test);
    a.strictEqual(result, undefined);
  });
  test.run()
    .catch(halt);
}

{ /* test.run(): fail event args */
  const test = new Tom('one', () => {
    throw new Error('broken')
  });
  test.on('fail', (t, err) => {
    a.strictEqual(t, test);
    a.strictEqual(err.message, 'broken');
  });
  test.run()
    .catch(err => {
      if (err.message !== 'broken') throw err
    })
    .catch(halt);
}

{ /* no test function: ignore, don't start, skip, pass or fail event */
  let actuals = [];
  const test = new Tom('one');
  test.on('start', test => actuals.push('start'));
  test.on('skip', test => actuals.push('skip'));
  test.on('pass', test => actuals.push('pass'));
  test.on('fail', test => actuals.push('fail'));
  test.on('end', test => actuals.push('end'));
  test.run()
    .then(result => {
      a.strictEqual(result, undefined);
      a.deepStrictEqual(actuals, []);
    })
    .catch(halt);
}

{ /* nested events: root should receive child events */
  const actuals = [];
  const tom = new Tom();
  const one = tom.test('one', () => 1);
  const two = one.test('two', () => 2);
  tom.on('pass', (test, result) => {
    if (actuals.length === 0) {
      a.strictEqual(test.name, 'one');
      a.strictEqual(result, 1);
      actuals.push(1);
    } else {
      a.strictEqual(test.name, 'two');
      a.strictEqual(result, 2);
      actuals.push(2);
    }
  });
  one.run()
    .then(() => {
      two.run();
    })
    .then(() => a.deepStrictEqual(actuals, [ 1, 2 ]));
}

{ /* passing sync test */
  const test = new Tom('tom', () => true);
  test.run()
    .then(result => {
      a.ok(result === true);
    })
    .catch(halt);
}

{ /* failing sync test */
  const test = new Tom('tom', function () {
    throw new Error('failed')
  });
  test.run()
    .then(() => {
      a.ok(false, "shouldn't reach here");
    })
    .catch(err => {
      a.ok(/failed/.test(err.message));
    })
    .catch(halt);
}

{ /* passing async test */
  const test = new Tom('tom', function () {
    return Promise.resolve(true)
  });
  test.run().then(result => {
    a.strictEqual(result, true);
  });
}

{ /* failing async test: rejected */
  const test = new Tom('tom', function () {
    return Promise.reject(new Error('failed'))
  });
  test.run()
    .then(() => {
      a.ok(false, "shouldn't reach here");
    })
    .catch(err => {
      a.ok(/failed/.test(err.message));
    })
    .catch(halt);
}

{ /* failing async test: timeout */
  const test = new Tom(
    'tom',
    function () {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 300);
      })
    },
    { timeout: 150 }
  );
  test.run()
    .then(() => a.ok(false, 'should not reach here'))
    .catch(err => {
      a.ok(/Timeout expired/.test(err.message));
    })
    .catch(halt);
}

{ /* passing async test: timeout 2 */
  const test = new Tom(
    'tom',
    function () {
      return new Promise((resolve, reject) => {
        setTimeout(() => resolve('ok'), 300);
      })
    },
    { timeout: 350 }
  );
  test.run()
    .then(result => {
      a.ok(result === 'ok');
    })
    .catch(halt);
}

{ /* no test function: ignore, don't start, skip, pass or fail event */
  const test = new Tom('one');
  test.run()
    .then(result => {
      a.strictEqual(result, undefined);
      a.strictEqual(test.ended, false);
      a.strictEqual(test.state, 'ignored');
    })
    .catch(halt);
}

{ /* test.run(): state, passing test */
  let actuals = [];
  const test = new Tom('one', function () {
    actuals.push(test.state);
  });
  actuals.push(test.state);
  a.strictEqual(test.ended, false);
  test.run()
    .then(result => {
      actuals.push(test.state);
      a.deepStrictEqual(actuals, [ 'pending', 'in-progress', 'pass' ]);
      a.strictEqual(test.ended, true);
    })
    .catch(halt);
}

{ /* test.run(): state, failing test */
  let actuals = [];
  const test = new Tom('one', function () {
    actuals.push(test.state);
    throw new Error('broken')
  });
  actuals.push(test.state);
  test.run()
    .then(result => {
      actuals.push(test.state);
    })
    .catch(err => {
      actuals.push(test.state);
      a.deepStrictEqual(actuals, [ 'pending', 'in-progress', 'fail' ]);
      a.strictEqual(test.ended, true);
    })
    .catch(halt);
}

{ /* test.run(): state, no test */
  let actuals = [];
  const test = new Tom('one');
  actuals.push(test.state);
  test.run()
    .then(result => {
      actuals.push(test.state);
      a.deepStrictEqual(actuals, [ 'pending', 'ignored' ]);
    })
    .catch(halt);
}

{ /* test.run(): ended, passing test */
  const test = new Tom('one', function () {});
  a.strictEqual(test.ended, false);
  test.run()
    .then(result => {
      a.strictEqual(test.ended, true);
    })
    .catch(halt);
}

{ /* test.run(): ended, failing test */
  const test = new Tom('one', function () {
    throw new Error('broken')
  });
  a.strictEqual(test.ended, false);
  test.run()
    .catch(err => {
      a.strictEqual(test.ended, true);
    })
    .catch(halt);
}

{ /* bug in test function */
  const test = new Tom('one', function () {
    asdf();
  });

  test.run()
    .then(() => {
      throw new Error('should not reach here')
    })
    .catch(err => {
      a.strictEqual(test.state, 'fail');
      a.ok(/asdf is not defined/.test(err.message));
    })
    .catch(halt);
}

{ /* duplicate test name */
  const tom = new Tom();
  tom.test('one', () => 1);
  a.throws(
    () => test.test('one', () => 1)
  );
}

{ /* deep duplicate test name */
  const tom = new Tom('tom');
  const child = tom.test('one', () => 1);
  a.throws(
    () => child.test('one', () => 1),
    /duplicate/i
  );
}

{ /* .only() */
  const tom = new Tom('tom');
  const one = tom.test('one', () => 1);
  const two = tom.test('two', () => 2);
  a.ok(!one._skip);
  a.ok(!two._skip);
  a.ok(!one._only);
  a.ok(!two._only);
  const three = tom.only('three', () => 3);
  a.ok(one._skip);
  a.ok(!one._only);
  a.ok(two._skip);
  a.ok(!two._only);
  a.ok(!three._skip);
  a.ok(three._only);
  const four = tom.only('four', () => 4);
  a.ok(one._skip);
  a.ok(!one._only);
  a.ok(two._skip);
  a.ok(!two._only);
  a.ok(!three._skip);
  a.ok(three._only);
  a.ok(!four._skip);
  a.ok(four._only);
}

{ /* .only() first */
  const tom = new Tom('tom');
  const one = tom.only('one', () => 1);
  const two = tom.test('two', () => 2);
  a.ok(!one._skip);
  a.ok(one._only);
  a.ok(two._skip);
  a.ok(!two._only);
}

{ /* deep only with skip */
  const tom = new Tom();
  const one = tom.only('one', () => 1);
  const two = one.test('two', () => 2);
  const three = two.skip('three', () => 3);
  a.ok(!one._skip);
  a.ok(one._only);
  a.ok(two._skip);
  a.ok(!two._only);
  a.ok(three._skip);
  a.ok(!three._only);
}

{ /* .test() not chainable */
  const tom = new Tom();
  const result = tom.test('one', () => 1);
  a.notStrictEqual(result, tom);
}
