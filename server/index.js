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

app.put('/api/users/:id', (req, res) => {
    const { displayName, phone, address } = req.body;
    const sql = `UPDATE users SET displayName = ?, phone = ?, address = ? WHERE id = ?`;
    db.run(sql, [displayName, phone, address, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
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

// --- USER FAVORITES ROUTES ---
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

app.post('/api/favorites', (req, res) => {
    const { user_email, product_id } = req.body;
    const sql = `INSERT OR IGNORE INTO user_favorites (user_email, product_id) VALUES (?, ?)`;
    db.run(sql, [user_email, product_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product added to favorites", changes: this.changes });
    });
});

app.delete('/api/favorites', (req, res) => {
    const { user_email, product_id } = req.body;
    const sql = `DELETE FROM user_favorites WHERE user_email = ? AND product_id = ?`;
    db.run(sql, [user_email, product_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product removed from favorites", changes: this.changes });
    });
});

app.post('/api/favorites/sync', (req, res) => {
    const { user_email, product_ids } = req.body;
    if (!user_email || !Array.isArray(product_ids)) {
        return res.status(400).json({ error: 'Missing email or product_ids array' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;'); 
        db.run('DELETE FROM user_favorites WHERE user_email = ?', [user_email], (err) => {
            if (err) {
                db.run('ROLLBACK;');
                return res.status(500).json({ error: 'Failed to clear old favorites' });
            }
            const stmt = db.prepare('INSERT OR IGNORE INTO user_favorites (user_email, product_id) VALUES (?, ?)');
            for (const productId of product_ids) {
                stmt.run(user_email, productId);
            }
            stmt.finalize((err) => {
                if (err) {
                    db.run('ROLLBACK;');
                    return res.status(500).json({ error: 'Failed to insert new favorites' });
                }
                db.run('COMMIT;', (err) => {
                    if (err) return res.status(500).json({ error: 'Transaction commit failed' });
                    res.json({ message: `Synced favorites.` });
                });
            });
        });
    });
});

// --- NEW: USER CART ROUTES ---

// Get Cart
app.get('/api/cart/:user_email', (req, res) => {
    const { user_email } = req.params;
    // Join with products to get details like name, price, image
    const sql = `
        SELECT p.*, uc.quantity 
        FROM user_cart_items uc 
        JOIN products p ON uc.product_id = p.id 
        WHERE uc.user_email = ?
    `;
    db.all(sql, [user_email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Add/Update Item in Cart (Upsert)
app.post('/api/cart', (req, res) => {
    const { user_email, product_id, quantity } = req.body;
    // SQLite upsert syntax: INSERT OR REPLACE
    const sql = `INSERT OR REPLACE INTO user_cart_items (user_email, product_id, quantity) VALUES (?, ?, ?)`;
    
    db.run(sql, [user_email, product_id, quantity], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Cart updated", changes: this.changes });
    });
});

// Remove Item from Cart
app.delete('/api/cart', (req, res) => {
    const { user_email, product_id } = req.body;
    const sql = `DELETE FROM user_cart_items WHERE user_email = ? AND product_id = ?`;
    db.run(sql, [user_email, product_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Item removed from cart", changes: this.changes });
    });
});

// Merge Guest Cart on Login
app.post('/api/cart/merge', (req, res) => {
    const { user_email, items } = req.body; // items = [{product_id, quantity}, ...]
    if (!user_email || !Array.isArray(items)) return res.status(400).json({ error: "Invalid data" });

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare(`
            INSERT INTO user_cart_items (user_email, product_id, quantity) 
            VALUES (?, ?, ?)
            ON CONFLICT(user_email, product_id) 
            DO UPDATE SET quantity = quantity + excluded.quantity
        `);

        for (const item of items) {
             // Basic validation
             if(item.id && item.quantity) {
                 stmt.run(user_email, item.id, item.quantity);
             }
        }

        stmt.finalize((err) => {
            if (err) {
                db.run('ROLLBACK;');
                return res.status(500).json({ error: "Failed to merge cart" });
            }
            db.run('COMMIT;', (err) => {
                if (err) return res.status(500).json({ error: "Commit failed" });
                res.json({ message: "Cart merged successfully" });
            });
        });
    });
});

// Clear Cart (e.g., after checkout)
app.post('/api/cart/clear', (req, res) => {
    const { user_email } = req.body;
    db.run("DELETE FROM user_cart_items WHERE user_email = ?", [user_email], function(err) {
         if (err) return res.status(500).json({ error: err.message });
         res.json({ message: "Cart cleared" });
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
app.get('/api/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY createdAt DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

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

app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Order status updated" });
    });
});

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