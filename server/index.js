import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { MongoClient, ObjectId } from 'mongodb'
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'

const app = express()
const port = Number(process.env.PORT || 3001)
const mongoClient = new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 })
let databasePromise
const sessions = new Map()

function getDatabase() {
  if (!databasePromise) databasePromise = mongoClient.connect().then((client) => client.db())
  return databasePromise
}

app.use(cors())
app.use(express.json())

function requireRole(role) {
  return (request, response, next) => {
    const token = request.headers.authorization?.replace('Bearer ', '')
    const session = token ? sessions.get(token) : null
    if (!session || session.role !== role) return response.status(401).json({ error: 'Authentication required' })
    request.session = session
    next()
  }
}

const menuItems = [
  ['Dum tea', 'Tea', 10], ['Black tea', 'Tea', 15], ['Badam tea', 'Tea', 20], ['Green tea', 'Tea', 20], ['Masala tea', 'Tea', 20], ['Lemon tea', 'Tea', 20], ['Ginger tea', 'Tea', 20], ['Ginger+lemon tea', 'Tea', 20], ['Bellam tea', 'Tea', 20], ['Ginger+bellam tea', 'Tea', 20], ['Pepper tea', 'Tea', 20], ['Elaichi tea', 'Tea', 20], ['Sugar less tea', 'Tea', 15], ['Immunity tea', 'Tea', 20], ['Black coffee', 'Coffee', 15], ['Coffee', 'Coffee', 20], ['Bellam coffee', 'Coffee', 20], ['Cold coffee', 'Coffee', 50], ['Milk', 'Milk', 15], ['Pepper milk', 'Milk', 20], ['Horlicks', 'Milk', 20], ['Boost', 'Milk', 20], ['Bournvita', 'Milk', 20], ['Dry fruits hot', 'Milk', 20], ['Parcel extra', 'Milk', 5],
].map(([name, category, price]) => ({ name, category, price }))

app.get('/api/menu', requireRole('admin'), async (_request, response) => {
  try {
    const database = await getDatabase()
    const collection = database.collection('menuItems')
    if (await collection.countDocuments() === 0) await collection.insertMany(menuItems)
    response.json(await collection.find({}).sort({ category: 1, name: 1 }).toArray())
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/menu', requireRole('admin'), async (request, response) => {
  const { name, category, price } = request.body
  if (!name?.trim() || !category || !Number.isFinite(price) || price < 1) return response.status(400).json({ error: 'Item name, category, and valid price are required' })
  try {
    const database = await getDatabase()
    const item = { name: name.trim(), category, price }
    const result = await database.collection('menuItems').insertOne(item)
    response.status(201).json({ ...item, _id: result.insertedId })
  } catch (error) {
    if (error.code === 11000) return response.status(409).json({ error: 'That menu item already exists' })
    response.status(503).json({ error: 'Database unavailable' })
  }
})

app.delete('/api/menu/:id', requireRole('admin'), async (request, response) => {
  try {
    const database = await getDatabase()
    const item = await database.collection('menuItems').findOne({ _id: new ObjectId(request.params.id) })
    if (!item) return response.status(404).json({ error: 'Menu item not found' })
    const result = await database.collection('menuItems').deleteOne({ _id: item._id })
    response.json({ deletedCount: result.deletedCount })
  } catch (error) { response.status(400).json({ error: 'Invalid menu item id' }) }
})

app.get('/api/users', requireRole('admin'), async (_request, response) => {
  try {
    const database = await getDatabase()
    const users = await database.collection('users').find({ role: 'user' }, { projection: { name: 1, mobile: 1 } }).sort({ name: 1 }).toArray()
    response.json(users)
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.get('/api/customers', requireRole('admin'), async (_request, response) => {
  try {
    const database = await getDatabase()
    const users = await database.collection('users').find({ role: 'user' }, { projection: { name: 1, mobile: 1 } }).sort({ name: 1 }).toArray()
    const balances = await database.collection('khata').aggregate([{ $group: { _id: '$customerName', khataAmount: { $sum: '$amount' }, khataItems: { $sum: 1 } } }]).toArray()
    const payments = await database.collection('payments').aggregate([{ $group: { _id: '$customerName', paidAmount: { $sum: '$amount' } } }]).toArray()
    const balanceByName = new Map(balances.map((balance) => [balance._id, balance]))
    const paymentsByName = new Map(payments.map((payment) => [payment._id, payment]))
    response.json(users.map((user) => { const balance = balanceByName.get(user.name); const payment = paymentsByName.get(user.name); const khataAmount = Math.max((balance?.khataAmount || 0) - (payment?.paidAmount || 0), 0); return { name: user.name, mobile: user.mobile, initials: user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), khataAmount, khataItems: balance?.khataItems || 0, paidAmount: payment?.paidAmount || 0, status: khataAmount === 0 ? 'Paid' : 'Due' } }))
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.delete('/api/khata', requireRole('admin'), async (_request, response) => {
  try {
    const database = await getDatabase()
    const result = await database.collection('khata').deleteMany({})
    response.json({ deletedCount: result.deletedCount })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/users/register', async (request, response) => {
  const { name, mobile, password } = request.body
  if (!name || !mobile || typeof password !== 'string' || password.length < 6) return response.status(400).json({ error: 'Name, mobile, and a 6-character password are required' })
  try {
    const database = await getDatabase()
    const users = database.collection('users')
    if (await users.findOne({ mobile })) return response.status(409).json({ error: 'A user with this mobile number already exists' })
    const salt = randomBytes(16).toString('hex')
    const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
    const result = await users.insertOne({ name, mobile, passwordHash, role: 'user', createdAt: new Date() })
    response.status(201).json({ id: result.insertedId, name, role: 'user' })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/users/login', async (request, response) => {
  const { mobile, password } = request.body
  if (!mobile || typeof password !== 'string') return response.status(400).json({ error: 'Mobile number and password are required' })
  try {
    const database = await getDatabase()
    const user = await database.collection('users').findOne({ mobile, role: 'user' })
    if (!user?.passwordHash) return response.status(401).json({ error: 'Invalid mobile number or password' })
    const [salt, storedHash] = user.passwordHash.split(':')
    const receivedHash = scryptSync(password, salt, 64)
    if (!timingSafeEqual(receivedHash, Buffer.from(storedHash, 'hex'))) return response.status(401).json({ error: 'Invalid mobile number or password' })
    const token = randomUUID()
    sessions.set(token, { role: 'user', mobile: user.mobile, name: user.name })
    response.json({ id: user._id, name: user.name, mobile: user.mobile, role: user.role, token })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/admin/login', (request, response) => {
  const { email, password } = request.body
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) return response.status(401).json({ error: 'Invalid admin email or password' })
  const token = randomUUID()
  sessions.set(token, { role: 'admin', email })
  response.json({ role: 'admin', token })
})

app.get('/api/users/:mobile/khata', requireRole('user'), async (request, response) => {
  if (request.session.mobile !== request.params.mobile) return response.status(403).json({ error: 'You can only view your own khata' })
  try {
    const database = await getDatabase()
    const user = await database.collection('users').findOne({ mobile: request.params.mobile, role: 'user' }, { projection: { name: 1 } })
    if (!user) return response.status(404).json({ error: 'User not found' })
    const [entries, payments] = await Promise.all([
      database.collection('khata').find({ customerName: user.name }).toArray(),
      database.collection('payments').find({ customerName: user.name }).toArray(),
    ])
    const history = [...entries.map((entry) => ({ ...entry, kind: 'purchase' })), ...payments.map((payment) => ({ ...payment, kind: 'payment', item: 'Payment received', amount: -payment.amount }))].sort((left, right) => new Date(right.dateTime || right.createdAt) - new Date(left.dateTime || left.createdAt))
    response.json({ entries: history, total: history.reduce((total, entry) => total + entry.amount, 0) })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.get('/api/dashboard', requireRole('admin'), async (_request, response) => {
  try {
    const database = await getDatabase()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const [transactions, khata, payments] = await Promise.all([
      database.collection('transactions').find({}).sort({ createdAt: -1 }).limit(12).toArray(),
      database.collection('khata').aggregate([{ $group: { _id: '$customerName', initials: { $first: '$initials' }, items: { $sum: 1 }, amount: { $sum: '$amount' } } }, { $sort: { amount: -1 } }, { $limit: 5 }]).toArray(),
      database.collection('payments').aggregate([{ $group: { _id: '$customerName', amount: { $sum: '$amount' } } }]).toArray(),
    ])
    const todayKhata = await database.collection('khata').aggregate([{ $match: { dateTime: { $gte: todayStart, $lt: tomorrowStart } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]).next()
    const todayTransactions = transactions.filter((entry) => { const date = new Date(entry.createdAt); return date >= todayStart && date < tomorrowStart })
    const income = todayTransactions.filter((entry) => entry.type === 'income').reduce((total, entry) => total + entry.amount, 0) + (todayKhata?.amount || 0)
    const expenses = todayTransactions.filter((entry) => entry.type === 'expense').reduce((total, entry) => total + entry.amount, 0)
    const paidByCustomer = new Map(payments.map((payment) => [payment._id, payment.amount]))
    response.json({ overview: { income, expenses, profit: income - expenses }, recent: transactions.map((entry) => ({ type: entry.type, label: entry.description, note: new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), amount: entry.type === 'income' ? entry.amount : -entry.amount })), khata: khata.map((account) => { const amount = Math.max(account.amount - (paidByCustomer.get(account._id) || 0), 0); return { name: account._id, initials: account.initials, items: account.items, amount, status: amount === 0 ? 'Paid' : 'Due', tone: amount === 0 ? 'green' : 'orange' } }) })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.get('/api/transactions', requireRole('admin'), async (request, response) => {
  try {
    const database = await getDatabase()
    const period = ['day', 'week', 'month'].includes(request.query.period) ? request.query.period : 'day'
    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    if (period === 'week') start.setDate(start.getDate() - 6)
    if (period === 'month') start.setDate(1)
    const [transactions, khata, payments] = await Promise.all([
      database.collection('transactions').find({}).toArray(),
      database.collection('khata').find({}).toArray(),
      database.collection('payments').find({}).toArray(),
    ])
    const rows = [
      ...transactions.map((entry) => ({ id: entry._id, source: 'transaction', label: entry.description, type: entry.type === 'expense' || entry.type === 'expenditure' ? 'expense' : 'income', amount: entry.amount, date: entry.createdAt })),
      ...khata.map((entry) => ({ id: entry._id, source: 'khata', label: `${entry.item} · ${entry.customerName}`, type: 'income', amount: entry.amount, date: entry.dateTime || entry.createdAt })),
      ...payments.map((entry) => ({ id: entry._id, source: 'payment', label: `Payment from ${entry.customerName}`, type: 'payment', amount: entry.amount, date: entry.dateTime || entry.createdAt })),
    ].filter((entry) => new Date(entry.date) >= start && new Date(entry.date) <= now).sort((left, right) => new Date(right.date) - new Date(left.date))
    const income = rows.filter((entry) => entry.type === 'income').reduce((total, entry) => total + entry.amount, 0)
    const expenses = rows.filter((entry) => entry.type === 'expense').reduce((total, entry) => total + entry.amount, 0)
    response.json({ period, overview: { income, expenses, profit: income - expenses }, rows })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.delete('/api/transactions/:source/:id', requireRole('admin'), async (request, response) => {
  try {
    const database = await getDatabase()
    const collectionName = { transaction: 'transactions', khata: 'khata', payment: 'payments' }[request.params.source]
    if (!collectionName) return response.status(400).json({ error: 'Invalid transaction source' })
    const result = await database.collection(collectionName).deleteOne({ _id: new ObjectId(request.params.id) })
    response.json({ deletedCount: result.deletedCount })
  } catch (error) { response.status(400).json({ error: 'Invalid transaction id' }) }
})

app.post('/api/transactions', requireRole('admin'), async (request, response) => {
  const { description, amount, type } = request.body
  if (!description || !Number.isFinite(amount) || !['income', 'expense'].includes(type)) return response.status(400).json({ error: 'Invalid transaction' })
  try {
    const database = await getDatabase()
    const result = await database.collection('transactions').insertOne({ description, amount, type, createdAt: new Date() })
    response.status(201).json({ id: result.insertedId })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/khata', requireRole('admin'), async (request, response) => {
  const { customerName, initials, item, dateTime } = request.body
  if (!customerName || !item) return response.status(400).json({ error: 'Select a valid menu item' })
  try {
    const database = await getDatabase()
    const menuItem = menuItems.find((entry) => entry.name === item) || await database.collection('menuItems').findOne({ name: item })
    if (!menuItem) return response.status(400).json({ error: 'Select a valid menu item' })
    const result = await database.collection('khata').insertOne({ customerName, initials: initials || customerName.slice(0, 2).toUpperCase(), item, category: menuItem.category, amount: menuItem.price, dateTime: dateTime ? new Date(dateTime) : new Date(), createdAt: new Date() })
    response.status(201).json({ id: result.insertedId })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.post('/api/payments', requireRole('admin'), async (request, response) => {
  const { customerName, amount, dateTime } = request.body
  if (!customerName || !Number.isFinite(amount) || amount <= 0) return response.status(400).json({ error: 'Customer and valid payment amount are required' })
  try {
    const database = await getDatabase()
    const result = await database.collection('payments').insertOne({ customerName, amount, dateTime: dateTime ? new Date(dateTime) : new Date(), createdAt: new Date() })
    response.status(201).json({ id: result.insertedId, customerName, amount })
  } catch (error) { response.status(503).json({ error: 'Database unavailable' }) }
})

app.listen(port, () => console.log(`Daybreak API running on http://localhost:${port}`))
