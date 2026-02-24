package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() error {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		return fmt.Errorf("DATABASE_URL environment variable is required")
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("error opening database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("error connecting to database: %w", err)
	}

	DB = db
	return nil
}