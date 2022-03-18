import { Settings } from "../Settings";

const languageDataBase = {};

const init = ()=>{
	parseLocalization();
}
const parseLocalization = ()=>{
	LOCALIZATION_DATA.forEach(data => {
		const id = data.textId;
		const keys = Object.keys(data);
		keys.forEach( language => {
			if(language != 'textId'){
				if(!languageDataBase[id]) languageDataBase[id] = {};
				languageDataBase[id][language] = data[language];
			}
		})
	})
}

export const localize = id =>{
	let text = '?';
	if(languageDataBase[id]){
		text = languageDataBase[id][Settings.currentCountry];
		if(!text) text = languageDataBase[id]['us']
	}
	return text;
}

export const countries = ['de','nl','us','pt','fr','es','it','cz','jr'];

const LOCALIZATION_DATA = [
    {
        "textId": "mainmenu_singleplayer",
        "us": "Single Player",
        "nl": "Een Speler",
        "de": "Einzelspieler",
        "es": "Un solo jugador",
        "pt": "Único jogador",
        "cz": "Jeden hráč",
        "fr": "Joueur unique",
        "it": "Giocatore singolo",
        "jr": "Lon'ly Adventure"
    },
    {
        "textId": "mainmenu_multiplayer",
        "us": "Multiplayer",
        "nl": "Meerdere Spelers",
        "de": "Multiplayer.",
        "es": "Multijugador",
        "pt": "Multiplayer.",
        "cz": "Multiplayer.",
        "fr": "Multijoueur",
        "it": "Multiplayer"
    },
    {
        "textId": "mainmenu_creategame",
        "us": "Create Game",
        "nl": "Maak Game",
        "de": "Spiel erstellen",
        "es": "Crear juego",
        "pt": "Criar jogo",
        "cz": "Vytvořit hru",
        "fr": "Créer un jeu",
        "it": "Crea game."
    },
    {
        "textId": "mainmenu_changelevel",
        "us": "Change",
        "nl": "Verander",
        "de": "Ändern",
        "es": "Cambiar",
        "pt": "Mudar",
        "cz": "Změna",
        "fr": "Changement",
        "it": "Modificare"
    },
    {
        "textId": "mainmenu_selectlevel",
        "us": "Select Level",
        "nl": "Selecteer Level",
        "de": "Stufe auswählen",
        "es": "Selecciona el nivel",
        "pt": "Selecione o nível",
        "cz": "Vyberte úroveň",
        "fr": "Choisir le niveau",
        "it": "Seleziona livello"
    },
    {
        "textId": "mainmenu_players",
        "us": "Players",
        "nl": "Spelers",
        "de": "Spieler",
        "es": "Jugadores",
        "pt": "Jogadoras",
        "cz": "Hráči",
        "fr": "Joueurs",
        "it": "Giocatori"
    },
    {
        "textId": "mainmenu_nolevel",
        "us": "Admin is selecting level",
        "nl": "Admin is level aan het uitzoeken",
        "de": "Administrator sucht Level",
        "es": "El administrador es seleccionando nivel",
        "pt": "Admin está selecionando nível",
        "cz": "Admin je výběr úrovně",
        "fr": "Admin est la sélection de niveau",
        "it": "L'amministratore sta selezionando il livello"
    },
    {
        "textId": "mainmenu_ready",
        "us": "Ready",
        "nl": "Gereed",
        "de": "Bereit",
        "es": "Listo",
        "pt": "Preparar",
        "cz": "Připravený",
        "fr": "Prêt",
        "it": "Pronto"
    },
    {
        "textId": "mainmenu_start",
        "us": "Start",
        "nl": "Start",
        "de": "Start",
        "es": "Comienzo",
        "pt": "Começar",
        "cz": "Start",
        "fr": "Démarrer",
        "it": "Cominciare"
    },
    {
        "textId": "mainmenu_admin",
        "us": "Admin",
        "nl": "Admin",
        "de": "Administrator",
        "es": "Administración",
        "pt": "Admin.",
        "cz": "Admin",
        "fr": "Admin",
        "it": "Amministratore"
    },
    {
        "textId": "mainmenu_connecting",
        "us": "Connecting",
        "nl": "Verbinden",
        "de": "Anschluss",
        "es": "Conexión",
        "pt": "Conectando",
        "cz": "Spojovací",
        "fr": "De liaison",
        "it": "Collegamento"
    },
    {
        "textId": "mainmenu_waiting",
        "us": "Waiting",
        "nl": "Wachten",
        "de": "Warten",
        "es": "Esperando",
        "pt": "Espera",
        "cz": "Čekání",
        "fr": "Attendre",
        "it": "In attesa"
    },
    {
        "textId": "mainmenu_kick",
        "us": "Kick",
        "nl": "Trap",
        "de": "Trete",
        "es": "Patear",
        "pt": "Chute",
        "cz": "Kop",
        "fr": "Donner un coup",
        "it": "Calcio"
    },
    {
        "textId": "mainmenu_leave",
        "us": "Leave",
        "nl": "Verlaat",
        "de": "Verlassen",
        "es": "Salir",
        "pt": "Sair",
        "cz": "Odejít",
        "fr": "Quitter",
        "it": "Lasciare"
    },
    {
        "textId": "mainmenu_quickplay",
        "us": "Quick Play",
        "nl": "Snel Spelen",
        "de": "Schnelles Spiel",
        "es": "Juego rápido",
        "pt": "Jogo rápido",
        "cz": "Rychlá hra",
        "fr": "Jeu rapide",
        "it": "Partita veloce"
    },
    {
        "textId": "mainmenu_createlevels",
        "us": "Create levels!",
        "nl": "Creëer levels!",
        "de": "Level erstellen!",
        "es": "¡Crea niveles!",
        "pt": "Criar níveis!",
        "cz": "Vytvoř level!",
        "fr": "Créer des niveaux!",
        "it": "Crea livelli!"
    },
    {
        "textId": "mainmenu_signup",
        "us": "Sign Up!",
        "nl": "Inschrijven!",
        "de": "Registrieren!",
        "es": "¡Inscribirse!",
        "pt": "Inscrever-se!",
        "cz": "Zaregistrovat se!",
        "fr": "S'inscrire!",
        "it": "Iscrizione!"
    },
    {
        "textId": "mainmenu_characters",
        "us": "Characters",
        "nl": "Karakters",
        "de": "Charaktere",
        "es": "Caracteres",
        "pt": "Personagens",
        "cz": "Postavy",
        "fr": "Personnages",
        "it": "Personaggi"
    },
    {
        "textId": "mainmenu_onlyfeatured",
        "us": "Only Featured",
        "nl": "Alleen Aanbevolen",
        "de": "Nur Empfohlene",
        "es": "Solo destacado",
        "pt": "Apenas destaque",
        "cz": "Pouze doporučené",
        "fr": "Seulement présenté",
        "it": "Solo in primo piano"
    },
    {
        "textId": "mainmenu_sorted",
        "us": "Sorted By:",
        "nl": "Gesorteerd Op:",
        "de": "Sortiert nach:",
        "es": "Ordenado por:",
        "pt": "Classificado por:",
        "cz": "Seřazeno podle",
        "fr": "Trié par:",
        "it": "Ordinato per:"
    },
    {
        "textId": "mainmenu_filters",
        "us": "Filters",
        "nl": "Filters",
        "de": "Filter",
        "es": "Filtros",
        "pt": "Filtros",
        "cz": "Filtr",
        "fr": "Filtres",
        "it": "Filtri"
    },
    {
        "textId": "mainmenu_allvehicles",
        "us": "All Vehicles",
        "nl": "Alle Voertuigen",
        "de": "Alle Fahrzeuge",
        "es": "Todos los vehiculos",
        "pt": "Todos os veículos",
        "cz": "Všechna vozidla",
        "fr": "Tous les véhicules",
        "it": "Tutti i veicoli"
    },
    {
        "textId": "mainmenu_best_rated",
        "us": "Best Rated",
        "nl": "Best Beoordeeld",
        "de": "Beste Bewertung",
        "es": "Mejor Puntuado",
        "pt": "Melhor avaliado",
        "cz": "Nejlépe hodnocené",
        "fr": "Mieux noté",
        "it": "I più votati",
        "jr": "Most Bootyful"
    },
    {
        "textId": "mainmenu_most_played",
        "us": "Most Played",
        "nl": "Meest Gespeeld",
        "de": "Meistgespielt",
        "es": "Mas Jugado",
        "pt": "Mais Jogadas",
        "cz": "Nejhranější ",
        "fr": "Les plus joués",
        "it": "Più giocato",
        "jr": "Most Plundered"
    },
    {
        "textId": "mainmenu_newest",
        "us": "Newest",
        "nl": "Nieuwste",
        "de": "Neuste",
        "es": "Mas Nuevo",
        "pt": "Mais novo",
        "cz": "Nejnovější",
        "fr": "Plus récents",
        "it": "Più nuovo",
        "jr": "Newly Discovered"
    },
    {
        "textId": "mainmenu_oldest",
        "us": "Oldest",
        "nl": "Oudste",
        "de": "Älteste",
        "es": "Mas Viejo",
        "pt": "Mais velho",
        "cz": "Nejstarší",
        "fr": "Plus anciens",
        "it": "Più vecchio",
        "jr": "Ol' sea legends"
    },
    {
        "textId": "mainmenu_editor",
        "us": "Editor",
        "nl": "Editor",
        "de": "Editor",
        "es": "Editor",
        "pt": "Editor",
        "cz": "Editor",
        "fr": "Éditeur",
        "it": "Editor",
        "jr": "Sea Buildin'"
    },
    {
        "textId": "mainmenu_by",
        "us": "By",
        "nl": "Door",
        "de": "Von",
        "es": "De",
        "pt": "De",
        "cz": "Od",
        "fr": "Paramètres",
        "it": "Da",
        "jr": "Aye"
    },
    {
        "textId": "mainmenu_login",
        "us": "login",
        "nl": "inloggen",
        "de": "einloggen",
        "es": "Entrar",
        "pt": "Entrar",
        "cz": "Přihlásit se",
        "fr": "Se connecter",
        "it": "Entra",
        "jr": "Set Sail"
    },
    {
        "textId": "mainmenu_today",
        "us": "Today",
        "nl": "Vandaag",
        "de": "Heute",
        "es": "Hoy",
        "pt": "Hoje",
        "cz": "Dnes",
        "fr": "Aujourd'hui",
        "it": "Oggi",
        "jr": "Since this day"
    },
    {
        "textId": "mainmenu_thisweek",
        "us": "This Week",
        "nl": "Deze Week",
        "de": "Diese Woche",
        "es": "Esta Semana",
        "pt": "Esta semana",
        "cz": "Tento týden",
        "fr": "Cette semaine",
        "it": "Questa settimana",
        "jr": "Since 7 nights ago"
    },
    {
        "textId": "mainmenu_thismonth",
        "us": "This Month",
        "nl": "Deze Maand",
        "de": "Diesen Monat",
        "es": "Este Mes",
        "pt": "Este mês",
        "cz": "Tento měsíc",
        "fr": "Ce mois",
        "it": "Questo mese",
        "jr": "Since 1 moon ago"
    },
    {
        "textId": "mainmenu_anytime",
        "us": "All Time",
        "nl": "Altijd",
        "de": "Jederzeit",
        "es": "Siempre",
        "pt": "Sempre",
        "cz": "Kdykoli",
        "fr": "N'importe quand",
        "it": "Per sempre",
        "jr": "Since forever!"
    },
    {
        "textId": "mainmenu_more",
        "us": "More",
        "nl": "Meer",
        "de": "Mehr",
        "es": "Mas",
        "pt": "Mais",
        "cz": "Více",
        "fr": "Plus",
        "it": "Di più",
        "jr": "Moarrgh"
    },
    {
        "textId": "mainmenu_availablepc",
        "us": "Available on PC",
        "nl": "Beschikbaar op PC",
        "de": "Auf PC Verfügbar",
        "es": "Disponible en PC",
        "pt": "Disponível no PC",
        "cz": "K dispozici na PC",
        "fr": "Disponible sur PC",
        "it": "Disponibile su PC",
        "jr": "Available on Pirate Crew"
    },
    {
        "textId": "settings_settings",
        "us": "Settings",
        "nl": "Instellingen",
        "de": "Einstellungen",
        "es": "Ajustes",
        "pt": "Definições",
        "cz": "Nastavení",
        "fr": "Paramètres",
        "it": "Impostazioni",
        "jr": "Mess with yer boat"
    },
    {
        "textId": "settings_on",
        "us": "on",
        "nl": "aan",
        "de": "ein",
        "es": "Encendido ",
        "pt": "Ligado",
        "cz": "Zapnout",
        "fr": "Activé",
        "it": "Attivato",
        "jr": "Aye"
    },
    {
        "textId": "settings_off",
        "us": "off",
        "nl": "uit",
        "de": "aus",
        "es": "Apagado",
        "pt": "Desligado",
        "cz": "Vypnout",
        "fr": "Désactivé",
        "it": "Spento",
        "jr": "Nay"
    },
    {
        "textId": "settings_music",
        "us": "Music",
        "nl": "Muziek",
        "de": "Musik",
        "es": "Música",
        "pt": "Música",
        "cz": "Hudba",
        "fr": "Musique",
        "it": "Musica",
        "jr": "Shanties"
    },
    {
        "textId": "settings_blood",
        "us": "Blood",
        "nl": "Bloed",
        "de": "Blut",
        "es": "Sangre",
        "pt": "Sangue",
        "cz": "Krev",
        "fr": "Sang",
        "it": "Sangue",
        "jr": "Juice"
    },
    {
        "textId": "settings_gore",
        "us": "Gore",
        "nl": "Wonden",
        "de": "Zwickel",
        "es": "Cornear",
        "pt": "Escornar",
        "cz": "Úrazy",
        "fr": "Gore",
        "it": "Incornare",
        "jr": "Meat"
    },
    {
        "textId": "settings_fullscreen",
        "us": "Fullscreen",
        "nl": "Volledig scherm",
        "de": "Vollbild",
        "es": "Pantalla completa",
        "pt": "Tela completa",
        "cz": "Celá obrazovka",
        "fr": "Plein écran",
        "it": "Schermo intero",
        "jr": "Take of yer eyepatch"
    },
    {
        "textId": "settings_consent",
        "us": "Cookies"
    },
    {
        "textId": "settings_credits",
        "us": "Credits",
        "nl": "Credits",
        "de": "Beiträge",
        "es": "Créditos",
        "pt": "Créditos",
        "cz": "Autoři",
        "fr": "Crédits",
        "it": "Crediti",
        "jr": "Crewmates"
    },
    {
        "textId": "settings_installedmod",
        "us": "Mod active",
        "nl": "Mod actief",
        "de": "Aktive Mod",
        "es": "MOD activo",
        "pt": "Mod ativo.",
        "cz": "Aktivní mod",
        "fr": "Mod actif",
        "it": "Mod Active.",
        "jr": "New Seas?"
    },
    {
        "textId": "settings_installmod",
        "us": "Modify",
        "nl": "Modificeer",
        "de": "Modifizieren",
        "es": "Modificar",
        "pt": "Modificar",
        "cz": "Modifikovat",
        "fr": "Modifier",
        "it": "Modificare"
    },
    {
        "textId": "settings_none",
        "us": "None",
        "nl": "Geen",
        "de": "Keine",
        "es": "Ninguna",
        "pt": "Nenhum",
        "cz": "Žádný",
        "fr": "Aucun",
        "it": "Nessuno",
        "jr": "Nay"
    },
    {
        "textId": "characterselect_select_character",
        "us": "Select a character",
        "nl": "Kies een character",
        "de": "Wähle einen Charakter",
        "es": "Seleccionar Personaje",
        "pt": "Selecione o personagem",
        "cz": "Vybrat postavu",
        "fr": "Sélectionnez un personnage",
        "it": "Seleziona personaggio",
        "jr": "Pick yer captain"
    },
    {
        "textId": "vehicleselect_select_vehicle",
        "us": "Select a vehicle",
        "nl": "Kies een voertuig",
        "de": "Wähle ein Fahrzeug",
        "es": "Elige un vehículo",
        "pt": "Selecione o veículo",
        "cz": "Vybrat vozidlo",
        "fr": "Sélectionner un véhicule",
        "it": "Scegli un veicolo",
        "jr": "Pick yer boat"
    },
    {
        "textId": "levelbanner_share",
        "us": "Share",
        "nl": "Delen",
        "de": "Teilen",
        "es": "Compartir",
        "pt": "Compartilhar",
        "cz": "Sdílet",
        "fr": "Partager",
        "it": "Condividere",
        "jr": "Share with yer maties"
    },
    {
        "textId": "levelbanner_favorite",
        "us": "Favorite",
        "nl": "Favoriet",
        "de": "Favorit",
        "es": "Favorito",
        "pt": "Favorito",
        "cz": "Oblíbené",
        "fr": "Favori",
        "it": "Preferito",
        "jr": "Treasure"
    },
    {
        "textId": "levelbanner_gameplays",
        "us": "Gameplays",
        "nl": "Gespeeld",
        "de": "Gespielt",
        "es": "Jugadas",
        "pt": "Jogadas",
        "cz": "Hry",
        "fr": "Joué",
        "it": "Gioca",
        "jr": "Voyages"
    },
    {
        "textId": "levelbanner_votes",
        "us": "Votes",
        "nl": "Stemmen",
        "de": "Bewertungen",
        "es": "Votos",
        "pt": "Votos",
        "cz": "Hlasování",
        "fr": "Votes",
        "it": "Voti",
        "jr": "Ayes"
    },
    {
        "textId": "levelbanner_viewall",
        "us": "View All",
        "nl": "Zie Alles",
        "de": "Alle Ansehen",
        "es": "Ver Todos",
        "pt": "Ver todos",
        "cz": "Zobrazit vše",
        "fr": "Voir tous",
        "it": "Vedi tutto",
        "jr": "All landlubbers"
    },
    {
        "textId": "levelbanner_play",
        "us": "Play",
        "nl": "Spelen",
        "de": "Spielen",
        "es": "Jugar",
        "pt": "Jogar",
        "cz": "Hrát",
        "fr": "Jouer",
        "it": "Giocare",
        "jr": "Start the raid!"
    },
    {
        "textId": "levelbanner_back",
        "us": "Back",
        "nl": "Terug",
        "de": "Zurück",
        "es": "Regresar",
        "pt": "Voltar",
        "cz": "Zpět",
        "fr": "Fermer",
        "it": "Ritornare",
        "jr": "Avast!"
    },
    {
        "textId": "levelbanner_leaderboard",
        "us": "Leaderboard",
        "nl": "Scorebord",
        "de": "Bestenliste",
        "es": "Posiciones",
        "pt": "Posições",
        "cz": "Žebříček",
        "fr": "Meilleurs scores",
        "it": "Posizioni",
        "jr": "Most Wanted Pirates"
    },
    {
        "textId": "levelbanner_loading",
        "us": "Loading...",
        "nl": "Laden...",
        "de": "Laden...",
        "es": "Cargando",
        "pt": "Carregar",
        "cz": "Načítání",
        "fr": "Chargement",
        "it": "Ricarica",
        "jr": "Sailin' to the destination"
    },
    {
        "textId": "levelbanner_time",
        "us": "Time",
        "nl": "Tijd",
        "de": "Zeit",
        "es": "Tiempo",
        "pt": "Tempo",
        "cz": "Čas",
        "fr": "Temps",
        "it": "Tempo",
        "jr": "Knots"
    },
    {
        "textId": "levelbanner_published",
        "us": "Published",
        "nl": "Gepubliceerd",
        "de": "Veröffentlicht",
        "es": "Publicado",
        "pt": "Publicados",
        "cz": "Zveřejněno",
        "fr": "Publié",
        "it": "Pubblicato",
        "jr": "Discovered"
    },
    {
        "textId": "levelbanner_updated",
        "us": "Updated",
        "nl": "Geupdate",
        "de": "Aktualisiert",
        "es": "Actualizado",
        "pt": "Atualizada",
        "cz": "Aktualizováno",
        "fr": "Mise à jour",
        "it": "Aggiornato",
        "jr": "Revisited"
    },
    {
        "textId": "levelbanner_noentries",
        "us": "No entries",
        "nl": "Geen scores",
        "de": "Keine Einträge",
        "es": "No Hay Entradas",
        "pt": "Vazio",
        "cz": "Žádné záznamy",
        "fr": "Aucun score",
        "it": "Non c'è nulla",
        "jr": "Treasure unclaimed"
    },
    {
        "textId": "levelbanner_select",
        "us": "Select",
        "nl": "Selecteer",
        "de": "Auswählen",
        "es": "Seleccione",
        "pt": "Selecione.",
        "cz": "Vybrat",
        "fr": "Sélectionner",
        "it": "Selezionare"
    },
    {
        "textId": "userpage_levelspublished",
        "us": "Levels Published",
        "nl": "Levels Gepubliceerd",
        "de": "Level veröffentlicht",
        "es": "Niveles publicados",
        "pt": "Níveis publicados",
        "cz": "Zveřejněné levely",
        "fr": "Niveaux publiés",
        "it": "Livelli pubblicati",
        "jr": "Islands Mapped"
    },
    {
        "textId": "userpage_averagerating",
        "us": "Average Rating",
        "nl": "Gemiddelde beoordeling",
        "de": "Durchschnittliche Bewertung",
        "es": "Puntuacion Average",
        "pt": "Pontuação média",
        "cz": "Průměrné hodnocení",
        "fr": "Score moyen",
        "it": "Punteggio medio"
    },
    {
        "textId": "userpage_levelsfeatured",
        "us": "Levels Featured",
        "nl": "Levels Aanbevolen",
        "de": "Empfohlene Level",
        "es": "Niveles destacados",
        "pt": "Níveis apresentados",
        "cz": "Doporučené levely",
        "fr": "Niveaux en vedette",
        "it": "Livelli in evidenza",
        "jr": "Scurvy Approved Islands"
    },
    {
        "textId": "userpage_totalgameplays",
        "us": "Total Gameplays",
        "nl": "Totaal gespeeld",
        "de": "Gesamte Spieleranzahl",
        "es": "Total de jugadas",
        "pt": "Total De Jogadas",
        "cz": "Hráno celkem",
        "fr": "Total des jeux",
        "it": "Riproduzioni totali",
        "jr": "Total Voyages"
    },
    {
        "textId": "userpage_levels",
        "us": "Levels",
        "nl": "Levels",
        "de": "Levels",
        "es": "Niveles",
        "pt": "Níveis",
        "cz": "Levely",
        "fr": "Niveaux",
        "it": "Livelli",
        "jr": "Islands"
    },
    {
        "textId": "userpage_favorites",
        "us": "Favorites",
        "nl": "Favorieten",
        "de": "Favoriten",
        "es": "Favoritos",
        "pt": "Favoritos",
        "cz": "Oblíbené",
        "fr": "Favoris",
        "it": "Preferiti",
        "jr": "Treasured"
    },
    {
        "textId": "userpage_membersince",
        "us": "Member since",
        "nl": "Lid sinds",
        "de": "Spieler seit",
        "es": "Miembro desde",
        "pt": "Membro desde",
        "cz": "Členem od",
        "fr": "Membre depuis",
        "it": "Membro da",
        "jr": "Set sea on"
    },
    {
        "textId": "share_sharing",
        "us": "Sharing",
        "nl": "Delen",
        "de": "Teilen",
        "es": "Compartir",
        "pt": "Compartilhar",
        "cz": "Sdílení",
        "fr": "Partager",
        "it": "Condividere",
        "jr": "Share with yer mates."
    },
    {
        "textId": "share_levellink",
        "us": "Level link",
        "nl": "Level link",
        "de": "Level link",
        "es": "Enlace",
        "pt": "Link",
        "cz": "Odkaz",
        "fr": "Relier",
        "it": "Link",
        "jr": "Island coordinates"
    },
    {
        "textId": "share_shareby",
        "us": "Or share by",
        "nl": "Of deel met",
        "de": "Oder teilen mit",
        "es": "Compartido por",
        "pt": "Compartilhado por",
        "cz": "Nebo sdílet s",
        "fr": "Partagé par",
        "it": "Condiviso da",
        "jr": "Alternate routes"
    },
    {
        "textId": "discord_getinvolved",
        "us": "Get Involved!",
        "nl": "Doe Mee!",
        "de": "Mach mit!",
        "es": "¡Involucrarse!",
        "pt": "Se envolver!",
        "cz": "Přidej se!",
        "fr": "Être impliqué!",
        "it": "Mettersi in gioco!"
    },
    {
        "textId": "discord_content",
        "us": "Meet level creators, chat with fellow Jolly players, drop suggestions for the game, report bugs, share your creations or learn new tips on how to beat certain levels. This is also the place where new big updates will be announced first!",
        "nl": "Ontmoet level ontwikkelaars, praat met andere Jolly spelers, drop suggesties for het spel, rapporteer bugs, deel jou creaties of leer nieuwe trucs om levels makkelijker te verslaan. Dit is ook de plek waar nieuwe grote updates als eerst worden aangekondigd!",
        "de": "Treffe Level Autoren, chatte mit anderen Spielern, melde Bugs, teile deine Kreationen oder lerne Tips um bestimmte Level zu bestehen. Neue Updates werden hier zuerst angekündigt!",
        "es": "Conozca a los creadores de nivel, chatea con los compañeros jugadores de Jolly, sugerencias de caída para el juego, reportar errores, compartir sus creaciones o aprender nuevos consejos sobre cómo superar ciertos niveles. ¡Este es también el lugar donde se anunciarán las nuevas actualizaciones grandes!",
        "pt": "Conheça os criadores de nível, converse com colegas jogadores alegres, drop sugestões para o jogo, relatam erros, compartilhe suas criações ou aprenda novas dicas sobre como vencer certos níveis. Este é também o lugar onde novas grandes atualizações serão anunciadas primeiro!",
        "cz": "Seznamte se s tvůrci levelů, chatujte s ostatními hráči, zanechte nám své návrhy na hru, hlaste chyby, sdílejte své výtvory nebo se naučte nové triky, jak pokořit určité úrovně. O nových aktualizacích se zde dozvíte jako první!",
        "fr": "Rencontrez des créateurs de niveau, discutez avec des joueurs de Jolly, des suggestions de goutte pour le jeu, des bogues de rapport, partagez vos créations ou apprenez de nouveaux conseils sur la manière de battre certains niveaux. C'est aussi l'endroit où de nouvelles mises à jour seront annoncées en premier!",
        "it": "Incontra i creatori di livello, chattare con compagni jolly giocatori, drop suggerimenti per il gioco, segnalare bugs, condividere le tue creazioni o apprendono nuovi suggerimenti su come battere determinati livelli. Questo è anche il luogo in cui saranno annunciati nuovi nuovi aggiornamenti!"
    },
    {
        "textId": "levelgui_pause",
        "us": "Pause",
        "nl": "Pauze",
        "de": "Pause",
        "es": "Pausar",
        "pt": "Pausar",
        "cz": "Pauza",
        "fr": "Pause",
        "it": "Pausa",
        "jr": "Stop the ship"
    },
    {
        "textId": "levelgui_resume",
        "us": "Resume",
        "nl": "Hervat",
        "de": "Zurück",
        "es": "Resumir",
        "pt": "Continuar",
        "cz": "Pokračovat",
        "fr": "Continuer",
        "it": "Ricapitolare",
        "jr": "Continue fightin'"
    },
    {
        "textId": "levelgui_reset",
        "us": "Reset",
        "nl": "Reset",
        "de": "Zurücksetzen",
        "es": "Resetear",
        "pt": "Resetar",
        "cz": "Restartovat",
        "fr": "Reset",
        "it": "Resettare",
        "jr": "Start the raid all over"
    },
    {
        "textId": "levelgui_retry",
        "us": "Retry",
        "nl": "Opnieuw",
        "de": "Neustart",
        "es": "Intentar De Nuevo",
        "pt": "Tentar novamente",
        "cz": "Opakovat",
        "fr": "Recommencer",
        "it": "Riprova",
        "jr": "Pick up where ye last left off"
    },
    {
        "textId": "levelgui_exittest",
        "us": "Exit Test",
        "nl": "Sluit Test",
        "de": "Test Verlassen",
        "es": "Salir Del Test",
        "pt": "Sar do teste",
        "cz": "Opustit test",
        "fr": "Quitter le test",
        "it": "Esci dal test",
        "jr": "Swim back to shore"
    },
    {
        "textId": "levelgui_youlose",
        "us": "You lose!",
        "nl": "Verliezer!",
        "de": "Du hast verloren!",
        "es": "Perdiste",
        "pt": "Você perdeu!",
        "cz": "Prohrál jsi",
        "fr": "Tu as perdu !",
        "it": "Hai perso",
        "jr": "Yer with Davy Jones!"
    },
    {
        "textId": "levelgui_youwin",
        "us": "You win!",
        "nl": "Winnaar!",
        "de": "Du hast gewonnen!",
        "es": "Ganaste",
        "pt": "Você ganhou!",
        "cz": "Vyhrál jsi",
        "fr": "Tu as gagné !",
        "it": "Ha vinto",
        "jr": "Ye found the treasure!"
    },
    {
        "textId": "tutorial_skip_button",
        "us": "Skip",
        "nl": "Overslaan",
        "de": "Überspringen",
        "es": "Saltar",
        "pt": "Pular",
        "cz": "Přeskočit",
        "fr": "Sauter",
        "it": "Saltare"
    },
    {
        "textId": "editorheader_exit",
        "us": "Exit",
        "nl": "Verlaat",
        "de": "Verlassen",
        "es": "Salir",
        "pt": "Sair",
        "cz": "Odejít",
        "fr": "Quitter",
        "it": "Partire",
        "jr": "Abandon"
    },
    {
        "textId": "editorheader_logout",
        "us": "LOGOUT",
        "nl": "UITLOGGEN",
        "de": "AUSLOGGEN",
        "es": "Salir",
        "pt": "Deslogar",
        "cz": "Odhlásit se",
        "fr": "Se déconnecter",
        "it": "Partire",
        "jr": "DROP ANCHOR"
    },
    {
        "textId": "multiplayer_vote",
        "us": "Vote",
        "nl": "Stem",
        "de": "Abstimmung",
        "es": "Votar",
        "pt": "Voto",
        "cz": "Hlasování",
        "fr": "Voter",
        "it": "Votazione"
    },
    {
        "textId": "multiplayer_replay",
        "us": "Replay",
        "nl": "Opnieuw",
        "de": "Wiederholung",
        "es": "Repetición",
        "pt": "Replay",
        "cz": "Přehrát",
        "fr": "Rejouer",
        "it": "Rigiocare"
    },
    {
        "textId": "multiplayer_gamefinished_client",
        "us": "Game finished, vote for next level",
        "nl": "Game beëindigd, stem voor het volgende level",
        "de": "Spiel fertig, stimme für Next Level",
        "es": "Juego terminado, vote por el siguiente nivel.",
        "pt": "Jogo terminado, voto para o próximo nível",
        "cz": "Hra dokončena, hlasujte pro další úroveň",
        "fr": "Jeu fini, vote pour le niveau suivant",
        "it": "Gioco finito, vota per il livello successivo"
    },
    {
        "textId": "multiplayer_gamefinished_admin",
        "us": "Game finished, pick the next level",
        "nl": "Game beëindigd, kies het volgende level",
        "de": "Spiel fertig, wählen Sie die nächste Ebene",
        "es": "Juego terminado, elige el siguiente nivel.",
        "pt": "Jogo terminou, escolha o próximo nível",
        "cz": "Hra hotová, vyberte další úroveň",
        "fr": "Jeu fini, choisissez le niveau suivant",
        "it": "Gioco finito, scegli il livello successivo"
    },
    {
        "textId": "multiplayer_gameendssoon",
        "us": "Players finished, game is ending soon..",
        "nl": "Spelers zijn gefinished, game zal snel eindigen..",
        "de": "Spieler fertig, das Spiel endet bald ..",
        "es": "Los jugadores terminaron, el juego está terminando pronto ..",
        "pt": "Jogadores terminados, o jogo está terminando em breve ..",
        "cz": "Hráči skončili, hra skončí brzy.",
        "fr": "Les joueurs ont terminé, le jeu se termine bientôt ..",
        "it": "I giocatori hanno finito, il gioco sta finendo presto .."
    },
    {
        "textId": "multiplayer_countdown",
        "us": "Game ends in %%s",
        "nl": "Game eindigt in %%s",
        "de": "Spiel endet in %% s",
        "es": "El juego termina en %% s",
        "pt": "Jogo termina em %% s",
        "cz": "Hra končí v %% s",
        "fr": "Le jeu se termine en %% s",
        "it": "Il gioco finisce in %% s"
    },
    {
        "textId": "multiplayer_switchcamera",
        "us": "Switch Camera",
        "nl": "Wissel Camera",
        "de": "Schalter Kamera",
        "es": "Cambiar de cámara",
        "pt": "Comutam a câmera",
        "cz": "Přepněte fotoaparát",
        "fr": "Caméra",
        "it": "Cambio macchina fotografica"
    },
    {
        "textId": "multiplayer_waitingforothers",
        "us": "Waiting for other players to finish",
        "nl": "Wachten tot andere spelers klaar zijn",
        "de": "Warten auf andere Spieler, um fertig zu werden",
        "es": "Esperando a que otros jugadores terminen.",
        "pt": "Esperando por outros jogadores terminar",
        "cz": "Čekám na další hráče",
        "fr": "En attendant que d'autres joueurs finissent",
        "it": "Aspettando che altri giocatori finiscano"
    },
    {
        "textId": "multiplayer_startingin",
        "us": "Starting in %%..",
        "nl": "Beginnend in %% ..",
        "de": "Beginnend in %% ..",
        "es": "A partir de %% ..",
        "pt": "Começando em %% ..",
        "cz": "Začíná v %% ..",
        "fr": "À partir de %% ..",
        "it": "A partire da %% .."
    },
    {
        "textId": "multiplayer_voted",
        "us": "Voted",
        "nl": "Gestemd",
        "de": "Gewählt",
        "es": "Votado",
        "pt": "Votado",
        "cz": "Hlasovaný",
        "fr": "Voté",
        "it": "Votato"
    },
    {
        "textId": "multiplayer_go",
        "us": "GO!!!",
        "nl": "GAAN!!!",
        "de": "GEHEN!!!",
        "es": "¡¡¡IR!!!",
        "pt": "IR!!!",
        "cz": "JÍT!!!",
        "fr": "VA!!!",
        "it": "ANDARE!!!"
    },
    {
        "textId": "multiplayer_waitingplayers",
        "us": "Waiting for other players %% / **",
        "nl": "Op andere spelers wachten %% / **",
        "de": "Warten auf andere Spieler %% / **",
        "es": "Esperando a otros jugadores %% / **",
        "pt": "Esperando por outros jogadores %% / **",
        "cz": "Čekání na ostatní hráče %% / **",
        "fr": "En attente d'autres joueurs %% / **",
        "it": "Aspettando altri giocatori %% / **"
    },
    {
        "textId": "multiplayer_returntolobby",
        "us": "Return to Lobby",
        "nl": "Keer terug naar de lobby",
        "de": "Rückkehr zur Lobby",
        "es": "Volver al lobby",
        "pt": "Volte para o lobby",
        "cz": "Návrat do lobby.",
        "fr": "Retourner dans le hall",
        "it": "Torna alla lobby."
    },
    {
        "textId": "multiplayer_tochat",
        "us": "To chat click here or press 'Enter' key",
        "nl": "Voor chatten klik hier of druk 'Enter' toets"
    },
    {
        "textId": "multiplayer_invitelink",
        "us": "Invite link",
        "nl": "Uitnodigings link",
        "de": "Einladungslink.",
        "es": "Enlace de invitación",
        "pt": "Link de convite",
        "cz": "Pozvánka",
        "fr": "Lien d'invitation",
        "it": "Link di invito"
    },
    {
        "textId": "multiplayer_copied",
        "us": "copied",
        "nl": "gekopieerd",
        "de": "kopiert",
        "es": "copiado",
        "pt": "copiado",
        "cz": "zkopírovaný",
        "fr": "copié",
        "it": "copiato"
    }
]
init();
