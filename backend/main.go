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

	"github.com/gin-gonic/gin"
)

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
	SoundTags  []string `json:"soundTags"`
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
	SoundTags  []string `json:"soundTags"`
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
	Lat                    float64 `json:"lat"`
	Lng                    float64 `json:"lng"`
}

var archive []ArchiveEntry

var heritageLocations = map[string][2]float64{
	"College Street":       {22.5796, 88.3630},
	"Howrah Bridge":        {22.5851, 88.3468},
	"Kumartuli":            {22.5958, 88.3610},
	"Maidan Tram Depot":    {22.5553, 88.3424},
	"North Kolkata":        {22.5958, 88.3700},
	"Park Street":          {22.5533, 88.3521},
	"Rabindra Sarani":      {22.5726, 88.3639},
	"Jorasanko":            {22.5867, 88.3604},
	"Shyambazar":           {22.5990, 88.3720},
	"Esplanade":            {22.5657, 88.3511},
	"Victoria Memorial":    {22.5448, 88.3426},
	"Dakshineswar":         {22.6550, 88.3577},
	"Belur Math":           {22.6362, 88.3536},
	"Indian Museum":        {22.5573, 88.3511},
	"St. Paul's Cathedral": {22.5487, 88.3431},
	"Birla Planetarium":    {22.5460, 88.3452},
	"Princep Ghat":         {22.5567, 88.3327},
	"Mullick Ghat":         {22.5754, 88.3452},
	"New Market":           {22.5577, 88.3507},
	"Kalighat":             {22.5247, 88.3427},
	"Ballygunge":           {22.5264, 88.3678},
	"Salt Lake":            {22.5797, 88.4149},
}

var heritageSecrets = map[string]string{
	"College Street":    "Kolkata's intellectual heart since the 19th century. The famous Coffee House has hosted Satyajit Ray, Mrinal Sen, and Amartya Sen.",
	"Howrah Bridge":     "Built without a single nut or bolt — only rivets. At dawn, 60 tonnes of flowers pass over it daily from Mullik Ghat flower market.",
	"Kumartuli":         "The potters here have made idols for 400 years. The clay comes only from the banks of the Ganga.",
	"Maidan Tram Depot": "Kolkata runs the last operational tram network in Asia. Tram no. 37 has been running the same route since 1902.",
	"Rabindra Sarani":   "Named after Tagore, this street was once called Chitpur Road — the oldest road in Kolkata.",
	"Park Street":       "Called the Street That Never Sleeps. The Park Street Cemetery holds graves dating to 1767.",
	"Jorasanko":         "Rabindranath Tagore was born here in 1861. The house has 30 rooms and Tagore wrote over 2000 songs within its walls.",
	"Shyambazar":        "The five-pointed crossing was designed by the British to confuse revolutionaries fleeing the police.",
	"North Kolkata":     "The oldest part of the city. Narrow lanes hide 200-year-old mansions abandoned after Partition.",
	"Esplanade":         "The Metro here is the oldest underground railway in Asia, opened 1984.",
	"Victoria Memorial": "Built by Lord Curzon, its white Makrana marble glows gold at sunset. Beneath its pristine gardens lie hidden underground tunnels.",
	"Dakshineswar":      "Ramakrishna Paramahansa meditated here for 12 years. The temple's nine spires represent the nine forms of Durga.",
	"Belur Math":        "Swami Vivekananda designed this temple to look like a church from the front, a mosque from the back, and a temple from above.",
	"Indian Museum":     "The oldest museum in Asia, founded 1814. Its collection includes a genuine Buddha relic.",
	"Howrah Station":    "One of the busiest railway stations in the world — over 1 million passengers daily.",
	"Eden Gardens":      "The oldest cricket ground in India, opened 1864. A live well beneath the ground keeps the pitch moist even in summer.",
	"Kalighat":          "The Kali temple here is so ancient its founding date is unknown.",
	"Marble Palace":     "Built in 1835 by a zamindar who imported 90 types of Italian marble. It contains original Rubens and Reynolds paintings.",
	"Princep Ghat":      "Named after James Prinsep who decoded the Brahmi script. The river lanterns released here on Kali Puja night drift to the Bay of Bengal.",
}

const GITHUB_MODELS_URL = "https://models.inference.ai.azure.com/chat/completions?api-version=2024-05-01-preview"
const MIRO_BOARDS_URL = "https://api.miro.com/v2/boards"
const ELEVENLABS_SOUND_URL = "https://api.elevenlabs.io/v1/sound-generation"
const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9"

func nearestLocation(loc string) (string, float64, float64) {
	locLower := strings.ToLower(loc)
	for name, coords := range heritageLocations {
		if strings.Contains(locLower, strings.ToLower(name)) {
			return name, coords[0], coords[1]
		}
	}
	return "Esplanade", 22.5657, 88.3511
}

func buildSystemPrompt(outputType, language string) string {
	langInstr := "Respond in a natural mix of Bengali and English, code-switching as Kolkatans do."
	if language == "english" {
		langInstr = "Respond in English only."
	}
	if language == "bengali" {
		langInstr = "Respond in Bengali only."
	}

	outputInstr := map[string]string{
		"script":     "Generate a short cinematic indie-film script.\nFormat STRICTLY as follows. DO NOT USE MARKDOWN OR BOLDING for keys:\nTITLE: [title]\nMOOD: [mood]\nTAGS: [tag1, tag2]\nSOUND_TAGS: [sound1, sound2]\nLOCATION: [location]\nERA: [era]\n---\nSCENE 1:\n[content]",
		"poem":       "Generate a Jibanananda Das style poem.\nFormat STRICTLY as follows. DO NOT USE MARKDOWN OR BOLDING for keys:\nTITLE: [title]\nMOOD: [mood]\nTAGS: [tag1, tag2]\nSOUND_TAGS: [sound1, sound2]\nLOCATION: [location]\nERA: [era]\n---\n[poem content]",
		"storyboard": "Generate a visual storyboard with 4 shots.\nFormat STRICTLY as follows. DO NOT USE MARKDOWN OR BOLDING for keys:\nTITLE: [title]\nMOOD: [mood]\nTAGS: [tag1, tag2]\nSOUND_TAGS: [sound1, sound2]\nLOCATION: [location]\nERA: [era]\n---\nSHOT 1:\n[content]",
	}[outputType]
	return fmt.Sprintf("You are Kabbo.Lens — a cultural memory engine. %s %s", langInstr, outputInstr)
}

func parseField(raw, field string) string {
	cleanRaw := strings.ReplaceAll(raw, "**", "")
	idx := strings.Index(cleanRaw, field)
	if idx == -1 {
		return ""
	}
	rest := cleanRaw[idx+len(field):]
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
	if len(tags) == 0 {
		return []string{"Cinematic", "Kolkata"}
	}
	return tags
}

func parseResponse(raw, outputType string) GenerateResponse {
	cleanRaw := strings.ReplaceAll(raw, "**", "")
	resp := GenerateResponse{OutputType: outputType}
	resp.Title = parseField(cleanRaw, "TITLE:")
	resp.Mood = parseField(cleanRaw, "MOOD:")
	resp.Era = parseField(cleanRaw, "ERA:")
	resp.Location = parseField(cleanRaw, "LOCATION:")
	resp.Tags = parseTags(parseField(cleanRaw, "TAGS:"))
	resp.SoundTags = parseTags(parseField(cleanRaw, "SOUND_TAGS:"))

	idx := strings.Index(cleanRaw, "---")
	if idx != -1 {
		resp.Content = strings.TrimSpace(cleanRaw[idx+3:])
	} else {
		eraIdx := strings.Index(cleanRaw, "ERA:")
		if eraIdx != -1 {
			end := strings.Index(cleanRaw[eraIdx:], "\n")
			if end != -1 {
				resp.Content = strings.TrimSpace(cleanRaw[eraIdx+end:])
			} else {
				resp.Content = cleanRaw
			}
		} else {
			resp.Content = cleanRaw
		}
	}

	if resp.Title == "" {
		resp.Title = "Memory of Kolkata"
	}
	if resp.Content == "" {
		resp.Content = raw
	}

	return resp
}

func splitContent(text string, limit int) []string {
	var chunks []string
	runes := []rune(text)
	for len(runes) > 0 {
		if len(runes) <= limit {
			chunks = append(chunks, string(runes))
			break
		}
		chunks = append(chunks, string(runes[:limit]))
		runes = runes[limit:]
	}
	if len(chunks) == 0 {
		chunks = append(chunks, "Generated content was empty.")
	}
	return chunks
}

func callGitHubModels(token, systemPrompt, imageB64, mediaType, outputType string) (string, error) {
	dataURL := fmt.Sprintf("data:%s;base64,%s", mediaType, imageB64)
	req := ChatRequest{
		Model:       "gpt-4o",
		MaxTokens:   1500,
		Temperature: 0.85,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: []ContentPart{
				{Type: "image_url", ImageURL: &ImageURL{URL: dataURL, Detail: "high"}},
				{Type: "text", Text: fmt.Sprintf("Analyze this Kolkata photograph and generate a %s.", outputType)},
			}},
		},
	}
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", GITHUB_MODELS_URL, bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(token))
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var chatResp ChatResponse
	json.NewDecoder(resp.Body).Decode(&chatResp)
	if chatResp.Error != nil {
		return "", fmt.Errorf("API error: %s", chatResp.Error.Message)
	}
	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from model")
	}
	return chatResp.Choices[0].Message.Content, nil
}

func generateHandler(c *gin.Context) {
	token := strings.TrimSpace(os.Getenv("GITHUB_TOKEN"))
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GITHUB_TOKEN not set"})
		return
	}
	outputType := c.PostForm("output_type")
	language := c.PostForm("language")
	if outputType == "" {
		outputType = "script"
	}

	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image required"})
		return
	}
	defer file.Close()
	imgBytes, _ := io.ReadAll(file)
	mediaType := header.Header.Get("Content-Type")
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
		SoundTags:  result.SoundTags,
		Location:   locName,
		Lat:        lat,
		Lng:        lng,
		Era:        result.Era,
	}
	archive = append(archive, entry)
	c.JSON(http.StatusOK, gin.H{"result": result, "archive": entry})
}

func miroHandler(c *gin.Context) {
	apiKey := strings.TrimSpace(os.Getenv("MIRO_TOKEN"))
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

	boardReqJSON, _ := json.Marshal(map[string]interface{}{
		"name":        body.Result.Title + " · Kabbo.Lens",
		"description": "Generated by Kabbo.Lens",
	})

	req, _ := http.NewRequest("POST", MIRO_BOARDS_URL, bytes.NewReader(boardReqJSON))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Miro failed"})
		return
	}
	defer resp.Body.Close()

	var boardResp struct {
		ID       string `json:"id"`
		ViewLink string `json:"viewLink"`
	}
	json.NewDecoder(resp.Body).Decode(&boardResp)

	titleText := fmt.Sprintf("<h1>%s</h1><p><em>%s</em></p>", body.Result.Title, body.Result.Mood)
	titleCard, _ := json.Marshal(map[string]interface{}{
		"data":     map[string]interface{}{"content": titleText},
		"style":    map[string]interface{}{"fillColor": "#0f0e10", "textColor": "#d4a84b"},
		"position": map[string]interface{}{"x": 0, "y": -400},
	})
	req2, _ := http.NewRequest("POST", fmt.Sprintf("https://api.miro.com/v2/boards/%s/texts", boardResp.ID), bytes.NewReader(titleCard))
	req2.Header.Set("Authorization", "Bearer "+apiKey)
	req2.Header.Set("Content-Type", "application/json")
	res2, _ := client.Do(req2)
	if res2 != nil {
		res2.Body.Close()
	}

	chunks := splitContent(body.Result.Content, 2800)
	colors := []string{"light_yellow", "light_green", "light_blue"}
	for i, chunk := range chunks {
		color := colors[i%len(colors)]
		xPos := float64(i) * 380
		stickyJSON, _ := json.Marshal(map[string]interface{}{
			"data":     map[string]interface{}{"content": chunk, "shape": "square"},
			"style":    map[string]interface{}{"fillColor": color},
			"position": map[string]interface{}{"x": xPos, "y": 0},
		})
		req3, _ := http.NewRequest("POST", fmt.Sprintf("https://api.miro.com/v2/boards/%s/sticky_notes", boardResp.ID), bytes.NewReader(stickyJSON))
		req3.Header.Set("Authorization", "Bearer "+apiKey)
		req3.Header.Set("Content-Type", "application/json")
		res3, _ := client.Do(req3)
		if res3 != nil {
			res3.Body.Close()
		}
	}

	c.JSON(http.StatusOK, gin.H{"board_url": boardResp.ViewLink, "board_id": boardResp.ID})
}

func reverseSearchHandler(c *gin.Context) {
	token := strings.TrimSpace(os.Getenv("GITHUB_TOKEN"))
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GITHUB_TOKEN not set"})
		return
	}
	if err := c.Request.ParseMultipartForm(20 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
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

	systemPrompt := `Analyze this image carefully. Identify the specific Kolkata landmark. 
Respond ONLY with a JSON object format: {"item_name": "...", "location": "...", "historical_significance": "...", "confidence_score": 0.9, "lat": 22.5448, "lng": 88.3426}`

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 400, Temperature: 0.1,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: []ContentPart{
				{Type: "image_url", ImageURL: &ImageURL{URL: dataURL, Detail: "high"}},
				{Type: "text", Text: "Identify this Kolkata location precisely."},
			}},
		},
	}
	body, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", GITHUB_MODELS_URL, bytes.NewReader(body))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(token))
	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Vision API failed: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	var chatResp ChatResponse
	json.NewDecoder(resp.Body).Decode(&chatResp)

	if chatResp.Error != nil || len(chatResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from model"})
		return
	}

	rawJSON := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	rawJSON = strings.TrimPrefix(rawJSON, "```json")
	rawJSON = strings.TrimPrefix(rawJSON, "```")
	rawJSON = strings.TrimSuffix(rawJSON, "```")
	rawJSON = strings.TrimSpace(rawJSON)

	var idResult IdentifyResult
	json.Unmarshal([]byte(rawJSON), &idResult)

	nearestName, lat, lng := nearestLocation(idResult.ItemName)

	c.JSON(http.StatusOK, gin.H{
		"location": nearestName, "lat": lat, "lng": lng,
		"exact_item": idResult.ItemName, "real_location": idResult.Location,
		"significance": idResult.HistoricalSignificance, "confidence": idResult.ConfidenceScore,
		"nearest_heritage": nearestName,
	})
}

func guideHandler(c *gin.Context) {
	token := strings.TrimSpace(os.Getenv("DADU_GITHUB_TOKEN"))
	if token == "" {
		token = strings.TrimSpace(os.Getenv("GITHUB_TOKEN"))
	}
	if token == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No API tokens found for Dadu"})
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
	if secret == "" {
		secret = fmt.Sprintf("Ah, %s! My memory is a bit foggy on the exact dates, but I've seen that area change so much over the decades.", body.Location)
	}

	systemPrompt := fmt.Sprintf(`You are Dadu — an 80-year-old Kolkata man. Tell a story mixing English and Bengali. Location: %s. Context: %s`, body.Location, secret)

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 400, Temperature: 0.92,
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: body.Question},
		},
	}
	reqBody, _ := json.Marshal(req)
	httpReq, _ := http.NewRequest("POST", GITHUB_MODELS_URL, bytes.NewReader(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(token))

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	var chatResp ChatResponse
	json.NewDecoder(resp.Body).Decode(&chatResp)

	if len(chatResp.Choices) > 0 {
		c.JSON(http.StatusOK, gin.H{"guide": chatResp.Choices[0].Message.Content, "location": body.Location})
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no response"})
	}
}

func soundHandler(c *gin.Context) {
	apiKey := strings.TrimSpace(os.Getenv("ELEVENLABS_API_KEY"))
	var body struct {
		Prompt string `json:"prompt"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Prompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "prompt required"})
		return
	}
	if apiKey == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "ELEVENLABS_API_KEY not set"})
		return
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"text":             body.Prompt,
		"duration_seconds": 15,
		"prompt_influence": 0.4,
	})

	httpReq, _ := http.NewRequest("POST", ELEVENLABS_SOUND_URL, bytes.NewReader(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("xi-api-key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	audioBytes, _ := io.ReadAll(resp.Body)
	c.Data(http.StatusOK, "audio/mpeg", audioBytes)
}

func narratorHandler(c *gin.Context) {
	apiKey := strings.TrimSpace(os.Getenv("ELEVENLABS_API_KEY"))
	var body struct {
		Text  string `json:"text"`
		Voice string `json:"voice"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.Text == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "text required"})
		return
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"text":     body.Text,
		"model_id": "eleven_multilingual_v2",
	})

	httpReq, _ := http.NewRequest("POST", ELEVENLABS_TTS_URL, bytes.NewReader(reqBody))
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("xi-api-key", apiKey)
	httpReq.Header.Set("Accept", "audio/mpeg")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	audioBytes, _ := io.ReadAll(resp.Body)
	c.Data(http.StatusOK, "audio/mpeg", audioBytes)
}

func archiveHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"entries": archive, "items": archive})
}

func locationsHandler(c *gin.Context) {
	type LocPin struct {
		Name        string  `json:"name"`
		Lat         float64 `json:"lat"`
		Lng         float64 `json:"lng"`
		Description string  `json:"description"`
	}
	var pins []LocPin
	for name, coords := range heritageLocations {
		desc := heritageSecrets[name]
		if desc == "" {
			desc = "A significant heritage location in Kolkata."
		}
		pins = append(pins, LocPin{Name: name, Lat: coords[0], Lng: coords[1], Description: desc})
	}
	c.JSON(http.StatusOK, pins)
}

func main() {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := r.Group("/api")
	{
		api.POST("/generate", generateHandler)
		api.POST("/identify", reverseSearchHandler)
		api.POST("/reverse-search", reverseSearchHandler)
		api.POST("/guide", guideHandler)
		api.POST("/miro", miroHandler)
		api.POST("/sound", soundHandler)
		api.POST("/narrator", narratorHandler)
		api.GET("/archive", archiveHandler)
		api.GET("/locations", locationsHandler)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
