/*
    M142 Final Project - The Heat Equation
    Coding by Egan Bosch, in collaboration with Isaac Forrest and Edwin Kuffner
    --------------------------------------
    In this program, we use the differential equation for heat to simulate
    the transfer of heat through a 2d plate of material. We include tools
    for the user to add and remove heat, as well as to break and build with
    highly and lowly thermally conductive material for the sake observing
    how heat moves through different constructs.
*/

let GRID_SIZE = 100

// Utility Functions
function* range(...args) {
    let start, end, step;
    if (args.length === 0) return;
    else if (args.length === 1) [start, end, step] = [0, args[0], 1];
    else if (args.length === 2) [start, end, step] = [args[0], args[1], 1];
    else { [start, end, step] = args; }

    for (let i = start; i < end; i += step) yield i;
}

let last_of = (a) => a[a.length - 1];
let loc = (ix, iy) => `${ix},${iy}`

let h = 600 / GRID_SIZE
let speed = 3;
let tempMap = new Map()
let tsize = 20;

let getTemp = (ix, iy) => {
    if (tempMap.has(loc(ix, iy))) return tempMap.get(loc(ix, iy))[0]
    if (tempMap.has(loc(ix + 1, iy))) return tempMap.get(loc(ix + 1, iy))[0] * 0.992
    if (tempMap.has(loc(ix - 1, iy))) return tempMap.get(loc(ix - 1, iy))[0] * 0.992
    if (tempMap.has(loc(ix, iy + 1))) return tempMap.get(loc(ix, iy + 1))[0] * 0.992
    if (tempMap.has(loc(ix, iy - 1))) return tempMap.get(loc(ix, iy - 1))[0] * 0.992
}

let setTemp = (ix, iy, t) => {
    let loctext = loc(ix, iy)
    if (tempMap.has(loctext)) tempMap.set(loctext, [t, tempMap.get(loctext)[1]])
}

//Barebones UI
let buttons = []
let addButton = (x, y, text, colorlambda, clicklambda) => buttons.push([x, y, text, colorlambda, clicklambda]);

let BUILDING = false
let HEATING = true
let MATERIAL = 0
addButton(280, 30, "Build or Break", () => {return [BUILDING ? 150 : 255, BUILDING ? 255 : 150, 200]}, () => {BUILDING = !BUILDING})
addButton(100, 30, "Heat or Cool", () => {return [HEATING ? 150 : 255, HEATING ? 255 : 150, 200]}, () => {HEATING = !HEATING})
addButton(460, 30, "High or Low Conductivity", () => {return [MATERIAL ? 150 : 255, MATERIAL ? 255 : 150, 200]}, () => {MATERIAL = 1 - MATERIAL})

function mouseReleased() {
    for (let button of buttons) {
        let [x, y, button_text, _, clicklambda] = button
        if (mouseX > x && mouseY > y && mouseX < x + textWidth(button_text) + 20 && mouseY < y + tsize * 1.3) {
            clicklambda()
        }
    }
}

// Uses the numerical method: f''(x) = (f(x - h) - 2 * f(x) + f(x + h)) / h^2 + O(h^2)
// This is necessary to calculate the heat equation: df/dt = d^2f/dx^2 + d^2f/dy^2
let doubleDerivative = (ix, iy) => {
    let [ddx, ddy] = [0, 0];
    let tempHere = getTemp(ix, iy)
    
        ddx = (getTemp(ix - 1, iy) - 2 * tempHere + getTemp(ix + 1, iy)) / (h * h)
        ddy = (getTemp(ix, iy - 1) - 2 * tempHere + getTemp(ix, iy + 1)) / (h * h)

    return [ddx, ddy]
}


function setup() {
    createCanvas(800, 800);
    noStroke()

    for (let ix of range(GRID_SIZE)) {
        for (let iy of range(GRID_SIZE)) {
            tempMap.set(loc(ix, iy), [0, 1])
        }
    }
}

var draw = function() {

    // Render the buttons
    background(150, 200, 255)
    textSize(tsize)
    for (let button of buttons) {
        let [x, y, button_text, colorlambda, _] = button
        
        fill(colorlambda())
        rect(x, y, textWidth(button_text) + 20, tsize * 1.3, 10)
        fill(0)
        text(button_text, x + 10, y + tsize)
    }

    // Functionality for heating, cooling, building, and breaking
    if (mouseIsPressed && mouseButton === LEFT) {
        let [ix, iy] = [floor((mouseX - 100) / h), floor((mouseY - 100) / h)]
        for (let dx of range(-3, 3)) {
            for (let dy of range(-3, 3)) {
                let shift = (HEATING ? 1 : -1) * 60 / (1 + dx * dx + dy * dy)
                setTemp(ix + dx, iy + dy, max(0, getTemp(ix + dx, iy + dy) + shift))
            }
        }
    }

    if (mouseIsPressed && mouseButton === RIGHT) {
        let [ix, iy] = [floor((mouseX - 100) / h), floor((mouseY - 100) / h)]

        let r = 4
        for (let dx of range(-r, r)) {
            for (let dy of range(-r, r)) {
                if (dx * dx + dy * dy < r * r && ix + dx >= 0 && ix + dx < GRID_SIZE && iy + dy >= 0 && iy + dy < GRID_SIZE) {
                    if(!BUILDING && tempMap.has(loc(ix + dx, iy + dy))) tempMap.delete(loc(ix + dx, iy + dy))
                    if(BUILDING && !tempMap.has(loc(ix + dx, iy + dy))) tempMap.set(loc(ix + dx, iy + dy), [0, MATERIAL])
                } 
            }
        }
    }

    // Do the temperature shifting, according to the heat equation
    for (let _ of range(speed)) {
        let shifts = new Map();
        for (let ix of range(GRID_SIZE)) {
            for (let iy of range(GRID_SIZE)) {
                if (tempMap.has(loc(ix, iy))) {
                    let [ddx, ddy] = doubleDerivative(ix, iy)
                    let [temp, material] = tempMap.get(loc(ix, iy))
                    setTemp(ix, iy, temp + (ddx + ddy) * (1 + material * 9))
                }
            }
        }
    }
    

    // Draw the particles to the screen
    for (let ix of range(GRID_SIZE)) {
        for (let iy of range(GRID_SIZE)) {
            if (tempMap.has(loc(ix, iy))) {
                let [x, y] = [100 + ix * h, 100 + iy * h]
                let [temp, material] = tempMap.get(loc(ix, iy))
                fill(temp * 30, temp * 0.3 * 30, temp * 0.1 * 30 + (1 - material) * 100)
                rect(x, y, h, h)
            }
        }
    }
};
