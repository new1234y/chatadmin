// Initialize Supabase client
const supabaseUrl = "https://oadwuacpouppdynssxrw.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hZHd1YWNwb3VwcGR5bnNzeHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NzMyMTEsImV4cCI6MjA1NjI0OTIxMX0.MF7Ijl8SHm7wzKt8XiD3EQVqikLaVqkhPAYkqiJHisA"
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey)

// DOM Elements
const settingsForm = document.getElementById("settings-form")
const playersTable = document.getElementById("players-table").querySelector("tbody")

// Load game settings
async function loadGameSettings() {
  const { data, error } = await supabase.from("game_settings").select("*").single()

  if (error) {
    console.error("Erreur lors du chargement des paramètres du jeu:", error)
    return
  }

  if (data) {
    document.getElementById("map-center-lat").value = data.map_center_lat
    document.getElementById("map-center-lng").value = data.map_center_lng
    document.getElementById("map-zoom-level").value = data.map_zoom_level
    document.getElementById("player-proximity-radius").value = data.player_proximity_radius
    document.getElementById("global-boundary-radius").value = data.global_boundary_radius
    document.getElementById("update-interval").value = data.update_interval
  }
}

// Save game settings
async function saveGameSettings(e) {
  e.preventDefault()

  const settings = {
    map_center_lat: Number.parseFloat(document.getElementById("map-center-lat").value),
    map_center_lng: Number.parseFloat(document.getElementById("map-center-lng").value),
    map_zoom_level: Number.parseInt(document.getElementById("map-zoom-level").value),
    player_proximity_radius: Number.parseFloat(document.getElementById("player-proximity-radius").value),
    global_boundary_radius: Number.parseFloat(document.getElementById("global-boundary-radius").value),
    update_interval: Number.parseInt(document.getElementById("update-interval").value),
  }

  const { data, error } = await supabase.from("game_settings").update(settings).eq("id", 1)

  if (error) {
    console.error("Erreur lors de la sauvegarde des paramètres:", error)
    alert("Erreur lors de la sauvegarde des paramètres. Veuillez réessayer.")
  } else {
    alert("Paramètres sauvegardés avec succès!")
  }
}

// Load players
async function loadPlayers() {
  const { data, error } = await supabase.from("player").select("*").order("score", { ascending: false })

  if (error) {
    console.error("Erreur lors du chargement des joueurs:", error)
    return
  }

  playersTable.innerHTML = ""
  data.forEach((player) => {
    const row = playersTable.insertRow()
    row.innerHTML = `
            <td data-label="Nom">${player.name}</td>
            <td data-label="Type">${player.type}</td>
            <td data-label="Score">${Math.round(player.score)}</td>
            <td data-label="Actions">
                <button class="action-btn" onclick="togglePlayerType('${player.id}', '${player.type}')">
                    ${player.type === "player" ? "Devenir chat" : "Devenir joueur"}
                </button>
                <button class="action-btn delete" onclick="deletePlayer('${player.id}')">Supprimer</button>
            </td>
        `
  })
}

// Toggle player type
async function togglePlayerType(playerId, currentType) {
  const newType = currentType === "player" ? "cat" : "player"
  const { error } = await supabase.from("player").update({ type: newType }).eq("id", playerId)

  if (error) {
    console.error("Erreur lors du changement de type du joueur:", error)
    alert("Erreur lors du changement de type du joueur. Veuillez réessayer.")
  } else {
    loadPlayers()
  }
}

// Delete player
async function deletePlayer(playerId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer ce joueur ?")) {
    const { error } = await supabase.from("player").delete().eq("id", playerId)

    if (error) {
      console.error("Erreur lors de la suppression du joueur:", error)
      alert("Erreur lors de la suppression du joueur. Veuillez réessayer.")
    } else {
      loadPlayers()
    }
  }
}

// Event listeners
settingsForm.addEventListener("submit", saveGameSettings)

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  loadGameSettings()
  loadPlayers()
})

// Set up real-time subscription for player updates
const playersSubscription = supabase
  .channel("player-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "player" }, (payload) => {
    console.log("Changement détecté:", payload)
    loadPlayers()
  })
  .subscribe()

// Function to check Supabase connection
async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("game_settings").select("count").limit(1)
    if (error) {
      console.error("Erreur de connexion Supabase:", error)
      return false
    }
    console.log("Connexion Supabase réussie")
    return true
  } catch (error) {
    console.error("Erreur lors de la vérification de la connexion Supabase:", error)
    return false
  }
}

// Check Supabase connection on page load
document.addEventListener("DOMContentLoaded", async () => {
  const isConnected = await checkSupabaseConnection()
  if (!isConnected) {
    alert("Erreur de connexion à la base de données. Veuillez rafraîchir la page et réessayer.")
  }
})

