/**
 * Evento que se ejecuta cuando la ventana ha terminado de cargar.
 * Detiene la animación del spinner y realiza una transición suave para ocultarlo.
 * Finalmente, oculta completamente el contenedor del spinner después de la transición.
 */
window.addEventListener('load', function() {
  var spinnerContainer = document.getElementById('spinnerContainer');
  var spinnerImg = document.querySelector('.spinner-img');

  spinnerImg.classList.add('stop-spin'); // Detiene la animación
  spinnerContainer.style.opacity = '0';   // Inicia el desvanecimiento

  // Opcional: después de la transición, oculta el spinner completamente
  setTimeout(function() {
    spinnerContainer.style.display = 'none';
  }, 1000); // 1000ms = duración de la transición
});