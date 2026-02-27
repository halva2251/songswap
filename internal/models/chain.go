package models

import "time"

type Chain struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	CreatedBy   int64     `json:"created_by"`
	CreatorName string    `json:"creator_name,omitempty"`
	SongCount   int       `json:"song_count"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateChainRequest struct {
	Name        string  `json:"name"`
	Description *string `json:"description,omitempty"`
}

type AddChainSongRequest struct {
	SongID int64 `json:"song_id"`
}