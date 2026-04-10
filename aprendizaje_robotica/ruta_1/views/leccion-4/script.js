document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const blocksPanel = document.getElementById('blocks-panel');
    const blocksContent = document.getElementById('blocks-content');
    const scriptsArea = document.getElementById('scripts-area');
    const sprite = document.getElementById('sprite');
    const food = document.getElementById('food');
    const runBtn = document.getElementById('run-btn');
    const suggestionsBtn = document.getElementById('suggestions-btn');
    const output = document.getElementById('output');
    
    // Variables de estado
    let draggedBlock = null;
    let currentRepeatBlock = null;
    let foodEaten = false;
    let isExecuting = false;
    const stepSize = 30;
    
    // Posiciones iniciales (porcentajes para responsividad)
    const initialPositions = {
        sprite: { x: 25, y: 50 }, // Porcentajes
        food: { x: 75, y: 33 }    // Porcentajes
    };

    // Configurar posiciones iniciales
    function resetPositions() {
        setPosition(sprite, initialPositions.sprite.x, initialPositions.sprite.y);
        setPosition(food, initialPositions.food.x, initialPositions.food.y);
        food.style.display = 'block';
        // sprite.textContent = '🤖';
        sprite.src = "../../static/img/favicon.png";
    }

    // Establecer posición en porcentajes
    function setPosition(element, xPercent, yPercent) {
        const stage = document.getElementById('stage');
        const x = (stage.offsetWidth * xPercent) / 100;
        const y = (stage.offsetHeight * yPercent) / 100;
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }

    // Configurar eventos de arrastre para los bloques
    const blocks = document.querySelectorAll('.block, .block-start');
    blocks.forEach(block => {
        block.addEventListener('dragstart', dragStart);
        block.addEventListener('dragend', dragEnd);

        // Eventos táctiles para móviles
        block.addEventListener('touchstart', handleTouchStart, { passive: false });
        block.addEventListener('touchmove', handleTouchMove, { passive: false });
        block.addEventListener('touchend', handleTouchEnd);
    });
    
    // Variables para manejo táctil
    let touchStartX = 0;
    let touchStartY = 0;
    let touchElement = null;

    function handleTouchStart(e) {
        if (isExecuting) {
            e.preventDefault();
            return;
        }
        touchElement = this;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        dragStart.call(this, e.touches[0]);
    }

    function handleTouchMove(e) {
        if (!touchElement || isExecuting) {
            e.preventDefault();
            return;
        }

        // Calcular distancia del movimiento
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        // Mover el elemento clonado para el arrastre
        if (draggedBlock && draggedBlock.clone) {
            draggedBlock.clone.style.transform = `translate(${dx}px, ${dy}px)`;
        }

        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!touchElement || isExecuting) return;

        // Encontrar el área de scripts bajo el dedo
        const touch = e.changedTouches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);

        if (elementUnderTouch && elementUnderTouch.closest('#scripts-area')) {
            drop.call(scriptsArea, {
                preventDefault: () => {},
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }

        // Limpiar el elemento clonado
        if (draggedBlock && draggedBlock.clone) {
            draggedBlock.clone.remove();
        }

        touchElement = null;
        dragEnd.call(this);
    }

    // Configurar zonas de soltar
    scriptsArea.addEventListener('dragover', dragOver);
    scriptsArea.addEventListener('dragenter', dragEnter);
    scriptsArea.addEventListener('dragleave', dragLeave);
    scriptsArea.addEventListener('drop', drop);

    // Configurar botones
    runBtn.addEventListener('click', executeScripts);
    suggestionsBtn.addEventListener('click', showSuggestions);

    // Funciones de arrastre y soltar
    function dragStart(e) {
        if (isExecuting) return;
        draggedBlock = this;
        this.classList.add('dragging');

        // Para móviles, crear un elemento clonado que siga el dedo
        if (e instanceof Touch) {
            const clone = this.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = `${touchStartX}px`;
            clone.style.top = `${touchStartY}px`;
            clone.style.width = `${this.offsetWidth}px`;
            clone.style.zIndex = '1000';
            clone.style.pointerEvents = 'none';
            clone.style.transform = 'translate(0, 0)';
            document.body.appendChild(clone);
            draggedBlock.clone = clone;
        } else {
            e.dataTransfer.setData('text/plain', this.outerHTML);
            e.dataTransfer.effectAllowed = 'copy';
        }
    }

    function dragEnd() {
        this.classList.remove('dragging');
        if (draggedBlock && draggedBlock.clone) {
            draggedBlock.clone.remove();
            draggedBlock.clone = null;
        }
        draggedBlock = null;
    }

    function dragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
    }

    function dragEnter(e) {
        e.preventDefault();
        this.classList.add('drop-zone');
    }

    function dragLeave() {
        this.classList.remove('drop-zone');
    }

    function drop(e) {
        if (isExecuting) return;
        e.preventDefault();
        this.classList.remove('drop-zone');

        const blockType = draggedBlock.getAttribute('data-action');
        const newBlock = createBlockElement(draggedBlock);

        if (blockType === 'repeat') {
            const repeatContent = document.createElement('div');
            repeatContent.className = 'repeat-content';
            
            newBlock.innerHTML = `
                <div class="repeat-header">REPETIR ${draggedBlock.getAttribute('data-times')} VECES</div>
            `;
            newBlock.appendChild(repeatContent);
            currentRepeatBlock = repeatContent;
        }

        if (currentRepeatBlock && blockType !== 'repeat') {
            currentRepeatBlock.appendChild(newBlock);
        } else {
            scriptsArea.appendChild(newBlock);
            currentRepeatBlock = null;
        }
    }

    // Crear elemento de bloque para el área de scripts
    function createBlockElement(block) {
        const newBlock = document.createElement('div');
        newBlock.className = 'script-block';

        const action = block.getAttribute('data-action');
        if (action === 'start') {
            newBlock.classList.add('script-block-start');
        } else if (action === 'repeat') {
            newBlock.classList.add('repeat-block');
        } else if (action === 'eat') {
            newBlock.classList.add('script-block-action');
        } else if (action === 'move') {
            newBlock.classList.add('script-block-move');
        }

        newBlock.setAttribute('data-action', action);
        newBlock.setAttribute('data-direction', block.getAttribute('data-direction'));
        newBlock.setAttribute('data-times', block.getAttribute('data-times'));
        
        const blockContent = block.cloneNode(true);
        blockContent.classList.remove('block', 'block-start', 'dragging');
        newBlock.appendChild(blockContent);

        return newBlock;
    }
    
    // Ejecutar los scripts
    async function executeScripts() {
        console.log('executeScripts');
        sprite.src = "../../static/img/favicon.png";
        if (isExecuting) return;
        
        isExecuting = true;
        runBtn.disabled = true;
        resetPositions();
        foodEaten = false;
        output.innerHTML = '<div class="mission" style="font-size: 14px; color: #FFFFFF;">✅ Ejecutando programa...</div>';
        
        const startBlocks = document.querySelectorAll('.script-block-start');
        
        if (startBlocks.length === 0) {
            output.innerHTML = '<div style="font-size: 14px; color: #FFFFFF;">⚠️ ¡Necesitas el bloque "INICIAR" para comenzar!</div>';
            isExecuting = false;
            runBtn.disabled = false;
            return;
        }

        // Ejecutar cada bloque "start" secuencialmente
        for (const startBlock of startBlocks) {
            if (foodEaten) break;
            await processBlock(startBlock.nextElementSibling);
        }

        if (!foodEaten) {
            output.innerHTML += '<div style="font-size: 14px; color: #FFFFFF;">❌ Programa terminado. ¡Cendibot no alcanzó la Batería 🔋!</div>';
        }

        isExecuting = false;
        runBtn.disabled = false;
    }

    // Procesar cada bloque recursivamente
    async function processBlock(block) {
        if (!block || foodEaten) return;
        
        const action = block.getAttribute('data-action');
        const direction = block.getAttribute('data-direction');
        const times = block.getAttribute('data-times');
        
        switch(action) {
            case 'move':
                await moveSprite(direction);
                break;
            case 'eat':
                await checkEat();
                break;
            case 'repeat':
                const repeatContent = block.querySelector('.repeat-content');
                const repeatTimes = parseInt(times) || 4;
                
                for (let i = 0; i < repeatTimes && !foodEaten; i++) {
                    output.innerHTML += `<div>Repetición ${i + 1} de ${repeatTimes}</div>`;
                    let child = repeatContent.firstElementChild;
                    
                    while (child && !foodEaten) {
                        await processBlock(child);
                        child = child.nextElementSibling;
                    }
                    
                    await sleep(300);
                }
                break;
        }

        if (action !== 'repeat' && !foodEaten) {
            await processBlock(block.nextElementSibling);
        }
    }

    // Funciones de acciones del sprite
    async function moveSprite(direction) {
        const stage = document.getElementById('stage');
        const currentLeft = parseInt(sprite.style.left) || (stage.offsetWidth * initialPositions.sprite.x / 100);
        const currentTop = parseInt(sprite.style.top) || (stage.offsetHeight * initialPositions.sprite.y / 100);
        let newLeft = currentLeft;
        let newTop = currentTop;
        
        switch(direction) {
            case 'up':
                newTop = Math.max(20, currentTop - stepSize);
                break;
            case 'down':
                newTop = Math.min(stage.offsetHeight - 20, currentTop + stepSize);
                break;
            case 'left':
                newLeft = Math.max(20, currentLeft - stepSize);
                break;
            case 'right':
                newLeft = Math.min(stage.offsetWidth - 20, currentLeft + stepSize);
                break;
        }

        sprite.style.left = newLeft + 'px';
        sprite.style.top = newTop + 'px';

        await checkProximity();
        await sleep(300);
    }

    // Verificar si el gato está cerca del churrasco
    async function checkProximity() {
        const spriteRect = sprite.getBoundingClientRect();
        const foodRect = food.getBoundingClientRect();

        const distance = Math.sqrt(
            Math.pow(spriteRect.left - foodRect.left, 2) + 
            Math.pow(spriteRect.top - foodRect.top, 2)
        );

        if (distance < 60) {
            output.innerHTML += '<div style="font-size: 14px; color: #FFFFFF;">¡Cendibot está cerca de la Batería! 🔋</div>';
        }
    }

    // Función para "comer" el churrasco
    async function checkEat() {
        const spriteRect = sprite.getBoundingClientRect();
        const foodRect = food.getBoundingClientRect();

        const distance = Math.sqrt(
            Math.pow(spriteRect.left - foodRect.left, 2) + 
            Math.pow(spriteRect.top - foodRect.top, 2)
        );

        if (distance < 50) {
            food.style.display = 'none';
            foodEaten = true;
            //sprite.textContent = '🎉';
            sprite.src = "../../static/img/Leccion-4/check.png";
            output.innerHTML += '<div style="font-size: 14px; color: #FFFFFF;">¡Lo lograste 🎉! Cendibot encontró y tomó la batería 🔋 ¡Ahora está lleno de energía! ⚡</div>';
            document.getElementById('flecha_derecha').style.display = 'inline';
            await sleep(1000);
        } else {
            output.innerHTML += '<div style="font-size: 14px; color: #FFFFFF;">La batería 🔋 está muy lejos. ¡Sigue intentando!</div>';
        }
    }

    // Mostrar sugerencias
    function showSuggestions() {
        output.innerHTML = `
            <div style="font-size: 14px; color: #FFFFFF;">
                <div><strong>💡 INSTRUCCIONES:</strong></div>
                <div>1. Se necesita un bloque "INICIAR" para comenzar.</div>
                <div>2. Usa los bloques "MOVER" para acercar a Cendibot a la Batería 🔋.</div>
                <div>3. El bloque "🖐🏾 TOMAR" solo funciona cuando Cendibot está cerca de la Batería🔋.</div>
                <div>4. Cuando hayas colocado los bloques de tu programa pulsa "EJECUTAR" para que tu programa comience.</div>
                <div>5. Pulsa "REINICIAR" para comenzar todo de nuevo.</div>
                <div>6. ¡Observa los mensajes para ver tu progreso!.</div>
            <div>
        `;
    }
    
    // Función auxiliar para pausar la ejecución
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Inicialización
    resetPositions();

    // Redimensionar al cambiar tamaño de ventana
    window.addEventListener('resize', function() {
        if (!isExecuting) {
            resetPositions();
        }
    });
});