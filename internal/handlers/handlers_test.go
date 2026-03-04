package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/halva/songswap/internal/middleware"
)

func TestHealth(t *testing.T) {
	// Create a fake HTTP request
	req := httptest.NewRequest("GET", "/health", nil)
	// Create a recorder to capture the response
	w := httptest.NewRecorder()

	// Call the handler directly
	Health(w, req)

	// Check status code
	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", w.Code)
	}

	// Check response body
	expected := `{"status": "ok"}`
	if w.Body.String() != expected {
		t.Errorf("expected body %q, got %q", expected, w.Body.String())
	}
}

func TestSubmitSong_EmptyURL(t *testing.T) {
	body := strings.NewReader(`{"url":""}`)
	req := httptest.NewRequest("POST", "/songs", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	SubmitSong(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestSubmitSong_InvalidJSON(t *testing.T) {
	body := strings.NewReader(`not json at all`)
	req := httptest.NewRequest("POST", "/songs", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	SubmitSong(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestSubmitSong_NoHTTPPrefix(t *testing.T) {
	body := strings.NewReader(`{"url":"www.youtube.com/watch?v=abc"}`)
	req := httptest.NewRequest("POST", "/songs", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	SubmitSong(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestSubmitSong_URLTooLong(t *testing.T) {
	longURL := "https://example.com/" + strings.Repeat("a", 2000)
	body := strings.NewReader(`{"url":"` + longURL + `"}`)
	req := httptest.NewRequest("POST", "/songs", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	SubmitSong(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestSubmitSong_ContextCrumbTooLong(t *testing.T) {
	longCrumb := strings.Repeat("a", 101)
	body := strings.NewReader(`{"url":"https://youtube.com/watch?v=abc","context_crumb":"` + longCrumb + `"}`)
	req := httptest.NewRequest("POST", "/songs", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	SubmitSong(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_EmptyFields(t *testing.T) {
	body := strings.NewReader(`{"username":"","password":""}`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_UsernameTooShort(t *testing.T) {
	body := strings.NewReader(`{"username":"ab","password":"validpass123"}`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_UsernameTooLong(t *testing.T) {
	longName := strings.Repeat("a", 31)
	body := strings.NewReader(`{"username":"` + longName + `","password":"validpass123"}`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_PasswordTooShort(t *testing.T) {
	body := strings.NewReader(`{"username":"validuser","password":"short"}`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_PasswordTooLong(t *testing.T) {
	longPass := strings.Repeat("a", 73)
	body := strings.NewReader(`{"username":"validuser","password":"` + longPass + `"}`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestRegister_InvalidJSON(t *testing.T) {
	body := strings.NewReader(`garbage`)
	req := httptest.NewRequest("POST", "/register", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestCreateChain_InvalidJSON(t *testing.T) {
	body := strings.NewReader(`not json`)
	req := httptest.NewRequest("POST", "/chains", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// Need to set user context since CreateChain checks for auth
	ctx := context.WithValue(req.Context(), middleware.UserIDKey, int64(1))
	req = req.WithContext(ctx)

	CreateChain(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestCreateChain_EmptyName(t *testing.T) {
	body := strings.NewReader(`{"name":""}`)
	req := httptest.NewRequest("POST", "/chains", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, int64(1))
	req = req.WithContext(ctx)

	CreateChain(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestCreateChain_NameTooLong(t *testing.T) {
	longName := strings.Repeat("a", 51)
	body := strings.NewReader(`{"name":"` + longName + `"}`)
	req := httptest.NewRequest("POST", "/chains", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, int64(1))
	req = req.WithContext(ctx)

	CreateChain(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestCreateChain_DescriptionTooLong(t *testing.T) {
	longDesc := strings.Repeat("a", 201)
	body := strings.NewReader(`{"name":"valid chain","description":"` + longDesc + `"}`)
	req := httptest.NewRequest("POST", "/chains", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, int64(1))
	req = req.WithContext(ctx)

	CreateChain(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", w.Code)
	}
}

func TestCreateChain_Unauthorized(t *testing.T) {
	body := strings.NewReader(`{"name":"test chain"}`)
	req := httptest.NewRequest("POST", "/chains", body)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	// No user context set — should fail
	CreateChain(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401, got %d", w.Code)
	}
}