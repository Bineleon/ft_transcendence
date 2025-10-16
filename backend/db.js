import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Ce petit module "ouvre" une connexion vers un fichier database.db
export async function openDb() {
  return open({
    filename: './database.db',
    driver: sqlite3.Database
  });
}
