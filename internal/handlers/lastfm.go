package handlers

import (
	"crypto/md5"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strings"

	"github.com/halva/songswap/internal/database"
)

type lastfmSessionResponse struct {
	Session struct {
		Name string `json:"name"`
		Key  string `json:"key"`
	} `json:"session"`
}

// LastfmStart redirects the user to Last.fm's auth page
func LastfmStart(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("LASTFM_API_KEY")
	if apiKey == "" {
		http.Error(w, "Last.fm not configured", http.StatusInternalServerError)
		return
	}

	callbackURL := os.Getenv("LASTFM_CALLBACK_URL")
	if callbackURL == "" {
		http.Error(w, "Last.fm callback URL not configured", http.StatusInternalServerError)
		return
	}

	authURL := fmt.Sprintf(
		"https://www.last.fm/api/auth/?api_key=%s&cb=%s",
		url.QueryEscape(apiKey),
		url.QueryEscape(callbackURL),
	)

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// LastfmCallback handles the redirect from Last.fm after user approval
func LastfmCallback(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("LASTFM_API_KEY")
	secret := os.Getenv("LASTFM_SHARED_SECRET")

	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Missing token", http.StatusBadRequest)
		return
	}

	// Exchange token for session key
	params := map[string]string{
		"method":  "auth.getSession",
		"api_key": apiKey,
		"token":   token,
	}
	sig := lastfmSign(params, secret)

	reqURL := fmt.Sprintf(
		"https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=%s&token=%s&api_sig=%s&format=json",
		apiKey, token, sig,
	)

	resp, err := http.Get(reqURL)
	if err != nil {
		http.Error(w, "Failed to contact Last.fm", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Failed to read Last.fm response", http.StatusBadGateway)
		return
	}

	var sessionResp lastfmSessionResponse
	if err := json.Unmarshal(body, &sessionResp); err != nil || sessionResp.Session.Key == "" {
		http.Error(w, "Last.fm auth failed", http.StatusUnauthorized)
		return
	}

	lastfmUsername := sessionResp.Session.Name
	sessionKey := sessionResp.Session.Key

	// Check if this Last.fm account is already linked
	var userID int64
	err = database.DB.QueryRow(
		`SELECT user_id FROM linked_accounts WHERE provider = 'lastfm' AND provider_user_id = $1`,
		lastfmUsername,
	).Scan(&userID)

	if err == sql.ErrNoRows {
		// New user — create account with Last.fm username, no password
		err = database.DB.QueryRow(
			`INSERT INTO users (username) VALUES ($1) RETURNING id`,
			lastfmUsername,
		).Scan(&userID)

		if err != nil {
			// Username might be taken — append suffix
			if strings.Contains(err.Error(), "unique") {
				err = database.DB.QueryRow(
					`INSERT INTO users (username) VALUES ($1) RETURNING id`,
					lastfmUsername+"_lastfm",
				).Scan(&userID)
			}
			if err != nil {
				http.Error(w, "Failed to create user", http.StatusInternalServerError)
				return
			}
		}

		// Link the account
		_, err = database.DB.Exec(
			`INSERT INTO linked_accounts (user_id, provider, provider_user_id, provider_username, session_key)
			 VALUES ($1, 'lastfm', $2, $3, $4)`,
			userID, lastfmUsername, lastfmUsername, sessionKey,
		)
		if err != nil {
			http.Error(w, "Failed to link account", http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	} else {
		// Existing linked account — update session key
		database.DB.Exec(
			`UPDATE linked_accounts SET session_key = $1 WHERE provider = 'lastfm' AND provider_user_id = $2`,
			sessionKey, lastfmUsername,
		)
	}

	// Get username for the JWT response
	var username string
	database.DB.QueryRow(`SELECT username FROM users WHERE id = $1`, userID).Scan(&username)

	// Issue JWT
	jwtToken, err := createToken(userID)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	// Redirect to frontend with token in fragment
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		// Fallback: assume same origin (works behind Nginx)
		scheme := "http"
		if r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
		frontendURL = fmt.Sprintf("%s://%s", scheme, r.Host)
	}

	redirectURL := fmt.Sprintf("%s/#token=%s&username=%s",
		frontendURL,
		url.QueryEscape(jwtToken),
		url.QueryEscape(username),
	)

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

// lastfmSign creates the API signature Last.fm requires
// Sort params alphabetically, concat as key1value1key2value2, append secret, md5
func lastfmSign(params map[string]string, secret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var buf strings.Builder
	for _, k := range keys {
		buf.WriteString(k)
		buf.WriteString(params[k])
	}
	buf.WriteString(secret)

	return fmt.Sprintf("%x", md5.Sum([]byte(buf.String())))
}