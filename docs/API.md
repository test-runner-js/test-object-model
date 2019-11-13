## Modules

<dl>
<dt><a href="#module_test-object-model">test-object-model</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#TestContext">TestContext</a></dt>
<dd><p>The test context, available as <code>this</code> within each test function.</p>
</dd>
</dl>

<a name="module_test-object-model"></a>

## test-object-model

* [test-object-model](#module_test-object-model)
    * [Tom](#exp_module_test-object-model--Tom) ⏏
        * [new Tom([name], [testFn], [options])](#new_module_test-object-model--Tom_new)
        * _instance_
            * [.name](#module_test-object-model--Tom+name) : <code>string</code>
            * [.testFn](#module_test-object-model--Tom+testFn) : <code>function</code>
            * [.index](#module_test-object-model--Tom+index) : <code>number</code>
            * [.state](#module_test-object-model--Tom+state) : <code>string</code>
            * [.timeout](#module_test-object-model--Tom+timeout) : <code>number</code>
            * [.ended](#module_test-object-model--Tom+ended) : <code>boolean</code>
            * [.result](#module_test-object-model--Tom+result) : <code>\*</code>
            * [.maxConcurrency](#module_test-object-model--Tom+maxConcurrency) : <code>number</code>
            * [.test()](#module_test-object-model--Tom+test) ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
            * [.skip()](#module_test-object-model--Tom+skip) ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
            * [.only()](#module_test-object-model--Tom+only) ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
            * [.run()](#module_test-object-model--Tom+run) ⇒ <code>Promise</code>
            * [.reset()](#module_test-object-model--Tom+reset)
        * _static_
            * [.combine(tests, [name])](#module_test-object-model--Tom.combine) ⇒ <code>Tom</code>

<a name="exp_module_test-object-model--Tom"></a>

### Tom ⏏
**Kind**: Exported class  
<a name="new_module_test-object-model--Tom_new"></a>

#### new Tom([name], [testFn], [options])

| Param | Type | Description |
| --- | --- | --- |
| [name] | <code>string</code> | The test name. |
| [testFn] | <code>function</code> | A function which will either complete successfully, reject or throw. |
| [options] | <code>object</code> |  |
| [options.timeout] | <code>number</code> | A time limit for the test in ms. |
| [options.maxConcurrency] | <code>number</code> | The max concurrency that asynchronous child jobs can run. |
| [options.skip] | <code>boolean</code> | Skip this test. |
| [options.only] | <code>boolean</code> | Only run this test. |

<a name="module_test-object-model--Tom+name"></a>

#### tom.name : <code>string</code>
Test name

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+testFn"></a>

#### tom.testFn : <code>function</code>
A function which will either complete successfully, reject or throw.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+index"></a>

#### tom.index : <code>number</code>
Position of this test within its parents children

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+state"></a>

#### tom.state : <code>string</code>
Test state: pending, start, skip, pass or fail.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+timeout"></a>

#### tom.timeout : <code>number</code>
A time limit for the test in ms.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+ended"></a>

#### tom.ended : <code>boolean</code>
True if the test has ended.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+result"></a>

#### tom.result : <code>\*</code>
The value returned by the test function, if it ended successfully.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+maxConcurrency"></a>

#### tom.maxConcurrency : <code>number</code>
The max concurrency that asynchronous child jobs can run.

**Kind**: instance property of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
**Default**: <code>10</code>  
<a name="module_test-object-model--Tom+test"></a>

#### tom.test() ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
Add a test.

**Kind**: instance method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+skip"></a>

#### tom.skip() ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
Add a skipped test

**Kind**: instance method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+only"></a>

#### tom.only() ⇒ [<code>Tom</code>](#exp_module_test-object-model--Tom)
Add an only test

**Kind**: instance method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom+run"></a>

#### tom.run() ⇒ <code>Promise</code>
Execute the stored test function.

**Kind**: instance method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
**Fulfil**: <code>\*</code>  
<a name="module_test-object-model--Tom+reset"></a>

#### tom.reset()
Reset state

**Kind**: instance method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  
<a name="module_test-object-model--Tom.combine"></a>

#### Tom.combine(tests, [name]) ⇒ <code>Tom</code>
If more than one TOM instances are supplied, combine them into a common root.

**Kind**: static method of [<code>Tom</code>](#exp_module_test-object-model--Tom)  

| Param | Type |
| --- | --- |
| tests | <code>Array.&lt;Tom&gt;</code> | 
| [name] | <code>string</code> | 

<a name="TestContext"></a>

## TestContext
The test context, available as `this` within each test function.

**Kind**: global class  

* [TestContext](#TestContext)
    * [.name](#TestContext+name)
    * [.index](#TestContext+index)

<a name="TestContext+name"></a>

### testContext.name
The name given to this test.

**Kind**: instance property of [<code>TestContext</code>](#TestContext)  
<a name="TestContext+index"></a>

### testContext.index
The test index within the current set.

**Kind**: instance property of [<code>TestContext</code>](#TestContext)  
