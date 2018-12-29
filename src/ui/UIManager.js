import {
    firebaseManager
} from '../utils/FireBaseManager';
import {
    game
} from '../Game';
import $ from 'jquery';
import * as dat from '../../libs/dat.gui';
import * as uiHelper  from '../b2Editor/utils/uiHelper';
import * as formatTimestamp from '../b2Editor/utils/formatTimestamp';



let levelItemHolder;
let levelItemElement;

let mainMenu;
let gameOver;
let levelLoader;

let filter = {by:"", range:""};

function UIManager() {

    var self = this;

    this.buildMainMenu = function () {
        mainMenu = document.createElement('div');
        mainMenu.setAttribute('id', 'mainMenu')
        document.body.appendChild(mainMenu);

        let button = document.createElement('div');
        button.setAttribute('id', 'startButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Play';
        mainMenu.appendChild(button);

        button.addEventListener("click", () => {
            self.hideMainMenu();
            this.showLevelLoader();
        });

        button = document.createElement('div');
        button.setAttribute('id', 'editorButton')
        button.classList.add('menuButton');
        button.innerHTML = 'Editor';

        button.addEventListener("click", () => {
            self.hideMainMenu();
            game.openEditor();
        });
        mainMenu.appendChild(button);

    }

    this.hideMainMenu = function () {
        mainMenu.style.display = "none";
    }

    this.showGameOver = function () {
        if (!gameOver) {
            gameOver = document.createElement('div');
            gameOver.setAttribute('id', 'gameOverScreen');
            document.body.appendChild(gameOver);

            let textGroup = document.createElement('div');
            textGroup.setAttribute('class', 'textGroup');
            gameOver.appendChild(textGroup);

            let text = document.createElement('div');
            text.setAttribute('class', 'gameOverText');
            text.innerHTML = 'You are dead';
            textGroup.appendChild(text);

            text = document.createElement('div');
            text.setAttribute('class', 'spaceRestartText');
            text.innerHTML = 'Press space to restart';
            textGroup.appendChild(text);

            let buttonGroup = document.createElement('div');
            buttonGroup.setAttribute('class', 'buttonGroup');
            gameOver.appendChild(buttonGroup);

            let button = document.createElement('div');
            button.setAttribute('class', 'headerButton restart buttonOverlay dark');
            button.innerHTML = "RESTART";
            buttonGroup.appendChild(button);

            $(button).click(() => {
                game.resetWorld();
            });

            button = document.createElement('div');
            button.setAttribute('class', 'headerButton exit buttonOverlay dark');
            button.innerHTML = "EXIT";
            buttonGroup.appendChild(button);

            $(button).click(() => {
                game.openMainMenu();
            });
        }
        gameOver.style.display = 'block';
    }
    this.hideGameOverMenu = function () {
        if (gameOver && gameOver.style.display == 'block') {
            gameOver.style.display = 'none';
        }
    }
    this.showLevelLoader = function () {

        if (!levelLoader) {
            const loginGUIWidth = 640;

            levelLoader = new dat.GUI({
                autoPlace: false,
                width: loginGUIWidth
            });
            levelLoader.domElement.setAttribute('id', 'levelLoader');

            let folder = levelLoader.addFolder('Load Screen');
            folder.domElement.classList.add('custom');
            folder.domElement.style.textAlign = 'center';

            folder.open();


            const titleElement = $(levelLoader.domElement).find('.title');
            titleElement.replaceWith(titleElement.clone());

            $(levelLoader.domElement).find('.arrow').hide();


            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            let divWrapper = document.createElement('div');
            divWrapper.setAttribute('id', 'levelList');
            divWrapper.style.padding = '0px 5px';

            targetDomElement.appendChild(divWrapper);

            targetDomElement.appendChild(document.createElement('br'));
            targetDomElement.appendChild(document.createElement('br'));


            document.body.appendChild(levelLoader.domElement);
            levelLoader.domElement.style.position = 'absolute';

        }
        $(levelLoader.domElement).show();

        const levelListDiv = $(levelLoader.domElement).find('#levelList');
        levelListDiv.empty();
        this.generateFilteredPublishLevelList(levelListDiv[0]);

        $(levelLoader.domElement).css('left', '50%');
        $(levelLoader.domElement).css('top', '50%');
        $(levelLoader.domElement).css('transform', 'translate(-50%, -50%)');

    }
    this.hideLevelLoader = function (){
        $(levelLoader.domElement).hide();
    }
    this.generateFilteredPublishLevelList = function(divWrapper){
        if(!filter) filter = {by:this.FILTER_BY_NEWEST, range:this.FILTER_RANGE_ANYTIME};

         //fill here
         var filterBar = document.createElement('div');
         filterBar.setAttribute('class', 'filterBar');


         //Name Filter
         var levelNameFilter = document.createElement('div');
         levelNameFilter.setAttribute('class', 'levelNameFilter');
         filterBar.appendChild(levelNameFilter);

         let filterIcon = document.createElement('div');
         filterIcon.setAttribute('class', 'filterIcon green arrow');
         levelNameFilter.appendChild(filterIcon);

         let span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Title';
         levelNameFilter.appendChild(span);

         //Author Filter
         var levelAuthorFilter = document.createElement('div');
         levelAuthorFilter.setAttribute('class', 'levelAuthorFilter');
         filterBar.appendChild(levelAuthorFilter);

         filterIcon = document.createElement('div');
         filterIcon.setAttribute('class', 'filterIcon green arrow');
         levelAuthorFilter.appendChild(filterIcon);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Author';
         levelAuthorFilter.appendChild(span);

         // Plays Filter
         var levelPlaysFilter = document.createElement('div');
         levelPlaysFilter.setAttribute('class', 'levelPlaysFilter');
         filterBar.appendChild(levelPlaysFilter);

         filterIcon = document.createElement('div');
         filterIcon.setAttribute('class', 'filterIcon green arrow');
         levelPlaysFilter.appendChild(filterIcon);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Plays';
         levelPlaysFilter.appendChild(span);

         // Ratings Filter
         var levelRatingsFilter = document.createElement('div');
         levelRatingsFilter.setAttribute('class', 'levelRatingsFilter');
         filterBar.appendChild(levelRatingsFilter);

         filterIcon = document.createElement('div');
         filterIcon.setAttribute('class', 'filterIcon green arrow');
         levelRatingsFilter.appendChild(filterIcon);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Rating';
         levelRatingsFilter.appendChild(span);

         // Date Filter
         var levelDateFilter = document.createElement('div');
         levelDateFilter.setAttribute('class', 'levelDateFilter');
         filterBar.appendChild(levelDateFilter);

         filterIcon = document.createElement('div');
         filterIcon.setAttribute('class', 'filterIcon green arrow');
         levelDateFilter.appendChild(filterIcon);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Created on';
         levelDateFilter.appendChild(span);

         // Share
         var levelShare = document.createElement('div');
         levelShare.setAttribute('class', 'levelShare');
         filterBar.appendChild(levelShare);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Share';
         levelShare.appendChild(span);

         // Play
         var levelPlay = document.createElement('div');
         levelPlay.setAttribute('class', 'levelPlay');
         filterBar.appendChild(levelPlay);

         span = document.createElement('span');
         span.setAttribute('class', 'filterTitle');
         span.innerText = 'Play';
         levelPlay.appendChild(span);

         levelNameFilter.style.width = '37%';
         levelAuthorFilter.style.width = '12%';
         levelPlaysFilter.style.width = '10%';
         levelRatingsFilter.style.width = '8%';
         levelDateFilter.style.width = '13%';
         levelShare.style.width = '7%';
         levelPlay.style.width = '13%';



         divWrapper.appendChild(filterBar);

         //*********************************/
         // Single item


         //Level Name
         var itemBar = document.createElement('div');
         itemBar.setAttribute('class', 'listPlayModeItem');

         var levelNameDiv = document.createElement('div');
         levelNameDiv.setAttribute('class', 'levelNameDiv');
         itemBar.appendChild(levelNameDiv);

         var thumb = document.createElement('div');
         thumb.setAttribute('class', 'thumb');
         levelNameDiv.appendChild(thumb);

         var thumbImage = new Image();
         thumbImage.setAttribute('id', 'thumbImage');
         thumb.appendChild(thumbImage);

         span = document.createElement('span');
         span.setAttribute('class', 'itemTitle');
         span.innerText = 'Level Title';
         uiHelper.clampDot('.itemTitle', 1, 14);
         levelNameDiv.appendChild(span);

         levelNameDiv.appendChild(document.createElement('br'));

         span = document.createElement('span');
         span.setAttribute('class', 'itemDescription');
         span.innerHTML = 'This is a very tidious text blablabaa and its way to long blabla bla...';
         levelNameDiv.appendChild(span);

         uiHelper.clampDot('.itemDescription', 3, 14);

         //Level Author

         var levelAuthorDiv = document.createElement('div');
         levelAuthorDiv.setAttribute('class', 'levelAuthorDiv');
         itemBar.appendChild(levelAuthorDiv);

         span = document.createElement('span');
         span.setAttribute('class', 'itemAuthor');
         span.innerText = '';
         levelAuthorDiv.appendChild(span);

         //Level Plays

         var levelPlaysDiv = document.createElement('div');
         levelPlaysDiv.setAttribute('class', 'levelPlaysDiv');
         itemBar.appendChild(levelPlaysDiv);

         span = document.createElement('span');
         span.setAttribute('class', 'itemPlays');
         span.innerText = '';
         levelPlaysDiv.appendChild(span);

         //Level Ratings

         var levelRatingsDiv = document.createElement('div');
         levelRatingsDiv.setAttribute('class', 'levelRatingsDiv');
         itemBar.appendChild(levelRatingsDiv);

         span = document.createElement('span');
         span.setAttribute('class', 'itemRating');
         span.innerText = '88% upvote';
         levelRatingsDiv.appendChild(span);

         //Level Date

         var levelDateDiv = document.createElement('div');
         levelDateDiv.setAttribute('class', 'levelDateDiv');
         itemBar.appendChild(levelDateDiv);

         span = document.createElement('span');
         span.setAttribute('class', 'itemDate');
         span.innerText = '18-12-2019';
         levelDateDiv.appendChild(span);

         // Level Share Button

         var levelShareDiv = document.createElement('div');
         levelShareDiv.setAttribute('class', 'levelShareDiv');
         itemBar.appendChild(levelShareDiv);

         let button = document.createElement('div');
         button.setAttribute('class', 'shareIcon');
         levelShareDiv.appendChild(button);

         // Level Play Button

         var levelLoadDiv = document.createElement('div');
         levelLoadDiv.setAttribute('class', 'levelLoadDiv');
         itemBar.appendChild(levelLoadDiv);

         button = document.createElement('div');
         button.setAttribute('class', 'menuButton');
         levelLoadDiv.appendChild(button);

         let playButtonTriangle = document.createElement('div');
         playButtonTriangle.setAttribute('class', 'playButtonTriangleIcon')
         button.appendChild(playButtonTriangle)

         var dotShell = document.createElement('div');
         dotShell.setAttribute('class', 'dot-shell')
         button.appendChild(dotShell);
         var dots = document.createElement('div');
         dots.setAttribute('class', 'dot-pulse')
         dotShell.appendChild(dots);
         $(dotShell).hide();
         //*********************************/

         // Level Load
         let itemList = document.createElement('div');
         itemList.setAttribute('class', 'itemList');
         divWrapper.appendChild(itemList);

         let self = this;

         const buildLevelList = (levels) => {
             for (let level_id in levels) {
                 if (levels.hasOwnProperty(level_id)) {

                     const level = levels[level_id];
                     level.uid = level_id;
                     let $itemBar = $(itemBar).clone();
                     $(itemList).append($itemBar);
                     $itemBar.find('.itemTitle').text(level.private.title);
                     $itemBar.find('.itemDescription').text(level.private.description);
                     $itemBar.find('.itemDate').text(formatTimestamp.formatDMY(level.private.creationDate));
                     $itemBar.find('.itemAuthor').text(level.private.creator);
                     $itemBar.find('#thumbImage')[0].src = firebaseManager.baseDownloadURL + level.private.thumbLowResURL;

                     $itemBar.find('.menuButton').click(()=>{
                        $itemBar.find('.playButtonTriangleIcon').hide();
                        $itemBar.find('.dot-shell').show();
                        game.loadPublishedLevelData(level).then(() => {
                            $itemBar.find('.playButtonTriangleIcon').show();
                            $itemBar.find('.dot-shell').hide();
                            game.runWorld();
                            self.hideLevelLoader();
                        }).catch((error) => {
                            console.log(error);
                            $itemBar.find('.playButtonTriangleIcon').show();
                            $itemBar.find('.dot-shell').hide();
                        });
                     });


                    //  let loadButton = $itemBar.find('.headerButton.save');
                    //  loadButton.on('click', () => {
                    //      const doLevelLoad = () => {
                    //          loadButton[0].style.backgroundColor = 'grey';
                    //          loadButton[0].innerText = 'LOADING..';
                    //          game.loadUserLevelData(levels[level_id]).then(() => {
                    //              loadButton[0].style.backgroundColor = '';
                    //              loadButton[0].innerText = 'LOAD';
                    //              self.hideEditorPanels();
                    //              self.setLevelSpecifics();
                    //          }).catch((error) => {
                    //              loadButton[0].style.backgroundColor = '';
                    //              loadButton[0].innerText = 'LOAD';
                    //          });
                    //      }
                    //      if (game.levelHasChanges()) {
                    //          self.showPrompt(Settings.DEFAULT_TEXTS.unsavedChanges, Settings.DEFAULT_TEXTS.confirm, Settings.DEFAULT_TEXTS.decline).then(() => {
                    //              doLevelLoad();
                    //          }).catch((error) => {});
                    //      } else doLevelLoad();
                    //  });
                 }
             }
         }
         var filter = "tet";
         firebaseManager.getPublishedLevels(filter).then((levels) => {
             buildLevelList(levels);
         })
    }
    this.FILTER_BY_PLAYCOUNT = "PlayCount";
    this.FILTER_BY_RATING = "Rating";
    this.FILTER_BY_NEWEST = "Newest";
    this.FILTER_BY_OLDEST = "Oldest";
    this.FILTER_BY_FEATURED = "Featured";

    this.FILTER_RANGE_TODAY = "Today";
    this.FILTER_RANGE_THISWEEK = "ThisWeek";
    this.FILTER_RANGE_THISMONTH = "ThisMonth";
    this.FILTER_RANGE_ANYTIME = "Anytime";
}
export var ui = new UIManager();