package main

import (
	"log"
	"net/http"

	"github.com/halva/songswap/internal/database"
	"github.com/halva/songswap/internal/handlers"
)

func main() {
	port := "8080"

	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Connected to database")

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("POST /register", handlers.Register)
	mux.HandleFunc("POST /login", handlers.Login)
	mux.HandleFunc("POST /songs", handlers.SubmitSong)
	mux.HandleFunc("GET /discover", handlers.AuthMiddleware(handlers.Discover))
	mux.HandleFunc("POST /songs/{id}/like", handlers.AuthMiddleware(handlers.LikeSong))
	mux.HandleFunc("GET /history", handlers.AuthMiddleware(handlers.History))
	mux.HandleFunc("DELETE /songs/{id}/like", handlers.AuthMiddleware(handlers.UnlikeSong))

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}