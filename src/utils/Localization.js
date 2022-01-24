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
        "cz": "Jeden hráč",
        "jr": "Lon'ly Adventure"
    },
    {
        "textId": "mainmenu_multiplayer",
        "us": "Multiplayer",
        "nl": "Meerdere Spelers"
    },
    {
        "textId": "mainmenu_creategame",
        "us": "Create Game",
        "nl": "Maak Game"
    },
    {
        "textId": "mainmenu_changelevel",
        "us": "Change",
        "nl": "Verander"
    },
    {
        "textId": "mainmenu_selectlevel",
        "us": "Select Level",
        "nl": "Selecteer Level",
        "de": " "
    },
    {
        "textId": "mainmenu_players",
        "us": "Players",
        "nl": "Spelers"
    },
    {
        "textId": "mainmenu_ready",
        "us": "Ready",
        "nl": "Gereed"
    },
    {
        "textId": "mainmenu_start",
        "us": "Start",
        "nl": "Start"
    },
    {
        "textId": "mainmenu_admin",
        "us": "Admin",
        "nl": "Admin"
    },
    {
        "textId": "mainmenu_connecting",
        "us": "Connecting",
        "nl": "Verbinden"
    },
    {
        "textId": "mainmenu_waiting",
        "us": "Waiting",
        "nl": "Wachten"
    },
    {
        "textId": "mainmenu_kick",
        "us": "Kick"
    },
    {
        "textId": "mainmenu_leave",
        "us": "Leave",
        "nl": "Verlaat"
    },
    {
        "textId": "mainmenu_quickplay",
        "us": "Quick Play",
        "nl": "Snel Spelen"
    },
    {
        "textId": "mainmenu_createlevels",
        "us": "Create levels!",
        "nl": "Creëer levels!",
        "de": "Level erstellen!",
        "cz": "Vytvoř level!"
    },
    {
        "textId": "mainmenu_signup",
        "us": "Sign Up!",
        "nl": "Inschrijven!",
        "de": "Registrieren!",
        "cz": "Zaregistrovat se!"
    },
    {
        "textId": "mainmenu_characters",
        "us": "Characters",
        "nl": "Karakters",
        "de": "Charaktere",
        "cz": "Postavy"
    },
    {
        "textId": "mainmenu_onlyfeatured",
        "us": "Only Featured",
        "nl": "Alleen Aanbevolen",
        "de": "Nur Empfohlene",
        "cz": "Pouze doporučené"
    },
    {
        "textId": "mainmenu_sorted",
        "us": "Sorted By:",
        "nl": "Gesorteerd Op:",
        "de": "Sortiert nach:",
        "cz": "Seřazeno podle"
    },
    {
        "textId": "mainmenu_filters",
        "us": "Filters",
        "nl": "Filters",
        "de": "Filter",
        "cz": "Filtr"
    },
    {
        "textId": "mainmenu_allvehicles",
        "us": "All Vehicles",
        "nl": "Alle Voertuigen",
        "de": "Alle Fahrzeuge",
        "cz": "Všechna vozidla"
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
        "us": "Cookies",
        "nl": "Cookies",
        "de": "Cookies",
        "cz": "Cookies",
        "jr": "Cookies"
    },
    {
        "textId": "settings_credits",
        "us": "Credits",
        "nl": "Credits",
        "de": "Beiträge",
        "cz": "Autoři",
        "jr": "Crewmates"
    },
    {
        "textId": "settings_installedmod",
        "us": "Mod active",
        "nl": "Mod actief",
        "de": "Aktive Mod",
        "cz": "Aktivní mod",
        "jr": "New Seas?"
    },
    {
        "textId": "settings_installmod",
        "us": "Modify",
        "nl": "Modificeer",
        "de": "Modifizieren",
        "cz": "Modifikovat"
    },
    {
        "textId": "settings_none",
        "us": "None",
        "nl": "Geen",
        "de": "Keine",
        "cz": "Žádný",
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
        "cz": "Oblíbené",
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
        "nl": "Selecteer"
    },
    {
        "textId": "userpage_levelspublished",
        "us": "Levels Published",
        "nl": "Levels Gepubliceerd",
        "de": "Level veröffentlicht",
        "cz": "Zveřejněné levely",
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
        "cz": "Doporučené levely",
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
        "cz": "Levely",
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
        "cz": "Přidej se!"
    },
    {
        "textId": "discord_content",
        "us": "Meet level creators, chat with fellow Jolly players, drop suggestions for the game, report bugs, share your creations or learn new tips on how to beat certain levels. This is also the place where new big updates will be announced first!",
        "nl": "Ontmoet level ontwikkelaars, praat met andere Jolly spelers, drop suggesties for het spel, rapporteer bugs, deel jou creaties of leer nieuwe trucs om levels makkelijker te verslaan. Dit is ook de plek waar nieuwe grote updates als eerst worden aangekondigd!",
        "de": "Treffe Level Autoren, chatte mit anderen Spielern, melde Bugs, teile deine Kreationen oder lerne Tips um bestimmte Level zu bestehen. Neue Updates werden hier zuerst angekündigt!",
        "cz": "Seznamte se s tvůrci levelů, chatujte s ostatními hráči, zanechte nám své návrhy na hru, hlaste chyby, sdílejte své výtvory nebo se naučte nové triky, jak pokořit určité úrovně. O nových aktualizacích se zde dozvíte jako první!"
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
        "textId": "levelgui_exittomenu",
        "us": "Exit to Menu",
        "nl": "Naar hoofdmenu",
        "de": "Zum Menü",
        "es": "Salir Al Menu",
        "pt": "Sair para o menu",
        "cz": "Zpět do menu",
        "fr": "Quitter vers le menu",
        "it": "Esci dal menu",
        "jr": "Walk the plank"
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
        "cz": "Přeskočit"
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
    }
]
init();
