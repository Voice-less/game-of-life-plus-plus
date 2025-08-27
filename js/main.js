document.addEventListener('DOMContentLoaded', () => {

    //==================================================
    // 1. CONSTANTS & APPLICATION STATE
    //==================================================
    
    const COLORS = {
        cellColors: {
            red: '#FF5252',
            green: '#2ecc71',
            yellow: '#f1c40f',
            blue: '#3498db',
            purple: '#9b59b6'
        },
        background: '#1a1a1a',
        grid: '#333333',
        wall: '#555'
    };

    const PRESET_PATTERNS = [
        { name: 'Clear', pattern: [[]] },
        { name: 'Random', pattern: 'random' },
        { name: 'Glider', pattern: [[0, 1, 0], [0, 0, 1], [1, 1, 1]] },
        { name: 'Pulsar', pattern: [[0,0,1,1,1,0,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],[0,0,1,1,1,0,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,0,0,0,1,1,1,0,0],[1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],[1,0,0,0,0,1,0,1,0,0,0,0,1],[0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,1,1,1,0,0,0,1,1,1,0,0]] },
        { name: 'Gosper Gun', pattern: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],[1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]] },
    ];
    
    // Application State
    let grid, rows, cols;
    let isRunning = false;
    let generation = 0;
    let simulationInterval;
    let cellSize = 10;

    let isDrawing = false;
    let brushMode = 'live';
    let selectedColor = 'red';
    
    //==================================================
    // 2. DOM ELEMENT REFERENCES
    //==================================================

    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const stepBtn = document.getElementById('step-btn');
    const clearBtn = document.getElementById('clear-btn');
    const generationValue = document.getElementById('generation-value');
    const presetSelect = document.getElementById('preset-select');
    const brushCellBtn = document.getElementById('brush-cell-btn');
    const brushWallBtn = document.getElementById('brush-wall-btn');
    const colorPalette = document.getElementById('color-palette');

    //==================================================
    // 3. CORE SIMULATION & DRAWING LOGIC
    //==================================================

    function createGrid(numRows, numCols) {
        return Array(numRows).fill(null).map(() => 
            Array(numCols).fill(null).map(() => ({
              alive: false,
              color: COLORS.cellColors.red,
              wall: false
            }))
        );
    }

    function updateGrid() {
        if (!grid) return;
        
        let newGrid = grid.map(row => row.map(cell => ({ ...cell })));
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = grid[row][col];
                if (cell.wall) continue;

                const neighbors = countNeighbors(grid, row, col);
                
                if (cell.alive) {
                    if (neighbors < 2 || neighbors > 3) {
                        newGrid[row][col].alive = false;
                    }
                } else {
                    if (neighbors === 3) {
                        const dominantColor = getDominantColor(grid, row, col);
                        newGrid[row][col].alive = true;
                        newGrid[row][col].color = dominantColor;
                    }
                }
            }
        }
        grid = newGrid;
        setGeneration(generation + 1);
    }

    function countNeighbors(currentGrid, row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = (row + i + rows) % rows; // Wraps around edges
                const newCol = (col + j + cols) % cols;
                if (currentGrid[newRow][newCol].alive) count++;
            }
        }
        return count;
    }

    function getDominantColor(currentGrid, row, col) {
        const colorCount = {};
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = (row + i + rows) % rows;
                const newCol = (col + j + cols) % cols;
                const cell = currentGrid[newRow][newCol];
                if (cell.alive) {
                    colorCount[cell.color] = (colorCount[cell.color] || 0) + 1;
                }
            }
        }
        let maxCount = 0;
        let dominantColor = COLORS.cellColors[selectedColor]; // Default to current paint color
        for (const [color, count] of Object.entries(colorCount)) {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        }
        return dominantColor;
    }
    
    function drawGrid() {
        if (!ctx || !grid) return;
        requestAnimationFrame(() => {
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const cell = grid[row][col];
                    const x = col * cellSize;
                    const y = row * cellSize;

                    if (cell.alive) {
                        ctx.fillStyle = cell.color;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    } else if (cell.wall) {
                        ctx.fillStyle = COLORS.wall;
                        ctx.fillRect(x, y, cellSize, cellSize);
                    }
                }
            }
            
            if (cellSize > 4) {
                ctx.strokeStyle = COLORS.grid;
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i <= cols; i++) {
                    ctx.moveTo(i * cellSize, 0);
                    ctx.lineTo(i * cellSize, rows * cellSize);
                }
                for (let i = 0; i <= rows; i++) {
                    ctx.moveTo(0, i * cellSize);
                    ctx.lineTo(cols * cellSize, i * cellSize);
                }
                ctx.stroke();
            }
        });
    }
    
    //==================================================
    // 4. UI UPDATE & CONTROL FUNCTIONS
    //==================================================
    
    function setGeneration(value) {
        generation = value;
        generationValue.textContent = generation;
    }

    function togglePlayPause() {
        isRunning = !isRunning;
        clearInterval(simulationInterval);
        if (isRunning) {
            playPauseBtn.textContent = '❚❚ Pause';
            playPauseBtn.classList.add('running');
            const speed = speedSlider.value;
            simulationInterval = setInterval(stepSimulation, 550 - speed);
        } else {
            playPauseBtn.textContent = '▶ Play';
            playPauseBtn.classList.remove('running');
        }
    }
    
    function stepSimulation() {
        updateGrid();
        drawGrid();
    }

    function clearGrid(fullClear = true) {
        if (isRunning) togglePlayPause();
        if (fullClear) {
            grid = createGrid(rows, cols);
        }
        setGeneration(0);
        drawGrid();
    }

    function randomFill() {
        clearGrid();
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                 if (Math.random() < 0.25) {
                    const colorNames = Object.keys(COLORS.cellColors);
                    const randomColorName = colorNames[Math.floor(Math.random() * colorNames.length)];
                    grid[row][col] = { alive: true, color: COLORS.cellColors[randomColorName], wall: false };
                }
            }
        }
        drawGrid();
    }

    function loadPreset(presetName) {
        if (isRunning) togglePlayPause();
        const preset = PRESET_PATTERNS.find(p => p.name === presetName);
        if (!preset) return;
        
        clearGrid(true); // Always fully clear before loading a preset

        if (preset.pattern === 'random') {
            randomFill();
            return;
        }

        const pattern = preset.pattern;
        if (pattern.length === 0) return; // For the "Clear" preset

        const startRow = Math.floor(rows / 2) - Math.floor(pattern.length / 2);
        const startCol = Math.floor(cols / 2) - Math.floor(pattern[0].length / 2);
        
        for (let i = 0; i < pattern.length; i++) {
            for (let j = 0; j < pattern[i].length; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < rows && col >= 0 && col < cols && pattern[i][j] === 1) {
                    grid[row][col].alive = true;
                    grid[row][col].color = COLORS.cellColors[selectedColor];
                }
            }
        }
        drawGrid();
    }

    function handleBrushModeChange(mode) {
        brushMode = mode;
        brushCellBtn.classList.toggle('active', mode === 'live');
        brushWallBtn.classList.toggle('active', mode === 'wall');
    }
    
    //==================================================
    // 5. EVENT LISTENERS
    //==================================================
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    stepBtn.addEventListener('click', stepSimulation);
    clearBtn.addEventListener('click', () => clearGrid(true));
    
    speedSlider.addEventListener('input', (e) => {
        const speed = e.target.value;
        speedValue.textContent = `${550 - speed}ms`;
        if (isRunning) {
            clearInterval(simulationInterval);
            simulationInterval = setInterval(stepSimulation, 550 - speed);
        }
    });

    presetSelect.addEventListener('change', (e) => loadPreset(e.target.value));
    brushCellBtn.addEventListener('click', () => handleBrushModeChange('live'));
    brushWallBtn.addEventListener('click', () => handleBrushModeChange('wall'));

    canvas.addEventListener('mousedown', (e) => { isDrawing = true; handleCanvasPaint(e); });
    canvas.addEventListener('mouseup', () => { isDrawing = false; });
    canvas.addEventListener('mouseleave', () => { isDrawing = false; });
    canvas.addEventListener('mousemove', (e) => { if(isDrawing) handleCanvasPaint(e); });
    
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const scaleAmount = e.deltaY > 0 ? 0.9 : 1.1;
        const newCellSize = Math.max(2, Math.min(cellSize * scaleAmount, 50));
        
        if (newCellSize.toFixed(1) !== cellSize.toFixed(1)) {
            cellSize = newCellSize;
            handleResize(); // Recalculate grid based on new cell size
        }
    });

    function handleCanvasPaint(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
            const cell = grid[row][col];
            if (brushMode === "live") {
              cell.alive = !cell.alive;
              cell.color = COLORS.cellColors[selectedColor];
              cell.wall = false;
            } else if (brushMode === "wall") {
              cell.wall = !cell.wall;
              cell.alive = false;
            }
            drawGrid();
        }
    }

    window.addEventListener('keydown', (e) => {
      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlayPause(); break;
        case 's': e.preventDefault(); stepSimulation(); break;
        case 'c': e.preventDefault(); clearGrid(true); break;
        case 'b': e.preventDefault(); handleBrushModeChange(brushMode === 'live' ? 'wall' : 'live'); break;
      }
    });

    //==================================================
    // 6. INITIALIZATION
    //==================================================

    function handleResize() {
        const oldGrid = grid ? grid.map(arr => arr.map(cell => ({ ...cell }))) : null;
        const container = document.querySelector('.canvas-container');
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const newRows = Math.floor(canvas.height / cellSize);
        const newCols = Math.floor(canvas.width / cellSize);

        const newGrid = createGrid(newRows, newCols);
        
        if (oldGrid) {
            const oldRows = oldGrid.length;
            const oldCols = oldGrid[0] ? oldGrid[0].length : 0;
            const rowOffset = Math.floor((newRows - oldRows) / 2);
            const colOffset = Math.floor((newCols - oldCols) / 2);

            for(let r = 0; r < oldRows; r++) {
                for(let c = 0; c < oldCols; c++) {
                    const newRow = rowOffset + r;
                    const newCol = colOffset + c;
                    if(newRow >= 0 && newRow < newRows && newCol >= 0 && newCol < newCols) {
                        newGrid[newRow][newCol] = oldGrid[r][c];
                    }
                }
            }
        }
        
        grid = newGrid;
        rows = newRows;
        cols = newCols;
        
        drawGrid();
    }

    function initialize() {
        // Populate dropdowns and palettes
        PRESET_PATTERNS.forEach(p => {
            const option = document.createElement('option');
            option.value = p.name;
            option.textContent = p.name;
            presetSelect.appendChild(option);
        });

        Object.entries(COLORS.cellColors).forEach(([name, color]) => {
            const swatch = document.createElement('button');
            swatch.style.backgroundColor = color;
            swatch.dataset.colorName = name;
            swatch.title = name;
            if (name === selectedColor) swatch.classList.add('active');
            swatch.addEventListener('click', () => {
                selectedColor = name;
                document.querySelectorAll('.color-palette button').forEach(b => b.classList.remove('active'));
                swatch.classList.add('active');
});
            colorPalette.appendChild(swatch);
        });
        
        window.addEventListener('resize', handleResize);
        
        handleResize();
        
        loadPreset('Random');
    }
    
    initialize();
});