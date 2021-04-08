import '../css/MainMenu.scss'
import '../css/LevelBanner.scss'
import '../css/ScrollBar.scss'
import '../css/VehicleSelect.scss'
import '../css/CharacterSelect.scss'
import '../css/SocialShare.scss'
import '../css/LoginScreen.scss'
import '../css/PauseScreen.scss'


// https://github.com/catdad/canvas-confetti

import {
    backendManager
} from '../utils/BackendManager';
import * as BackendCache from '../utils/BackendCacheManager'

import {
    game
} from '../Game';
import * as dat from '../../libs/dat.gui';
import * as uiHelper from '../b2Editor/utils/uiHelper';
import * as format from '../b2Editor/utils/formatString';
import {
    Settings
} from '../Settings'
import {
    hashName
} from '../AssetList';
import * as MobileController from '../utils/MobileController';
import * as SaveManager from "../utils/SaveManager"
import { YouTubePlayer } from '../utils/YouTubePlayer';
import * as AudioManager from "../utils/AudioManager"
import * as TutorialManager from "../utils/TutorialManager"
import SimpleBar from 'simplebar'


let customGUIContainer = document.getElementById('game-ui-container');
let imageObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
    const thumb = entry.target.querySelector('.thumb');
    thumb.style.backgroundImage = `url(${thumb.getAttribute('data-src')})`;
    entry.target.classList.add('loaded')
    imageObserver.unobserve(entry.target);
    }
}));
let mainMenu;
let discordButton;
let gameOver;
let levelLoader;
let levelBanner;
let levelBannerYTFeed;
let youtubePlayer;
let characterSelect;
let vehicleSelect;
let pauseScreen;
let filterMenu;
let winScreen;
let winLogo;
let socialShareScreen;
let settingsMenu;
let loginScreen;
let smallLogo;

let filter = {
    featured: '',
    sort: '',
    range: ''
};

function UIManager() {

    var self = this;

    this.showMainMenuOld = function () {
        // const span = document.createElement('span');
        // span.setAttribute('id', 'versionNumber')
        // span.innerText = __VERSION__;
        // mainMenu.appendChild(span);
        // setTimeout(() => {
        //     span.style.opacity = 1
        // }, 1800);

        // discordButton = document.createElement('button');
        // discordButton.classList.add('menuButton', 'discordButton');
        // discordButton.style.backgroundImage = `url(./assets/images/misc/${hashName('discord.svg')})`;
        // discordButton.onclick = () => {
        //     window.open("https://discord.gg/7ZWxBam9Hx", "_blank");
        // }
        // customGUIContainer.appendChild(discordButton);
        this.showMainMenu();
    }

    this.showMainMenu = ()=>{
        if(!mainMenu){
            const htmlStructure = /*html*/`
                <div class="header">
                    <div class="logo"></div>
                    <div class="sun"></div>
                    <div class="clouds"></div>
                    <div class="clouds-alpha"></div>
                    <div class="grass1"></div>
                    <div class="grass2"></div>
                    <div class=bg-hider></div>
                    <div class="mobile-bg"></div>
                    <div class="hamburger"><span></span><span></span><span></span></div>
                    <div class="buttons">
                        <div class="discord">Login</div>
                        <div class="character-select">
                            <div class="text-change">Change</div>
                        </div>
                        <div class="editor">Editor</div>
                        <div class="volume"></div>
                        <div class="settings"></div>
                    </div>
                </div>
                <div class = "games-scroll">
                    <div class="games">
                        <div class="game-template game">
                            <div class="vehicle-label"></div>
                            <div class="thumb"></div>
                            <div class="footer">
                                <div class="text-holder">
                                    <div class="text-level-name">Level Name Goes Here</div>
                                    <div class="level-author">
                                        <div class="text-level-by">By:</div>
                                        <div class="text-author">Author Name</div>
                                    </div>
                                    <div class="tags">
                                    </div>
                                </div>
                                <div class="rating">
                                    <div class="vote-thumb"></div>
                                    <div class="text-rating">85%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="filters">
                    <div class="date-filter button checked">#</div>
                    <div class ='date-filters'>
                        <div class="today-filter button">Today</div>
                        <div class="week-filter button">This Week</div>
                        <div class="month-filter button">This Month</div>
                        <div class="anytime-filter button checked">Anytime</div>
                    </div>
                    <div class="featured-filter button checked">
                    <svg class="check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 58.7 50.4"><path d="M5.2 16.5c-2.8 0-4.2 1.4-4.2 4.2v24.5c0 2.8 1.4 4.2 4.2 4.2h24.4c2.8 0 4.2-1.4 4.2-4.2V20.7c0-2.8-1.4-4.3-4.2-4.2H5.2z" fill="#333"/><path d="M1 20.7v24.5c0 2.8 1.4 4.2 4.2 4.2h24.4c2.8 0 4.2-1.4 4.2-4.2V20.7c0-2.8-1.4-4.3-4.2-4.2H5.2c-2.8 0-4.2 1.4-4.2 4.2z" fill="none" stroke="#66cd32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><g><path d="M58.1 1.6c-.2-.1-.5-.1-.7-.1C41.7 6.9 29 16.2 19.5 29.4l-4.6-6.8-.3-.3c-.2-.1-.3-.1-.5-.1H2.2c-.2 0-.5.1-.7.2-.2.2-.3.4-.3.6s0 .4.2.6l15 22.5c.1.2.3.3.5.4.2.1.4.1.6 0s.4-.2.5-.4C29 29.3 42.5 15 58.2 3.2c.2-.1.3-.3.4-.5 0-.3 0-.5-.1-.7 0-.2-.2-.3-.4-.4z"/><path d="M18.2 29.6l-5.4-8H1l15 22.5C27.1 27.2 40.6 12.8 56.5 1c-16 5.5-28.7 15-38.3 28.6z" fill="red"/><path d="M18.2 29.6C27.8 16 40.5 6.5 56.5 1 40.6 12.8 27.1 27.2 16 44.1L1 21.6h11.9l5.3 8z" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>
                    Featured
                    </div>
                    <div class="more button checked">More</div>
                    <div class="other-filters">
                        <div class="best-filter button checked">Best Rated</div>
                        <div class="mostplayed-filter button">Most Played</div>
                        <div class="newest-filter button">Newest</div>
                        <div class="oldest-filter button">Oldest</div>
                    </div>
                    <div class="search-filter"></div>
                </div>
                <div class="game-scroll-block"></div>
                <div class="footer"></div>
            `

            mainMenu = document.createElement('div');
            mainMenu.classList.add('mainmenu');
            mainMenu.innerHTML = htmlStructure;

            if(MobileController.isMobile()){
                mainMenu.classList.add('mobile');
            }

            const filters = mainMenu.querySelector('.filters');
            Array.from(filters.querySelectorAll('.button')).forEach( button => {
                if(button.classList.contains('featured-filter')){
                    button.onclick = () => {
                        button.classList.toggle('checked');
                        this.reloadMainMenuGames();
                    }
                }else if(button.classList.contains('date-filter')){
                    const dateFilters = filters.querySelector('.date-filters');
                    button.onclick = () => dateFilters.classList.toggle('open');
                }else if(button.parentNode.classList.contains('date-filters')){
                    const dateFilters = filters.querySelector('.date-filters');
                    const buttons = Array.from(dateFilters.querySelectorAll('.button'));
                    button.onclick = ()=>{
                        buttons.forEach(button => button.classList.remove('checked'));
                        button.classList.add('checked');
                        dateFilters.classList.remove('open');
                        this.reloadMainMenuGames();
                    }
                }else if(button.classList.contains('more')){
                    const otherFilters = filters.querySelector('.other-filters');
                    button.onclick = ()=>{
                        otherFilters.classList.toggle('open');
                    }
                }else{
                    const otherFilters = filters.querySelector('.other-filters');
                    const buttons = Array.from(otherFilters.querySelectorAll('.button'));
                    button.onclick = ()=>{
                        buttons.forEach(button => button.classList.remove('checked'));
                        button.classList.add('checked');
                        otherFilters.classList.remove('open');
                        this.reloadMainMenuGames();
                    }
                }
            })

            const header = mainMenu.querySelector('.header');

            const characterSelect = header.querySelector('.character-select');
            characterSelect.onclick = ()=>this.showCharacterSelect2();

            const editorButton = header.querySelector('.editor');
            editorButton.onclick = ()=> {
                this.hideMainMenu();
                game.openEditor();
            }

            const volumeButton = header.querySelector('.volume');
            if(!Settings.sfxOn) volumeButton.classList.add('disabled');

            volumeButton.onclick = ()=>{
                game.toggleMute();
                if(!Settings.sfxOn){
                    volumeButton.classList.add('disabled');
                }else{
                    volumeButton.classList.remove('disabled');
                }
            }

            const loginButton = header.querySelector('.discord');
            loginButton.onclick = ()=>{
                if(backendManager.isLoggedIn()){
                    // show profile page
                }else{
                    this.openDiscordOauth();
                }
            }

            backendManager.registerListener('login', ()=>this.handleLoginChange());
            this.handleLoginChange();

            if(!MobileController.isMobile()){
                new SimpleBar(mainMenu.querySelector('.games-scroll'), { autoHide: false });
            }

            const hamburger = header.querySelector('.hamburger');
            const mobileBG = header.querySelector('.mobile-bg');
            const headerButtons = header.querySelector('.buttons');
            hamburger.onclick = ()=>{
                mobileBG.classList.toggle('open');
                headerButtons.classList.toggle('open');
            }

            window.addEventListener('resize', ()=> {this.mainMenuResize()})
            this.mainMenuResize();

            customGUIContainer.appendChild(mainMenu);
        }

        this.setMainMenuCharacterImage();

        mainMenu.style.display = 'block';

        this.reloadMainMenuGames();
    }

    this.mainMenuResize = ()=> {
        customGUIContainer.style.height = window.innerHeight+'px';
        mainMenu.style.height = window.innerHeight+'px';

        
        const gamesScroll = mainMenu.querySelector('.games-scroll');
        if(window.innerWidth<820){
            gamesScroll.style.height = (window.innerHeight - 164)+'px';
        }else{
            gamesScroll.style.height = (window.innerHeight - 188)+'px';
        }
    }

    this.handleLoginChange = ()=> {
        const header = mainMenu.querySelector('.header');

        const discordButton = header.querySelector('.discord');
        if(backendManager.isLoggedIn()){
            discordButton.innerText = backendManager.userData.username;
            discordButton.style.fontSize = '26px';
        }else{
            discordButton.innerText = 'Login';
            discordButton.style.fontSize = '36px';
        }
    }

    this.setMainMenuCharacterImage = ()=> {
        const header = mainMenu.querySelector('.header');
        const characterSelect = header.querySelector('.character-select');
        characterSelect.style.backgroundImage = `url(./assets/images/portraits/${hashName(`character${game.selectedCharacter+1}.png`)})`;
    }

    this.setLevelDataOnGameTile = (game, levelData) => {
        const thumb = game.querySelector('.thumb');
        const thumbSrc = `${Settings.STATIC}/${levelData.thumb_big_md5}.png`;
        thumb.setAttribute('data-src', thumbSrc);

        const title = game.querySelector('.text-level-name');
        title.innerText = levelData.title;
        const author = game.querySelector('.text-author');
        author.innerText = levelData.author.username;

        const rating = game.querySelector('.rating');

        const sumVotes = levelData.upvotes + levelData.downvotes;
        let scoreText = "??";

        if(sumVotes<Settings.minlevelVotes){
            rating.classList.add('unknown');
        }else {
            const voteScore = Math.round((levelData.upvotes / sumVotes) * 100);

            if(voteScore<55){
                rating.classList.add('low');
            } else if(voteScore<70){
                rating.classList.add('ok');
            }else{
                rating.classList.add('good');
            }

            scoreText =  `${voteScore}%`;
        }

        const ratingText = rating.querySelector('.text-rating');
        ratingText.innerText = scoreText;

        const vehicleLabel = game.querySelector('.vehicle-label');
        vehicleLabel.style.backgroundImage = `url(./assets/images/portraits/${hashName(`mini-vehicle${levelData.forced_vehicle}.png`)})`;

        // const tags = game.querySelector('.tags');
    }

    this.determineMainMenuFilter = ()=>{
        const filters = mainMenu.querySelector('.filters')
        const featured = filters.querySelector('.featured-filter').classList.contains('checked');

        let sort = '';
        if(filters.querySelector('.mostplayed-filter').classList.contains('checked')) sort = this.FILTER_SORT_MOSTPLAYED;
        if(filters.querySelector('.best-filter').classList.contains('checked')) sort = this.FILTER_SORT_BEST;
        if(filters.querySelector('.newest-filter').classList.contains('checked')) sort = this.FILTER_SORT_NEWEST;
        if(filters.querySelector('.oldest-filter').classList.contains('checked')) sort = this.FILTER_SORT_OLDEST;

        let range = '';
        if(filters.querySelector('.anytime-filter').classList.contains('checked')) range = this.FILTER_RANGE_ANYTIME;
        if(filters.querySelector('.month-filter').classList.contains('checked')) range = this.FILTER_RANGE_THISMONTH;
        if(filters.querySelector('.week-filter').classList.contains('checked')) range = this.FILTER_RANGE_THISWEEK;
        if(filters.querySelector('.today-filter').classList.contains('checked')) range = this.FILTER_RANGE_TODAY;

        return {
            featured,
            sort,
            range
        }
    }
    this.reloadMainMenuGames = ()=>{
        const games = mainMenu.querySelector('.games');

        while(games.children.length>1){
            games.removeChild(games.children[1]);
        }

        const gameTemplate = mainMenu.querySelector('.game-template');

        const filter = this.determineMainMenuFilter();
        backendManager.getPublishedLevels(filter).then(levels => {
            levels.forEach( level => {

                const game = gameTemplate.cloneNode(true)
                game.style.display = 'block';
                game.classList.remove('game-template')
                this.setLevelDataOnGameTile(game, level);
                games.appendChild(game);

                game.onclick = ()=> this.showLevelBanner(level);

                imageObserver.observe(game);

            })
        })
        gameTemplate.style.display = 'none';
    }

    this.showLevelBanner = levelData => {
        if(!levelBanner){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="level-info">
                    <div class="thumb"> </div>
                    <div class="text-holder">
                        <div class="text-level-name">Level Name Goes Here</div>
                        <div class="level-author">
                            <div class="text-level-by">By:</div>
                            <div class="text-author">Author Name</div>
                        </div>
                        <div class="tags">
                        </div>
                        <div class="description-holder">
                            <div class="description">Level description goes hereLevel
                            description goes hereLevel description
                            goes hereLevel description goes here
                            Level description goes here</div>
                        </div>
                        <div class="level-published">
                            <div class="text-published">Publ.</div>
                            <div class="text-date-published">10. March. 2020</div>
                            <div class="text-updated">Upd.</div>
                            <div class="text-date-updated">10. March. 2020</div>
                        </div>

                    </div>
                </div>
                <div class="social-bar">
                    <div class="share">
                        <div class="share-icon"></div>
                        Share
                    </div>
                    <div class="save">
                        <div class="heart-icon"></div>
                        Save
                    </div>
                    <div class="voting">
                        <div class="vote-down button">
                            <div class="vote-thumb"></div>
                        </div>
                        <div class="vote-up button">
                            <div class="vote-thumb"></div>
                        </div>
                    </div>
                </div>
                <div class="nav-buttons">
                    <div class="back button">Back</div>
                    <div class="play button">
                        <div class="text-play">Play</div>
                        <div class="progress"></div>
                    </div>
                </div>
            `;

            levelBanner = document.createElement('div');
            levelBanner.classList.add('levelbanner');
            levelBanner.innerHTML = htmlStructure;


            const navButtons = levelBanner.querySelector('.nav-buttons');
            const backButton = navButtons.querySelector('.back');
            backButton.onclick = ()=>{
                history.replaceState({}, 'JollyWorld', '/');
                this.hideLevelBanner();
            }
            customGUIContainer.appendChild(levelBanner);
        }

        levelBanner.style.display = 'block';
        mainMenu.classList.add('inactive');

        const navButtons = levelBanner.querySelector('.nav-buttons');
        const playButton = navButtons.querySelector('.play');
        const playLevelFunction = () => {
            if (game.gameState != game.GAMESTATE_MENU) return;
            game.gameState = game.GAMESTATE_LOADINGDATA;

            playButton.classList.add('loading');

            const playButtonText = playButton.querySelector('.text-play');
            playButtonText.innerText = 'Loading';

            const progressBar = playButton.querySelector('.progress');
            const progressFunction = progress => {
                const progressRounded = (progress*100).toFixed(2);
                progressBar.style.clipPath = `inset(0px ${180-progressRounded}% 0px 0px)`;
            }

            const finishLoading = ()=>{
                playButton.classList.remove('loading');
                playButtonText.innerText = 'Play';
            }

            game.loadPublishedLevelData(levelData, progressFunction).then(() => {
                this.hideLevelBanner();
                if(levelData.forced_vehicle){
                    game.selectedVehicle = levelData.forced_vehicle;
                    this.playLevelFromMainMenu();
                }else{
                    this.showVehicleSelect();
                }
                finishLoading();
            }).catch(error => {
                finishLoading();
            });
        }
        playButton.onclick = playLevelFunction;

        const socialBar = levelBanner.querySelector('.social-bar');
        const shareButton = socialBar.querySelector('.share')

        shareButton.onclick = () => this.showSocialShare(levelData);

        document.title = 'JollyWorld - '+levelData.title;
        history.replaceState({}, document.title, `?lvl=${levelData.id}`);

        const voteButtons = levelBanner.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        shouldShowVoteButton(voteUpButton, voteDownButton, levelData);

        this.enableVoteButtons(voteUpButton, voteDownButton, levelData);

        this.setLevelBannerData(levelData);
    }

    this.enableVoteButtons = (voteUpButton, voteDownButton, levelData) => {
        [voteUpButton, voteDownButton].forEach(button => {
            const thumb = button.querySelector('.vote-thumb');
            thumb.classList.remove('voted')

            button.onclick = ()=>{
                const vote = button === voteUpButton ? 1 : -1;
                game.voteLevel(levelData, vote).then(()=>{
                    thumb.classList.remove('voted')
                    void thumb.offsetWidth;
                    thumb.classList.add('voted')
                    shouldShowVoteButton(voteUpButton, voteDownButton, levelData);
                }).catch(err=>{
                    // error
                    console.log(err);
                });

            }
        })
    }

    this.setLevelBannerData = levelData => {
        console.log('levelData:', levelData)

        const thumb = levelBanner.querySelector('.thumb');
        const thumbSrc = `${Settings.STATIC}/${levelData.thumb_big_md5}.png`;
        thumb.style.backgroundImage = `url(${thumbSrc})`;


        const title = levelBanner.querySelector('.text-level-name');
        title.innerText = levelData.title;
        const author = levelBanner.querySelector('.text-author');
        author.innerText = levelData.author.username;

        const description = levelBanner.querySelector('.description');
        description.innerText = levelData.description;


        const publishedDateDiv = levelBanner.querySelector('.level-published');

        const publishedDate = publishedDateDiv.querySelector('.text-date-published');
        publishedDate.innerText = format.formatDMY(levelData.created_at);

        if(format.formatDMY(levelData.updated_at) === publishedDate.innerText){
            publishedDateDiv.classList.add('no-update');
        }else{
            publishedDateDiv.classList.remove('no-update');
            const updatedDate = publishedDateDiv.querySelector('.text-date-updated');
            updatedDate.innerText = format.formatDMY(levelData.updated_at);
        }
    }
    this.hideLevelBanner = ()=>{

        const thumb = levelBanner.querySelector('.thumb');
        thumb.style.backgroundImage = 'none';

        levelBanner.style.display = 'none';
        mainMenu.classList.remove('inactive');
    }

    this.showLoginPrompt = ()=> {
        const container = document.querySelector('#settings-ui');
        if(!loginScreen){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">Please login</div>
                <div class="body"> Features like voting and cloud saving of levels require you to login. You can login using Discord via the button below. </div>
                <div class="nav-buttons">
                    <div class="back">Back</div>
                    <div class="discord">Login</div>
                </div>
                <div class="powered-by">
                    Login is powered by
                    <div class="discord-logo">
                </div>
            `;

            loginScreen = document.createElement('div');
            loginScreen.classList.add('loginscreen');
            loginScreen.innerHTML = htmlStructure;


            const navButtons = loginScreen.querySelector('.nav-buttons');
            const backButton = navButtons.querySelector('.back');
            backButton.onclick = ()=>{
                loginScreen.style.display = 'none';
            }

            const loginButton = navButtons.querySelector('.discord');
            loginButton.onclick = ()=>{
                loginScreen.style.display = 'none';
                this.openDiscordOauth();
            }

            container.appendChild(loginScreen);
        }

        loginScreen.style.display = 'block';
    }

    this.openDiscordOauth = function(){
        const shrink = .8;
        const w = Math.min(Math.floor(window.innerWidth * shrink), 600);
        const h = 800;
        const leftPosition = (window.innerWidth - w) / 2;
        const topPosition = (window.innerHeight - h) / 2;
        const settings = `height=${h},width=${w},top=${topPosition},left=${leftPosition},scrollbars=yes,directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no`;

        const url = `https://api.jollyworld.app/login?redirect=${encodeURIComponent(Settings.REDIRECT)}`;
        window.open(url, 'oAuthLogin', settings);
    }

    // this.showSettingsButtons = function(){
    //     const targetElement = document.querySelector('#settings-ui');
    //     const volumeButton = document.createElement('button');
    //     volumeButton.classList.add('audioButton');

    //     volumeButton.onclick = ()=>{


    //     }
    //     targetElement.appendChild(volumeButton);
    // }
    this.showSmallLogo = function(){
        if(!smallLogo){
            smallLogo = document.createElement('div');
            smallLogo.classList.add('logoSmall');
            smallLogo.style.position = 'absolute';
            smallLogo.style.top = '0px';
            smallLogo.style.left = '0px';
            smallLogo.style.margin = '4px';
            customGUIContainer.appendChild(smallLogo);
        }
        smallLogo.style.display = 'block';
    }
    this.hideSmallLogo = function(){
        if(smallLogo) smallLogo.style.display = 'none';
    }

    this.hide = function () {
        customGUIContainer.style.display = 'none';
    }
    this.show = function () {
        customGUIContainer.style.display = 'block';
    }

    this.hideMainMenu = function () {
        mainMenu.style.display = "none";
    }

    this.showGameOver = function () {
        if (!gameOver) {
            gameOver = document.createElement('div');
            gameOver.setAttribute('id', 'gameOverScreen');
            customGUIContainer.appendChild(gameOver);

            let textGroup = document.createElement('div');
            textGroup.setAttribute('class', 'textGroup');
            gameOver.appendChild(textGroup);

            let text = document.createElement('div');
            text.setAttribute('class', 'gameOverText');
            text.innerHTML = 'You are dead';
            textGroup.appendChild(text);

            text = document.createElement('div');
            text.setAttribute('class', 'spaceRestartText');
            text.innerHTML = 'Press space to retry';
            textGroup.appendChild(text);

            let buttonGroup = document.createElement('div');
            buttonGroup.setAttribute('class', 'buttonGroup');
            gameOver.appendChild(buttonGroup);

            let button = document.createElement('div');
            button.setAttribute('class', 'headerButton checkpoint buttonOverlay dark');
            button.innerHTML = "RETRY";
            buttonGroup.appendChild(button);

            button.addEventListener('click', () => {
                game.resetWorld(true);
            });

            button = document.createElement('div');
            button.setAttribute('class', 'headerButton restart buttonOverlay dark');
            button.innerHTML = "RESET";
            buttonGroup.appendChild(button);

            button.addEventListener('click', () => {
                this.hideGameOverMenu();
                game.openMainMenu(game.currentLevelData);
            });

            button = document.createElement('div');
            button.setAttribute('class', 'headerButton exit buttonOverlay dark');
            button.innerHTML = "EXIT";
            buttonGroup.appendChild(button);

            button.addEventListener('click', () => {
                if(game.gameState === game.GAMESTATE_EDITOR){
                    game.stopTestingWorld();
                }else{
                    game.openMainMenu();
                }
            });

            const votingButs = this.buildVoteGUI();
            votingButs.classList.add('ratingHolder')
            votingButs.style.position = 'absolute';
            votingButs.style.top = '110%';
            votingButs.style.background = '#4040407a';
            votingButs.style.borderRadius = '16px';
            votingButs.style.padding = '5px';

            gameOver.appendChild(votingButs);

        }

        const votingHolder = gameOver.querySelector('.ratingHolder');
        this.updateVoteGUI(votingHolder);

        if(game.gameState === game.GAMESTATE_NORMALPLAY){
            votingHolder.style.display = 'flex';
        }else{
            votingHolder.style.display = 'none';
        }


        if(gameOver && game.run) gameOver.style.display = 'flex';
        setTimeout(()=>{
            if(gameOver && game.run){
                gameOver.style.opacity = 1;
                AudioManager.playSFX('lose', 0.3, 1.0);
            }
        },
        Settings.gameOverDelay);
    }
    this.hideGameOverMenu = function () {
        if (gameOver && gameOver.style.display == 'flex') {
            gameOver.style.display = 'none';
            gameOver.style.opacity = 0;
        }
    }

    // this.showLevelBanner2 = function () {
    //     if (!levelBanner) {

    //         game.editor.ui.registerDragWindow(levelBanner);

    //         levelBannerYTFeed = document.createElement('div');
    //         levelBannerYTFeed.classList.add('youtubeFeed');
    //         for(let i = 0; i<3; i++){
    //             const youtubeFrame = document.createElement('div');
    //             youtubeFrame.classList.add('youtubeFrame');
    //             levelBannerYTFeed.appendChild(youtubeFrame);

    //             const playButtonIcon = document.createElement('button');
    //             playButtonIcon.innerHTML = YouTubePlayer.playButtonHTML;
    //             playButtonIcon.classList.add('youtubePlayButton');
    //             youtubeFrame.appendChild(playButtonIcon);

    //             youtubeFrame.onclick = () => {
    //                 this.showYouTubePlayer(youtubeFrame.getAttribute('yt-video-id'));
    //             }

    //         }
    //         customGUIContainer.appendChild(levelBannerYTFeed);


    //     }
    //     levelBanner.domElement.style.visibility = 'visible';
    //     levelBannerYTFeed.style.visibility = 'visible';
    //     // set values

    //     let thumbNailImage = levelBanner.domElement.querySelector('#levelbanner_levelThumbnailImage');
    //     thumbNailImage.src = `${Settings.STATIC}/${game.currentLevelData.thumb_big_md5}.png`;


    //     let levelTitle = game.currentLevelData.published ? game.currentLevelData.title : game.currentLevelData.title+' (PREVIEW)';
    //     levelBanner.domElement.querySelector('.levelbanner_title').innerText = levelTitle;
    //     levelBanner.domElement.querySelector('.levelbanner_creatorSpan').innerText = game.currentLevelData.author.username;
    //     levelBanner.domElement.querySelector('#levelbanner_description').innerText = game.currentLevelData.description;

    //     levelBanner.domElement.style.left = '50%';
    //     levelBanner.domElement.style.top = '50%';
    //     levelBanner.domElement.style.transform = 'translate(-50%, -50%)';


    //     const youtubeVideos = game.currentLevelData.youtubelinks || [];

    //     if(youtubeVideos.length > 0) levelBannerYTFeed.classList.remove('hideLogo');
    //     else  levelBannerYTFeed.classList.add('hideLogo');

    //     const youtubeFrames = Array.from(levelBannerYTFeed.querySelectorAll('.youtubeFrame'));
    //     youtubeFrames.forEach( (frame, i)=>{
    //         frame.setAttribute('yt-video-id', youtubeVideos[i]);
    //         if(youtubeVideos[i]){
    //             frame.style.backgroundImage = `url(https://i.ytimg.com/vi/${youtubeVideos[i]}/mqdefault.jpg)`;
    //             frame.style.opacity = 1.0;
    //         }else{
    //             frame.style.opacity = 0.0;
    //         }

    //     })
    //     document.title = 'JollyWorld - '+levelTitle;
    //     history.replaceState({}, document.title, `?lvl=${game.currentLevelData.id}`)

    // }hi

    this.showCharacterSelect2 = function(){
        if(!characterSelect){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">Select a character</div>
                <div class="characters">
                </div>
                <div class="back button">Back</div>
            `;

            characterSelect = document.createElement('div');
            characterSelect.classList.add('characterSelect');
            characterSelect.innerHTML = htmlStructure;

            const characters = characterSelect.querySelector('.characters');

            for(let i = 0; i<Settings.availableCharacters; i++){
                const portrait =  document.createElement('img');
                portrait.src = `./assets/images/portraits/${hashName(`character${i+1}.png`)}`
                portrait.classList.add('portrait');
                characters.appendChild(portrait);

                portrait.onclick = () => {
                    game.selectedCharacter = i;

                    const userData = SaveManager.getLocalUserdata();
                    userData.selectedCharacter = game.selectedCharacter;
                    SaveManager.updateLocalUserData(userData);

                    this.setMainMenuCharacterImage();
                    this.hideCharacterSelect();
                }
            }
            customGUIContainer.appendChild(characterSelect);
        }

        characterSelect.style.display = 'block';
        mainMenu.classList.add('inactive');

        const back = characterSelect.querySelector('.back');
        back.onclick = ()=>{
            this.hideCharacterSelect();
        }
    }

    this.hideCharacterSelect = function () {
        mainMenu.classList.remove('inactive');
        characterSelect.style.display = 'none';
    }

    this.playLevelFromMainMenu = function(){
        mainMenu.classList.remove('inactive');
        game.preloader.classList.remove('hide');
        setTimeout(()=>{
            this.hideMainMenu();
            game.initLevel(game.currentLevelData);
            game.playWorld(true);
            backendManager.increasePlayCountPublishedLevel(game.currentLevelData);
            setTimeout(()=>{
                game.preloader.classList.add('hide');
                TutorialManager.showTutorial(TutorialManager.TUTORIALS.WELCOME);
            }, Settings.levelBuildDelayTime);
        }, Settings.levelBuildDelayTime);
    }

    this.showVehicleSelect = function(){
        if(!vehicleSelect){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">Select a vehicle</div>
                <div class="vehicles">
                </div>
                <div class="back button">Back</div>
            `;

            vehicleSelect = document.createElement('div');
            vehicleSelect.classList.add('vehicleselect');
            vehicleSelect.innerHTML = htmlStructure;

            const vehicles = vehicleSelect.querySelector('.vehicles');

            for(let i = 0; i<Settings.availableVehicles.length; i++){
                const portrait =  document.createElement('img');
                portrait.src = `./assets/images/portraits/${hashName(`vehicle${i+1}.png`)}`
                portrait.classList.add('portrait');
                vehicles.appendChild(portrait);

                portrait.onclick = () => {
                    if (!game.currentLevelData.forced_vehicle || (i + 1) === game.currentLevelData.forced_vehicle) {
                        this.hideVehicleSelect();
                        game.selectedVehicle = i + 1;
                        this.playLevelFromMainMenu();
                    }
                }
                // hide no vehicle
                if(i==2) portrait.style.display = 'none';
            }
            customGUIContainer.appendChild(vehicleSelect);
        }

        vehicleSelect.style.display = 'block';
        mainMenu.classList.add('inactive');

        const back = vehicleSelect.querySelector('.back');
        back.onclick = ()=>{
            this.hideVehicleSelect();
            game.gameState = game.GAMESTATE_MENU;
            this.showLevelBanner(game.currentLevelData);
        }
    }

    this.hideVehicleSelect = function () {
        vehicleSelect.style.display = 'none';
    }

    this.showPauseMenu = function(){
        if(!pauseScreen){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">Pause</div>
                <div class="text-level-name">Level Name Goes Here</div>
                <div class="level-author">
                    <div class="text-level-by">By:</div>
                    <div class="text-author">Author Name</div>
                </div>
                <div class="share">
                    <div class="share-icon"></div>
                    Share
                </div>
                <div class="save">
                    <div class="heart-icon"></div>
                    Save
                </div>
                <div class="vote-bar">
                    <div class ="voting">
                        <div class="vote-down button">
                            <div class="vote-thumb"></div>
                        </div>
                        <div class="vote-up button">
                            <div class="vote-thumb"></div>
                        </div>
                    </div>
                </div>
                <div class="buttons">
                    <div class="reset">Reset</div>
                    <div class="retry">Retry</div>
                    <div class="exit">Exit to Menu</div>
                    <div class="resume">Resume</div>
                </div>
            `;

            pauseScreen = document.createElement('div');
            pauseScreen.classList.add('pausescreen');
            pauseScreen.innerHTML = htmlStructure;

            const buttons = pauseScreen.querySelector('.buttons');
            const resetButton = buttons.querySelector('.reset');
            resetButton.onclick = () => {
                game.unpauseGame();
                game.openMainMenu(game.currentLevelData);
            };
            const retryButton = buttons.querySelector('.retry');
            retryButton.onclick = () => {
                game.unpauseGame();
                game.resetWorld(true);
            };
            const exitButton = buttons.querySelector('.exit');
            exitButton.onclick = () => {
                game.unpauseGame();
                game.openMainMenu();
            };
            const resumeButton = buttons.querySelector('.resume');
            resumeButton.onclick = () => {
                game.unpauseGame();
            };

            customGUIContainer.appendChild(pauseScreen);
        }

        const title = pauseScreen.querySelector('.text-level-name');
        title.innerText = game.currentLevelData.title;
        const author = pauseScreen.querySelector('.text-author');
        author.innerText = game.currentLevelData.author.username;

        const voteButtons = pauseScreen.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        shouldShowVoteButton(voteUpButton, voteDownButton, game.currentLevelData);

        this.enableVoteButtons(voteUpButton, voteDownButton, game.currentLevelData);

        pauseScreen.style.display = 'block';
    }
    this.hidePauseMenu = function () {
        pauseScreen.style.display = 'none';
    }

    this.buildVoteGUI = ()=>{
        const ratingHolder = document.createElement('div');
        ratingHolder.setAttribute('class', 'ratingHolder');
        ratingHolder.classList.add('pauseMenu_ratingHolder');

        let upvoteButton = document.createElement('div');
        upvoteButton.setAttribute('class', 'startButton menuButton upvote')
        ratingHolder.appendChild(upvoteButton);

        let thumbIcon = document.createElement('div');
        thumbIcon.setAttribute('class', 'thumbsUpIcon');
        upvoteButton.appendChild(thumbIcon);

        let ratingText = document.createElement('div');
        ratingText.setAttribute('class', 'ratingText')
        ratingHolder.appendChild(ratingText);

        let span = document.createElement('span');
        span.classList.add('rating_span');
        span.classList.add('greenSpan');
        ratingText.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Likes';
        ratingText.appendChild(span);

        span = document.createElement('span');
        span.classList.add('sumvotes_span')
        span.classList.add('greenSpan');
        ratingText.appendChild(span);

        span = document.createElement('span');
        span.innerText = 'Voters';
        ratingText.appendChild(span);

        let downvoteButton = document.createElement('div');
        downvoteButton.setAttribute('class', 'startButton menuButton downvote')
        ratingHolder.appendChild(downvoteButton);

        thumbIcon = document.createElement('div');
        thumbIcon.setAttribute('class', 'thumbsUpIcon');
        downvoteButton.appendChild(thumbIcon);

        upvoteButton.addEventListener('click', () => {
            backendManager.voteLevel(game.currentLevelData.id, 1).then(() => {
                shouldShowVoteButton(upvoteButton, downvoteButton, game.currentLevelData)
            });
        });
        downvoteButton.addEventListener('click', () => {
            backendManager.voteLevel(game.currentLevelData.id, -1).then(() => {
                shouldShowVoteButton(upvoteButton, downvoteButton, game.currentLevelData)
            });
        });

        this.updateVoteGUI(ratingHolder);

        return ratingHolder
    }
    this.updateVoteGUI = element =>{

        const upvoteButton = element.querySelector('.upvote');
        const downvoteButton = element.querySelector('.downvote');

        shouldShowVoteButton(upvoteButton, downvoteButton, game.currentLevelData);

        const sumVotes = game.currentLevelData.upvotes + game.currentLevelData.downvotes;
        const rating = game.currentLevelData.upvotes / sumVotes;

        const ratingSpan = element.querySelector('.rating_span');
        ratingSpan.innerText = (!sumVotes || sumVotes < 10) ? '??' : Math.round(rating * 100) + '%';

        const sumVotesSpan = element.querySelector('.sumvotes_span');
        sumVotesSpan.innerText = format.formatNumber(sumVotes);

    }

    this.showWinScreen = function (time, mili) {
        if (!winScreen) {
            const levelEditGUIWidth = 340;
            winScreen = new dat.GUI({
                autoPlace: false,
                width: levelEditGUIWidth
            });
            winScreen.domElement.setAttribute('id', 'winScreen');

            let folder = winScreen.addFolder('Win Screen');
            folder.domElement.classList.add('custom');

            folder.open();

            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            winLogo = document.createElement('div');
            winLogo.classList.add('winLogo');
            customGUIContainer.appendChild(winLogo);

            let divWrapperNormal = document.createElement('div');
            divWrapperNormal.setAttribute('id', 'divWrapperNormal');

            divWrapperNormal.style.padding = '5px';

            let title = document.createElement('div');
            title.classList.add('levelbanner_title');
            divWrapperNormal.appendChild(title);

            let creator = document.createElement('div');
            creator.classList.add('levelbanner_creator');

            let span = document.createElement('span');
            span.innerText = 'By:';
            creator.appendChild(span);

            span = document.createElement('span');
            span.innerText = 'Creator';
            span.classList.add('levelbanner_creatorSpan')
            creator.appendChild(span);

            divWrapperNormal.appendChild(creator);

            let ratingHolder = this.buildVoteGUI();
            ratingHolder.setAttribute('class', 'ratingHolder');
            ratingHolder.setAttribute('id', 'winScreen_ratingHolder');
            divWrapperNormal.appendChild(ratingHolder);

            winScreen.updateVoteGUI = ()=>{this.updateVoteGUI(ratingHolder)};


            let timeDiv = document.createElement('div');
            timeDiv.classList.add('winScreen_timeDiv');
            let timeSpan = document.createElement('span');
            timeSpan.innerText = time;
            timeSpan.classList.add('winScreen_time');
            timeDiv.appendChild(timeSpan);
            let timeSpanMili = document.createElement('span');
            timeSpanMili.innerText = mili;
            timeSpanMili.classList.add('winScreen_timeMili');
            timeDiv.appendChild(timeSpanMili);
            divWrapperNormal.appendChild(timeDiv);

            const flexButtonHolder = document.createElement('div');
            divWrapperNormal.appendChild(flexButtonHolder);
            flexButtonHolder.classList.add('flexButtonWrap');

            let exitButton = document.createElement('div');
            exitButton.setAttribute('class', 'backButton menuButton')
            exitButton.innerHTML = 'Exit to Menu';
            exitButton.style.marginLeft = '14px';
            flexButtonHolder.appendChild(exitButton);

            exitButton.addEventListener('click', () => {
                this.hideWinScreen();
                game.openMainMenu();
            })

            let restartButton = document.createElement('div');
            restartButton.setAttribute('class', 'moreLevels menuButton')
            restartButton.innerHTML = 'Restart';
            flexButtonHolder.appendChild(restartButton);

            restartButton.addEventListener('click', () => {
                this.hideWinScreen();
                game.openMainMenu(game.currentLevelData);
            })

            targetDomElement.appendChild(divWrapperNormal);

            let divWrapperEditor = document.createElement('div');
            divWrapperEditor.setAttribute('id', 'divWrapperEditor');

            divWrapperEditor.style.padding = '20px';

            timeDiv = document.createElement('div');
            timeDiv.classList.add('winScreen_timeDiv');
            timeSpan = document.createElement('span');
            timeSpan.innerText = time;
            timeSpan.classList.add('winScreen_time');
            timeDiv.appendChild(timeSpan);
            timeSpanMili = document.createElement('span');
            timeSpanMili.innerText = mili;
            timeSpanMili.classList.add('winScreen_timeMili');
            timeDiv.appendChild(timeSpanMili);
            divWrapperEditor.appendChild(timeDiv);

            let exitTest = document.createElement('div');
            exitTest.setAttribute('class', 'moreLevels menuButton')
            exitTest.innerHTML = 'Exit Test';
            exitTest.style.float = 'unset';
            exitTest.style.margin = 'auto';
            exitTest.style.marginTop = '20px';
            divWrapperEditor.appendChild(exitTest);

            exitTest.addEventListener('click', () => {
                game.stopTestingWorld();
                this.hideWinScreen();
            })

            targetDomElement.appendChild(divWrapperEditor);
            customGUIContainer.appendChild(winScreen.domElement);
            winScreen.domElement.style.position = 'absolute';
        }

        winScreen.domElement.style.visibility = 'visible';
        winLogo.style.visibility = 'visible';

        winLogo.classList.remove("winLogo");
        void winLogo.offsetWidth;
        winLogo.classList.add("winLogo");

        // set values

        if (game.gameState == game.GAMESTATE_EDITOR) {
            winScreen.domElement.querySelector('#divWrapperNormal').style.display = 'none';
            winScreen.domElement.querySelector('#divWrapperEditor').style.display = 'block';
        } else {
            winScreen.domElement.querySelector('#divWrapperNormal').style.display = 'block';
            winScreen.domElement.querySelector('#divWrapperEditor').style.display = 'none';
        }

        winScreen.domElement.querySelector('.levelbanner_title').innerText = game.currentLevelData.title;

        if(game.gameState == game.GAMESTATE_NORMALPLAY){
            winScreen.domElement.querySelector('.levelbanner_creatorSpan').innerText = game.currentLevelData.author.username;
            divWrapperNormal.querySelector('.winScreen_time').innerText = time;
            divWrapperNormal.querySelector('.winScreen_timeMili').innerText = mili;
        }else {
            winScreen.domElement.querySelector('.levelbanner_creatorSpan').innerText = 'User';
            divWrapperEditor.querySelector('.winScreen_time').innerText = time;
            divWrapperEditor.querySelector('.winScreen_timeMili').innerText = mili;
        }

        winScreen.domElement.style.left = '50%';
        winScreen.domElement.style.top = '65%';
        winScreen.domElement.style.transform = 'translate(-50%, -50%)';

        AudioManager.playSFX('win', 0.5, 1.0);

    }

    this.hideWinScreen = function () {
        if(winScreen){
            winScreen.domElement.style.visibility = 'hidden';
            winLogo.style.visibility = 'hidden';
        }
    }

    this.buildSocialShare2 = ()=> {
        const htmlStructure = /*html*/`
            <div class="bar"><div class="close"></div></div>
            <div class="header">Jolly Sharing</div>
            <div class="padding">
                <div class="text-level-link">Level link</div>
                <div class="copy-url">
                    <input class="text-url" readonly>
                    <div class="copy-button"></div>
                </div>
                <div class="share-by">Or share by</div>
                <div class="social-share-holder"></div>
            </div>
        `;

        const socialShareElement = document.createElement('div');
        socialShareElement.classList.add('socialshare');
        socialShareElement.innerHTML = htmlStructure;

        const input = socialShareElement.querySelector('input');

        const copyButton = socialShareElement.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            const copyText = '(copied) ';
            if (input.value.startsWith(copyText)) {
                input.value = input.value.substr(copyText.length);
            }
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand("copy");
            input.value = copyText + input.value;
        });

        const closeButton = socialShareElement.querySelector('.close');
        closeButton.onclick = ()=>{
            socialShareElement.style.display = 'none';
        }

        return socialShareElement;
    }

    this.updateSocialShareLinks = (element, level) => {
        const url = encodeURIComponent(`${Settings.GAMEURI}/?lvl=${level.id}`);
        const body = encodeURIComponent('Check out this level in JollyWorld! ' + level.description);

        const socialHTML = `
            <a class="resp-sharing-button__link" href="https://facebook.com/sharer/sharer.php?u=${url}" target="_blank" rel="noopener" aria-label="Share on Facebook">
            <div class="resp-sharing-button resp-sharing-button--facebook resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
                </div>Facebook</div>
            </a>
            <a class="resp-sharing-button__link" href="https://twitter.com/intent/tweet/?text=${body}&amp;url=${url}" target="_blank" rel="noopener" aria-label="Share on Twitter">
            <div class="resp-sharing-button resp-sharing-button--twitter resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.44 4.83c-.8.37-1.5.38-2.22.02.93-.56.98-.96 1.32-2.02-.88.52-1.86.9-2.9 1.1-.82-.88-2-1.43-3.3-1.43-2.5 0-4.55 2.04-4.55 4.54 0 .36.03.7.1 1.04-3.77-.2-7.12-2-9.36-4.75-.4.67-.6 1.45-.6 2.3 0 1.56.8 2.95 2 3.77-.74-.03-1.44-.23-2.05-.57v.06c0 2.2 1.56 4.03 3.64 4.44-.67.2-1.37.2-2.06.08.58 1.8 2.26 3.12 4.25 3.16C5.78 18.1 3.37 18.74 1 18.46c2 1.3 4.4 2.04 6.97 2.04 8.35 0 12.92-6.92 12.92-12.93 0-.2 0-.4-.02-.6.9-.63 1.96-1.22 2.56-2.14z"/></svg>
                </div>Twitter</div>
            </a>
            <a class="resp-sharing-button__link" href="whatsapp://send?text=${body}%20${url}" target="_blank" rel="noopener" aria-label="Share on WhatsApp">
            <div class="resp-sharing-button resp-sharing-button--whatsapp resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.1 3.9C17.9 1.7 15 .5 12 .5 5.8.5.7 5.6.7 11.9c0 2 .5 3.9 1.5 5.6L.6 23.4l6-1.6c1.6.9 3.5 1.3 5.4 1.3 6.3 0 11.4-5.1 11.4-11.4-.1-2.8-1.2-5.7-3.3-7.8zM12 21.4c-1.7 0-3.3-.5-4.8-1.3l-.4-.2-3.5 1 1-3.4L4 17c-1-1.5-1.4-3.2-1.4-5.1 0-5.2 4.2-9.4 9.4-9.4 2.5 0 4.9 1 6.7 2.8 1.8 1.8 2.8 4.2 2.8 6.7-.1 5.2-4.3 9.4-9.5 9.4zm5.1-7.1c-.3-.1-1.7-.9-1.9-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1s-1.2-.5-2.3-1.4c-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6s.3-.3.4-.5c.2-.1.3-.3.4-.5.1-.2 0-.4 0-.5C10 9 9.3 7.6 9 7c-.1-.4-.4-.3-.5-.3h-.6s-.4.1-.7.3c-.3.3-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3-.1-.3-.3-.4-.6-.5z"/></svg>
                </div>WhatsApp</div>
            </a>
            <a class="resp-sharing-button__link" href="https://reddit.com/submit/?url=${url}&amp;resubmit=true&amp;title=${body}" target="_blank" rel="noopener" aria-label="Share on Reddit">
            <div class="resp-sharing-button resp-sharing-button--reddit resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-6.07-1.72.08-1.1.4-3.05 1.52-3.7.72-.4 1.73-.24 3 .5C17.2 6.3 18.46 7.5 20 7.5c1.65 0 3-1.35 3-3s-1.35-3-3-3c-1.38 0-2.54.94-2.88 2.22-1.43-.72-2.64-.8-3.6-.25-1.64.94-1.95 3.47-2 4.55-2.33.08-4.45.7-6.1 1.72C4.86 8.98 3.96 8.5 3 8.5c-1.65 0-3 1.35-3 3 0 1.32.84 2.44 2.05 2.84-.03.22-.05.44-.05.66 0 3.86 4.5 7 10 7s10-3.14 10-7c0-.22-.02-.44-.05-.66 1.2-.4 2.05-1.54 2.05-2.84zM2.3 13.37C1.5 13.07 1 12.35 1 11.5c0-1.1.9-2 2-2 .64 0 1.22.32 1.6.82-1.1.85-1.92 1.9-2.3 3.05zm3.7.13c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9.8 4.8c-1.08.63-2.42.96-3.8.96-1.4 0-2.74-.34-3.8-.95-.24-.13-.32-.44-.2-.68.15-.24.46-.32.7-.18 1.83 1.06 4.76 1.06 6.6 0 .23-.13.53-.05.67.2.14.23.06.54-.18.67zm.2-2.8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm5.7-2.13c-.38-1.16-1.2-2.2-2.3-3.05.38-.5.97-.82 1.6-.82 1.1 0 2 .9 2 2 0 .84-.53 1.57-1.3 1.87z"/></svg>
                </div>Reddit</div>
            </a>
            <a class="resp-sharing-button__link" href="mailto:?subject=${body}&amp;body=${url}" target="_self" rel="noopener" aria-label="Share by E-Mail">
            <div class="resp-sharing-button resp-sharing-button--email resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 4H2C.9 4 0 4.9 0 6v12c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM7.25 14.43l-3.5 2c-.08.05-.17.07-.25.07-.17 0-.34-.1-.43-.25-.14-.24-.06-.55.18-.68l3.5-2c.24-.14.55-.06.68.18.14.24.06.55-.18.68zm4.75.07c-.1 0-.2-.03-.27-.08l-8.5-5.5c-.23-.15-.3-.46-.15-.7.15-.22.46-.3.7-.14L12 13.4l8.23-5.32c.23-.15.54-.08.7.15.14.23.07.54-.16.7l-8.5 5.5c-.08.04-.17.07-.27.07zm8.93 1.75c-.1.16-.26.25-.43.25-.08 0-.17-.02-.25-.07l-3.5-2c-.24-.13-.32-.44-.18-.68s.44-.32.68-.18l3.5 2c.24.13.32.44.18.68z"/></svg></div>E-Mail</div>
            </a>
            <a class="resp-sharing-button__link" href="http://vk.com/share.php?title=${body}&amp;url=${url}" target="_blank" rel="noopener" aria-label="Share on VK">
            <div class="resp-sharing-button resp-sharing-button--vk resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.547 7h-3.29a.743.743 0 0 0-.655.392s-1.312 2.416-1.734 3.23C14.734 12.813 14 12.126 14 11.11V7.603A1.104 1.104 0 0 0 12.896 6.5h-2.474a1.982 1.982 0 0 0-1.75.813s1.255-.204 1.255 1.49c0 .42.022 1.626.04 2.64a.73.73 0 0 1-1.272.503 21.54 21.54 0 0 1-2.498-4.543.693.693 0 0 0-.63-.403h-2.99a.508.508 0 0 0-.48.685C3.005 10.175 6.918 18 11.38 18h1.878a.742.742 0 0 0 .742-.742v-1.135a.73.73 0 0 1 1.23-.53l2.247 2.112a1.09 1.09 0 0 0 .746.295h2.953c1.424 0 1.424-.988.647-1.753-.546-.538-2.518-2.617-2.518-2.617a1.02 1.02 0 0 1-.078-1.323c.637-.84 1.68-2.212 2.122-2.8.603-.804 1.697-2.507.197-2.507z"/></svg>
                </div>VK</div>
            </a>
            <a class="resp-sharing-button__link" href="https://telegram.me/share/url?text=${body}&amp;url=${url}" target="_blank" rel="noopener" aria-label="Share on Telegram">
            <div class="resp-sharing-button resp-sharing-button--telegram resp-sharing-button--large"><div aria-hidden="true" class="resp-sharing-button__icon resp-sharing-button__icon--solid">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M.707 8.475C.275 8.64 0 9.508 0 9.508s.284.867.718 1.03l5.09 1.897 1.986 6.38a1.102 1.102 0 0 0 1.75.527l2.96-2.41a.405.405 0 0 1 .494-.013l5.34 3.87a1.1 1.1 0 0 0 1.046.135 1.1 1.1 0 0 0 .682-.803l3.91-18.795A1.102 1.102 0 0 0 22.5.075L.706 8.475z"/></svg>
                </div>Telegram</div>
            </a>
        `;
        const holder = element.querySelector('.social-share-holder');
        holder.innerHTML = socialHTML;

        const input = element.querySelector('input');
        input.value = decodeURIComponent(url);

    }

    this.showSocialShare = level =>{
        if(!socialShareScreen){
            socialShareScreen = this.buildSocialShare2();
            customGUIContainer.appendChild(socialShareScreen);
        }
        this.updateSocialShareLinks(socialShareScreen, level);
        socialShareScreen.style.display = 'block';
    }

    this.hideSocialShareMenu = function () {
        if (socialShareScreen) socialShareScreen.style.display = 'none';
    }

    this.showYouTubePlayer = function(id){
        if(!youtubePlayer){
            const levelEditGUIWidth = 500;
            youtubePlayer = new dat.GUI({
                autoPlace: false,
                width: levelEditGUIWidth
            });
            youtubePlayer.domElement.style.position = 'absolute';

            let folder = youtubePlayer.addFolder('YouTube Player');
            folder.domElement.classList.add('custom');

            folder.open();

            const closeButton = document.createElement('div');
            closeButton.setAttribute('class', 'closeWindowIcon');
            folder.domElement.append(closeButton);
            closeButton.addEventListener('click', () => {
                self.hideYouTubePlayer();
            });

            const targetDomElement = folder.domElement.getElementsByTagName('ul')[0];
            const divWrapper = document.createElement('div');
            // divWrapper.innerText = 'Youtube player:'+id

            const youtubePlayerHolder = document.createElement('div');
            youtubePlayerHolder.setAttribute('id', 'YTPlayerHolder');
            divWrapper.appendChild(youtubePlayerHolder);

            const subscribeHolder = document.createElement('div');
            subscribeHolder.classList.add('youtubeSubscribeHolder');
            divWrapper.appendChild(subscribeHolder);

            const authorSpan = document.createElement('div');
            authorSpan.classList.add('youtubeAuthor');
            subscribeHolder.appendChild(authorSpan);


            const subscribeButton = document.createElement('button');
            subscribeButton.innerHTML = YouTubePlayer.subscribeButtonHTML;
            subscribeHolder.appendChild(subscribeButton);
            subscribeButton.classList.add('youtubeSubscribe');

            subscribeButton.onclick = ()=>{
                const channelID = subscribeButton.getAttribute('yt-channel');
                if(channelID){
                    window.open(`https://www.youtube.com/channel/${channelID}?view_as=subscriber&sub_confirmation=1`);
                }
            }

            const ytSpinner = document.createElement('div');
            ytSpinner.classList.add('youtubeSpinner');
            ytSpinner.innerHTML = YouTubePlayer.spinnerHTML;
            divWrapper.appendChild(ytSpinner)

            divWrapper.classList.add('divWrapper');

            targetDomElement.appendChild(divWrapper);

            customGUIContainer.appendChild(youtubePlayer.domElement);
        }

        const authorSpanEl = youtubePlayer.domElement.querySelector('.youtubeAuthor');
        const subscribeButtonEl = youtubePlayer.domElement.querySelector('.youtubeSubscribe');
        const spinnerEl = youtubePlayer.domElement.querySelector('.youtubeSpinner');

        YouTubePlayer.loadVideo('YTPlayerHolder', id, authorSpanEl, subscribeButtonEl,spinnerEl);

        youtubePlayer.domElement.style.visibility = 'visible';
        youtubePlayer.domElement.style.left = '50%';
        youtubePlayer.domElement.style.top = '50%';
        youtubePlayer.domElement.style.transform = 'translate(-50%, -50%)';
    }

    this.hideYouTubePlayer = function(){
        youtubePlayer.domElement.style.visibility = 'hidden';
        YouTubePlayer.stopVideo();
    }

    this.FILTER_SORT_MOSTPLAYED = "mostplayed";
    this.FILTER_SORT_BEST = "best";
    this.FILTER_SORT_NEWEST = "newest";
    this.FILTER_SORT_OLDEST = "oldest";

    this.FILTER_RANGE_TODAY = "today";
    this.FILTER_RANGE_THISWEEK = "week";
    this.FILTER_RANGE_THISMONTH = "month";
    this.FILTER_RANGE_ANYTIME = "anytime";
}
export var ui = new UIManager();

const shouldShowVoteButton = (up, down, levelData) => {
    const vote = BackendCache.voteDataCache[levelData.id];

    up.classList.remove('disabled');
    down.classList.remove('disabled');

    if (vote) {
        if (vote > 0) {
            down.classList.add('disabled');
        } else {
            up.classList.add('disabled');
        }
    }
}
