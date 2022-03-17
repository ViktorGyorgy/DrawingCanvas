const myCanvas = document.getElementById('myCanvas');
const ctx = myCanvas.getContext('2d');

const cursorCanvas = document.getElementById('cursorCanvas');
const cursorctx = cursorCanvas.getContext('2d');

var options = {
    color: 'black',
    size: 2,
    tool: 'pencil'
}

const minSize = 1, maxSize = 25;
var height = 600, width = 1000;

//set height and width properties
function resizeCanvas(width, height){
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    cursorctx.canvas.width = width;
    cursorctx.canvas.height = height;
    document.getElementById('canvasHolder').style.height = height + 2 +'px';
}

resizeCanvas(width, height);

ctx.lineWidth = 4;
ctx.fillStyle='black';


cursorCanvas.addEventListener('mousemove', drawCursor);
cursorCanvas.addEventListener('mouseleave', () => cursorctx.clearRect(0, 0, width, height));
cursorCanvas.addEventListener('wheel', scaleCursor);
cursorCanvas.addEventListener('mousedown', drawStart);
cursorCanvas.addEventListener('mouseup', removeEventListener);
cursorCanvas.addEventListener('mouseout', removeEventListener);

function getX(e){
    return Math.floor(e.pageX - cursorCanvas.offsetLeft - 1);
}

function getY(e){
    return Math.floor(e.pageY - cursorCanvas.offsetLeft - 1);
}

function setColor(color){
    options.color = color;
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
}

function setTool(tool){
    options.tool = tool;
}

function drawCursor(e){
    cursorctx.clearRect(0, 0, width, height);
    cursorctx.beginPath();
    cursorctx.arc(getX(e), getY(e), options.size, 0, 2*Math.PI);
    cursorctx.stroke();
}

function scaleCursor(e){
    e.preventDefault();
    e.deltaY < 0 ? options.size++ : options.size--;
    options.size = Math.min(Math.max(options.size, minSize), maxSize);
    ctx.lineWidth = options.size * 2;
    drawCursor(e);
}

var lastImageData = ctx.getImageData(0, 0, width, height);

function drawStart(e){
    lastImageData = ctx.getImageData(0, 0, width, height)
    switch(options.tool){
        case 'pencil':
            drawPencilStart(e);
            break;
        case 'filler':
            fillStart(e);
            break;
    }
}

document.onkeyup = function undo(e){
    if(e.ctrlKey && e.which === 90){
        ctx.putImageData(lastImageData, 0, 0);
    }
}

function removeEventListener(){
    switch(options.tool){
        case 'pencil':
            cursorCanvas.removeEventListener('mousemove', drawPencilMove);
            break;
    }
}

function drawPencilStart(e){
    ctx.beginPath();
    ctx.arc(getX(e), getY(e), options.size, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(getX(e), getY(e));
    cursorCanvas.addEventListener('mousemove', drawPencilMove);
}

function drawPencilMove(e){
    ctx.lineTo(getX(e), getY(e));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(getX(e), getY(e), options.size, 0, 2*Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(getX(e), getY(e));
}

function fillStart(e){
    var stack = [[getX(e), getY(e)]];
    var startColor = getPixelrgba(getX(e), getY(e));
    if(compareArrays(startColor, convertToRgba(options.color))) return;
    while(stack.length !== 0){
        var point = stack.pop();
        //go up until we can
        while(point[1] > 0 && compareArrays(startColor, getPixelrgba(point[0], point[1] - 1))){
            point[1]--;
        }
        var shouldAddLeft = 1, shouldAddRight = 1;
        while(point[1] < height && compareArrays(startColor, getPixelrgba(point[0], point[1] + 1))){
            ctx.fillRect(point[0], point[1], 1, 1);
            //we add to the stack if needed the left pixel
            if(point[0] > 0){
                if(compareArrays(startColor, getPixelrgba(point[0] - 1, point[1]))){
                    if(shouldAddLeft){
                        //if it is the same color as the starting one
                        stack.push([point[0]-1, point[1]]);
                        shouldAddLeft = 0;
                    }
                }
                else{
                    //we get a disruptance, should add again if we get the same color
                    shouldAddLeft = 1;
                }
            }
            //we add the right side
            if(point[0] < width){
                if(compareArrays(startColor, getPixelrgba(point[0] + 1, point[1]))){
                    if(shouldAddRight){
                        //if it is the same color as the starting one
                        stack.push([point[0]+1, point[1]]);
                        shouldAddRight = 0;
                    }
                }
                else{
                        //we get a disruptance, should add again if we get the same color
                        shouldAddRight = 1;
                }
            }
            point[1]++;
        }
    }
}

function getPixelrgba(x, y){
    return ctx.getImageData(x, y, 1, 1).data
}

function saveCanvas(){
    var download = document.getElementById("download");
    var image = myCanvas.toDataURL("image/png")
                .replace("image/png", "image/octet-stream");
    download.setAttribute("href", image);
}

function smoothCanvas(){
    var id = ctx.getImageData(0, 0, width, height);
    for(let i = 0; i < 4 * width * height; i++){
        id.data[i] = id.data[i];
    }
    ctx.putImageData(id, 0, 0);
}

function convertToRgba(color){
    //creating fictional element, with backgroundColor color and getting rgb/rgba value, then deleting it
    var node = document.createElement("fict");
    document.getElementsByTagName('body')[0].appendChild(node);
    node.style.backgroundColor = color;
    var yes = window.getComputedStyle(node).backgroundColor;
    document.getElementsByTagName('body')[0].removeChild(node);
    var colorArray = yes.match(/[0-9]+/g);

    //setting to 255, like in canvasData
    if(colorArray[3] !== '0') colorArray[3] = 255;

    //converting string to number
    for(let i = 0; i < 4; i++)
        colorArray[i] *= 1;
    return colorArray;
}

function compareArrays(arr1, arr2){
    for(let i = 0; i < arr1.length; i++){
        if(arr1[i] !== arr2[i]) return false;
    }
    return true;
}
