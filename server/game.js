let fs = require("fs")
let readline = require("readline")

// Load all words into an array
let packWords = {
  base: {
    filename: "./server/words.txt",
    words: []
  },
  duet: {
    filename: "./server/duet-words.txt",
    words: []
  },
  undercover: {
    filename: "./server/undercover-words.txt",
    words: []
  },
  nlss: {
    filename: "./server/nlss-words.txt",
    words: []
  },
  "base-dk": {
    filename: "./server/dk-words.txt",
    words: []
  },
  "base-es": {
    filename: "./server/es-words.txt",
    words: []
  },
  "base-fr": {
    filename: "./server/fr-words.txt",
    words: []
  },
  "base-ru": {
    filename: "./server/ru-words.txt",
    words: []
  },
}

Object.entries(packWords).forEach(([key, val]) => {
  readline
    .createInterface({
      input: fs.createReadStream(val.filename),
      terminal: false
    })
    .on("line", line => {
      val.words.push(line)
    })
})

// Codenames Game
class Game {
  constructor() {
    this.timerAmount = 61 // Default timer value

    this.words = packWords.base.words
    this.packList = ["base", "duet", "undercover", "nlss", "base-dk", "base-es", "base-fr", "base-ru"]
    this.activePacks = {}
    this.packList.forEach(packName => this.activePacks[packName] = false)

    this.activePacks.base = true

    this.init()

    this.red = this.findType("red") // keeps track of unflipped red tiles
    this.blue = this.findType("blue") // keeps track of unflipped blue tiles
  }

  init() {
    this.randomTurn() // When game is created, select red or blue to start, randomly
    this.over = false // Whether or not the game has been won / lost
    this.winner = "" // Winning team
    this.timer = this.timerAmount // Set the timer

    this.board // Init the board
    this.newBoard() // Populate the board
  }

  // Check the number of unflipped team tiles and determine if someone won
  checkWin() {
    this.red = this.findType("red") // unflipped red tiles
    this.blue = this.findType("blue") // unflipped blue tiles
    // Check team winner
    if (this.red === 0) {
      this.over = true
      this.winner = "red"
    }
    if (this.blue === 0) {
      this.over = true
      this.winner = "blue"
    }
  }

  // When called, will change a tiles state to flipped
  flipTile(i, j) {
    if (!this.board[i][j].flipped) {
      let type = this.board[i][j].type // Find the type of tile (red/blue/neutral/death)
      this.board[i][j].flipped = true // Flip tile
      if (type === "death") {
        // If death was flipped, end the game and find winner
        this.over = true
        if (this.turn === "blue") this.winner = "red"
        else this.winner = "blue"
      } else if (type === "neutral") this.switchTurn()
      // Switch turn if neutral was flipped
      else if (type !== this.turn) this.switchTurn() // Switch turn if opposite teams tile was flipped
      this.checkWin() // See if the game is over
    }
  }

  // Find the count of the passed tile type
  findType(type) {
    let count = 0
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        if (this.board[i][j].type === type && !this.board[i][j].flipped) count++
      }
    }
    return count
  }

  // Reset the timer and swap the turn over to the other team
  switchTurn() {
    this.timer = this.timerAmount // Reset timer
    if (this.turn === "blue") this.turn = "red"
    // Swith turn
    else this.turn = "blue"
  }

  // 50% red turn, 50% blue turn
  randomTurn() {
    this.turn = "blue"
    if (Math.random() < 0.5) this.turn = "red"
  }

  // Randomly assigns a death tile and red / blue tiles
  initBoard() {
    let changed = [] // Keep track of tiles that have been givin a type
    let tile = this.randomTile() // Temp tile object that has a random num (0-24) and a coordinate on the grid
    this.board[tile.i][tile.j].type = "death" // Make the first selected tile a death
    changed.push(tile.num) // Add the tiles random num (0-24) to the changed []

    let color = this.turn // First teams color
    for (let i = 0; i < 17; i++) {
      // Set tiles' color 17 times(9 for team1, 8 for team2)
      tile = this.randomTile() // Selected a new random tile
      while (changed.includes(tile.num)) tile = this.randomTile() // If the tile has already been changed, find a new random tile
      this.board[tile.i][tile.j].type = color // Set the tiles color
      changed.push(tile.num) // Add the tiles random num (0-24) to the changed []
      // Swap the temp color for the next added tile
      if (color === "blue") color = "red"
      else color = "blue"
    }
  }

  // Find a random number between 0-24
  // Convert that number to a coordinate on a 5x5 grid (0-4)(0-4)
  // Return an object with the random number and the coordinates
  randomTile() {
    let num = Math.floor(Math.random() * 25)
    let i = Math.floor(num / 5)
    let j = num % 5
    return { num, i, j }
  }

  // Create a new 5x5 board of random words
  newBoard() {
    this.randomTurn() // Pick a new random turn
    this.board = new Array() // Init the board to be a 2d array
    for (let i = 0; i < 5; i++) {
      this.board[i] = new Array()
    }
    let usedWords = [] // Keep track of used words
    let foundWord // Temp var for a word out of the list

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        foundWord = this.words[Math.floor(Math.random() * this.words.length)] // Pick a random word from the pool
        // If the word is already on the board, pick another
        while (usedWords.includes(foundWord)) {
          foundWord = this.words[Math.floor(Math.random() * this.words.length)]
        }
        usedWords.push(foundWord) // Add the word to the used list
        this.board[i][j] = {
          // Add the tile object to the board
          word: foundWord,
          flipped: false,
          type: "neutral"
        }
      }
    }
    this.initBoard() // randomly select the team words and death word

    this.red = this.findType("red") // Update the number of each teams words
    this.blue = this.findType("blue")
  }

  updateWordPool() {
    let pool = []
    Object.keys(this.activePacks).forEach(packName => {
        if (this.activePacks[packName]) pool = pool.concat(packWords[packName].words)
    })
    this.words = pool
  }

  // Debugging purposes
  printBoard() {
    for (let i = 0; i < 5; i++) {
      console.log(
        this.board[i][0].type +
          " | " +
          this.board[i][1].type +
          " | " +
          this.board[i][2].type +
          " | " +
          this.board[i][3].type +
          " | " +
          this.board[i][4].type
      )
    }
  }
}

// Let the main nodejs server know this file exists
module.exports = Game
