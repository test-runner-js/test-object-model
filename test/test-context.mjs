import Test from '../index.mjs'
import Tom from 'test-object-model'
import assert from 'assert'
const a = assert.strict

const tom = new Tom()

tom.test('test.context: name and index', async function () {
  const actuals = []
  const tom = new Tom()
  const one = tom.test('one', function () {
    actuals.push(this.index)
    actuals.push(this.name)
  })
  const two = tom.test('two', function () {
    actuals.push(this.index)
    actuals.push(this.name)
  })
  await tom.run()
  await one.run()
  await two.run()
  a.deepEqual(actuals, [1, 'one', 2, 'two'])
})

tom.test('test.context: data', async function () {
  const actuals = []
  const one = new Test('one', function () {
    this.data = {
      something: 'one',
      yeah: true
    }
    actuals.push(this.data)
  })
  await one.run()
  a.equal(actuals[0].something, one.context.data.something)
  a.equal(actuals[0].yeah, one.context.data.yeah)
})

export default tom
