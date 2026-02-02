package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/halva/songswap/internal/database"
	"github.com/halva/songswap/internal/models"
)

func Health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"status": "ok"}`))
}

func SubmitSong(w http.ResponseWriter, r *http.Request) {
	var req models.SubmitSongRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	platform := detectPlatform(req.URL)

	var song models.Song
	err := database.DB.QueryRow(`
		INSERT INTO songs (url, platform, context_crumb)
		VALUES ($1, $2, $3)
		RETURNING id, url, platform, context_crumb, created_at
	`, req.URL, platform, req.ContextCrumb).Scan(
		&song.ID, &song.URL, &song.Platform, &song.ContextCrumb, &song.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Failed to save song", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(song)
}

func Discover(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var song models.Song

	// Get a random song the user hasn't seen yet
	err := database.DB.QueryRow(`
		SELECT id, url, platform, context_crumb, created_at
		FROM songs
		WHERE id NOT IN (
			SELECT song_id FROM discoveries WHERE user_id = $1
		)
		ORDER BY RANDOM()
		LIMIT 1
	`, userID).Scan(&song.ID, &song.URL, &song.Platform, &song.ContextCrumb, &song.CreatedAt)

	if err != nil {
		http.Error(w, "No new songs to discover", http.StatusNotFound)
		return
	}

	// Record the discovery
	_, err = database.DB.Exec(`
		INSERT INTO discoveries (user_id, song_id)
		VALUES ($1, $2)
	`, userID, song.ID)

	if err != nil {
		http.Error(w, "Failed to record discovery", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
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