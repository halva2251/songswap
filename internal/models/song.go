package models

import "time"

type Song struct {
	ID           int64     `json:"id"`
	URL          string    `json:"url"`
	Platform     string    `json:"platform"`
	ContextCrumb *string   `json:"context_crumb,omitempty"`
	SubmittedBy  *int64    `json:"submitted_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type SubmitSongRequest struct {
	URL          string  `json:"url"`
	ContextCrumb *string `json:"context_crumb,omitempty"`
	ChainID      *int64  `json:"chain_id,omitempty"`
}