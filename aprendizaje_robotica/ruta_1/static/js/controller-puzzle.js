document.addEventListener('DOMContentLoaded', () => {
    const draggableImages = document.querySelectorAll('.draggable-image');
    const dropZones = document.querySelectorAll('.drop-zone');
    const checkButton = document.getElementById('check-button');
    const messageDisplay = document.getElementById('message');

    let draggedImage = null; // Stores the image currently being dragged

    // --- Drag Start Event ---
    draggableImages.forEach(image => {
        image.addEventListener('dragstart', (e) => {
            draggedImage = e.target;
            // Store the data-id of the dragged image
            e.dataTransfer.setData('text/plain', draggedImage.dataset.id);
            draggedImage.classList.add('dragging');
            // Optionally, hide the default drag image for a cleaner feel
            e.dataTransfer.setDragImage(new Image(), 0, 0);
        });

        // Add dragend to clean up the 'dragging' class
        image.addEventListener('dragend', () => {
            if (draggedImage) {
                draggedImage.classList.remove('dragging');
                draggedImage = null;
            }
        });
    });

    // --- Drop Zone Events ---
    dropZones.forEach(zone => {
    // Prevent default to allow dropping
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over'); // Visual feedback
    });

    // Remove highlight when drag leaves the zone
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    // Handle the drop
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over'); // Remove highlight

        if (draggedImage) {
            // Get the ID of the dragged image
            const draggedId = e.dataTransfer.getData('text/plain');

            // Check if the drop zone already contains an image
            if (zone.children.length > 0) {
                // If it does, move the existing image back to the image list
                const existingImage = zone.querySelector('img');
                if (existingImage) {
                    existingImage.classList.remove('dropped'); // Remove dropped class
                    existingImage.style.display = 'block'; // Make it visible again
                    // Find the original spot for this image in the left column
                    const originalImages = Array.from(document.querySelectorAll('.draggable-image'));
                    const originalImage = originalImages.find(img => img.dataset.id === existingImage.dataset.id);
                    if(originalImage) {
                        // Replace its placeholder (if any) or just append
                        // For simplicity, we just append it back to the list
                        // A more robust solution would re-insert it at its original index.
                        // imageList.appendChild(existingImage);
                    } else {
                        // If somehow it wasn't an original image, just append to list
                        // imageList.appendChild(existingImage);
                    }
                }
            }

            // Append the dragged image to the drop zone
            zone.appendChild(draggedImage);
            draggedImage.classList.add('dropped'); // Add a class to indicate it's placed
            draggedImage.style.display = 'block'; // Ensure visibility if it was hidden
        }
    });
    });

    // --- Check Puzzle Button ---
    checkButton.addEventListener('click', () => {
        let allCorrect = true;
        messageDisplay.textContent = ''; // Clear previous messages

        dropZones.forEach(zone => {
            const placedImage = zone.querySelector('img'); // Get image inside the zone
            const zoneId = zone.dataset.id; // Get the ID this zone expects

            // Remove previous correctness indicators
            zone.classList.remove('correct', 'incorrect');
            if (placedImage) {
                placedImage.classList.remove('correct', 'incorrect');
            }

            if (!placedImage) {
                // console.log(`Zona ${zoneId} está vacía`);
                allCorrect = false;
            } else if (placedImage.dataset.id !== zoneId) {
                // console.log(`Zona ${zoneId} tiene imagen ${placedImage.dataset.id}`);
                allCorrect = false;
            }

            if (placedImage && placedImage.dataset.id === zoneId) {
                // Correct match
                zone.classList.add('correct');
                placedImage.classList.add('correct');
            } else {
                // Incorrect or empty
                zone.classList.add('incorrect');
                if (placedImage) {
                    placedImage.classList.add('incorrect');
                }
                allCorrect = false;
            }
        });

        if (allCorrect) {
        messageDisplay.textContent = '¡Felicidades! ¡Has completado la imagen correctamente!';
        messageDisplay.style.color = '#28a745';
        // Mostrar la sección siguiente
        document.getElementById('next-section').style.display = 'block';
        } else {
        messageDisplay.textContent = '¡Sigue intentándolo! Algunas piezas no están en su lugar.';
        messageDisplay.style.color = '#dc3545';
        // Ocultar la sección siguiente.
        document.getElementById('next-section').style.display = 'none';
        }
    });

    // Soporte táctil para móviles
    let touchImage = null;
    let touchStartX = 0;
    let touchStartY = 0;

    draggableImages.forEach(image => {
        image.addEventListener('touchstart', function(e) {
            touchImage = e.target;
            touchImage.classList.add('dragging');
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        // Evita el scroll mientras arrastras la imagen
        image.addEventListener('touchmove', function(e) {
            if (touchImage) {
                e.preventDefault(); // Esto bloquea el scroll de la página
            }
        }, { passive: false });

        image.addEventListener('touchend', function(e) {
            if (!touchImage) return;
            touchImage.classList.remove('dragging');
            const touch = e.changedTouches[0];
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            if (dropTarget && dropTarget.classList.contains('drop-zone')) {
                dropTarget.appendChild(touchImage);
                touchImage.classList.add('dropped');
                touchImage.style.display = 'block';
            }
            touchImage = null;
        });
    });
});
