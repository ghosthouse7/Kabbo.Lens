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
	Lat                    float64 `json:"lat"`
	Lng                    float64 `json:"lng"`
	NearestHeritage        string  `json:"nearest_heritage"`
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
	"Gariahat":             {22.5148, 88.3648},
	"Alipore":              {22.5323, 88.3357},
	"Botanical Garden":     {22.4946, 88.2945},
	"Science City":         {22.5384, 88.3962},
	"Nakhoda Mosque":       {22.5791, 88.3594},
	"Armenian Church":      {22.5700, 88.3492},
	"Marble Palace":        {22.5905, 88.3574},
	"Tagore's House":       {22.5867, 88.3604},
	"Howrah Station":       {22.5839, 88.3421},
	"Sealdah Station":      {22.5656, 88.3702},
	"Eden Gardens":         {22.5644, 88.3432},
	"Maidan":               {22.5553, 88.3424},
	"Fort William":         {22.5568, 88.3351},
	"Writers Building":     {22.5680, 88.3488},
	"High Court":           {22.5682, 88.3475},
	"GPO Kolkata":          {22.5680, 88.3488},
	"Shaheed Minar":        {22.5655, 88.3521},
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
	"Victoria Memorial": "Built by Lord Curzon, its white Makrana marble glows gold at sunset. The 16-ton bronze angel on top rotates with the wind. Beneath its pristine gardens lie hidden underground tunnels once connected to Fort William, alongside ruins of an ancient Mughal garden.",
	"Dakshineswar":      "Ramakrishna Paramahansa meditated here for 12 years. The temple's nine spires represent the nine forms of Durga. Priests say the Ganga here flows northward — the only place in Kolkata where it does.",
	"Belur Math":        "Swami Vivekananda designed this temple to look like a church from the front, a mosque from the back, and a temple from above. He died here in 1902 at just 39. The Math holds his original belongings.",
	"Indian Museum":     "The oldest museum in Asia, founded 1814. Its collection includes a genuine Buddha relic. The skeleton of a blue whale hangs in the natural history section — brought piece by piece from the Andamans.",
	"Howrah Station":    "One of the busiest railway stations in the world — over 1 million passengers daily. During Durga Puja, the number triples. The station has been continuously operational since 1854.",
	"Eden Gardens":      "The oldest cricket ground in India, opened 1864. The pitch soil is replaced every year — the old soil is sold to fans as a relic. A live well beneath the ground keeps the pitch moist even in summer.",
	"Kalighat":          "The Kali temple here is so ancient its founding date is unknown. The idol's tongue is made of gold. Tantric practitioners still perform rituals here at 3 AM that date back 1,200 years.",
	"Marble Palace":     "Built in 1835 by a zamindar who imported 90 types of Italian marble. It contains original Rubens and Reynolds paintings. The family still lives here — you can visit, but you must be formally invited.",
	"Princep Ghat":      "Named after James Prinsep who decoded the Brahmi script. The ghat was the social heart of colonial Calcutta. The river lanterns released here on Kali Puja night drift all the way to the Bay of Bengal.",
}

func nearestLocation(loc string) (string, float64, float64) {
	locLower := strings.ToLower(loc)

	for name, coords := range heritageLocations {
		if strings.Contains(locLower, strings.ToLower(name)) {
			return name, coords[0], coords[1]
		}
	}

	aliases := map[string]string{
		"victoria":       "Victoria Memorial",
		"howrah bridge":  "Howrah Bridge",
		"rabindra":       "Jorasanko",
		"tagore":         "Jorasanko",
		"jorasanko":      "Jorasanko",
		"kali":           "Kalighat",
		"kalighat":       "Kalighat",
		"dakshineswar":   "Dakshineswar",
		"belur":          "Belur Math",
		"indian museum":  "Indian Museum",
		"coffee house":   "College Street",
		"book market":    "College Street",
		"boi para":       "College Street",
		"tram":           "Maidan Tram Depot",
		"maidan":         "Maidan",
		"eden":           "Eden Gardens",
		"cricket":        "Eden Gardens",
		"howrah station": "Howrah Station",
		"sealdah":        "Sealdah Station",
		"fort william":   "Fort William",
		"st paul":        "St. Paul's Cathedral",
		"paul's":         "St. Paul's Cathedral",
		"marble palace":  "Marble Palace",
		"princep":        "Princep Ghat",
		"mullick":        "Mullick Ghat",
		"flower market":  "Mullick Ghat",
		"nakhoda":        "Nakhoda Mosque",
		"mosque":         "Nakhoda Mosque",
		"armenian":       "Armenian Church",
		"new market":     "New Market",
		"hogg market":    "New Market",
		"shaheed minar":  "Shaheed Minar",
		"ochterlony":     "Shaheed Minar",
		"writers":        "Writers Building",
		"high court":     "High Court",
		"gpo":            "GPO Kolkata",
	}

	for keyword, locationName := range aliases {
		if strings.Contains(locLower, keyword) {
			if coords, ok := heritageLocations[locationName]; ok {
				return locationName, coords[0], coords[1]
			}
		}
	}

	return "Esplanade", 22.5657, 88.3511
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

// ─── Reverse Image Search Handler ────────────────────────────────────────────

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

	systemPrompt := `You are an expert on Kolkata's cultural heritage, architecture, streets, and history.

Analyze this image carefully. Identify the specific Kolkata landmark, street, neighbourhood, or cultural site shown.
Look for: architectural style, signage (Bengali or English), distinctive structures, vegetation, vehicles, crowd types, lighting conditions, river presence, bridge shapes, dome profiles, spire patterns.

Respond ONLY with a JSON object in this exact format (no markdown code blocks, no extra text):
{
  "item_name": "Exact name of the location or landmark",
  "location": "Specific area, Kolkata, India",
  "historical_significance": "2 sentences explaining why this place matters in Kolkata's history and culture.",
  "confidence_score": 0.92,
  "lat": 22.5448,
  "lng": 88.3426
}

Rules:
- item_name must be specific (e.g. "Victoria Memorial" not "a large building")
- lat/lng must be accurate coordinates for that location in Kolkata
- If you cannot identify a specific location, use your best judgment based on visual clues
- confidence_score between 0.1 and 1.0`

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 400, Temperature: 0.1,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No response from model"})
		return
	}
	rawJSON := strings.TrimSpace(chatResp.Choices[0].Message.Content)
	rawJSON = strings.TrimPrefix(rawJSON, "```json")
	rawJSON = strings.TrimPrefix(rawJSON, "```")
	rawJSON = strings.TrimSuffix(rawJSON, "```")
	rawJSON = strings.TrimSpace(rawJSON)

	var idResult IdentifyResult
	if err := json.Unmarshal([]byte(rawJSON), &idResult); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"location":         "Kolkata",
			"lat":              22.5726,
			"lng":              88.3639,
			"exact_item":       "Kolkata Heritage Location",
			"real_location":    "Kolkata, India",
			"significance":     "A beautiful corner of the City of Joy.",
			"confidence":       0.5,
			"nearest_heritage": "Esplanade",
		})
		return
	}

	lat := idResult.Lat
	lng := idResult.Lng
	nearestName, fallbackLat, fallbackLng := nearestLocation(idResult.ItemName + " " + idResult.Location)

	if lat < 22.4 || lat > 22.8 || lng < 88.2 || lng > 88.5 {
		lat = fallbackLat
		lng = fallbackLng
	}

	c.JSON(http.StatusOK, gin.H{
		"location":         nearestName,
		"lat":              lat,
		"lng":              lng,
		"exact_item":       idResult.ItemName,
		"real_location":    idResult.Location,
		"significance":     idResult.HistoricalSignificance,
		"confidence":       idResult.ConfidenceScore,
		"nearest_heritage": nearestName,
	})
}

// ─── Heritage Guide Handler (Dadu) ───────────────────────────────────────────

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
	if secret == "" {
		secret = fmt.Sprintf("A fascinating location in Kolkata with deep historical roots and stories waiting to be told.")
	}
	question := body.Question
	if question == "" {
		question = "Tell me about this place and its hidden secrets."
	}

	systemPrompt := fmt.Sprintf(`You are Dadu — an 80-year-old Kolkata man who has spent his entire life in this city.
You were born in a para near %s, and you know every gali, every ghost story, every scandal, every hidden gem.

Your personality:
- Warm, witty, slightly dramatic storyteller with a sharp memory
- You mix Bengali words naturally into English: "arre", "ki bolbo tumi", "shundor", "dekho", "bhai", "eta ki", "mone achhe"
- You always start with a vivid personal memory from your own life at this location
- You reveal 2-3 secrets or lesser-known facts that even locals don't know
- You end with one very specific practical tip for visitors
- You speak with affection and mild nostalgia, never like a textbook

Location you are currently describing: %s
Known facts and secrets about this place: %s

Important rules:
- Stay under 200 words
- Sound like a real person telling a real story, not an AI
- Use Bengali phrases naturally, not forced
- Be specific — mention real years, real names, real details
- Never say "As an AI" or anything meta`, body.Location, body.Location, secret)

	req := ChatRequest{
		Model: "gpt-4o", MaxTokens: 400, Temperature: 0.92,
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
	c.JSON(http.StatusOK, gin.H{
		"guide":    chatResp.Choices[0].Message.Content,
		"location": body.Location,
	})
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

	chunks := splitContent(result.Content, 2800)
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
	if os.Getenv("GITHUB_TOKEN") == "" {
		fmt.Println("WARNING: GITHUB_TOKEN not set")
	}
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
