
/**
 * PRODUCTION-READY BACKEND (NODE.JS + EXPRESS)
 * This file is for reference and use in a standard Node.js environment.
 */
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'asap-travels-secret-key-123';

// Middleware
// Fix: Use 'any' cast for middleware to resolve Type 'RequestHandler' is not assignable to 'PathParams' error in some Express environments
app.use(helmet() as any);
app.use(cors() as any);
app.use(express.json() as any);

// Database Connection Pool (requires real MySQL)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: 'asap_travels',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auth Middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// --- ROUTES ---

// 1. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows]: any = await pool.execute('SELECT * FROM operators WHERE email = ?', [email]);
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {
      const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
      res.json({ accessToken, user: { id: user.id, name: user.name, role: user.role } });
    } else {
      res.status(401).send('Email or password incorrect');
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

// 2. Booking: Create Transactional Booking
app.post('/api/bookings', async (req, res) => {
  const { scheduleId, customerName, customerPhone, seats, totalAmount } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check inventory availability with locking
    const [available]: any = await connection.execute(
      'SELECT seat_number FROM inventory WHERE schedule_id = ? AND seat_number IN (?) AND status = "AVAILABLE" FOR UPDATE',
      [scheduleId, seats]
    );

    if (available.length !== seats.length) {
      throw new Error('Some seats are no longer available');
    }

    // Insert booking
    const [result]: any = await connection.execute(
      'INSERT INTO bookings (schedule_id, customer_name, customer_phone, total_amount) VALUES (?, ?, ?, ?)',
      [scheduleId, customerName, customerPhone, totalAmount]
    );
    const bookingId = result.insertId;

    // Update inventory
    await connection.execute(
      'UPDATE inventory SET status = "BOOKED", booking_id = ? WHERE schedule_id = ? AND seat_number IN (?)',
      [bookingId, scheduleId, seats]
    );

    await connection.commit();
    res.status(201).json({ id: bookingId, status: 'CONFIRMED' });
  } catch (err: any) {
    await connection.rollback();
    res.status(400).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// 3. Fleet: Get Buses (Admin)
app.get('/api/buses', authenticateJWT, async (req, res) => {
  try {
    const [rows]: any = await pool.execute(`
      SELECT b.*, bt.name as type_name, bt.capacity 
      FROM buses b 
      JOIN bus_types bt ON b.type_id = bt.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- NEW DELETE ENDPOINTS ---

// Delete Route (Cascading)
app.delete('/api/routes/:id', authenticateJWT, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const routeId = req.params.id;
    
    // 1. Delete Inventory for all schedules of this route
    await connection.execute(`
      DELETE FROM inventory WHERE schedule_id IN (SELECT id FROM schedules WHERE route_id = ?)
    `, [routeId]);
    
    // 2. Delete Schedules
    await connection.execute('DELETE FROM schedules WHERE route_id = ?', [routeId]);
    
    // 3. Delete Route
    await connection.execute('DELETE FROM routes WHERE id = ?', [routeId]);
    
    await connection.commit();
    res.json({ message: 'Route and linked data deleted' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json(err);
  } finally {
    connection.release();
  }
});

// Delete Bus (Cascading)
app.delete('/api/buses/:id', authenticateJWT, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const busId = req.params.id;
    
    // 1. Delete Inventory for all schedules of this bus
    await connection.execute(`
      DELETE FROM inventory WHERE schedule_id IN (SELECT id FROM schedules WHERE bus_id = ?)
    `, [busId]);
    
    // 2. Delete Schedules
    await connection.execute('DELETE FROM schedules WHERE bus_id = ?', [busId]);
    
    // 3. Delete Bus
    await connection.execute('DELETE FROM buses WHERE id = ?', [busId]);
    
    await connection.commit();
    res.json({ message: 'Bus and linked data deleted' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json(err);
  } finally {
    connection.release();
  }
});

// 4. Search: Public API
app.get('/api/search', async (req, res) => {
  const { source, destination, date } = req.query;
  try {
    const [rows]: any = await pool.execute(`
      SELECT s.*, r.source, r.destination, r.estimated_duration, b.plate_number, bt.name as type_name
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      JOIN bus_types bt ON b.type_id = bt.id
      WHERE r.source = ? AND r.destination = ? AND DATE(s.departure_time) = ?
    `, [source, destination, date]);
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.listen(PORT, () => {
  console.log(`ASAP Travels Backend running on http://localhost:${PORT}`);
});
