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

export const countries = ['de','nl','gb','us','br','pt','fr','au','es','it','ca','ie','be'];


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
        "it": "Raccomandato"
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
        "it": "I più votati"
    },
    {
        "textId": "mainmenu_most_played",
        "us": "Most Played",
        "nl": "Gespeeld",
        "de": "Meistgespielt",
        "es": "Mas Jugado",
        "pt": "Mais Jogadas",
        "cz": "Nejhranější ",
        "fr": "Le plus joué",
        "it": "Più giocato"
    },
    {
        "textId": "mainmenu_newest",
        "us": "Newest",
        "nl": "Nieuwste",
        "de": "Neuste",
        "es": "Mas Nuevo",
        "pt": "Mais novo",
        "cz": "Nejnovější",
        "fr": "Plus nouveau",
        "it": "Più nuovo"
    },
    {
        "textId": "mainmenu_oldest",
        "us": "Oldest",
        "nl": "Oudste",
        "de": "Älteste",
        "es": "Mas Viejo",
        "pt": "Mais velho",
        "cz": "Nejstarší",
        "fr": "Plus vieux",
        "it": "Più vecchio"
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
        "it": "Editor"
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
        "it": "Modificare"
    },
    {
        "textId": "mainmenu_by",
        "us": "By",
        "nl": "Door",
        "de": "Von",
        "es": "De",
        "pt": "De",
        "cz": "Od",
        "fr": "De",
        "it": "Da"
    },
    {
        "textId": "mainmenu_login",
        "us": "login",
        "nl": "inloggen",
        "de": "einloggen",
        "es": "Entrar",
        "pt": "Entrar",
        "cz": "Přihlásit se",
        "fr": "Entrer",
        "it": "Entra"
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
        "it": "Oggi"
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
        "it": "Questa settimana"
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
        "it": "Questo mese"
    },
    {
        "textId": "mainmenu_anytime",
        "us": "Anytime",
        "nl": "Alles",
        "de": "Jederzeit",
        "es": "Siempre",
        "pt": "Sempre",
        "cz": "Kdykoli",
        "fr": "Toujours",
        "it": "Per sempre"
    },
    {
        "textId": "mainmenu_more",
        "us": "More",
        "nl": "Meer",
        "de": "Mehr",
        "es": "Mas",
        "pt": "Mais",
        "cz": "Více",
        "fr": "Suite",
        "it": "Di più"
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
        "it": "Disponibile su PC"
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
        "it": "Impostazioni"
    },
    {
        "textId": "settings_on",
        "us": "on",
        "nl": "aan",
        "de": "ein",
        "es": "Encendido ",
        "pt": "Ligado",
        "cz": "Zapnout",
        "fr": "Allumé",
        "it": "Attivato"
    },
    {
        "textId": "settings_off",
        "us": "off",
        "nl": "uit",
        "de": "aus",
        "es": "Apagado",
        "pt": "Desligado",
        "cz": "Vypnout",
        "fr": "éteint",
        "it": "Spento"
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
        "it": "Musica"
    },
    {
        "textId": "settings_gore",
        "us": "Gore",
        "nl": "Bloed",
        "de": "Blut",
        "es": "Sangre",
        "pt": "Sangue",
        "cz": "Krev",
        "fr": "Sang",
        "it": "Sangue"
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
        "it": "Schermo intero"
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
        "it": "Seleziona personaggio"
    },
    {
        "textId": "vehicleselect_select_vehicle",
        "us": "Select a vehicle",
        "nl": "Kies een voertuig",
        "de": "Wähle ein Fahrzeug",
        "pt": "Selecione o veículo",
        "cz": "Vybrat vozidlo"
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
        "it": "Condividere"
    },
    {
        "textId": "levelbanner_save",
        "us": "Save",
        "nl": "Opslaan",
        "de": "Speichern",
        "es": "Salvar",
        "pt": "Salvar",
        "cz": "Uložit",
        "fr": "Sauvegarder",
        "it": "Salva"
    },
    {
        "textId": "levelbanner_gameplays",
        "us": "Gameplays",
        "nl": "Gespeeld",
        "de": "Gespielt",
        "es": "Jugadas",
        "pt": "Jogadas",
        "cz": "Hry",
        "fr": "Pièces",
        "it": "Gioca"
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
        "it": "Voti"
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
        "it": "Vedi tutto"
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
        "it": "Giocare"
    },
    {
        "textId": "levelbanner_back",
        "us": "Back",
        "nl": "Terug",
        "de": "Zurück",
        "es": "Regresar",
        "pt": "Voltar",
        "cz": "Zpět",
        "fr": "Rendre",
        "it": "Ritornare"
    },
    {
        "textId": "levelbanner_leaderboard",
        "us": "Leaderboard",
        "nl": "Scorebord",
        "de": "Bestenliste",
        "es": "Posiciones",
        "pt": "Posições",
        "cz": "Žebříček",
        "fr": "Positions",
        "it": "Posizioni"
    },
    {
        "textId": "levelbanner_loading",
        "us": "Loading...",
        "nl": "Laden..",
        "pt": "Carregar",
        "cz": "Načítání"
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
        "it": "Tempo"
    },
    {
        "textId": "levelbanner_published",
        "us": "Published",
        "nl": "Gepubliseerd",
        "de": "Veröffentlicht",
        "es": "Publicado",
        "pt": "Publicados",
        "cz": "Zveřejněno",
        "fr": "Publié",
        "it": "Pubblicato"
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
        "it": "Aggiornato"
    },
    {
        "textId": "levelbanner_noentries",
        "us": "No entries",
        "nl": "Geen scores",
        "de": "Keine Einträge",
        "pt": "Vazio",
        "cz": "Žádné záznamy"
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
        "it": "Condividere"
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
        "it": "Link"
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
        "it": "Condiviso da"
    },
    {
        "textId": "levelgui_pause",
        "us": "Pause",
        "nl": "Pauze",
        "de": "Pause",
        "pt": "Pausar",
        "cz": "Pauza"
    },
    {
        "textId": "levelgui_exittomenu",
        "us": "Exit to Menu",
        "nl": "Naar hoofdmenu",
        "de": "Zum Menü",
        "pt": "Sair para o menu",
        "cz": "Zpět do menu"
    },
    {
        "textId": "levelgui_resume",
        "us": "Resume",
        "nl": "Hervat",
        "de": "Zurück",
        "pt": "Continuar",
        "cz": "Pokračovat"
    },
    {
        "textId": "levelgui_reset",
        "us": "Reset",
        "nl": "Reset"
    },
    {
        "textId": "levelgui_retry",
        "us": "Retry",
        "nl": "Opnieuw"
    },
    {
        "textId": "levelgui_exittest",
        "us": "Exit Test",
        "nl": "Sluit Test"
    },
    {
        "textId": "levelgui_youlose",
        "us": "You lose!",
        "nl": "Verliezer!",
        "de": "Du hast verloren!",
        "pt": "Você perdeu!",
        "cz": "Prohrál jsi"
    },
    {
        "textId": "levelgui_youwin",
        "us": "You win!",
        "nl": "Winnaar!",
        "de": "Du hast gewonnen!",
        "pt": "Você ganhou!",
        "cz": "Vyhrál jsi"
    },
    {
        "textId": "editortoolgui_select",
        "us": "select",
        "de": "auswählen",
        "pt": "selecionar",
        "cz": "Vybrat"
    },
    {
        "textId": "editortoolgui_geometry",
        "us": "geometry",
        "de": "formen",
        "pt": "Geometria",
        "cz": "Tvary"
    },
    {
        "textId": "editortoolgui_polydrawing",
        "us": "polydrawing",
        "de": "polygon",
        "pt": "Desenho poligonal",
        "cz": "Polygon"
    },
    {
        "textId": "editortoolgui_pen",
        "us": "pen",
        "de": "stift",
        "pt": "Caneta",
        "cz": "Pero"
    },
    {
        "textId": "editortoolgui_joints",
        "us": "joints",
        "de": "bindungen",
        "pt": "Juntas",
        "cz": "Spojení"
    },
    {
        "textId": "editortoolgui_prefabs",
        "us": "prefabs",
        "de": "fertigbauten",
        "pt": "Objetos prontos",
        "cz": "Předvytvořené"
    },
    {
        "textId": "editortoolgui_text",
        "us": "text",
        "de": "text",
        "pt": "Texto",
        "cz": "Text"
    },
    {
        "textId": "editortoolgui_art",
        "us": "art",
        "de": "grafiken",
        "pt": "Arte",
        "cz": "Malování"
    },
    {
        "textId": "editortoolgui_trigger",
        "us": "trigger",
        "de": "auslöser",
        "pt": "Acionador",
        "cz": "Spouštěč"
    },
    {
        "textId": "editorheader_test",
        "us": "test",
        "de": "test",
        "pt": "Teste",
        "cz": "Test"
    },
    {
        "textId": "editorheader_profilescreen",
        "us": "Profile Screen",
        "de": "Profil Fenster",
        "pt": "Foto de Perfil",
        "cz": "Obrazovka profilu"
    },
    {
        "textId": "editorheader_logout",
        "us": "LOGOUT",
        "de": "AUSLOGGEN",
        "pt": "Deslogar",
        "cz": "Odhlásit se"
    },
    {
        "textId": "editorheader_new",
        "us": "NEW",
        "de": "NEU",
        "pt": "Novo",
        "cz": "Nový"
    },
    {
        "textId": "editorheader_load",
        "us": "LOAD",
        "de": "LADEN",
        "pt": "Carregar",
        "cz": "Načíst"
    },
    {
        "textId": "editorheader_exit",
        "us": "EXIT",
        "de": "VERLASSEN",
        "pt": "Sair",
        "cz": "Odejít"
    },
    {
        "textId": "editorlevelbanner_publishsettings",
        "us": "Publish Settings",
        "de": "Veröffentlichungseinstellungen",
        "pt": "Publicar informações",
        "cz": "Zveřejnit nastavení"
    },
    {
        "textId": "editorlevelbanner_thumbnail",
        "us": "Thumbnail",
        "de": "Schaubild",
        "pt": "Miniatura",
        "cz": "Miniatura"
    },
    {
        "textId": "editorlevelbanner_clicktoadd",
        "us": "click to add",
        "de": "bild einfügen",
        "pt": "Click para adicionar",
        "cz": "Klikněte pro vložení"
    },
    {
        "textId": "editorlevelbanner_title",
        "us": "Title",
        "de": "Titel",
        "pt": "Título",
        "cz": "Název"
    },
    {
        "textId": "editorlevelbanner_charactersleft",
        "us": "Characters left",
        "de": "Buchstaben übrig",
        "pt": "Personagens restantes",
        "cz": "Zbývá znaků"
    },
    {
        "textId": "editorlevelbanner_description",
        "us": "Description",
        "de": "Beschreibung",
        "pt": "Descrição",
        "cz": "Popis"
    },
    {
        "textId": "editorlevelbanner_linkyoutubevideos",
        "us": "Link YouTube videos",
        "de": "YouTube videos verknüpfen",
        "pt": "Videos do Youtube",
        "cz": "Připojit YouTube videa"
    },
    {
        "textId": "editorlevelbanner_saveas",
        "us": "SAVE AS",
        "de": "SPEICHERN ALS",
        "pt": "Salvar como",
        "cz": "Uložit jako"
    },
    {
        "textId": "editorlevelbanner_delete",
        "us": "DELETE",
        "de": "LÖSCHEN",
        "pt": "Deletar",
        "cz": "Smazat"
    },
    {
        "textId": "editorlevelbanner_preview",
        "us": "PREVIEW",
        "de": "VORSCHAU",
        "pt": "Pré-visualizar",
        "cz": "Náhled"
    },
    {
        "textId": "editorlevelbanner_publish",
        "us": "PUBLISH",
        "de": "VERÖFFENTLICHEN",
        "pt": "Publicar",
        "cz": "Zveřejnit"
    },
    {
        "textId": "editorlevelbanner_notice",
        "us": "Notice",
        "de": "Achtung",
        "pt": "Aviso",
        "cz": "Upozornění"
    },
    {
        "textId": "editorlevelbanner_prompt",
        "us": "Prompt",
        "de": "Aufforderung",
        "pt": "Console",
        "cz": "Výzva"
    },
    {
        "textId": "editorlevelbanner_ok",
        "us": "OK",
        "de": "OK",
        "pt": "OK!",
        "cz": "OK"
    },
    {
        "textId": "editorlevelbanner_yes",
        "us": "Yes!",
        "de": "Ja!",
        "pt": "SIM!",
        "cz": "Ano!"
    },
    {
        "textId": "editorlevelbanner_nope",
        "us": "NOPE!",
        "de": "DOCH NICHT!",
        "pt": "NOPE!",
        "cz": "Ne!"
    },
    {
        "textId": "editorlevelbanner_mintitlelength",
        "us": "Title must be at least 3 characters long",
        "de": "Der Titel muss mindenstens 3 Buchstaben lang sein",
        "pt": "O Titulo precisa ter pelo menos 3 caracteres",
        "cz": "Název musí obsahovat nejméně 3 znaky"
    },
    {
        "textId": "editorlevelbanner_savefirst",
        "us": "You first need to save the level before you can publish / preview it.",
        "de": "Du musst dein Level speichern, bevor du es veröffentlichen / anschauen kannst.",
        "pt": "Você precisa salvar o mapa primeiro antes de publicar",
        "cz": "Nejdříve musíte level uložit než jej zveřejníte / zobrazíte náhled"
    },
    {
        "textId": "editorlevelbanner_nothumbnail",
        "us": "Your level needs a thumbnail before you can publish / preview it.",
        "de": "Dein Level braucht ein Schaubild, bevor du es veröffentlichen / anschauen kannst.",
        "pt": "Seu mapa precisa de uma thumbnail antes de ser publicado",
        "cz": "Váš level potřebuje miniaturu než jej zveřejníte / zobrazíte náhled"
    },
    {
        "textId": "editorlevelbanner_unsavedchanges",
        "us": "You have unsaved changes to your level, are you sure you wish to proceed?",
        "de": "Dein Level hat ungespeicherte Änderungen, möchtest du trotzdem fortfahren?",
        "pt": "Você não salvou as modificações do seu mapa, tem certeza que quer prosseguir?",
        "cz": "Máte neuložené změny ve vašem levelu, jste si jisti, že chcete pokračovat?"
    },
    {
        "textId": "editorlevelbanner_deleteconfirm",
        "us": "Are you sure you want to delete this level?",
        "de": "Bist du sicher, dass du dieses Level löschen willst?",
        "pt": "Você tem certeza que quer deletar o mapa?",
        "cz": "Jste si jisti, že chcete smazat tento level?"
    }
]
init();
