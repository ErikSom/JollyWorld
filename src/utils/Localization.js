const languageDataBase = {};
const currentLanguage = 'nl';

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
		text = languageDataBase[id][currentLanguage];
		if(!text) text = languageDataBase[id]['us']
	}
	return text;
}

const LOCALIZATION_DATA = [
    {
        "textId": "mainmenu_featured",
        "us": "Featured",
        "nl": "Aanbevolen",
        "de": "Empfohlen",
        "es": "Recomendado",
        "fr": "En vedette"
    },
    {
        "textId": "mainmenu_best_rated",
        "us": "Best Rated",
        "nl": "Best Beoordeeld",
        "de": "Beste Bewertung",
        "fr": "Mieux noté"
    },
    {
        "textId": "mainmenu_most_played",
        "us": "Most Played",
        "nl": "Gespeeld",
        "de": "Meistgespielt",
        "fr": "Le plus joué"
    },
    {
        "textId": "mainmenu_newest",
        "us": "Newest",
        "nl": "Nieuwste",
        "de": "Neuste"
    },
    {
        "textId": "mainmenu_oldest",
        "us": "Oldest",
        "nl": "Oudste",
        "de": "Älteste"
    },
    {
        "textId": "mainmenu_editor",
        "us": "Editor",
        "nl": "Editor",
        "de": "Editor"
    },
    {
        "textId": "mainmenu_change",
        "us": "Change",
        "nl": "Verander",
        "de": "Ändern"
    },
    {
        "textId": "mainmenu_by",
        "us": "by",
        "nl": "door",
        "de": "von",
        "es": "de"
    },
    {
        "textId": "mainmenu_login",
        "us": "login",
        "nl": "inloggen",
        "de": "einloggen"
    },
    {
        "textId": "mainmenu_today",
        "us": "Today",
        "nl": "Vandaag",
        "de": "Heute"
    },
    {
        "textId": "mainmenu_thisweek",
        "us": "This Week",
        "nl": "Deze Week",
        "de": "Diese Woche"
    },
    {
        "textId": "mainmenu_thismonth",
        "us": "This Month",
        "nl": "Deze Maand",
        "de": "Diesen Monat"
    },
    {
        "textId": "mainmenu_anytime",
        "us": "Anytime",
        "nl": "Alles",
        "de": "Jederzeit"
    },
    {
        "textId": "mainmenu_more",
        "us": "More",
        "nl": "Meer",
        "de": "Mehr"
    },
    {
        "textId": "mainmenu_viewall",
        "us": "View All",
        "nl": "Zie Alles",
        "de": "Alles Ansehen"
    },
    {
        "textId": "mainmenu_availablepc",
        "us": "Available on PC",
        "nl": "Beschikbaar op PC",
        "de": "Auf PC Verfügbar"
    },
    {
        "textId": "settings_settings",
        "us": "Settings",
        "nl": "Instellingen",
        "de": "Einstellungen",
        "es": "Ajustes"
    },
    {
        "textId": "settings_on",
        "us": "on",
        "nl": "aan",
        "de": "ein",
        "es": "encendido "
    },
    {
        "textId": "settings_off",
        "us": "off",
        "nl": "uit",
        "de": "aus",
        "es": "apagado"
    },
    {
        "textId": "settings_music",
        "us": "Music",
        "nl": "Muziek",
        "de": "Musik",
        "es": "Música"
    },
    {
        "textId": "settings_gore",
        "us": "Gore",
        "nl": "Bloed",
        "de": "Blut",
        "es": "Sangre"
    },
    {
        "textId": "settings_fullscreen",
        "us": "Fullscreen",
        "nl": "Volledig scherm",
        "de": "Vollbild",
        "es": "Pantalla completa"
    },
    {
        "textId": "characterselect_select_character",
        "us": "Select a character",
        "nl": "Kies een character",
        "de": "Charakterauswahl"
    },
    {
        "textId": "levelbanner_share",
        "us": "Share",
        "nl": "Delen",
        "de": "Teilen"
    },
    {
        "textId": "lavelbanner_save",
        "us": "Save",
        "nl": "Opslaan",
        "de": "Speichern"
    },
    {
        "textId": "lavelbanner_gameplays",
        "us": "Gameplays",
        "nl": "Gespeeld",
        "de": "Gespielt"
    },
    {
        "textId": "lavelbanner_votes",
        "us": "Votes",
        "nl": "Stemmen",
        "de": "Abstimmen"
    },
    {
        "textId": "lavelbanner_play",
        "us": "Play",
        "nl": "Spelen",
        "de": "Spielen"
    },
    {
        "textId": "levelbanner_back",
        "us": "Back",
        "nl": "Terug",
        "de": "Zurück"
    },
    {
        "textId": "lavelbanner_leaderboard",
        "us": "Leaderboard",
        "nl": "Scorebord",
        "de": "Bestenliste"
    },
    {
        "textId": "lavelbanner_time",
        "us": "Time",
        "nl": "Tijd",
        "de": "Zeit"
    },
    {
        "textId": "lavelbanner_published",
        "us": "Published",
        "nl": "Gepubliseerd",
        "de": "Veröffentlicht"
    },
    {
        "textId": "lavelbanner_updated",
        "us": "Updated",
        "nl": "Geupdate",
        "de": "Aktualisiert"
    },
    {
        "textId": "share_sharing",
        "us": "Sharing",
        "nl": "Delen"
    },
    {
        "textId": "share_levellink",
        "us": "Level link",
        "nl": "Level link"
    },
    {
        "textId": "share_shareby",
        "us": "Or share by",
        "nl": "Or deel met"
    }
]
init();
