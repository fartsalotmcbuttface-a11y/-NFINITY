const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const eraserPreview = document.getElementById("eraserPreview");

let drawing = false, erasing = false, fillMode = false;
let color = "#b388ff";
let brushSize = document.getElementById("brushSize").value;
let brushType = document.getElementById("brushType").value;
let lastX = 0, lastY = 0;
let shapeType = null;
let undoStack = [], redoStack = [];

// Color and size
document.getElementById("colorPicker").addEventListener("input", e => color = e.target.value);
document.getElementById("brushSize").addEventListener("input", e => brushSize = e.target.value);
document.getElementById("brushType").addEventListener("change", e => brushType = e.target.value);

// Canvas events
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);
canvas.addEventListener("mousemove", draw);

// Touch support
canvas.addEventListener("touchstart", e => startDraw(e.touches[0]));
canvas.addEventListener("touchmove", e => { draw(e.touches[0]); e.preventDefault(); });
canvas.addEventListener("touchend", stopDraw);

// Eraser preview
canvas.addEventListener("mousemove", e => {
    if (erasing) {
        eraserPreview.style.display = 'block';
        eraserPreview.style.width = brushSize + 'px';
        eraserPreview.style.height = brushSize + 'px';
        eraserPreview.style.left = e.clientX + 'px';
        eraserPreview.style.top = e.clientY + 'px';
    } else eraserPreview.style.display = 'none';
});

// Functions
function startDraw(e) {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
    saveState();
    if (fillMode) fillCanvas();
}

function stopDraw() {
    drawing = false;
    ctx.beginPath();
    eraserPreview.style.display = 'none';
    shapeType = null;
}

function draw(e) {
    if (!drawing || fillMode) return;
    ctx.lineJoin = ctx.lineCap = "round";
    ctx.lineWidth = brushSize;

    if (erasing) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.shadowBlur = (brushType=="neon")?15:(brushType=="soft")?5:0;
        ctx.shadowColor = color;
    }

    if (shapeType) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if(undoStack.length) ctx.putImageData(undoStack[undoStack.length-1],0,0);
        ctx.beginPath();
        const w = e.offsetX - lastX;
        const h = e.offsetY - lastY;
        if(shapeType=="rect") ctx.strokeRect(lastX,lastY,w,h);
        else if(shapeType=="circle") {
            ctx.beginPath();
            ctx.ellipse(lastX+w/2,lastY+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2);
            ctx.stroke();
        } else if(shapeType=="line") {
            ctx.beginPath();
            ctx.moveTo(lastX,lastY);
            ctx.lineTo(e.offsetX,e.offsetY);
            ctx.stroke();
        }
        return;
    }

    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    ctx.lineTo(e.offsetX,e.offsetY);
    ctx.stroke();
    lastX = e.offsetX;
    lastY = e.offsetY;
}

// Toolbar functions
function setBrush(){ erasing=false; fillMode=false; shapeType=null; }
function setEraser(){ erasing=true; fillMode=false; shapeType=null; }
function setShape(type){ shapeType=type; erasing=false; fillMode=false; }
function setFill(){ fillMode=true; erasing=false; shapeType=null; fillCanvas(); }
function fillCanvas(){ ctx.fillStyle=color; ctx.fillRect(0,0,canvas.width,canvas.height); saveState(); fillMode=false; }
function clearCanvas(){ saveState(); ctx.clearRect(0,0,canvas.width,canvas.height); }
function saveImage(){ const link=document.createElement("a"); link.download="drawing.png"; link.href=canvas.toDataURL(); link.click(); }
function saveState(){ undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height)); if(undoStack.length>50) undoStack.shift(); redoStack=[]; }
function undo(){ if(!undoStack.length) return; redoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height)); const img=undoStack.pop(); ctx.putImageData(img,0,0); }
function redo(){ if(!redoStack.length) return; undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height)); const img=redoStack.pop(); ctx.putImageData(img,0,0); }