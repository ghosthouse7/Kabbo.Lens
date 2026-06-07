package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// ─── Types ───────────────────────────────────────────────────────────────────

type ImageURL struct {
	URL    string `json:"url"`
	Detail string `json:"detail"`
}
type ContentPart struct {
	Type     string    `json:"type"`
	Text     string    `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}
type ChatMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}
type ChatRequest struct {
	Model       string        `json:"model"`
	Messages    []ChatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens"`
	Temperature float64       `json:"temperature"`
}
type ChatResponse struct {
	Choices []struct {
		Message struct{ Content string `json:"content"` } `json:"message"`
	} `json:"choices"`
	Error *struct{ Message string `json:"message"` } `json:"error,omitempty"`
}
type GenerateResponse struct {
	OutputType string   `json:"output_type"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Mood       string   `json:"mood"`
	Tags       []string `json:"tags"`
	Location   string   `json:"location"`
	Era        string   `json:"era"`
	SoundTags  []string `json:"sound_tags"`
}
type ArchiveEntry struct {
	ID         string   `json:"id"`
	Title      string   `json:"title"`
	OutputType string   `json:"output_type"`
	Content    string   `json:"content"`
	Mood       string   `json:"mood"`
	Tags       []string `json:"tags"`
	Location   string   `json:"location"`
	Lat        float64  `json:"lat"`
	Lng        float64  `json:"lng"`
	Era        string   `json:"era"`
	SoundTags  []string `json:"sound_tags"`
}

var archive []ArchiveEntry

var heritageLocations = map[string][2]float64{
	"College Street":    {22.5796, 88.3630},
	"Howrah Bridge":     {22.5851, 88.3468},
	"Kumartuli":         {22.5958, 88.3610},
	"Maidan Tram Depot": {22.5553, 88.3424},
	"North Kolkata":     {22.5958, 88.3700},
	"Park Street":       {22.5533, 88.3521},
	"Rabindra Sarani":   {22.5726, 88.3639},
	"Jorasanko":         {22.5867, 88.3604},
	"Shyambazar":        {22.5990, 88.3720},
	"Esplanade":         {22.5657, 88.3511},
}

var heritageSecrets = map[string]string{
	"College Street":    "Kolkata's intellectual heart since the 19th century. The famous Coffee House has hosted Satyajit Ray, Mrinal Sen, and Amartya Sen. Street vendors here sell first editions that collectors fly from London to buy.",
	"Howrah Bridge":     "Built without a single nut or bolt — only rivets. During WWII the British painted it to confuse Japanese bombers. At dawn, 60 tonnes of flowers pass over it daily from Mullik Ghat flower market.",
	"Kumartuli":         "The potters here have made idols for 400 years. The clay comes only from the banks of the Ganga. Artisans say the first handful of clay must come from a brothel doorstep — it symbolises the goddess embracing all of humanity.",
	"Maidan Tram Depot": "Kolkata runs the last operational tram network in Asia. Tram no. 37 has been running the same route since 1902. The drivers keep a small Durga idol on the dashboard of every tram.",
	"Rabindra Sarani":   "Named after Tagore, this street was once called Chitpur Road — the oldest road in Kolkata, older than the city itself. The brass-makers here have supplied temple bells to temples across Southeast Asia for centuries.",
	"Park Street":       "Called the Street That Never Sleeps. The Park Street Cemetery holds graves of British colonists who never made it home — the oldest dates to 1767. Locals say you can hear jazz from Trincas on quiet winter nights.",
	"Jorasanko":         "Rabindranath Tagore was born here in 1861. The house has 30 rooms and Tagore wrote over 2000 songs within its walls. The family also pioneered Bengali theatre and introduced the concept of rehearsals to Indian drama.",
	"Shyambazar":        "The five-pointed crossing here was designed by the British to confuse revolutionaries fleeing the police. The Shyambazar adda has been running continuously since 1947.",
	"North Kolkata":     "The oldest part of the city, where time moves differently. The narrow lanes (galis) hide 200-year-old mansions, many abandoned after Partition. Some say the ghosts of zamindars still walk the rooftops at dusk.",
	"Esplanade":         "The colonial heart of the city. The Metro here is the oldest underground railway in Asia, opened in 1984. The maidan beside it was used for British horse races — the grass still grows differently where the tracks were.",
}

func nearestLocation(loc string) (string, float64, float64) {
	for name, coords := range heritageLocations {
		if strings.Contains(strings.ToLower(loc), strings.ToLower(name)) {
			return name, coords[0], coords[1]
		}
	}
	return "College Street", 22.5796, 88.3630
}

func buildSystemPrompt(outputType, language string) string {
	langInstr := map[string]string{
		"english":   "Respond in English only.",
		"bengali":   "Respond in Bengali only.",
		"bilingual": "Respond in a natural mix of Bengali and English, code-switching as Kolkatans do.",
	}[language]
	outputInstr := map[string]string{
		"script": `Generate a short cinematic indie-film script (3-5 scenes).
Format strictly as:
TITLE: [evocative title]
MOOD: [one atmospheric phrase]
TAGS: [comma-separated tags]
LOCATION: [one specific Kolkata neighbourhood]
ERA: [1960s or 1970s or 1990s or modern]
SOUND_TAGS: [use ONLY these values separated by commas: tram bells, monsoon rain, adda chatter, dhak drums, street noise, crow calls]
---
SCENE 1: [location]
[Action and dialogue]
(3-5 scenes total)`,
		"poem": `Generate a poem in the tradition of Jibanananda Das (12-20 lines).
Format strictly as:
TITLE: [title]
MOOD: [one atmospheric phrase]
TAGS: [comma-separated tags]
LOCATION: [one specific Kolkata neighbourhood]
ERA: [1960s or 1970s or 1990s or modern]
SOUND_TAGS: [use ONLY these values separated by commas: tram bells, monsoon rain, adda chatter, dhak drums, street noise, crow calls]
---
[The poem]`,
		"storyboard": `Generate a visual storyboard with 4-6 director shots.
Format strictly as:
TITLE: [title]
MOOD: [one atmospheric phrase]
TAGS: [comma-separated tags]
LOCATION: [one specific Kolkata neighbourhood]
ERA: [1960s or 1970s or 1990s or modern]
SOUND_TAGS: [use ONLY these values separated by commas: tram bells, monsoon rain, adda chatter, dhak drums, street noise, crow calls]
---
SHOT 1 — [WIDE/MEDIUM/CLOSE/ECU]: [description, camera movement, lighting note]
(4-6 shots total)`,
	}[outputType]
	return fmt.Sprintf(`You are Kabbo.Lens — a generative cultural memory engine for Kolkata.
You deeply understand: North Kolkata lanes, tram culture, Satyajit Ray cinema, Jibanananda Das poetry,
colonial decay, monsoon light, Durga Puja, adda culture, Howrah Bridge at dawn, College Street chai,
Kumartuli clay gods, and the melancholy of a city that holds time differently.
%s
%s
IMPORTANT: For SOUND_TAGS use ONLY these exact strings: tram bells, monsoon rain, adda chatter, dhak drums, street noise, crow calls
Extract specific visual elements from the image. Never be generic.`, langInstr, outputInstr)
}

func parseField(raw, field string) string {
	idx := strings.Index(raw, field)
	if idx == -1 {
		return ""
	}
	rest := raw[idx+len(field):]
	end := strings.Index(rest, "\n")
	if end == -1 {
		return strings.TrimSpace(rest)
	}
	return strings.TrimSpace(rest[:end])
}

func parseTags(raw string) []string {
	var tags []string
	for _, t := range strings.Split(raw, ",") {
		t = strings.TrimSpace(t)
		if t != "" {
			tags = append(tags, t)
		}
	}
	return tags
}

func parseResponse(raw, outputType string) GenerateResponse {
	resp := GenerateResponse{OutputType: outputType}
	resp.Title = parseField(raw, "TITLE:")
	resp.Mood = parseField(raw, "MOOD:")
	resp.Era = parseField(raw, "ERA:")
	resp.Location = parseField(raw, "LOCATION:")
	resp.Tags = parseTags(parseField(raw, "TAGS:"))
	resp.SoundTags = parseTags(parseField(raw, "SOUND_TAGS:"))
	idx := strings.Index(raw, "---")
	if idx != -1 {
		resp.Content = strings.TrimSpace(raw[idx+3:])
	} else {
		resp.Content = raw
	}
	return resp
}

func callGitHubModels(token, systemPrompt, imageB64, mediaType, outputType string) (string, error) {
	dataURL := fmt.Sprintf("data:%s;base64,%s", mediaType, imageB64)
	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 1500, Temperature: 0.85,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: []ContentPart{
				{Type: "image_url", ImageURL: &ImageURL{URL: dataURL, Detail: "high"}},
				{Type: "text", Text: fmt.Sprintf("Analyze this Kolkata photograph and generate a %s.", outputType)},
			}},
		},
	}
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "https://models.inference.ai.azure.com/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}
	if chatResp.Error != nil {
		return "", fmt.Errorf("API error: %s", chatResp.Error.Message)
	}
	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from model")
	}
	return chatResp.Choices[0].Message.Content, nil
}

// ─── Generate Handler ─────────────────────────────────────────────────────────

func generateHandler(c *gin.Context) {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GITHUB_TOKEN not set"})
		return
	}
	if err := c.Request.ParseMultipartForm(20 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}
	outputType := c.PostForm("output_type")
	language := c.PostForm("language")
	if outputType == "" {
		outputType = "script"
	}
	if language == "" {
		language = "bilingual"
	}
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image required"})
		return
	}
	defer file.Close()
	imgBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image"})
		return
	}
	mediaType := header.Header.Get("Content-Type")
	if mediaType == "" {
		mediaType = "image/jpeg"
	}
	imgB64 := base64.StdEncoding.EncodeToString(imgBytes)
	rawText, err := callGitHubModels(token, buildSystemPrompt(outputType, language), imgB64, mediaType, outputType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	result := parseResponse(rawText, outputType)
	locName, lat, lng := nearestLocation(result.Location)
	entry := ArchiveEntry{
		ID:         fmt.Sprintf("%d", len(archive)+1),
		Title:      result.Title,
		OutputType: result.OutputType,
		Content:    result.Content,
		Mood:       result.Mood,
		Tags:       result.Tags,
		Location:   locName,
		Lat:        lat,
		Lng:        lng,
		Era:        result.Era,
		SoundTags:  result.SoundTags,
	}
	archive = append(archive, entry)
	c.JSON(http.StatusOK, gin.H{"result": result, "archive": entry})
}

// ─── Sound Handler (Freesound) ────────────────────────────────────────────────

// Curated Freesound search queries per tag
var freesoundQueries = map[string]string{
	"tram bells":   "tram bell city",
	"monsoon rain": "heavy rain roof",
	"adda chatter": "cafe crowd chatter ambient",
	"dhak drums":   "dhol drum festival india",
	"street noise": "india street city ambient",
	"crow calls":   "crow bird call morning",
}

type FreesoundSearchResult struct {
	Results []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		Previews struct {
			PreviewHQMP3 string `json:"preview-hq-mp3"`
			PreviewLQMP3 string `json:"preview-lq-mp3"`
		} `json:"previews"`
	} `json:"results"`
}

func soundHandler(c *gin.Context) {
	apiKey := os.Getenv("FREESOUND_API_KEY")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "FREESOUND_API_KEY not set"})
		return
	}

	var body struct {
		Prompt string `json:"prompt"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Prompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt required"})
		return
	}

	tag := strings.ToLower(strings.TrimSpace(body.Prompt))
	query, ok := freesoundQueries[tag]
	if !ok {
		query = tag + " ambient"
	}

	// Search Freesound for matching sounds
	searchURL := fmt.Sprintf(
		"https://freesound.org/apiv2/search/text/?query=%s&fields=id,name,previews&filter=duration:[3+TO+30]&page_size=5&token=%s",
		strings.ReplaceAll(query, " ", "+"), apiKey,
	)

	client := &http.Client{}
	searchResp, err := client.Get(searchURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Freesound search failed: " + err.Error()})
		return
	}
	defer searchResp.Body.Close()

	var searchResult FreesoundSearchResult
	if err := json.NewDecoder(searchResp.Body).Decode(&searchResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse Freesound response"})
		return
	}

	if len(searchResult.Results) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No sounds found for: " + tag})
		return
	}

	// Pick first result with a preview URL
	var previewURL string
	for _, r := range searchResult.Results {
		if r.Previews.PreviewHQMP3 != "" {
			previewURL = r.Previews.PreviewHQMP3
			break
		}
		if r.Previews.PreviewLQMP3 != "" {
			previewURL = r.Previews.PreviewLQMP3
			break
		}
	}

	if previewURL == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "No preview available"})
		return
	}

	// Fetch the audio and proxy it to avoid CORS
	audioResp, err := client.Get(previewURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch audio: " + err.Error()})
		return
	}
	defer audioResp.Body.Close()

	audioBytes, err := io.ReadAll(audioResp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read audio"})
		return
	}

	c.Header("Content-Type", "audio/mpeg")
	c.Header("Cache-Control", "public, max-age=86400")
	c.Data(http.StatusOK, "audio/mpeg", audioBytes)
}

// ─── Heritage Guide Handler ───────────────────────────────────────────────────

func guideHandler(c *gin.Context) {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GITHUB_TOKEN not set"})
		return
	}
	var body struct {
		Location string `json:"location"`
		Question string `json:"question"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Location == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "location required"})
		return
	}
	secret := heritageSecrets[body.Location]
	question := body.Question
	if question == "" {
		question = "Tell me about this place and its hidden secrets."
	}
	systemPrompt := fmt.Sprintf(`You are Dadu — an 80-year-old Kolkata adda uncle who has spent his entire life in this city.
You know every secret lane, every ghost story, every historical scandal, every hidden gem.
You speak in warm, natural Bengali-English code-switching, exactly as Kolkatans do.
You are currently at: %s

Known facts about this location: %s

Your personality:
- Warm, witty, slightly dramatic storyteller
- Always start with a personal memory or anecdote from your life
- Reveal 2-3 hidden secrets or lesser-known facts about this place
- End with one practical tip for visitors
- Speak naturally and conversationally, NOT like Wikipedia
- Keep response under 180 words
- Use Bengali words naturally: "arre", "ki bolbo tumi", "shundor", "dekho", "bolo", "ektu"`, body.Location, secret)

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 350, Temperature: 0.9,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: question},
		},
	}
	reqBody, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "https://models.inference.ai.azure.com/chat/completions", bytes.NewReader(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()
	var chatResp ChatResponse
	json.NewDecoder(resp.Body).Decode(&chatResp)
	if chatResp.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": chatResp.Error.Message})
		return
	}
	if len(chatResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no response"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"guide":    chatResp.Choices[0].Message.Content,
		"location": body.Location,
	})
}

// ─── Archive Handler ──────────────────────────────────────────────────────────

func archiveHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"entries": archive})
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true, // THIS IS THE MAGIC FIX FOR VERCEL
		AllowMethods:    []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept"},
	}))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "Kabbo.Lens alive 🎞️"})
	})
	r.POST("/api/generate", generateHandler)
	r.POST("/api/sound", soundHandler)
	r.POST("/api/guide", guideHandler)
	r.GET("/api/archive", archiveHandler)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🎞️  Kabbo.Lens backend on :%s\n", port)
	r.Run(":" + port)
}