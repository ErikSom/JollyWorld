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

export const countries = ['de','nl','gb','us','br','pt','fr','au','es','it','ca','ie','be', 'cz','jr'];


export const countryToFlag = country => {
    switch(country){
        case 'de': return '🇩🇪'
        case 'nl': return '🇳🇱'
        case 'uk': return '🇩🇬'
        case 'us': return '🇺🇸'
        case 'br': return '🇧🇷'
        case 'pt': return '🇵🇹'
        case 'fr': return '🇫🇷'
        case 'au': return '🇦🇺'
        case 'es': return '🇪🇸'
        case 'it': return '🇮🇹'
        case 'ca': return '🇨🇦'
        case 'ie': return '🇮🇪'
        case 'be': return '🇧🇪'
    }
}
export const countryToLanguage = country => {
    let language = country
    if(['uk', 'ca', 'us', 'ie'].includes(country)) language = 'en';
    if(['br'].includes(country)) language = 'pt';
    if(['be'].includes(country)) language = 'nl';
}

const LOCALIZATION_DATA = [
    {
        "textId": "mainmenu_featured",
        "us": "Featured",
        "nl": "Aanbevolen",
        "de": "Empfohlen",
        "es": "Recomendado",
        "pt": "Recomendado",
        "cz": "Doporučené",
        "fr": "En vedette",
        "it": "Raccomandato",
        "jr": "Scurvy Approved"
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
        "nl": "Gespeeld",
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
        "textId": "mainmenu_change",
        "us": "Change",
        "nl": "Verander",
        "de": "Ändern",
        "es": "Cambiar",
        "pt": "Mudar",
        "cz": "Změnit",
        "fr": "Changer",
        "it": "Modificare",
        "jr": "Pick a new captain"
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
        "us": "Anytime",
        "nl": "Alles",
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
        "cz": "Klín",
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
        "nl": "Favoriet"
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
        "textId": "userpage_levelspublished",
        "us": "Levels Published",
        "nl": "Levels Gepubliceerd"
    },
    {
        "textId": "userpage_averagerating",
        "us": "Average Rating",
        "nl": "Gemiddelde beoordeling",
        "es": "Puntuacion Average",
        "pt": "Pontuação média",
        "fr": "Score moyen",
        "it": "Punteggio medio"
    },
    {
        "textId": "userpage_levelsfeatured",
        "us": "levels Featured",
        "nl": "Levels Aanbevolen"
    },
    {
        "textId": "userpage_totalgameplays",
        "us": "Total Gameplays",
        "nl": "Totaal gespeeld",
        "es": "Total de jugadas",
        "pt": "Total De Jogadas",
        "fr": "Total des jeux",
        "it": "Riproduzioni totali"
    },
    {
        "textId": "userpage_levels",
        "us": "Levels",
        "nl": "Levels"
    },
    {
        "textId": "userpage_favorites",
        "us": "Favorites",
        "nl": "Favorieten",
        "es": "Favoritos",
        "pt": "Favoritos",
        "fr": "Favoris",
        "it": "Preferiti"
    },
    {
        "textId": "userpage_membersince",
        "us": "Member since",
        "nl": "Lid sinds",
        "es": "Miembro desde",
        "pt": "Membro desde",
        "fr": "Membre depuis",
        "it": "Membro da"
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
        "textId": "editortoolgui_select",
        "us": "select",
        "de": "auswählen",
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
        "de": "formen",
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
        "de": "polygon",
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
        "de": "stift",
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
        "de": "bindungen",
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
        "de": "fertigbauten",
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
        "de": "text",
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
        "de": "grafiken",
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
        "de": "auslöser",
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
        "us": "EXIT",
        "de": "VERLASSEN",
        "es": "Salir",
        "pt": "Sair",
        "cz": "Odejít",
        "fr": "Quitter",
        "it": "Partire",
        "jr": "ABANDON SHIP"
    },
    {
        "textId": "editorlevelbanner_publishsettings",
        "us": "Publish Settings",
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
        "de": "Schaubild",
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
        "de": "bild einfügen",
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
        "de": "YouTube videos verknüpfen",
        "es": "Vincular videos de YouTube",
        "pt": "Colocar video do Youtube",
        "cz": "Připojit YouTube videa",
        "fr": "Lien vers les vidéos YouTube",
        "it": "Video di YouTube link",
        "jr": "Log videos o' YouTube"
    },
    {
        "textId": "editorlevelbanner_saveas",
        "us": "SAVE AS",
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
        "de": "Achtung",
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
        "de": "DOCH NICHT!",
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
        "de": "Der Titel muss mindenstens 3 Buchstaben lang sein",
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
        "de": "Dein Level braucht ein Schaubild, bevor du es veröffentlichen / anschauen kannst.",
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
