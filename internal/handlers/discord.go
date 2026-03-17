package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/halva/songswap/internal/database"
)

type discordTokenResponse struct {
	AccessToken string `json:"access_token"`
}

type discordUser struct {
	ID       string `json:"id"`
	Username string `json:"username"`
}

// DiscordStart redirects the user to Discord's OAuth page
func DiscordStart(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("DISCORD_CLIENT_ID")
	callbackURL := os.Getenv("DISCORD_CALLBACK_URL")

	if clientID == "" || callbackURL == "" {
		http.Error(w, "Discord not configured", http.StatusInternalServerError)
		return
	}

	authURL := fmt.Sprintf(
		"https://discord.com/api/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=identify",
		url.QueryEscape(clientID),
		url.QueryEscape(callbackURL),
	)

	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
}

// DiscordCallback handles the redirect from Discord after user approval
func DiscordCallback(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("DISCORD_CLIENT_ID")
	clientSecret := os.Getenv("DISCORD_CLIENT_SECRET")
	callbackURL := os.Getenv("DISCORD_CALLBACK_URL")

	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}

	// Exchange code for access token
	tokenResp, err := http.PostForm("https://discord.com/api/oauth2/token", url.Values{
		"client_id":     {clientID},
		"client_secret": {clientSecret},
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {callbackURL},
	})
	if err != nil {
		http.Error(w, "Failed to contact Discord", http.StatusBadGateway)
		return
	}
	defer tokenResp.Body.Close()

	tokenBody, err := io.ReadAll(tokenResp.Body)
	if err != nil {
		http.Error(w, "Failed to read Discord response", http.StatusBadGateway)
		return
	}

	var tokenData discordTokenResponse
	if err := json.Unmarshal(tokenBody, &tokenData); err != nil || tokenData.AccessToken == "" {
		http.Error(w, "Discord auth failed", http.StatusUnauthorized)
		return
	}

	// Fetch user info
	userReq, _ := http.NewRequest("GET", "https://discord.com/api/users/@me", nil)
	userReq.Header.Set("Authorization", "Bearer "+tokenData.AccessToken)

	userResp, err := http.DefaultClient.Do(userReq)
	if err != nil {
		http.Error(w, "Failed to fetch Discord user", http.StatusBadGateway)
		return
	}
	defer userResp.Body.Close()

	userBody, err := io.ReadAll(userResp.Body)
	if err != nil {
		http.Error(w, "Failed to read Discord user", http.StatusBadGateway)
		return
	}

	var dUser discordUser
	if err := json.Unmarshal(userBody, &dUser); err != nil || dUser.ID == "" {
		http.Error(w, "Failed to parse Discord user", http.StatusBadGateway)
		return
	}

	// Check if this Discord account is already linked
	var userID int64
	err = database.DB.QueryRow(
		`SELECT user_id FROM linked_accounts WHERE provider = 'discord' AND provider_user_id = $1`,
		dUser.ID,
	).Scan(&userID)

	if err == sql.ErrNoRows {
		// New user — create account with Discord username
		err = database.DB.QueryRow(
			`INSERT INTO users (username) VALUES ($1) RETURNING id`,
			dUser.Username,
		).Scan(&userID)

		if err != nil {
			if strings.Contains(err.Error(), "unique") {
				err = database.DB.QueryRow(
					`INSERT INTO users (username) VALUES ($1) RETURNING id`,
					dUser.Username+"_discord",
				).Scan(&userID)
			}
			if err != nil {
				http.Error(w, "Failed to create user", http.StatusInternalServerError)
				return
			}
		}

		_, err = database.DB.Exec(
			`INSERT INTO linked_accounts (user_id, provider, provider_user_id, provider_username)
			 VALUES ($1, 'discord', $2, $3)`,
			userID, dUser.ID, dUser.Username,
		)
		if err != nil {
			http.Error(w, "Failed to link account", http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Get username
	var username string
	database.DB.QueryRow(`SELECT username FROM users WHERE id = $1`, userID).Scan(&username)

	// Issue JWT
	jwtToken, err := createToken(userID)
	if err != nil {
		http.Error(w, "Failed to create token", http.StatusInternalServerError)
		return
	}

	// Redirect to frontend
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
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