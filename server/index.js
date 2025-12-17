// Filename: server/index.js
import express from 'express';
import cors from 'cors';
import db from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`📩 ${req.method} ${req.path}`, req.body || req.query);
  next();
});

// --- AUTH ROUTES ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const uid = 'user_' + Date.now(); 
  // UPDATED: Added placeholders for phone and address in case needed later, or default NULL
  const sql = `INSERT INTO users (uid, email, password, displayName, role) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [uid, email, password, name, 'customer'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Email already exists', code: 'auth/email-already-in-use' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ uid, email, displayName: name, role: 'customer', id: this.lastID });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // UPDATED: Select phone and address
  const sql = `SELECT id, uid, email, displayName, role, phone, address FROM users WHERE email = ? AND password = ?`;
  
  db.get(sql, [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.json(row);
    else res.status(401).json({ error: 'Invalid credentials', code: 'auth/invalid-credential' });
  });
});

// --- USER MANAGEMENT ---
app.get('/api/users', (req, res) => {
    db.all("SELECT id, email, displayName, role, phone, address, createdAt FROM users ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// MANUALLY ADDED: Promote user to Admin via browser URL
app.get('/api/promote/:email', (req, res) => {
    const email = req.params.email;
    const sql = "UPDATE users SET role = 'admin' WHERE email = ?";
    
    db.run(sql, [email], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "User not found" });
        
        res.json({ 
            message: `Success! User ${email} is now an Admin.`, 
            changes: this.changes 
        });
    });
});

// NEW: Update User Profile
app.put('/api/users/:id', (req, res) => {
    const { displayName, phone, address } = req.body;
    const sql = `UPDATE users SET displayName = ?, phone = ?, address = ? WHERE id = ?`;
    db.run(sql, [displayName, phone, address, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Return updated user data
        db.get("SELECT id, uid, email, displayName, role, phone, address FROM users WHERE id = ?", [req.params.id], (err, row) => {
            res.json({ message: "Profile updated", user: row });
        });
    });
});

app.delete('/api/users/:id', (req, res) => {
    db.run("DELETE FROM users WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "User deleted" });
    });
});

// --- USER FAVORITES ROUTES (NEW) ---
// Get user's favorites
app.get('/api/favorites/:user_email', (req, res) => {
    const { user_email } = req.params;
    const sql = `
        SELECT p.* FROM user_favorites uf 
        JOIN products p ON uf.product_id = p.id 
        WHERE uf.user_email = ?
    `;
    db.all(sql, [user_email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add a product to favorites
app.post('/api/favorites', (req, res) => {
    const { user_email, product_id } = req.body;
    const sql = `INSERT OR IGNORE INTO user_favorites (user_email, product_id) VALUES (?, ?)`;
    db.run(sql, [user_email, product_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product added to favorites", changes: this.changes });
    });
});

// Remove a product from favorites
app.delete('/api/favorites', (req, res) => {
    const { user_email, product_id } = req.body;
    const sql = `DELETE FROM user_favorites WHERE user_email = ? AND product_id = ?`;
    db.run(sql, [user_email, product_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product removed from favorites", changes: this.changes });
    });
});

// Sync/Replace all favorites for a user (Used for guest migration or full sync)
app.post('/api/favorites/sync', (req, res) => {
    const { user_email, product_ids } = req.body;
    if (!user_email || !Array.isArray(product_ids)) {
        return res.status(400).json({ error: 'Missing email or product_ids array' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;'); 

        // 1. Delete all existing favorites for the user
        db.run('DELETE FROM user_favorites WHERE user_email = ?', [user_email], (err) => {
            if (err) {
                db.run('ROLLBACK;');
                return res.status(500).json({ error: 'Failed to clear old favorites: ' + err.message });
            }

            // 2. Insert new favorites
            const stmt = db.prepare('INSERT OR IGNORE INTO user_favorites (user_email, product_id) VALUES (?, ?)');
            for (const productId of product_ids) {
                stmt.run(user_email, productId);
            }
            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: 'Failed to insert new favorites: ' + err.message });
                }
                
                // 3. Commit transaction
                db.run('COMMIT;', (err) => {
                    if (err) return res.status(500).json({ error: 'Transaction commit failed: ' + err.message });
                    res.json({ message: `Successfully synced ${product_ids.length} favorites.` });
                });
            });
        });
    });
});


// --- PRODUCT ROUTES ---
app.get('/api/products', (req, res) => {
    const { category, trending, newArrivals, search } = req.query; 
    let sql = "SELECT * FROM products";
    let params = [];
    let conditions = [];

    if (category && category !== 'all') {
        conditions.push("category = ?");
        params.push(category);
    }

    if (trending === 'true') {
        conditions.push("isTrending = 1");
    }

    if (newArrivals === 'true') {
        conditions.push("createdAt >= date('now', '-30 days')");
    }

    if (search) {
        conditions.push("(name LIKE ? OR description LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY id DESC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.get('/api/products/:id', (req, res) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: row });
    });
});

// --- ADMIN PRODUCT ACTIONS ---
app.post('/api/products', (req, res) => {
    const { name, description, price, category, image, isTrending } = req.body;
    const imgPath = image || '/images/default_toy.jpg';
    
    const sql = `INSERT INTO products (name, description, price, category, image, rating, stock, isTrending) 
                 VALUES (?, ?, ?, ?, ?, 5.0, 10, ?)`;
    
    db.run(sql, [name, description, price, category, imgPath, isTrending ? 1 : 0], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: "Product created" });
    });
});

app.delete('/api/products/:id', (req, res) => {
    const sql = "DELETE FROM products WHERE id = ?";
    db.run(sql, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product deleted", changes: this.changes });
    });
});

app.put('/api/products/:id', (req, res) => {
    const { name, description, price, category, image, isTrending } = req.body;
    const sql = `UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ?, isTrending = ? WHERE id = ?`;
    db.run(sql, [name, description, price, category, image, isTrending ? 1 : 0, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product updated", changes: this.changes });
    });
});

// --- ORDERS ---

// Admin: Get ALL Orders
app.get('/api/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// User Profile - Get MY Orders
app.get('/api/orders/user/:email', (req, res) => {
    db.all("SELECT * FROM orders WHERE user_email = ? ORDER BY createdAt DESC", [req.params.email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.post('/api/orders', (req, res) => {
    const { user_email, total, items, shipping } = req.body;
    db.run("INSERT INTO orders (user_email, total, status, items) VALUES (?, ?, 'Pending', ?)", 
      [user_email, total, JSON.stringify(items)], 
      function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: this.lastID, message: "Order placed!" });
      }
    );
});

// Admin Update Status
app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Order status updated" });
    });
});

// NEW: User Cancel Order
app.put('/api/orders/:id/cancel', (req, res) => {
    db.run("UPDATE orders SET status = 'Cancelled' WHERE id = ? AND status = 'Pending'", [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(400).json({ error: "Order cannot be cancelled (might be shipped/delivered)" });
        res.json({ message: "Order cancelled successfully" });
    });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});