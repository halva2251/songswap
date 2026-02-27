package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/halva/songswap/internal/database"
	"github.com/halva/songswap/internal/middleware"
	"github.com/halva/songswap/internal/models"
)

// ListChains returns all chains with song counts
func ListChains(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT c.id, c.name, c.description, c.created_by, u.username, c.created_at,
			COUNT(cs.song_id) AS song_count
		FROM chains c
		JOIN users u ON c.created_by = u.id
		LEFT JOIN chain_songs cs ON c.id = cs.chain_id
		GROUP BY c.id, u.username
		ORDER BY c.created_at DESC
	`)
	if err != nil {
		http.Error(w, "Failed to fetch chains", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	chains := []models.Chain{}
	for rows.Next() {
		var c models.Chain
		err := rows.Scan(&c.ID, &c.Name, &c.Description, &c.CreatedBy, &c.CreatorName, &c.CreatedAt, &c.SongCount)
		if err != nil {
			continue
		}
		chains = append(chains, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chains)
}

// CreateChain creates a new chain
func CreateChain(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateChainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, "Chain name is required", http.StatusBadRequest)
		return
	}

	if len(req.Name) > 50 {
		http.Error(w, "Chain name must be under 50 characters", http.StatusBadRequest)
		return
	}

	if req.Description != nil && len(*req.Description) > 200 {
		http.Error(w, "Description must be under 200 characters", http.StatusBadRequest)
		return
	}

	var chain models.Chain
	err := database.DB.QueryRow(`
		INSERT INTO chains (name, description, created_by)
		VALUES ($1, $2, $3)
		RETURNING id, name, description, created_by, created_at
	`, req.Name, req.Description, userID).Scan(
		&chain.ID, &chain.Name, &chain.Description, &chain.CreatedBy, &chain.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Failed to create chain", http.StatusInternalServerError)
		return
	}

	chain.SongCount = 0

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(chain)
}

// GetChainSongs returns all songs in a chain
func GetChainSongs(w http.ResponseWriter, r *http.Request) {
	chainID := r.PathValue("id")
	if chainID == "" {
		http.Error(w, "Chain ID required", http.StatusBadRequest)
		return
	}

	rows, err := database.DB.Query(`
		SELECT s.id, s.url, s.platform, s.context_crumb, s.created_at
		FROM chain_songs cs
		JOIN songs s ON cs.song_id = s.id
		WHERE cs.chain_id = $1
		ORDER BY cs.added_at DESC
	`, chainID)

	if err != nil {
		http.Error(w, "Failed to fetch chain songs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	songs := []models.Song{}
	for rows.Next() {
		var s models.Song
		err := rows.Scan(&s.ID, &s.URL, &s.Platform, &s.ContextCrumb, &s.CreatedAt)
		if err != nil {
			continue
		}
		songs = append(songs, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(songs)
}

// AddSongToChain adds a song to a chain (any authenticated user)
func AddSongToChain(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	chainID := r.PathValue("id")
	if chainID == "" {
		http.Error(w, "Chain ID required", http.StatusBadRequest)
		return
	}

	var req models.AddChainSongRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.SongID == 0 {
		http.Error(w, "Song ID is required", http.StatusBadRequest)
		return
	}

	// Verify song exists
	var exists bool
	err := database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM songs WHERE id = $1)", req.SongID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Song not found", http.StatusNotFound)
		return
	}

	_, err = database.DB.Exec(`
		INSERT INTO chain_songs (chain_id, song_id, added_by)
		VALUES ($1, $2, $3)
		ON CONFLICT (chain_id, song_id) DO NOTHING
	`, chainID, req.SongID, userID)

	if err != nil {
		http.Error(w, "Failed to add song to chain", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"added": true}`))
}

// RemoveSongFromChain removes a song from a chain (creator only)
func RemoveSongFromChain(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(int64)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	chainID := r.PathValue("id")
	songID := r.PathValue("songId")
	if chainID == "" || songID == "" {
		http.Error(w, "Chain ID and Song ID required", http.StatusBadRequest)
		return
	}

	// Check if user is the chain creator
	var createdBy int64
	err := database.DB.QueryRow("SELECT created_by FROM chains WHERE id = $1", chainID).Scan(&createdBy)
	if err != nil {
		http.Error(w, "Chain not found", http.StatusNotFound)
		return
	}

	if createdBy != userID {
		http.Error(w, "Only the chain creator can remove songs", http.StatusForbidden)
		return
	}

	result, err := database.DB.Exec(`
		DELETE FROM chain_songs WHERE chain_id = $1 AND song_id = $2
	`, chainID, songID)

	if err != nil {
		http.Error(w, "Failed to remove song", http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "Song not in this chain", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"removed": true}`))
}