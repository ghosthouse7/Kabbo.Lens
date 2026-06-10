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
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}
type GenerateResponse struct {
	OutputType string   `json:"output_type"`
	Title      string   `json:"title"`
	Content    string   `json:"content"`
	Mood       string   `json:"mood"`
	Tags       []string `json:"tags"`
	Location   string   `json:"location"`
	Era        string   `json:"era"`
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
}
type IdentifyResult struct {
	ItemName               string  `json:"item_name"`
	Location               string  `json:"location"`
	HistoricalSignificance string  `json:"historical_significance"`
	ConfidenceScore        float64 `json:"confidence_score"`
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
	"Rabindra Sarani":   "Named after Tagore, this street was once called Chitpur Road — the oldest road in Kolkata. The brass-makers here have supplied temple bells to temples across Southeast Asia for centuries.",
	"Park Street":       "Called the Street That Never Sleeps. The Park Street Cemetery holds graves dating to 1767. Locals say you can hear jazz from Trincas on quiet winter nights.",
	"Jorasanko":         "Rabindranath Tagore was born here in 1861. The house has 30 rooms and Tagore wrote over 2000 songs within its walls.",
	"Shyambazar":        "The five-pointed crossing was designed by the British to confuse revolutionaries fleeing the police. The adda here has run continuously since 1947.",
	"North Kolkata":     "The oldest part of the city. Narrow lanes hide 200-year-old mansions abandoned after Partition. Ghosts of zamindars walk the rooftops at dusk.",
	"Esplanade":         "The Metro here is the oldest underground railway in Asia, opened 1984. The maidan was used for British horse races — grass still grows differently where the tracks were.",
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
---
[The poem]`,
		"storyboard": `Generate a visual storyboard with 4-6 director shots.
Format strictly as:
TITLE: [title]
MOOD: [one atmospheric phrase]
TAGS: [comma-separated tags]
LOCATION: [one specific Kolkata neighbourhood]
ERA: [1960s or 1970s or 1990s or modern]
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
	}
	archive = append(archive, entry)
	c.JSON(http.StatusOK, gin.H{"result": result, "archive": entry})
}

// ─── Reverse Image Search Handler ─────────────────────────────────────────────

func reverseSearchHandler(c *gin.Context) {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GITHUB_TOKEN not set"})
		return
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
	dataURL := fmt.Sprintf("data:%s;base64,%s", mediaType, imgB64)

	systemPrompt := `You are an expert cultural heritage identification engine. 
Analyze this image directly and identify the specific artifact, landmark, or street accurately.

Provide the response in the following STRICT JSON format with no markdown blocks and no extra text:
{
  "item_name": "Exact Name of the historical artifact/location",
  "location": "City, Country",
  "historical_significance": "A brief 2-sentence summary of why it matters.",
  "confidence_score": 0.95
}`

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 300, Temperature: 0.1,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: []ContentPart{
				{Type: "image_url", ImageURL: &ImageURL{URL: dataURL, Detail: "high"}},
			}},
		},
	}
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "https://models.inference.ai.azure.com/chat/completions", bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+token)
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil || resp.StatusCode != 200 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Vision API failed"})
		return
	}
	defer resp.Body.Close()
	var chatResp ChatResponse
	json.NewDecoder(resp.Body).Decode(&chatResp)
	if len(chatResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response"})
		return
	}

	rawJSON := strings.TrimSpace(chatResp.Choices[0].Message.Content)

	rawJSON = strings.TrimPrefix(rawJSON, "```json")
	rawJSON = strings.TrimPrefix(rawJSON, "```")
	rawJSON = strings.TrimSuffix(rawJSON, "```")
	rawJSON = strings.TrimSpace(rawJSON)

	var idResult IdentifyResult
	if err := json.Unmarshal([]byte(rawJSON), &idResult); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse model output"})
		return
	}

	searchQuery := idResult.ItemName + " " + idResult.Location
	locName, lat, lng := nearestLocation(searchQuery)

	c.JSON(http.StatusOK, gin.H{
		"location":      locName,
		"lat":           lat,
		"lng":           lng,
		"exact_item":    idResult.ItemName,
		"real_location": idResult.Location,
		"significance":  idResult.HistoricalSignificance,
		"confidence":    idResult.ConfidenceScore,
	})
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
	systemPrompt := fmt.Sprintf(`You are Dadu — an 80-year-old Kolkata adda uncle.
You know every secret lane, ghost story, historical scandal, and hidden gem.
You speak in warm Bengali-English code-switching. Currently at: %s.
Known facts: %s
- Start with a personal memory
- Reveal 2-3 hidden secrets
- End with one visitor tip
- Under 180 words. Use Bengali: "arre", "ki bolbo", "shundor", "dekho"`, body.Location, secret)

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 350, Temperature: 0.9,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: question},
		},
	}
	reqBody, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", "[https://models.inference.ai.azure.com/chat/completions](https://models.inference.ai.azure.com/chat/completions)", bytes.NewReader(reqBody))
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
	c.JSON(http.StatusOK, gin.H{"guide": chatResp.Choices[0].Message.Content, "location": body.Location})
}

// ─── Miro Handler ─────────────────────────────────────────────────────────────

func miroHandler(c *gin.Context) {
	apiKey := os.Getenv("MIRO_TOKEN")
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MIRO_TOKEN not set"})
		return
	}

	var body struct {
		Result GenerateResponse `json:"result"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	result := body.Result
	boardName := result.Title
	if boardName == "" {
		boardName = "Kabbo.Lens — Cultural Memory Workspace"
	} else {
		boardName = result.Title + " · Kabbo.Lens"
	}

	boardReqJSON, _ := json.Marshal(map[string]interface{}{
		"name":        boardName,
		"description": fmt.Sprintf("Generated by Kabbo.Lens · %s · %s · %s", result.OutputType, result.Location, result.Era),
	})
	req, _ := http.NewRequest("POST", "[https://api.miro.com/v2/boards](https://api.miro.com/v2/boards)", bytes.NewReader(boardReqJSON))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Miro board: " + err.Error()})
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Miro board error %d: %s", resp.StatusCode, string(b))})
		return
	}
	var boardResp struct {
		ID       string `json:"id"`
		ViewLink string `json:"viewLink"`
	}
	json.NewDecoder(resp.Body).Decode(&boardResp)

	titleText := fmt.Sprintf("<h1>%s</h1><p><em>%s</em></p><p>%s · %s · %s</p>",
		result.Title, result.Mood, result.Location, result.Era,
		strings.Join(result.Tags, " · "),
	)
	titleCard, _ := json.Marshal(map[string]interface{}{
		"data":     map[string]interface{}{"content": titleText, "format": "html"},
		"style":    map[string]interface{}{"fillColor": "#0f0e10", "textColor": "#d4a84b"},
		"position": map[string]interface{}{"x": 0, "y": -400},
		"geometry": map[string]interface{}{"width": 600},
	})
	req2, _ := http.NewRequest("POST",
		fmt.Sprintf("[https://api.miro.com/v2/boards/%s/text](https://api.miro.com/v2/boards/%s/text)", boardResp.ID),
		bytes.NewReader(titleCard))
	req2.Header.Set("Authorization", "Bearer "+apiKey)
	req2.Header.Set("Content-Type", "application/json")
	client.Do(req2)

	content := result.Content
	chunks := splitContent(content, 2800)
	colors := []string{"light_yellow", "light_green", "light_blue", "light_pink", "light_orange"}
	for i, chunk := range chunks {
		color := colors[i%len(colors)]
		xPos := float64(i) * 380
		stickyJSON, _ := json.Marshal(map[string]interface{}{
			"data":     map[string]interface{}{"content": chunk, "shape": "square"},
			"style":    map[string]interface{}{"fillColor": color},
			"position": map[string]interface{}{"x": xPos, "y": 0},
			"geometry": map[string]interface{}{"width": 340},
		})
		req3, _ := http.NewRequest("POST",
			fmt.Sprintf("[https://api.miro.com/v2/boards/%s/sticky_notes](https://api.miro.com/v2/boards/%s/sticky_notes)", boardResp.ID),
			bytes.NewReader(stickyJSON))
		req3.Header.Set("Authorization", "Bearer "+apiKey)
		req3.Header.Set("Content-Type", "application/json")
		client.Do(req3)
	}

	if len(result.Tags) > 0 {
		tagsText := "Tags: " + strings.Join(result.Tags, " · ")
		tagsJSON, _ := json.Marshal(map[string]interface{}{
			"data":     map[string]interface{}{"content": tagsText, "format": "plain"},
			"style":    map[string]interface{}{"fillColor": "#1a1a2e", "textColor": "#8a7a5a"},
			"position": map[string]interface{}{"x": 0, "y": 500},
			"geometry": map[string]interface{}{"width": 800},
		})
		req4, _ := http.NewRequest("POST",
			fmt.Sprintf("[https://api.miro.com/v2/boards/%s/text](https://api.miro.com/v2/boards/%s/text)", boardResp.ID),
			bytes.NewReader(tagsJSON))
		req4.Header.Set("Authorization", "Bearer "+apiKey)
		req4.Header.Set("Content-Type", "application/json")
		client.Do(req4)
	}

	c.JSON(http.StatusOK, gin.H{
		"board_url": boardResp.ViewLink,
		"board_id":  boardResp.ID,
	})
}

func splitContent(content string, maxLen int) []string {
	if len(content) <= maxLen {
		return []string{content}
	}
	var chunks []string
	lines := strings.Split(content, "\n")
	current := ""
	for _, line := range lines {
		if len(current)+len(line)+1 > maxLen {
			if current != "" {
				chunks = append(chunks, strings.TrimSpace(current))
			}
			current = line
		} else {
			if current != "" {
				current += "\n"
			}
			current += line
		}
	}
	if current != "" {
		chunks = append(chunks, strings.TrimSpace(current))
	}
	return chunks
}

// ─── Archive Handler ──────────────────────────────────────────────────────────

func archiveHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"entries": archive})
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowAllOrigins: true,
		AllowMethods:    []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Type", "Accept"},
	}))
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "Kabbo.Lens alive 🎞️"})
	})
	r.POST("/api/generate", generateHandler)
	r.POST("/api/identify", reverseSearchHandler)
	r.POST("/api/guide", guideHandler)
	r.POST("/api/miro", miroHandler)
	r.GET("/api/archive", archiveHandler)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🎞️  Kabbo.Lens backend on :%s\n", port)
	r.Run(":" + port)
}
