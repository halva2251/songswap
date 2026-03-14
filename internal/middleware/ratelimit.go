package middleware

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	clients map[string]*client
	mu      sync.Mutex
	rate    rate.Limit
	burst   int
}

func NewRateLimiter(r rate.Limit, burst int) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*client),
		rate:    r,
		burst:   burst,
	}
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) getClient(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	if c, exists := rl.clients[ip]; exists {
		c.lastSeen = time.Now()
		return c.limiter
	}

	limiter := rate.NewLimiter(rl.rate, rl.burst)
	rl.clients[ip] = &client{limiter: limiter, lastSeen: time.Now()}
	return limiter
}

// cleanup removes clients we haven't seen in 3 minutes
func (rl *RateLimiter) cleanup() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		for ip, c := range rl.clients {
			if time.Since(c.lastSeen) > 3*time.Minute {
				delete(rl.clients, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := realIP(r)

		if !rl.getClient(ip).Allow() {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func realIP(r *http.Request) string {
	// Cloudflare Tunnel sets this to the actual client IP
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}
	// Nginx forwards this from $remote_addr
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}
	// Standard proxy header, take the first (leftmost) IP
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.Index(xff, ","); i != -1 {
			return strings.TrimSpace(xff[:i])
		}
		return xff
	}
	// Fallback for local dev (no proxy)
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	return ip
}