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
        "textId": "editor_tutorial_text_1",
        "us": "Welcome to the tutorial level!",
        "nl": "Welkom bij het tutorial level!",
        "de": "Willkommen im Tutorial Level!",
        "cz": "Vítejte v tutoriálu!",
        "jr": "Welcome to Tutorial land, where ye get shot in ye 'ead"
    },
    {
        "textId": "editor_tutorial_tip_title_1",
        "us": "Create a floor base",
        "nl": "Maak eerst een vloer",
        "de": "Erstelle einen Boden Block",
        "cz": "Vytvořte podlahovou základnu",
        "jr": "Lay down a deck"
    },
    {
        "textId": "editor_tutorial_tip_body_1",
        "us": "To create a floor base \\nplatform for the character\\nto ride on, select the \\nGeometry tool and draw \\na rectangle under the \\ncharacter.",
        "nl": "Om een vloer te maken\\n voor ons karakter om op te rijden \\n selecteer je de Geometry tool en\\nteken je een vierkant onder het \\nkarakter.",
        "de": "Um eine Bodenplatform zu\\nerstellen, wähle das Geometriewerkzeug\\nund male ein Rechteck\\nunter dem Charakter.",
        "cz": "Chcete-li vytvořit podlahovou základnu\\nplatformu pro postavu na které se budete pohybovat, vyberte nástroj Geometrie a nakreslete pod postavu obdélník. ",
        "jr": "To lay down a deck, \\nfor yer maties \\nto walk on, grab some \\nbasic land and chart out \\na rectangle under their \\nfeet."
    },
    {
        "textId": "editor_tutorial_title_1",
        "us": "Drag",
        "nl": "Sleep",
        "de": "Ziehe die Maus",
        "cz": "Přetáhněte pomocí myši"
    },
    {
        "textId": "editor_tutorial_title_2",
        "us": "Zoom In & Zoom Out",
        "nl": "Zoem in & Zoem uit",
        "de": "Zoom rein & Zoom raus",
        "cz": "Přiblížení a oddálení",
        "jr": "Adjust ye periscope"
    },
    {
        "textId": "editor_tutorial_title_3",
        "us": "Move the triangle",
        "nl": "Verplaats de triangel",
        "de": "Bewege das Dreieck",
        "cz": "Posuňte trojúhelník"
    },
    {
        "textId": "editor_tutorial_title_4",
        "us": "Draw a square",
        "nl": "Teken een vierkant",
        "de": "Plaziere ein Rechteck",
        "cz": "Nakreslete čtverec",
        "jr": "Chart out a square"
    },
    {
        "textId": "editor_tutorial_title_5",
        "us": "Modify this square",
        "nl": "Pas dit vierkant aan",
        "de": "Bearbeite dieses Rechteck",
        "cz": "Upravte tento čtverec",
        "jr": "Tinker with the square"
    },
    {
        "textId": "editor_tutorial_title_6",
        "us": "Add Obstacles!",
        "nl": "Plaats obstakels!",
        "de": "Füge Hindernisse hinzu!",
        "cz": "Přidejte překážky!",
        "jr": "Set some booby traps"
    },
    {
        "textId": "editor_tutorial_title_7",
        "us": "Add Checkpoint",
        "nl": "Plaats een checkpoint",
        "de": "Checkpoint hinzufügen",
        "cz": "Přidejte kontrolní bod",
        "jr": "Build a lighthouse"
    },
    {
        "textId": "editor_tutorial_tip_title_2",
        "us": "Prefabs Settings",
        "nl": "Prefabs instellingen",
        "de": "Prefab Einstellungen",
        "cz": "Prefabs nastavení"
    },
    {
        "textId": "editor_tutorial_tip_body_2",
        "us": "Some elements, including prefabs have\\ndifferent settings that you can modify\\njust left click on them to open the\\nsettings box.\\nIf you want a prefab to not move from\\nwhere you placed it, then tick the\\nIs Fixed Box and it will stay in place.",
        "nl": "Sommige elementen, waaronder prefabs hebben\\n verschillende instellingen die je aan kan passen.\\n Klik met linker muis knop om de instellingen te zien.\\n Als je wilt dat een Prefab niet beweegt\\n dan kan je isFixed aanklikken,\\n dit zorgt er voor dat hij niet verplaatst.",
        "de": "Einige Elemente, zum Beispiel Prefabs, besitzen verschiedenste Einstellungen die bearbeitet werden können. Wähle dazu einfach das Objekt mit der linken Maustaste aus und öffne den Einstellungs-Reiter. Willst du das ein prefab statisch wird dann füge einen Haken bei isFixed hinzu. ",
        "cz": "Některé prvky, včetně prefabs, mají různá nastavení, která můžete upravit. Stačí na ně kliknout levým tlačítkem a otevřít okno nastavení. Chcete-li, aby se panel nepohnul z místa, kde jste jej umístili, zaškrtněte políčko \"pevná pozice\". ",
        "jr": "Some parts, includin' booby traps, have different things to tinker 'round with."
    },
    {
        "textId": "editor_tutorial_title_8",
        "us": "Non-Static Objects",
        "nl": "Niet-Static objecten",
        "de": "Nicht-statisches Objekt",
        "cz": "Nehybné objekty",
        "jr": "Ships that move."
    },
    {
        "textId": "editor_tutorial_title_9",
        "us": "Add The Finish Line",
        "nl": "Plaats de Finish",
        "de": "Füge eine Finish Line hinzu",
        "cz": "Přidejte cílovou čáru",
        "jr": "Raise the Jolly Roger"
    },
    {
        "textId": "editor_tutorial_title_10",
        "us": "Test & Publish!",
        "nl": "Test & Publiceer",
        "de": "Testen & Veröffentlichen!",
        "cz": "Vyzkoušejte a zveřejněte!"
    },
    {
        "textId": "editor_tutorial_text_2",
        "us": "Learn how to build a level in 10 easy steps!",
        "nl": "Leer om een level te bouwen in 10 simpele stappen!",
        "de": "Lerne in 10 einfachen Schritten ein Level zu bauen!",
        "cz": "Naučte se jak vytvořit level v 10 snadných krocích!"
    },
    {
        "textId": "editor_tutorial_text_4",
        "us": "Press on your Keyboard",
        "nl": "Druk op je Toetsenbord",
        "de": "Drücke auf der Tastatur",
        "cz": "Stiskněte na klávesnici"
    },
    {
        "textId": "editor_tutorial_text_6",
        "us": "Mouse Wheel",
        "nl": "Muis Wiel",
        "de": "Mausrad",
        "cz": "Kolečko myši",
        "jr": "Steerin' Wheel"
    },
    {
        "textId": "editor_tutorial_text_3",
        "us": "Press Space on your Keyboard and Hold Right click",
        "nl": "Druk Spatie op je Toetsenbord en houd rechter muis ingedrukt",
        "de": "Drücke die Spacebar und halte die rechte Maustaste gedrückt",
        "cz": "Stiskněte mezerník na klávesnici a podržte pravé tlačítko myši"
    },
    {
        "textId": "editor_tutorial_text_5",
        "us": "or",
        "nl": "of",
        "de": "oder",
        "cz": "nebo",
        "jr": "orr"
    },
    {
        "textId": "editor_tutorial_text_7",
        "us": "It's a good practice to add checkpoints \\nafter difficult obstacles",
        "nl": "Het is aanbevolen om checkpoints\\n toe te voegen naar moeilijke stukken",
        "de": "Es ist eine gute Angewohnheit Checkpoints \\n hinter schweren Hindernissen zu plazieren",
        "cz": "Je dobrý nápad přidávat kontrolní body po obtížných překážkách ",
        "jr": "Tis polite to build lighthouses after laying down some traps. Or not, Arrrgh!"
    },
    {
        "textId": "editor_tutorial_text_8",
        "us": "Press T on your Keyboard\\nto test the level",
        "nl": "Druk T op je toetsenbord om je level te testen",
        "de": "Drücke T auf der Tastatur \\n um dein Level zu testen",
        "cz": "Stiskněte T na klávesnici a otestujte svůj level",
        "jr": "Press T on ye keyboard\\nto set foot on yer land."
    },
    {
        "textId": "editor_tutorial_text_9",
        "us": "Press this button \\nat the top right",
        "nl": "Druk deze knop\\n die staat boven rechts",
        "de": "Drücke diesen Knopf \\n obenrechts",
        "cz": "Stiskněte toto tlačítko nahoře vpravo"
    },
    {
        "textId": "editor_tutorial_text_10",
        "us": "Fill up all the info, then Save or hit publish!\\nPS: Don't publish this tutorial please ;P",
        "nl": "Vul alle informatie in, klik dan Save of Publish!\\n P.S. please publiceer dit tutorial level niet ;P",
        "de": "Fülle alle Informationen aus. Im Anschluss kannst du das Level speichern oder veröffentlichen!\\n PS: Bitte dieses Tutorial nicht veröffentlichen ;P",
        "cz": "Vyplňte všechny informace a poté uložte, nebo stiskněte zveřejnit! PS: Nezveřejňujte prosím tento návod ;P ",
        "jr": "Read up on everything ye can, then put it on the map.\\nDon't claim this land as yer own!"
    },
    {
        "textId": "editortoolgui_select",
        "us": "select",
        "nl": "selecteer",
        "de": "Auswählen",
        "es": "Seleccionar",
        "pt": "selecionar",
        "cz": "Vybrat",
        "fr": "Sélectionner",
        "it": "Selezionare",
        "jr": "Move yer rocks"
    },
    {
        "textId": "editortoolgui_geometry",
        "us": "geometry",
        "nl": "vormen",
        "de": "Formen",
        "es": "Geometria",
        "pt": "Geometria",
        "cz": "Tvary",
        "fr": "Géometrie",
        "it": "Geometria",
        "jr": "Basic Land"
    },
    {
        "textId": "editortoolgui_polydrawing",
        "us": "polydrawing",
        "nl": "polygon",
        "de": "Polygon",
        "es": "Dibujar Poly",
        "pt": "Desenho poligonal",
        "cz": "Polygon",
        "fr": "Dessin polygonal",
        "it": "Disegna Poly",
        "jr": "Janky Quill"
    },
    {
        "textId": "editortoolgui_pen",
        "us": "pen",
        "nl": "pen",
        "de": "Stift",
        "es": "Lapiz",
        "pt": "Caneta",
        "cz": "Pero",
        "fr": "Stylo",
        "it": "Matita",
        "jr": "Smoothin' Quill"
    },
    {
        "textId": "editortoolgui_joints",
        "us": "joints",
        "nl": "verbindingen",
        "de": "Gelenk",
        "es": "Articulacion",
        "pt": "Juntas",
        "cz": "Spojení",
        "fr": "Joints",
        "it": "Comune",
        "jr": "Carpentry"
    },
    {
        "textId": "editortoolgui_prefabs",
        "us": "prefabs",
        "nl": "fabrikaten",
        "de": "Fertigbauten",
        "es": "Prefabricados",
        "pt": "Objetos prontos",
        "cz": "Předvytvořené",
        "fr": "Préfabs",
        "it": "Prefabbricato",
        "jr": "Treasures"
    },
    {
        "textId": "editortoolgui_text",
        "us": "text",
        "nl": "text",
        "de": "Text",
        "es": "Texto",
        "pt": "Texto",
        "cz": "Text",
        "fr": "Texte",
        "it": "Testo",
        "jr": "Parchment"
    },
    {
        "textId": "editortoolgui_art",
        "us": "art",
        "nl": "kunst",
        "de": "Grafiken",
        "es": "Arte",
        "pt": "Arte",
        "cz": "Malování",
        "fr": "Dessin",
        "it": "Arte",
        "jr": "ARRRRT"
    },
    {
        "textId": "editortoolgui_trigger",
        "us": "trigger",
        "nl": "trigger",
        "de": "Auslöser",
        "es": "Gatillo",
        "pt": "Acionador",
        "cz": "Spouštěč",
        "fr": "Déclencheur",
        "it": "Trigger",
        "jr": "Booby Traps"
    },
    {
        "textId": "editorheader_test",
        "us": "test",
        "nl": "test",
        "de": "test",
        "es": "Probar",
        "pt": "Teste",
        "cz": "Test",
        "fr": "Tester",
        "it": "Provare",
        "jr": "Set Foot"
    },
    {
        "textId": "editorheader_profilescreen",
        "us": "Profile Screen",
        "nl": "Profiel scherm",
        "de": "Profil Fenster",
        "es": "Menu de Perfil",
        "pt": "Foto de Perfil",
        "cz": "Obrazovka profilu",
        "fr": "Profile",
        "it": "Menu profilo",
        "jr": "Captain's Quarters"
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
        "textId": "editorheader_new",
        "us": "NEW",
        "nl": "NIEUW",
        "de": "NEU",
        "es": "Nuevo",
        "pt": "Novo",
        "cz": "Nový",
        "fr": "Nouveau",
        "it": "Nuovo",
        "jr": "NEW MAP"
    },
    {
        "textId": "editorheader_load",
        "us": "LOAD",
        "nl": "LAAD",
        "de": "LADEN",
        "es": "Cargar",
        "pt": "Carregar",
        "cz": "Načíst",
        "fr": "Charger",
        "it": "Caricare",
        "jr": "FIND MAP"
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
        "textId": "editorlevelbanner_publishsettings",
        "us": "Publish Settings",
        "nl": "Publiceer Instellingen",
        "de": "Veröffentlichungseinstellungen",
        "es": "Ajustes de publicacion",
        "pt": "Publicar informações",
        "cz": "Zveřejnit nastavení",
        "fr": "Paramètres de publication",
        "it": "Impostazioni post",
        "jr": "Island Settings"
    },
    {
        "textId": "editorlevelbanner_thumbnail",
        "us": "Thumbnail",
        "nl": "Afbeelding",
        "de": "Thumbnail",
        "es": "Imagen",
        "pt": "Miniatura",
        "cz": "Miniatura",
        "fr": "Miniature",
        "it": "Immagine",
        "jr": "Flag"
    },
    {
        "textId": "editorlevelbanner_clicktoadd",
        "us": "click to add",
        "nl": "click om t",
        "de": "Bild einfügen",
        "es": "Click para agregar",
        "pt": "Click para adicionar",
        "cz": "Klikněte pro vložení",
        "fr": "Cliquer pour ajouter",
        "it": "Fare clic per aggiungere",
        "jr": "Click to raise flag"
    },
    {
        "textId": "editorlevelbanner_title",
        "us": "Title",
        "nl": "Titel",
        "de": "Titel",
        "es": "Titulo",
        "pt": "Título",
        "cz": "Název",
        "fr": "Titre",
        "it": "Titolo",
        "jr": "Island Name"
    },
    {
        "textId": "editorlevelbanner_charactersleft",
        "us": "Characters left",
        "nl": "Letters over",
        "de": "Buchstaben übrig",
        "es": "Caracteres restantes",
        "pt": "Personagens restantes",
        "cz": "Zbývá znaků",
        "fr": "Personnages restants",
        "it": "Caratteri rimanenti",
        "jr": "Blots of ink left"
    },
    {
        "textId": "editorlevelbanner_description",
        "us": "Description",
        "nl": "Beschrijving",
        "de": "Beschreibung",
        "es": "Descripcion",
        "pt": "Descrição",
        "cz": "Popis",
        "fr": "Description",
        "it": "Descrizione",
        "jr": "Captain's Log"
    },
    {
        "textId": "editorlevelbanner_linkyoutubevideos",
        "us": "Link YouTube videos",
        "nl": "Voeg YouTube videos toe",
        "de": "YouTube Videos verknüpfen",
        "es": "Vincular videos de YouTube",
        "pt": "Colocar video do Youtube",
        "cz": "Připojit YouTube videa",
        "fr": "Lien vers les vidéos YouTube",
        "it": "Video di YouTube link",
        "jr": "Log videos o' YouTube"
    },
    {
        "textId": "editorlevelbanner_save",
        "us": "SAVE",
        "nl": "OPSLAAN",
        "de": "SPEICHERN",
        "cz": "Uložit",
        "jr": "BURY FOR NEXT TIME!"
    },
    {
        "textId": "editorlevelbanner_saveas",
        "us": "SAVE AS",
        "nl": "OPSLAAN ALS",
        "de": "SPEICHERN ALS",
        "es": "Salvar como",
        "pt": "Salvar como",
        "cz": "Uložit jako",
        "fr": "Sauvegarder en tant que",
        "it": "Salva come",
        "jr": "CHART NEW LAND"
    },
    {
        "textId": "editorlevelbanner_delete",
        "us": "DELETE",
        "nl": "VERWIJDER",
        "de": "LÖSCHEN",
        "es": "Borrar",
        "pt": "Deletar",
        "cz": "Smazat",
        "fr": "Supprimer",
        "it": "Cancellare",
        "jr": "DESTROY"
    },
    {
        "textId": "editorlevelbanner_preview",
        "us": "PREVIEW",
        "nl": "VOORBEELD",
        "de": "VORSCHAU",
        "es": "Anticipar",
        "pt": "Pré-visualizar",
        "cz": "Náhled",
        "fr": "Prévisualiser",
        "it": "Anticipare",
        "jr": "UNMARKED VISIT"
    },
    {
        "textId": "editorlevelbanner_publish",
        "us": "PUBLISH",
        "nl": "PUBLICEER",
        "de": "VERÖFFENTLICHEN",
        "es": "Publicar",
        "pt": "Publicar",
        "cz": "Zveřejnit",
        "fr": "Publier",
        "it": "Per pubblicare",
        "jr": "MARK THE SPOT"
    },
    {
        "textId": "editorlevelbanner_notice",
        "us": "Notice",
        "nl": "Melding",
        "de": "Mitteilung",
        "es": "Aviso",
        "pt": "Aviso",
        "cz": "Upozornění",
        "fr": "Remarquer",
        "it": "Avviso",
        "jr": "Ahoy there!"
    },
    {
        "textId": "editorlevelbanner_prompt",
        "us": "Prompt",
        "nl": "Keuze",
        "de": "Aufforderung",
        "es": "Puntual",
        "pt": "Console",
        "cz": "Výzva",
        "fr": "Alerte",
        "it": "Puntuale",
        "jr": "There be danger lying thee!"
    },
    {
        "textId": "editorlevelbanner_ok",
        "us": "OK",
        "nl": "OK",
        "de": "OK",
        "es": "OK",
        "pt": "OK!",
        "cz": "OK",
        "fr": "Ok",
        "it": "OK",
        "jr": "Aye!"
    },
    {
        "textId": "editorlevelbanner_yes",
        "us": "Yes!",
        "nl": "Ja!",
        "de": "Ja!",
        "es": "Si",
        "pt": "SIM!",
        "cz": "Ano!",
        "fr": "Oui !",
        "it": "Sì",
        "jr": "Aye aye!"
    },
    {
        "textId": "editorlevelbanner_nope",
        "us": "NOPE!",
        "nl": "NEE!",
        "de": "NÖ!",
        "es": "Nop",
        "pt": "NOPE!",
        "cz": "Ne!",
        "fr": "Nan !",
        "it": "Nop",
        "jr": "AVAST!"
    },
    {
        "textId": "editorlevelbanner_mintitlelength",
        "us": "Title must be at least 3 characters long",
        "de": "Der Titel muss mindestens drei Buchstaben lang sein",
        "es": "El titulo debe ser al menos 3 caracteres",
        "pt": "O Titulo precisa ter pelo menos 3 caracteres",
        "cz": "Název musí obsahovat nejméně 3 znaky",
        "fr": "Le titre doit faire au moins 3 caractères",
        "it": "Il titolo deve contenere almeno 3 caratteri",
        "jr": "Ye must call yer island with at least 3 letters"
    },
    {
        "textId": "editorlevelbanner_savefirst",
        "us": "You first need to save the level before you can publish / preview it.",
        "de": "Du musst dein Level speichern, bevor du es veröffentlichen / anschauen kannst.",
        "es": "Primero debes salvar tu nivel antes de publicarlo o hacer preview",
        "pt": "Você precisa salvar o mapa primeiro antes de publicar",
        "cz": "Nejdříve musíte level uložit než jej zveřejníte / zobrazíte náhled",
        "fr": "Tu dois sauvegarder le niveau avant de le publier / prévisualiser.",
        "it": "Devi prima salvare il tuo livello prima di pubblicarlo o visualizzarlo in anteprima.",
        "jr": "Ye need to mark the spot before ye put this island on the map."
    },
    {
        "textId": "editorlevelbanner_nothumbnail",
        "us": "Your level needs a thumbnail before you can publish / preview it.",
        "de": "Dein Level braucht ein Thumbnail, bevor du es veröffentlichen / anschauen kannst.",
        "es": "Tu nivel necesita una imagen antes de publicarlo o hacer preview",
        "pt": "Seu mapa precisa de uma thumbnail antes de ser publicado",
        "cz": "Váš level potřebuje miniaturu než jej zveřejníte / zobrazíte náhled",
        "fr": "Ton niveau a besoin d'une miniature avant d'être publié / prévisualisé.",
        "it": "Il tuo livello necessita di un'immagine prima di pubblicarla o visualizzarla in anteprima",
        "jr": "There be no flag on yer land. How your mates gonna know what to expect?"
    },
    {
        "textId": "editorlevelbanner_unsavedchanges",
        "us": "You have unsaved changes to your level, are you sure you wish to proceed?",
        "de": "Dein Level hat ungespeicherte Änderungen, möchtest du trotzdem fortfahren?",
        "es": "Tienes cambios sin salvar en tu nivel, estas seguro que quieres continuar?",
        "pt": "Você não salvou as modificações do seu mapa, tem certeza que quer prosseguir?",
        "cz": "Máte neuložené změny ve vašem levelu, jste si jisti, že chcete pokračovat?",
        "fr": "Ton niveau a des changements non sauvegardés, es-tu sûr de vouloir continuer ?",
        "it": "Hai modifiche non salvate nel tuo livello, sei sicuro di voler continuare?",
        "jr": "Ye didn't chart your location. Do ye still want to set sail?"
    },
    {
        "textId": "editorlevelbanner_deleteconfirm",
        "us": "Are you sure you want to delete this level?",
        "de": "Bist du sicher, dass du dieses Level löschen willst?",
        "es": "Estas seguro que quieres borrar este nivel?",
        "pt": "Você tem certeza que quer deletar o mapa?",
        "cz": "Jste si jisti, že chcete smazat tento level?",
        "fr": "Es-tu sûr de vouloir supprimer ce niveau ?",
        "it": "Sei sicuro di voler eliminare questo livello?",
        "jr": "Do ye want to send this level to Davy Jones's locker?"
    }
]
init();
