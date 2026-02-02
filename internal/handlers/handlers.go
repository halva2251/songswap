package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/halva2251/songswap/internal/models"
)

// In-memory storage for now (I'll add database later)
var songs []models.Song
var nextID int64 = 1

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status": "ok"}`))
}

func SubmitSong(w http.ResponseWriter, r *http.Request) {
	var req models.SubmitSongRequest

	// Decode the JSON body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate
	if req.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	// Create the song
	song := models.Song{
		ID:           nextID,
		URL:          req.URL,
		Platform:     detectPlatform(req.URL),
		ContextCrumb: req.ContextCrumb,
	}
	nextID++

	// Store it
	songs = append(songs, song)

	// Respond
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(song)
}

func detectPlatform(url string) string {
	url = strings.ToLower(url)
	switch {
	case strings.Contains(url, "youtube.com") || strings.Contains(url, "youtu.be"):
		return "youtube"
	case strings.Contains(url, "spotify.com"):
		return "spotify"
	case strings.Contains(url, "soundcloud.com"):
		return "soundcloud"
	default:
		return "other"
	}
}