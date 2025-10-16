import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
  return open({
    filename: '/app/database/db.sqlite', // <- chemin dans le volume
    driver: sqlite3.Database
  });
}

