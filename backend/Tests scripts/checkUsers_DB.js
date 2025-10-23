import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const db = await open({
  filename: './dev.db',
  driver: sqlite3.Database
});

const users = await db.all('SELECT * FROM users');
console.log(users);
await db.close();
