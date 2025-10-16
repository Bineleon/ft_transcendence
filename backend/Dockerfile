version: "3.8"

services:
  backend:
    build: ./backend
    volumes:
      - ./backend/data:/app/data
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
