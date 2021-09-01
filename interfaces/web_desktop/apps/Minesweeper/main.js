const Game = {
    width: 10,
    height: 8,
    bombs: 10,
    field: [],
    gameOver: false,
    points: 0,

    colors: {
        0: '#acacac',
        1: '#3178fa',
        2: '#348206',
        3: '#f94340',
        4: '#143b81',
        5: '#7f1e1c',
        6: '#1e807e',
        7: '#000000',
        8: '#808080',
        bomb: '#ee2222',
        "-1": '#ee2222',
    },
    cellSize: 50,

    shouldLog: true,
    message: 'Welcome to Minesweeper!',
    goodMessages: ['Good Work!', 'Fine moviment!', 'Keep this way!'],
    messageFunction: () => {},
    containerElement: document.querySelector('main'),
    canvas: document.querySelector('canvas'),
}

// data methods
function init(){
    initField()
    placeBombs()
    placeNumbers()
    registerEventHandlers()
    setCanvasDimensions()

    function initField(){
        Game.field = new Array(Game.width * Game.height)
        for (let i = 0; i < Game.field.length; i++) {
            Game.field[i] = { 
                value: 0,
                opened: false, 
                marked: false,
            }
        }
    }

    function placeBombs(){
        for (let i = 0; i < Game.bombs; i++) {
            Game.field[i].value = -1 
        }
        Game.field.sort((a, b) => {
            return 0.5 - Math.random()
        })
    }
    
    function placeNumbers(){
        for (let i = 0; i < Game.field.length; i++) {
            if(Game.field[i].value != -1) {
                Game.field[i].value = countBombs(i)
            }
        }
    }

    function registerEventHandlers(){
        Game.canvas.addEventListener('click', function(event){
            handleEvent(event, openCell, Game.messageFunction)
        })
        
        Game.canvas.addEventListener('auxclick', function(event){
            handleEvent(event, toggleMarkCell)
        })
        
        Game.canvas.addEventListener('contextmenu', function(event){
            event.preventDefault()
        })
    }

    function setCanvasDimensions(){
        Game.canvas.width = Game.width * Game.cellSize;
        Game.canvas.height = (Game.height + 1) * Game.cellSize;
    }
}

function countBombs(index){
    let total = 0

    const aroundIndexes = getAroundIndexes(index)
    aroundIndexes.forEach(i => {
        if(hasBombAt(i)) total++
    })

    return total
}

function hasBombAt(index){
    return Game.field[index].value == -1
}

function getAroundIndexes(index){
    const aroundIndexes = []

    // up
    if (index - Game.width >= 0) {
        aroundIndexes.push(index - Game.width)
    }

    // down
    if (index + Game.width < Game.field.length) {
        aroundIndexes.push(index + Game.width)
    }

    // left
    if ((index % Game.width) - 1 >= 0) {
        aroundIndexes.push(index - 1)
    }

    // right
    if ((index % Game.width) + 1 < Game.width) {
        aroundIndexes.push(index + 1)
    }

    // up left
    if (index - Game.width >= 0 && (index % Game.width) - 1 >= 0) {
        aroundIndexes.push(index - Game.width - 1)
    }

    // up right
    if (index - Game.width >= 0 && (index % Game.width) + 1 < Game.width) {
        aroundIndexes.push(index - Game.width + 1)
    }

    // down left
    if (index + Game.width < Game.field.length && (index % Game.width) - 1 >= 0) {
        aroundIndexes.push(index + Game.width - 1)
    }

    // down right
    if (index + Game.width < Game.field.length && (index % Game.width) + 1 < Game.width) {
        aroundIndexes.push(index + Game.width + 1)
    }

    return aroundIndexes
}

function openCell(index) {

    if (Game.field[index].marked || Game.gameOver) {
        return
    }

    if(Game.field[index].opened){
        openAroundCells(index)
        return
    }

    Game.field[index].opened = true

    if(hasBombAt(index)) {
        finishGame()
        return
    }

    if(Game.field[index].value == 0) {
        emitGoodMessage()
        openNonBombAroundCells(index)
    }

    checkWin()

    function openAroundCells(index){
        const numberOfBombs = Game.field[index].value
        if(numberOfBombs == 0) return

        const aroundIndexes = getAroundIndexes(index)

        const markedAroundIndexes = aroundIndexes.filter(i => Game.field[i].marked)
        if(markedAroundIndexes.length == 0) return

        const closedAroundIndexes = aroundIndexes.filter(i => !Game.field[i].opened)
        if(closedAroundIndexes.length == 0) return

        if(markedAroundIndexes.length == numberOfBombs){
            closedAroundIndexes.forEach(i => {
                if(!Game.field[index].marked){
                    openCell(i)
                }
            })
        }
    }

    function openNonBombAroundCells(index){
        const aroundIndexes = getAroundIndexes(parseInt(index))
        aroundIndexes.forEach(i => {
            if (Game.field[i].value != -1) {
                openCell(i)
            }
        })
    }
}

function finishGame(){
    messagePlayer('You lose! Click to play again')
    openAllBombs()
    Game.messageFunction = resetGame
    Game.gameOver = true
}

function emitGoodMessage(){
    const randomIndex = randomInt(0, Game.goodMessages.length)
    const randomGoodMessage = Game.goodMessages[randomIndex]
    messagePlayer(randomGoodMessage)
}

function randomInt(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
}

function openAllBombs(){
    Game.field.forEach((cell, index) => {
        if(hasBombAt(index)){
            cell.opened = true
        }
    })
}

function checkWin () {
    const closedCells = Game.field.filter(cell => {
        return cell.opened == false
    })

    if (closedCells.length == Game.bombs) {
        messagePlayer('You Win! Click to Play again')
        Game.messageFunction = resetGame
        Game.gameOver = true
    }
}

function toggleMarkCell(index){
    if(!Game.gameOver && !Game.field[index].opened)
        Game.field[index].marked = !Game.field[index].marked
}

function resetGame(){
    Game.gameOver = false
    Game.message = 'Minesweeper!'
    Game.messageFunction = function(){}
    init()
}

function calculateIndex(i, j){
    return (i * Game.width) + j
}

function draw(){
    const context = Game.canvas.getContext('2d')
    context.clearRect(0, 0, Game.canvas.width, Game.canvas.height)
    
    drawField(context)
    drawMessageBox(context)

    requestAnimationFrame(() => { draw() })
}

function drawField(context){
    for (let i = 0; i < Game.height; i++) {
        for (let j = 0; j < Game.width; j++) {
            const index = calculateIndex(i, j)
            const x = j * Game.cellSize
            const y = i * Game.cellSize

            if(Game.field[index].opened){
                const symbol = Game.field[index].value;
                const color = Game.colors[symbol]
                drawOpenedCell(context, x, y, Game.cellSize, color, symbol)
            } else {
                drawClosedCell(context, x, y, Game.cellSize, Game.cellSize)
                if(Game.field[index].marked){
                    drawMark(context, x, y, Game.cellSize)
                }
            }
        }
    }
}

function drawClosedCell(context, x, y, width, height){
    const borderThickeness = 6

    drawBackground()
    drawTopBorder()
    drawRightBorder()
    drawBottomBorder()
    drawLeftBorder()

    function drawBackground(){
        context.fillStyle = '#cecece'
        context.fillRect(x, y, width, height)
    }

    function drawTopBorder(){
        context.fillStyle = '#fff';
        context.fillRect(x, y, width - borderThickeness, borderThickeness)
        drawTriangleTopLeft(x + (width - borderThickeness), y)
    }

    function drawRightBorder(){
        context.fillStyle = '#808080';
        context.fillRect(x + (width - borderThickeness), y + borderThickeness, borderThickeness, height - borderThickeness)
        drawTriangleBottomRight(x + width, y + borderThickeness)
    }
    
    function drawBottomBorder(){
        context.fillStyle = '#808080';
        context.fillRect(x + borderThickeness, y + (height - borderThickeness), (width - borderThickeness), borderThickeness)
        drawTriangleBottomRight(x + borderThickeness, y + height)
    }

    function drawLeftBorder(){
        context.fillStyle = '#fff';
        context.fillRect(x, y, borderThickeness, height - borderThickeness)
        drawTriangleTopLeft(x, y + (height - borderThickeness))
    }

    function drawTriangleTopLeft(x, y){
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + borderThickeness, y);
        context.lineTo(x, y + borderThickeness);
        context.fill();
    }

    function drawTriangleBottomRight(x, y){
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - borderThickeness, y);
        context.lineTo(x, y - borderThickeness);
        context.fill();
    }
}

function drawOpenedCell(context, x, y, cellSize, color, symbol){
    const borderThickeness = 1

    drawBorder()
    drawBackground()
    drawSymbol()

    function drawBorder(){
        context.fillStyle = '#808080';
        context.fillRect(x, y, cellSize, cellSize)
    }

    function drawBackground(){
        context.fillStyle = '#acacac';
        context.fillRect(
            x + borderThickeness, 
            y + borderThickeness, 
            cellSize - (2 * borderThickeness), 
            cellSize - (2 * borderThickeness)
        )
    }

    function drawSymbol(){
        const textSize = 25
        const textX = x + (cellSize / 2)
        const textY = y + (cellSize / 2) + 10

        if(symbol == -1){
            symbol = "⦿"
        }

        context.fillStyle = color
        context.font = `bold ${textSize}px Arial`
        context.textAlign = 'center'
        context.fillText(symbol, textX, textY)
    }
}

function drawMark(context, x, y, cellSize){
    const textSize = 25
    const textX = x + (cellSize / 2)
    const textY = y + (cellSize / 2) + 10

    context.fillStyle = '#ee2222'
    context.font = `bold ${textSize}px Arial`
    context.fillText('⊴', textX, textY)
}

function drawMessageBox(context){
    drawClosedCell(context, 0, Game.height * Game.cellSize, Game.width * Game.cellSize, Game.cellSize)
    context.fillStyle = '#555454'
    context.font = 'bold 20px Arial'
    context.textAlign = 'center'
    context.fillText(Game.message, (Game.width * Game.cellSize)/2, (Game.height * Game.cellSize) + 32)
}

function updateSettings(){
    Game.height = parseInt(document.getElementById('rows').value)
    Game.width = parseInt(document.getElementById('columns').value)
    Game.bombs = parseInt(document.getElementById('bombs').value)

    resetGame()
}

function messagePlayer(message){
    Game.message = message
}

function handleEvent(event, cellFunction = (cellIndex) => {}, messageFunction = () => {}){
    event.preventDefault()
    const x = parseInt((event.layerX * Game.width) / event.target.clientWidth)
    const y = parseInt((event.layerY * (Game.height + 1)) / event.target.clientHeight)
    console.log({ x, y })

    if(x < Game.width && y < Game.height){
        const index = calculateIndex(y, x)
        cellFunction(index)
    } else {
        messageFunction()
    }
}

init()
draw()
