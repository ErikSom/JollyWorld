import '../css/MainMenu.scss'
import '../css/SinglePlayer.scss'
import '../css/LevelBanner.scss'
import '../css/ScrollBar.scss'
import '../css/VehicleSelect.scss'
import '../css/CharacterSelect.scss'
import '../css/SocialShare.scss'
import '../css/LoginScreen.scss'
import '../css/PauseScreen.scss'
import '../css/WinScreen.scss'
import '../css/GameOver.scss'
import '../css/Leaderboard.scss'
import '../css/SettingsMenu.scss'
import '../css/YoutubePlayer.scss'
import '../css/UserPage.scss'
import '../css/DiscordJoin.scss'
import '../css/Shared.scss'
import '../css/flags.css'

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
import SimpleBar from 'simplebar'
import {countries, localize} from '../utils/Localization'

import * as betterLocalStorage from '../utils/LocalStorageWrapper'
import { getModdedPortrait } from '../utils/ModManager'
import { destroyAllAds, getAdContainer, updateDisplayAds } from '../utils/AdManager'
import { generateLobby, updateLobbyUI } from './lobby'
import { adminReturnToLobby, createLobby, LOBBY_STATE, multiplayerState, returnToLobby, selectMultiplayerLevel, sendSimpleMessageAll, startMultiplayer } from '../multiplayer/multiplayerManager'
import { SIMPLE_MESSAGE_TYPES } from '../multiplayer/schemas'

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
let singlePlayer;
let discordButton;
let gameOver;
let levelLoader;
let levelBanner;
let adContainer;
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
let leaderboard;
let userPage;
let smallLogo;
let inGameRetryButton;
let inGamePauseButton;
let skipTutorial;
let discordJoin;

let lastSearch = '';
let initialLevelBatch = [];

function UIManager() {

    var self = this;

    this.showMainMenu = () =>{
        if(!mainMenu){
            const htmlStructure = /*html*/`
                <div class="header">
                    <div class="settings"></div>
                    <div class="logo"></div>
                    <div class="audio"></div>
                </div>
                <div class="menu-grid">
                    <div class="singleplayer-but h2 v2"><span>${localize('mainmenu_singleplayer')}<span></div>
                    <div class="characters-but h1 v1"><span>${localize('mainmenu_characters')}</span><div class="character-image"></div></div>
                    <div class="discord-but h1 v1"><span>${localize('mainmenu_signup')}</span></div>
                    <div class="multiplayer-but h2 v2"><span>${localize('mainmenu_multiplayer')}<span></div>
                    <div class="editor-but h2 v1"><span>${localize('mainmenu_createlevels')}</span><span class="available-pc">${localize('mainmenu_availablepc')}</span></div>
                </div>
                <div class="multiplayer-menu-grid">
                    <div class="quick-play-but h1 v1"><span>${localize('mainmenu_quickplay')}<span></div>
                    <div class="create-game-but h1 v1"><span>${localize('mainmenu_creategame')}</span></div>
                    <div class="back-but h2 v1"><div class="back-but-button">${localize('levelbanner_back')}</div></div>
                </div>
                <div class="multiplayer-lobby"></div>
                ${this.getFooter()}
            `

            mainMenu = document.createElement('div');
            mainMenu.classList.add('mainmenu');
            mainMenu.innerHTML = htmlStructure;

            const multiPlayerGrid = mainMenu.querySelector('.multiplayer-menu-grid');
            const multiPlayerLobby = mainMenu.querySelector('.multiplayer-lobby');
            multiPlayerLobby.appendChild(generateLobby());

            // header
            const header = mainMenu.querySelector('.header');
            const settings = header.querySelector('.settings');
            settings.onclick = ()=> {
                this.hideCharacterSelect();
                this.showSettingsMenu();
            }

            // buttons main
            const grid = mainMenu.querySelector('.menu-grid');
            const singleplayerBut = grid.querySelector('.singleplayer-but');
            singleplayerBut.onclick = () => {
                this.hideMainMenu();
                game.openSinglePlayer();
            }

            const multiplayerBut = grid.querySelector('.multiplayer-but');
            multiplayerBut.onclick = () => {
                this.setMainMenuActive('multiplayer');
            }

            const editorBut = grid.querySelector('.editor-but');
            if(MobileController.isMobile()){
                editorBut.classList.add('mobile');
            }else{
                editorBut.onclick = ()=> {
                    this.hideMainMenu();
                    game.openEditor();
                }
            }

            const characterSelect = grid.querySelector('.characters-but');
            characterSelect.onclick = ()=> {
                this.hideSettingsMenu();
                this.showCharacterSelect();
            }

            const discordButton = grid.querySelector('.discord-but');
            discordButton.onclick = ()=>{
                if(!backendManager.isLoggedIn()){
                    this.openDiscordOauth();
                } else {
                    this.hideMainMenu();
                    game.openSinglePlayer();
                    this.showUserPage(backendManager.userData.username, 'favorite');
                }
            }

            // buttons multiplayer
            const multiplayerBackButton = multiPlayerGrid.querySelector('.back-but');
            multiplayerBackButton.onclick = () => {
                this.setMainMenuActive('main');
            }

            const joinMultiplayerGameButton = multiPlayerGrid.querySelector('.quick-play-but');

            const makeMultiplayerGameButton = multiPlayerGrid.querySelector('.create-game-but');
            makeMultiplayerGameButton.onclick = () => {
                startMultiplayer();
                createLobby();
                this.setMainMenuActive('lobby');
            }

            // misc
            backendManager.registerListener('login', ()=>this.handleLoginChange());
            backendManager.registerListener('logout', ()=>this.handleLoginChange());
            this.handleLoginChange();

            this.gridOnlyEvenCells = ()=>{
                if(mainMenu.style.display !== 'block') return;

                const gridCell = characterSelect.getBoundingClientRect();
                const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cellGap'));

                const forCellGridWidth = gridCell.width * 4 + gap * 3;
                if(forCellGridWidth < window.innerWidth - (gap * 2)){
                    grid.style.maxWidth = `${forCellGridWidth}px`;
                }else{
                    grid.style.maxWidth = `${gridCell.width * 2 + gap}px`;
                }

                multiPlayerGrid.style.maxWidth = `${gridCell.width * 2 + gap}px`;
            }


            const allButs = [singleplayerBut, editorBut, characterSelect, discordButton, multiplayerBut, joinMultiplayerGameButton, makeMultiplayerGameButton];
            allButs.forEach(el => {
                el.addEventListener('mouseover', () => {
                    const bounds = el.getBoundingClientRect();
                    const targetWidth = bounds.width + 10;
                    const scale = targetWidth / bounds.width;
                    el.style.transform = `scale(${scale})`;
                });
                el.addEventListener('mouseout', () => {
                    el.style.transform = `scale(1.0)`;
                })
            });

            window.addEventListener('resize', this.gridOnlyEvenCells);

            mainMenu.style.visibility = 'hidden';
            setTimeout(() => {
                this.gridOnlyEvenCells();
                mainMenu.style.visibility = 'visible';
            }, 0);

            customGUIContainer.appendChild(mainMenu);

        }


        const header = mainMenu.querySelector('.header');
        const volumeButton = header.querySelector('.audio');
        if(!Settings.sfxOn) volumeButton.classList.add('disabled');

        volumeButton.onclick = ()=>{
            game.toggleMute();
            if(!Settings.sfxOn){
                volumeButton.classList.add('disabled');
            }else{
                volumeButton.classList.remove('disabled');
            }
        }

        this.setMainMenuActive('main');

        this.setMainMenuCharacterImage();

        mainMenu.style.display = 'block';
        this.gridOnlyEvenCells();

    }

    this.setMainMenuActive = menuName => {
        const mainGrid = mainMenu.querySelector('.menu-grid');
        const multiplayerGrid = mainMenu.querySelector('.multiplayer-menu-grid');
        const lobbyHolder = mainMenu.querySelector('.multiplayer-lobby');

        mainGrid.style.display = menuName === 'main' ? 'grid' : 'none';
        multiplayerGrid.style.display = menuName === 'multiplayer' ? 'grid' : 'none'
        lobbyHolder.style.display = menuName === 'lobby' ? 'block' : 'none'

        if(menuName === 'lobby'){
            updateLobbyUI();
        }

    }

    this.hideMainMenu = () => {
        if(mainMenu) mainMenu.style.display = "none";
        this.hideCharacterSelect();
        this.hideSettingsMenu();
    }

    this.getFooter = () => {
        return /*html*/`
        <div class="page-footer">
            <div class="text">
                <div class="rights">JollyWorld © 2021 v${__VERSION__}. All rights reserved.</div>
                <a href="https://jollyworld.app/privacy-policy/" class="privacy">Privacy Policy</a>
                &
                <a href="https://jollyworld.app/terms/" class="terms">TOS</a>
                .
                <a href="mailto:terminarchgames@gmail.com" class="contact">Contact</a>
            </div>
            <div class="social-channels">
                <a href="https://discord.gg/7ZWxBam9Hx" target="_blank" rel="noopener noreferrer" class="jolly-discord"></a>
                ${Settings.onPoki ? '' : `<a href="https://www.youtube.com/channel/UCmwRcywag6sbOmy0nvsflOw" target="_blank" rel="noopener noreferrer" class="jolly-youtube"></a>`}
                ${Settings.onPoki ? '' : `<a href="https://www.facebook.com/jolly.world.game/" target="_blank" rel="noopener noreferrer" class="jolly-facebook"></a>`}
                <a href="https://www.poki.com" target="_blank" rel="noopener noreferrer" class="powered-by-poki"></a>
            </div>
        </div>
        `
    }

    this.showSinglePlayer = init =>{
        if(!singlePlayer){
            const htmlStructure = /*html*/`
                <div class="header">
                    <div class="logo"></div>
                    <div class="buttons">
                        <div class="filters-container">
                            <div class="filters">${localize('mainmenu_filters')}</div>
                            <div class="filters-fold">
                                <div>${localize('mainmenu_onlyfeatured')}</div>
                                <label class="feature-toggle switch">
                                    <input type="checkbox" checked>
                                    <div class="slider round"></div>
                                </label>
                                <div>${localize('mainmenu_sorted')}</div>
                                <label class="checkbox-container best-rated">
                                    <input class="css-checkbox" type="checkbox" >${localize('mainmenu_best_rated')}
                                    <i></i>
                                </label>
                                <label class="checkbox-container most-played">
                                    <input class="css-checkbox" type="checkbox" >${localize('mainmenu_most_played')}
                                    <i></i>
                                </label>
                                <label class="checkbox-container newest checked">
                                    <input class="css-checkbox" type="checkbox" checked>${localize('mainmenu_newest')}
                                    <i></i>
                                </label>
                                <label class="checkbox-container oldest">
                                    <input class="css-checkbox" type="checkbox" >${localize('mainmenu_oldest')}
                                    <i></i>
                                </label>
                                <div>${localize('mainmenu_filters')}</div>
                                <div class="date">
                                    <div class="all button checked">${localize('mainmenu_anytime')}</div>
                                    <div class="month button">${localize('mainmenu_thismonth')}</div>
                                    <div class="week button">${localize('mainmenu_thisweek')}</div>
                                    <div class="today button">${localize('mainmenu_today')}</div>
                                </div>
                                <div class="vehicles">
                                    <div class="all button">${localize('mainmenu_allvehicles')}</div>
                                </div>
                            </div>
                        </div>
                        <div class="search-filter">
                            <div class="search-icon"></div>
                            <input class="search-input">
                        </div>
                        <div class="exit">${localize('editorheader_exit')}</div>
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
                                        <div class="text-level-by">${localize('mainmenu_by')}:</div>
                                        <div class="text-author">Author Name</div>
                                    </div>
                                    <div class="rating">
                                        <div class="bar">
                                            <div class="fill"></div>
                                        </div>
                                        <div class="texts">
                                            <div class="liked">
                                                <div class="like-icon"></div>
                                                <div class="votes">80</div>
                                            </div>
                                            <div class="share">(50%)</div>
                                        </div>
                                    </div>
                                    <div class="tags">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${this.getFooter()}
            `

            singlePlayer = document.createElement('div');
            singlePlayer.classList.add('singleplayer');
            singlePlayer.innerHTML = htmlStructure;

            if(MobileController.isMobile()){
                singlePlayer.classList.add('mobile');
            }

            const header = singlePlayer.querySelector('.header');

            // FILTERS
            const filterContainer = header.querySelector('.filters-container');

            const featureToggle = filterContainer.querySelector('.feature-toggle > input');
            featureToggle.addEventListener('change', ()=>{
                this.reloadSinglePlayerGames();
            });

            const filterButton = filterContainer.querySelector('.filters');

            const setOpenFilters = bool => {
                if(bool){
                    filterContainer.classList.add('open');

                    if(this.filterOpenMouseEvent) return;

                    this.filterOpenMouseEvent = event => {
                        let targetElement = event.target;
                        do {
                            if (targetElement == filterContainer) return;
                            targetElement = targetElement.parentNode;
                        } while (targetElement);
                       // close
                       setOpenFilters(false);
                    };
                    document.addEventListener("click", this.filterOpenMouseEvent);
                }else{
                    filterContainer.classList.remove('open');

                    Array.from(filterContainer.querySelectorAll('.open')).forEach(el => {
                        el.classList.remove('open');
                        Array.from(el.children).forEach(child => {
                            if(child.classList.contains('clicked')){
                                child.classList.remove('clicked');
                            }else{
                                child.style.display = 'none';
                            }
                        })
                    });

                    if(this.filterOpenMouseEvent){
                        document.removeEventListener('click', this.filterOpenMouseEvent);
                        delete this.filterOpenMouseEvent;
                    }
                }
            }

            filterButton.addEventListener('click', ()=>{
                setOpenFilters(!filterContainer.classList.contains('open'));
            })
            //

            // SORT
            const checkBoxes =filterContainer.querySelectorAll('.css-checkbox');
            checkBoxes.forEach(checkBox => {
                checkBox.addEventListener('click', () => {
                    if(!checkBox.checked) return;
                    checkBoxes.forEach(cb => cb.checked = false);
                    checkBox.checked = true;
                    this.reloadSinglePlayerGames();
                });
            });


            // DATES
            const date = filterContainer.querySelector('.date');
    
            const dateButtons = Array.from(date.querySelectorAll('.button'));
            dateButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if(date.classList.contains('open')){
                        const wasChecked = button.classList.contains('checked');
    
                        dateButtons.forEach(but => {
                            but.style.display = 'none';
                            but.classList.remove('clicked');
                            but.classList.remove('checked');
                        });
                        date.classList.remove('open');
                        button.style.display = 'block';
                        button.classList.add('checked');
                        if(!wasChecked) this.reloadSinglePlayerGames();
                    }else{
                        date.classList.add('open');
                        dateButtons.forEach(but => but.style.display = 'block');
                        button.classList.add('clicked');
                    }
                })
            })


            // VEHICLES
            const vehicles = filterContainer.querySelector('.vehicles');
            for(let i = 0; i<=Settings.availableVehicles.length; i++){
                const vehicleFilter = document.createElement('div');
                vehicleFilter.classList.add('button');
                vehicleFilter.setAttribute('title', Settings.availableVehicles[i-1]);
                vehicles.appendChild(vehicleFilter);
                vehicleFilter.style.display = 'none';
                vehicleFilter.style.width = '48px';

                const vehicleIcon = new Image();
                vehicleIcon.src = `assets/images/portraits/${hashName(`mini-vehicle${i}.png`)}`;
                vehicleFilter.appendChild(vehicleIcon);
            }

            const vehicleButtons = Array.from(vehicles.querySelectorAll('.button'));
            vehicleButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if(vehicles.classList.contains('open')){
                        const wasChecked = button.classList.contains('checked');

                        vehicleButtons.forEach(but => {
                            but.style.display = 'none';
                            but.classList.remove('clicked');
                            but.classList.remove('checked');
                        });
                        vehicles.classList.remove('open');
                        button.style.display = 'block';
                        button.classList.add('checked');
                        if(!wasChecked) this.reloadSinglePlayerGames();
                    }else{
                        vehicles.classList.add('open');
                        vehicleButtons.forEach(but => but.style.display = 'block');
                        button.classList.add('clicked');
                    }
                })
            })

            // SEARCH
            const searchInput = header.querySelector('.search-input');

            const shouldSearch = ()=> {
                if(lastSearch !== searchInput.value){
                    this.reloadSinglePlayerGames();
                    lastSearch = searchInput.value;
                }
            }

            searchInput.addEventListener('keydown', e => {
                if(e.key === 'Enter'){
                    searchInput.blur();
                }
            })

            searchInput.addEventListener('focus', ()=> header.classList.add('search-focussed'));
            searchInput.addEventListener('blur', ()=> {
                header.classList.remove('search-focussed');
                shouldSearch();
            });

            const searchIcon = header.querySelector('.search-icon');
            searchIcon.addEventListener('click', () => shouldSearch())

            // EXIT
            const exitButton = header.querySelector('.exit');
            exitButton.addEventListener('click', () =>{
                if(game.gameState === game.GAMESTATE_MULTIPLAYER_LEVELSELECT){
                    game.openMainMenu();
                    game.gameState = game.GAMESTATE_LOBBY;
                    game.ui.setMainMenuActive('lobby');
                }else{
                    game.openMainMenu();
                }
            });

            // if(backendManager.isLoggedIn()){
            //     const bestFilter = filters.querySelector('.best-filter');
            //     const mostFilter = filters.querySelector('.newest-filter');

            //     bestFilter.classList.remove('checked');
            //     mostFilter.classList.add('checked');
            // }


            if(!MobileController.isMobile()){
                new SimpleBar(singlePlayer.querySelector('.games-scroll'), { autoHide: false, scrollbarMinSize: 100 });
            }

            customGUIContainer.appendChild(singlePlayer);

            singlePlayer.onpointerup = () => {
                if(singlePlayer.classList.contains('inactive')){
                    this.hideLevelBanner();
                    this.hideSocialShareMenu();
                    this.hideSettingsMenu();
                    this.hideCharacterSelect();
                    this.hideVehicleSelect();
                    this.hideYouTubePlayer();

                    if(game.gameState !== game.GAMESTATE_MULTIPLAYER_LEVELSELECT){
                        game.gameState = game.GAMESTATE_MENU;
                    }
                }
            }
        }

        singlePlayer.style.display = 'block';

        if(!init) this.reloadSinglePlayerGames();
    }

    this.makeCountrySelect = country => {
        const flags = country.querySelector('.flags');
        const selectFlag = country.querySelector('.selectflag');

        if(!flags.classList.contains('init')){
            countries.forEach(country=> {
                const flag = document.createElement('div');
                flag.className = `flag fflag fflag-${country.toUpperCase()} ff-lg ff-app`;
                flag.onclick = ()=>{
                    flags.classList.remove('open');

                    selectFlag.className = `flag fflag fflag-${country.toUpperCase()} ff-lg ff-app`;

                    if(Settings.currentCountry !== country){
                        const userData = SaveManager.getLocalUserdata();
                        userData.country = country;
                        SaveManager.updateLocalUserData(userData);
                        window.location.reload();
                    }

                };
                flags.appendChild(flag);
            })
            flags.classList.add('init');
            selectFlag.onclick = ()=>{
                flags.classList.add('open');
                setTimeout(()=>{
                    if(flags) flags.classList.remove('open');
                }, 3000);
            }
        }
        selectFlag.className = `flag fflag fflag-${Settings.currentCountry.toUpperCase()} ff-lg ff-app`;
    }

    this.handleLoginChange = async ()=> {
        const grid = mainMenu.querySelector('.menu-grid');

        // if we can't retrieve userdata quick enough
        if(backendManager.isLoggedIn() && !backendManager.userData){
            setTimeout(this.handleLoginChange, 100);
            return;
        }

        const discordButton = grid.querySelector('.discord-but');
        const discordName = discordButton.querySelector('span');

        if(backendManager.isLoggedIn()){
            discordName.innerText = backendManager.userData.username;
            discordButton.classList.add('loggedIn');
        }else{
            discordName.innerText = localize('mainmenu_signup');
            discordButton.classList.remove('loggedIn');

        }
    }

    this.setLevelDataOnGameTile = (game, levelData) => {
        const thumb = game.querySelector('.thumb');
        const thumbSrc = `${Settings.STATIC}/${levelData.thumb_big_md5}.png`;
        thumb.setAttribute('data-src', thumbSrc);

        const title = game.querySelector('.text-level-name');
        title.innerText = levelData.title;
        const author = game.querySelector('.text-author');
        author.innerText = levelData.author.username;

        const vehicleLabel = game.querySelector('.vehicle-label');
        vehicleLabel.style.backgroundImage = `url(assets/images/portraits/${hashName(`mini-vehicle${levelData.forced_vehicle}.png`)})`;

        const rating = game.querySelector('.rating');
        const likeIcon = rating.querySelector('.like-icon');
        const fillColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-bg-color').split('#')[1];
        likeIcon.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 37.6 36.1' style='enable-background:new 0 0 37.6 36.1' xml:space='preserve'%3E%3Cpath d='M2 20c0-.1 0-.1 0 0C.9 19.2.5 18.2.5 17c0-1.8.7-3 2.2-3.5.6-.3 2.3-.5 5.2-.8H12c-.3-.3-.8-1.4-1.7-3.5 0-.1 0-.1-.1-.2-.8-2.2-1.3-3.6-1.3-4.1 0-1 .2-1.9.5-2.6.2-.4.4-.7.6-1 .4-.4.9-.6 1.4-.6 1.3 0 2.5 1 3.4 3 .2.4.4.8.5 1.1.5.7.7 1.1.8 1.2.5.8 1 1.4 1.6 1.7.8.4 1.8.8 3 1.2 1.3.3 2.2.6 2.8.8 2 .6 3.4 1.8 4 3.6-.1-.8.2-1.3.9-1.4.2-.1.9-.1 2-.1 2.3 0 4 1.3 5.2 3.8 1 2 1.5 4.5 1.5 7.4v.2c0 2-.2 3.8-.7 5.4 0 .1-.1.3-.1.4-.7 2.2-1.9 3.3-3.4 3.3-.1.1-.2.1-.3.1h-.9c-.8 0-1.7-.2-2.8-.6l-2.2-1.1c-1 1.5-2.7 2.8-5.1 3.8-1.9.8-3.9 1.2-5.9 1.4-.3 0-.6 0-.9.1h-.1c-.3 0-.8 0-1.3-.1-1.7-.1-3-.3-3.8-.7-.7-.3-1.3-.7-1.7-1.2-.7-.9-.9-1.6-.9-2.5 0-.5 0-1-.1-1.4-.2-1.3-.8-2.1-1.8-2.6-.8-.3-1.3-.6-1.4-.8-.4-.4-.7-1-.7-1.9 0-.1.1-.5.2-1.2v-.2c.1-.8.2-1.2.2-1.4 0-.2 0-.3-.1-.5-.1-.5-.6-1-1.3-1.5' style='fill:%23${fillColor}'/%3E%3Cpath d='M26.6 20.3c-.1-2.3-.4-3.9.6-5.5 4.6 5.2-4.7 18.2 9 13.7-.7 2.4-1.9 3.3-3.6 3.5-1 .1-2.4 0-3.6-.6-.2 0-1.2-.7-2.4-1.1-1.1 1.4-2.6 2.7-5.1 3.7-1.9.8-3.9 1.2-5.8 1.4-4.1.2-9.3-.4-8.5-5.4 4 3.7 12.5 4.1 16.3.1.7-1.2 3.2-8.3 3.1-9.8m-23 1c-.1-.4-.5-.9-1-1.4 2.3.1 2.2 2 1 3.1 0-1 .1-1 0-1.7M9.1 4.7c0-1.2.2-2.3.9-3.3-.1 3.4 1.8 9.5 4.8 11.1l-.1.1h-2.6c-.1-.5-1-1.7-1.7-3.8-.8-2.2-1.3-3.5-1.3-4.1z' style='opacity:.2'/%3E%3Cpath d='M2 19.8s0-.1 0 0C1 19 .5 18 .5 16.8c0-1.8.7-3 2.2-3.5.6-.3 2.3-.5 5.2-.8H12c-.3-.3-.8-1.4-1.7-3.5 0-.1 0-.1-.1-.2-.8-2.1-1.3-3.5-1.3-4.1 0-1 .2-1.9.5-2.6.2-.4.4-.7.6-1 .4-.4.9-.6 1.4-.6 1.3 0 2.5 1 3.4 3 .2.4.4.8.5 1.1.4.7.6 1.2.6 1.3.5.8 1 1.4 1.6 1.7.8.4 1.8.8 3 1.2 1.3.3 2.2.6 2.8.8 2 .6 3.4 1.8 4 3.6-.1-.8.2-1.3.9-1.4.2-.1.9-.1 2-.1 2.3 0 4 1.3 5.2 3.8 1 2 1.5 4.5 1.5 7.4v.2c0 2-.2 3.8-.7 5.4 0 .1-.1.3-.1.4-.7 2.2-1.9 3.3-3.4 3.3-.1.1-.2.1-.3.1h-.9c-.8 0-1.7-.2-2.8-.6l-2.2-1.1c-1 1.5-2.7 2.8-5.1 3.8-1.9.8-3.9 1.2-5.9 1.4-.3 0-.6 0-.9.1h-.1c-.3 0-.8 0-1.3-.1-1.7-.1-3-.3-3.8-.7-.7-.3-1.3-.7-1.7-1.2-.5-.9-.7-1.7-.7-2.6 0-.5 0-1-.1-1.4-.2-1.3-.8-2.1-1.8-2.6-.8-.3-1.3-.6-1.4-.8-.4-.4-.7-1-.7-1.9 0-.1.1-.5.2-1.2v-.2c.1-.8.2-1.2.2-1.4 0-.2 0-.3-.1-.5-.1-.5-.6-1-1.3-1.5' style='fill:none;stroke:%23000;stroke-miterlimit:10'/%3E%3Cpath d='M10.2 27.5c-.3 0-.5-.1-.6-.3-.1-.1-.1-.2-.1-.4 0-.4 1.2-1 3.6-1.9.1 0 .1-.1.2-.1 2.2-.8 3.4-.7 3.4.2 0 .3-.2.6-.6.6-1 .2-1.8.4-2.3.6 0 0-.1 0-.2.1-.2.1-.7.3-1.5.6-1.1.5-1.7.6-1.9.6m5-8.2c-.3 0-1.2.2-2.7.4 0 0-.3.1-.8.2h-.1c-.1 0-.2 0-.3.1-.9.2-1.5.2-1.8.2-.2 0-.4 0-.5-.1-.3-.1-.5-.3-.5-.6s.8-.6 2.4-.9c.4-.1.8-.1 1.2-.2 2.4-.3 3.6-.2 3.6.5-.1.2-.3.3-.5.4z'/%3E%3C/svg%3E")`;

        const sumVotes = levelData.upvotes + levelData.downvotes;
        const votes = rating.querySelector('.votes');
        votes.innerText = "??";

        const share = rating.querySelector('.share');
        share.innerText = '';
        const fill = rating.querySelector('.fill');
        fill.style.width = '0%';

        if(sumVotes>Settings.minlevelVotes){
            votes.innerText = format.formatNumber(sumVotes);
            const voteScore = Math.round((levelData.upvotes / sumVotes) * 100);
            fill.style.width = `${voteScore}%`;
            share.innerText = `${voteScore}%`;
        }


        // const tags = game.querySelector('.tags');
    }

    this.determineSinglePlayerFilter = ()=>{
        const filters = singlePlayer.querySelector('.filters-fold')
        const featured = filters.querySelector('.feature-toggle > input').checked;
        const vehicleFilters = filters.querySelector('.vehicles');

        let search = singlePlayer.querySelector('.search-input').value;

        let sort = '';
        if(filters.querySelector('.most-played > input').checked) sort = this.FILTER_SORT_MOSTPLAYED;
        if(filters.querySelector('.best-rated > input').checked) sort = this.FILTER_SORT_BEST;
        if(filters.querySelector('.newest > input').checked) sort = this.FILTER_SORT_NEWEST;
        if(filters.querySelector('.oldest > input').checked) sort = this.FILTER_SORT_OLDEST;

        let range = '';
        if(filters.querySelector('.all').classList.contains('checked')) range = this.FILTER_RANGE_ANYTIME;
        if(filters.querySelector('.month').classList.contains('checked')) range = this.FILTER_RANGE_THISMONTH;
        if(filters.querySelector('.week').classList.contains('checked')) range = this.FILTER_RANGE_THISWEEK;
        if(filters.querySelector('.today').classList.contains('checked')) range = this.FILTER_RANGE_TODAY;

        let vehicle = '';
        const checkedVehicleFilter = vehicleFilters.querySelector('.checked');
        if(checkedVehicleFilter && !checkedVehicleFilter.classList.contains('all')){
            vehicle = Array.from(vehicleFilters.children).indexOf(checkedVehicleFilter) - 1;
        }

        return {
            search,
            featured,
            sort,
            range,
            vehicle
        }
    }
    this.reloadSinglePlayerGames = ()=>{
        const games = singlePlayer.querySelector('.games');

        while(games.children.length>1){
            games.removeChild(games.children[1]);
        }

        const gameTemplate = singlePlayer.querySelector('.game-template');

        const filter = this.determineSinglePlayerFilter();
        backendManager.getPublishedLevels(filter).then(levels => {
            if(initialLevelBatch.length === 0){
                initialLevelBatch = levels;
            }
            levels.forEach( level => {

                const game = gameTemplate.cloneNode(true)
                game.style.display = 'block';
                game.classList.remove('game-template')
                this.setLevelDataOnGameTile(game, level);
                games.appendChild(game);

                game.onclick = ()=> this.showLevelBanner(level);

                imageObserver.observe(game);

            })

            while(games.children.length<12){
                games.appendChild(document.createElement('div'))
            }
        })
        gameTemplate.style.display = 'none';
    }

    this.showLevelBanner = levelData => {
        if(!levelBanner){
            const htmlStructure = /*html*/`
                <div class="level-info">
                    <div class="thumb"> </div>
                    <div class="text-holder">
                        <div class="text-level-name">Level Name Goes Here</div>
                        <div class="level-author">
                            <div class="text-level-by">${localize('mainmenu_by')}:</div>
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
                        ${localize('levelbanner_share')}
                    </div>
                    <div class="save">
                        <div class="heart-icon"></div>
                        ${localize('levelbanner_favorite')}
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
                <div class="gameinfo-bar">
                    <div class="gameplays">${localize('levelbanner_gameplays')}:<div class="gameplays-text">100000</div></div>
                    <div class="votes">${localize('levelbanner_votes')}:<div class="votes-text">10 (85%)</div></div>
                </div>
                <div class="leaderboard-bar">
                    <div class="header-bar">
                        <div class="text-header">${localize('levelbanner_leaderboard')}</div>
                        <div class="viewall">${localize('levelbanner_viewall')}</div>
                    </div>
                    <div class="entries offcharts">
                        <div class="entry-info">${localize('levelbanner_loading')}</div>
                        <div class="entry entry-template">
                            <div class="position">
                                <div class="profile"></div>
                                <div class="text-position">1st</div>
                            </div>
                            <div class="text-player-name">Smerik</div>
                            <div class="time">
                                <div class="text-time-label">${localize('levelbanner_time')}:</div>
                                <div class="text-time">01:38</div>
                                <div class="text-time-mili">456</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="jollyvideo">
                    <div class="jollyvideo-logo"></div>
                    <div class="videos">
                        <div class="video video-template">
                            <div class="play-button"></div>
                        </div>
                    </div>
                </div>
                <div class="nav-buttons">
                    <div class="back button">${localize('levelbanner_back')}</div>
                    <div class="play button">
                        <div class="text-play">${localize('levelbanner_play')}</div>
                        <div class="progress"></div>
                    </div>
                </div>
            `;

            levelBanner = document.createElement('div');
            levelBanner.classList.add('levelbanner');
            levelBanner.innerHTML = htmlStructure;

            if(!Settings.disableAds && !Settings.onPoki){
                levelBanner.classList.add('showAds');
            }

            const authorButton = levelBanner.querySelector('.text-author');
            authorButton.onclick = ()=>{
                this.showUserPage(authorButton.innerText, 'games');
            }

            const navButtons = levelBanner.querySelector('.nav-buttons');
            const backButton = navButtons.querySelector('.back');
            backButton.onclick = ()=>{
                if(!Settings.onPoki) history.replaceState({}, 'JollyWorld', '/');
                this.hideLevelBanner();
            }
            customGUIContainer.appendChild(levelBanner);
        }

        this.showAdContainer();

        levelBanner.style.display = 'block';
        singlePlayer.classList.add('inactive');

        const navButtons = levelBanner.querySelector('.nav-buttons');
        const playButton = navButtons.querySelector('.play');
        const playButtonText = playButton.querySelector('.text-play');


        if(game.gameState === game.GAMESTATE_MULTIPLAYER_LEVELSELECT){
            playButtonText.innerText = localize('levelbanner_select');
            playButton.onclick = () => {
                selectMultiplayerLevel(levelData);

                game.openMainMenu();
                game.gameState = game.GAMESTATE_LOBBY;
                game.ui.setMainMenuActive('lobby');
            }
        }else{
            playButtonText.innerText = localize('levelbanner_play');
            const playLevelFunction = () => {
                if (game.gameState != game.GAMESTATE_MENU) return;
                game.gameState = game.GAMESTATE_LOADINGDATA;

                playButton.classList.add('loading');

                playButtonText.innerText = 'Loading';

                const progressBar = playButton.querySelector('.progress');
                const progressFunction = progress => {
                    progress = Math.max(0, Math.min(1, progress));
                    const progressRounded = (progress*100).toFixed(2);
                    progressBar.style.width = `${progressRounded}%`;
                }

                const finishLoading = ()=>{
                    playButton.classList.remove('loading');
                    playButtonText.innerText = localize('levelbanner_play');
                }

                game.loadPublishedLevelData(levelData, progressFunction).then(() => {
                    this.hideLevelBanner();
                    if(levelData.forced_vehicle){
                        game.selectedVehicle = levelData.forced_vehicle;
                        this.playLevelFromSinglePlayer();
                    }else{
                        this.showVehicleSelect();
                    }
                    finishLoading();
                }).catch(error => {
                    finishLoading();
                });
            }
            playButton.onclick = playLevelFunction;
        }

        const socialBar = levelBanner.querySelector('.social-bar');
        const shareButton = socialBar.querySelector('.share')

        shareButton.onclick = () => this.showSocialShare(levelData);

        document.title = 'JollyWorld - '+levelData.title;
        if(!Settings.onPoki) history.replaceState({}, document.title, `?lvl=${levelData.id}`);
        else PokiSDK.shareableURL({lvl:levelData.id}).catch(err=>{});

        const voteButtons = levelBanner.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        shouldShowVoteButton(voteUpButton, voteDownButton, levelData);


        const heartButton = socialBar.querySelector('.save');
        this.enableHeartButton(heartButton, levelData);

        const leaderboardBar = levelBanner.querySelector('.leaderboard-bar');

        const showAllButton = leaderboardBar.querySelector('.viewall')
        showAllButton.onclick = ()=> this.showLeaderboard(levelData);

        this.fillLeaderboard(leaderboardBar, levelData.id, 3);

        this.enableVoteButtons(voteUpButton, voteDownButton, levelData);

        this.setLevelBannerData(levelData);
    }

    this.showAdContainer = () => {
        if(!adContainer){
            adContainer = getAdContainer();
            customGUIContainer.appendChild(adContainer);
        }

        adContainer.style.display = 'block';
        adContainer.classList.add('active');
        updateDisplayAds();

    }

    this.hideAdContainer = () => {
        if(adContainer){
            adContainer.style.display = 'none';
            adContainer.classList.remove('active');

            destroyAllAds();
        }
    }

    this.showUserPage = (username, defaultChecked) => {
        if(!userPage){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">
                    <div class="userinfo">
                        <div class="username">Smerik</div>
                        <div class="membersince"><span>${localize('userpage_membersince')}:</span><span class="value">?</span></div>
                    </div>
                    <div class="flair">
                        <div class="gamespublished"><span>${localize('userpage_levelspublished')}:</span><span class="value">?</span></div>
                        <div class="gamesaveragerating"><span>${localize('userpage_averagerating')}:</span><span class="value">?</span></div>
                        <div class="gamesfeatured"><span>${localize('userpage_levelsfeatured')}:</span><span class="value">?</span></div>
                        <div class="gamestotalgameplays"><span>${localize('userpage_totalgameplays')}:</span><span class="value">?</span></div>
                    </div>
                    <div class="nav-buttons">
                        <div class="logout button">${localize('editorheader_logout')}</div>
                        <div class="back button">${localize('levelbanner_back')}</div>
                    </div>
                </div>
                <div class="titlebar">
                    <div class="toggletitle"><span>${localize('userpage_levels')}</span></div>
                    <div class="togglebuttons">
                        <div class="games checked">${localize('userpage_levels')}</div>
                        <div class="favorites">${localize('userpage_favorites')}</div>
                    </div>
                </div>
                <div class = "games-scroll">
                    <div class="gamesholder">
                    </div>
                </div>
            `;

            userPage = document.createElement('div');
            userPage.classList.add('userPage');
            userPage.innerHTML = htmlStructure;

            // const simpleBar = new SimpleBar(userPage.querySelector('.games-scroll'), { autoHide: false });
            // console.log(simpleBar);

            const navButtons = userPage.querySelector('.nav-buttons');
            const backButton = navButtons.querySelector('.back');
            backButton.onclick = ()=>{
                if(!Settings.onPoki) history.replaceState({}, 'JollyWorld', '/');
                this.hideUserPage();
            }

            const logoutButton = navButtons.querySelector('.logout');
            logoutButton.onclick = ()=>{
                backendManager.backendSignout();
                logoutButton.style.display = 'none';
            }

            customGUIContainer.appendChild(userPage);
        }


        const toggleTitle = userPage.querySelector('.toggletitle');
        const toggleButtons = userPage.querySelector('.togglebuttons');
        const games = toggleButtons.querySelector('.games');
        const favorites = toggleButtons.querySelector('.favorites');

        games.onclick = ()=>{
            if(!games.classList.contains('.checked')){
                games.classList.add('checked');
                favorites.classList.remove('checked');
                toggleTitle.innerText = localize('userpage_levels')
                this.showUserPage(username);
            }
        }

        favorites.onclick = ()=>{
            if(!favorites.classList.contains('.checked')){
                favorites.classList.add('checked');
                games.classList.remove('checked');
                toggleTitle.innerText = localize('userpage_favorites')
                this.showUserPage(username);
            }
        }

        if(defaultChecked === 'games'){
            favorites.classList.remove('checked');
            games.classList.add('checked');
        } else if(defaultChecked === 'favorite'){
            favorites.classList.add('checked');
            games.classList.remove('checked');
        }

        this.setUserPageInfo(username);

        if(!Settings.onPoki) history.replaceState({}, document.title, `?user=${username}`);

        userPage.parentNode.appendChild(userPage);

        userPage.style.display = 'block';
    }

    this.setUserPageInfo = async username => {

        const header = userPage.querySelector('.header');
        const username_text = header.querySelector('.username');
        const membersince_text = header.querySelector('.membersince  > .value');

        const flair = userPage.querySelector('.flair');
        const gamespublished = flair.querySelector('.gamespublished > .value');
        const gamesaveragerating = flair.querySelector('.gamesaveragerating > .value');
        const gamesfeatured = flair.querySelector('.gamesfeatured > .value');
        const gamestotalgameplays = flair.querySelector('.gamestotalgameplays > .value');

        if(userPage.style.display === 'none'){
            username_text.innerText = "";
            membersince_text.innerText = "?";
            gamespublished.innerText = "?";
            gamesaveragerating.innerText = "?";
            gamesfeatured.innerText = "?";
            gamestotalgameplays.innerText = "?";
        }
        const gamesHolder = userPage.querySelector('.gamesholder');

        while(gamesHolder.children.length>0){
            gamesHolder.removeChild(gamesHolder.children[0]);
        }

        const userData  = await backendManager.getUserProfile(username);

        if(userData){
            username_text.innerText = username;
            membersince_text.innerText = format.formatDMY(userData.created_at);
            gamespublished.innerText = userData.published_levels.length;

            const logoutButton = userPage.querySelector('.logout');
            if(!backendManager.isLoggedIn() || (!backendManager.userData || backendManager.userData.username !== username)){
                logoutButton.style.display = 'none';
            }else{
                logoutButton.style.display = 'block';
            }


            if(userData.published_levels.length > 0){

                let upvotes = 0;
                let downvotes = 0;

                userData.published_levels.forEach( level => {
                    upvotes += level.upvotes;
                    downvotes += level.downvotes;
                })

                const averageRating = upvotes/ (upvotes+downvotes);
                gamesaveragerating.innerText = `${Math.round(averageRating * 100)}%`;
                gamesfeatured.innerText = userData.published_levels.filter(level => level.featured).length;
                gamestotalgameplays.innerText = userData.published_levels.reduce((a, b) => a + b.playcount, 0);
            }else{
                gamesaveragerating.innerText = "-";
                gamesfeatured.innerText = "-";
                gamestotalgameplays.innerText = "-";
            }

            const toggleButtons = userPage.querySelector('.togglebuttons');
            const gamesChecked = toggleButtons.querySelector('.games');

            const gameTemplate = singlePlayer.querySelector('.game-template');
            const targetGames = gamesChecked.classList.contains('checked') ? userData.published_levels : userData.favorite_levels;

            targetGames.forEach( level => {
                const game = gameTemplate.cloneNode(true)
                game.style.display = 'block';
                game.classList.remove('game-template')
                this.setLevelDataOnGameTile(game, level);
                gamesHolder.appendChild(game);
                game.onclick = ()=> {
                    this.hideUserPage();
                    this.showLevelBanner(level);
                }
                imageObserver.observe(game);
            });

            while(gamesHolder.children.length<12){
                gamesHolder.appendChild(document.createElement('div'))
            }

        }else{
            username_text.innerText = 'unknown user';
        }

        new SimpleBar(userPage.querySelector('.games-scroll'), { autoHide: false, scrollbarMinSize: 100 });
    }

    this.hideUserPage = ()=>{
        userPage.style.display = 'none';
    }

    this.fillLeaderboard = async (element, levelid, limit) => {

        const entries = element.querySelector('.entries');
        const template = entries.querySelector('.entry-template');
        template.style.display = 'none';

        const info = entries.querySelector('.entry-info');
        info.innerText = 'Loading...';
        info.style.display = 'block';

        while(entries.children.length>2){
            entries.removeChild(entries.children[2]);
        }

        const promises = [backendManager.getLeaderboardPosition(levelid), backendManager.getLeaderboard(levelid, limit)];
        let [myPosition, leaderboardData] = await Promise.all(promises);
        myPosition = Array.isArray(myPosition) ? myPosition[0] : myPosition;
    
        if(backendManager.isLoggedIn() && !backendManager.userData){
            // if we have not yet retreived the userdata fetch it
            await backendManager.getBackendUserData();
        }

        const inRankings = backendManager.isLoggedIn() && leaderboardData.find(entry => entry.username === backendManager.userData.username);

        entries.classList.remove('offcharts');
        let offcharts = false;
        if(!inRankings && myPosition && myPosition.time !== 0){
            myPosition.username = backendManager.userData.username;
            leaderboardData[limit-1] = myPosition;
            entries.classList.add('offcharts');
            offcharts = true;
        }

        if(!leaderboardData || leaderboardData.length == 0){
            info.innerText = localize('levelbanner_noentries');
        }else{
            info.style.display = 'none';

            leaderboardData.forEach( (entryData, i) => {
                const entry = template.cloneNode(true);
                entry.style.display = 'flex';
                entry.classList.remove('entry-template');
                entry.classList.add('entry');

                const position = entry.querySelector('.text-position');

                if(i<(limit-1) || !offcharts){
                    position.innerText = format.makeOrdinal(i+1);
                }else{
                    position.innerText = entryData.position ? format.makeOrdinal(entryData.position) : '??';
                }

                const username = entry.querySelector('.text-player-name')
                username.innerText = entryData.username;

                username.onclick = ()=>{
                    this.showUserPage(username.innerText, 'games');
                }

                if(backendManager.isLoggedIn() && entryData.username === backendManager.userData.username){
                    entry.classList.add('me');
                }

                const d = format.timeFormat(entryData.time);
                const s = d.hh !== '00' ? `${d.hh}:${d.mm}:${d.ss}.` : `${d.mm}:${d.ss}.`;

                const timeText = entry.querySelector('.text-time');
                timeText.innerText = s;

                const timeTextMili = entry.querySelector('.text-time-mili');
                timeTextMili.innerText = d.ms;

                const profile = entry.querySelector('.profile');

                getModdedPortrait(`profile${entryData.character+1}.png`, 'assets/images/portraits/').then(url => {
                    if(profile) profile.style.backgroundImage = `url(${url})`;;
                });

                entries.appendChild(entry);
            })

        }
    }

    this.showLeaderboard = levelData => {
        if(!leaderboard){
            const htmlStructure = /*html*/`
                <div class="header">${localize('levelbanner_leaderboard')}</div>
                <div class="leaderboard-bar">
                    <div class="entries offcharts">
                        <div class="entry-info">${localize('levelbanner_loading')}</div>
                        <div class="entry entry-template">
                            <div class="position">
                                <div class="profile"></div>
                                <div class="text-position">1st</div>
                            </div>
                            <div class="text-player-name">Smerik</div>
                            <div class="time">
                                <div class="text-time-label">${localize('levelbanner_time')}:</div>
                                <div class="text-time">01:38</div>
                                <div class="text-time-mili">456</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="nav-buttons">
                    <div class="back button">${localize('levelbanner_back')}</div>
                </div>
            `;

            leaderboard = document.createElement('div');
            leaderboard.classList.add('leaderboard');
            leaderboard.innerHTML = htmlStructure;

            const navButtons = leaderboard.querySelector('.nav-buttons');
            const backButton = navButtons.querySelector('.back');
            backButton.onclick = ()=>{
                this.hideLeaderboard();
            }
            customGUIContainer.appendChild(leaderboard);
        }

        leaderboard.style.display = 'block';

        const leaderboardBar = leaderboard.querySelector('.leaderboard-bar');
        this.fillLeaderboard(leaderboardBar, levelData.id, 100);
    }

    this.hideLeaderboard = ()=>{
        leaderboard.style.display = 'none';
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

    this.enableHeartButton = (heart, levelData) => {

        heart.onclick = ()=>{

            if(!backendManager.isLoggedIn()){
                game.ui.showLoginPrompt();
                return;
            }

            if(heart.classList.contains('disabled')){
                heart.classList.remove('faved')
                void heart.offsetWidth;
                heart.classList.add('faved')
                backendManager.favoriteLevel(levelData.id);
                heart.classList.remove('disabled');
            }else{
                backendManager.unfavoriteLevel(levelData.id);
                heart.classList.add('disabled');
            }
        }

        shouldShowHeartButton(heart, levelData);
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

        // game info

        const gameInfoBar = levelBanner.querySelector('.gameinfo-bar');
        const gameplays = gameInfoBar.querySelector('.gameplays-text');
        gameplays.innerText = format.formatNumber(levelData.playcount);

        const sumVotes = levelData.upvotes + levelData.downvotes;
        const rating = levelData.upvotes / sumVotes;

        const votes = gameInfoBar.querySelector('.votes-text');

        if(levelData.upvotes + levelData.downvotes > 0){
            votes.innerText = `${sumVotes} (${Math.round(rating * 100)}%)`;
        } else{
            votes.innerText = `${sumVotes}`;
        }

        // jolly video
        const jollyVideoHolder = levelBanner.querySelector('.jollyvideo');

        if(levelData.youtubelinks && levelData.youtubelinks.length > 0){
            jollyVideoHolder.style.display = 'block';
            const videosDiv = jollyVideoHolder.querySelector('.videos');

            while(videosDiv.children.length>1){
                videosDiv.removeChild(videosDiv.children[1]);
            }

            const videoTemplate = videosDiv.querySelector('.video-template')
            videoTemplate.style.display = 'none';
            levelData.youtubelinks.forEach(ytId => {
                const video = videoTemplate.cloneNode(true)
                video.style.display = 'block';
                video.classList.remove('video-template')
                video.style.backgroundImage = `url(https://i.ytimg.com/vi/${ytId}/mqdefault.jpg)`;

                const playBut = video.querySelector('.play-button');
                playBut.innerHTML = YouTubePlayer.playButtonHTML;

                video.onclick = () => {
                    this.showYouTubePlayer(ytId);
                }

                videosDiv.appendChild(video);
            })
        }else{
            jollyVideoHolder.style.display = 'none';
        }
    }
    this.hideLevelBanner = ()=>{
        if(levelBanner){
            const thumb = levelBanner.querySelector('.thumb');
            thumb.style.backgroundImage = 'none';

            levelBanner.style.display = 'none';
            singlePlayer.classList.remove('inactive');

            this.hideAdContainer();
        }
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

    // this.showSettingsMenuButtons = function(){
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

    this.showInGameButs = function(){
        if(!inGamePauseButton){
            const margin = 10;
            inGamePauseButton = new Image();
            inGamePauseButton.src = `assets/images/gui/${hashName(`Pause.png`)}`;
            customGUIContainer.appendChild(inGamePauseButton);
            inGamePauseButton.style = `
                position:absolute;
                top:0;
                right:0;
                margin:${margin}px;
                width: 30px;
                height: 53px;
            `;
            inGamePauseButton.classList.add('simple-button');
            inGamePauseButton.onclick = ()=> {
                if(!game.pause){
                    game.pauseGame();
               } else{
                    game.unpauseGame();
               }
            }

            inGameRetryButton = new Image();
            inGameRetryButton.src = `assets/images/gui/${hashName(`Retry.png`)}`;
            customGUIContainer.appendChild(inGameRetryButton);
            inGameRetryButton.style = `
                position:absolute;
                top:0;
                right:40px;
                margin:${margin}px;
                width: 40px;
                height: 54px;
            `;
            inGameRetryButton.classList.add('simple-button');
            inGameRetryButton.onclick = () => {
                game.resetWorld(true);
            }
        }
        if(inGamePauseButton) inGamePauseButton.style.display = 'block';
        if(inGameRetryButton) inGameRetryButton.style.display = 'block';
    }

    this.hideInGameButs = function(){
        if(inGamePauseButton) inGamePauseButton.style.display = 'none';
        if(inGameRetryButton) inGameRetryButton.style.display = 'none';
    }

    this.showSkipTutorialButton = function(){
        if(!skipTutorial){
            skipTutorial = document.createElement('div');
            skipTutorial.classList.add('back-button');
            skipTutorial.style.position = 'absolute';
            skipTutorial.style.top = '0px';
            skipTutorial.style.right = '0px';
            skipTutorial.style.margin = '10px';
            customGUIContainer.appendChild(skipTutorial);
            skipTutorial.innerHTML = `<span class="fit h2">${localize('tutorial_skip_button')}</span>`;
            skipTutorial.onclick = ()=> {
                game.openMainMenu();
                this.hideWinScreen();
                this.hideSkipTutorialButton();
            }
        }
    }
    this.hideSkipTutorialButton = function(){
        if(skipTutorial){
            skipTutorial.parentNode.removeChild(skipTutorial);
            const userData = SaveManager.getLocalUserdata();
            userData.tutorialFinished = true;
            game.tutorialMode = false;
            if(game.showLevelAfterTutorial){
                this.showLevelBanner(game.showLevelAfterTutorial);
                delete game.showLevelAfterTutorial;
            }
            SaveManager.updateLocalUserData(userData);
        }
        skipTutorial = null;
    }

    this.hide = function () {
        customGUIContainer.style.display = 'none';
    }
    this.show = function () {
        customGUIContainer.style.display = 'block';
    }

    this.hideSinglePlayer = function () {
        if(singlePlayer) singlePlayer.style.display = "none";
        this.hideLevelBanner();
    }

    this.showGameOver = function (time, mili){
        if(!gameOver){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="sun"></div>
                <div class="header">${localize('levelgui_youlose')}</div>
                <div class="time">
                    <div class="text-label">${localize('levelbanner_time')}:</div>
                    <div class="text-time">00:00</div>
                    <div class="text-time-mili">00:00</div>
                </div>
                <div class="buttons">
                    <div class="exit">${localize('editorheader_exit')}</div>
                    <div class="test">${localize('levelgui_exittest')}</div>
                    <div class="reset">${localize('levelgui_reset')}</div>
                    <div class="retry">${localize('levelgui_retry')}</div>
                </div>
                <div class="voting">
                    <div class="vote-down button">
                        <div class="vote-thumb"></div>
                    </div>
                    <div class="vote-up button">
                        <div class="vote-thumb"></div>
                    </div>
                </div>
                <div class="recommendations">
                </div>
            `;

            gameOver = document.createElement('div');
            gameOver.classList.add('gameover');
            gameOver.innerHTML = htmlStructure;

            const buttons = gameOver.querySelector('.buttons');
            const resetButton = buttons.querySelector('.reset');
            resetButton.onclick = () => {
                if(game.gameState == game.GAMESTATE_EDITOR){
                    game.resetWorld();
                }else{
                    // game.openSinglePlayer(game.currentLevelData);
                    if(game.currentLevelData.forced_vehicle){
                        game.resetWorld();
                    } else {
                        this.showVehicleSelect();
                    }
                }
            };
            const retryButton = buttons.querySelector('.retry');
            retryButton.onclick = () => {
                this.hideGameOverMenu();
                game.resetWorld(true);
            };
            const exitButton = buttons.querySelector('.exit');
            exitButton.onclick = () => {
                this.hideGameOverMenu();

                const multiplayerAdmin = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE && multiplayerState.admin;

                if(!multiplayerAdmin){
                    game.openSinglePlayer();
                } else {
                    adminReturnToLobby();
                    returnToLobby();
                }
            };

            const testButton = buttons.querySelector('.test');
            testButton.onclick = () => {
                game.stopTestingWorld();
                this.hideGameOverMenu();
            }

            customGUIContainer.appendChild(gameOver);
        }

        const buttons = gameOver.querySelector('.buttons');
        const exitButton = buttons.querySelector('.exit');
        const testButton = buttons.querySelector('.test');

        const multiplayerAdmin = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE && multiplayerState.admin;

        if(!multiplayerAdmin){
            exitButton.innerText = localize('editorheader_exit');
        } else {
            exitButton.innerText = 'Lobby';
        }


        if(gameOver && game.run) gameOver.style.display = 'block';

        if (game.gameState == game.GAMESTATE_EDITOR) {
            gameOver.classList.add('editor');
        }else{
            gameOver.classList.remove('editor');
        }

        const timeText = gameOver.querySelector('.text-time');
        timeText.innerText = time;
        const miliText = gameOver.querySelector('.text-time-mili');
        miliText.innerText = mili;

        const voteButtons = gameOver.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        shouldShowVoteButton(voteUpButton, voteDownButton, game.currentLevelData);

        this.enableVoteButtons(voteUpButton, voteDownButton, game.currentLevelData);

        this.showRecommendations(gameOver);

        setTimeout(()=>{
            if(gameOver && game.run){
                gameOver.style.opacity = 1;
                AudioManager.playSFX('lose', 0.3, 1.0);
            }
        },
        Settings.gameOverDelay);

    }

    this.hideGameOverMenu = function () {
        if (gameOver && gameOver.style.display == 'block') {
            gameOver.style.display = 'none';
            gameOver.style.opacity = 0;
        }
    }

    this.setSettingsMenuChoice = (element, choice) => {

        const choiceElement = element.querySelector('.choice');

        if(choice){
            choiceElement.classList.add('on');
            choiceElement.classList.remove('off');
            choiceElement.innerText = localize('settings_on');
        }else{
            choiceElement.classList.add('off');
            choiceElement.classList.remove('on');
            choiceElement.innerText = localize('settings_off');
        }

    }

    this.showSettingsMenu = function (){
        if(!settingsMenu){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header"><span class="fit h1">${localize('settings_settings')}</span></div>
                <div class="buttons">
                    <div class="music">${localize('settings_music')}:<div class="choice on">${localize('settings_on')}</div></div>
                    <div class="blood">${localize('settings_blood')}:<div class="choice on">${localize('settings_on')}</div></div>
                    <div class="gore">${localize('settings_gore')}:<div class="choice on">${localize('settings_on')}</div></div>
                    <div class="fullscreen">${localize('settings_fullscreen')}:<div class="choice off">${localize('settings_off')}</div></div>
                    <a class="credits" href="https://jollyworld.app/credits/">${localize('settings_credits')}</a>
                    <div class="consent">${localize('settings_consent')}</div>
                    <div class="modContainer">
                        <div class="mod">${localize('settings_installedmod')}:<div class="modname">none</div></div>
                        <a class="install" href="mod.html">${localize('settings_installmod')}</a>
                    </div>
                    <div class="back">${localize('levelbanner_back')}</div>
                    <div class="country"><div class="selectflag flag fflag ff-lg ff-app"></div><div class="flags"></div></div>
                </div>
            `;

            settingsMenu = document.createElement('div');
            settingsMenu.classList.add('settingsmenu');
            settingsMenu.innerHTML = htmlStructure;

            const buttons = settingsMenu.querySelector('.buttons');

            const musicButton = buttons.querySelector('.music');
            musicButton.onclick = ()=> {
                    const userData = SaveManager.getLocalUserdata();
                    userData.musicOn = !userData.musicOn;
                    SaveManager.updateLocalUserData(userData);
                    this.showSettingsMenu();
            }

            const bloodButton = buttons.querySelector('.blood');
            bloodButton.onclick = ()=> {
                    const userData = SaveManager.getLocalUserdata();
                    userData.bloodOn = !userData.bloodOn;
                    Settings.bloodEnabled = userData.bloodOn;
                    SaveManager.updateLocalUserData(userData);
                    this.showSettingsMenu();
            }

            const goreButton = buttons.querySelector('.gore');
            goreButton.onclick = ()=> {
                    const userData = SaveManager.getLocalUserdata();
                    userData.goreOn = !userData.goreOn;
                    Settings.goreEnabled = userData.goreOn;
                    SaveManager.updateLocalUserData(userData);
                    this.showSettingsMenu();
            }

            const consentButton = buttons.querySelector('.consent');
            consentButton.onclick = ()=>{
                if(window.__tcfapi) window.__tcfapi('displayConsentUi', 2, () => {});
            }

            const backButton = buttons.querySelector('.back');
            backButton.onclick = ()=>{
                this.hideSettingsMenu();
            }
            const fullscreenButton = buttons.querySelector('.fullscreen');
            fullscreenButton.onclick = ()=>{
                MobileController.toggleFullscreen(true);
                this.showSettingsMenu();

                this.setSettingsMenuChoice(fullscreenButton, document.fullscreenElement === null);
            }

            const country = buttons.querySelector('.country');
            this.makeCountrySelect(country);

            customGUIContainer.appendChild(settingsMenu);
        }

        const userData = SaveManager.getLocalUserdata();

        const buttons = settingsMenu.querySelector('.buttons');

        const musicButton = buttons.querySelector('.music');
        this.setSettingsMenuChoice(musicButton, userData.musicOn);

        const bloodButton = buttons.querySelector('.blood');
        this.setSettingsMenuChoice(bloodButton, userData.bloodOn);

        const goreButton = buttons.querySelector('.gore');
        this.setSettingsMenuChoice(goreButton, userData.goreOn);

        const fullscreenButton = buttons.querySelector('.fullscreen');
        this.setSettingsMenuChoice(fullscreenButton, document.fullscreenElement);

        const modKey = betterLocalStorage.getItem('jollyModName');
        const modName = buttons.querySelector('.mod > div');
        modName.innerText = modKey || localize('settings_none');

        settingsMenu.style.display = 'block';
    }
    this.hideSettingsMenu = ()=> {
        if(settingsMenu){
            settingsMenu.style.display = 'none';
        }
    }

    this.showCharacterSelect = function(){
        if(!characterSelect){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header"><span class="fit h1">${localize('characterselect_select_character')}</span></div>
                <div class="characters">
                </div>
                <div class="back button"><span class="fit h2">${localize('levelbanner_back')}</span></div>
            `;

            characterSelect = document.createElement('div');
            characterSelect.classList.add('characterSelect');
            characterSelect.innerHTML = htmlStructure;

            const characters = characterSelect.querySelector('.characters');

            const customOrder = [1,2,3,4,11,16,8,9,10,6,12,15,5,13,7,14];

            let charNames = ["Billy Joel", "Jeroen", "Marique", "Damien", "The Zuck!", "Bob Zombie", "Xenot", "Ronda", "Jack Lee", "Col. Jackson", "Hank", "Mrs. Kat", "Sean Bro", "Crashy", "Brittany", "Machote"]
            const theme = localStorage.getItem('jollyWorldTheme');
            if(theme){
                const themeSettings = JSON.parse(theme);
                if(themeSettings && Array.isArray(themeSettings.charNames) && themeSettings.charNames.length === charNames.length){
                    charNames = themeSettings.charNames;
                }
            }

            for(let i = 0; i<Settings.availableCharacters; i++){
                const portraitHolder = document.createElement('div');
                portraitHolder.style.order = customOrder[i];
                const portrait =  document.createElement('img');

                getModdedPortrait(`character${i+1}.png`, 'assets/images/portraits/').then(url => {
                    console.log(url);
                    if(portrait) portrait.src = url;
                });

                portrait.classList.add('portrait');
                portraitHolder.appendChild(portrait)

                const nameDiv = document.createElement('div');
                nameDiv.classList.add('name');
                nameDiv.innerText = charNames[i];
                portraitHolder.appendChild(nameDiv);

                characters.appendChild(portraitHolder);

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

        const back = characterSelect.querySelector('.back');
        back.onclick = ()=>{
            this.hideCharacterSelect();
        }
    }

    this.hideCharacterSelect = function () {
        if(characterSelect){
            characterSelect.style.display = 'none';
        }
    }

    this.setMainMenuCharacterImage = ()=> {
        const grid = mainMenu.querySelector('.menu-grid');
        const characterSelect = grid.querySelector('.character-image');

        console.log(characterSelect, grid);

        getModdedPortrait(`characterselect${game.selectedCharacter+1}.png`, 'assets/images/portraits/').then(url => {
            console.log("URL:", url);
            if(characterSelect) characterSelect.style.backgroundImage = `url(${url})`;
        })
    }

    this.playLevelFromSinglePlayer = function(delay){

        const multiplayer = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE;

        const continueToGame = ()=>{
            game.preloader.classList.remove('hide');
            setTimeout(()=>{
                this.hideSinglePlayer();
                game.initLevel(game.currentLevelData);
                game.playWorld(true);
                backendManager.increasePlayCountPublishedLevel(game.currentLevelData);

                if(multiplayer){
                    // we want to wait for other players
                    game.run = false;
                    game.gameCamera(true);
                }

                setTimeout(()=>{
                    game.preloader.classList.add('hide');

                    if(multiplayer){
                        sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.PLAYER_FINISHED_LOADING);
                    }

                }, Settings.levelBuildDelayTime);
            }, Settings.levelBuildDelayTime);
        }

        if(multiplayer){
            this.hideMainMenu();
            continueToGame();

            sendSimpleMessageAll(SIMPLE_MESSAGE_TYPES.SELECT_VEHICLE + game.selectedVehicle);

            // send vehicle choice
        }else{
            PokiSDK.commercialBreak().then(
                () => {
                    continueToGame();
                }
            );
        }
    }

    this.showVehicleSelect = function(){
        if(!vehicleSelect){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header"><span class="fit h1">${localize('vehicleselect_select_vehicle')}</span></div>
                <div class="vehicles">
                </div>
                <div class="back button"><span class="fit h2">${localize('levelbanner_back')}</span></div>
            `;

            vehicleSelect = document.createElement('div');
            vehicleSelect.classList.add('vehicleselect');
            vehicleSelect.innerHTML = htmlStructure;

            const vehicles = vehicleSelect.querySelector('.vehicles');

            for(let i = 0; i<Settings.availableVehicles.length; i++){
                const portrait =  document.createElement('img');

                getModdedPortrait(`vehicle${i+1}.png`, 'assets/images/portraits/').then(url => {
                    if(portrait) portrait.src = url;
                });

                portrait.classList.add('portrait');
                vehicles.appendChild(portrait);

                portrait.onclick = () => {
                    if (!game.currentLevelData.forced_vehicle || (i + 1) === game.currentLevelData.forced_vehicle) {
                        game.unpauseGame()
                        this.hideVehicleSelect();
                        this.hideWinScreen();
                        this.hideGameOverMenu();
                        this.hidePauseMenu();
                        game.selectedVehicle = i + 1;
                        this.playLevelFromSinglePlayer();
                    }
                }
                // hide no vehicle
                if(i==2) portrait.style.display = 'none';
            }
            customGUIContainer.appendChild(vehicleSelect);
        }

        vehicleSelect.parentNode.appendChild(vehicleSelect);

        vehicleSelect.style.display = 'block';
        singlePlayer.classList.add('inactive');

        const back = vehicleSelect.querySelector('.back');
        back.onclick = ()=>{
            this.hideVehicleSelect();
            if(game.gameState === game.GAMESTATE_LOADINGDATA){
                game.gameState = game.GAMESTATE_MENU;
                this.showLevelBanner(game.currentLevelData);
            }
        }

        const multiplayer = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE;
        if(multiplayer && game.gameState === game.GAMESTATE_LOADINGDATA){
            back.style.display = 'none';
        } else {
            back.style.display = 'block';
        }
    }

    this.hideVehicleSelect = function () {
        if(vehicleSelect){
            vehicleSelect.style.display = 'none';
        }
    }

    this.showPauseMenu = function(){
        if(!pauseScreen){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">${localize('levelgui_pause')}</div>
                <div class="text-level-name">Level Name Goes Here</div>
                <div class="level-author">
                    <div class="text-level-by">${localize('mainmenu_by')}:</div>
                    <div class="text-author">Author Name</div>
                </div>
                <div class="share">
                    <div class="share-icon"></div>
                    ${localize('levelbanner_share')}
                </div>
                <div class="save">
                    <div class="heart-icon"></div>
                    ${localize('levelbanner_favorite')}
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
                    <div class="reset">${localize('levelgui_reset')}</div>
                    <div class="retry">${localize('levelgui_retry')}</div>
                    <div class="exit">${localize('editorheader_exit')}</div>
                    <div class="resume">${localize('levelgui_resume')}</div>
                </div>
            `;

            pauseScreen = document.createElement('div');
            pauseScreen.classList.add('pausescreen');
            pauseScreen.innerHTML = htmlStructure;

            const buttons = pauseScreen.querySelector('.buttons');
            const resetButton = buttons.querySelector('.reset');
            resetButton.onclick = () => {
                if(game.currentLevelData.forced_vehicle){
                    game.unpauseGame();
                    game.resetWorld();
                } else {
                    this.showVehicleSelect();
                }
            };
            const retryButton = buttons.querySelector('.retry');
            retryButton.onclick = () => {
                game.unpauseGame();
                game.resetWorld(true);
            };
            const exitButton = buttons.querySelector('.exit');
            exitButton.onclick = () => {
                const multiplayerAdmin = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE && multiplayerState.admin;
                game.unpauseGame();

                if(!multiplayerAdmin){
                    game.openSinglePlayer();
                } else {
                    adminReturnToLobby();
                    returnToLobby();
                }
            };
            const resumeButton = buttons.querySelector('.resume');
            resumeButton.onclick = () => {
                game.unpauseGame();
                PokiSDK.gameplayStart();
                window.pokiGPStart = true;
            };

            customGUIContainer.appendChild(pauseScreen);
        }

        const buttons = pauseScreen.querySelector('.buttons');
        const exitButton = buttons.querySelector('.exit');

        const multiplayerAdmin = multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE && multiplayerState.admin;

        if(!multiplayerAdmin){
            exitButton.innerText = localize('editorheader_exit');
        } else {
            exitButton.innerText = 'Lobby';
        }

        const title = pauseScreen.querySelector('.text-level-name');
        title.innerText = game.currentLevelData.title;
        const author = pauseScreen.querySelector('.text-author');
        author.innerText = game.currentLevelData.author.username;

        const voteButtons = pauseScreen.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        const shareButton = pauseScreen.querySelector('.share');
        shareButton.onclick = () => this.showSocialShare(game.currentLevelData);

        const heartButton = pauseScreen.querySelector('.save');
        this.enableHeartButton(heartButton, game.currentLevelData);

        shouldShowVoteButton(voteUpButton, voteDownButton, game.currentLevelData);

        this.enableVoteButtons(voteUpButton, voteDownButton, game.currentLevelData);

        pauseScreen.style.display = 'block';
    }
    this.hidePauseMenu = function () {
        if(pauseScreen){
            pauseScreen.style.display = 'none';
        }
    }

    this.showWinScreen = function(time, mili){
        if(!winScreen){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="sun"></div>
                <div class="header">${localize('levelgui_youwin')}</div>
                <div class="time">
                    <div class="text-label">${localize('levelbanner_time')}:</div>
                    <div class="text-time">00:00</div>
                    <div class="text-time-mili">00:00</div>
                </div>
                <div class="buttons">
                    <div class="exit">${localize('editorheader_exit')}</div>
                    <div class="test">${localize('levelgui_exittest')}</div>
                    <div class="reset">${localize('levelgui_reset')}</div>
                    <div class="retry">${localize('levelgui_retry')}</div>
                </div>
                <div class="voting">
                    <div class="vote-down button">
                        <div class="vote-thumb"></div>
                    </div>
                    <div class="vote-up button">
                        <div class="vote-thumb"></div>
                    </div>
                </div>
                <div class="recommendations">
                </div>
            `;

            winScreen = document.createElement('div');
            winScreen.classList.add('winscreen');
            winScreen.innerHTML = htmlStructure;

            const buttons = winScreen.querySelector('.buttons');
            const resetButton = buttons.querySelector('.reset');
            resetButton.onclick = () => {
                if(game.currentLevelData.forced_vehicle){
                    game.resetWorld();
                } else {
                    this.showVehicleSelect();
                }
            };
            const retryButton = buttons.querySelector('.retry');
            retryButton.onclick = () => {
                this.hideWinScreen();
                game.resetWorld(true);
            };
            const exitButton = buttons.querySelector('.exit');
            exitButton.onclick = () => {
                const tutorialMode = game.tutorialMode;

                this.hideWinScreen();

                if(tutorialMode){
                    game.openMainMenu();
                } else {
                    game.openSinglePlayer();
                }
            };

            const testButton = buttons.querySelector('.test');
            testButton.onclick = () => {
                game.stopTestingWorld();
                this.hideWinScreen();
            }

            customGUIContainer.appendChild(winScreen);
        }

        const buttons = winScreen.querySelector('.buttons');
        const exitButton = buttons.querySelector('.exit');
        const retryButton = buttons.querySelector('.retry');
        const resetButton = buttons.querySelector('.reset');
        const testButton = buttons.querySelector('.test');
        const header = winScreen.querySelector('.header');

        winScreen.style.display = 'block';

        if(game.tutorialMode){
            retryButton.classList.add('hidden');
            resetButton.classList.add('hidden');
        }else{
            retryButton.classList.remove('hidden');
            resetButton.classList.remove('hidden');
        }

        if (game.gameState == game.GAMESTATE_EDITOR) {
            winScreen.classList.add('editor');
        }else{
            winScreen.classList.remove('editor');
        }

        const timeText = winScreen.querySelector('.text-time');
        timeText.innerText = time;
        const miliText = winScreen.querySelector('.text-time-mili');
        miliText.innerText = mili;


        header.innerText = localize('levelgui_youwin');
        let targetlevel = game.currentLevelData.id;
        setTimeout(()=>{
            if(game.currentLevelData.id !== targetlevel) return;
            backendManager.getLeaderboardPosition(game.currentLevelData.id).then(myPositionData => {
                if(header && header.innerText && Array.isArray(myPositionData)){
                    const rank = myPositionData[0].position;
                    if(rank === 1){
                        header.innerText = `${localize('levelgui_youwin')}🥇`;
                    } else if(rank === 2){
                        header.innerText = `${localize('levelgui_youwin')}🥈`;
                    } else if(rank === 3){
                        header.innerText = `${localize('levelgui_youwin')}🥉`;
                    }
                }
            })
        }, 1000)


        const voteButtons = winScreen.querySelector('.voting');
        const voteUpButton = voteButtons.querySelector('.vote-up');
        const voteDownButton = voteButtons.querySelector('.vote-down');

        shouldShowVoteButton(voteUpButton, voteDownButton, game.currentLevelData);

        this.enableVoteButtons(voteUpButton, voteDownButton, game.currentLevelData);

        this.showRecommendations(winScreen);

        if(game.tutorialMode){
            voteButtons.classList.add('hidden');
        }else{
            voteButtons.classList.remove('hidden');
        }

        AudioManager.playSFX('win', 0.5, 1.0);
    }

    this.hideWinScreen = function () {
        if(winScreen){
            winScreen.style.display = 'none';
            this.hideSkipTutorialButton();
        }
    }

    this.showRecommendations = target => {
        const recommendations = target.querySelector('.recommendations');

        while(recommendations.children.length>0){
            recommendations.removeChild(recommendations.children[0]);
        }

        if((game.tutorialMode || game.gameState === game.GAMESTATE_EDITOR) || multiplayerState.lobbyState !== LOBBY_STATE.OFFLINE){
            recommendations.style.display = 'none'
            return;
        }

        recommendations.style.display = 'flex';

        const gameTemplate = singlePlayer.querySelector('.game-template');

        const levels = [...initialLevelBatch].sort(() => .5 - Math.random()).filter(level => level.id !== game.currentLevelData.id);


        const maxRecommendations = Math.floor((window.innerWidth - 24 ) / (168 + 12));
        const maxLevels = Math.min(levels.length, maxRecommendations);


        let hasAuthorLevel = false;
        for(let i = 0; i<maxLevels; i++){
            if(levels[i].author.username  === game.currentLevelData.author.username){
                hasAuthorLevel = true;
            }
        }

        if(!hasAuthorLevel){
            const authorLevel = levels.find(level => level.author.username === game.currentLevelData.author.username);
            if(authorLevel){
                levels.unshift(authorLevel);
            }
        }

        for(let i = 0; i<maxLevels; i++){
            const recommendedGame = gameTemplate.cloneNode(true)
            recommendedGame.style.display = 'block';
            recommendedGame.classList.remove('game-template')
            const levelData = levels[i];
            this.setLevelDataOnGameTile(recommendedGame, levelData);
            recommendations.appendChild(recommendedGame);
            recommendedGame.onclick = ()=> {
                if (game.gameState === game.GAMESTATE_LOADINGDATA) return;
                game.gameState = game.GAMESTATE_LOADINGDATA;

                target.style.display = 'none';

                this.hideWinScreen();
                game.loadPublishedLevelData(levelData, ()=>{}).then(() => {
                    if(levelData.forced_vehicle){
                        game.selectedVehicle = levelData.forced_vehicle;
                        this.playLevelFromSinglePlayer();
                    }else{
                        this.showVehicleSelect();
                    }
                }).catch(error => {
                    // dafuq
                    target.style.display = 'block';
                });
            }
            imageObserver.observe(recommendedGame);
        }
    }

    this.buildSocialShare = ()=> {
        const htmlStructure = /*html*/`
            <div class="bar"><div class="close"></div></div>
            <div class="header">${localize('share_sharing')}</div>
            <div class="padding">
                <div class="text-level-link">${localize('share_levellink')}</div>
                <div class="copy-url">
                    <input class="text-url" readonly>
                    <div class="copy-button"></div>
                </div>
                <div class="share-by">${localize('share_shareby')}</div>
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

    this.updateSocialShareLinks = async (element, level) => {
        let url = '';
        if(!Settings.onPoki){
            url = encodeURIComponent(`${Settings.GAMEURI}/?lvl=${level.id}`);
        }else {
            url = await PokiSDK.shareableURL({lvl:level.id});
            url = encodeURIComponent(url);
        }
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
            socialShareScreen = this.buildSocialShare();
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
            youtubePlayer = document.createElement('div');
            const closeFunction = ()=>{
                this.hideYouTubePlayer();
            }
            youtubePlayer = this.buildYouTubePlayer(youtubePlayer, closeFunction)
            customGUIContainer.appendChild(youtubePlayer);
        }

        levelBanner.style.visibility = 'hidden';

        this.setYouTubePlayer(youtubePlayer, id);

        youtubePlayer.style.display = 'block';
    }

    this.setYouTubePlayer = (player, id) => {
        const footer = player.querySelector('.footer');
        const author = footer.querySelector('.text-author');
        const subscribe = footer.querySelector('.subscribe-button');
        const spinner = player.querySelector('.spinner');

        YouTubePlayer.loadVideo('YTPlayerHolder', id, author, subscribe,spinner);

        const subscribeButton = footer.querySelector('.subscribe-button');
        subscribeButton.onclick = ()=>{
            const channelID = subscribeButton.getAttribute('yt-channel');
            if(channelID){
                window.open(`https://www.youtube.com/channel/${channelID}?view_as=subscriber&sub_confirmation=1`);
            }
        }
    }

    this.buildYouTubePlayer = function(targetDiv, closeFunction, compact){
        const htmlStructure =
        /*html*/`
        ${compact ? '' : `<div class="bar"><div class="close"></div></div>`}
        <div id="YTPlayerHolder" class="yt-iframe"></div>
        <div class="spinner">
            ${YouTubePlayer.spinnerHTML}
        </div>
        <div class="footer">
            <div class="text-author"></div>
            <div class="subscribe-button">
                ${YouTubePlayer.subscribeButtonHTML}
            </div>
        </div>
        `;

        targetDiv.innerHTML = htmlStructure;

        if(!compact){
            targetDiv.classList.add('youtubeplayer');
            const close = targetDiv.querySelector('.close');
            close.onclick = closeFunction;
        }else{
            targetDiv.classList.add('youtubeplayercompact');
        }


        if(Settings.onPoki){
            const subscribeButton = targetDiv.querySelector('.subscribe-button');
            subscribeButton.style.display = 'none';
        }

        return targetDiv;
    }

    this.hideYouTubePlayer = function(){
        if(youtubePlayer){
            levelBanner.style.visibility = 'visible';
            youtubePlayer.style.display = 'none';
            YouTubePlayer.stopVideo();
        }
    }

    this.showDiscordJoin = function(){
        if(!discordJoin){
            const htmlStructure = /*html*/`
                <div class="bar"></div>
                <div class="header">${localize('discord_getinvolved')}</div>
                <div class="billyDiscord"></div>
                <div class="content">${localize('discord_content')}</div>
                <a href="https://discord.gg/7ZWxBam9Hx" target="_blank" rel="noopener noreferrer" class="discordButton"></a>
                <div class="back button">${localize('levelbanner_back')}</div>
            `;

            discordJoin = document.createElement('div');
            discordJoin.classList.add('discordJoin');
            discordJoin.innerHTML = htmlStructure;


            const billyDiscord = discordJoin.querySelector('.billyDiscord');
            billyDiscord.style.backgroundImage = `url(assets/images/misc/${hashName('jollyDiscord.png')})`

            const discordButton = discordJoin.querySelector('.discordButton');
            discordButton.style.backgroundImage = `url(assets/images/misc/${hashName('discordJoin.png')})`

            const back = discordJoin.querySelector('.back');
            back.onclick = ()=>{
                this.hideDiscordJoin();
            }

            customGUIContainer.appendChild(discordJoin);
        }
        this.hideDiscordJoin = function(){
            if(discordJoin){
                discordJoin.style.display = 'none';
                singlePlayer.classList.remove('inactive');

                // we have shown the discord invite, don't bother again
                const userData = SaveManager.getLocalUserdata();
                userData.discordShown = true;
                SaveManager.updateLocalUserData(userData);
            }
        }

        singlePlayer.classList.add('inactive');

        discordJoin.style.display = 'block';
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

const shouldShowHeartButton = (heart, levelData) => {
    heart.classList.remove('faved');

    const fave = BackendCache.favoriteDataCache[levelData.id];
    if (fave) {
        heart.classList.remove('disabled');
    }else{
        heart.classList.add('disabled');
    }
}
