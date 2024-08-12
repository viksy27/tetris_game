const PLAYFIELD_COLUMNS = 10
const PLAYFIELD_ROWS = 20
const btnRestart = document.querySelector('.btn-restart')
const scoreElement = document.querySelector('.score')
const bestScoreElement = document.querySelector('.best-score')
const btnUp = document.querySelector('.screen-btn-up')
const btnLeft = document.querySelector('.btn-left')
const btnDown = document.querySelector('.btn-down')
const btnRight = document.querySelector('.btn-right')
const overlay = document.querySelector('.overlay')
const btnNewGame = document.querySelector('.restart')
const audioPlay = document.querySelector('.audio-play')
const audioStop = document.querySelector('.audio-stop')
const audio = new Audio()

let isGameOver = false
let timedId = null
let isPaused = false
let playfield
let tetromino
let score = 0
let bestScore = localStorage.getItem('bestScore') || 0
let clearTime
let seconds = 0
let minutes = 0
let hours = 0
let secs, mins, gethours

bestScoreElement.innerHTML = localStorage.getItem('bestScore') || 0

const TETROMINO_NAMES = [
    'O',
    'J',
    'L',
    'I',
    'S',
    'T',
    'Z'
]

const TETROMINOES = {
    'O': [
        [1,1],
        [1,1]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
    ],
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    'T': [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0]
    ]
}

audio.src = 'fly.mp3'

document.addEventListener("DOMContentLoaded", () => {
  audioControl('play')
})

audioPlay.addEventListener("click", () => audioControl('play'))
audioStop.addEventListener("click", () => audioControl('stop'))
    
function audioControl(type) {
    if (isPaused) {
        return
    }

    return type === 'play' ? audio.play() : audio.pause()
}

function handleVisibilityChange() {
  if ((document.hidden || !document.hasFocus()) && !isPaused) {
    isPaused = true
      stopLoop()
      pauseTime()
      audio.pause()
  } else if (!document.hidden && document.hasFocus() && isPaused && !isGameOver) {
    isPaused = false
      startLoop()
      continueTime()
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);

let cells
init()

function init(){
    score = 0
    scoreElement.innerHTML = 0
    isGameOver = false
    generatePlayField()
    generateTetromino()
    cells = document.querySelectorAll('.grid div')
    moveDown()
}

btnRestart.addEventListener('click', function () { 
    stopTime()
    document.querySelector('.grid').innerHTML = ''
    overlay.style.display = 'none'
    init()
    startWatch()
    audio.play()
})

btnNewGame.addEventListener('click', () => restartGame())

function restartGame() {
    stopTime()
    document.querySelector('.grid').innerHTML = ''
    init()
    startWatch()
    audio.play()
}

function convertPositionToIndex(row, column){
    return row * PLAYFIELD_COLUMNS + column
}

function getRandomItem(arr) {
    return arr[(Math.floor(Math.random() * arr.length))]
}

function countScore(destroyRows){
    switch(destroyRows){
        case 1:
            score += 10;
            break;
        case 2: 
            score += 20;
                break;
        case 3: 
            score += 50;
                break;
        case 4: 
            score += 100;
                break;
    }
    scoreElement.innerHTML = score

    if (score > bestScore) {
        bestScore = score
        bestScoreElement.innerHTML = bestScore
        localStorage.setItem('bestScore', bestScore)
    }
}

function generatePlayField(){
    for(let i = 0; i < PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++){
        const div = document.createElement(`div`)
        document.querySelector('.grid').append(div)
    }

    playfield = new Array(PLAYFIELD_ROWS).fill().map( ()=> new Array(PLAYFIELD_COLUMNS).fill(0) )
}

function generateTetromino(){

    const name   = getRandomItem(TETROMINO_NAMES)
    const matrix = TETROMINOES[name]
    const column = PLAYFIELD_COLUMNS / 2 - Math.floor(matrix.length / 2)
    const rowTetro = -2

    tetromino = {
        name,
        matrix,
        row: rowTetro,
        column: column
    }
}

function placeTetromino(){
    const matrixSize = tetromino.matrix.length
    for(let row = 0; row < matrixSize; row++){
        for(let column = 0; column < matrixSize; column++){
            if(isOutsideOfTopboard(row)){
                isGameOver = true
                return;
            }
            if(tetromino.matrix[row][column]){
                playfield[tetromino.row + row][tetromino.column + column] = tetromino.name
            }
        }
    }

    const filledRows = findFilledRows()
    removeFillRows(filledRows)
    generateTetromino()
    countScore(filledRows.length)
}

function removeFillRows(filledRows){
    for(let i = 0; i < filledRows.length; i++){
        const row = filledRows[i]
        dropRowsAbove(row)
    }
}

function dropRowsAbove(rowDelete){
    for(let row = rowDelete; row > 0; row--){
        playfield[row] = playfield[row - 1]
    }

    playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0)
}

function findFilledRows(){
    const fillRows = []

    for(let row = 0; row < PLAYFIELD_ROWS; row++){
        let filledColumns = 0
        for(let column = 0; column < PLAYFIELD_COLUMNS; column++){
            if(playfield[row][column] != 0){
                filledColumns++
            }
        }

        if(PLAYFIELD_COLUMNS === filledColumns){
            fillRows.push(row)
        }
    }
    return fillRows
}


function drawPlayField(){
    for(let row = 0; row < PLAYFIELD_ROWS; row++){
        for(let column = 0; column < PLAYFIELD_COLUMNS; column++){
            if(playfield[row][column] == 0) continue
            
            const name = playfield[row][column];
            const cellIndex = convertPositionToIndex(row,column);
            cells[cellIndex].classList.add(name)
        }
    }
}

function drawTetromino(){
    const name = tetromino.name
    const tetrominoMatrixSize = tetromino.matrix.length
    
    for(let row = 0; row < tetrominoMatrixSize; row++){
        for(let column = 0; column < tetrominoMatrixSize; column++){
            if(isOutsideOfTopboard(row)) continue
            if(!tetromino.matrix[row][column]) continue
            const cellIndex = convertPositionToIndex(
                tetromino.row + row,
                tetromino.column + column)
            cells[cellIndex].classList.add(name)
        }
    }
}

function draw(){
    cells.forEach(cell => cell.removeAttribute('class'))
    drawPlayField()
    drawTetromino()
}

function rotateTetromino(){
    const oldMatrix = tetromino.matrix;
    const rotatedMatrix = rotateMatrix(tetromino.matrix)
    tetromino.matrix = rotatedMatrix
    if(!isValid()){
        tetromino.matrix = oldMatrix
    }
}

function rotate(){
    rotateTetromino()
    draw()
}

document.addEventListener('keydown', onKeyDown)
function onKeyDown(e){
    if(e.key == 'Escape'){
        togglePauseGame()
    }
    
    if(!isPaused){
        switch(e.key){
            case ' ':
                dropTetrominoDown();
                break;
            case 'ArrowUp':
                rotate();
                break;
            case 'ArrowDown':
                moveTetrominoDown();
                break;
            case 'ArrowLeft':
                moveTetrominoLeft();
                break;
            case 'ArrowRight':
                moveTetrominoRight();
                break;
            }
        }
    draw()
}

function handleClickArrows(clickValue) {
    if(!isPaused){
        switch(clickValue){
            case 'down':
                dropTetrominoDown();
                break;
            case 'up':
                rotate();
                break;
            case 'left':
                moveTetrominoLeft();
                break;
            case 'right':
                moveTetrominoRight();
                break;
            }
        }
    draw()
}

btnUp.addEventListener('click', () => handleClickArrows('up')) 
btnLeft.addEventListener('click', () => handleClickArrows('left')) 
btnDown.addEventListener('click', () => handleClickArrows('down')) 
btnRight.addEventListener('click', () => handleClickArrows('right')) 

function dropTetrominoDown(){
    while(isValid()){
        tetromino.row++
    }
    tetromino.row--
    draw()
}

function rotateMatrix(matrixTetromino){
    const N = matrixTetromino.length
    const rotateMatrix = []
    for(let i = 0; i < N; i++){
        rotateMatrix[i] = [];
        for(let j = 0; j < N; j++){
            rotateMatrix[i][j] = matrixTetromino[N - j - 1][i]
        }
    }
    return rotateMatrix
}

function moveTetrominoDown(){
    tetromino.row += 1
    if(!isValid()){
        tetromino.row -= 1
        placeTetromino()
    }
    startLoop()
}
function moveTetrominoLeft(){
    tetromino.column -= 1
    if(!isValid()){
        tetromino.column += 1
    }
    draw()
}
function moveTetrominoRight() {
    tetromino.column += 1
    if(!isValid()){
        tetromino.column -= 1
    }
    draw()
}

function moveDown(){
    moveTetrominoDown()
    draw()
    stopLoop()
    startLoop()
    if(isGameOver){
        gameOver()
    }
}

function gameOver(){
    stopLoop()
    pauseTime()
    audio.pause()
    overlay.style.display = 'flex'
}

function startLoop(){
    if(!timedId){
        timedId = setTimeout(() => { requestAnimationFrame(moveDown) }, 700)
    }  
}

function stopLoop(){
    cancelAnimationFrame(timedId)
    clearTimeout(timedId)

    timedId = null
}


function togglePauseGame(){
    if(isPaused === false){
        stopLoop()
        pauseTime()
        audio.pause()
    } else {
        startLoop()
        continueTime()
        audio.play()
    }
    isPaused = !isPaused
}

function isValid(){
    const matrixSize = tetromino.matrix.length
    for(let row = 0; row < matrixSize; row++){
        for(let column = 0; column < matrixSize; column++){
            if(isOutsideOfGameboard(row, column)) { return false }
            if(hasCollisions(row, column)) { return false }
        }
    }

    return true
}

function isOutsideOfTopboard(row){
    return tetromino.row + row < 0
}

function isOutsideOfGameboard(row, column){
    return tetromino.matrix[row][column] && 
    (
        tetromino.column + column < 0 
        || tetromino.column + column >= PLAYFIELD_COLUMNS
        || tetromino.row + row >= PLAYFIELD_ROWS
    );
}

function hasCollisions(row, column){
    return tetromino.matrix[row][column] 
    && playfield[tetromino.row + row]?.[tetromino.column + column]
}

function startWatch() {
  if (seconds === 60) {
    seconds = 0
    minutes = minutes + 1
  }

  mins = minutes < 10 ? "0" + minutes + ": " : minutes + ": "

  if (minutes === 60) {
    minutes = 0
    hours = hours + 1
    }
    
  gethours = hours < 10 ? "0" + hours + ": " : hours + ": "
  secs = seconds < 10 ? "0" + seconds : seconds

  let x = document.querySelector(".timer")
  x.innerHTML = gethours + mins + secs

  seconds++

    clearTime = setTimeout("startWatch( )", 1000)
}
 
function stopTime() {
  if (seconds !== 0 || minutes !== 0 || hours !== 0) {
    seconds = 0
    minutes = 0
    hours = 0
    secs = "0" + seconds
    mins = "0" + minutes + ": "
    gethours = "0" + hours + ": "

    let x = document.querySelector(".timer")
    let stopTime = gethours + mins + secs
    x.innerHTML = stopTime

    clearTimeout(clearTime)
  }
}

function continueTime() {
  if (seconds !== 0 || minutes !== 0 || hours !== 0) {
    let x = document.querySelector(".timer")
    let continueTime = gethours + mins + secs
    x.innerHTML = continueTime

    clearTimeout(clearTime);
    clearTime = setTimeout("startWatch( )", 1000)
  }
}

function pauseTime() {
  if (seconds !== 0 || minutes !== 0 || hours !== 0) {
    var x = document.querySelector(".timer")
    var stopTime = gethours + mins + secs
    x.innerHTML = stopTime

    clearTimeout(clearTime)
  }
}

startWatch()