package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

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

func LikeSong(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	songID := r.PathValue("id")
	if songID == "" {
		http.Error(w, "Song ID required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		UPDATE discoveries
		SET liked = true
		WHERE user_id = $1 AND song_id = $2
	`, userID, songID)

	if err != nil {
		http.Error(w, "Failed to like song", http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Song not found in your discoveries", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"liked": true}`))
}

func History(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := database.DB.Query(`
		SELECT s.id, s.url, s.platform, s.context_crumb, s.created_at, d.liked, d.discovered_at
		FROM discoveries d
		JOIN songs s ON d.song_id = s.id
		WHERE d.user_id = $1
		ORDER BY d.discovered_at DESC
	`, userID)

	if err != nil {
		http.Error(w, "Failed to fetch history", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var discoveries []map[string]interface{}

	for rows.Next() {
		var song models.Song
		var liked *bool
		var discoveredAt time.Time

		err := rows.Scan(&song.ID, &song.URL, &song.Platform, &song.ContextCrumb, &song.CreatedAt, &liked, &discoveredAt)
		if err != nil {
			continue
		}

		discoveries = append(discoveries, map[string]interface{}{
			"song":          song,
			"liked":         liked,
			"discovered_at": discoveredAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(discoveries)
}

func UnlikeSong(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	songID := r.PathValue("id")
	if songID == "" {
		http.Error(w, "Song ID required", http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec(`
		UPDATE discoveries
		SET liked = NULL
		WHERE user_id = $1 AND song_id = $2
	`, userID, songID)

	if err != nil {
		http.Error(w, "Failed to unlike song", http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Song not found in your discoveries", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"liked": null}`))
}