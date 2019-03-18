import {
    firebaseManager
} from '../utils/FireBaseManager';
import {
    game
} from '../Game';
import $ from 'jquery';
import * as dat from '../../libs/dat.gui';
import * as uiHelper from '../b2Editor/utils/uiHelper';
import * as formatTimestamp from '../b2Editor/utils/formatTimestamp';

let customGUIContainer = document.getElementById('game-ui-container');

let levelItemHolder;
let levelItemElement;

let mainMenu;
let gameOver;
let levelLoader;
let levelBanner;
let pauseMenu;
let filterMenu;

let filter = {
    by: "",
    range: ""
};

function UIManager() {

    var self = this;

    this.buildMainMenu = function () {
        mainMenu = document.createElement('div');
        mainMenu.setAttribute('id', 'mainMenu')
        customGUIContainer.appendChild(mainMenu);

        let button = document.createElement('div');
        button.setAttribute('class', 'startButton menuButton')
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
    this.hide = function(){
        customGUIContainer.style.display = 'none';
    }
    this.show = function(){
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

            let backButton = document.createElement('div');
            backButton.setAttribute('class', 'backButton menuButton')
            backButton.innerHTML = 'Back';
            targetDomElement.appendChild(backButton);

            $(backButton).click(()=>{
              console.log("GO BACK!");
            })


            let filterButton = document.createElement('div');
            filterButton.setAttribute('class', 'headerButton filterButton save buttonOverlay dark');
            filterButton.innerHTML = `<span>Filter by:</span><span style='color:#00FF00;margin-left:5px'>Featured</span>`;
            targetDomElement.appendChild(filterButton);

            $(filterButton).click(()=>{
                this.showFilterMenu();
            })


            customGUIContainer.appendChild(levelLoader.domElement);
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
    this.hideLevelLoader = function () {
        $(levelLoader.domElement).hide();
    }
    this.showFilterMenu = function () {
        if (!filterMenu) {
            const levelEditGUIWidth = 350;
            filterMenu = new dat.GUI({
                autoPlace: false,
                width: levelEditGUIWidth
            });
            filterMenu.domElement.setAttribute('id', 'filterMenu');

            let folder = filterMenu.addFolder('Filter Menu');
            folder.domElement.classList.add('custom');

            folder.open();

            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            let divWrapper = document.createElement('div');
            divWrapper.style.padding = '20px';
            divWrapper.style.display = 'flex';
            divWrapper.style.flexDirection = 'column';

            let span = document.createElement('span');
            span.innerText = 'Date range:';
            divWrapper.appendChild(span);

            let select = document.createElement('select');

            let option = document.createElement('option');
            option.innerText = 'Today';
            select.appendChild(option);

            option = document.createElement('option');
            option.innerText = 'This week';
            select.appendChild(option);

            option = document.createElement('option');
            option.innerText = 'This month';
            select.appendChild(option);

            option = document.createElement('option');
            option.innerText = 'Anytime';
            select.appendChild(option);

            select.setAttribute('id', 'filter_uploadedselect')
            divWrapper.appendChild(select);


            divWrapper.appendChild(document.createElement('br'));


            span = document.createElement('span');
            span.innerText = 'Sort by:';
            divWrapper.appendChild(span);

            let newestButton = document.createElement('div');
            newestButton.setAttribute('class', 'sortByButton menuButton')
            newestButton.innerHTML = 'Newest';
            divWrapper.appendChild(newestButton);

            $(newestButton).click(()=>{
              console.log("GO BACK!");
            })

            let oldestButton = document.createElement('div');
            oldestButton.setAttribute('class', 'sortByButton menuButton')
            oldestButton.innerHTML = 'Oldest';
            divWrapper.appendChild(oldestButton);

            $(oldestButton).click(()=>{
              console.log("GO BACK!");
            })

            let mostPlayed = document.createElement('div');
            mostPlayed.setAttribute('class', 'sortByButton menuButton')
            mostPlayed.innerHTML = 'Most played';
            divWrapper.appendChild(mostPlayed);

            $(mostPlayed).click(()=>{
              console.log("GO BACK!");
            })

            let bestButton = document.createElement('div');
            bestButton.setAttribute('class', 'sortByButton menuButton')
            bestButton.innerHTML = 'Best';
            divWrapper.appendChild(bestButton);

            $(bestButton).click(()=>{
              console.log("GO BACK!");
            })


            targetDomElement.appendChild(divWrapper);
            customGUIContainer.appendChild(filterMenu.domElement);
            filterMenu.domElement.style.position = 'absolute';


        }
        filterMenu.domElement.style.display = "block";
        // set values

        $(filterMenu.domElement).css('left', '50%');
        $(filterMenu.domElement).css('top', '50%');
        $(filterMenu.domElement).css('transform', 'translate(-50%, -50%)');

    }
    this.hideFilterMenu = function () {
        $(filterMenu.domElement).hide();
    }

    this.showLevelBanner = function () {
        if (!levelBanner) {
            const levelEditGUIWidth = 350;
            levelBanner = new dat.GUI({
                autoPlace: false,
                width: levelEditGUIWidth
            });
            levelBanner.domElement.setAttribute('id', 'levelBanner');

            let folder = levelBanner.addFolder('Level Settings');
            folder.domElement.classList.add('custom');

            folder.open();

            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            let divWrapper = document.createElement('div');
            divWrapper.style.padding = '20px';

            let title = document.createElement('div');
            title.setAttribute('id', 'levelbanner_title');
            divWrapper.appendChild(title);

            let creator = document.createElement('div');
            creator.setAttribute('id', 'levelbanner_creator');

            let span = document.createElement('span');
            span.innerText = 'By:';
            creator.appendChild(span);

            span = document.createElement('span');
            span.innerText = 'Creator';
            span.setAttribute('id', 'levelbanner_creatorSpan')
            creator.appendChild(span);

            divWrapper.appendChild(creator);


            let thumbNail;
            thumbNail = document.createElement('div');
            thumbNail.setAttribute('id', 'levelbanner_levelThumbnail');
            divWrapper.appendChild(thumbNail);

            let thumbNailImage;
            thumbNailImage = new Image();
            thumbNailImage.setAttribute('id', 'levelbanner_levelThumbnailImage');
            thumbNail.appendChild(thumbNailImage);


            let playButton = document.createElement('div');
            playButton.setAttribute('class', 'startButton menuButton')
            playButton.innerHTML = 'Play';
            divWrapper.appendChild(playButton);

            $(playButton).click(()=>{
               this.hideLevelBanner();
               game.playWorld();
            })

            let description = document.createElement('div');
            description.setAttribute('id', 'levelbanner_description');
            divWrapper.appendChild(description);

            targetDomElement.appendChild(divWrapper);
            customGUIContainer.appendChild(levelBanner.domElement);
            levelBanner.domElement.style.position = 'absolute';

            game.editor.ui.registerDragWindow(levelBanner);

        }
        levelBanner.domElement.style.display = "block";
        // set values

        let thumbNailImage = $(levelBanner.domElement).find('#levelbanner_levelThumbnailImage')[0];
        thumbNailImage.src = firebaseManager.baseDownloadURL + game.currentLevelData.thumbHighResURL;

        $(levelBanner.domElement).find('#levelbanner_title').text(game.currentLevelData.title);
        $(levelBanner.domElement).find('#levelbanner_creatorSpan').text(game.currentLevelData.creator);
        $(levelBanner.domElement).find('#levelbanner_description').text(game.currentLevelData.description);

        $(levelBanner.domElement).css('left', '50%');
        $(levelBanner.domElement).css('top', '50%');
        $(levelBanner.domElement).css('transform', 'translate(-50%, -50%)');

    }
    this.hideLevelBanner = function () {
        $(levelBanner.domElement).hide();
    }

    this.showPauseMenu = function () {
        if (!pauseMenu) {
            const levelEditGUIWidth = 350;
            pauseMenu = new dat.GUI({
                autoPlace: false,
                width: levelEditGUIWidth
            });
            pauseMenu.domElement.setAttribute('id', 'pauseMenu');

            let folder = pauseMenu.addFolder('Level Settings');
            folder.domElement.classList.add('custom');

            folder.open();

            var targetDomElement = folder.domElement.getElementsByTagName('ul')[0];

            let divWrapper = document.createElement('div');
            divWrapper.style.padding = '20px';

            let title = document.createElement('div');
            title.setAttribute('id', 'pauseMenu_title');
            divWrapper.appendChild(title);

            let creator = document.createElement('div');
            creator.setAttribute('id', 'pauseMenu_creator');

            let span = document.createElement('span');
            span.innerText = 'By:';
            creator.appendChild(span);

            span = document.createElement('span');
            span.innerText = 'Creator';
            span.setAttribute('id', 'pauseMenu_creatorSpan')
            creator.appendChild(span);

            divWrapper.appendChild(creator);

            let ratingHolder = document.createElement('div');
            ratingHolder.setAttribute('class', 'ratingHolder');
            ratingHolder.setAttribute('id', 'pauseMenu_ratingHolder');
            divWrapper.appendChild(ratingHolder);


            let upvoteButton = document.createElement('div');
            upvoteButton.setAttribute('class', 'startButton menuButton upvote')
            ratingHolder.appendChild(upvoteButton);

            $(upvoteButton).click(()=>{
                console.log('date:', game.currentLevelData.creationDate);
                firebaseManager.voteLevel(game.currentLevelData.uid, 1, game.currentLevelData.creationDate);

                game.editor.ui.showLoginScreen();
            });

            let thumbIcon = document.createElement('div');
            thumbIcon.setAttribute('class', 'thumbsUpIcon');
            upvoteButton.appendChild(thumbIcon);

            let ratingText = document.createElement('div');
            ratingText.setAttribute('class', 'ratingText')
            ratingHolder.appendChild(ratingText);

            span = document.createElement('span');
            span.innerText = '88%';
            span.setAttribute('id', 'pauseMenu_likesPercentSpan');
            ratingText.appendChild(span);

            span = document.createElement('span');
            span.innerText = 'Likes';
            span.setAttribute('id', 'pauseMenu_likesPercentTextSpan');
            ratingText.appendChild(span);

            span = document.createElement('span');
            span.innerText = '999K';
            span.setAttribute('id', 'pauseMenu_likesNumSpan');
            ratingText.appendChild(span);

            span = document.createElement('span');
            span.innerText = 'Voters';
            span.setAttribute('id', 'pauseMenu_likesNumTextSpan');
            ratingText.appendChild(span);

            let downvoteButton = document.createElement('div');
            downvoteButton.setAttribute('class', 'startButton menuButton downvote')
            ratingHolder.appendChild(downvoteButton);

            $(downvoteButton).click(()=>{
                firebaseManager.voteLevel(game.currentLevelData.uid, -1, game.currentLevelData.creationDate);
            });

            thumbIcon = document.createElement('div');
            thumbIcon.setAttribute('class', 'thumbsUpIcon');
            downvoteButton.appendChild(thumbIcon);


            let restartButton = document.createElement('div');
            restartButton.setAttribute('class', 'startButton menuButton')
            restartButton.innerHTML = 'Restart';
            divWrapper.appendChild(restartButton);

            $(restartButton).click(()=>{
               game.resetWorld();
               game.playWorld();
               game.unpauseGame();
            })

            let exitButton = document.createElement('div');
            exitButton.setAttribute('class', 'startButton menuButton')
            exitButton.innerHTML = 'Exit to Menu';
            divWrapper.appendChild(exitButton);

            $(exitButton).click(()=>{
               //game.playWorld();
            })

            let resumeButton = document.createElement('div');
            resumeButton.setAttribute('class', 'startButton menuButton')
            resumeButton.innerHTML = 'Resume';
            divWrapper.appendChild(resumeButton);

            $(resumeButton).click(()=>{
               game.unpauseGame();
            })

            targetDomElement.appendChild(divWrapper);
            customGUIContainer.appendChild(pauseMenu.domElement);
            pauseMenu.domElement.style.position = 'absolute';


        }
        pauseMenu.domElement.style.display = "block";
        // set values


        $(pauseMenu.domElement).find('#pauseMenu_title').text(game.currentLevelData.title);
        $(pauseMenu.domElement).find('#pauseMenu_creatorSpan').text(game.currentLevelData.creator);

        $(pauseMenu.domElement).css('left', '50%');
        $(pauseMenu.domElement).css('top', '50%');
        $(pauseMenu.domElement).css('transform', 'translate(-50%, -50%)');

    }
    this.hidePauseMenu = function () {
        $(pauseMenu.domElement).hide();
    }

    this.generateFilteredPublishLevelList = function (divWrapper) {
        if (!filter) filter = {
            by: this.FILTER_BY_NEWEST,
            range: this.FILTER_RANGE_ANYTIME
        };

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

                    $itemBar.find('.menuButton').click(() => {
                        $itemBar.find('.playButtonTriangleIcon').hide();
                        $itemBar.find('.dot-shell').show();
                        game.loadPublishedLevelData(level).then(() => {
                            $itemBar.find('.playButtonTriangleIcon').show();
                            $itemBar.find('.dot-shell').hide();
                            self.showLevelBanner();
                            game.editor.ui.hide();
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