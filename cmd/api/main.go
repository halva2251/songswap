package main

import (
	"log"
	"net/http"
	"os"

	"github.com/halva/songswap/internal/database"
	"github.com/halva/songswap/internal/handlers"
	"github.com/halva/songswap/internal/middleware"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	handlers.SetJwtSecret([]byte(secret))

	port := "8080"

	if err := database.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	log.Println("Connected to database")

	apiLimiter := middleware.NewRateLimiter(10, 20)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handlers.Health)
	mux.HandleFunc("POST /register", handlers.Register)
	mux.HandleFunc("POST /login", handlers.Login)
	mux.HandleFunc("POST /songs", handlers.SubmitSong)
	mux.HandleFunc("GET /discover", middleware.AuthMiddleware(handlers.JwtSecret, handlers.Discover))
	mux.HandleFunc("POST /songs/{id}/like", middleware.AuthMiddleware(handlers.JwtSecret, handlers.LikeSong))
	mux.HandleFunc("GET /history", middleware.AuthMiddleware(handlers.JwtSecret, handlers.History))
	mux.HandleFunc("DELETE /songs/{id}/like", middleware.AuthMiddleware(handlers.JwtSecret, handlers.UnlikeSong))

	handler := middleware.CORS(apiLimiter.Limit(mux))

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe("0.0.0.0:"+port, handler); err != nil {
		log.Fatal(err)
	}
}